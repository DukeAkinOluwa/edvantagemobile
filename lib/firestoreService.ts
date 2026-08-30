// lib/firestoreService.ts
// Typed Firestore CRUD helpers for Edvantae Mobile
// Collections: users, tasks, chatRooms, messages

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
  arrayUnion
} from "firebase/firestore";
import { db } from "./firebase";
import { scheduleAlarm } from "./alarmService";
import { scheduleEventNotification } from "../utils/notifications";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid?: string;
  role?: "student" | "lecturer" | "admin";
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  bio?: string;
  dob?: string;
  gender?: string;
  expoPushToken?: string;
  profilePic?: string;
  course?: string;
  level?: string;
  department?: string;
  faculty?: string;
  university?: string;
  phoneNumber?: string;
  themeMode?: "system" | "light" | "dark";
  allowNotifications?: boolean;
  allowAlarms?: boolean;
  language?: string;
  isOnline?: boolean;
  lastSeen?: Timestamp;
  privacy?: {
    showOnlineStatus: boolean;
    showProfileToGroups: boolean;
    allowFriendRequests: boolean;
    dataCollection: boolean;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  location: string;
  level?: string;
  isGroupEvent: boolean;
  startTime: string;
  endTime: string;
  startTimeAMPM: string;
  endTimeAMPM: string;
  uid: string;
  createdAt?: Timestamp;
}

export interface ChatRoom {
  id?: string;
  name: string;
  participants: string[];          // array of UIDs
  participantNames?: Record<string, string>; // uid -> displayName
  participantAvatars?: Record<string, string>; // uid -> profilePic URL
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  lastMessageSenderUid?: string;
  isGroup: boolean;
  isPublic?: boolean;              // whether the group is discoverable
  isClassGroup?: boolean;          // true if linked to a class
  classId?: string;                // ID of the linked schedule event
  avatarUrl?: string;              // group avatar or other person's pic
  unreadCounts?: Record<string, number>; // uid -> unread count
  typingUsers?: Record<string, number>;  // uid -> timestamp of last typing event
  clearedAt?: Record<string, number>;    // uid -> timestamp when user cleared chat
  createdAt?: Timestamp;
}

export interface Message {
  id?: string;
  text: string;
  sender: string;                  // UID
  senderName?: string;
  senderAvatar?: string;
  timestamp?: Timestamp;
  type?: "text" | "image" | "document" | "voice" | "video";
  readBy?: string[];               // UIDs that have read this message
  // Image fields
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  // Video fields
  videoUrl?: string;
  // Voice fields
  voiceUrl?: string;
  voiceDuration?: number;
  // Document fields
  documentUrl?: string;
  documentName?: string;
  documentSize?: number;
  documentMime?: string;
  // Upload progress (local only, not stored in Firestore)
  uploadProgress?: number;
  status?: "sending" | "sent" | "failed";
}

// ─── Collection references ────────────────────────────────────────────────────

const usersCol = () => collection(db, "users");
const tasksCol = () => collection(db, "tasks");
const chatRoomsCol = () => collection(db, "chatRooms");
const messagesCol = (chatId: string) =>
  collection(db, "chatRooms", chatId, "messages");

// ─── User Profile ─────────────────────────────────────────────────────────────

