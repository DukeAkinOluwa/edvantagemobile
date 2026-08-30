import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/HeaderContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useGlobalStyles } from "@/styles/globalStyles";
import { createScheduleEvent, ScheduleEvent, syncScheduleAlarms, deleteScheduleEvent, subscribeUserSchedule } from "@/lib/scheduleService";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { SectionList, StyleSheet, Switch, View, TouchableOpacity, Pressable, Modal, TextInput, Alert, ActivityIndicator, Text, ScrollView, Animated, RefreshControl } from "react-native";
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

// Pulsing skeleton loading row
const SkeletonItem = ({ theme }: { theme: any }) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeletonCard,
        {
          backgroundColor: theme.backgroundSecondary,
          borderColor: theme.border,
          opacity: animatedValue,
        },
      ]}
    >
      <View style={styles.skeletonTimeCol} />
      <View style={styles.skeletonInfoCol}>
        <View style={styles.skeletonTitleLine} />
        <View style={styles.skeletonMetaLine} />
      </View>
    </Animated.View>
  );
};

const ScheduleItem = React.memo(function ScheduleItem({
  item,
  theme,
  isLecturer,
  onDelete,
  activeTab,
}: {
  item: ScheduleEvent;
  theme: any;
  isLecturer: boolean;
  onDelete: (id: string) => void;
  activeTab: "upcoming" | "past" | "registered";
}) {
  const router = useRouter();
  
  // Mocked attendance logic for UI demonstration
  const isPast = item.endTime < Date.now();
  const mockAttendanceValue = "Present"; 
  const mockAttendanceHistory = "85% (11/13)";

  return (
    <View style={{ marginBottom: 10 }}>
      <Pressable 
        style={[styles.taskBox, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
        onPress={() => router.push(`/class/${item.id}`)}
      >
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

          {/* Attendance specific info */}
          {!isLecturer && (
            <View style={{ marginTop: 6 }}>
              {activeTab === "registered" ? (
                <ThemedText style={{ color: "#4CAF50", fontSize: 12, fontWeight: "bold" }}>
                  Attendance History: {mockAttendanceHistory}
                </ThemedText>
              ) : isPast ? (
                <ThemedText style={{ color: theme.placeholder, fontSize: 12, fontWeight: "bold" }}>
                  Status: {mockAttendanceValue}
                </ThemedText>
              ) : null}
            </View>
          )}
          
          {/* Action Buttons Row */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {/* Check-In Button — visible to students during active class window */}
            {!isLecturer && isClassActive(item.startTime, item.endTime) && (
              <Link 
                href={`/attendance-checkin?classId=${encodeURIComponent(item.id || "")}&courseCode=${encodeURIComponent(item.courseCode || "")}&classTitle=${encodeURIComponent(item.title || "")}&classroomLat=${encodeURIComponent(String((item as any).classroomLat ?? 0))}&classroomLon=${encodeURIComponent(String((item as any).classroomLon ?? 0))}&classroomRadius=${encodeURIComponent(String((item as any).classroomRadius ?? 100))}&classroomName=${encodeURIComponent(item.location || "")}`}
                asChild
              >
                <TouchableOpacity style={styles.checkInBtn}>
                  <FontAwesome6 name="location-dot" size={11} color="#fff" />
                  <Text style={styles.checkInBtnText}>Check In</Text>
                </TouchableOpacity>
              </Link>
            )}
            
            {/* Take Attendance Button — visible to lecturers during active class window */}
            {isLecturer && isClassActive(item.startTime, item.endTime) && (
              <Link href={`/attendance-monitor?classId=${item.id}&courseCode=${item.courseCode}`} asChild>
                <TouchableOpacity style={[styles.checkInBtn, { backgroundColor: "#4CAF50" }]}>
                  <FontAwesome6 name="clipboard-user" size={11} color="#fff" />
                  <Text style={styles.checkInBtnText}>Take Attendance</Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        </View>

        {isLecturer && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
            <FontAwesome6 name="trash" size={14} color="#ff4d4d" />
          </TouchableOpacity>
        )}
      </Pressable>
    </View>
  );
}, (prev, next) => prev.item.id === next.item.id && prev.item.startTime === next.item.startTime && prev.activeTab === next.activeTab);

export default function ScheduleScreen() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { profile, user } = useAuth();

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "registered">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  
  const [displayLimit, setDisplayLimit] = useState(10); // Infinity scroll limit
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [location, setLocation] = useState("");
  const [classroomLat, setClassroomLat] = useState("");
  const [classroomLon, setClassroomLon] = useState("");
  const [classroomRadius, setClassroomRadius] = useState("100");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLecturer = profile?.role === "lecturer";

  // Establish real-time listener subscription on mount
  useEffect(() => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Sync native device alarms in background
    syncScheduleAlarms(user.uid, profile.role === "lecturer" ? "lecturer" : "student").catch(console.error);

    // Real-time listener
    const unsubscribe = subscribeUserSchedule(
      user.uid,
      profile.role === "lecturer" ? "lecturer" : "student",
      (fetched) => {
        setEvents(fetched);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, profile]);

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
      // Reset fields
      setTitle("");
      setCourseCode("");
      setLocation("");
      setClassroomLat("");
      setClassroomLon("");
      setClassroomRadius("100");
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
      }}
    ]);
  }, []);

  const handleJoinClass = async () => {
    if (!joinCode || !user) return;
    setIsJoining(true);
    try {
      const { joinClass } = await import("@/lib/scheduleService");
      const name = profile ? `${profile.firstName} ${profile.lastName}` : "Student";
      const avatar = profile?.profilePic || "";
      await joinClass(user.uid, joinCode, name, avatar);
      Alert.alert("Success", "You have joined the class!");
      setShowJoinModal(false);
      setJoinCode("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not join class. Check the code.");
    } finally {
      setIsJoining(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Real-time listener already updates data, but we can simulate a pull-to-refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  const sections = useMemo(() => {
    const grouped: { title: string; data: ScheduleEvent[] }[] = [];
    
    // Filter events based on activeTab and searchQuery
    let filteredEvents = events.filter(event => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCourse = (event.courseCode || "").toLowerCase().includes(query);
        const matchesTitle = (event.title || "").toLowerCase().includes(query);
        if (!matchesCourse && !matchesTitle) return false;
      }

      // Tab filter
      const isPast = event.endTime < Date.now();
      if (activeTab === "upcoming" && isPast) return false;
      if (activeTab === "past" && !isPast) return false;
      
      return true;
    });

    if (activeTab === "registered") {
      // Group by courseCode so we only show one generic entry per enrolled class
      const uniqueClasses = new Map<string, ScheduleEvent>();
      filteredEvents.forEach(evt => {
        if (!uniqueClasses.has(evt.courseCode)) {
          uniqueClasses.set(evt.courseCode, evt);
        }
      });
      filteredEvents = Array.from(uniqueClasses.values());
    }

    // If past tab, sort descending so newest past classes are at the top
    if (activeTab === "past") {
      filteredEvents.sort((a, b) => b.startTime - a.startTime);
    }

    // Pagination limit
    const paginatedEvents = filteredEvents.slice(0, displayLimit);

    paginatedEvents.forEach((event) => {
      const taskDate = new Date(event.startTime);
      taskDate.setHours(0, 0, 0, 0);

      const sectionTitle = formatDateHeader(taskDate);
      const sectionIndex = grouped.findIndex((sec) => sec.title === sectionTitle);

      if (sectionIndex === -1) {
        grouped.push({ title: sectionTitle, data: [event] });
      } else {
        grouped[sectionIndex].data.push(event);
      }
    });

    return grouped;
  }, [events, activeTab, searchQuery, displayLimit]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <ThemedText style={[globalStyles.largeText, { color: theme.text, fontWeight: "bold" }]}>
            {isLecturer ? "Lecturer Schedule" : "My Timetable"}
          </ThemedText>
        </View>
        
        <View style={{ flexDirection: "row", gap: 10 }}>
          {isLecturer ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <FontAwesome6 name="plus" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 6 }}>Add</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowJoinModal(true)}>
              <FontAwesome6 name="door-open" size={14} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 6 }}>Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs & Search */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === "upcoming" && { backgroundColor: "#2A52BE" }]} 
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, { color: activeTab === "upcoming" ? "#fff" : theme.text }]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === "past" && { backgroundColor: "#2A52BE" }]} 
          onPress={() => setActiveTab("past")}
        >
          <Text style={[styles.tabText, { color: activeTab === "past" ? "#fff" : theme.text }]}>Past</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === "registered" && { backgroundColor: "#2A52BE" }]} 
          onPress={() => setActiveTab("registered")}
        >
          <Text style={[styles.tabText, { color: activeTab === "registered" ? "#fff" : theme.text }]}>Registered</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
        <FontAwesome6 name="magnifying-glass" size={14} color={theme.placeholder} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search course code or title..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10}>
            <FontAwesome6 name="xmark" size={14} color={theme.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Real-time Schedule list with Pulsing Skeleton Loader fallbacks */}
      {loading && events.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ gap: 10, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2A52BE"]}
              tintColor={theme.text}
            />
          }
        >
          <SkeletonItem theme={theme} />
          <SkeletonItem theme={theme} />
          <SkeletonItem theme={theme} />
          <SkeletonItem theme={theme} />
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2A52BE"]}
              tintColor={theme.text}
            />
          }
          onEndReached={() => {
            if (displayLimit < events.length) {
              setDisplayLimit(prev => prev + 10);
            }
          }}
          onEndReachedThreshold={0.5}
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
              activeTab={activeTab}
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

      <Modal visible={showJoinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Join Class</Text>
            
            <Text style={[styles.label, { color: theme.text }]}>Enter 6-Digit Class Code</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="e.g. A1B2C3"
              placeholderTextColor={theme.placeholder}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={6}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setShowJoinModal(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.submitBtn]} onPress={handleJoinClass} disabled={isJoining}>
                {isJoining ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Join Class</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Class Modal for Lecturers */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Schedule New Class</Text>
            
            <ScrollView style={{ maxHeight: "80%" }}>
              <Text style={[styles.label, { color: theme.text }]}>Course Code</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. SEN 300"
                placeholderTextColor={theme.placeholder}
                value={courseCode}
                onChangeText={setCourseCode}
              />

              <Text style={[styles.label, { color: theme.text }]}>Class Title</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Intro to Software Eng."
                placeholderTextColor={theme.placeholder}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.label, { color: theme.text }]}>Location (Name)</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="e.g. Hall 2"
                placeholderTextColor={theme.placeholder}
                value={location}
                onChangeText={setLocation}
              />

              <Text style={[styles.label, { color: theme.text, marginTop: 10 }]}>GPS Coordinates (For Check-In)</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="Latitude (e.g. 6.6732)"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                value={classroomLat}
                onChangeText={setClassroomLat}
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="Longitude (e.g. 3.1601)"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                value={classroomLon}
                onChangeText={setClassroomLon}
              />

              <Text style={[styles.label, { color: theme.text, marginTop: 10 }]}>Start Time</Text>
              <DateTimePicker
                value={startTime}
                mode="time"
                display="default"
                onChange={(e, date) => date && setStartTime(date)}
              />

              <Text style={[styles.label, { color: theme.text, marginTop: 10 }]}>End Time</Text>
              <DateTimePicker
                value={endTime}
                mode="time"
                display="default"
                onChange={(e, date) => date && setEndTime(date)}
              />
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setShowAddModal(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.submitBtn]} onPress={handleAddEvent} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Schedule</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 10,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  tabText: {
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    marginBottom: 5,
  },
  searchInput: {
    flex: 1,
    height: "100%",
  },
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 300 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 15, fontSize: 16 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 20, marginBottom: 30 },
  btn: { flex: 1, padding: 15, borderRadius: 10, alignItems: "center" },
  cancelBtn: { backgroundColor: "rgba(128,128,128,0.2)" },
  submitBtn: { backgroundColor: "#2A52BE" },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  // Skeletons
  skeletonCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 80,
    alignItems: "center",
    marginBottom: 5,
  },
  skeletonTimeCol: {
    width: 60,
    height: 45,
    backgroundColor: "rgba(128,128,128,0.15)",
    borderRadius: 6,
    marginRight: 12,
  },
  skeletonInfoCol: {
    flex: 1,
    gap: 8,
  },
  skeletonTitleLine: {
    width: "70%",
    height: 14,
    backgroundColor: "rgba(128,128,128,0.15)",
    borderRadius: 4,
  },
  skeletonMetaLine: {
    width: "40%",
    height: 10,
    backgroundColor: "rgba(128,128,128,0.15)",
    borderRadius: 4,
  },
});