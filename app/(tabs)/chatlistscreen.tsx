// app/(tabs)/chatlistscreen.tsx
// Real-time chat list powered by Firestore
// Supports 1-on-1 and group chats with unread badge, user search, and new chat creation

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/Header";
import {
  ChatRoom,
  createGroupChat,
  getOrCreateDirectChat,
  searchUsers,
  searchPublicGroups,
  joinGroupChat,
  subscribeToChatRooms,
  markRoomAsRead,
  UserProfile,
} from "@/lib/firestoreService";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  ScrollView,
} from "react-native";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: any): string {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getRoomDisplayInfo(room: ChatRoom, myUid: string) {
  if (room.isGroup) {
    return {
      name: room.name,
      avatar: room.avatarUrl || null,
    };
  }
  // 1-on-1: show the other person's details
  const otherUid = room.participants.find((p) => p !== myUid) ?? "";
  return {
    name: room.participantNames?.[otherUid] ?? room.name,
    avatar: room.participantAvatars?.[otherUid] ?? null,
  };
}
// ─── Chat Room Item ───────────────────────────────────────────────────────────

const ChatRoomItem = React.memo(function ChatRoomItem({
  item,
  myUid,
  theme,
  onPress,
}: {
  item: ChatRoom;
  myUid: string;
  theme: any;
  onPress: (room: ChatRoom) => void;
}) {
  const { name, avatar } = getRoomDisplayInfo(item, myUid);
  // Include 'global' fallback since dummy chats use it
  const unread = (item.unreadCounts?.[myUid] || 0) + (item.unreadCounts?.global || 0);

  return (
    <TouchableOpacity
      style={[styles.roomItem, { borderBottomColor: theme.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      ) : item.isGroup ? (
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: item.isClassGroup ? "#2A52BE" : "#4CAF50" }]}>
          <FontAwesome6 name={item.isClassGroup ? "graduation-cap" : "user-group"} size={20} color="#fff" />
        </View>
      ) : (
        <Image source={require("@/assets/images/default-avatar.jpg")} style={styles.avatar} />
      )}

      {/* Info */}
      <View style={styles.roomInfo}>
        <View style={styles.roomHeader}>
          <Text
            style={[styles.roomName, { color: theme.text }, unread > 0 && styles.bold]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={[styles.roomTime, { color: theme.placeholder }]}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.roomFooter}>
          <Text
            style={[
              styles.lastMessage,
              { color: unread > 0 ? theme.text : theme.placeholder },
              unread > 0 && styles.bold,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || "No messages yet"}
          </Text>
          {unread > 0 && (
            <View style={[styles.readDot, { backgroundColor: "#2A52BE", borderColor: "#2A52BE" }]} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prev, next) => {
  const prevUnread = (prev.item.unreadCounts?.[prev.myUid] ?? 0) + (prev.item.unreadCounts?.global ?? 0);
  const nextUnread = (next.item.unreadCounts?.[next.myUid] ?? 0) + (next.item.unreadCounts?.global ?? 0);

  return (
    prev.item.id === next.item.id &&
    prev.item.lastMessageTime === next.item.lastMessageTime &&
    prev.item.lastMessage === next.item.lastMessage &&
    prevUnread === nextUnread
  );
});

// ─── New Chat Modal ───────────────────────────────────────────────────────────

function NewChatModal({
  visible,
  onClose,
  myUid,
  myName,
  myAvatar,
  onChatCreated,
}: {
  visible: boolean;
  onClose: () => void;
  myUid: string;
  myName: string;
  myAvatar?: string;
  onChatCreated: (chatId: string) => void;
}) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile[]>([]);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<any>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      clearTimeout(debounceRef.current);
      if (!text.trim()) { setResults([]); return; }
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const users = await searchUsers(text, myUid);
          setResults(users);
        } finally {
          setSearching(false);
        }
      }, 350);
    },
    [myUid]
  );

  const handleSelectUser = async (user: UserProfile) => {
    if (isGroupMode) {
      setSelected((prev) =>
        prev.find((u) => u.uid === user.uid)
          ? prev.filter((u) => u.uid !== user.uid)
          : [...prev, user]
      );
    } else {
      // Instantly start direct chat
      setCreating(true);
      try {
        const chatId = await getOrCreateDirectChat(
          myUid, myName, myAvatar || "",
          user.uid!, user.displayName ?? `${user.firstName} user.lastName`,
          user.profilePic
        );
        onClose();
        onChatCreated(chatId);
      } catch (err) {
        Alert.alert("Error", "Could not start chat. Please try again.");
        console.error(err);
      } finally {
        setCreating(false);
      }
    }
  };

  const handleStartGroup = async () => {
    if (selected.length === 0) return;
    setCreating(true);
    try {
      const name = groupName.trim() || selected.map((u) => u.firstName).join(", ");
      const uids = [myUid, ...selected.map((u) => u.uid!)];
      const names: Record<string, string> = { [myUid]: myName };
      const avatars: Record<string, string> = { [myUid]: myAvatar ?? "" };
      selected.forEach((u) => {
        names[u.uid!] = u.displayName ?? `${u.firstName} ${u.lastName}`;
        avatars[u.uid!] = u.profilePic ?? "";
      });
      const chatId = await createGroupChat(name, uids, names, avatars, isPublic);
      
      onClose();
      onChatCreated(chatId);
    } catch (err) {
      Alert.alert("Error", "Could not start group chat. Please try again.");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Reset mode when closing
  const handleClose = () => {
    setIsGroupMode(false);
    setSelected([]);
    setGroupName("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.modal, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose}>
            <FontAwesome6 name="xmark" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {isGroupMode ? "New Group" : "New Chat"}
          </Text>
          {isGroupMode ? (
            <TouchableOpacity
              onPress={handleStartGroup}
              disabled={selected.length === 0 || creating}
            >
              {creating
                ? <ActivityIndicator color={theme.primary} />
                : <Text style={[styles.startBtn, { color: selected.length > 0 ? "#2A52BE" : theme.placeholder }]}>
                    Create
                  </Text>
              }
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} /> /* Placeholder for balance */
          )}
        </View>

        {/* Group name input (shown when in group mode) */}
        {isGroupMode && (
          <View style={{ marginBottom: 15 }}>
            <TextInput
              style={[styles.groupNameInput, { borderColor: theme.border, color: theme.text, marginBottom: 10 }]}
              placeholder="Group name (optional)"
              placeholderTextColor={theme.placeholder}
              value={groupName}
              onChangeText={setGroupName}
            />
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 5 }}>
              <Text style={{ color: theme.text, flex: 1, fontSize: 14 }}>Make group public (discoverable)</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: "#767577", true: "#2A52BE" }} />
            </View>
          </View>
        )}

        {/* Selected chips */}
        {selected.length > 0 && (
          <View style={styles.chipsRow}>
            {selected.map((u) => (
              <TouchableOpacity
                key={u.uid}
                style={styles.chip}
                onPress={() => handleSelectUser(u)}
              >
                <Text style={styles.chipText}>{u.firstName}</Text>
                <FontAwesome6 name="xmark" size={10} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search input */}
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
          <FontAwesome6 name="magnifying-glass" size={14} color={theme.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search name or email..."
            placeholderTextColor={theme.placeholder}
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {searching && <ActivityIndicator size="small" color={theme.placeholder} />}
        </View>

        {!isGroupMode && (
          <TouchableOpacity
            style={styles.createGroupBtn}
            onPress={() => setIsGroupMode(true)}
          >
            <View style={styles.createGroupIcon}>
              <FontAwesome6 name="user-group" size={16} color="#fff" />
            </View>
            <Text style={[styles.createGroupText, { color: theme.text }]}>New Group</Text>
          </TouchableOpacity>
        )}

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.uid!}
          renderItem={({ item }) => {
            const isChecked = !!selected.find((u) => u.uid === item.uid);
            return (
              <TouchableOpacity
                style={styles.userRow}
                onPress={() => handleSelectUser(item)}
              >
                <Image 
                  source={item.profilePic ? { uri: item.profilePic } : require("@/assets/images/default-avatar.jpg")} 
                  style={styles.userAvatar} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {item.displayName ?? `${item.firstName} ${item.lastName}`}
                  </Text>
                  <Text style={[styles.userEmail, { color: theme.placeholder }]}>
                    {item.email}
                  </Text>
                </View>
                {isGroupMode && (
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <FontAwesome6 name="check" size={12} color="#fff" />}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: theme.placeholder }}>No conversations yet.</Text>
            </View>
          }
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatsScreen() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "discover">("chats");
  const [displayLimit, setDisplayLimit] = useState(15); // Infinity scroll
  const [chatQuery, setChatQuery] = useState("");
  
  // Discover State
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [publicGroups, setPublicGroups] = useState<ChatRoom[]>([]);
  const [searchingGroups, setSearchingGroups] = useState(false);
  const discoverDebounceRef = useRef<any>(null);

  const fabAnim = useRef(new Animated.Value(0)).current;

  const myUid = user?.uid ?? "";
  const myName = profile?.displayName ?? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const myAvatar = profile?.profilePic;

  useEffect(() => {
    if (!myUid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToChatRooms(myUid, (data) => {
      setRooms(data);
      setLoading(false);
    });
    return unsub;
  }, [myUid]);

  // FAB pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(fabAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const isNavigating = useRef(false);

  const openRoom = async (room: ChatRoom) => {
    if (isNavigating.current || !room.id) return;
    isNavigating.current = true;
    
    try {
      // Fire and forget so it doesn't block navigation
      markRoomAsRead(room.id, myUid).catch(err => {
        console.error("Failed to mark room as read:", err);
      });
      
      const { name } = getRoomDisplayInfo(room, myUid);
      router.push(`/chat/${room.id}?name=${encodeURIComponent(name)}&isGroup=${room.isGroup}&isClassGroup=${room.isClassGroup || false}&classId=${room.classId || ''}`);
    } catch (err) {
      console.error("Navigation error opening chat:", err);
    } finally {
      // Release lock after a short delay
      setTimeout(() => {
        isNavigating.current = false;
      }, 500);
    }
  };

  const handleSearchGroups = useCallback(
    (text: string) => {
      setDiscoverQuery(text);
      clearTimeout(discoverDebounceRef.current);
      if (!text.trim()) { setPublicGroups([]); return; }
      discoverDebounceRef.current = setTimeout(async () => {
        setSearchingGroups(true);
        try {
          const groups = await searchPublicGroups(text);
          setPublicGroups(groups);
        } finally {
          setSearchingGroups(false);
        }
      }, 350);
    },
    []
  );

  const handleJoinGroup = async (group: ChatRoom) => {
    if (!group.id) return;
    try {
      await joinGroupChat(group.id, myUid, myName, myAvatar || "");
      setActiveTab("chats");
      router.push(`/chat/${group.id}?name=${encodeURIComponent(group.name)}&isGroup=true&isClassGroup=${group.isClassGroup || false}&classId=${group.classId || ''}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to join group");
    }
  };

  // Filter state
  const [chatFilter, setChatFilter] = useState<"all" | "groups" | "unread" | "read">("all");

  const renderRoom = useCallback(({ item }: { item: ChatRoom }) => {
    return (
      <ChatRoomItem
        item={item}
        myUid={myUid}
        theme={theme}
        onPress={openRoom}
      />
    );
  }, [myUid, theme, openRoom]);

  // Filter and slice for infinite scroll
  const filteredRooms = rooms.filter((r) => {
    if (chatQuery) {
      const { name } = getRoomDisplayInfo(r, myUid);
      if (!name.toLowerCase().includes(chatQuery.toLowerCase())) return false;
    }
    
    if (chatFilter === "groups") {
      if (!r.isGroup) return false;
    } else if (chatFilter === "unread") {
      const unread = r.unreadCounts?.[myUid] || 0;
      if (unread === 0) return false;
    } else if (chatFilter === "read") {
      const unread = r.unreadCounts?.[myUid] || 0;
      if (unread > 0) return false;
    }

    return true;
  });
  const displayedRooms = filteredRooms.slice(0, displayLimit);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
        
        {/* Global Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
          <FontAwesome6 name="magnifying-glass" size={14} color={theme.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search chats..."
            placeholderTextColor={theme.placeholder}
            value={chatQuery}
            onChangeText={setChatQuery}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 15 }} contentContainerStyle={{ gap: 10 }}>
          {(["all", "groups", "unread", "read"] as const).map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[
                styles.filterChip, 
                { borderColor: theme.border },
                chatFilter === filter && { backgroundColor: "#2A52BE", borderColor: "#2A52BE" }
              ]}
              onPress={() => setChatFilter(filter)}
            >
              <Text style={[
                styles.filterChipText, 
                { color: chatFilter === filter ? "#fff" : theme.text }
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2A52BE" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayedRooms}
          keyExtractor={(item) => item.id!}
          renderItem={renderRoom}
          contentContainerStyle={displayedRooms.length === 0 ? styles.emptyContainer : { paddingBottom: 100 }}
          onEndReached={() => {
            if (displayLimit < rooms.length) {
              setDisplayLimit(prev => prev + 15);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome6 name="comments" size={48} color={theme.placeholder} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No conversations found</Text>
              <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                Try changing your filters or search.
              </Text>
            </View>
          }
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      {/* FAB */}
      <Animated.View
        style={[styles.fab, {
          transform: [{ scale: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }]
        }]}
      >
        <TouchableOpacity onPress={() => setShowNewChat(true)} style={styles.fabInner}>
          <FontAwesome6 name="pen-to-square" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* New Chat Modal */}
      <NewChatModal
        visible={showNewChat}
        onClose={() => setShowNewChat(false)}
        myUid={myUid}
        myName={myName}
        myAvatar={myAvatar}
        onChatCreated={(chatId) => router.push(`/chat/${chatId}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", marginBottom: 15 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  avatarPlaceholder: {
    backgroundColor: "#2A52BE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#fff", fontSize: 20, fontWeight: "700" },
  roomInfo: { flex: 1 },
  roomHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  roomName: { fontSize: 15, flex: 1, marginRight: 8 },
  roomTime: { fontSize: 11 },
  roomFooter: { flexDirection: "row", alignItems: "center" },
  lastMessage: { fontSize: 13, flex: 1 },
  bold: { fontWeight: "700" },
  readDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
  },
  fabInner: {
    backgroundColor: "#2A52BE",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A52BE",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 10 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  // Modal
  modal: { flex: 1, paddingTop: Platform.OS === "ios" ? 50 : 20 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  startBtn: { fontSize: 16, fontWeight: "600" },
  groupNameInput: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A52BE",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  chipText: { color: "#fff", fontSize: 13 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  userAvatar: { width: 44, height: 44, borderRadius: 22 },
  userName: { fontSize: 15, fontWeight: "500" },
  userEmail: { fontSize: 12, marginTop: 1 },
  joinBtn: {
    backgroundColor: "#2A52BE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  createGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(100,100,100,0.2)",
  },
  createGroupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2A52BE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#2A52BE",
    borderColor: "#2A52BE",
  }
});
