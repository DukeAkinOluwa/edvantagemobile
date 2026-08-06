// lib/authService.ts
// Firebase Authentication service for Edvantae Mobile
// Handles email/password sign up, sign in, sign out, and auth state observation

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserProfile, getUserProfile } from "./firestoreService";

// ─── Sign Up ────────────────────────────────────────────────────────────────

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  university?: string;
  course?: string;
  level?: string;
  phoneNumber?: string;
  bio?: string;
}

export async function signUpWithEmail(data: SignUpData): Promise<User> {
  const { email, password, firstName, lastName, ...rest } = data;
  const displayName = `${firstName} ${lastName}`.trim();

  // Create the Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Set displayName on the auth profile
  await updateProfile(user, { displayName });

  // Create the Firestore user document
  await createUserProfile(user.uid, {
    firstName,
    lastName,
    email,
    displayName,
    themeMode: "system",
    allowNotifications: true,
    allowAlarms: true,
    privacy: {
      showOnlineStatus: true,
      showProfileToGroups: true,
      allowFriendRequests: true,
      dataCollection: true,
    },
    ...rest,
  });

  return user;
}

// ─── Sign In ────────────────────────────────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ─── Sign Out ───────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ─── Auth State Observer ────────────────────────────────────────────────────

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// ─── Current User ───────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// ─── Fetch user profile from Firestore ──────────────────────────────────────

export async function fetchUserProfile(uid: string) {
  return getUserProfile(uid);
}
