import { NavigationHeader, useTheme } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FontAwesome6 } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

const NOTIFICATIONS_FILE = `${FileSystem.documentDirectory}notifications.json`;

export default function NotificationsPage() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadNotifications = async () => {
    try {
      const content = await FileSystem.readAsStringAsync(NOTIFICATIONS_FILE);
      const notifications = JSON.parse(content) || [];
      setNotifications(notifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const markAllAsRead = async () => {
        try {
          const content = await FileSystem.readAsStringAsync(
            NOTIFICATIONS_FILE
          );
          let notifications = JSON.parse(content) || [];
          notifications = notifications.map((n: any) => ({ ...n, read: true }));
          await FileSystem.writeAsStringAsync(
            NOTIFICATIONS_FILE,
            JSON.stringify(notifications)
          );
          setNotifications(notifications);
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      };
      markAllAsRead();
      loadNotifications();
    }, [])
  );

  const renderNotification = ({ item }: { item: any }) => (
    <ThemedView
      style={[
        styles.notificationItem,
        { backgroundColor: theme.background, borderColor: theme.border },
      ]}
    >
      <View style={styles.iconContainer}>
        <FontAwesome6 name="bell" size={20} color={theme.primary} />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={{ color: theme.text }}>
          {item.content.title}
        </ThemedText>
        <ThemedText style={{ color: theme.text }}>
          {item.content.body}
        </ThemedText>
        <ThemedText style={{ color: theme.text, fontSize: 12 }}>
          {new Date(item.date).toLocaleString()}
        </ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <NavigationHeader title="Notifications" />
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={
          <ThemedText
            style={{ color: theme.text, textAlign: "center", marginTop: 20 }}
          >
            No notifications available.
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 70,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 5,
    marginHorizontal: 15,
  },
  iconContainer: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
});
