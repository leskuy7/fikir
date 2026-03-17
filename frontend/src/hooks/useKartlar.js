import { useState, useCallback, useRef } from 'react';
import { mesajGonder } from '../services/api.js';
import { kartArandiBildir, kartTiklandiBildir } from '../services/analytics.js';
import { konusmaKaydet, detayKaydet, detayGetir, detayCacheId } from '../services/firestore.js';

function hataMesajiniGetir(kod, fallback, detay = null) {
  const upstreamStatus = detay?.body?.upstreamStatus;
  const model = detay?.body?.model;

  if (kod === 'LIMIT_DOLDU') return 'Gunluk limitin doldu. Yarin tekrar gel veya uye ol.';
  if (kod === 'GIRIS_GEREKLI') return 'Oturumun sona ermis. Lutfen yeniden giris yap.';
  if (kod === 'YETKI_REDDEDILDI') return 'Bu islem icin yetkin bulunmuyor.';
  if (kod === 'AI_SERVISI_HATASI' || kod === 'SERVIS_GECICI_HATA') {
    if (upstreamStatus === 429) return 'AI kotasi gecici olarak dolu. Birazdan tekrar dene.';
    if (upstreamStatus === 403) return 'AI erisim izni reddedildi. API anahtari/proje yetkisini kontrol et.';
    if (upstreamStatus === 404) return `Model bulunamadi (${model || 'bilinmiyor'}).`;
    return 'Servis gecici olarak yanit veremiyor. Birazdan tekrar dene.';
  }
  if (kod === 'AI_FORMAT_HATASI') {
    return 'AI yaniti beklenen kart formatinda degil. Tekrar dene.';
  }
  if (kod === 'AI_PARSE_HATASI') {
    return 'AI yaniti islenemedi. Birazdan tekrar dene.';
  }
  if (kod === 'LIMIT_SERVISI_KULLANILAMIYOR') {
    return 'Limit servisi gecici olarak kullanilamiyor. Lutfen daha sonra dene.';
  }
  if (kod === 'BULUNAMADI') return 'Istenen kaynak bulunamadi.';
  if (kod === 'BEKLENMEYEN_HATA') return 'Beklenmeyen bir hata olustu. Sayfayi yenile.';
  return fallback;
}

function jsonCikar(metin) {
  if (typeof metin !== 'string') return null;
  const temiz = metin
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const adaylar = [temiz];
  const basla = temiz.indexOf('[');
  const bitis = temiz.lastIndexOf(']') + 1;
  if (basla !== -1 && bitis > basla) {
    adaylar.push(temiz.slice(basla, bitis));
  }

  for (const aday of adaylar) {
    try {
      const parsed = JSON.parse(aday);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.kartlar)) return parsed.kartlar;
    } catch {
      // Sonraki adayi dene
    }
  }

  // JSON dizi kesik geldiyse (truncate), tamamlanmis objectleri kurtar.
  const parcali = kesikJsondanKartlariTopla(temiz);
  if (Array.isArray(parcali) && parcali.length > 0) {
    return parcali;
  }

  return null;
}

function kesikJsondanKartlariTopla(metin) {
  const basla = metin.indexOf('[');
  if (basla === -1) return null;

  const kartlar = [];
  let depth = 0;
  let objeBaslangic = -1;
  let inString = false;
  let escape = false;

  for (let i = basla; i < metin.length; i += 1) {
    const ch = metin[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      depth += 1;
      if (depth === 1) objeBaslangic = i;
      continue;
    }

    if (ch === '}') {
      if (depth > 0) depth -= 1;
      if (depth === 0 && objeBaslangic !== -1) {
        const parca = metin.slice(objeBaslangic, i + 1);
        try {
          const parsed = JSON.parse(parca);
          if (parsed?.baslik && parsed?.kanca) {
            kartlar.push(parsed);
          }
        } catch {
          // Bu parcayi atla, taramaya devam et.
        }
        objeBaslangic = -1;
      }
    }
  }

  return kartlar.length > 0 ? kartlar : null;
}

// 1 istekle tum kartlari alir ve direkt gosterir.
async function kartlariGetirVeGoster({ konuMetni, mod, kullaniciId, setKartlar }) {
  const { yanit, limit } = await mesajGonder({
    mesajlar: [{ role: 'user', content: konuMetni }],
    mod,
    kullaniciId,
  });

  const kartlar = jsonCikar(yanit);
  if (!Array.isArray(kartlar) || kartlar.length === 0) {
    return { kartlar: [], limit };
  }

  setKartlar(kartlar);
  return { kartlar, limit };
}

