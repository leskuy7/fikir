import { useSyncExternalStore, useCallback, useState } from 'react';

const MISAFIR_LIMIT = 5;
const KAYITLI_LIMIT = 20;
const LIMIT_UPDATE_EVENT = 'fikir:limit-update';

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LIMIT_UPDATE_EVENT, { detail: key }));
    }
  } catch {
    // Storage yazma hatasi kritik degil.
  }
}

function getSnapshot(key) {
  return oku(key);
}

function getServerSnapshot(key) {
  return { gun: bugun(), sayi: 0 };
}

function subscribe(key, callback) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e) => {
    if (e.key === key) callback();
  };
  const onLimitUpdate = (e) => {
    if (e.detail === key) callback();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(LIMIT_UPDATE_EVENT, onLimitUpdate);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LIMIT_UPDATE_EVENT, onLimitUpdate);
  };
}

export function useLimit(kullaniciId = null) {
  const key = limitKey(kullaniciId);
  const limit = kullaniciId ? KAYITLI_LIMIT : MISAFIR_LIMIT;

  const durum = useSyncExternalStore(
    (cb) => subscribe(key, cb),
    () => getSnapshot(key),
    () => getServerSnapshot(key)
  );

  const [sunucuDurumu, setSunucuDurumu] = useState({ key: null, limit: null });
  const sunucuLimit = sunucuDurumu.key === key ? sunucuDurumu.limit : null;

  const artir = useCallback((miktar = 1) => {
    const data = oku(key);
    const yeni = { gun: data.gun, sayi: Math.min(data.sayi + miktar, limit) };
    yaz(key, yeni);
  }, [key, limit]);

  const limitDoldu = useCallback(() => {
    const data = oku(key);
    const yeni = { gun: data.gun, sayi: limit };
    yaz(key, yeni);
  }, [key, limit]);

  const sunucudanGuncelle = useCallback((limitBilgisi) => {
    if (!limitBilgisi) return;

    const toplam = Number(limitBilgisi.toplam);
    const kalan = Number(limitBilgisi.kalan);
    const kullanilan = Number(limitBilgisi.kullanilan);
    if ([toplam, kalan, kullanilan].some((v) => Number.isNaN(v))) return;

    setSunucuDurumu({ key, limit: { toplam, kalan, kullanilan } });

    const data = oku(key);
    const yeni = { gun: data.gun, sayi: Math.max(0, Math.min(kullanilan, limit)) };
    yaz(key, yeni);
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
