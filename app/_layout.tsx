import { darkTheme, lightTheme } from "@/assets/colors";
import { ThemeContext, UserDataContext } from "@/components/Header";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { getData, saveData } from "@/utils/storage";
import userDataInfo from "@/utils/userDataInfo";
import * as FileSystem from "expo-file-system";
import * as Font from "expo-font";
import { Stack, router, usePathname, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { Component, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Appearance, AppState, Text } from "react-native";
import { AlertNotificationRoot } from "react-native-alert-notification";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const NOTIFICATIONS_FILE = `${FileSystem.documentDirectory}notifications.json`;

// ErrorBoundary to catch and log errors without displaying them
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing or a fallback UI without error details
      return null;
    }
    return this.props.children;
  }
}

let isRouterPatched = false;

export default function RootLayout() {
  const pathname = usePathname();
  const currentPathRef = useRef(pathname);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!isRouterPatched && router) {
      const originalPush = router.push;
      router.push = (href, options) => {
        const targetPath = typeof href === 'string' ? href : href?.pathname;
        const targetBase = targetPath?.split('?')[0];
        const currentBase = currentPathRef.current?.split('?')[0];
        
        if (targetBase && targetBase === currentBase) {
          console.log(`Prevented stacking identical screen: ${targetBase}`);
          return;
        }
        originalPush(href, options);
      };
      isRouterPatched = true;
    }
  }, []);
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

  const checkMissedNotifications = async () => {
    try {
      const currentTime = Date.now();
      let scheduledNotifications =
        (await getData("scheduled_notifications")) || [];



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
        console.log("Starting RootLayout initialization");
        await SplashScreen.preventAutoHideAsync();
        console.log("Loading fonts");
        await Font.loadAsync({
          // "Montserrat-Thin": require("@/assets/fonts/static/Montserrat-Thin.ttf"),
          // "Montserrat-ExtraLight": require("@/assets/fonts/static/Montserrat-ExtraLight.ttf"),
          // "Montserrat-Light": require("@/assets/fonts/static/Montserrat-Light.ttf"),
          // "Montserrat-Regular": require("@/assets/fonts/static/Montserrat-Regular.ttf"),
          // "Montserrat-Medium": require("@/assets/fonts/static/Montserrat-Medium.ttf"),
          // "Montserrat-SemiBold": require("@/assets/fonts/static/Montserrat-SemiBold.ttf"),
          // "Montserrat-Bold": require("@/assets/fonts/static/Montserrat-Bold.ttf"),
          // "Montserrat-ExtraBold": require("@/assets/fonts/static/Montserrat-ExtraBold.ttf"),
          // "Montserrat-Black": require("@/assets/fonts/static/Montserrat-Black.ttf"),
          // "Montserrat-ThinItalic": require("@/assets/fonts/static/Montserrat-ThinItalic.ttf"),
          // "Montserrat-ExtraLightItalic": require("@/assets/fonts/static/Montserrat-ExtraLightItalic.ttf"),
          // "Montserrat-LightItalic": require("@/assets/fonts/static/Montserrat-LightItalic.ttf"),
          // "Montserrat-Italic": require("@/assets/fonts/static/Montserrat-Italic.ttf"),
          // "Montserrat-MediumItalic": require("@/assets/fonts/static/Montserrat-MediumItalic.ttf"),
          // "Montserrat-SemiBoldItalic": require("@/assets/fonts/static/Montserrat-SemiBoldItalic.ttf"),
          // "Montserrat-BoldItalic": require("@/assets/fonts/static/Montserrat-BoldItalic.ttf"),
          // "Montserrat-ExtraBoldItalic": require("@/assets/fonts/static/Montserrat-ExtraBoldItalic.ttf"),
          // "Montserrat-BlackItalic": require("@/assets/fonts/static/Montserrat-BlackItalic.ttf"),
        });
        console.log("Fonts loaded");

        const savedUserData = await getData("userData");
        console.log("Saved user data:", savedUserData);
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
        console.log("First launch:", firstLaunch);

        setFontsLoaded(true);
        await SplashScreen.hideAsync();
        console.log("Splash screen hidden");

        await checkMissedNotifications();
        console.log("Missed notifications checked");
      } catch (err) {
        console.error("Initialization error:", err);
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    };
    initialize();
  }, []);

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

  const handleSetUserData = useCallback(async (data: Partial<UserData>) => {
    try {
      setUserDataState((prev) => {
        const newUserData = { ...prev, ...data };
        saveData("userData", newUserData).catch((err) =>
          console.error("Failed to save user data:", err)
        );
        return newUserData;
      });
    } catch (err) {
      console.error("Failed to save user data:", err);
      throw err;
    }
  }, []);

  const handleSetThemeMode = useCallback(
    async (mode: "system" | "light" | "dark") => {
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
        setUserDataState((prev) => {
          const newUserData = { ...prev, themeMode: mode };
          saveData("userData", newUserData).catch((err) =>
            console.error("Failed to save user data:", err)
          );
          return newUserData;
        });
      } catch (err) {
        console.error("Failed to set theme:", err);
        throw err;
      }
    },
    []
  );

  const setIsFirstLaunchHandler = async (value: boolean) => {
    try {
      setIsFirstLaunch(value);
      await saveData("firstLaunch", value.toString());
    } catch (err) {
      console.error("Failed to set first launch:", err);
    }
  };

  if (!fontsLoaded || isFirstLaunch === null) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: lightTheme.text }}>Loading...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AlertNotificationRoot>
        <ErrorBoundary>
          <AuthProvider>
            <AuthGatedLayout
              theme={theme}
              themeMode={themeMode}
              userData={userData}
              handleSetUserData={handleSetUserData}
              handleSetThemeMode={handleSetThemeMode}
            />
          </AuthProvider>
        </ErrorBoundary>
      </AlertNotificationRoot>
    </SafeAreaProvider>
  );
}

