import { useCallback, useState } from 'react';
import { mesajGonder } from '../services/api';

function hataMesajiniGetir(kod, fallback) {
  if (kod === 'BAGLANTI_HATASI') return 'Baglanti hatasi, tekrar dene.';
  if (kod === 'LIMIT_DOLDU') return 'Gunluk limitin doldu. Yarin tekrar gel.';
  if (kod === 'SERVIS_LIMITI_DOLDU') return 'AI servisi kotasi gecici olarak dolu. Birazdan tekrar dene.';
  if (kod === 'GIRIS_GEREKLI') return 'Oturumun sona ermis. Lutfen yeniden giris yap.';
  if (kod === 'YETKI_REDDEDILDI') return 'Bu islem icin yetkin bulunmuyor.';
  if (kod === 'AI_SERVISI_HATASI' || kod === 'SERVIS_GECICI_HATA') {
    return 'Servis gecici olarak yanit veremiyor. Birazdan tekrar dene.';
  }
  if (kod === 'LIMIT_SERVISI_KULLANILAMIYOR') {
    return 'Limit servisi gecici olarak kullanilamiyor.';
  }
  if (kod === 'BACKEND_URL_YOK') return 'Backend adresi tanimli degil. Ayarlari kontrol et.';
  if (kod === 'AI_FORMAT_HATASI') return 'Yanit formati hatali. Tekrar dene.';
  if (kod === 'AI_PARSE_HATASI') return 'Yanit islenemedi. Birazdan tekrar dene.';
  if (kod === 'BULUNAMADI' || kod === 'BEKLENMEYEN_HATA') return 'Bir hata olustu. Tekrar dene.';
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
      // Sonraki adayi dene.
    }
  }

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

  for (let index = basla; index < metin.length; index += 1) {
    const ch = metin[index];

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
      if (depth === 1) objeBaslangic = index;
      continue;
    }

    if (ch === '}') {
      if (depth > 0) depth -= 1;
      if (depth === 0 && objeBaslangic !== -1) {
        const parca = metin.slice(objeBaslangic, index + 1);
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

async function kartlariGetirVeGoster({
  konuMetni,
  mod,
  kullaniciId,
  setKartlar,
  onLimitGuncelle,
  onLimitDoldu,
}) {
  const { yanit, limit } = await mesajGonder({
    mesajlar: [{ role: 'user', content: konuMetni }],
    mod,
    kullaniciId,
    onLimitGuncelle,
    onLimitDoldu,
  });

  const kartlar = jsonCikar(yanit);
  if (!Array.isArray(kartlar) || kartlar.length === 0) {
    return { kartlar: [], limit };
  }

  setKartlar(kartlar);
  return { kartlar, limit };
}

export function useKartlar(mod, kullaniciId = null, { onLimitDoldu, onLimitGuncelle } = {}) {
  const [konu, setKonu] = useState('');
  const [kartlar, setKartlar] = useState([]);
  const [acikKart, setAcikKart] = useState(null);
  const [detayIcerik, setDetayIcerik] = useState(null);
  const [ilgiliKartlar, setIlgiliKartlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);
  const [limitHatasi, setLimitHatasi] = useState(false);

  const kartlariGetir = useCallback(
    async (yeniKonu) => {
      if (!yeniKonu?.trim()) return;
      setHata(null);
      setLimitHatasi(false);
      setYukleniyor(true);
      setKonu(yeniKonu.trim());
      setKartlar([]);
      setAcikKart(null);
      setDetayIcerik(null);
      setIlgiliKartlar([]);

      try {
        const konuMetni = yeniKonu.trim();

        if (mod === 'bilgi' || mod === 'fikir') {
          const sonuc = await kartlariGetirVeGoster({
            konuMetni,
            mod,
            kullaniciId,
            setKartlar,
            onLimitGuncelle,
            onLimitDoldu,
          });
          const biriken = sonuc?.kartlar || [];
          onLimitGuncelle?.(sonuc?.limit || null);

          if (biriken.length === 0) {
            setHata('Kartlar alinamadi. Tekrar dene.');
          }
        } else {
          const { yanit, limit } = await mesajGonder({
            mesajlar: [{ role: 'user', content: konuMetni }],
            mod,
            kullaniciId,
            onLimitGuncelle,
            onLimitDoldu,
          });
          onLimitGuncelle?.(limit);
          const parsed = jsonCikar(yanit);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setKartlar(parsed);
          } else {
            setHata('Kartlar alinamadi. Tekrar dene.');
          }
        }
      } catch (err) {
        onLimitGuncelle?.(err?.limit || null);
        if (err.message === 'LIMIT_DOLDU') {
          setLimitHatasi(true);
          setHata(null);
        } else {
          setHata(hataMesajiniGetir(err.message, 'Bir seyler ters gitti. Tekrar dene.'));
        }
      } finally {
        setYukleniyor(false);
      }
    },
    [mod, kullaniciId, onLimitDoldu, onLimitGuncelle]
  );

  const detayAc = useCallback(
    async (kart) => {
      setAcikKart(kart);
      setDetayIcerik(null);
      setIlgiliKartlar([]);
      setDetayYukleniyor(true);
      setHata(null);
      setLimitHatasi(false);

      try {
        const detayMesaj = `${kart.baslik}\n\n${kart.kanca || ''}`;
        const sonuclar = await Promise.allSettled([
          mesajGonder({
            mesajlar: [{ role: 'user', content: detayMesaj }],
            mod: 'detay',
            kullaniciId,
            onLimitGuncelle,
            onLimitDoldu,
          }),
          mesajGonder({
            mesajlar: [{ role: 'user', content: detayMesaj }],
            mod: 'ilgili',
            kullaniciId,
            onLimitGuncelle,
            onLimitDoldu,
          }),
        ]);

        let basariliSayi = 0;
        let limitHatasiVar = false;

        if (sonuclar[0].status === 'fulfilled') {
          setDetayIcerik(sonuclar[0].value.yanit);
          onLimitGuncelle?.(sonuclar[0].value.limit);
          basariliSayi += 1;
        } else {
          onLimitGuncelle?.(sonuclar[0].reason?.limit || null);
          if (sonuclar[0].reason?.message === 'LIMIT_DOLDU') {
            limitHatasiVar = true;
          }
        }

        if (sonuclar[1].status === 'fulfilled') {
          onLimitGuncelle?.(sonuclar[1].value.limit);
          const ilgiliParsed = jsonCikar(sonuclar[1].value.yanit);
          if (Array.isArray(ilgiliParsed) && ilgiliParsed.length > 0) {
            setIlgiliKartlar(ilgiliParsed);
          }
          basariliSayi += 1;
        } else {
          onLimitGuncelle?.(sonuclar[1].reason?.limit || null);
          if (sonuclar[1].reason?.message === 'LIMIT_DOLDU') {
            limitHatasiVar = true;
          }
        }

        if (limitHatasiVar) {
          setLimitHatasi(true);
          if (basariliSayi === 0) setHata(null);
        } else if (basariliSayi === 0) {
          setHata(hataMesajiniGetir(null, 'Detay yuklenemedi. Tekrar dene.'));
        }
      } catch (err) {
        onLimitGuncelle?.(err?.limit || null);
        if (err.message === 'LIMIT_DOLDU') {
          setLimitHatasi(true);
          setHata(null);
        } else {
          setHata(hataMesajiniGetir(err.message, 'Detay yuklenemedi. Tekrar dene.'));
        }
      } finally {
        setDetayYukleniyor(false);
      }
    },
    [kullaniciId, onLimitDoldu, onLimitGuncelle]
  );

  return {
    konu,
    kartlar,
    acikKart,
    detayIcerik,
    ilgiliKartlar,
    yukleniyor,
    detayYukleniyor,
    hata,
    limitHatasi,
    kartlariGetir,
    detayAc,
    setAcikKart,
  };
}
