import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase.js';

export function useAuth() {
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const abonelikIptal = onAuthStateChanged(auth, (girilenKullanici) => {
      setKullanici(girilenKullanici);
      setYukleniyor(false);
    });
    return abonelikIptal;
  }, []);

  const girisYap = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Giriş hatası:', err);
    }
  };

  const cikisYap = () => signOut(auth);

  return { kullanici, yukleniyor, girisYap, cikisYap };
}
