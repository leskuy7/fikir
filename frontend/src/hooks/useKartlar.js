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

  return null;
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
        const yanit = await mesajGonder({
          mesajlar: [{ role: 'user', content: yeniKonu.trim() }],
          mod,
          kullaniciId,
        });
        const parsed = jsonCikar(yanit);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setKartlar(parsed);
          onBasari?.();
          if (kullaniciId) {
            konusmaKaydet(kullaniciId, mod, parsed, yeniKonu.trim()).catch(() => {});
          }
        } else {
          setHata('Kartlar alınamadı. Tekrar dene.');
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
