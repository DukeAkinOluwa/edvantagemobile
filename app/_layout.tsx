import { darkTheme, lightTheme } from "@/assets/colors";
import { ThemeContext, UserDataContext } from "@/components/Header";
import { getData, saveData } from "@/utils/storage";
import * as FileSystem from "expo-file-system";
import * as Font from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Appearance, AppState, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NOTIFICATIONS_FILE = `${FileSystem.documentDirectory}notifications.json`;

export default function RootLayout() {
  interface UserData {
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
    phoneNumber?: string;
    password?: string;
    themeMode?: "system" | "light" | "dark";
    allowNotifications?: boolean;
    allowAlarms?: boolean;
    language?: string;
    privacy?: {
      showOnlineStatus: boolean;
      showProfileToGroups: boolean;
      allowFriendRequests: boolean;
      dataCollection: boolean;
    };
  }

  const defaultUserData: UserData = {
    themeMode: "system",
    allowNotifications: true,
    allowAlarms: true,
    language: "english",
    privacy: {
      showOnlineStatus: true,
      showProfileToGroups: true,
      allowFriendRequests: true,
      dataCollection: true,
    },
  };

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [userData, setUserDataState] = useState<UserData>(defaultUserData);
  const [themeMode, setThemeModeState] = useState<"system" | "light" | "dark">(
    "system"
  );
  const [theme, setTheme] = useState(
    Appearance.getColorScheme() === "dark" ? darkTheme : lightTheme
  );
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkMissedNotifications = async () => {
    try {
      const currentTime = Date.now();
      let scheduledNotifications =
        (await getData("scheduled_notifications")) || [];

      console.log("Raw scheduledNotifications:", scheduledNotifications);

      const validNotifications = scheduledNotifications.filter(
        (sn: any, index: number) => {
          if (!sn || typeof sn !== "object") {
            console.warn(`Invalid notification entry at index ${index}:`, sn);
            return false;
          }
          if (!("taskId" in sn) || !("triggerTime" in sn)) {
            console.warn(
              `Missing taskId or triggerTime at index ${index}:`,
              sn
            );
            return false;
          }
          if (
            typeof sn.taskId !== "string" ||
            typeof sn.triggerTime !== "number"
          ) {
            console.warn(
              `Invalid taskId or triggerTime type at index ${index}:`,
              sn
            );
            return false;
          }
          return true;
        }
      );

      const missedNotifications = validNotifications.filter(
        (sn: any) => sn.triggerTime < currentTime
      );

      const futureNotifications = validNotifications.filter(
        (sn: any) => sn.triggerTime >= currentTime
      );

      if (
        validNotifications.length !== scheduledNotifications.length ||
        missedNotifications.length > 0
      ) {
        console.log(
          "Cleaning up invalid or processed scheduled_notifications entries"
        );
        await saveData("scheduled_notifications", futureNotifications);
      }

      const notificationsContent = await FileSystem.readAsStringAsync(
        NOTIFICATIONS_FILE
      ).catch(() => "[]");
      let notifications = JSON.parse(notificationsContent) || [];
      const tasks = (await getData("tasks")) || [];

      for (const mn of missedNotifications) {
        const exists = notifications.some(
          (n: any) => n.data && n.data.taskId === mn.taskId
        );
        if (!exists) {
          const task = tasks.find((t: any) => t && t.id === mn.taskId);
          if (task) {
            const startTime = new Date(task.startTime);
            const formatTimeToAMPM = (date: Date): string => {
              let hours = date.getHours();
              const minutes = date.getMinutes();
              const ampm = hours >= 12 ? "PM" : "AM";
              hours = hours % 12 || 12;
              const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
              return `${hours}:${minutesStr} ${ampm}`;
            };

            const newNotification = {
              content: {
                title: `Upcoming Task: ${task.title}`,
                body: `Your task "${task.title}" starts at ${formatTimeToAMPM(
                  startTime
                )}.`,
                data: { taskId: task.id },
              },
              date: new Date(mn.triggerTime).toISOString(),
              read: false,
            };
            notifications.push(newNotification);
          } else {
            console.warn(`Task not found for taskId ${mn.taskId}`);
          }
        }
      }

      await FileSystem.writeAsStringAsync(
        NOTIFICATIONS_FILE,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Error checking missed notifications:", error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
          // Font loading code remains commented out as in the original
          // "Montserrat-Thin": require("@/assets/fonts/static/Montserrat-Thin.ttf"),
          // ... other fonts
        });

        const savedUserData = await getData("userData");
        if (savedUserData) {
          if (
            savedUserData.profilePic &&
            savedUserData.profilePic.startsWith(FileSystem.documentDirectory)
          ) {
            const fileInfo = await FileSystem.getInfoAsync(
              savedUserData.profilePic
            );
            if (!fileInfo.exists) {
              savedUserData.profilePic = undefined;
              await saveData("userData", savedUserData);
            }
          }
          const mergedUserData = { ...defaultUserData, ...savedUserData };
          setUserDataState(mergedUserData);
          const savedThemeMode = mergedUserData.themeMode || "system";
          setThemeModeState(savedThemeMode);
          setTheme(
            savedThemeMode === "system"
              ? Appearance.getColorScheme() === "dark"
                ? darkTheme
                : lightTheme
              : savedThemeMode === "dark"
              ? darkTheme
              : lightTheme
          );
        }

        const firstLaunch = await getData("firstLaunch");
        setIsFirstLaunch(firstLaunch === null || firstLaunch === "true");

        setFontsLoaded(true);
        await SplashScreen.hideAsync();

        await checkMissedNotifications();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Initialization failed";
        setError(errorMessage);
        console.error("Initialization error:", err);
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    };
    initialize();
  }, [router]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === "system") {
        setTheme(colorScheme === "dark" ? darkTheme : lightTheme);
      }
    });
    return () => subscription.remove();
  }, [themeMode]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkMissedNotifications();
      }
    });
    return () => subscription.remove();
  }, []);

  const handleSetUserData = async (data: Partial<UserData>) => {
    try {
      const newUserData = { ...userData, ...data };
      setUserDataState(newUserData);
      await saveData("userData", newUserData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save user data";
      setError(errorMessage);
      throw err;
    }
  };

  const handleSetThemeMode = async (mode: "system" | "light" | "dark") => {
    try {
      setThemeModeState(mode);
      setTheme(
        mode === "system"
          ? Appearance.getColorScheme() === "dark"
            ? darkTheme
            : lightTheme
          : mode === "dark"
          ? darkTheme
          : lightTheme
      );
      const newUserData = { ...userData, themeMode: mode };
      setUserDataState(newUserData);
      await saveData("userData", newUserData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to set theme";
      setError(errorMessage);
      throw err;
    }
  };

  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text
          style={{ color: lightTheme.error, fontSize: 18, marginBottom: 10 }}
        >
          Error: {error}
        </Text>
        <Text style={{ color: lightTheme.text, fontSize: 16 }}>
          Please check the console for details.
        </Text>
      </SafeAreaView>
    );
  }

  if (!fontsLoaded || isFirstLaunch === null) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ color: lightTheme.text }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemeContext.Provider
        value={{ theme, setThemeMode: handleSetThemeMode }}
      >
        <UserDataContext.Provider
          value={{ userData, setUserData: handleSetUserData, setIsFirstLaunch }}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            {isFirstLaunch ? (
              <Stack.Screen name="signUpPage" />
            ) : (
              <>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="+not-found" />
                <Stack.Screen name="chatroomscreen" />
                <Stack.Screen name="notifications-page" />
                <Stack.Screen name="userProfileScreen" />
                <Stack.Screen name="gamificationPage" />
                <Stack.Screen name="test" />
                <Stack.Screen name="task-form" />
                <Stack.Screen name="profile-page" />
                <Stack.Screen name="settingsPage" />
                <Stack.Screen name="faqsPage" />
                <Stack.Screen name="termsAndConditions" />
                <Stack.Screen name="chat/[chatId]" />
                <Stack.Screen name="study/[studyId]" />
                <Stack.Screen name="projects/[projectId]" />
              </>
            )}
          </Stack>
          <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
        </UserDataContext.Provider>
      </ThemeContext.Provider>
    </SafeAreaView>
  );
}
