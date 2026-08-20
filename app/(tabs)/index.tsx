import Calendar from "@/components/DashboardCalendar";
import { NavigationHeader } from "@/components/Header";
import { useTheme, useUserData } from "@/components/HeaderContext";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import StaffDashboard from "@/app/staff-dashboard";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { scheduleEventNotification } from "@/utils/notifications";
import { scheduleAlarm } from "@/lib/alarmService";
import { getData, saveData } from "@/utils/storage";
import { Task, createTask, subscribeUserTasks, syncTaskAlarms } from "@/lib/firestoreService";
import { auth } from "@/lib/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  View,
  Text,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";

export default function HomeScreen() {
  const { theme } = useTheme();
  const { userData } = useUserData();
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter();
  const adjustedWidth = screenWidth - 30;

  if (userData.role === "lecturer") {
    return <StaffDashboard />;
  }

  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isGroupEvent, setIsGroupEvent] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  // One-time cleanup and re-scheduling of notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Clean up invalid scheduled_notifications
        let scheduledNotifications =
          (await getData("scheduled_notifications")) || [];
        const validNotifications = scheduledNotifications.filter(
          (sn: any) =>
            sn &&
            typeof sn === "object" &&
            "taskId" in sn &&
            "triggerTime" in sn &&
            typeof sn.taskId === "string" &&
            typeof sn.triggerTime === "number"
        );
        if (validNotifications.length < scheduledNotifications.length) {
          console.log("Cleaning up invalid scheduled_notifications on startup");
          await saveData("scheduled_notifications", validNotifications);
          scheduledNotifications = validNotifications;
        }

        // Re-schedule valid notifications if user is logged in and notifications are allowed
        if (userData.allowNotifications !== false) {
          const tasks = (await getData("tasks")) || [];
          for (const notification of scheduledNotifications) {
            const task = tasks.find((t: Task) => t.id === notification.taskId);
            if (task && notification.triggerTime > Date.now()) {
              try {
                await scheduleEventNotification(task);
                console.log(
                  "Re-scheduled notification for task:",
                  task.title,
                  "at",
                  new Date(notification.triggerTime).toLocaleString()
                );
              } catch (error) {
                console.error(
                  "Error re-scheduling notification for task:",
                  task.title,
                  error
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    };
    initializeNotifications();
  }, [userData.allowNotifications]);

  const formatTimeToAMPM = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const handleStartDateChange = (event: any, selected: Date | undefined) => {
    if (Platform.OS === "android") {
      setShowStartDatePicker(false);
      if (selected) {
        setStartTime(selected);
        setShowStartTimePicker(true);
      }
    } else {
      if (selected) {
        setStartTime(selected);
      }
    }
  };

  const handleStartTimeChange = (event: any, selected: Date | undefined) => {
    setShowStartTimePicker(false);
    if (selected && startTime) {
      const newDate = new Date(startTime);
      newDate.setHours(selected.getHours(), selected.getMinutes());
      setStartTime(newDate);
    }
  };

  const handleEndDateChange = (event: any, selected: Date | undefined) => {
    if (Platform.OS === "android") {
      setShowEndDatePicker(false);
      if (selected) {
        setEndTime(selected);
        setShowEndTimePicker(true);
      }
    } else {
      if (selected) {
        setEndTime(selected);
      }
    }
  };

  const handleEndTimeChange = (event: any, selected: Date | undefined) => {
    setShowEndTimePicker(false);
    if (selected && endTime) {
      const newDate = new Date(endTime);
      newDate.setHours(selected.getHours(), selected.getMinutes());
      setEndTime(newDate);
    }
  };

  const handleSave = async () => {
    if (
      !title.trim() ||
      !description.trim() ||
      !location.trim() ||
      !startTime ||
      !endTime
    ) {
      alert("All fields are required.");
      return;
    }
    if (endTime <= startTime) {
      alert("End time must be after start time.");
      return;
    }

    setIsLoading(true);

    const startTimeAMPM = formatTimeToAMPM(startTime);
    const endTimeAMPM = formatTimeToAMPM(endTime);
    const taskUid = userData.uid || auth.currentUser?.uid;

    if (!taskUid) {
      alert("Error: User not authenticated.");
      setIsLoading(false);
      return;
    }

    const newTask = {
      title,
      description,
      location,
      isGroupEvent,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      startTimeAMPM,
      endTimeAMPM,
      uid: taskUid,
    };

    try {
      const newTaskId = await createTask(newTask);

      // Always save to scheduled_notifications and log, but only schedule pop-up if allowed
      const startTimeMs = new Date(newTask.startTime).getTime();
      const triggerTime = startTimeMs - 5 * 60 * 1000;
      const now = Date.now();

      // 1. Pre-notification 5 minutes before (if still in the future)
      if (triggerTime > now) {
        let scheduledNotifications =
          (await getData("scheduled_notifications")) || [];
        scheduledNotifications = scheduledNotifications.filter(
          (sn: any) =>
            sn &&
            typeof sn === "object" &&
            "taskId" in sn &&
            "triggerTime" in sn &&
            typeof sn.taskId === "string" &&
            typeof sn.triggerTime === "number"
        );
        scheduledNotifications.push({
          taskId: newTaskId,
          triggerTime,
        });
        await saveData("scheduled_notifications", scheduledNotifications);
        console.log(
          "Scheduled notification saved for task:",
          newTask.title,
          "at",
          new Date(triggerTime).toLocaleString()
        );

        if (userData.allowNotifications !== false) {
          await scheduleEventNotification({ ...newTask, id: newTaskId });
          console.log("Pop-up notification scheduled for task:", newTask.title);
        }
      }

      // 2. Alarm EXACTLY at task start time (if start time is in the future)
      if (startTimeMs > now) {
        if (userData.allowAlarms !== false) {
          await scheduleAlarm(
            newTaskId,
            startTimeMs,
            `Task Starting: ${newTask.title}`,
            `Your task starts now at ${newTask.location}.`
          );
          console.log("OS-level alarm scheduled for task:", newTask.title, "at", new Date(startTimeMs).toLocaleTimeString());
        }
      } else {
        console.log(
          "Task start time is in the past, alarm not scheduled for task:",
          newTask.title
        );
      }
      setIsLoading(false);
      setCreatedTask({ ...newTask, id: newTaskId });
      setSuccessModalVisible(true);
      setModalVisible(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setIsGroupEvent(false);
      setStartTime(null);
      setEndTime(null);
    } catch (error) {
      console.error("Error saving task or notification:", error);
      alert("Failed to save task. Please try again.");
      setIsLoading(false);
      return;
    }
  };

  useEffect(() => {
    const uid = userData?.uid || auth.currentUser?.uid;
    if (!uid) return;
    
    // Sync scheduled tasks alarms with device alarms on mount
    syncTaskAlarms(uid).catch(console.error);

    // Subscribe to tasks in real-time
    const unsubscribe = subscribeUserTasks(uid, (fetchedTasks) => {
      setTasks(fetchedTasks);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  const dynamicStyles = StyleSheet.create({
    page: {
      flex: 1,
      paddingBottom: 70,
      backgroundColor: theme.background,
    },
    gamificationContainer: {
      width: adjustedWidth,
      backgroundColor: theme.primary,
    },
    todaysTasks: {
      width: adjustedWidth,
      backgroundColor: theme.background,
    },
    parallaxScrollView: {
      flex: 1,
      backgroundColor: theme.background,
    },
  });

  const handleDayPress = useCallback((date: Date) => {}, []);

  return (
    <ThemedView style={[styles.page, dynamicStyles.page]}>
      <NavigationHeader title="Dashboard" />
      <ParallaxScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <ThemedView
          style={[
            styles.gamificationContainer,
            dynamicStyles.gamificationContainer,
          ]}
        />
        
        {/* Assignments Quick-Link Banner */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.backgroundSecondary || '#fff',
            padding: 15,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            width: adjustedWidth,
            marginTop: 15,
            marginBottom: 5,
          }}
          onPress={() => router.push("/assignments")}
        >
          <FontAwesome6 name="check-to-slot" size={22} color="#4CAF50" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontWeight: "bold", fontSize: 15, color: theme.text }}>My Assignments</ThemedText>
            <ThemedText style={{ color: theme.placeholder, fontSize: 11 }}>View due dates and submit your work.</ThemedText>
          </View>
          <FontAwesome6 name="chevron-right" size={14} color={theme.placeholder} />
        </TouchableOpacity>
        {/* 
        <TouchableOpacity
          style={{ backgroundColor: "red", padding: 15, borderRadius: 8, marginVertical: 10, alignItems: "center" }}
          onPress={async () => {
            alert("Test alarm scheduled for 10 seconds from now! Lock your screen!");
            await scheduleAlarm("test-alarm", Date.now() + 10000, "Test Alarm", "This is an automatic test alarm.");
          }}
        >
          <ThemedText style={{ color: "white", fontWeight: "bold" }}>TRIGGER TEST ALARM (10s)</ThemedText>
        </TouchableOpacity> 
        */}
        <Calendar
          onDayPress={handleDayPress}
          setModalVisible={setModalVisible}
          modalVisible={modalVisible}
          refreshTrigger={refreshTrigger}
        />
      </ParallaxScrollView>
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView
          style={[
            styles.modalBackdrop,
            { backgroundColor: theme.modalBackdrop || theme.background + "80" },
          ]}
        >
          <Pressable
            style={styles.backdropTouchableArea}
            onPress={() => setModalVisible(false)}
          />
          <ThemedView
            style={[
              styles.modalContent,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <ThemedText
              style={[
                globalStyles.semiLargeText,
                { fontWeight: "bold", marginBottom: 15, color: theme.text },
              ]}
            >
              Create New Task
            </ThemedText>
            <TextInput
              placeholder="Title *"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={theme.border}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
            <TextInput
              placeholder="Description *"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={theme.border}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              multiline
            />
            <ThemedView
              style={[styles.switchRow, { backgroundColor: theme.background }]}
            >
              <ThemedText style={{ color: theme.text }}>Group Event</ThemedText>
              <Switch
                value={isGroupEvent}
                onValueChange={setIsGroupEvent}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor={isGroupEvent ? theme.secondary : "#f4f3f4"}
              />
            </ThemedView>
            <TextInput
              placeholder="Location *"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor={theme.border}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
            <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
              <ThemedText style={[styles.dateText, { color: theme.text }]}>
                Start Time: {startTime ? startTime.toLocaleString() : ""}
              </ThemedText>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startTime || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "calendar"}
                onChange={handleStartDateChange}
                minimumDate={new Date()}
                onTouchCancel={() => setShowStartDatePicker(false)}
                textColor={theme.text} // Android only
                accentColor={theme.primary} // Android only
              />
            )}
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime || new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "clock"}
                onChange={handleStartTimeChange}
                onTouchCancel={() => setShowStartTimePicker(false)}
                textColor={theme.text} // Android only
                accentColor={theme.primary} // Android only
              />
            )}
            <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
              <ThemedText style={[styles.dateText, { color: theme.text }]}>
                End Time: {endTime ? endTime.toLocaleString() : ""}
              </ThemedText>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endTime || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "calendar"}
                onChange={handleEndDateChange}
                minimumDate={startTime || new Date()}
                onTouchCancel={() => setShowEndDatePicker(false)}
                textColor={theme.text} // Android only
                accentColor={theme.primary} // Android only
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime || new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "clock"}
                onChange={handleEndTimeChange}
                onTouchCancel={() => setShowEndTimePicker(false)}
                textColor={theme.text} // Android only
                accentColor={theme.primary} // Android only
              />
            )}
            {Platform.OS === "ios" &&
              (showStartDatePicker ||
                showStartTimePicker ||
                showEndDatePicker ||
                showEndTimePicker) && (
                <Pressable
                  style={[
                    styles.customButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => {
                    setShowStartDatePicker(false);
                    setShowStartTimePicker(false);
                    setShowEndDatePicker(false);
                    setShowEndTimePicker(false);
                  }}
                >
                  <ThemedText
                    style={[
                      globalStyles.semiLargeText,
                      styles.customButtonText,
                      { color: theme.secondary },
                    ]}
                  >
                    Confirm
                  </ThemedText>
                </Pressable>
              )}
            <Pressable
              style={[
                styles.customButton,
                { backgroundColor: theme.primary },
                isLoading && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.secondary} />
              ) : (
                <ThemedText
                  style={[
                    globalStyles.semiLargeText,
                    styles.customButtonText,
                    { color: theme.secondary },
                  ]}
                >
                  Create Task
                </ThemedText>
              )}
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>

      <Modal
        transparent
        visible={successModalVisible}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <ThemedView
          style={[
            styles.modalBackdrop,
            { backgroundColor: theme.modalBackdrop || theme.background + "80" },
          ]}
        >
          <ThemedView
            style={[
              styles.modalContent,
              { backgroundColor: theme.background, borderColor: theme.border, alignItems: "center" },
            ]}
          >
            <FontAwesome6 name="circle-check" size={50} color="#2A52BE" style={{ marginBottom: 15 }} />
            <ThemedText style={[globalStyles.semiLargeText, { fontWeight: "bold", marginBottom: 10, textAlign: "center", color: theme.text }]}>
              Task Created Successfully!
            </ThemedText>
            {createdTask && (
              <ThemedView style={{ width: "100%", marginVertical: 15 }}>
                <ThemedText style={[globalStyles.baseText, { color: theme.text, marginBottom: 5 }]}>
                  <ThemedText style={{ fontWeight: "bold" }}>Title:</ThemedText> {createdTask.title}
                </ThemedText>
                <ThemedText style={[globalStyles.baseText, { color: theme.text, marginBottom: 5 }]}>
                  <ThemedText style={{ fontWeight: "bold" }}>Time:</ThemedText> {createdTask.startTimeAMPM} - {createdTask.endTimeAMPM}
                </ThemedText>
                <ThemedText style={[globalStyles.baseText, { color: theme.text }]}>
                  <ThemedText style={{ fontWeight: "bold" }}>Location:</ThemedText> {createdTask.location}
                </ThemedText>
              </ThemedView>
            )}
            <Pressable
              style={[
                globalStyles.button1,
                { width: "100%", backgroundColor: theme.primary, marginTop: 10 },
              ]}
              onPress={() => setSuccessModalVisible(false)}
            >
              <ThemedText style={[globalStyles.mediumText, { color: theme.secondary }]}>
                Done
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <FontAwesome6 name="plus" size={20} color={theme.secondary} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    gap: 10,
  },
  gamificationContainer: {
    height: 120,
    borderRadius: 8,
  },
  todaysTasks: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  cardHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  todaysTasksContent: {
    flexDirection: "column",
    gap: 10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: "100%",
    fontFamily: "Montserrat-Regular",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    padding: 10,
    marginBottom: 10,
  },
  customButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  customButtonText: {
    color: "#fff",
  },
  backdropTouchableArea: {
    ...StyleSheet.absoluteFillObject,
  },
  taskList: {
    marginTop: 20,
  },
  taskItem: {
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 0.5,
    borderColor: "rgba(17, 17, 17, 0.2)",
    borderStyle: "solid",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
  },
  noTasks: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  fab: {
    position: "absolute",
    bottom: 85,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
