import { useState, useCallback } from 'react';
import { mesajGonder } from '../services/api.js';
import { kartArandiBildir, kartTiklandiBildir } from '../services/analytics.js';
import { konusmaKaydet } from '../services/firestore.js';

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

function ilkKartCikar(metin) {
  const parsed = jsonCikar(metin);
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const kart = parsed[0];
  if (!kart?.baslik || !kart?.kanca) return null;
  return {
    baslik: String(kart.baslik).trim(),
    kanca: String(kart.kanca).trim(),
  };
}

async function kartlariAsamaliGetir({ konuMetni, tekilMod, kullaniciId, hedefAdet, setKartlar }) {
  const biriken = [];
  const gorulenBasliklar = new Set();
  let limitDoldu = false;
  const kartGecikmeMs = 170;
  const bekle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const aramOturumId = crypto.randomUUID();

  const dene = async () => {
    if (biriken.length >= hedefAdet) return null;
    try {
      const yanit = await mesajGonder({
        mesajlar: [{ role: 'user', content: konuMetni }],
        mod: tekilMod,
        kullaniciId,
        aramOturumId,
      });
      return ilkKartCikar(yanit);
    } catch (err) {
      if (err?.message === 'LIMIT_DOLDU') limitDoldu = true;
      return null;
    }
  };

  const kartEkle = async (kart) => {
    if (!kart || biriken.length >= hedefAdet) return;
    const anahtar = kart.baslik.toLocaleLowerCase('tr-TR');
    if (gorulenBasliklar.has(anahtar)) return;
    gorulenBasliklar.add(anahtar);
    biriken.push(kart);
    setKartlar([...biriken]);
    await bekle(kartGecikmeMs);
  };

  // Kartlar sirayla istenir: biri bitmeden digeri baslamaz.
  for (let i = 0; i < hedefAdet && !limitDoldu; i++) {
    const kart = await dene();
    await kartEkle(kart);
  }

  // Eksik kart varsa kisa telafi turu.
  let telafi = 0;
  while (biriken.length < hedefAdet && telafi < 4 && !limitDoldu) {
    const kart = await dene();
    await kartEkle(kart);
    telafi += 1;
  }

  if (limitDoldu && biriken.length === 0) {
    throw new Error('LIMIT_DOLDU');
  }

  return biriken;
}

export function useKartlar(mod, kullaniciId = null, { onBasari, onLimitDoldu } = {}) {
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

  const kartlariGetir = useCallback(
    async (yeniKonu) => {
      if (!yeniKonu?.trim()) return;
      setHata(null);
      setYukleniyor(true);
      setKonu(yeniKonu.trim());
      setKartlar([]);
      setAcikKart(null);
      setDetayIcerik(null);
      setIlgiliKartlar([]);
      setKonuKilidiCevap(null);

      kartArandiBildir(mod, yeniKonu.trim());

      try {
        const konuMetni = yeniKonu.trim();

        if (mod === 'bilgi' || mod === 'fikir') {
          const hedefAdet = 6;
          const tekilMod = `${mod}_tek`;
          const biriken = await kartlariAsamaliGetir({
            konuMetni,
            tekilMod,
            kullaniciId,
            hedefAdet,
            setKartlar,
          });

          if (biriken.length > 0) {
            onBasari?.();
            if (kullaniciId) {
              konusmaKaydet(kullaniciId, mod, biriken, konuMetni).catch(() => {});
            }
          } else {
            setHata('Kartlar alınamadı. Tekrar dene.');
          }
        } else {
          const yanit = await mesajGonder({
            mesajlar: [{ role: 'user', content: konuMetni }],
            mod,
            kullaniciId,
          });
          const parsed = jsonCikar(yanit);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setKartlar(parsed);
            onBasari?.();
            if (kullaniciId) {
              konusmaKaydet(kullaniciId, mod, parsed, konuMetni).catch(() => {});
            }
          } else {
            setHata('Kartlar alınamadı. Tekrar dene.');
          }
        }
      } catch (err) {
        if (err.message === 'LIMIT_DOLDU') {
          onLimitDoldu?.();
          setHata('Günlük limitin doldu. Yarın tekrar gel veya üye ol.');
        } else {
          setHata('Bir şeyler ters gitti. Tekrar dene.');
        }
      } finally {
        setYukleniyor(false);
      }
    },
    [mod, kullaniciId, onBasari, onLimitDoldu]
  );

  const detayAc = useCallback(
    async (kart) => {
      setAcikKart(kart);
      setDetayIcerik(null);
      setIlgiliKartlar([]);
      setKonuKilidiCevap(null);
      setDetayYukleniyor(true);
      setHata(null);
      kartTiklandiBildir(mod, kart.baslik);

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

        if (sonuclar[0].status === 'fulfilled') {
          setDetayIcerik(sonuclar[0].value);
          basariliSayi++;
        } else if (sonuclar[0].reason?.message === 'LIMIT_DOLDU') {
          limitHatasi = true;
        }

        if (sonuclar[1].status === 'fulfilled') {
          const ilgiliParsed = jsonCikar(sonuclar[1].value);
          if (Array.isArray(ilgiliParsed) && ilgiliParsed.length > 0) {
            setIlgiliKartlar(ilgiliParsed);
          }
          basariliSayi++;
        } else if (sonuclar[1].reason?.message === 'LIMIT_DOLDU') {
          limitHatasi = true;
        }

        if (basariliSayi > 0) onBasari?.(basariliSayi);
        if (limitHatasi) {
          onLimitDoldu?.();
          if (basariliSayi === 0) setHata('Günlük limitin doldu.');
        } else if (basariliSayi === 0) {
          setHata('Detay yüklenemedi. Tekrar dene.');
        }
      } catch (err) {
        setHata('Detay yüklenemedi. Tekrar dene.');
      } finally {
        setDetayYukleniyor(false);
      }
    },
    [kullaniciId, onBasari, onLimitDoldu]
  );

  const detayKapat = useCallback(() => {
    setAcikKart(null);
    setDetayIcerik(null);
    setIlgiliKartlar([]);
    setKonuKilidiCevap(null);
  }, []);

  const konuKilidiSoru = useCallback(
    async (soru, kartBaslik, kartKanca) => {
      if (!soru?.trim() || !acikKart) return;
      setKonuKilidiYukleniyor(true);
      setHata(null);

      try {
        const yanit = await mesajGonder({
          mesajlar: [
            {
              role: 'user',
              content: `Kart: ${kartBaslik}. ${kartKanca || ''}\n\nKullanıcı sorusu: ${soru.trim()}`,
            },
          ],
          mod: 'konu_kilidi',
          kullaniciId,
        });
        setKonuKilidiCevap(yanit);
        onBasari?.();
      } catch (err) {
        if (err.message === 'LIMIT_DOLDU') {
          onLimitDoldu?.();
          setHata('Günlük limitin doldu.');
        } else {
          setHata('Yanıt alınamadı. Tekrar dene.');
        }
      } finally {
        setKonuKilidiYukleniyor(false);
      }
    },
    [acikKart, kullaniciId, onBasari, onLimitDoldu]
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
    kartlariGetir,
    detayAc,
    detayKapat,
    konuKilidiSoru,
  };
}
