import * as Notifications from "expo-notifications";
import { getData, saveData } from "./storage";

// Ask for notification permissions
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.log("Notification permissions not granted");
    return false;
  }
  return true;
}

// Schedule a task reminder 5 minutes before start
export async function scheduleEventNotification(task: {
  id: string;
  title: string;
  startTime: string;
}) {
  const userData = await getData("userData");
  if (userData?.allowNotifications === false) return;

  const notifications = (await getData("notifications")) || [];

  const trigger = new Date(new Date(task.startTime).getTime() - 5 * 60 * 1000);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Upcoming Task: ${task.title}`,
      body: `Your task starts at ${new Date(
        task.startTime
      ).toLocaleTimeString()}`,
      data: { taskId: task.id, title: task.title, startTime: task.startTime },
    },
    trigger,
  });

  notifications.push({ taskId: task.id, notificationId, type: "notification" });
  await saveData("notifications", notifications);
}

// Send immediate alarm notification
export async function triggerAlarm(task: {
  id: string;
  title: string;
  startTime: string;
}) {
  const userData = await getData("userData");
  if (userData?.allowAlarms === false) return;

  const notifications = (await getData("notifications")) || [];
  const notificationHistory = (await getData("notificationHistory")) || [];

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Alarm: ${task.title}`,
      body: "Your task is starting now!",
      data: { taskId: task.id, startTime: task.startTime },
    },
    trigger: null,
    ios: {
      categoryIdentifier: "ALARM",
    },
    android: {
      channelId: "alarms",
      sticky: true,
    },
  });

  notifications.push({ taskId: task.id, notificationId, type: "alarm" });

  notificationHistory.push({
    id: notificationId,
    taskId: task.id,
    title: `Alarm: ${task.title}`,
    body: "Your task is starting now!",
    timestamp: Date.now(),
    isNew: true,
  });

  await saveData("notifications", notifications);
  await saveData("notificationHistory", notificationHistory);
}

// Cancel notifications for a task
export async function cancelNotification(taskId: string) {
  const notifications = (await getData("notifications")) || [];
  const notificationHistory = (await getData("notificationHistory")) || [];

  const taskNotifications = notifications.filter(
    (n: { taskId: string }) => n.taskId === taskId
  );
  for (const n of taskNotifications) {
    await Notifications.cancelScheduledNotificationAsync(n.notificationId);
  }

  const updatedNotifications = notifications.filter(
    (n: { taskId: string }) => n.taskId !== taskId
  );
  const updatedHistory = notificationHistory.filter(
    (n: { taskId?: string }) => n.taskId !== taskId
  );

  await saveData("notifications", updatedNotifications);
  await saveData("notificationHistory", updatedHistory);
}

// Snooze functionality (5 minutes)
export async function snoozeAlarm(taskId: string, startTime: string) {
  const userData = await getData("userData");
  if (userData?.allowAlarms === false) return;

  const notifications = (await getData("notifications")) || [];
  const notificationHistory = (await getData("notificationHistory")) || [];

  const task = { id: taskId, title: `Snoozed: ${taskId}`, startTime };
  const trigger = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Alarm: ${task.title}`,
      body: "Your snoozed task is starting now!",
      data: { taskId: task.id, startTime: task.startTime },
    },
    trigger,
    ios: {
      categoryIdentifier: "ALARM",
    },
    android: {
      channelId: "alarms",
      sticky: true,
    },
  });

  notifications.push({ taskId: task.id, notificationId, type: "alarm" });

  notificationHistory.push({
    id: notificationId,
    taskId: task.id,
    title: `Alarm: ${task.title}`,
    body: "Your snoozed task is starting now!",
    timestamp: Date.now(),
    isNew: true,
  });

  await saveData("notifications", notifications);
  await saveData("notificationHistory", notificationHistory);
}

// Default behavior for notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Register custom category for alarms
Notifications.setNotificationCategoryAsync("ALARM", [
  { identifier: "DISMISS", buttonTitle: "Dismiss" },
  { identifier: "SNOOZE", buttonTitle: "Snooze" },
]);

// Handle alarm action buttons (SNOOZE)
Notifications.addNotificationResponseReceivedListener(async (response) => {
  const actionId = response.actionIdentifier;
  const { taskId, startTime } =
    response.notification.request.content.data || {};

  if (actionId === "SNOOZE" && taskId && startTime) {
    await snoozeAlarm(taskId, startTime);
  }
});

// Log delivered notifications (only when fired)
Notifications.addNotificationReceivedListener(async (notification) => {
  const { taskId, title, startTime } = notification.request.content.data || {};
  if (!taskId || !title || !startTime) return;

  const notificationHistory = (await getData("notificationHistory")) || [];

  notificationHistory.push({
    id: notification.request.identifier,
    taskId,
    title: `Upcoming Task: ${title}`,
    body: `Your task starts at ${new Date(startTime).toLocaleTimeString()}`,
    timestamp: Date.now(),
    isNew: true,
  });

  await saveData("notificationHistory", notificationHistory);
});
