import { darkTheme, lightTheme } from "@/assets/colors";
import { ThemeContext, UserDataContext } from "@/components/Header";
import { getData, saveData } from "@/utils/storage";
import * as FileSystem from "expo-file-system";
import * as Font from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Appearance, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  useEffect(() => {
    const initialize = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
          "Montserrat-Thin": require("@/assets/fonts/static/Montserrat-Thin.ttf"),
          "Montserrat-ExtraLight": require("@/assets/fonts/static/Montserrat-ExtraLight.ttf"),
          "Montserrat-Light": require("@/assets/fonts/static/Montserrat-Light.ttf"),
          "Montserrat-Regular": require("@/assets/fonts/static/Montserrat-Regular.ttf"),
          "Montserrat-Medium": require("@/assets/fonts/static/Montserrat-Medium.ttf"),
          "Montserrat-SemiBold": require("@/assets/fonts/static/Montserrat-SemiBold.ttf"),
          "Montserrat-Bold": require("@/assets/fonts/static/Montserrat-Bold.ttf"),
          "Montserrat-ExtraBold": require("@/assets/fonts/static/Montserrat-ExtraBold.ttf"),
          "Montserrat-Black": require("@/assets/fonts/static/Montserrat-Black.ttf"),
          "Montserrat-ThinItalic": require("@/assets/fonts/static/Montserrat-ThinItalic.ttf"),
          "Montserrat-ExtraLightItalic": require("@/assets/fonts/static/Montserrat-ExtraLightItalic.ttf"),
          "Montserrat-LightItalic": require("@/assets/fonts/static/Montserrat-LightItalic.ttf"),
          "Montserrat-Italic": require("@/assets/fonts/static/Montserrat-Italic.ttf"),
          "Montserrat-MediumItalic": require("@/assets/fonts/static/Montserrat-MediumItalic.ttf"),
          "Montserrat-SemiBoldItalic": require("@/assets/fonts/static/Montserrat-SemiBoldItalic.ttf"),
          "Montserrat-BoldItalic": require("@/assets/fonts/static/Montserrat-BoldItalic.ttf"),
          "Montserrat-ExtraBoldItalic": require("@/assets/fonts/static/Montserrat-ExtraBoldItalic.ttf"),
          "Montserrat-BlackItalic": require("@/assets/fonts/static/Montserrat-BlackItalic.ttf"),
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
          value={{ userData, setUserData: handleSetUserData }}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            {isFirstLaunch ? (
              <Stack.Screen name="login" />
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
