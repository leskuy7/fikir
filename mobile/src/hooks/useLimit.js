import { useState, useCallback } from 'react';

const MISAFIR_LIMIT = 5;

export function useLimit() {
  const [sunucuLimit, setSunucuLimit] = useState(null);

  const sunucudanGuncelle = useCallback((limitBilgisi) => {
    if (!limitBilgisi) return;

    const toplam = Number(limitBilgisi.toplam);
    const kalan = Number(limitBilgisi.kalan);
    const kullanilan = Number(limitBilgisi.kullanilan);
    if ([toplam, kalan, kullanilan].some((v) => Number.isNaN(v))) return;

    setSunucuLimit({ toplam, kalan, kullanilan });
  }, []);

  const efektifToplam = sunucuLimit?.toplam ?? MISAFIR_LIMIT;
  const efektifKalan = sunucuLimit?.kalan ?? MISAFIR_LIMIT;
  const efektifKullanilan = Math.max(0, efektifToplam - efektifKalan);
  const uyari = efektifKullanilan >= efektifToplam - 2 && efektifKullanilan < efektifToplam;
  const limitAsildi = efektifKalan <= 0;

  const limitDoldu = useCallback(() => {
    setSunucuLimit((prev) => {
      const toplam = prev?.toplam ?? MISAFIR_LIMIT;
      return { toplam, kalan: 0, kullanilan: toplam };
    });
  }, []);

  return { kalan: efektifKalan, uyari, limitAsildi, limitDoldu, sunucudanGuncelle };
}
