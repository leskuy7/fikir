import { useState, useCallback, useEffect } from 'react';

const MISAFIR_LIMIT = 10;
const KAYITLI_LIMIT = 30;

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
  } catch {}
}

export function useLimit(kullaniciId = null) {
  const key = limitKey(kullaniciId);
  const limit = kullaniciId ? KAYITLI_LIMIT : MISAFIR_LIMIT;
  const [durum, setDurum] = useState(() => oku(key));

  useEffect(() => {
    setDurum(oku(key));
  }, [key]);

  const artir = useCallback((miktar = 1) => {
    const data = oku(key);
    data.sayi = Math.min(data.sayi + miktar, limit);
    yaz(key, data);
    setDurum(data);
  }, [key, limit]);

  const limitDoldu = useCallback(() => {
    const data = oku(key);
    data.sayi = limit;
    yaz(key, data);
    setDurum(data);
  }, [key, limit]);

  const kalan = Math.max(0, limit - durum.sayi);
  const uyari = durum.sayi >= limit - 2 && durum.sayi < limit;
  const limitAsildi = durum.sayi >= limit;

  return { kalan, uyari, limitAsildi, artir, limitDoldu };
}
