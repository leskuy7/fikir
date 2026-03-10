import { useState, useCallback } from 'react';
import { mesajGonder } from '../services/api';

function jsonCikar(metin) {
  const basla = metin.indexOf('[');
  const bitis = metin.lastIndexOf(']') + 1;
  if (basla === -1 || bitis <= basla) return null;
  try {
    return JSON.parse(metin.slice(basla, bitis));
  } catch {
    return null;
  }
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
        const yanit = await mesajGonder({
          mesajlar: [{ role: 'user', content: yeniKonu.trim() }],
          mod,
          kullaniciId,
        });
        const parsed = jsonCikar(yanit);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setKartlar(parsed);
        } else {
          setHata('Kartlar alınamadı. Tekrar dene.');
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
