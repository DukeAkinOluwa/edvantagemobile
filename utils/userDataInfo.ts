// utils/userDataInfo.ts
// Singleton user data manager for Edvantae Mobile
// Reads from Firestore first (if authenticated), falls back to AsyncStorage.
// Writes to both AsyncStorage (offline cache) and Firestore (sync).

import { getData, saveData } from "@/utils/storage";
import * as FileSystem from "expo-file-system";

interface UserData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  dob?: string;
  gender?: string;
  profilePic?: string;
  course?: string;
  level?: string;
  department?: string;
  faculty?: string;
  university?: string;
  email?: string;
  phoneNumber?: string;
  themeMode?: "system" | "light" | "dark";
  allowNotifications?: boolean;
  allowAlarms?: boolean;
  language?: string;
  privacy?: {
    showOnlineStatus: boolean;
    showProfileToGroups: boolean;
    allowFriendRequests: boolean;
    dataCollection: boolean;
  };
}

class UserDataInfo {
  private data: UserData = {};
  private initialized: boolean = false;
  private currentUid: string | null = null;

  /**
   * Initialize from AsyncStorage. Call this first on app start.
   * For Firestore sync, call syncFromFirestore(uid) after auth resolves.
   */
  async initialize() {
    if (this.initialized) return;
    console.log("UserDataInfo: Initializing from AsyncStorage");
    const savedData = await getData("userData");
    if (savedData) {
      this.data = savedData;
      console.log("UserDataInfo: Loaded data from AsyncStorage");
    }
    this.initialized = true;
  }

  /**
   * Load profile from Firestore and merge into local state.
   * Called after Firebase auth resolves with a uid.
   */
  async syncFromFirestore(uid: string) {
    try {
      this.currentUid = uid;
      // Lazy-import to avoid circular deps and keep this module lightweight
      const { getUserProfile } = await import("@/lib/firestoreService");
      const profile = await getUserProfile(uid);
      if (profile) {
        // Strip Firestore-only fields before merging
        const { uid: _uid, createdAt: _c, updatedAt: _u, ...profileData } = profile as any;
        this.data = { ...this.data, ...profileData };
        await saveData("userData", this.data);
        console.log("UserDataInfo: Synced from Firestore");
      }
    } catch (err) {
      console.warn("UserDataInfo: Firestore sync failed, using local data", err);
    }
  }

  getData(): UserData {
    return { ...this.data };
  }

  async setData(
    newData: Partial<UserData>,
    options: { isImage?: boolean } = {}
  ) {
    const updatedData = { ...this.data, ...newData };
    this.data = updatedData;
    console.log("UserDataInfo: Saving data");

    try {
      // 1. Handle image persistence (local filesystem)
      if (options.isImage && newData.profilePic) {
        const fileName = `profile_${Date.now()}.jpg`;
        const newPath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: newData.profilePic, to: newPath });
        this.data.profilePic = newPath;
        updatedData.profilePic = newPath;
        console.log("UserDataInfo: Persistent image URI:", newPath);
      }

      // 2. Save to AsyncStorage (offline cache)
      await saveData("userData", this.data);

      // 3. Sync to Firestore if authenticated
      if (this.currentUid) {
        const { updateUserProfile } = await import("@/lib/firestoreService");
        await updateUserProfile(this.currentUid, this.data);
      }
    } catch (error) {
      console.error("UserDataInfo: Save error:", error);
      throw error;
    }
  }

  async clearData() {
    this.data = {};
    this.currentUid = null;
    this.initialized = false;
    await saveData("userData", {});
    console.log("UserDataInfo: Cleared data");
  }

  setUid(uid: string | null) {
    this.currentUid = uid;
  }
}

const userDataInfo = new UserDataInfo();
export default userDataInfo;
