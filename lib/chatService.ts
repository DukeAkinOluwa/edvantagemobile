// --- Cloud Fetch with Fallback to Mock ---

let mockMessagesStore: Record<string, any[]> = {
    '1': [
        { id: 'm1', text: 'Welcome to the chat!', sender: 'system', timestamp: Date.now() },
        { id: 'm2', text: 'Hi there!', sender: 'user', timestamp: Date.now() },
    ],
};

export async function getChatMessages(chatId: string) {
    try {
        const res = await fetch(`https://api.example.com/chats/${chatId}/messages`);

        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        
        const messages = await res.json();

        // Cache successful fetch
        await cacheMessages(chatId, messages);

        return messages;
    } catch (error) {
        console.warn(`Fetch failed, using mock or cached messages for chatId ${chatId}:`, error);

        // First try local cache
        const cached = await getCachedMessages(chatId);
        if (cached.length > 0) return cached;

        // Then fall back to mock
        return mockMessagesStore[chatId] || [];
    }
}

export async function sendMessageToCloud(chatId: string, message: any) {
    try {
        const res = await fetch(`https://api.example.com/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        });

        if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
    } catch (error) {
        console.warn(`Send failed, saving to mock store for chatId ${chatId}:`, error);

        // Update mock store
        if (!mockMessagesStore[chatId]) mockMessagesStore[chatId] = [];
        mockMessagesStore[chatId].push(message);
    }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getCachedMessages(chatId: string) {
    try {
        const data = await AsyncStorage.getItem(`chat_messages_${chatId}`);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error getting cached messages for chatId ${chatId}:`, error);
        return [];
    }
}

export async function cacheMessages(chatId: string, messages: any[]) {
    try {
        await AsyncStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
    } catch (error) {
        console.error(`Error caching messages for chatId ${chatId}:`, error);
    }
}

export async function deleteChatMessages(chatId: string) {
    try {
        await AsyncStorage.removeItem(`chat_messages_${chatId}`);
        console.log(`Deleted chat_messages_${chatId}`);
    } catch (error) {
        console.error(`Failed to delete messages for chatId ${chatId}:`, error);
    }
}