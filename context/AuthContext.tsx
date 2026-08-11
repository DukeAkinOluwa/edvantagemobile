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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  /** True while the Firestore profile is being fetched after auth resolves */
  profileLoading: boolean;
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
  const [profileLoading, setProfileLoading] = useState(false);

  // Ref to suppress the onAuthStateChange handler while signUp is running.
  // When we call createUserWithEmailAndPassword, Firebase fires onAuthStateChanged
  // immediately — before the Firestore profile document has been created. Without
  // this guard the layout would briefly see (user ≠ null, profile === null) and
  // redirect back to signUpPage.
  const signingUpRef = useRef(false);

  // Load Firestore profile whenever the Firebase Auth user changes
  const loadProfile = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const p = await fetchUserProfile(firebaseUser.uid);
      setProfile(p);
    } catch (err: any) {
      console.error("AuthContext: Failed to load user profile", err);
      // If permission is denied, the auth session is likely invalid
      if (
        err?.code === "permission-denied" ||
        err?.message?.includes("permission-denied")
      ) {
        console.warn("AuthContext: Permission denied. Clearing invalid session.");
        await signOut();
        setUser(null);
        setProfile(null);
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Subscribe to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      // Suppress intermediate auth events fired during signUp registration
      if (signingUpRef.current) return;

      if (firebaseUser) {
        try {
          // Force-refresh token to verify the session is valid
          await firebaseUser.getIdToken(true);
          setUser(firebaseUser);
          await loadProfile(firebaseUser);
          startPresenceTracking(firebaseUser.uid);
        } catch (err) {
          console.error("AuthContext: Invalid or stale access token", err);
          await signOut().catch(console.error);
          setUser(null);
          setProfile(null);
          stopPresenceTracking();
        }
      } else {
        setUser(null);
        setProfile(null);
        stopPresenceTracking();
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      stopPresenceTracking();
    };
  }, [loadProfile]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const signIn = useCallback(
    async (email: string, password: string) => {
      const firebaseUser = await signInWithEmail(email, password);
      setUser(firebaseUser);
      await loadProfile(firebaseUser);
    },
    [loadProfile]
  );

  const signUp = useCallback(
    async (data: SignUpData) => {
      // Block the auth-state listener while we're inside the registration flow
      signingUpRef.current = true;
      try {
        const firebaseUser = await signUpWithEmail(data);
        // Token is fresh — no need to getIdToken again
        setUser(firebaseUser);
        await loadProfile(firebaseUser);
        startPresenceTracking(firebaseUser.uid);
        setLoading(false);
      } finally {
        signingUpRef.current = false;
      }
    },
    [loadProfile]
  );

  const logout = useCallback(async () => {
    stopPresenceTracking();
    await signOut();
    setUser(null);
    setProfile(null);
    // Clear all local cached data so a stale session can never bypass auth
    try {
      await AsyncStorage.multiRemove([
        "userData",
        "firstLaunch",
        "tasks",
        "scheduled_notifications",
      ]);
    } catch (e) {
      console.warn("AuthContext: Failed to clear local storage on logout", e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, profileLoading, signIn, signUp, logout, refreshProfile }}
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
