import Calendar from "@/components/DashboardCalendar";
import { NavigationHeader, useTheme, useUserData } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { scheduleEventNotification } from "@/utils/notifications";
import { getData, saveData } from "@/utils/storage";
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
} from "react-native";

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  isGroupEvent: boolean;
  startTime: string;
  endTime: string;
  startTimeAMPM: string;
  endTimeAMPM: string;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { userData } = useUserData();
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter();
  const adjustedWidth = screenWidth - 30;

  const [modalVisible, setModalVisible] = useState(false);
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

  // One-time cleanup for scheduled_notifications
  useEffect(() => {
    const cleanScheduledNotifications = async () => {
      try {
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
        }
      } catch (error) {
        console.error("Error cleaning scheduled_notifications:", error);
      }
    };
    cleanScheduledNotifications();
  }, []);

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

    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      location,
      isGroupEvent,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      startTimeAMPM,
      endTimeAMPM,
    };

    try {
      const tasks = (await getData("tasks")) || [];
      tasks.push(newTask);
      await saveData("tasks", tasks);

      // Always save to scheduled_notifications and log, but only schedule pop-up if allowed
      const triggerTime = new Date(newTask.startTime).getTime() - 5 * 60 * 1000;
      if (triggerTime > Date.now()) {
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
          taskId: newTask.id,
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
          await scheduleEventNotification(newTask);
          console.log("Pop-up notification scheduled for task:", newTask.title);
        } else {
          console.log(
            "Pop-up notifications disabled, notification not scheduled for task:",
            newTask.title
          );
        }
      } else {
        console.log(
          "Task start time is in the past, notification not scheduled for task:",
          newTask.title
        );
      }

      setTasks(tasks);
    } catch (error) {
      console.error("Error saving task or notification:", error);
      alert("Failed to save task. Please try again.");
      setIsLoading(false);
      return;
    }

    setModalVisible(false);
    setTitle("");
    setDescription("");
    setLocation("");
    setIsGroupEvent(false);
    setStartTime(null);
    setEndTime(null);
    setIsLoading(false);
  };

  const fetchTasks = useCallback(async () => {
    try {
      const savedTasks = await getData("tasks");
      setTasks(savedTasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

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

  return (
    <ThemedView style={[styles.page, dynamicStyles.page]}>
      <NavigationHeader title="Dashboard" />
      <ParallaxScrollView>
        <ThemedView
          style={[
            styles.gamificationContainer,
            dynamicStyles.gamificationContainer,
          ]}
        />
        <Calendar
          onDayPress={(date) => {}}
          setModalVisible={setModalVisible}
          modalVisible={modalVisible}
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
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.background}
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
                      { color: theme.text },
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
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <ThemedText
                  style={[
                    globalStyles.semiLargeText,
                    styles.customButtonText,
                    { color: theme.text },
                  ]}
                >
                  Create Task
                </ThemedText>
              )}
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>
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
});