export function useKartlar(
  mod,
  kullaniciId = null,
  { onBasari, onLimitDoldu, onLimitGuncelle, onLimitKontrol } = {}
) {
  const [konu, setKonu] = useState('');
  const [kartlar, setKartlar] = useState([]);
  const [acikKart, setAcikKart] = useState(null);
  const [detayIcerik, setDetayIcerik] = useState(null);
  const [ilgiliKartlar, setIlgiliKartlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);
  const [konuKilidiYukleniyor, setKonuKilidiYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);
  const [konuKilidiCevap, setKonuKilidiCevap] = useState(null);
  const [kartGecmisi, setKartGecmisi] = useState([]);
  const [sonCacheId, setSonCacheId] = useState(null);

  // Refs: mevcut state'i yakalamak için (detayAc'ta history push)
  const acikKartRef = useRef(null);
  const detayIcerikRef = useRef(null);
  const ilgiliKartlarRef = useRef([]);
  const konuKilidiCevapRef = useRef(null);
  // In-memory detay cache
  const detayCacheRef = useRef(new Map());

  const kartlariGetir = useCallback(
    async (yeniKonu) => {
      if (!yeniKonu?.trim()) return;
      if (onLimitKontrol?.()) {
        setHata('Günlük limitin doldu.');
        return;
      }
      setHata(null);
      setYukleniyor(true);
      setKonu(yeniKonu.trim());
      setKartlar([]);
      setAcikKart(null);
      setDetayIcerik(null);
      setIlgiliKartlar([]);
      setKonuKilidiCevap(null);
      setKartGecmisi([]);

      kartArandiBildir(mod, yeniKonu.trim());

      try {
        const konuMetni = yeniKonu.trim();

        if (mod === 'bilgi' || mod === 'fikir') {
          const sonuc = await kartlariGetirVeGoster({
            konuMetni,
            mod,
            kullaniciId,
            setKartlar,
          });
          const biriken = sonuc?.kartlar || [];
          onLimitGuncelle?.(sonuc?.limit || null);

          if (biriken.length > 0) {
            if (!sonuc?.limit) onBasari?.();
            if (kullaniciId) {
              konusmaKaydet(kullaniciId, mod, biriken, konuMetni).catch(() => {});
            }
          } else {
            setHata('Kartlar alınamadı. Tekrar dene.');
          }
        } else {
          const { yanit, limit } = await mesajGonder({
            mesajlar: [{ role: 'user', content: konuMetni }],
            mod,
            kullaniciId,
          });
          onLimitGuncelle?.(limit);
          const parsed = jsonCikar(yanit);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setKartlar(parsed);
            if (!limit) onBasari?.();
            if (kullaniciId) {
              konusmaKaydet(kullaniciId, mod, parsed, konuMetni).catch(() => {});
            }
          } else {
            setHata('Kartlar alınamadı. Tekrar dene.');
          }
        }
      } catch (err) {
        if (err?.body?.upstreamStatus) {
          console.error('AI upstream hatasi:', {
            kod: err?.kod,
            status: err?.status,
            upstreamStatus: err?.body?.upstreamStatus,
            model: err?.body?.model,
            body: err?.body,
          });
        }
        onLimitGuncelle?.(err?.limit || null);
        if (err.message === 'LIMIT_DOLDU') {
          onLimitDoldu?.();
          setHata(hataMesajiniGetir(err.message, 'Gunluk limitin doldu.', err));
        } else {
          setHata(hataMesajiniGetir(err.message, 'Bir seyler ters gitti. Tekrar dene.', err));
        }
      } finally {
        setYukleniyor(false);
      }
    },
    [mod, kullaniciId, onBasari, onLimitDoldu, onLimitGuncelle]
  );

  const detayAc = useCallback(
    async (kart) => {
      // Mevcut açık kart varsa → geçmişe ekle
      if (acikKartRef.current) {
        setKartGecmisi((onceki) => [
          ...onceki,
          {
            kart: acikKartRef.current,
            detayIcerik: detayIcerikRef.current,
            ilgiliKartlar: ilgiliKartlarRef.current,
            konuKilidiCevap: konuKilidiCevapRef.current,
          },
        ]);
      }

      setAcikKart(kart);
      acikKartRef.current = kart;
      setDetayIcerik(null);
      detayIcerikRef.current = null;
      setIlgiliKartlar([]);
      ilgiliKartlarRef.current = [];
      setKonuKilidiCevap(null);
      konuKilidiCevapRef.current = null;
      setSonCacheId(null);
      setDetayYukleniyor(true);
      setHata(null);
      kartTiklandiBildir(mod, kart.baslik);

      // 1) In-memory cache kontrol
      const cacheKey = `${kart.baslik}||${kart.kanca || ''}`;
      const memCache = detayCacheRef.current.get(cacheKey);
      if (memCache) {
        setDetayIcerik(memCache.detayIcerik);
        detayIcerikRef.current = memCache.detayIcerik;
        setIlgiliKartlar(memCache.ilgiliKartlar || []);
        ilgiliKartlarRef.current = memCache.ilgiliKartlar || [];
        setSonCacheId(detayCacheId(kart.baslik, kart.kanca));
        setDetayYukleniyor(false);
        return;
      }

      // 2) Firestore cache kontrol
      try {
        const firestoreCache = await detayGetir(kart.baslik, kart.kanca);
        if (firestoreCache?.detayIcerik) {
          setDetayIcerik(firestoreCache.detayIcerik);
          detayIcerikRef.current = firestoreCache.detayIcerik;
          const ilgili = firestoreCache.ilgiliKartlar || [];
          setIlgiliKartlar(ilgili);
          ilgiliKartlarRef.current = ilgili;
          setSonCacheId(detayCacheId(kart.baslik, kart.kanca));
          // Memory cache'e de ekle
          detayCacheRef.current.set(cacheKey, {
            detayIcerik: firestoreCache.detayIcerik,
            ilgiliKartlar: ilgili,
          });
          setDetayYukleniyor(false);
          return;
        }
      } catch {
        // Cache hatası önemsiz, API'ye devam
      }

      // 3) API çağrısı
      try {
        const detayMesaj = `${kart.baslik}\n\n${kart.kanca || ''}`;
        const sonuclar = await Promise.allSettled([
          mesajGonder({
            mesajlar: [{ role: 'user', content: detayMesaj }],
            mod: 'detay',
            kullaniciId,
          }),
          mesajGonder({
            mesajlar: [{ role: 'user', content: detayMesaj }],
            mod: 'ilgili',
            kullaniciId,
          }),
        ]);

        let basariliSayi = 0;
        let limitHatasi = false;
        let yeniDetay = null;
        let yeniIlgili = [];

        if (sonuclar[0].status === 'fulfilled') {
          yeniDetay = sonuclar[0].value.yanit;
          setDetayIcerik(yeniDetay);
          detayIcerikRef.current = yeniDetay;
          onLimitGuncelle?.(sonuclar[0].value.limit);
          basariliSayi++;
        } else {
          onLimitGuncelle?.(sonuclar[0].reason?.limit || null);
          if (sonuclar[0].reason?.message === 'LIMIT_DOLDU') {
            limitHatasi = true;
          }
        }

        if (sonuclar[1].status === 'fulfilled') {
          onLimitGuncelle?.(sonuclar[1].value.limit);
          const ilgiliParsed = jsonCikar(sonuclar[1].value.yanit);
          if (Array.isArray(ilgiliParsed) && ilgiliParsed.length > 0) {
            yeniIlgili = ilgiliParsed;
            setIlgiliKartlar(yeniIlgili);
            ilgiliKartlarRef.current = yeniIlgili;
          }
          basariliSayi++;
        } else {
          onLimitGuncelle?.(sonuclar[1].reason?.limit || null);
          if (sonuclar[1].reason?.message === 'LIMIT_DOLDU') {
            limitHatasi = true;
          }
        }

        // Cache'e kaydet
        if (yeniDetay) {
          detayCacheRef.current.set(cacheKey, {
            detayIcerik: yeniDetay,
            ilgiliKartlar: yeniIlgili,
          });
          detayKaydet(kart.baslik, kart.kanca, yeniDetay, yeniIlgili)
            .then((id) => { if (id) setSonCacheId(id); })
            .catch(() => {});
        }
        const hepsiLimitli = sonuclar.every((s) =>
          s.status === 'fulfilled' ? s.value.limit : true
        );
        if (basariliSayi > 0 && !hepsiLimitli) onBasari?.(basariliSayi);
        if (limitHatasi) {
          onLimitDoldu?.();
          if (basariliSayi === 0) setHata(hataMesajiniGetir('LIMIT_DOLDU', 'Gunluk limitin doldu.'));
        } else if (basariliSayi === 0) {
          setHata(hataMesajiniGetir(null, 'Detay yuklenemedi. Tekrar dene.'));
        }
      } catch (err) {
        onLimitGuncelle?.(err?.limit || null);
        if (err.message === 'LIMIT_DOLDU') onLimitDoldu?.();
        setHata(hataMesajiniGetir(err.message, 'Detay yuklenemedi. Tekrar dene.'));
      } finally {
        setDetayYukleniyor(false);
      }
    },
    [mod, kullaniciId, onBasari, onLimitDoldu, onLimitGuncelle]
  );

  // ESC / backdrop: geçmiş varsa geri git, yoksa kapat
  const detayKapat = useCallback(() => {
    setKartGecmisi((onceki) => {
      if (onceki.length === 0) {
        setAcikKart(null);
        acikKartRef.current = null;
        setDetayIcerik(null);
        detayIcerikRef.current = null;
        setIlgiliKartlar([]);
        ilgiliKartlarRef.current = [];
        setKonuKilidiCevap(null);
        konuKilidiCevapRef.current = null;
        setSonCacheId(null);
        return [];
      }
      const yeniGecmis = [...onceki];
      const geri = yeniGecmis.pop();
      setAcikKart(geri.kart);
      acikKartRef.current = geri.kart;
      setDetayIcerik(geri.detayIcerik);
      detayIcerikRef.current = geri.detayIcerik;
      setIlgiliKartlar(geri.ilgiliKartlar || []);
      ilgiliKartlarRef.current = geri.ilgiliKartlar || [];
      setKonuKilidiCevap(geri.konuKilidiCevap || null);
      konuKilidiCevapRef.current = geri.konuKilidiCevap || null;
      setSonCacheId(geri.kart ? detayCacheId(geri.kart.baslik, geri.kart.kanca) : null);
      return yeniGecmis;
    });
  }, []);

  // X butonu: tümünü kapat
  const detayTumunuKapat = useCallback(() => {
    setAcikKart(null);
    acikKartRef.current = null;
    setDetayIcerik(null);
    detayIcerikRef.current = null;
    setIlgiliKartlar([]);
    ilgiliKartlarRef.current = [];
    setKonuKilidiCevap(null);
    konuKilidiCevapRef.current = null;
    setKartGecmisi([]);
    setSonCacheId(null);
  }, []);

  // Breadcrumb: belirli bir adıma git
  const gecmiseGit = useCallback((index) => {
    setKartGecmisi((onceki) => {
      if (index < 0 || index >= onceki.length) return onceki;
      const hedef = onceki[index];
      setAcikKart(hedef.kart);
      acikKartRef.current = hedef.kart;
      setDetayIcerik(hedef.detayIcerik);
      detayIcerikRef.current = hedef.detayIcerik;
      setIlgiliKartlar(hedef.ilgiliKartlar || []);
      ilgiliKartlarRef.current = hedef.ilgiliKartlar || [];
      setKonuKilidiCevap(hedef.konuKilidiCevap || null);
      konuKilidiCevapRef.current = hedef.konuKilidiCevap || null;
      setSonCacheId(hedef.kart ? detayCacheId(hedef.kart.baslik, hedef.kart.kanca) : null);
      return onceki.slice(0, index);
    });
  }, []);

  const konuKilidiSoru = useCallback(
    async (soru, kartBaslik, kartKanca) => {
      if (!soru?.trim() || !acikKart) return;
      setKonuKilidiYukleniyor(true);
      setHata(null);

      try {
        const { yanit, limit } = await mesajGonder({
          mesajlar: [
            {
              role: 'user',
              content: `Kart: ${kartBaslik}. ${kartKanca || ''}\n\nKullanıcı sorusu: ${soru.trim()}`,
            },
          ],
          mod: 'konu_kilidi',
          kullaniciId,
        });
        onLimitGuncelle?.(limit);
        setKonuKilidiCevap(yanit);
        konuKilidiCevapRef.current = yanit;
        if (!limit) onBasari?.();
      } catch (err) {
        onLimitGuncelle?.(err?.limit || null);
        if (err.message === 'LIMIT_DOLDU') {
          onLimitDoldu?.();
          setHata(hataMesajiniGetir('LIMIT_DOLDU', 'Gunluk limitin doldu.'));
        } else {
          setHata(hataMesajiniGetir(err.message, 'Yanit alinamadi. Tekrar dene.'));
        }
      } finally {
        setKonuKilidiYukleniyor(false);
      }
    },
    [acikKart, kullaniciId, onBasari, onLimitDoldu, onLimitGuncelle]
  );

  return {
    konu,
    kartlar,
    acikKart,
    detayIcerik,
    ilgiliKartlar,
    yukleniyor,
    detayYukleniyor,
    konuKilidiYukleniyor,
    hata,
    konuKilidiCevap,
    kartGecmisi,
    sonCacheId,
    kartlariGetir,
    detayAc,
    detayKapat,
    detayTumunuKapat,
    gecmiseGit,
    konuKilidiSoru,
  };
}