// ─── Auth-gated layout (uses useAuth inside AuthProvider) ─────────────────────

function AuthGatedLayout({
  theme,
  themeMode,
  userData,
  handleSetUserData,
  handleSetThemeMode,
}: {
  theme: typeof lightTheme;
  themeMode: "system" | "light" | "dark";
  userData: any;
  handleSetUserData: (data: any) => Promise<void>;
  handleSetThemeMode: (mode: "system" | "light" | "dark") => Promise<void>;
}) {
  const { user, profile, loading: authLoading, profileLoading } = useAuth();

  // Sync Firestore profile into userDataInfo when auth user changes
  useEffect(() => {
    if (user?.uid) {
      userDataInfo.setUid(user.uid);
      userDataInfo.syncFromFirestore(user.uid)
        .then(() => {
          const synced = userDataInfo.getData();
          handleSetUserData(synced).catch(console.error);
        })
        .catch(console.error);
    } else {
      userDataInfo.setUid(null);
    }
  }, [user, profile]);

  const segments = useSegments();
  const isNewUser = !!user && profile === null;

  useEffect(() => {
    if (authLoading || profileLoading) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "signUpPage";

    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && isNewUser && segments[0] !== "signUpPage") {
      router.replace("/signUpPage");
    } else if (user && !isNewUser && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, profile, authLoading, profileLoading, segments, isNewUser]);

  // Memoize context values to prevent O(N) re-renders of all screens on every navigation
  const themeContextValue = useMemo(
    () => ({ theme, setThemeMode: handleSetThemeMode }),
    [theme, handleSetThemeMode]
  );
  
  const userDataContextValue = useMemo(
    () => ({ userData, setUserData: handleSetUserData }),
    [userData, handleSetUserData]
  );

  const stackScreenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: theme.background },
    }),
    [theme.background]
  );

  // Show a loading screen while auth or profile is resolving
  if (authLoading || profileLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center",
          backgroundColor: theme.background }}
      >
        <Text style={{ color: theme.text }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemeContext.Provider value={themeContextValue}>
        <UserDataContext.Provider value={userDataContextValue}>
          <Stack screenOptions={stackScreenOptions}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signUpPage" />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="notifications-page" />
            <Stack.Screen name="userProfileScreen" />
            <Stack.Screen name="gamificationPage" />
            <Stack.Screen name="task-form" />
            <Stack.Screen name="profile-page" />
            <Stack.Screen name="settingsPage" />
            <Stack.Screen name="faqsPage" />
            <Stack.Screen name="termsAndConditions" />
            <Stack.Screen name="chat/[chatId]" />
            <Stack.Screen name="study/[studyId]" />
            <Stack.Screen name="projects/[projectId]" />
          </Stack>
          <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
        </UserDataContext.Provider>
      </ThemeContext.Provider>
    </SafeAreaView>
  );
}

