// lib/chatService.ts
// Chat service for Edvantae Mobile
// Uses Firestore real-time listeners with AsyncStorage as offline cache fallback

import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendMessage, subscribeToMessages } from "./firestoreService";

export type { Message } from "./firestoreService";

// ─── Real-time message subscription ──────────────────────────────────────────

/**
 * Subscribe to real-time messages for a chat room.
 * Falls back to cached messages if Firestore is unavailable.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function getChatMessages(
  chatId: string,
  onMessages: (messages: any[]) => void
): () => void {
  // Try to load cached messages immediately (optimistic UI)
  AsyncStorage.getItem(`chat_messages_${chatId}`)
    .then((cached) => {
      if (cached) {
        try {
          onMessages(JSON.parse(cached));
        } catch {
          // ignore parse error
        }
      }
    })
    .catch(console.error);

  // Subscribe to Firestore real-time updates
  const unsubscribe = subscribeToMessages(chatId, onMessages);
  return unsubscribe;
}

// ─── Send message ─────────────────────────────────────────────────────────────

/**
 * Send a message to a chat room via Firestore.
 * Falls back to local AsyncStorage cache on network failure.
 */
export async function sendMessageToCloud(
  chatId: string,
  message: { text: string; sender: string; senderName?: string; type?: "text" | "image" | "voice" },
  participantUids: string[] = []
): Promise<void> {
  try {
    await sendMessage(chatId, message, message.sender, participantUids);
  } catch (error) {
    console.warn(`Send failed, saving locally for chatId ${chatId}:`, error);
    // Append to local cache as fallback
    const cached = await getCachedMessages(chatId);
    cached.push({
      ...message,
      id: `local_${Date.now()}`,
      timestamp: { seconds: Math.floor(Date.now() / 1000) },
    });
    await cacheMessages(chatId, cached);
  }
}

// ─── Local cache helpers ──────────────────────────────────────────────────────

export async function getCachedMessages(chatId: string): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(`chat_messages_${chatId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting cached messages for chatId ${chatId}:`, error);
    return [];
  }
}

export async function cacheMessages(
  chatId: string,
  messages: any[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `chat_messages_${chatId}`,
      JSON.stringify(messages)
    );
  } catch (error) {
    console.error(`Error caching messages for chatId ${chatId}:`, error);
  }
}

export async function deleteChatMessages(chatId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`chat_messages_${chatId}`);
    console.log(`Deleted chat_messages_${chatId}`);
  } catch (error) {
    console.error(`Failed to delete messages for chatId ${chatId}:`, error);
  }
}