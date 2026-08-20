import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
} from "react-native";
import { NavigationHeader } from "@/components/Header";
import { useTheme } from "@/components/HeaderContext";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { FontAwesome6 } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { subscribeUserSchedule, createScheduleEvent, ScheduleEvent } from "@/lib/scheduleService";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";

const isClassActive = (startTime: number, endTime: number): boolean => {
  const now = Date.now();
  return now >= startTime - 30 * 60 * 1000 && now <= endTime + 10 * 60 * 1000;
};

export default function StaffDashboard() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Attendance sessions list state
  const [classes, setClasses] = useState<ScheduleEvent[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Form Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [locationName, setLocationName] = useState("");
  const [classroomLat, setClassroomLat] = useState("");
  const [classroomLon, setClassroomLon] = useState("");
  const [classroomRadius, setClassroomRadius] = useState("100");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);

  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  // Subscribe to classes in real-time
  useEffect(() => {
    if (!user) return;
    setLoadingClasses(true);
    const unsubscribe = subscribeUserSchedule(user.uid, "lecturer", (data) => {
      setClasses(data);
      setLoadingClasses(false);
    });
    return unsubscribe;
  }, [user]);

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

  const handleGetCurrentLocation = async () => {
    setFetchingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow location access to fetch coordinates.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setClassroomLat(pos.coords.latitude.toString());
      setClassroomLon(pos.coords.longitude.toString());
      Alert.alert("Success", "GPS coordinates populated successfully!");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to retrieve location coordinates.");
    } finally {
      setFetchingGps(false);
    }
  };

  const handleCreateSession = async () => {
    if (!title || !courseCode || !locationName || !classroomLat || !classroomLon || !user || !profile) {
      Alert.alert("Missing Fields", "Please complete all fields to schedule.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createScheduleEvent({
        title,
        courseCode,
        location: locationName,
        classroomLat: parseFloat(classroomLat),
        classroomLon: parseFloat(classroomLon),
        classroomRadius: parseFloat(classroomRadius) || 100,
        lecturerId: user.uid,
        lecturerName: profile.displayName || `${profile.firstName} ${profile.lastName}`,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        participants: [],
      });

      setModalVisible(false);
      // Reset fields
      setTitle("");
      setCourseCode("");
      setLocationName("");
      setClassroomLat("");
      setClassroomLon("");
      setClassroomRadius("100");
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 60 * 60 * 1000));
      Alert.alert("Success", "Class session created successfully!");
    } catch (e) {
      console.error("Error creating session:", e);
      Alert.alert("Error", "Failed to create class session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title="Staff Portal" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        
        {/* Coursework Quick-Link Banner */}
        <TouchableOpacity
          style={[styles.bannerCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, marginBottom: 10 }]}
          onPress={() => router.push("/(tabs)/resources")}
        >
          <FontAwesome6 name="file-arrow-up" size={22} color="#2A52BE" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: "bold", fontSize: 15 }}>Upload Coursework</ThemedText>
            <ThemedText style={{ color: theme.placeholder, fontSize: 11 }}>Add PDFs, lecture slides, or coursework files.</ThemedText>
          </View>
          <FontAwesome6 name="chevron-right" size={14} color={theme.placeholder} />
        </TouchableOpacity>

        {/* Assignments Quick-Link Banner */}
        <TouchableOpacity
          style={[styles.bannerCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, marginBottom: 20 }]}
          onPress={() => router.push("/assignments")}
        >
          <FontAwesome6 name="check-to-slot" size={22} color="#4CAF50" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: "bold", fontSize: 15 }}>Assignments & Grading</ThemedText>
            <ThemedText style={{ color: theme.placeholder, fontSize: 11 }}>Review submissions and use AI Auto-Grade.</ThemedText>
          </View>
          <FontAwesome6 name="chevron-right" size={14} color={theme.placeholder} />
        </TouchableOpacity>

        {/* Global Broadcast Card */}
        <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <FontAwesome6 name="bullhorn" size={18} color="#2A52BE" />
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Global Broadcast</ThemedText>
          </View>
          <ThemedText style={{ color: theme.placeholder, fontSize: 12, marginBottom: 10 }}>
            Send an important announcement to all your students.
          </ThemedText>

          <TextInput
            style={[styles.inputArea, { color: theme.text, borderColor: theme.border }]}
            placeholder="Important announcement..."
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={3}
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

        {/* Attendance Sessions Section */}
        <View style={[styles.card, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <FontAwesome6 name="clipboard-user" size={18} color="#2A52BE" />
            <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Attendance Controller</ThemedText>
          </View>
          <ThemedText style={{ color: theme.placeholder, fontSize: 12, marginBottom: 12 }}>
            Start geofenced class check-ins and monitor live rosters.
          </ThemedText>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => setModalVisible(true)}
          >
            <FontAwesome6 name="circle-plus" size={14} color="#2A52BE" style={{ marginRight: 6 }} />
            <Text style={styles.outlineBtnText}>Start Check-In Session</Text>
          </TouchableOpacity>

          {/* List of Active / Scheduled classes */}
          <ThemedText style={{ fontSize: 14, fontWeight: "bold", marginTop: 20, marginBottom: 10, color: theme.text }}>
            Class Sessions
          </ThemedText>

          {loadingClasses && classes.length === 0 ? (
            <ActivityIndicator size="small" color="#2A52BE" />
          ) : (
            <View style={{ gap: 10 }}>
              {classes.slice(0, 5).map((item) => {
                const active = isClassActive(item.startTime, item.endTime);
                const past = Date.now() > item.endTime;

                let statusLabel = "Upcoming";
                let statusColor = "#FF9800";
                if (active) {
                  statusLabel = "Active";
                  statusColor = "#4CAF50";
                } else if (past) {
                  statusLabel = "Completed";
                  statusColor = theme.placeholder;
                }

                const timeStr = `${new Date(item.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.sessionRow,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        borderLeftColor: statusColor,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontWeight: "bold", fontSize: 13, color: theme.text }}>
                        {item.courseCode}
                      </ThemedText>
                      <Text style={{ color: theme.placeholder, fontSize: 11 }}>
                        {timeStr} · {item.location}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end", gap: 5 }}>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
                        <Text style={{ color: statusColor, fontSize: 9, fontWeight: "bold" }}>
                          {statusLabel}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.monitorBtn, { backgroundColor: active ? "#2A52BE" : theme.border }]}
                        onPress={() => router.push({
                          pathname: "/attendance-monitor",
                          params: { classId: item.id, courseCode: item.courseCode }
                        })}
                      >
                        <Text style={[styles.monitorBtnText, { color: active ? "#fff" : theme.text }]}>
                          {active ? "Monitor" : "View"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {classes.length === 0 && (
                <Text style={{ color: theme.placeholder, fontSize: 12, textAlign: "center", marginVertical: 10 }}>
                  No sessions created yet.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Start Session Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <FlatList
              data={[1]}
              keyExtractor={() => "form"}
              renderItem={() => (
                <View>
                  <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Start Check-In Session</ThemedText>

                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Course Code (e.g. CSC 401)"
                    placeholderTextColor={theme.placeholder}
                    value={courseCode}
                    onChangeText={setCourseCode}
                  />

                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Class Title (e.g. HCI Lecture)"
                    placeholderTextColor={theme.placeholder}
                    value={title}
                    onChangeText={setTitle}
                  />

                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Lecture Hall Name (e.g. Hall 1)"
                    placeholderTextColor={theme.placeholder}
                    value={locationName}
                    onChangeText={setLocationName}
                  />

                  <ThemedText style={{ fontSize: 13, fontWeight: "600", marginBottom: 5, color: theme.text }}>Classroom GPS Geofence</ThemedText>
                  
                  <View style={styles.gpsRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border, marginBottom: 0 }]}
                      placeholder="Latitude"
                      placeholderTextColor={theme.placeholder}
                      keyboardType="decimal-pad"
                      value={classroomLat}
                      onChangeText={setClassroomLat}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border, marginBottom: 0 }]}
                      placeholder="Longitude"
                      placeholderTextColor={theme.placeholder}
                      keyboardType="decimal-pad"
                      value={classroomLon}
                      onChangeText={setClassroomLon}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.gpsBtn, { borderColor: theme.primary }]}
                    onPress={handleGetCurrentLocation}
                    disabled={fetchingGps}
                  >
                    {fetchingGps ? (
                      <ActivityIndicator size="small" color="#2A52BE" />
                    ) : (
                      <>
                        <FontAwesome6 name="location-crosshairs" size={14} color="#2A52BE" style={{ marginRight: 6 }} />
                        <Text style={{ color: "#2A52BE", fontWeight: "bold", fontSize: 12 }}>Use My Location</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, marginTop: 12 }]}
                    placeholder="Check-In Radius in meters (default: 100)"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="number-pad"
                    value={classroomRadius}
                    onChangeText={setClassroomRadius}
                  />

                  <ThemedText style={{ fontSize: 13, fontWeight: "600", marginVertical: 8, color: theme.text }}>Schedule Window</ThemedText>

                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                    <TouchableOpacity
                      style={[styles.pickerToggle, { borderColor: theme.border, flex: 1 }]}
                      onPress={() => setShowStartDate(true)}
                    >
                      <Text style={{ color: theme.text, fontSize: 13 }}>{startTime.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pickerToggle, { borderColor: theme.border, flex: 1 }]}
                      onPress={() => setShowStartTime(true)}
                    >
                      <Text style={{ color: theme.text, fontSize: 13 }}>Start: {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                    <TouchableOpacity
                      style={[styles.pickerToggle, { borderColor: theme.border, flex: 1 }]}
                      onPress={() => setShowEndTime(true)}
                    >
                      <Text style={{ color: theme.text, fontSize: 13 }}>End: {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                    </TouchableOpacity>
                  </View>

                  {showStartDate && (
                    <DateTimePicker
                      value={startTime}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        setShowStartDate(false);
                        if (date) {
                          const newStart = new Date(startTime);
                          newStart.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                          setStartTime(newStart);
                          const newEnd = new Date(endTime);
                          newEnd.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                          setEndTime(newEnd);
                        }
                      }}
                    />
                  )}

                  {showStartTime && (
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      display="default"
                      onChange={(event, date) => {
                        setShowStartTime(false);
                        if (date) setStartTime(date);
                      }}
                    />
                  )}

                  {showEndTime && (
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      display="default"
                      onChange={(event, date) => {
                        setShowEndTime(false);
                        if (date) setEndTime(date);
                      }}
                    />
                  )}

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: theme.border }]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: theme.primary }, isSubmitting && { opacity: 0.6 }]}
                      onPress={handleCreateSession}
                      disabled={isSubmitting}
                    >
                      <Text style={[styles.btnText, { color: theme.secondary }]}>
                        {isSubmitting ? "Creating..." : "Start Session"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 15, paddingBottom: 50 },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 5 },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  inputArea: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, textAlignVertical: "top", minHeight: 80, marginBottom: 15 },
  btn: { backgroundColor: "#2A52BE", padding: 14, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  outlineBtn: { flexDirection: "row", borderWidth: 1, borderColor: "#2A52BE", padding: 12, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  outlineBtnText: { color: "#2A52BE", fontWeight: "bold", fontSize: 14 },
  sessionRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  monitorBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  monitorBtnText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  gpsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    borderStyle: "dashed",
    marginTop: 4,
  },
  pickerToggle: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
