// lib/alarmService.ts
// Core alarm scheduling engine using Notifee

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AndroidNotificationSetting,
  AndroidCategory,
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
    if (settings.android.alarm !== AndroidNotificationSetting.ENABLED) {
      // In a real app, you would prompt the user before calling this,
      // as it opens the OS settings page.
      await notifee.openAlarmPermissionSettings();
    }
  }
}

/**
 * Creates the high-priority Android channel required for alarms.
 */
async function createAlarmChannel(soundType: "default" | "alarm_default" = "default") {
  if (Platform.OS !== "android") return "alarm-channel-sys-v5";

  const soundUri = soundType === "default" ? "content://settings/system/alarm_alert" : "alarm_default";
  const channelId = soundType === "default" ? "alarm-channel-sys-v5" : "alarm-channel-custom-v5";
  const channelName = soundType === "default" ? "Alarms (System Alarm Sound)" : "Alarms (Custom Beep)";

  return await notifee.createChannel({
    id: channelId,
    name: channelName,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: soundUri,
    vibration: true,
    vibrationPattern: [500, 1000, 500, 1000],
    bypassDnd: true,
  });
}

/**
 * Schedules a precise alarm that wakes the device.
 */
export async function scheduleAlarm(
  id: string,
  timestampMs: number,
  title: string,
  body: string,
  soundType: "default" | "alarm_default" = "default"
) {
  const channelId = await createAlarmChannel(soundType);
  const soundUri = soundType === "default" ? "content://settings/system/alarm_alert" : "alarm_default";

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: timestampMs,
    alarmManager: {
      allowWhileIdle: true, // Wakes device from Doze
    },
  };

  try {
    await notifee.createTriggerNotification(
      {
        id,
        title,
        body,
        data: { isAlarm: "true", id, title, body },
        android: {
          channelId,
          category: AndroidCategory.ALARM,
          sound: soundUri,
          loopSound: true, // Make sure the ringtone loops continuously until dismissed
          visibility: AndroidVisibility.PUBLIC,
          importance: AndroidImportance.HIGH,
          fullScreenAction: {
            id: "default",
            launchActivity: "com.akinoluwa.edvantage.dev.AlarmActivity",
          },
          ongoing: true,
          autoCancel: false,
          timeoutAfter: 300000, // Optional: auto-cancel after 5 minutes if completely ignored
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
          critical: true,
          sound: soundType === "default" ? "default" : "alarm_default.wav",
        },
      },
      trigger
    );
    console.log(`[AlarmService] Successfully scheduled alarm: ${id} at ${new Date(timestampMs).toLocaleTimeString()}`);
  } catch (error) {
    console.error("[AlarmService] CRITICAL ERROR scheduling alarm:", error);
  }
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
