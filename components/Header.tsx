import { useGlobalStyles } from "@/styles/globalStyles";
import { getData, saveData } from "@/utils/storage";
import { FontAwesome6 } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { lightTheme } from "../assets/colors";
import { requestNotificationPermissions } from "../utils/notifications";

interface ThemeContextType {
  theme: typeof lightTheme;
  setThemeMode: (mode: "system" | "light" | "dark") => void;
}

interface UserDataContextType {
  userData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    dob?: string;
    gender?: string;
    profilePic?: string;
    course?: string;
    level?: string;
    themeMode?: string;
    allowNotifications?: boolean;
    allowAlarms?: boolean;
    email?: string;
    university: string;
  };
  setUserData: (data: Partial<UserDataContextType["userData"]>) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  setThemeMode: () => {},
});

export const UserDataContext = createContext<UserDataContextType>({
  userData: {},
  setUserData: () => {},
});

export const useTheme = () => useContext(ThemeContext);
export const useUserData = () => useContext(UserDataContext);

interface NavigationHeaderProps {
  title: string;
}

export const NavigationHeader = ({ title }: NavigationHeaderProps) => {
  const router = useRouter();
  const globalStyles = useGlobalStyles();
  const { theme } = useTheme();
  const { userData } = useUserData();
  const [newNotificationCount, setNewNotificationCount] = useState(0);

  const updateNotificationCount = async () => {
    const notificationHistory = (await getData("notificationHistory")) || [];
    const newCount = notificationHistory.filter(
      (n: { isNew: boolean }) => n.isNew
    ).length;
    setNewNotificationCount(newCount);
  };

  useEffect(() => {
    const initialize = async () => {
      await requestNotificationPermissions();
      await updateNotificationCount();
    };
    initialize();

    const subscription = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const notificationHistory =
          (await getData("notificationHistory")) || [];
        const newNotification = {
          id: notification.request.identifier,
          title: notification.request.content.title,
          body: notification.request.content.body,
          timestamp: Date.now(),
          isNew: true,
        };
        notificationHistory.push(newNotification);
        await saveData("notificationHistory", notificationHistory);
        await updateNotificationCount();
      }
    );

    const interval = setInterval(updateNotificationCount, 1000);
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.headerContainer}>
      <Text style={[styles.headerTitle, globalStyles.semiLargeText]}>
        {title}
      </Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          onPress={() => router.push("/notifications-page")}
          style={styles.button}
          activeOpacity={0.7}
        >
          <View style={styles.notificationButton}>
            <FontAwesome6 name="bell" size={25} />
            {newNotificationCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                <Text style={styles.badgeText}>{newNotificationCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/gamificationPage")}
          style={styles.button}
          activeOpacity={0.7}
        >
          <MaskedView
            style={{ height: 25, width: 25 }}
            maskElement={<FontAwesome6 name="bolt" size={25} color="#2A52BE" />}
          >
            <LinearGradient
              colors={["#2A52BE", "#2B7FFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />
          </MaskedView>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/profile-page")}
          style={styles.profileButton}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri: userData.profilePic || "https://via.placeholder.com/40",
            }}
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 21,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 20,
    height: 30,
    alignItems: "center",
    justifyContent: "space-between",
  },
  gradient: {
    width: 60,
    height: 60,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  button: {
    padding: 10,
  },
  profileButton: {
    padding: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  notificationButton: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
