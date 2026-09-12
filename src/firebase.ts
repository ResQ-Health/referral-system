import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyApMd_5NJW1h8elnWFLB5FM-TYF1ycgkMw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'resq-health-africa.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'resq-health-africa',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'resq-health-africa.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '653104696055',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:653104696055:web:58072df5159c77c1c9e1f2',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-2BFCNPZ395',
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const registerWithEmail = async (email: string, pass: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
};

export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export { onAuthStateChanged };
export type { User };
