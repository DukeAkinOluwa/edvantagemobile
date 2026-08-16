import "expo-router/entry";
import { AppRegistry } from "react-native";
import notifee, { EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AlarmOverlay from "./components/AlarmOverlay";

// Register the standalone Alarm Overlay component for the native AlarmActivity
AppRegistry.registerComponent("AlarmOverlay", () => AlarmOverlay);

// --- Background Event Handler (Handles Snooze/Dismiss when app is closed) ---
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (type === EventType.ACTION_PRESS && pressAction?.id) {
    if (pressAction.id === "snooze") {
      const { snoozeAlarm } = require("./lib/alarmService");
      await snoozeAlarm(notification?.id || "alarm", notification?.title || "Alarm", notification?.body || "", 5);
    } else if (pressAction.id === "dismiss") {
      const { cancelAlarm } = require("./lib/alarmService");
      await cancelAlarm(notification?.id || "alarm");
    }
  }
});

// --- Foreground Event Handler ---
notifee.onForegroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (notification?.data?.isAlarm === "true") {
    // Execute action when Snooze or Dismiss is pressed
    if (type === EventType.ACTION_PRESS && pressAction?.id) {
      if (pressAction.id === "snooze") {
        const { snoozeAlarm } = require("./lib/alarmService");
        await snoozeAlarm(notification?.id || "alarm", notification?.title || "Alarm", notification?.body || "", 5);
      } else if (pressAction.id === "dismiss") {
        const { cancelAlarm } = require("./lib/alarmService");
        await cancelAlarm(notification?.id || "alarm");
      }
    }
  }
});
