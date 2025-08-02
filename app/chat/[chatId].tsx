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

import { CalendarBlankIcon, CalendarPlusIcon, ClipboardTextIcon, FileArrowUpIcon, ImageIcon, PaperclipIcon } from "phosphor-react-native";

import { deleteChatMessages } from '@/lib/chatService';

import { useTheme } from '@/components/Header';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import { Modal } from 'react-native';

type Message = {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
};

type AttachmentType = 'timetable' | 'event' | 'task' | 'document' | 'image';

type Attachment = {
  id: string;
  type: AttachmentType;
  label: string;
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
    const [showAttachments, setShowAttachments] = useState(false);
    const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
    const [activeModal, setActiveModal] = useState<AttachmentType | null>(null);

    const { screenWidth, screenHeight } =  useResponsiveDimensions();
    const { theme, setThemeMode } = useTheme();


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

    // const handleSend = async () => {
    //     if (!input.trim() || !id) return;

    //     const newMessage: Message = {
    //     id: Date.now().toString(),
    //     text: input.trim(),
    //     sender: 'me',
    //     timestamp: new Date().toISOString(),
    //     };

    //     const updatedMessages = [...messages, newMessage];
    //     setMessages(updatedMessages);
    //     setInput('');
    //     cacheMessages(id, updatedMessages);
    //     await sendMessageToCloud(id, newMessage);
    // };

    const handleSend = async () => {
        if (!input.trim() && selectedAttachments.length === 0) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: input.trim() || '[Attachment]',
            sender: 'me',
            timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInput('');
        setSelectedAttachments([]);
        setShowAttachments(false);
        cacheMessages(id, updatedMessages);
        await sendMessageToCloud(id, newMessage);
    };


    const handleDelete = () => {
        deleteChatMessages(id).then(() => {
            setMessages([]); // clear the messages in UI too
            console.log('Chat cleared.');
        });
    };

    const renderModalContent = () => {
    switch (activeModal) {
        case 'timetable':
            return <Text>Add multiple tasks/events for Timetable</Text>;
        case 'event':
            return <Text>Add a single Event</Text>;
        case 'task':
            return <Text>Add a single Task</Text>;
        case 'document':
            return <Text>Select document from device</Text>;
        case 'image':
            return <Text>Select image from device</Text>;
        default:
            return null;
    }
    };

    const attachmentOptions: { type: AttachmentType; label: string; Icon: React.ElementType }[] = [
        { type: 'timetable', label: 'Timetable', Icon: CalendarPlusIcon },
        { type: 'event', label: 'Event', Icon: CalendarBlankIcon },
        { type: 'task', label: 'Task', Icon: ClipboardTextIcon },
        { type: 'document', label: 'Document', Icon: FileArrowUpIcon },
        { type: 'image', label: 'Image', Icon: ImageIcon },
    ];

    const responsiveStyles = StyleSheet.create({
        attachmentPicker: {
            width: screenWidth - 20,
            borderColor: theme.border,
            bottom: 5
        },
        profileHeader: {
            width: screenWidth,
        },
        messagesContainer: {
            width: screenWidth,
            height: screenHeight - 128,
        },
        attachmentItem: {
            width: (screenWidth - 72) / 4
        }
    })

    return (
        <ThemedView style={styles.page}>
        {/* Header */}
        <ThemedView style={[styles.profileHeader, responsiveStyles.profileHeader]}>
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
            contentContainerStyle={[styles.messagesContainer, responsiveStyles.messagesContainer]}
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
        
        {/* {showAttachments && (
            <View style={styles.attachmentPicker}>
                {(['timetable', 'event', 'task', 'document', 'image'] as AttachmentType[]).map((type) => (
                <TouchableOpacity
                    key={type}
                    style={styles.attachmentItem}
                    onPress={() => {
                    const newAttachment: Attachment = {
                        id: `${type}-${Date.now()}`,
                        type,
                        label: type.charAt(0).toUpperCase() + type.slice(1),
                    };
                    setSelectedAttachments((prev) => [...prev, newAttachment]);
                    }}
                >
                    <Text style={styles.attachmentLabel}>{type}</Text>
                </TouchableOpacity>
                ))}
            </View>
            )}

            {selectedAttachments.length > 0 && (
            <View style={styles.selectedAttachments}>
                {selectedAttachments.map((att) => (
                <View key={att.id} style={styles.attachmentTag}>
                    <Text style={styles.attachmentText}>{att.label}</Text>
                    <Pressable
                    onPress={() =>
                        setSelectedAttachments((prev) =>
                        prev.filter((item) => item.id !== att.id)
                        )
                    }
                    >
                    <Text style={styles.removeAttachment}>×</Text>
                    </Pressable>
                </View>
                ))}
            </View>
        )} */}

        {showAttachments && (
            <View style={[styles.attachmentPicker, responsiveStyles.attachmentPicker]}>
                {attachmentOptions.map(({ type, label, Icon }) => (
                <TouchableOpacity
                    key={type}
                    style={[styles.attachmentItem, responsiveStyles.attachmentItem]}
                    onPress={() => setActiveModal(type)}
                >
                    <Icon size={24} color="#2A52BE" weight="bold" />
                    <Text style={styles.attachmentLabel}>{label}</Text>
                </TouchableOpacity>
                ))}
            </View>
        )}

        <Modal
        visible={!!activeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
        >
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{activeModal?.toUpperCase()}</Text>
                {renderModalContent()}
                <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeModalBtn}>
                    <Text style={{ color: '#fff' }}>Close</Text>
                </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Input */}
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.inputContainer}
        >
            <TouchableOpacity onPress={() => setShowAttachments((prev) => !prev)}>
                <PaperclipIcon size={20} color="#2A52BE" />
            </TouchableOpacity>

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
        alignItems: 'center'
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
    attachmentPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        paddingBottom: 0,
        borderWidth: 1,
        borderRadius: 10,
        justifyContent: 'space-between',
    },
    attachmentItem: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    attachmentLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#2A52BE',
    },

    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    closeModalBtn: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#2A52BE',
        borderRadius: 6,
    },
});