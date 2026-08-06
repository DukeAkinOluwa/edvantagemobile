// lib/firebase.ts
// Central Firebase initializer for Edvantae Mobile
// Uses the Firebase JS SDK (compatible with Expo managed workflow / Expo Go)

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
