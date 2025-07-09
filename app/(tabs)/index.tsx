import { NavigationHeader, useTheme } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import {
  cancelNotification,
  scheduleEventNotification,
} from "@/utils/notifications";
import { getData, saveData } from "@/utils/storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Button,
  FlatList,
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
  level: string;
  isGroupEvent: boolean;
  startTime: string;
  endTime: string;
  startTimeAMPM: string;
  endTimeAMPM: string;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter();
  const adjustedWidth = screenWidth - 30;

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGroupEvent, setIsGroupEvent] = useState(false);
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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
    if (!title || !description || !startTime || !endTime) {
      alert("All fields are required.");
      return;
    }
    if (isGroupEvent && !location) {
      alert("Group ID is required for group events.");
      return;
    }
    if (startTime >= endTime) {
      alert("End time must be after start time.");
      return;
    }

    const startTimeAMPM = formatTimeToAMPM(startTime);
    const endTimeAMPM = formatTimeToAMPM(endTime);

    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      location,
      level: "100", // Default level as per task-form.tsx
      isGroupEvent,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      startTimeAMPM,
      endTimeAMPM,
    };

    const tasks = (await getData("tasks")) || [];
    tasks.push(newTask);
    await saveData("tasks", tasks);
    await scheduleEventNotification(newTask);
    setTasks(tasks);

    setModalVisible(false);
    setTitle("");
    setDescription("");
    setStartTime(null);
    setEndTime(null);
    setLocation("");
    setIsGroupEvent(false);
  };

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

  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    const savedTasks = await getData("tasks");
    setTasks(savedTasks || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  const deleteTask = async (taskId: string) => {
    const tasks = (await getData("tasks")) || [];
    const updatedTasks = tasks.filter((task: Task) => task.id !== taskId);
    await saveData("tasks", updatedTasks);
    await cancelNotification(taskId);
    setTasks(updatedTasks);
  };

  const renderTask = ({ item }: { item: Task }) => (
    <ThemedView
      style={[
        styles.taskItem,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
          gap: 13,
        },
      ]}
    >
      <ThemedView
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          backgroundColor: theme.background,
        }}
      >
        <ThemedView
          style={{
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.background,
          }}
        >
          <ThemedText style={{ color: theme.text }}>Event</ThemedText>
          <ThemedText style={{ color: theme.text }}>{item.title}</ThemedText>
        </ThemedView>
        <ThemedView
          style={{
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.background,
          }}
        >
          <ThemedText style={{ color: theme.text }}>Time</ThemedText>
          <ThemedText style={{ color: theme.text }}>
            {item.startTimeAMPM} - {item.endTimeAMPM}
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={{
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.background,
          }}
        >
          <ThemedText style={{ color: theme.text }}>Location</ThemedText>
          <ThemedText style={{ color: theme.text }}>{item.location}</ThemedText>
        </ThemedView>
      </ThemedView>
      {/* <Button
        title="Delete"
        color={theme.primary}
        onPress={() => deleteTask(item.id)}
      /> */}
    </ThemedView>
  );

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
        <ThemedView style={[styles.todaysTasks, dynamicStyles.todaysTasks]}>
          <ThemedView
            style={[styles.cardHeading, { backgroundColor: theme.background }]}
          >
            <ThemedText
              style={[globalStyles.semiLargeText, { color: theme.text }]}
            >
              Today's Schedule
            </ThemedText>
            <Pressable onPress={() => router.push("/task-form")}>
              <ThemedText
                style={[
                  globalStyles.mediumText,
                  globalStyles.actionText,
                  { color: theme.primary },
                ]}
              >
                New Event
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView
            style={[
              styles.todaysTasksContent,
              { backgroundColor: theme.background },
            ]}
          >
            {tasks.length === 0 ? (
              <ThemedText style={[styles.noTasks, { color: theme.text }]}>
                No tasks created yet.
              </ThemedText>
            ) : (
              <FlatList
                data={tasks.sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
                )}
                renderItem={renderTask}
                keyExtractor={(item) => item.id}
                style={styles.taskList}
              />
            )}
            <Pressable
              style={[globalStyles.button1, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/schedule")}
            >
              <ThemedText
                style={[
                  globalStyles.mediumText,
                  globalStyles.actionText2,
                  { color: theme.text },
                ]}
              >
                See All
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
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
              placeholder="Task Title *"
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  placeholderTextColor: theme.border,
                },
              ]}
            />
            <TextInput
              placeholder="Description *"
              value={description}
              onChangeText={setDescription}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  placeholderTextColor: theme.border,
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
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  placeholderTextColor: theme.border,
                },
              ]}
            />
            <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
              <ThemedText style={[styles.input, { color: theme.text }]}>
                Start Time:{" "}
                {startTime ? startTime.toLocaleString() : "Select Start Time *"}
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
              />
            )}
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime || new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "clock"}
                onChange={handleStartTimeChange}
                onTouchCancel={() => setShowStartTimePicker(false)}
              />
            )}
            <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
              <ThemedText style={[styles.input, { color: theme.text }]}>
                End Time:{" "}
                {endTime ? endTime.toLocaleString() : "Select End Time *"}
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
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime || new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "clock"}
                onChange={handleEndTimeChange}
                onTouchCancel={() => setShowEndTimePicker(false)}
              />
            )}
            {Platform.OS === "ios" &&
              (showStartDatePicker ||
                showStartTimePicker ||
                showEndDatePicker ||
                showEndTimePicker) && (
                <Button
                  title="Confirm"
                  onPress={() => {
                    setShowStartDatePicker(false);
                    setShowStartTimePicker(false);
                    setShowEndDatePicker(false);
                    setShowEndTimePicker(false);
                  }}
                  color={theme.primary}
                />
              )}
            <Pressable
              style={[styles.customButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <ThemedText
                style={[
                  globalStyles.semiLargeText,
                  styles.customButtonText,
                  { color: theme.text },
                ]}
              >
                Create Task
              </ThemedText>
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
  taskList: { marginTop: 20 },
  taskItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  noTasks: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
