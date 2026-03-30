import { useCallback, useState } from 'react';

const VARSAYILAN_LIMIT = 5;

export function useLimit() {
  const [sunucuLimit, setSunucuLimit] = useState(null);

  const sunucudanGuncelle = useCallback((limitBilgisi) => {
    if (!limitBilgisi) return;

    const toplam = Number(limitBilgisi.toplam);
    const kalan = Number(limitBilgisi.kalan);
    const kullanilan = Number(limitBilgisi.kullanilan);

    if ([toplam, kalan, kullanilan].some((deger) => Number.isNaN(deger))) {
      return;
    }

    setSunucuLimit({ toplam, kalan, kullanilan });
  }, []);

  const efektifToplam = sunucuLimit?.toplam ?? VARSAYILAN_LIMIT;
  const efektifKalan = sunucuLimit?.kalan ?? efektifToplam;
  const efektifKullanilan = Math.max(0, efektifToplam - efektifKalan);
  const uyari = efektifKullanilan >= efektifToplam - 2 && efektifKullanilan < efektifToplam;
  const limitAsildi = efektifKalan <= 0;

  const limitDoldu = useCallback(() => {
    setSunucuLimit((onceki) => {
      const toplam = onceki?.toplam ?? VARSAYILAN_LIMIT;
      return { toplam, kalan: 0, kullanilan: toplam };
    });
  }, []);

  return {
    toplam: efektifToplam,
    kalan: efektifKalan,
    kullanilan: efektifKullanilan,
    uyari,
    limitAsildi,
    limitDoldu,
    sunucudanGuncelle,
  };
}
