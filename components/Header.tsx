import { useGlobalStyles } from "@/styles/globalStyles";
import { FontAwesome6 } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Notifications from "expo-notifications";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { lightTheme } from "../assets/colors";
import { requestNotificationPermissions } from "../utils/notifications";
import { ThemedText } from "./ThemedText";

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
    department?: string;
    faculty?: string;
    university?: string;
    email?: string;
    themeMode?: string;
    allowNotifications?: boolean;
    allowAlarms?: boolean;
    privacy?: {
      showOnlineStatus: boolean;
      showProfileToGroups: boolean;
      allowFriendRequests: boolean;
      dataCollection: boolean;
    };
  };
  setUserData: (data: Partial<UserDataContextType["userData"]>) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  setThemeMode: () => {},
});

export const UserDataContext = createContext<UserDataContextType>({
  userData: { university: "" },
  setUserData: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
};

const NOTIFICATIONS_FILE = `${FileSystem.documentDirectory}notifications.json`;

// Memoized Image component to prevent unnecessary re-renders
const ProfileImage = memo(
  ({ uri, borderColor }: { uri: string; borderColor: string }) => (
    <Image source={{ uri }} style={[styles.profilePic, { borderColor }]} />
  )
);

export const NavigationHeader = ({ title }: { title: string }) => {
  const router = useRouter();
  const globalStyles = useGlobalStyles();
  const { theme } = useTheme();
  const { userData } = useUserData();
  const [newNotificationCount, setNewNotificationCount] = useState(0);

  // Memoize the image URI to prevent flickering
  const imageUri = useMemo(() => {
    return userData.profilePic || "https://via.placeholder.com/40";
  }, [userData.profilePic]);

  const updateNotificationCount = async () => {
    try {
      const fileExists = await FileSystem.getInfoAsync(NOTIFICATIONS_FILE);
      if (!fileExists.exists) {
        setNewNotificationCount(0);
        console.log("Header: Badge count updated to: 0 (file not found)");
        return;
      }

      const content = await FileSystem.readAsStringAsync(NOTIFICATIONS_FILE);
      const notifications = JSON.parse(content) || [];
      const newCount = notifications.filter((n: any) => !n.read).length;
      setNewNotificationCount(newCount);
      console.log("Header: Badge count updated to:", newCount);
    } catch (error) {
      console.error("Header: Error updating notification count:", error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await requestNotificationPermissions();
        await updateNotificationCount();
      } catch (error) {
        console.error("Header: Error during initialization:", error);
      }
    };
    initialize();

    // Set up notification listener
    const subscription = Notifications.addNotificationReceivedListener(
      async (notification) => {
        try {
          const content = await FileSystem.readAsStringAsync(
            NOTIFICATIONS_FILE
          );
          let notifications = JSON.parse(content) || [];
          notifications.push({ ...notification, read: false });
          await FileSystem.writeAsStringAsync(
            NOTIFICATIONS_FILE,
            JSON.stringify(notifications)
          );
          await updateNotificationCount();
        } catch (error) {
          console.error("Error handling notification:", error);
        }
      }
    );

    // Poll for notification count updates
    const interval = setInterval(updateNotificationCount, 5000);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return (
    <View
      style={[styles.headerContainer, { backgroundColor: theme.background }]}
    >
      <ThemedText type="semiLarge" style={styles.headerTitle}>
        {title}
      </ThemedText>
      <View
        style={[styles.headerButtons, { backgroundColor: theme.background }]}
      >
        <TouchableOpacity
          onPress={() => router.push("/notifications-page")}
          activeOpacity={0.7}
        >
          <View style={styles.notificationButton}>
            <FontAwesome6 name="bell" size={25} color={theme.text} />
            {newNotificationCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.error }]}>
                <ThemedText type="base" style={styles.badgeText}>
                  {newNotificationCount}
                </ThemedText>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/gamificationPage")}
          activeOpacity={0.7}
        >
          <MaskedView
            style={{ height: 25, width: 25 }}
            maskElement={
              <FontAwesome6 name="bolt" size={25} color={theme.primary} />
            }
          >
            <LinearGradient
              colors={[theme.primary, theme.accent || theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />
          </MaskedView>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/profile-page")}
          activeOpacity={0.7}
        >
          <ProfileImage uri={imageUri} borderColor={theme.border} />
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
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
    fontSize: 12,
    fontWeight: "bold",
  },
  gradient: {
    width: 60,
    height: 60,
  },
});
