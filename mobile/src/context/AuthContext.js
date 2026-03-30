import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as FirebaseAuth from 'firebase/auth';
import { auth, authHatasi, firebaseHazir, GoogleAuthProvider } from '../services/firebase';

const { onAuthStateChanged, signInWithCredential, signOut } = FirebaseAuth;

const AuthContext = createContext(null);
const PLATFORM_CLIENT_ID = platformClientIdGetir();
const GOOGLE_SIGNIN_HATASI = googleSignInYapilandir();

function platformClientIdGetir() {
  return {
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '563317995480-f2btk7qkn4ek38dv88fmsdssibsv3rs3.apps.googleusercontent.com',
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '563317995480-dk2i1qaasbj09avlfqae2gof5antmljm.apps.googleusercontent.com',
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '563317995480-8rah7362kjqlep9s6uo5bghqtj0nc87l.apps.googleusercontent.com',
  };
}

function googleSignInYapilandir() {
  try {
    GoogleSignin.configure({
      webClientId: PLATFORM_CLIENT_ID.web || undefined,
      iosClientId: PLATFORM_CLIENT_ID.ios || undefined,
      scopes: ['email', 'profile'],
    });
    return null;
  } catch (err) {
    return err?.message || 'Google Sign-In configure hatasi';
  }
}

function googleYapilandirmaHatasi() {
  if (!firebaseHazir) {
    return 'Firebase ayarlari eksik. EXPO_PUBLIC_FIREBASE_* alanlarini kontrol et.';
  }
  if (!auth) {
    return `Firebase Auth baslatilamadi: ${authHatasi || 'bilinmeyen hata'}`;
  }
  if (GOOGLE_SIGNIN_HATASI) {
    return `Google Sign-In baslatilamadi: ${GOOGLE_SIGNIN_HATASI}`;
  }
  if (!PLATFORM_CLIENT_ID.web) {
    return 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanimli degil.';
  }
  if (Platform.OS === 'ios' && !PLATFORM_CLIENT_ID.ios) {
    return 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID tanimli degil.';
  }
  return null;
}

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(auth?.currentUser ?? null);
  const [yukleniyor, setYukleniyor] = useState(Boolean(auth));
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState(googleYapilandirmaHatasi());

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

  const girisYap = useCallback(async () => {
    const configHatasi = googleYapilandirmaHatasi();
    if (configHatasi) {
      setHata(configHatasi);
      return false;
    }

    setHata(null);
    setIslemde(true);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const sonuc = await GoogleSignin.signIn();

      if (!isSuccessResponse(sonuc)) {
        setIslemde(false);
        setHata(null);
        return false;
      }

      const idToken = sonuc.data.idToken;
      if (!idToken || !auth) {
        setHata('Google kimlik bilgisi alinamadi. Web Client ID ayarini kontrol et.');
        setIslemde(false);
        return false;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      setHata(null);
      setIslemde(false);
      return true;
    } catch (err) {
      console.error('Google giris hatasi:', err?.code || err);
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setHata('Google Play servisleri kullanilamiyor. Emulatorde Play Store image kullan.');
        } else if (err.code === statusCodes.IN_PROGRESS) {
          setHata('Google girisi zaten acik. Ekrani kapatip tekrar dene.');
        } else {
          setHata(`Google ile giris yapilamadi: ${err?.message || err.code}`);
        }
      } else {
        setHata('Google ile giris yapilamadi. OAuth ayarlarini kontrol et.');
      }
      setIslemde(false);
      return false;
    }
  }, []);

  const cikisYap = useCallback(async () => {
    if (!auth) return;
    setIslemde(true);
    setHata(null);
    try {
      await GoogleSignin.signOut().catch(() => null);
      await signOut(auth);
    } catch (err) {
      console.error('Cikis hatasi:', err?.code || err);
      setHata('Oturum kapatilamadi. Lutfen tekrar dene.');
    } finally {
      setIslemde(false);
    }
  }, []);

  const girisHazir = !Boolean(googleYapilandirmaHatasi());
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
