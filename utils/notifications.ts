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

export interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
}

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
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerTime,
    },
  });
};

export const cancelNotification = async (taskId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(taskId);
    console.log("Canceled scheduled notification for task:", taskId);
  } catch (error) {
    console.error("Error canceling scheduled notification:", error);
  }
};

export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;
    
    // We don't pass projectId strictly since EAS will default to app.json configuration if running in Expo Go or EAS built app.
    // To be perfectly safe, we'll try catching the error and pass the projectId if needed.
    let token;
    try {
      token = await Notifications.getExpoPushTokenAsync({
        projectId: "4cf1f793-a004-4afa-81bc-88ac2263abc4" // Project ID from app.json
      });
    } catch (e: any) {
      // If we hit the FCM credential error on Android bare/EAS builds without google-services.json
      if (Platform.OS === 'android' && e.message?.includes("FirebaseApp is not initialized")) {
        console.warn("FCM Push Notifications are disabled: google-services.json is missing. Please download it from Firebase Console and link it in app.json.");
        return null;
      }
      
      console.warn("Failed to get Expo Push Token with specific Project ID, trying default.", e);
      token = await Notifications.getExpoPushTokenAsync();
    }
    
    return token?.data || null;
  } catch (error: any) {
    if (Platform.OS === 'android' && error.message?.includes("FirebaseApp is not initialized")) {
      console.warn("FCM Push Notifications are disabled: google-services.json is missing.");
    } else {
      console.error("Error getting push token:", error);
    }
    return null;
  }
};

export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
) => {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data,
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      console.error("Failed to send push notification via Expo", await response.text());
    }
  } catch (error) {
    console.error("Error sending push notification via Expo API:", error);
  }
};
