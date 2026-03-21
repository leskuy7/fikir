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
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

export { app, auth, GoogleAuthProvider };
