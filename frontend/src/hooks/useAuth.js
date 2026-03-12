import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { kullaniciyiKaydet } from '../services/firestore.js';
import { SESSION_EXPIRED_EVENT } from '../services/api.js';

function limitCacheTemizle() {
  if (typeof localStorage === 'undefined') return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key?.startsWith('fikir-kutusu-limit')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage erişim hatası kritik değil.
  }
}

export function useAuth() {
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);

  useEffect(() => {
    const abonelikIptal = onAuthStateChanged(auth, (girilenKullanici) => {
      setKullanici(girilenKullanici);
      setYukleniyor(false);
    });
    return abonelikIptal;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const oturumBitti = async () => {
      limitCacheTemizle();
      setHata('Oturumun sona ermis. Lutfen yeniden giris yap.');
      try {
        if (auth.currentUser) {
          await signOut(auth);
        }
      } catch (err) {
        console.error('Oturum sonlandirma hatasi:', err?.code || err);
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, oturumBitti);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, oturumBitti);
  }, []);

  const girisYap = async () => {
    setHata(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const sonuc = await signInWithPopup(auth, provider);
      await kullaniciyiKaydet(sonuc.user).catch(() => {});
    } catch (err) {
      const sessizKodlar = [
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/user-cancelled',
      ];
      if (!sessizKodlar.includes(err?.code)) {
        setHata('Giriş yapılamadı. Lütfen tekrar dene.');
        console.error('Giriş hatası:', err?.code || err);
      }
    }
  };

  const cikisYap = async () => {
    setHata(null);
    limitCacheTemizle();
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Çıkış hatası:', err?.code || err);
    }
  };

  return { kullanici, yukleniyor, hata, girisYap, cikisYap };
}
