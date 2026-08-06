import { darkTheme, lightTheme } from "@/assets/colors";
import { scheduleEventNotification } from "@/utils/notifications";
import { getData, saveData } from "@/utils/storage";
import userDataInfo from "@/utils/userDataInfo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Appearance,
  Button,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TaskForm: React.FC = () => {
  const router = useRouter();
  const [theme, setTheme] = useState(lightTheme);
  const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">(
    "system"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [level, setLevel] = useState("100");
  const [isGroupEvent, setIsGroupEvent] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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

  const showStartPicker = () => {
    setShowStartDatePicker(true);
  };

  const showEndPicker = () => {
    setShowEndDatePicker(true);
  };

  const formatTimeToAMPM = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 0 or 12 to 12 for 12-hour format
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const handleSubmit = async () => {
    if (
      !title.trim() ||
      !description.trim() ||
      !location.trim() ||
      !level ||
      !startTime ||
      !endTime
    ) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    if (endTime <= startTime) {
      Alert.alert("Error", "End time must be after start time!");
      return;
    }

    const startTimeAMPM = formatTimeToAMPM(startTime);
    const endTimeAMPM = formatTimeToAMPM(endTime);

    const task = {
      id: Date.now().toString(),
      title,
      description,
      location,
      level,
      isGroupEvent,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      startTimeAMPM,
      endTimeAMPM,
    };

    const tasks = (await getData("tasks")) || [];
    tasks.push(task);
    await saveData("tasks", tasks);
    await scheduleEventNotification(task);

    Alert.alert("Success", "Task created!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        placeholder="Title"
        placeholderTextColor={theme.border}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        placeholder="Description"
        placeholderTextColor={theme.border}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <View style={styles.switchContainer}>
        <Text style={{ color: theme.text }}>Is Group Event</Text>
        <Switch
          value={isGroupEvent}
          onValueChange={setIsGroupEvent}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={theme.background}
        />
      </View>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        placeholder="Location"
        placeholderTextColor={theme.border}
        value={location}
        onChangeText={setLocation}
      />
      <TouchableOpacity onPress={showStartPicker}>
        <Text style={[styles.dateText, { color: theme.text }]}>
          Start Time:{" "}
          {startTime ? startTime.toLocaleString() : "Select Start Time"}
        </Text>
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
      {Platform.OS === "ios" &&
        (showStartDatePicker || showStartTimePicker) && (
          <Button
            title="Confirm"
            onPress={() => {
              setShowStartDatePicker(false);
              setShowStartTimePicker(false);
            }}
            color={theme.primary}
          />
        )}
      <TouchableOpacity onPress={showEndPicker}>
        <Text style={[styles.dateText, { color: theme.text }]}>
          End Time: {endTime ? endTime.toLocaleString() : "Select End Time"}
        </Text>
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
      {Platform.OS === "ios" && (showEndDatePicker || showEndTimePicker) && (
        <Button
          title="Confirm"
          onPress={() => {
            setShowEndDatePicker(false);
            setShowEndTimePicker(false);
          }}
          color={theme.primary}
        />
      )}
      <Button title="Save" onPress={handleSubmit} color={theme.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  picker: { height: 50, width: "100%" },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  dateText: {
    fontSize: 16,
    padding: 10,
    marginBottom: 10,
  },
});

export default TaskForm;
