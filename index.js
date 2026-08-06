import "expo-router/entry";
import { AppRegistry } from "react-native";
import notifee, { EventType } from "@notifee/react-native";
import AlarmOverlay from "./app/alarm-overlay";

// --- Background Event Handler (Handles Snooze/Dismiss when app is closed) ---
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (type === EventType.ACTION_PRESS && pressAction?.id) {
    if (pressAction.id === "snooze") {
      // Dynamic import to avoid circular dependencies during boot
      const { snoozeAlarm } = require("./lib/alarmService");
      const { stopAlarmAudio } = require("./lib/alarmAudioService");
      await stopAlarmAudio();
      await snoozeAlarm(notification?.id || "alarm", notification?.title || "Alarm", notification?.body || "", 5);
    } else if (pressAction.id === "dismiss") {
      const { cancelAlarm } = require("./lib/alarmService");
      const { stopAlarmAudio } = require("./lib/alarmAudioService");
      await stopAlarmAudio();
      await cancelAlarm(notification?.id || "alarm");
    }
  }
});

// --- Register Custom UI for Android Lock-Screen Full-Screen Intent ---
// This mounts ONLY this component instantly over the lock screen without booting Expo Router
AppRegistry.registerComponent("AlarmOverlay", () => AlarmOverlay);
