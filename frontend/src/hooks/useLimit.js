import { useState, useCallback } from 'react';

const MISAFIR_LIMIT = 5;
const KAYITLI_LIMIT = 20;

function bugun() {
  return new Date().toISOString().slice(0, 10);
}

function limitKey(kullaniciId) {
  return kullaniciId ? `fikir-kutusu-limit:${kullaniciId}` : 'fikir-kutusu-limit';
}

function oku(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { gun: bugun(), sayi: 0 };
    const data = JSON.parse(raw);
    if (data.gun !== bugun()) return { gun: bugun(), sayi: 0 };
    return data;
  } catch {
    return { gun: bugun(), sayi: 0 };
  }
}

function yaz(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage yazma hatasi kritik degil.
  }
}

export function useLimit(kullaniciId = null) {
  const key = limitKey(kullaniciId);
  const limit = kullaniciId ? KAYITLI_LIMIT : MISAFIR_LIMIT;
  const [yerelDurum, setYerelDurum] = useState(() => ({ key, data: oku(key) }));
  const [sunucuDurumu, setSunucuDurumu] = useState({ key: null, limit: null });

  const durum = yerelDurum.key === key ? yerelDurum.data : oku(key);
  const sunucuLimit = sunucuDurumu.key === key ? sunucuDurumu.limit : null;

  const artir = useCallback((miktar = 1) => {
    const data = oku(key);
    data.sayi = Math.min(data.sayi + miktar, limit);
    yaz(key, data);
    setYerelDurum({ key, data });
  }, [key, limit]);

  const limitDoldu = useCallback(() => {
    const data = oku(key);
    data.sayi = limit;
    yaz(key, data);
    setYerelDurum({ key, data });
  }, [key, limit]);

  const sunucudanGuncelle = useCallback((limitBilgisi) => {
    if (!limitBilgisi) return;

    const toplam = Number(limitBilgisi.toplam);
    const kalan = Number(limitBilgisi.kalan);
    const kullanilan = Number(limitBilgisi.kullanilan);
    if ([toplam, kalan, kullanilan].some((v) => Number.isNaN(v))) return;

    setSunucuDurumu({ key, limit: { toplam, kalan, kullanilan } });

    const data = oku(key);
    data.sayi = Math.max(0, Math.min(kullanilan, limit));
    yaz(key, data);
    setYerelDurum({ key, data });
  }, [key, limit]);

  const efektifToplam = sunucuLimit?.toplam ?? limit;
  const efektifKalan = Number.isInteger(sunucuLimit?.kalan)
    ? Math.max(0, sunucuLimit.kalan)
    : Math.max(0, limit - durum.sayi);
  const efektifKullanilan = Math.max(0, efektifToplam - efektifKalan);
  const uyari = efektifKullanilan >= efektifToplam - 2 && efektifKullanilan < efektifToplam;
  const limitAsildi = efektifKalan <= 0;

  return { kalan: efektifKalan, uyari, limitAsildi, artir, limitDoldu, sunucudanGuncelle };
}
