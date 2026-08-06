// utils/presence.ts
// Tracks the current user's online/offline status in Firestore
// Uses AppState to detect foreground/background transitions

import { AppState, AppStateStatus } from "react-native";
import { updateUserProfile } from "@/lib/firestoreService";
import { serverTimestamp } from "firebase/firestore";

let currentUid: string | null = null;
let appStateSubscription: any = null;

async function setPresence(online: boolean) {
  if (!currentUid) return;
  try {
    await updateUserProfile(currentUid, {
      isOnline: online,
      lastSeen: serverTimestamp() as any,
    } as any);
  } catch (err) {
    // Silently fail — presence is non-critical
  }
}

function handleAppStateChange(state: AppStateStatus) {
  setPresence(state === "active");
}

/** Start tracking presence for the given user. Call after login. */
export function startPresenceTracking(uid: string) {
  currentUid = uid;
  setPresence(true);
  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener("change", handleAppStateChange);
  }
}

/** Stop tracking presence. Call on logout. */
export function stopPresenceTracking() {
  if (currentUid) setPresence(false);
  currentUid = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
}
