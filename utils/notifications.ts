import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    if (status !== "granted") {
      console.log("Notification permissions not granted");
      return false;
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
};

export const scheduleEventNotification = async (task: Task) => {
  const startTime = new Date(task.startTime);
  const triggerTime = new Date(startTime.getTime() - 5 * 60 * 1000); // 5 minutes before
  const now = new Date();

  if (triggerTime < now) {
    console.log("Trigger time is in the past, not scheduling notification.");
    return;
  }

  // Format start time to AM/PM
  const formatTimeToAMPM = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Upcoming Task: ${task.title}`,
      body: `Your task "${task.title}" starts at ${formatTimeToAMPM(
        startTime
      )}.`,
      data: { taskId: task.id },
    },
    trigger: triggerTime,
  });
};
