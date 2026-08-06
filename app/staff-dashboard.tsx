import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { useTheme, NavigationHeader } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { FontAwesome6 } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

export default function StaffDashboard() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !user) return;
    
    setIsSending(true);
    try {
      await addDoc(collection(db, "broadcasts"), {
        message: broadcastMessage,
        authorId: user.uid,
        authorName: profile?.displayName || "Lecturer",
        createdAt: serverTimestamp(),
      });
      setBroadcastMessage("");
      Alert.alert("Success", "Broadcast sent to all students.");
    } catch (err) {
      Alert.alert("Error", "Failed to send broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title="Staff Portal" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <FontAwesome6 name="bullhorn" size={20} color="#2A52BE" />
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Global Broadcast</ThemedText>
          </View>
          <ThemedText style={{ color: theme.placeholder, fontSize: 12, marginBottom: 10 }}>
            Send a push notification and alert to all your students.
          </ThemedText>
          
          <TextInput
            style={[styles.inputArea, { color: theme.text, borderColor: theme.border }]}
            placeholder="Important announcement..."
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={4}
            value={broadcastMessage}
            onChangeText={setBroadcastMessage}
          />
          <TouchableOpacity 
            style={[styles.btn, isSending && { opacity: 0.5 }]} 
            onPress={handleSendBroadcast}
            disabled={isSending}
          >
            <Text style={styles.btnText}>{isSending ? "Sending..." : "Send Broadcast"}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <FontAwesome6 name="file-arrow-up" size={20} color="#2A52BE" />
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Assign Coursework</ThemedText>
          </View>
          <ThemedText style={{ color: theme.placeholder, fontSize: 12, marginBottom: 10 }}>
            Upload PDFs or assignments for a specific course.
          </ThemedText>
          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Select File</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <FontAwesome6 name="clipboard-user" size={20} color="#2A52BE" />
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Attendance Monitor</ThemedText>
          </View>
          <ThemedText style={{ color: theme.placeholder, fontSize: 12, marginBottom: 10 }}>
            View live attendance for your active classes.
          </ThemedText>
          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>View Rosters</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 15, paddingBottom: 50 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 5 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  inputArea: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, textAlignVertical: "top", minHeight: 100, marginBottom: 15 },
  btn: { backgroundColor: "#2A52BE", padding: 14, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  outlineBtn: { borderWidth: 1, borderColor: "#2A52BE", padding: 14, borderRadius: 8, alignItems: "center" },
  outlineBtnText: { color: "#2A52BE", fontWeight: "bold", fontSize: 16 },
});
