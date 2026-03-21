import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { onAuthStateChanged, signInWithCredential, signOut } from 'firebase/auth';
import { auth, firebaseHazir, GoogleAuthProvider } from '../services/firebase';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);
const PLATFORM_CLIENT_ID = PlatformClientIdGetir();

function PlatformClientIdGetir() {
  return {
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  };
}

function googleYapilandirmaHatasi() {
  if (!firebaseHazir || !auth) {
    return 'Firebase ayarlari eksik. EXPO_PUBLIC_FIREBASE_* alanlarini kontrol et.';
  }
  if (!PLATFORM_CLIENT_ID.web) {
    return 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanimli degil.';
  }
  if (!PLATFORM_CLIENT_ID.android) {
    return 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID tanimli degil.';
  }
  if (!PLATFORM_CLIENT_ID.ios) {
    return 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID tanimli degil.';
  }
  return null;
}

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(auth?.currentUser ?? null);
  const [yukleniyor, setYukleniyor] = useState(Boolean(auth));
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState(googleYapilandirmaHatasi());

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: PLATFORM_CLIENT_ID.web || undefined,
      androidClientId: PLATFORM_CLIENT_ID.android || undefined,
      iosClientId: PLATFORM_CLIENT_ID.ios || undefined,
      scopes: ['profile', 'email'],
      selectAccount: true,
    },
    { scheme: 'fikirkutusu' }
  );

  useEffect(() => {
    if (!auth) {
      setYukleniyor(false);
      return undefined;
    }

    const abonelik = onAuthStateChanged(auth, (sonrakiKullanici) => {
      setKullanici(sonrakiKullanici);
      setYukleniyor(false);
    });

    return abonelik;
  }, []);

  useEffect(() => {
    if (!response) return;

    if (response.type !== 'success') {
      if (response.type === 'error') {
        setHata('Google girisi tamamlanamadi. Lutfen tekrar dene.');
      }
      setIslemde(false);
      return;
    }

    const idToken = response.params?.id_token;
    if (!idToken || !auth) {
      setHata('Google kimlik bilgisi alinamadi.');
      setIslemde(false);
      return;
    }

    let aktif = true;
    const girisiTamamla = async () => {
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        if (aktif) setHata(null);
      } catch (err) {
        console.error('Google giris hatasi:', err?.code || err);
        if (aktif) {
          setHata('Google ile giris yapilamadi. Firebase ve OAuth ayarlarini kontrol et.');
        }
      } finally {
        if (aktif) setIslemde(false);
      }
    };

    void girisiTamamla();
    return () => {
      aktif = false;
    };
  }, [response]);

  const girisYap = useCallback(async () => {
    const configHatasi = googleYapilandirmaHatasi();
    if (configHatasi) {
      setHata(configHatasi);
      return false;
    }
    if (!request) {
      setHata('Google girisi henuz hazir degil. Kisa bir sure sonra tekrar dene.');
      return false;
    }

    setHata(null);
    setIslemde(true);

    try {
      const sonuc = await promptAsync();
      if (sonuc.type !== 'success') {
        setIslemde(false);
      }
      return sonuc.type === 'success';
    } catch (err) {
      console.error('Google giris baslatma hatasi:', err);
      setIslemde(false);
      setHata('Google girisi baslatilamadi.');
      return false;
    }
  }, [promptAsync, request]);

  const cikisYap = useCallback(async () => {
    if (!auth) return;
    setIslemde(true);
    setHata(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Cikis hatasi:', err?.code || err);
      setHata('Oturum kapatilamadi. Lutfen tekrar dene.');
    } finally {
      setIslemde(false);
    }
  }, []);

  const girisHazir = Boolean(request);
  const value = useMemo(() => ({
    kullanici,
    yukleniyor,
    islemde,
    hata,
    girisHazir,
    girisYap,
    cikisYap,
  }), [cikisYap, girisHazir, girisYap, hata, islemde, kullanici, yukleniyor]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return value;
}
