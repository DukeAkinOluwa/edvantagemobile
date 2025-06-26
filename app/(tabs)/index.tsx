import { darkTheme, lightTheme } from "@/assets/colors";
import { NavigationHeader } from "@/components/Header";
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
import userDataInfo from "@/utils/userDataInfo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Appearance,
  Button,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
}

export default function HomeScreen() {
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
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [theme, setTheme] = useState(lightTheme);
  const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">(
    "system"
  );

  useEffect(() => {
    const initialize = async () => {
      await userDataInfo.initialize();
      const data = userDataInfo.getData();
      setThemeMode(data.themeMode || "system");
      setTheme(data.themeMode === "dark" ? darkTheme : lightTheme);
    };
    initialize();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === "system") {
        setTheme(colorScheme === "dark" ? darkTheme : lightTheme);
      }
    });
    return () => subscription.remove();
  }, [themeMode]);

  const handleStartDateChange = (event: any, selected: Date | undefined) => {
    setShowStartDatePicker(Platform.OS === "ios");
    if (selected) {
      setStartTime(selected);
    }
  };

  const handleEndDateChange = (event: any, selected: Date | undefined) => {
    setShowEndDatePicker(Platform.OS === "ios");
    if (selected) {
      setEndTime(selected);
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

    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      location,
      level: userDataInfo.getData().level || "100",
      isGroupEvent,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
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
    },
    gamificationContainer: {
      width: adjustedWidth,
    },
    todaysTasks: {
      width: adjustedWidth,
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
    <View
      style={[
        styles.taskItem,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
          gap: 13,
        },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text> Event</Text>
          <Text> {item.title}</Text>
        </View>
        <View>
          <Text> Time</Text>
          <Text>Start Time</Text>
        </View>
        <View>
          <Text> Location</Text>
          <Text> {item.location}</Text>
        </View>
      </View>
      <Button
        title="Delete"
        color={theme.accent}
        onPress={() => deleteTask(item.id)}
      />
    </View>
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
          lightColor="#2A52BE"
          darkColor="#FAFBFD"
        ></ThemedView>
        <ThemedView style={[styles.todaysTasks, dynamicStyles.todaysTasks]}>
          <ThemedView style={styles.cardHeading}>
            <ThemedText style={globalStyles.semiLargeText}>
              Today's Schedule
            </ThemedText>
            <Pressable onPress={() => router.push("/task-form")}>
              <ThemedText
                style={[globalStyles.mediumText, globalStyles.actionText]}
              >
                New Event
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={styles.todaysTasksContent}>
            {tasks.length === 0 ? (
              <Text style={[styles.noTasks, { color: theme.text }]}>
                No tasks created yet.
              </Text>
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
              style={globalStyles.button1}
              onPress={() => router.push("/schedule")}
            >
              <ThemedText
                style={[globalStyles.mediumText, globalStyles.actionText2]}
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
        <ThemedView style={styles.modalBackdrop}>
          <Pressable
            style={styles.backdropTouchableArea}
            onPress={() => setModalVisible(false)}
          />
          <ThemedView style={styles.modalContent}>
            <TextInput
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />
            <ThemedView style={styles.switchRow}>
              <ThemedText>Is Group Event</ThemedText>
              <Switch value={isGroupEvent} onValueChange={setIsGroupEvent} />
            </ThemedView>
            <TextInput
              placeholder="Location"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
              <Text style={[styles.input, { color: theme.text }]}>
                Start Time:{" "}
                {startTime ? startTime.toLocaleString() : "Select Start Time"}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startTime || new Date()}
                mode="datetime"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}
            <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
              <Text style={[styles.input, { color: theme.text }]}>
                End Time:{" "}
                {endTime ? endTime.toLocaleString() : "Select End Time"}
              </Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endTime || new Date()}
                mode="datetime"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleEndDateChange}
                minimumDate={startTime || new Date()}
              />
            )}
            {Platform.OS === "ios" &&
              (showStartDatePicker || showEndDatePicker) && (
                <Button
                  title="Confirm"
                  onPress={() => {
                    setShowStartDatePicker(false);
                    setShowEndDatePicker(false);
                  }}
                  color={theme.primary}
                />
              )}
            <Pressable style={styles.customButton} onPress={handleSave}>
              <ThemedText
                style={[globalStyles.semiLargeText, styles.customButtonText]}
              >
                Save
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
    shadowColor: "#000",
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
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
    backgroundColor: "#2A52BE",
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: { flex: 1, padding: 20 },
  taskList: { marginTop: 20 },
  taskItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  taskDetail: {
    fontSize: 14,
    marginBottom: 5,
  },
  noTasks: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
