import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';

const {
  GoogleAuthProvider,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} = FirebaseAuth;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBjJynYGrTCGJ3PxshAh8R3929EJqMqrx0',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'fikir-kutusu.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'fikir-kutusu',
};

export const firebaseHazir = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

const app = firebaseHazir
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

export let authHatasi = null;

function authOlustur(firebaseApp) {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (err) {
    if (err?.code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    authHatasi = err?.message || 'initializeAuth persistence hatasi';
  }

  try {
    return initializeAuth(firebaseApp);
  } catch (err) {
    if (err?.code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    authHatasi = err?.message || 'initializeAuth hatasi';
  }

  try {
    return getAuth(firebaseApp);
  } catch (err) {
    authHatasi = err?.message || 'getAuth hatasi';
  }

  return null;
}

let auth = null;
if (app) {
  auth = authOlustur(app);
}

export { app, auth, GoogleAuthProvider };