/** Create a user profile document at users/{uid} */
export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await setDoc(doc(usersCol(), uid), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Fetch a user profile by uid */
export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(usersCol(), uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

/** Update a user profile (partial merge) */
export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(usersCol(), uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

/** Fetch all tasks for a user */
export async function getUserTasks(uid: string): Promise<Task[]> {
  const q = query(tasksCol(), where("uid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Task));
}

/** Subscribe to a user's tasks in real-time */
export function subscribeUserTasks(
  uid: string,
  onUpdate: (tasks: Task[]) => void
): Unsubscribe {
  const q = query(tasksCol(), where("uid", "==", uid));
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Task));
    onUpdate(tasks);
  });
}

/** Sync task alarms for a user */
export async function syncTaskAlarms(uid: string): Promise<void> {
  const tasks = await getUserTasks(uid);
  const now = Date.now();
  
  for (const task of tasks) {
    if (!task.id) continue;
    
    // Notification 5 mins before
    const notificationTime = new Date(task.startTime).getTime() - 5 * 60 * 1000;
    if (notificationTime > now) {
      await scheduleEventNotification({
        id: task.id,
        title: task.title,
        description: task.description,
        location: task.location,
        startTime: task.startTime,
      });
    }

    // Alarm exactly at start time
    const alarmTime = new Date(task.startTime).getTime();
    if (alarmTime > now) {
      await scheduleAlarm(
        task.id,
        alarmTime,
        `Task Starting: ${task.title}`,
        `Your task starts now at ${task.location}.`
      );
    }
  }
}

/** Create a task */
export async function createTask(task: Omit<Task, "id">): Promise<string> {
  const ref = await addDoc(tasksCol(), {
    ...task,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update a task */
export async function updateTask(
  taskId: string,
  data: Partial<Task>
): Promise<void> {
  await updateDoc(doc(tasksCol(), taskId), data);
}

/** Delete a task */
export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(tasksCol(), taskId));
}

// ─── Chat Rooms ───────────────────────────────────────────────────────────────

/** Fetch all chat rooms a user participates in */
export async function getUserChatRooms(uid: string): Promise<ChatRoom[]> {
  const q = query(
    chatRoomsCol(),
    where("participants", "array-contains", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ChatRoom));
}

// ─── Messages ─────────────────────────────────────────────────────────────────
/** Clear chat messages for a specific user */
export async function clearChatForUser(chatId: string, uid: string): Promise<void> {
  const roomRef = doc(db, "chatRooms", chatId);
  await updateDoc(roomRef, {
    [`clearedAt.${uid}`]: Date.now()
  });
}

/** Delete a chat room completely */
export async function deleteChatRoom(chatId: string): Promise<void> {
  const roomRef = doc(db, "chatRooms", chatId);
  await deleteDoc(roomRef);
}

/** Subscribe to real-time messages in a chat room */
export function subscribeToMessages(
  chatId: string,
  messageLimit: number,
  callback: (messages: Message[]) => void
): Unsubscribe {
  // Order descending so newest is first (for inverted FlatList)
  const q = query(
    messagesCol(chatId),
    orderBy("timestamp", "desc"),
    limit(messageLimit)
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(
      (d) => ({ ...d.data(), id: d.id } as Message)
    );
    callback(messages);
    // Also update local AsyncStorage cache
    AsyncStorage.setItem(
      `chat_messages_${chatId}`,
      JSON.stringify(messages)
    ).catch(console.error);
  }, (error) => {
    console.error("subscribeToMessages error:", error);
  });
}

/** Send a message to a chat room */
export async function sendMessage(
  chatId: string,
  message: Omit<Message, "id" | "timestamp">,
  senderUid: string,
  participantUids: string[]
): Promise<void> {
  const batch = writeBatch(db);

  // Add the message document
  const msgRef = doc(messagesCol(chatId));
  batch.set(msgRef, {
    ...message,
    timestamp: serverTimestamp(),
    readBy: [senderUid],
  });

  // Build unread increment for all participants except sender
  const unreadUpdate: Record<string, any> = {
    lastMessage: message.text,
    lastMessageTime: serverTimestamp(),
    lastMessageSenderUid: senderUid,
  };
  participantUids.forEach((uid) => {
    if (uid !== senderUid) {
      // Firestore increment — use FieldValue or manual increment
      unreadUpdate[`unreadCounts.${uid}`] = { _increment: 1 };
    }
  });

  // Update room metadata
  await updateDoc(doc(chatRoomsCol(), chatId), {
    lastMessage: message.text,
    lastMessageTime: serverTimestamp(),
    lastMessageSenderUid: senderUid,
  });

  await batch.commit();

  // Increment unread for non-sender participants manually (batch doesn't support FieldValue well cross-platform)
  const incrementPromises = participantUids
    .filter((uid) => uid !== senderUid)
    .map(async (uid) => {
      const roomSnap = await getDoc(doc(chatRoomsCol(), chatId));
      if (roomSnap.exists()) {
        const current = roomSnap.data()?.unreadCounts?.[uid] ?? 0;
        await updateDoc(doc(chatRoomsCol(), chatId), {
          [`unreadCounts.${uid}`]: current + 1,
        });
      }
    });
  await Promise.all(incrementPromises);
}

// ─── User Search ──────────────────────────────────────────────────────────────

/**
 * Search users by firstName, lastName, or email prefix.
 * Returns up to 20 results. Excludes the current user.
 */
export async function searchUsers(
  queryStr: string,
  currentUid: string
): Promise<UserProfile[]> {
  if (!queryStr.trim()) return [];

  const term = queryStr.trim().toLowerCase();
  const results = new Map<string, UserProfile>();

  // Search by firstName prefix
  const firstNameQ = query(
    usersCol(),
    where("firstName", ">=", queryStr),
    where("firstName", "<=", queryStr + "\uf8ff"),
    limit(20)
  );

  // Search by lastName prefix
  const lastNameQ = query(
    usersCol(),
    where("lastName", ">=", queryStr),
    where("lastName", "<=", queryStr + "\uf8ff"),
    limit(20)
  );

  // Search by email prefix
  const emailQ = query(
    usersCol(),
    where("email", ">=", term),
    where("email", "<=", term + "\uf8ff"),
    limit(20)
  );

  const [firstNameSnap, lastNameSnap, emailSnap] = await Promise.all([
    getDocs(firstNameQ),
    getDocs(lastNameQ),
    getDocs(emailQ),
  ]);

  [...firstNameSnap.docs, ...lastNameSnap.docs, ...emailSnap.docs].forEach((d) => {
    if (d.id !== currentUid) {
      results.set(d.id, { uid: d.id, ...d.data() } as UserProfile);
    }
  });

  return Array.from(results.values()).slice(0, 20);
}

// ─── Create / Find Direct Chat ────────────────────────────────────────────────

/**
 * Find an existing 1-on-1 chat room between two users or create one.
 * Returns the chatRoom id.
 */
export async function getOrCreateDirectChat(
  myUid: string,
  myName: string,
  myAvatar: string | undefined,
  otherUid: string,
  otherName: string,
  otherAvatar: string | undefined
): Promise<string> {
  // Look for an existing non-group room with exactly these two participants
  const q = query(
    chatRoomsCol(),
    where("participants", "array-contains", myUid),
    where("isGroup", "==", false)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => {
    const p: string[] = d.data().participants ?? [];
    return p.includes(otherUid) && p.length === 2;
  });

  if (existing) return existing.id;

  // Create new direct chat room
  const ref = await addDoc(chatRoomsCol(), {
    name: otherName,           // shown from the other person's perspective
    participants: [myUid, otherUid],
    participantNames: { [myUid]: myName, [otherUid]: otherName },
    participantAvatars: {
      [myUid]: myAvatar ?? "",
      [otherUid]: otherAvatar ?? "",
    },
    isGroup: false,
    lastMessage: "",
    unreadCounts: { [myUid]: 0, [otherUid]: 0 },
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── Create Group Chat ────────────────────────────────────────────────────────

/**
 * Create a named group chat with multiple participants.
 * Returns the new chatRoom id.
 */
export async function createGroupChat(
  groupName: string,
  participantUids: string[],
  participantNames: Record<string, string>,
  participantAvatars: Record<string, string>,
  isPublic: boolean = false,
  isClassGroup: boolean = false,
  classId?: string
): Promise<string> {
  const unreadCounts: Record<string, number> = {};
  participantUids.forEach((uid) => (unreadCounts[uid] = 0));

  const ref = await addDoc(chatRoomsCol(), {
    name: groupName,
    participants: participantUids,
    participantNames,
    participantAvatars,
    isGroup: true,
    isPublic,
    isClassGroup,
    classId: classId || null,
    lastMessage: "",
    unreadCounts,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── Public Groups Discovery ──────────────────────────────────────────────────

/**
 * Search for public groups by name prefix. (Now customized to only show class groups!)
 */
export async function searchPublicGroups(queryStr: string): Promise<ChatRoom[]> {
  if (!queryStr.trim()) return [];

  const term = queryStr.trim().toLowerCase();
  
  try {
    // Only search for public class groups
    const q = query(
      chatRoomsCol(),
      where("isPublic", "==", true),
      where("isClassGroup", "==", true),
      limit(50)
    );

    const snap = await getDocs(q);
    const allGroups = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ChatRoom));
    
    // Client-side filter for case-insensitive search
    return allGroups.filter(g => g.name?.toLowerCase().includes(term));
  } catch (error) {
    console.error("searchPublicGroups Error:", error);
    return [];
  }
}

/**
 * Join an existing public group chat.
 */
export async function joinGroupChat(
  chatId: string,
  uid: string,
  name: string,
  avatar: string
): Promise<void> {
  const roomRef = doc(chatRoomsCol(), chatId);
  const snap = await getDoc(roomRef);
  
  if (!snap.exists()) throw new Error("Chat room not found.");
  
  const roomData = snap.data();
  if (!roomData.isPublic) throw new Error("This group is not public.");
  
  if ((roomData.participants || []).includes(uid)) {
    return; // Already a member
  }

  // Update room to include the new user
  await updateDoc(roomRef, {
    participants: [...(roomData.participants || []), uid],
    [`participantNames.${uid}`]: name,
    [`participantAvatars.${uid}`]: avatar,
    [`unreadCounts.${uid}`]: 0
  });

  // If this is a class group, also add the user to the corresponding ScheduleEvent
  if (roomData.isClassGroup && roomData.classId) {
    const classRef = doc(collection(db, "schedules"), roomData.classId);
    try {
      await updateDoc(classRef, {
        participants: arrayUnion(uid)
      });
    } catch (e) {
      console.warn("Failed to join schedule event linked to chat", e);
    }
  }
}

// ─── Real-time Chat Room List ─────────────────────────────────────────────────

/**
 * Subscribe to real-time updates for all chat rooms a user belongs to.
 * Returns an unsubscribe function.
 */
export function subscribeToChatRooms(
  uid: string,
  callback: (rooms: ChatRoom[]) => void
): Unsubscribe {
  const q = query(
    chatRoomsCol(),
    where("participants", "array-contains-any", [uid, "global"])
  );
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ChatRoom));
    // Sort rooms client-side by lastMessageTime descending
    rooms.sort((a, b) => {
      const t1 = a.lastMessageTime?.toMillis ? a.lastMessageTime.toMillis() : (a.lastMessageTime ? new Date(a.lastMessageTime as any).getTime() : 0);
      const t2 = b.lastMessageTime?.toMillis ? b.lastMessageTime.toMillis() : (b.lastMessageTime ? new Date(b.lastMessageTime as any).getTime() : 0);
      return t2 - t1;
    });
    callback(rooms);
  }, (error) => {
    console.error("subscribeToChatRooms error:", error);
    callback([]);
  });
}

// ─── Mark Room as Read ────────────────────────────────────────────────────────

/** Reset the unread count for a user in a specific chat room. */
export async function markRoomAsRead(
  chatId: string,
  uid: string
) {
  const roomRef = doc(db, "chatRooms", chatId);
  await updateDoc(roomRef, {
    [`unreadCounts.${uid}`]: 0,
    [`unreadCounts.global`]: 0,
  });
}

// ─── Presence ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time presence of another user.
 * Returns { isOnline, lastSeen } on each update.
 */
export function subscribeToOtherPresence(
  otherUid: string,
  callback: (isOnline: boolean, lastSeen: Timestamp | null) => void
): Unsubscribe {
  return onSnapshot(doc(usersCol(), otherUid), (snap) => {
    const data = snap.data();
    callback(data?.isOnline ?? false, data?.lastSeen ?? null);
  });
}

// ─── Typing Status ────────────────────────────────────────────────────────────

/** Update typing status in a chat room */
export async function setTypingStatus(
  chatId: string,
  uid: string,
  isTyping: boolean
): Promise<void> {
  const roomRef = doc(chatRoomsCol(), chatId);
  if (isTyping) {
    await updateDoc(roomRef, {
      [`typingUsers.${uid}`]: Date.now(),
    });
  } else {
    // We could delete the field but setting it to 0 is safer with Firestore rules
    await updateDoc(roomRef, {
      [`typingUsers.${uid}`]: 0,
    });
  }
}
