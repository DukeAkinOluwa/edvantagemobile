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
  // Step 1 – Account credentials
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;

  // Step 2 – Institution
  university?: string;

  // Step 3 – Academic programme
  course?: string;
  department?: string;

  // Step 4 – Bio / objective
  bio?: string;

  // Step 5 – Level
  level?: string;

  // Optional extras
  faculty?: string;
  gender?: string;
  dob?: string;
  language?: string;
  role?: "student" | "lecturer" | "admin";
}

export async function signUpWithEmail(data: SignUpData): Promise<User> {
  const {
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    university,
    course,
    department,
    bio,
    level,
    faculty,
    gender,
    dob,
    language,
    role,
  } = data;

  const displayName = `${firstName} ${lastName}`.trim();

  // 1. Create the Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // 2. Set displayName on the auth profile
  await updateProfile(user, { displayName });

  // 3. Build the Firestore profile document — include every collected field
  const profileData: Partial<import("./firestoreService").UserProfile> = {
    firstName,
    lastName,
    displayName,
    email,
    phoneNumber,
    university,
    course,
    // store major/course also as department so both fields are populated
    department: department ?? course,
    bio,
    level,
    faculty,
    gender,
    dob,
    language: language ?? "english",
    role: role ?? "student",
    themeMode: "system",
    allowNotifications: true,
    allowAlarms: true,
    isOnline: false,
    privacy: {
      showOnlineStatus: true,
      showProfileToGroups: true,
      allowFriendRequests: true,
      dataCollection: true,
    },
  };

  // Remove undefined keys so Firestore doesn't store empty fields
  Object.keys(profileData).forEach((k) => {
    if ((profileData as any)[k] === undefined) delete (profileData as any)[k];
  });

  await createUserProfile(user.uid, profileData);

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
