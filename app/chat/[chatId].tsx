// app/chat/[chatId].tsx
// Full-featured chat room:
//   • Real-time Firestore messages (onSnapshot)
//   • Optimistic send with status ticks (sending → sent → delivered → read)
//   • Online presence in header (green dot / last seen)
//   • Image sharing (camera or gallery)
//   • Document sharing
//   • Upload progress indicator

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/Header";
import {
  ChatRoom,
  getUserChatRooms,
  markRoomAsRead,
  Message,
  sendMessage,
  subscribeToMessages,
  subscribeToOtherPresence,
} from "@/lib/firestoreService";
import {
  formatFileSize,
  uploadChatDocument,
  uploadChatImage,
} from "@/lib/storageService";
import { FontAwesome6 } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMsgTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLastSeen(ts: Timestamp | null): string {
  if (!ts) return "last seen recently";
  const date = ts.toDate();
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "last seen just now";
  if (diff < 3_600_000) return `last seen ${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)
    return `last seen at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return `last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function getDocumentIcon(mime: string): string {
  if (mime.includes("pdf")) return "file-pdf";
  if (mime.includes("word") || mime.includes("document")) return "file-word";
  if (mime.includes("excel") || mime.includes("sheet")) return "file-excel";
  if (mime.includes("powerpoint") || mime.includes("presentation")) return "file-powerpoint";
  if (mime.includes("zip") || mime.includes("rar")) return "file-zipper";
  if (mime.includes("text")) return "file-lines";
  return "file";
}

// ─── Status Tick Component ────────────────────────────────────────────────────
// Displays WhatsApp-style message status:
//   ⏱  sending   (no Firestore timestamp yet)
//   ✓  sent      (in Firestore, other hasn't opened chat yet)
//   ✓✓ delivered (same as sent in Firestore — Firestore = delivered)
//   ✓✓ read      (other person opened the chat — unreadCount[them] === 0)

function StatusTick({
  message,
  isRead,
  myUid,
}: {
  message: Message;
  isRead: boolean;
  myUid: string;
}) {
  if (message.sender !== myUid) return null;

  // Still uploading / sending optimistically
  if (message.status === "sending" || !message.timestamp) {
    return <FontAwesome6 name="clock" size={10} color="rgba(255,255,255,0.6)" />;
  }

  if (message.status === "failed") {
    return <FontAwesome6 name="circle-exclamation" size={10} color="#ff4d4d" />;
  }

  // Determine read status from boolean prop
  // (calculated by parent to avoid passing full room object which causes re-renders)

  // Double tick — blue = read, grey = delivered
  return (
    <View style={{ flexDirection: "row", gap: -3 }}>
      <FontAwesome6
        name="check"
        size={10}
        color={isRead ? "#90D5FF" : "rgba(255,255,255,0.6)"}
      />
      <FontAwesome6
        name="check"
        size={10}
        color={isRead ? "#90D5FF" : "rgba(255,255,255,0.6)"}
      />
    </View>
  );
}

// ─── Image Viewer Modal ───────────────────────────────────────────────────────

function ImageViewer({
  uri,
  visible,
  onClose,
}: {
  uri: string;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.imageViewerBg} onPress={onClose}>
        <Image source={{ uri }} style={styles.imageViewerImg} resizeMode="contain" />
      </Pressable>
    </Modal>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = React.memo(function MessageBubble({
  item,
  isMe,
  isGroup,
  showSender,
  isRead,
  myUid,
  theme,
}: {
  item: Message;
  isMe: boolean;
  isGroup: boolean;
  showSender: boolean;
  isRead: boolean;
  myUid: string;
  theme: any;
}) {
  const [showImage, setShowImage] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const bubbleBg = isMe ? "#2A52BE" : theme.backgroundSecondary;
  const textColor = isMe ? "#fff" : theme.text;
  const timeColor = isMe ? "rgba(255,255,255,0.65)" : theme.placeholder;

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isMe ? styles.rowMe : styles.rowOther,
        { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
      ]}
    >
      {/* Avatar for other person in group chats */}
      {!isMe && isGroup && showSender && (
        item.senderAvatar
          ? <Image source={{ uri: item.senderAvatar }} style={styles.senderAvatar} />
          : <View style={[styles.senderAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{(item.senderName?.[0] ?? "?").toUpperCase()}</Text>
            </View>
      )}
      {!isMe && isGroup && !showSender && <View style={styles.avatarSpacer} />}

      <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapOther]}>
        {/* Sender name in group */}
        {!isMe && isGroup && showSender && (
          <Text style={[styles.senderName, { color: "#2A52BE" }]}>{item.senderName}</Text>
        )}

        {/* ── TEXT message ── */}
        {(item.type === "text" || !item.type) && (
          <View style={[styles.bubble, { backgroundColor: bubbleBg }, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, { color: textColor }]}>{item.text}</Text>
            <View style={styles.bubbleMeta}>
              <Text style={[styles.bubbleTime, { color: timeColor }]}>{formatMsgTime(item.timestamp)}</Text>
              <StatusTick message={item} isRead={isRead} myUid={myUid} />
            </View>
          </View>
        )}

        {/* ── IMAGE message ── */}
        {item.type === "image" && (
          <TouchableOpacity onPress={() => setShowImage(true)} activeOpacity={0.9}>
            <View style={[styles.bubble, styles.imageBubble, { backgroundColor: bubbleBg }, isMe ? styles.bubbleMe : styles.bubbleOther]}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.chatImage}
                  resizeMode="cover"
                />
              ) : (
                // Upload in progress
                <View style={[styles.chatImage, styles.uploadingImage]}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.uploadPct}>{item.uploadProgress ?? 0}%</Text>
                </View>
              )}
              <View style={styles.bubbleMetaOverlay}>
                <Text style={[styles.bubbleTime, { color: "#fff" }]}>{formatMsgTime(item.timestamp)}</Text>
                <StatusTick message={item} isRead={isRead} myUid={myUid} />
              </View>
            </View>
            <ImageViewer
              uri={item.imageUrl ?? ""}
              visible={showImage}
              onClose={() => setShowImage(false)}
            />
          </TouchableOpacity>
        )}

        {/* ── DOCUMENT message ── */}
        {item.type === "document" && (
          <TouchableOpacity
            onPress={() => item.documentUrl && Linking.openURL(item.documentUrl)}
            activeOpacity={0.8}
          >
            <View style={[styles.bubble, styles.docBubble, { backgroundColor: bubbleBg }, isMe ? styles.bubbleMe : styles.bubbleOther]}>
              <FontAwesome6
                name={getDocumentIcon(item.documentMime ?? "")}
                size={28}
                color={isMe ? "rgba(255,255,255,0.85)" : "#2A52BE"}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.docName, { color: textColor }]} numberOfLines={2}>
                  {item.documentName ?? "Document"}
                </Text>
                <Text style={[styles.docSize, { color: timeColor }]}>
                  {item.documentSize ? formatFileSize(item.documentSize) : ""}
                  {item.uploadProgress !== undefined && item.uploadProgress < 100
                    ? ` · ${item.uploadProgress}%`
                    : ""}
                </Text>
              </View>
              {(!item.documentUrl) ? (
                <ActivityIndicator size="small" color={isMe ? "#fff" : "#2A52BE"} />
              ) : (
                <FontAwesome6 name="download" size={14} color={timeColor} />
              )}
            </View>
            <View style={styles.docMeta}>
              <Text style={[styles.bubbleTime, { color: timeColor }]}>{formatMsgTime(item.timestamp)}</Text>
              <StatusTick message={item} isRead={isRead} myUid={myUid} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.status === next.item.status &&
    prev.item.uploadProgress === next.item.uploadProgress &&
    prev.item.imageUrl === next.item.imageUrl &&
    prev.isRead === next.isRead
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { chatId, name, isGroup } = useLocalSearchParams<{
    chatId: string;
    name: string;
    isGroup: string;
  }>();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLimit, setMessageLimit] = useState(30);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState<Timestamp | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const myUid = user?.uid ?? "";
  const myName =
    profile?.displayName ??
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const myAvatar = profile?.profilePic || "";
  const isGroupChat = isGroup === "true";
  const chatName = name ?? "Chat";

  // Load room metadata
  useEffect(() => {
    if (!myUid || !chatId) return;
    getUserChatRooms(myUid)
      .then((rooms) => {
        const found = rooms.find((r) => r.id === chatId);
        if (found) setRoom(found);
      })
      .catch(console.error);
  }, [chatId, myUid]);

  // Instantly load from cache to eliminate lag
  useEffect(() => {
    if (!chatId) return;
    AsyncStorage.getItem(`chat_messages_${chatId}`)
      .then((cached) => {
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.length > 0) {
              setMessages(parsed);
              setLoading(false);
            }
          } catch (e) {}
        }
      })
      .catch(console.error);
  }, [chatId]);

  // Real-time messages
  useEffect(() => {
    if (!chatId) return;
    markRoomAsRead(chatId, myUid).catch(console.error);
    const unsub = subscribeToMessages(chatId, messageLimit, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, [chatId, myUid, messageLimit]);

  // Presence subscription (1-on-1 only)
  useEffect(() => {
    if (isGroupChat || !room) return;
    const otherUid = room.participants.find((p) => p !== myUid);
    if (!otherUid) return;
    const unsub = subscribeToOtherPresence(otherUid, (online, lastSeen) => {
      setOtherOnline(online);
      setOtherLastSeen(lastSeen);
    });
    return unsub;
  }, [room, myUid, isGroupChat]);

  // ── Send helpers ────────────────────────────────────────────────────────────

  const doSend = useCallback(
    async (msgPayload: Omit<Message, "id" | "timestamp" | "status">) => {
      const pendingId = `pending_${Date.now()}_${Math.random()}`;
      const optimistic: Message = {
        ...msgPayload,
        id: pendingId,
        timestamp: null as any,
        status: "sending",
      };

      // Show immediately
      setMessages((prev) => [optimistic, ...prev]);

      try {
        const participants = room?.participants ?? [myUid];
        await sendMessage(chatId, msgPayload, myUid, participants);
        // onSnapshot will replace optimistic with real message
      } catch (err) {
        // Mark as failed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId ? { ...m, status: "failed" as const } : m
          )
        );
        console.error("Send error:", err);
      }
    },
    [chatId, myUid, room]
  );

  const handleSendText = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    try {
      await doSend({
        text,
        sender: myUid,
        senderName: myName,
        senderAvatar: myAvatar,
        type: "text",
      });
    } finally {
      setSending(false);
    }
  }, [input, sending, doSend, myUid, myName, myAvatar]);

  // ── Image picker ────────────────────────────────────────────────────────────

  const handlePickImage = useCallback(async (fromCamera: boolean) => {
    const pendingId = `pending_img_${Date.now()}`;

    const picker = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await picker({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    // Show placeholder immediately
    const placeholder: Message = {
      id: pendingId,
      text: "",
      sender: myUid,
      senderName: myName,
      senderAvatar: myAvatar,
      type: "image",
      imageUrl: asset.uri,   // local URI for instant preview
      uploadProgress: 0,
      status: "sending",
      timestamp: null as any,
    };
    setMessages((prev) => [placeholder, ...prev]);

    try {
      const { downloadUrl, fileSize } = await uploadChatImage(
        chatId,
        myUid,
        asset.uri,
        (pct) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === pendingId ? { ...m, uploadProgress: pct } : m))
          );
        }
      );
      // Replace placeholder with real Firestore message
      setMessages((prev) => prev.filter((m) => m.id !== pendingId));
      await doSend({
        text: "",
        sender: myUid,
        senderName: myName,
        senderAvatar: myAvatar,
        type: "image",
        imageUrl: downloadUrl,
        imageWidth: asset.width,
        imageHeight: asset.height,
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...m, status: "failed" as const } : m))
      );
      Alert.alert("Upload failed", "Could not upload image. Please try again.");
    }
  }, [chatId, myUid, myName, myAvatar, doSend]);

  // ── Document picker ─────────────────────────────────────────────────────────

  const handlePickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const pendingId = `pending_doc_${Date.now()}`;

    const placeholder: Message = {
      id: pendingId,
      text: "",
      sender: myUid,
      senderName: myName,
      senderAvatar: myAvatar,
      type: "document",
      documentName: asset.name,
      documentSize: asset.size ?? 0,
      documentMime: asset.mimeType ?? "application/octet-stream",
      uploadProgress: 0,
      status: "sending",
      timestamp: null as any,
    };
    setMessages((prev) => [...prev, placeholder]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const { downloadUrl } = await uploadChatDocument(
        chatId,
        myUid,
        asset.uri,
        asset.name,
        asset.mimeType ?? "application/octet-stream",
        (pct) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === pendingId ? { ...m, uploadProgress: pct } : m))
          );
        }
      );
      setMessages((prev) => prev.filter((m) => m.id !== pendingId));
      await doSend({
        text: "",
        sender: myUid,
        senderName: myName,
        senderAvatar: myAvatar,
        type: "document",
        documentUrl: downloadUrl,
        documentName: asset.name,
        documentSize: asset.size ?? 0,
        documentMime: asset.mimeType ?? "application/octet-stream",
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...m, status: "failed" as const } : m))
      );
      Alert.alert("Upload failed", "Could not upload document. Please try again.");
    }
  }, [chatId, myUid, myName, myAvatar, doSend]);

  // ── Attachment sheet ────────────────────────────────────────────────────────

  const showAttachmentOptions = useCallback(() => {
    setShowAttachMenu(true);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMe = item.sender === myUid;
      const prev = messages[index + 1];
      const showSender =
        !prev ||
        prev.sender !== item.sender ||
        (item.timestamp?.toMillis() ?? 0) - (prev.timestamp?.toMillis() ?? 0) > 60000;

      let isRead = false;
      if (room && !isGroupChat) {
        const otherUid = room.participants.find((p) => p !== myUid) ?? "";
        isRead = (room.unreadCounts?.[otherUid] ?? 0) === 0;
      } else if (room && isGroupChat) {
        isRead = room.participants
          .filter((p) => p !== myUid)
          .every((p) => (room.unreadCounts?.[p] ?? 0) === 0);
      }

      return (
        <MessageBubble
          item={item}
          isMe={isMe}
          isGroup={isGroupChat}
          showSender={showSender}
          isRead={isRead}
          myUid={myUid}
          theme={theme}
        />
      );
    },
    [myUid, isGroupChat, messages, room, theme]
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 50 : 20}
    >
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.border, paddingTop: insets.top + 8 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome6 name="angle-left" size={20} color="#2A52BE" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: theme.text }]} numberOfLines={1}>
            {chatName}
          </Text>
          {/* Online indicator for 1-on-1 */}
          {!isGroupChat && (
            <View style={styles.presenceRow}>
              <View style={[styles.presenceDot, { backgroundColor: otherOnline ? "#25D366" : "#aaa" }]} />
              <Text style={[styles.presenceText, { color: theme.placeholder }]}>
                {otherOnline ? "Online" : formatLastSeen(otherLastSeen)}
              </Text>
            </View>
          )}
          {/* Members count for group */}
          {isGroupChat && room && (
            <Text style={[styles.presenceText, { color: theme.placeholder }]}>
              {room.participants.length} members
            </Text>
          )}
        </View>
      </View>

      {/* ── Messages ── */}
      {loading ? (
        <ActivityIndicator size="large" color="#2A52BE" style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted={true}
          keyExtractor={(item) =>
            item.id ?? item.timestamp?.toString() ?? Math.random().toString()
          }
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onEndReached={() => setMessageLimit((prev) => prev + 30)}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <FontAwesome6 name="comment-dots" size={40} color={theme.placeholder} />
                <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                  No messages yet. Say hello! 👋
                </Text>
              </View>
            ) : null
          }
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      {/* ── Input Bar ── */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom || 12,
          },
        ]}
      >
        {/* Attachment button */}
        <TouchableOpacity onPress={showAttachmentOptions} style={styles.attachBtn}>
          <FontAwesome6 name="paperclip" size={18} color={theme.placeholder} />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.backgroundSecondary, color: theme.text },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={theme.placeholder}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
        />

        {/* Send button */}
        <TouchableOpacity
          onPress={handleSendText}
          style={[styles.sendBtn, { opacity: input.trim() ? 1 : 0.4 }]}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome6 name="paper-plane" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Attachment Menu ── */}
      <Modal
        visible={showAttachMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <Pressable style={styles.attachOverlay} onPress={() => setShowAttachMenu(false)}>
          <View style={[styles.attachSheet, { backgroundColor: theme.backgroundSecondary, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.attachHandle} />
            <View style={styles.attachOptionsRow}>
              <TouchableOpacity
                style={styles.attachOption}
                onPress={() => { setShowAttachMenu(false); handlePickImage(true); }}
              >
                <View style={[styles.attachIconBg, { backgroundColor: "#FF2D55" }]}>
                  <FontAwesome6 name="camera" size={24} color="#fff" />
                </View>
                <Text style={[styles.attachOptionText, { color: theme.text }]}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachOption}
                onPress={() => { setShowAttachMenu(false); handlePickImage(false); }}
              >
                <View style={[styles.attachIconBg, { backgroundColor: "#007AFF" }]}>
                  <FontAwesome6 name="image" size={24} color="#fff" />
                </View>
                <Text style={[styles.attachOptionText, { color: theme.text }]}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachOption}
                onPress={() => { setShowAttachMenu(false); handlePickDocument(); }}
              >
                <View style={[styles.attachIconBg, { backgroundColor: "#5856D6" }]}>
                  <FontAwesome6 name="file-lines" size={24} color="#fff" />
                </View>
                <Text style={[styles.attachOptionText, { color: theme.text }]}>Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(42,82,190,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "600" },
  presenceRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  presenceDot: { width: 7, height: 7, borderRadius: 4 },
  presenceText: { fontSize: 12 },

  // Messages
  messageList: { padding: 12, paddingBottom: 20 },
  bubbleRow: {
    flexDirection: "row",
    marginVertical: 2,
    alignItems: "flex-end",
  },
  rowMe: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubbleWrap: { maxWidth: "75%" },
  bubbleWrapMe: { alignItems: "flex-end" },
  bubbleWrapOther: { alignItems: "flex-start" },
  senderName: { fontSize: 11, fontWeight: "600", marginLeft: 4, marginBottom: 2 },
  senderAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 6 },
  avatarPlaceholder: {
    backgroundColor: "#2A52BE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#fff", fontSize: 12, fontWeight: "700" },
  avatarSpacer: { width: 34 },

  // Text bubble
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 3,
  },
  bubbleTime: { fontSize: 10 },

  // Image bubble
  imageBubble: { padding: 3, overflow: "hidden" },
  chatImage: { width: 220, height: 180, borderRadius: 12 },
  uploadingImage: {
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  uploadPct: { color: "#fff", fontSize: 12, fontWeight: "600" },
  bubbleMetaOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },

  // Document bubble
  docBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 200,
  },
  docName: { fontSize: 13, fontWeight: "500" },
  docSize: { fontSize: 11, marginTop: 2 },
  docMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 4,
  },

  // Image viewer
  imageViewerBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerImg: { width: "95%", height: "80%" },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 14 },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2A52BE",
    alignItems: "center",
    justifyContent: "center",
  },

  // Attachment Menu
  attachOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  attachSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  attachHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(150,150,150,0.3)",
    marginBottom: 20,
  },
  attachOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  attachOption: {
    alignItems: "center",
    gap: 8,
  },
  attachIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  attachOptionText: {
    fontSize: 13,
    fontWeight: "500",
  }
});
