import { useState, useCallback } from 'react';
import { mesajGonder } from '../services/api';

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

export function useKartlar(mod, kullaniciId = null) {
  const [konu, setKonu] = useState('');
  const [kartlar, setKartlar] = useState([]);
  const [acikKart, setAcikKart] = useState(null);
  const [detayIcerik, setDetayIcerik] = useState(null);
  const [ilgiliKartlar, setIlgiliKartlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);

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

      try {
        const konuMetni = yeniKonu.trim();

        if (mod === 'bilgi' || mod === 'fikir') {
          const hedefAdet = 6;
          const tekilMod = `${mod}_tek`;
          const biriken = [];
          const gorulenBasliklar = new Set();

          for (let i = 0; i < hedefAdet; i += 1) {
            const yanit = await mesajGonder({
              mesajlar: [{ role: 'user', content: konuMetni }],
              mod: tekilMod,
              kullaniciId,
            });
            const kart = ilkKartCikar(yanit);
            if (!kart) continue;

            const anahtar = kart.baslik.toLocaleLowerCase('tr-TR');
            if (gorulenBasliklar.has(anahtar)) continue;

            gorulenBasliklar.add(anahtar);
            biriken.push(kart);
            setKartlar([...biriken]);
          }

          if (biriken.length === 0) {
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
          } else {
            setHata('Kartlar alınamadı. Tekrar dene.');
          }
        }
      } catch (err) {
        if (err.message === 'LIMIT_DOLDU') {
          setHata('Günlük limitin doldu. Yarın tekrar gel veya üye ol.');
        } else {
          setHata('Bir şeyler ters gitti. Tekrar dene.');
        }
      } finally {
        setYukleniyor(false);
      }
    },
    [mod, kullaniciId]
  );

  const detayAc = useCallback(
    async (kart) => {
      setAcikKart(kart);
      setDetayIcerik(null);
      setIlgiliKartlar([]);
      setDetayYukleniyor(true);
      setHata(null);

      try {
        const detayMesaj = `${kart.baslik}\n\n${kart.kanca || ''}`;
        const [detayYanit, ilgiliYanit] = await Promise.all([
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

        setDetayIcerik(detayYanit);
        const ilgiliParsed = jsonCikar(ilgiliYanit);
        if (Array.isArray(ilgiliParsed)) setIlgiliKartlar(ilgiliParsed);
      } catch {
        setHata('Detay yüklenemedi.');
      } finally {
        setDetayYukleniyor(false);
      }
    },
    [kullaniciId]
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
    kartlariGetir,
    detayAc,
    setAcikKart,
  };
}
