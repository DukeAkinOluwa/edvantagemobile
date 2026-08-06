// context/AuthContext.tsx
// Firebase Auth context for Edvantae Mobile
// Provides user, loading state, and auth actions to the entire app

import {
  fetchUserProfile,
  onAuthStateChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  type SignUpData,
} from "@/lib/authService";
import { UserProfile } from "@/lib/firestoreService";
import { startPresenceTracking, stopPresenceTracking } from "@/utils/presence";
import { User } from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Context Types ────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Firebase Auth user (null = not logged in) */
  user: User | null;
  /** Firestore user profile document */
  profile: UserProfile | null;
  /** True while auth state is being resolved on startup */
  loading: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign up with full form data */
  signUp: (data: SignUpData) => Promise<void>;
  /** Sign out the current user */
  logout: () => Promise<void>;
  /** Refresh the profile from Firestore */
  refreshProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load Firestore profile whenever the Firebase Auth user changes
  const loadProfile = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      return;
    }
    try {
      const p = await fetchUserProfile(firebaseUser.uid);
      setProfile(p);
    } catch (err) {
      console.error("AuthContext: Failed to load user profile", err);
    }
  }, []);

  // Subscribe to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      await loadProfile(firebaseUser);
      setLoading(false);
      // Start/stop presence tracking based on auth state
      if (firebaseUser) {
        startPresenceTracking(firebaseUser.uid);
      } else {
        stopPresenceTracking();
      }
    });
    return () => {
      unsubscribe();
      stopPresenceTracking();
    };
  }, [loadProfile]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, password: string) => {
    const firebaseUser = await signInWithEmail(email, password);
    await loadProfile(firebaseUser);
  }, [loadProfile]);

  const signUp = useCallback(async (data: SignUpData) => {
    const firebaseUser = await signUpWithEmail(data);
    await loadProfile(firebaseUser);
  }, [loadProfile]);

  const logout = useCallback(async () => {
    stopPresenceTracking();
    await signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
