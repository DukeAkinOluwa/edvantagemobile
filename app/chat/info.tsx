import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, TextInput } from "react-native";
import { useTheme, NavigationHeader } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { FontAwesome6 } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ChatInfoScreen() {
  const { chatId, isGroup, name } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadInfo() {
      try {
        const roomDoc = await getDoc(doc(db, "chatRooms", chatId as string));
        if (roomDoc.exists()) {
          setInfo(roomDoc.data());
        }
      } catch (err) {
        console.error("Failed to load chat info:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInfo();
  }, [chatId]);

  const isGroupChat = isGroup === "true";

  const getFilteredParticipants = () => {
    if (!info?.participants) return [];
    
    return info.participants.filter((uid: string) => {
      const pName = (info.participantNames?.[uid] || (uid === "global" ? "Global Broadcast" : "Unknown User")).toLowerCase();
      return pName.includes(searchQuery.toLowerCase());
    });
  };

  const filteredParticipants = getFilteredParticipants();

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title="Chat Info" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <FontAwesome6 name={isGroupChat ? "users" : "user"} size={40} color="#fff" />
          </View>
          <ThemedText style={[styles.name, { color: theme.text }]}>{name}</ThemedText>
          <ThemedText style={[styles.type, { color: theme.placeholder }]}>
            {isGroupChat ? "Group Chat" : "Direct Message"}
          </ThemedText>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, marginBottom: 20 }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Details</ThemedText>
              
              <View style={styles.detailRow}>
                <FontAwesome6 name="clock" size={14} color={theme.placeholder} />
                <ThemedText style={[styles.detailText, { color: theme.placeholder }]}>
                  Created: {info?.createdAt ? new Date(info.createdAt).toLocaleDateString() : "Unknown"}
                </ThemedText>
              </View>
              
              {isGroupChat && (
                <View style={styles.detailRow}>
                  <FontAwesome6 name={info?.isPublic ? "globe" : "lock"} size={14} color={theme.placeholder} />
                  <ThemedText style={[styles.detailText, { color: theme.placeholder }]}>
                    {info?.isPublic ? "Public Group (Discoverable)" : "Private Group"}
                  </ThemedText>
                </View>
              )}
            </View>

            {isGroupChat && (
              <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, paddingBottom: 10 }]}>
                <View style={styles.membersHeader}>
                  <ThemedText style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                    Members ({info?.participants?.length || 0})
                  </ThemedText>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
                  <FontAwesome6 name="magnifying-glass" size={14} color={theme.placeholder} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search members..."
                    placeholderTextColor={theme.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {/* Participants List */}
                <View style={styles.participantsList}>
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((uid: string) => {
                      const pName = info.participantNames?.[uid] || (uid === "global" ? "Global Broadcast" : "Unknown User");
                      const pAvatar = info.participantAvatars?.[uid];

                      return (
                        <View key={uid} style={[styles.participantItem, { borderBottomColor: theme.border }]}>
                          {pAvatar ? (
                            <Image source={{ uri: pAvatar }} style={styles.participantAvatar} />
                          ) : (
                            <View style={styles.participantAvatarPlaceholder}>
                              <Text style={styles.participantAvatarInitial}>
                                {pName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <ThemedText style={[styles.participantName, { color: theme.text }]}>
                            {pName}
                          </ThemedText>
                        </View>
                      );
                    })
                  ) : (
                    <ThemedText style={{ color: theme.placeholder, textAlign: "center", marginTop: 15, marginBottom: 10 }}>
                      No members found.
                    </ThemedText>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#2A52BE',
    alignItems: 'center', justifyContent: 'center', marginBottom: 15,
  },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  type: { fontSize: 16 },
  card: { borderWidth: 1, borderRadius: 12, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  detailText: { fontSize: 15 },
  membersHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  participantsList: {
    marginTop: 5,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  participantAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A52BE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  participantAvatarInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  participantName: {
    fontSize: 16,
    fontWeight: "500",
  }
});
