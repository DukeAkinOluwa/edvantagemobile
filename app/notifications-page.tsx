import { NavigationHeader, useTheme } from "@/components/Header";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, View } from "react-native";
import { cancelNotification } from "../utils/notifications";
import { getData, saveData } from "../utils/storage";

interface NotificationRecord {
  id: string;
  taskId?: string;
  title: string;
  body: string;
  timestamp: number;
  isNew: boolean;
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const savedNotifications = (await getData("notificationHistory")) || [];
    console.log("Fetched notifications:", savedNotifications);
    setNotifications(savedNotifications);
    await saveData("notificationsVisited", true); // Mark as visited
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
    return () => {
      const markAllAsOld = async () => {
        const updatedNotifications = notifications.map((n) => ({
          ...n,
          isNew: false,
        }));
        await saveData("notificationHistory", updatedNotifications);
        console.log("Marked all notifications as old");
      };
      markAllAsOld();
    };
  }, [fetchNotifications]);

  const deleteAllNotifications = async () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          onPress: async () => {
            const notificationRecords =
              (await getData("notificationHistory")) || [];
            for (const notification of notificationRecords) {
              if (notification.taskId) {
                await cancelNotification(notification.taskId);
              }
            }
            await saveData("notificationHistory", []);
            await saveData("notifications", []);
            setNotifications([]);
            Alert.alert("Success", "All notifications deleted.");
          },
        },
      ]
    );
  };

  const renderNotification = ({ item }: { item: NotificationRecord }) => (
    <View
      style={[
        styles.notificationItem,
        { backgroundColor: theme.background, borderColor: theme.border },
      ]}
    >
      <Text
        style={[
          styles.notificationTitle,
          { color: item.isNew ? theme.accent : theme.text },
        ]}
      >
        {item.title}
      </Text>
      <Text
        style={[
          styles.notificationBody,
          { color: item.isNew ? theme.accent : theme.text },
        ]}
      >
        {item.body}
      </Text>
      <Text style={[styles.notificationTimestamp, { color: theme.text }]}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: "center" }}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title="Notifications" />
      {notifications.length === 0 ? (
        <Text style={[styles.noNotifications, { color: theme.text }]}>
          No notifications yet.
        </Text>
      ) : (
        <>
          <Button
            title="Delete All Notifications"
            onPress={deleteAllNotifications}
            color={theme.primary}
          />
          <FlatList
            data={notifications.sort((a, b) => b.timestamp - a.timestamp)}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            style={styles.notificationList}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  notificationList: { marginTop: 20 },
  notificationItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 14,
    marginBottom: 5,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: "#888",
  },
  noNotifications: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
