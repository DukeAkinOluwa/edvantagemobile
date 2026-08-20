// lib/firebase.ts
// Central Firebase initializer for Edvantae Mobile
// Uses the Firebase JS SDK (compatible with Expo managed workflow / Expo Go)

import { getApp, getApps, initializeApp } from "firebase/app";
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDQg1m8U65ZnXMa8Qo70aT8wuECKLbmITY",
  authDomain: "edvantae-mobile.firebaseapp.com",
  projectId: "edvantae-mobile",
  storageBucket: "edvantae-mobile.firebasestorage.app",
  messagingSenderId: "296171411586",
  appId: "1:296171411586:web:bf78f1a3c9bc828e85bc9b",
  measurementId: "G-YG2D95B37W",
};

// Prevent re-initialization during hot reloads in development
const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();

export const auth = isNewApp
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const db = isNewApp
  ? initializeFirestore(app, {
      localCache: memoryLocalCache({}),
      experimentalForceLongPolling: true,
    })
  : getFirestore(app);
export const storage = getStorage(app);

export default app;
