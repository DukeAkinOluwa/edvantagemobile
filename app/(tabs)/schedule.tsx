import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useGlobalStyles } from "@/styles/globalStyles";
import { fetchUserSchedule, createScheduleEvent, ScheduleEvent, syncScheduleAlarms, deleteScheduleEvent } from "@/lib/scheduleService";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { SectionList, StyleSheet, Switch, View, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Text } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

/** Returns true if the current moment is within the class window (+/- 30 min buffer) */
const isClassActive = (startTime: number, endTime: number): boolean => {
  const now = Date.now();
  return now >= startTime - 30 * 60 * 1000 && now <= endTime + 10 * 60 * 1000;
};

const formatDateHeader = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ScheduleItem = React.memo(function ScheduleItem({
  item,
  theme,
  isLecturer,
  onDelete,
  onCheckIn,
}: {
  item: ScheduleEvent;
  theme: any;
  isLecturer: boolean;
  onDelete: (id: string) => void;
  onCheckIn: (item: ScheduleEvent) => void;
}) {
  return (
    <View style={[styles.taskBox, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
      <View style={styles.timeCol}>
        <Text style={[styles.taskTime, { color: theme.text }]}>{formatTime(item.startTime)}</Text>
        <Text style={{ color: theme.placeholder, fontSize: 10 }}>to</Text>
        <Text style={[styles.taskTime, { color: theme.placeholder, fontSize: 11 }]}>{formatTime(item.endTime)}</Text>
      </View>
      
      <View style={styles.taskInfo}>
        <ThemedText style={[styles.taskTitle, { color: theme.text }]}>{item.courseCode}: {item.title}</ThemedText>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
          <FontAwesome6 name="location-dot" size={10} color={theme.placeholder} />
          <ThemedText style={[styles.taskMeta, { color: theme.placeholder }]}>{item.location}</ThemedText>
        </View>
        {!isLecturer && (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 4 }}>
            <FontAwesome6 name="chalkboard-user" size={10} color={theme.placeholder} />
            <ThemedText style={[styles.taskMeta, { color: theme.placeholder }]}>{item.lecturerName}</ThemedText>
          </View>
        )}
        {/* Check-In Button — visible to students during active class window */}
        {!isLecturer && isClassActive(item.startTime, item.endTime) && (
          <TouchableOpacity style={styles.checkInBtn} onPress={() => onCheckIn(item)}>
            <FontAwesome6 name="location-dot" size={11} color="#fff" />
            <Text style={styles.checkInBtnText}>Check In</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLecturer && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
          <FontAwesome6 name="trash" size={14} color="#ff4d4d" />
        </TouchableOpacity>
      )}
    </View>
  );
}, (prev, next) => prev.item.id === next.item.id && prev.item.startTime === next.item.startTime);

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { profile, user } = useAuth();

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [includePast, setIncludePast] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [location, setLocation] = useState("");
  const [classroomLat, setClassroomLat] = useState("");
  const [classroomLon, setClassroomLon] = useState("");
  const [classroomRadius, setClassroomRadius] = useState("100");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600000)); // +1 hour
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLecturer = profile?.role === "lecturer";
  const router = useRouter();

  const loadSchedule = useCallback(async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Sync native alarms for the device while fetching
      await syncScheduleAlarms(user.uid, profile.role === "lecturer" ? "lecturer" : "student");
      const fetched = await fetchUserSchedule(user.uid, profile.role === "lecturer" ? "lecturer" : "student");
      setEvents(fetched);
    } catch (err) {
      console.error("Failed to load schedule:", err);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [loadSchedule])
  );

  const handleAddEvent = async () => {
    if (!title || !courseCode || !location || !user || !profile) {
      Alert.alert("Missing Fields", "Please fill in all details.");
      return;
    }
    if (!classroomLat || !classroomLon) {
      Alert.alert("Missing GPS", "Please enter the classroom GPS coordinates so students can check in.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createScheduleEvent({
        title,
        courseCode,
        location,
        classroomLat: parseFloat(classroomLat),
        classroomLon: parseFloat(classroomLon),
        classroomRadius: parseFloat(classroomRadius) || 100,
        lecturerId: user.uid,
        lecturerName: profile.displayName || `${profile.firstName} ${profile.lastName}`,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        participants: [],
      });
      setShowAddModal(false);
      loadSchedule();
    } catch (err) {
      Alert.alert("Error", "Failed to schedule class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Delete Class", "Are you sure you want to cancel this class?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await deleteScheduleEvent(id);
        loadSchedule();
      }}
    ]);
  }, [loadSchedule]);

  const handleCheckIn = useCallback((item: ScheduleEvent) => {
    router.push({
      pathname: "/attendance-checkin",
      params: {
        classId: item.id,
        courseCode: item.courseCode,
        classTitle: item.title,
        classroomLat: String((item as any).classroomLat ?? 0),
        classroomLon: String((item as any).classroomLon ?? 0),
        classroomRadius: String((item as any).classroomRadius ?? 100),
        classroomName: item.location,
      },
    });
  }, [router]);

  const sections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const grouped: { title: string; data: ScheduleEvent[] }[] = [];

    events.forEach((event) => {
      const taskDate = new Date(event.startTime);
      taskDate.setHours(0, 0, 0, 0);

      if (!includePast && taskDate < today) return;

      const sectionTitle = formatDateHeader(taskDate);
      const sectionIndex = grouped.findIndex((sec) => sec.title === sectionTitle);

      if (sectionIndex === -1) {
        grouped.push({ title: sectionTitle, data: [event] });
      } else {
        grouped[sectionIndex].data.push(event);
      }
    });

    return grouped;
  }, [events, includePast]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <ThemedText style={[globalStyles.largeText, { color: theme.text, fontWeight: "bold" }]}>
            {isLecturer ? "Lecturer Schedule" : "My Timetable"}
          </ThemedText>
          <ThemedText style={{ color: theme.placeholder, fontSize: 12, marginTop: 4 }}>
            Native alarms automatically sync 15 mins before class.
          </ThemedText>
        </View>
        
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <FontAwesome6 name="plus" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 6 }}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        <ThemedText style={[globalStyles.mediumText, { color: theme.text }]}>Show Past Classes</ThemedText>
        <Switch
          value={includePast}
          onValueChange={setIncludePast}
          trackColor={{ false: "#767577", true: theme.primary }}
          thumbColor={includePast ? theme.secondary : "#f4f3f4"}
        />
      </View>

      {/* Schedule List */}
      {loading ? (
        <ActivityIndicator size="large" color="#2A52BE" style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <ThemedText style={[styles.sectionHeader, globalStyles.semiLargeText, { color: theme.text }]}>
              {title}
            </ThemedText>
          )}
          renderItem={({ item }) => (
            <ScheduleItem
              item={item}
              theme={theme}
              isLecturer={isLecturer}
              onDelete={handleDelete}
              onCheckIn={handleCheckIn}
            />
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome6 name="calendar-check" size={40} color={theme.placeholder} />
              <ThemedText style={{ color: theme.text, marginTop: 10 }}>No upcoming classes.</ThemedText>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Add Event Modal (Lecturer Only) */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Schedule Class</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={{ color: "#ff4d4d", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Course Code (e.g. CSC 301)" placeholderTextColor={theme.placeholder} value={courseCode} onChangeText={setCourseCode} />
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Topic / Title" placeholderTextColor={theme.placeholder} value={title} onChangeText={setTitle} />
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Location / Hall Name" placeholderTextColor={theme.placeholder} value={location} onChangeText={setLocation} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]} placeholder="Latitude" placeholderTextColor={theme.placeholder} keyboardType="decimal-pad" value={classroomLat} onChangeText={setClassroomLat} />
            <TextInput style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]} placeholder="Longitude" placeholderTextColor={theme.placeholder} keyboardType="decimal-pad" value={classroomLon} onChangeText={setClassroomLon} />
          </View>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Geofence Radius in metres (default: 100)" placeholderTextColor={theme.placeholder} keyboardType="number-pad" value={classroomRadius} onChangeText={setClassroomRadius} />

          <TouchableOpacity style={[styles.dateBtn, { borderColor: theme.border }]} onPress={() => setShowStartPicker(true)}>
            <FontAwesome6 name="clock" size={16} color={theme.text} />
            <Text style={{ color: theme.text, marginLeft: 10 }}>{startTime.toLocaleString()}</Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="datetime"
              display="default"
              onChange={(e, date) => {
                setShowStartPicker(false);
                if (date) {
                  setStartTime(date);
                  setEndTime(new Date(date.getTime() + 3600000));
                }
              }}
            />
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddEvent} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Schedule Class</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15, paddingTop: 60 }, // Added top padding for Safe Area
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  addBtn: { flexDirection: "row", backgroundColor: "#2A52BE", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: "center" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  sectionHeader: { marginTop: 20, marginBottom: 10, fontWeight: "600" },
  taskBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, marginBottom: 10, borderWidth: 1, padding: 12 },
  timeCol: { alignItems: "center", justifyContent: "center", borderRightWidth: 1, borderRightColor: "#eee", paddingRight: 12, marginRight: 12 },
  taskTime: { fontSize: 13, fontWeight: "700" },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: "600" },
  taskMeta: { fontSize: 12 },
  deleteBtn: { padding: 10 },
  emptyState: { alignItems: "center", marginTop: 60 },
  checkInBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#2A52BE", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5, marginTop: 8, alignSelf: "flex-start" },
  checkInBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  // Modal
  modalContainer: { flex: 1, padding: 20, paddingTop: 50 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  input: { borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 16 },
  dateBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 30 },
  submitBtn: { backgroundColor: "#2A52BE", padding: 16, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});