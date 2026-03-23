import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

export const firebaseHazir = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

const app = firebaseHazir
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

let auth = null;
if (app) {
  // Önce mevcut bir auth instance var mı bak (HMR / Fast Refresh durumu)
  try {
    auth = getAuth(app);
  } catch {
    // İlk başlatma — persistence ile dene
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e2) {
      // Persistence hatalıysa persistence'siz dene
      try {
        auth = initializeAuth(app);
      } catch {
        console.warn('Firebase Auth baslatılamadı:', e2?.message);
        auth = null;
      }
    }
  }
}

export { app, auth, GoogleAuthProvider };
