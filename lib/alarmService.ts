// lib/alarmService.ts
// Core alarm scheduling engine using Notifee

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from "@notifee/react-native";
import { Platform } from "react-native";

/**
 * Ensures permissions for exact alarms and notifications.
 */
export async function requestAlarmPermissions() {
  await notifee.requestPermission();

  if (Platform.OS === "android") {
    // Android 12+ requires explicit exact alarm permission
    const settings = await notifee.getNotificationSettings();
    if (settings.android.alarm == notifee.AndroidAlarmPermissionStatus.DENIED) {
      // In a real app, you would prompt the user before calling this,
      // as it opens the OS settings page.
      await notifee.openAlarmPermissionSettings();
    }
  }
}

/**
 * Creates the high-priority Android channel required for alarms.
 */
async function createAlarmChannel() {
  if (Platform.OS !== "android") return "alarm-channel";

  return await notifee.createChannel({
    id: "alarm-channel",
    name: "Alarms",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: "default", // Or your custom sound
    vibration: true,
    bypassDnd: true, // Crucial for alarms
  });
}

/**
 * Schedules a precise alarm that wakes the device.
 */
export async function scheduleAlarm(
  id: string,
  timestampMs: number,
  title: string,
  body: string
) {
  const channelId = await createAlarmChannel();

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: timestampMs,
    alarmManager: {
      allowWhileIdle: true, // Wakes device from Doze
    },
  };

  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: {
        channelId,
        category: notifee.AndroidCategory.ALARM,
        // Full screen intent for lock screen overlay
        fullScreenAction: {
          id: "default",
          mainComponent: "AlarmOverlay", // Needs to be registered in index.js
        },
        ongoing: true,
        autoCancel: false,
        actions: [
          {
            title: "Snooze",
            pressAction: { id: "snooze" },
          },
          {
            title: "Dismiss",
            pressAction: { id: "dismiss" },
          },
        ],
      },
      ios: {
        critical: true, // Bypasses mute switch on iOS (requires Apple entitlement in prod)
        sound: "default",
      },
    },
    trigger
  );
}

/**
 * Cancels a scheduled alarm.
 */
export async function cancelAlarm(id: string) {
  await notifee.cancelNotification(id);
}

/**
 * Snoozes an active alarm by rescheduling it for X minutes later.
 */
export async function snoozeAlarm(id: string, title: string, body: string, snoozeMinutes = 5) {
  await cancelAlarm(id);
  const newTime = Date.now() + snoozeMinutes * 60000;
  await scheduleAlarm(id, newTime, title, body);
}
