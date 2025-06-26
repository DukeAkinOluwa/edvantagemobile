import { darkTheme, lightTheme } from "@/assets/colors";
import { ThemeContext, UserDataContext } from "@/components/Header";
import { useColorScheme } from "@/hooks/useColorScheme";
import { MyDarkTheme, MyLightTheme } from "@/theme";
import { getData, saveData } from "@/utils/storage";
import { ThemeProvider } from "@react-navigation/native";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Appearance } from "react-native";
import "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [userData, setUserDataState] = useState({});
  const [theme, setTheme] = useState(lightTheme);
  const [themeMode, setThemeModeState] = useState<"system" | "light" | "dark">(
    "system"
  );

  useEffect(() => {
    const initialize = async () => {
      console.log("RootLayout: Initializing");
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
      console.log("RootLayout: Loaded userData:", savedUserData);
      if (savedUserData) {
        setUserDataState(savedUserData);
        if (savedUserData.themeMode) {
          setThemeModeState(savedUserData.themeMode);
          setTheme(savedUserData.themeMode === "dark" ? darkTheme : lightTheme);
        }
      }
      const savedThemeMode = await getData("themeMode");
      if (savedThemeMode) {
        setThemeModeState(savedThemeMode);
        setTheme(savedThemeMode === "dark" ? darkTheme : lightTheme);
      }
      setFontsLoaded(true);
      await SplashScreen.hideAsync();
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

  const handleSetUserData = async (data) => {
    const newUserData = { ...userData, ...data };
    setUserDataState(newUserData);
    await saveData("userData", newUserData);
    console.log("RootLayout: Saved userData:", newUserData);
  };

  const handleSetThemeMode = async (mode: "system" | "light" | "dark") => {
    setThemeModeState(mode);
    setTheme(
      mode === "light"
        ? lightTheme
        : mode === "dark"
        ? darkTheme
        : Appearance.getColorScheme() === "dark"
        ? darkTheme
        : lightTheme
    );
    await saveData("themeMode", mode);
    setUserDataState((prev) => ({ ...prev, themeMode: mode }));
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemeContext.Provider
        value={{ theme, setThemeMode: handleSetThemeMode }}
      >
        <UserDataContext.Provider
          value={{ userData, setUserData: handleSetUserData }}
        >
          <ThemeProvider
            value={colorScheme === "dark" ? MyDarkTheme : MyLightTheme}
          >
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="+not-found"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="chatroomscreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="notifications-page"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="userProfileScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="gamificationPage"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="test" options={{ headerShown: false }} />
              <Stack.Screen
                name="task-form"
                options={{ headerShown: true, headerTitle: "Create Event" }}
              />
              <Stack.Screen
                name="profile-page"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="settingsPage"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="faqsPage" options={{ headerShown: false }} />
              <Stack.Screen
                name="termsAndConditions"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="chat/[chatId]"
                options={{ headerShown: false }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </UserDataContext.Provider>
      </ThemeContext.Provider>
    </SafeAreaView>
  );
}
