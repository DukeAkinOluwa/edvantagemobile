import { cacheMessages, getCachedMessages, getChatMessages, sendMessageToCloud } from '@/lib/chatService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import profileImage from '@/assets/images/dummy/Titilayo.jpg';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGlobalStyles } from '@/styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';

import { deleteChatMessages } from '@/lib/chatService';

type Message = {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
};

export default function ChatRoomScreen() {
  const globalStyles = useGlobalStyles();
  const router = useRouter();
  const { chatId, chatName } = useLocalSearchParams<{
    chatId?: string | string[];
    chatName?: string;
  }>();

  const id = Array.isArray(chatId) ? chatId[0] : chatId || '';
  const name = Array.isArray(chatName) ? chatName[0] : chatName || 'Chat';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [loading, setLoading] = useState(true);

  // Load cached + cloud messages
  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    (async () => {
      const cached = await getCachedMessages(id);
      if (isMounted) setMessages(cached);

      const cloud = await getChatMessages(id);
      if (isMounted) {
        setMessages(cloud.length ? cloud : cached); // prefer cloud
        cacheMessages(id, cloud);
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id]);

    const handleSend = async () => {
        if (!input.trim() || !id) return;

        const newMessage: Message = {
        id: Date.now().toString(),
        text: input.trim(),
        sender: 'me',
        timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInput('');
        cacheMessages(id, updatedMessages);
        await sendMessageToCloud(id, newMessage);
    };

    const handleDelete = () => {
        deleteChatMessages(id).then(() => {
            setMessages([]); // clear the messages in UI too
            console.log('Chat cleared.');
        });
    };

    return (
        <ThemedView style={styles.page}>
        {/* Header */}
        <ThemedView style={styles.profileHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrowContainer}>
            <FontAwesome6 name="angle-left" size={24} color="#2A52BE" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileInfo}>
            <Image source={profileImage} style={styles.avatar} />
            <ThemedText style={globalStyles.semiMediumText}>{name}</ThemedText>
            </TouchableOpacity>
        </ThemedView>

        {/* Chat */}
        {messages.length > 0 ? (
            <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            renderItem={({ item }) => (
                <ThemedView style={[styles.messageBubble, item.sender === 'me' ? styles.sent : styles.received]}>
                <ThemedText style={globalStyles.baseText}>{item.text}</ThemedText>
                </ThemedView>
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
                <Pressable onPress={handleDelete} style={styles.clearButton}>
                <Text style={styles.clearText}>Clear Chat History</Text>
                </Pressable>
            }
            />
        ) : !loading ? (
            <View style={styles.emptyView}>
            <ThemedText style={globalStyles.baseText}>No messages yet. Start the conversation!</ThemedText>
            </View>
        ) : null}

        {/* Input */}
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.inputContainer}
        >
            <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            placeholderTextColor="#999"
            />
            <ThemedText style={styles.sendButton} onPress={handleSend}>
            Send
            </ThemedText>
        </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        paddingBottom: 10,
    },
    backArrowContainer: {
        height: 35,
        width: 35,
        borderRadius: 8,
        backgroundColor: 'rgba(1, 119, 251, .1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        height: 60,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginLeft: 10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    messagesContainer: {
        padding: 15,
        gap: 10,
    },
    messageBubble: {
        maxWidth: '75%',
        borderRadius: 10,
        padding: 10,
    },
    sent: {
        backgroundColor: 'rgba(1, 119, 251, .1)',
        alignSelf: 'flex-end',
    },
    received: {
        backgroundColor: '#EEE',
        alignSelf: 'flex-start',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderTopWidth: 1,
        borderColor: '#DDD',
    },
    input: {
        flex: 1,
        fontSize: 16,
        padding: 8,
    },
    sendButton: {
        marginLeft: 10,
        fontWeight: '600',
        color: '#2A52BE',
    },
    emptyView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearButton: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#ff4444',
        borderRadius: 8,
        alignItems: 'center',
    },
    clearText: {
        color: 'white',
        fontWeight: 'bold',
    },
});