import { ThemeProvider } from '@react-navigation/native';


import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';


import { useColorScheme } from '@/hooks/useColorScheme';

import { MyDarkTheme, MyLightTheme } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [fontsLoaded, setFontsLoaded] = useState(false);
  

  useEffect(() => {
    async function loadFonts() {
      await SplashScreen.preventAutoHideAsync();
      await Font.loadAsync({
        'Montserrat-Thin': require('@/assets/fonts/static/Montserrat-Thin.ttf'),
        'Montserrat-ExtraLight': require('@/assets/fonts/static/Montserrat-ExtraLight.ttf'),
        'Montserrat-Light': require('@/assets/fonts/static/Montserrat-Light.ttf'),
        'Montserrat-Regular': require('@/assets/fonts/static/Montserrat-Regular.ttf'),
        'Montserrat-Medium': require('@/assets/fonts/static/Montserrat-Medium.ttf'),
        'Montserrat-SemiBold': require('@/assets/fonts/static/Montserrat-SemiBold.ttf'),
        'Montserrat-Bold': require('@/assets/fonts/static/Montserrat-Bold.ttf'),
        'Montserrat-ExtraBold': require('@/assets/fonts/static/Montserrat-ExtraBold.ttf'),
        'Montserrat-Black': require('@/assets/fonts/static/Montserrat-Black.ttf'),
        'Montserrat-ThinItalic': require('@/assets/fonts/static/Montserrat-ThinItalic.ttf'),
        'Montserrat-ExtraLightItalic': require('@/assets/fonts/static/Montserrat-ExtraLightItalic.ttf'),
        'Montserrat-LightItalic': require('@/assets/fonts/static/Montserrat-LightItalic.ttf'),
        'Montserrat-Italic': require('@/assets/fonts/static/Montserrat-Italic.ttf'),
        'Montserrat-MediumItalic': require('@/assets/fonts/static/Montserrat-MediumItalic.ttf'),
        'Montserrat-SemiBoldItalic': require('@/assets/fonts/static/Montserrat-SemiBoldItalic.ttf'),
        'Montserrat-BoldItalic': require('@/assets/fonts/static/Montserrat-BoldItalic.ttf'),
        'Montserrat-ExtraBoldItalic': require('@/assets/fonts/static/Montserrat-ExtraBoldItalic.ttf'),
        'Montserrat-BlackItalic': require('@/assets/fonts/static/Montserrat-BlackItalic.ttf'),
      });
      setFontsLoaded(true);
      await SplashScreen.hideAsync();
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={{flex: 1,}}>
      <ThemeProvider value={colorScheme === 'dark' ? MyDarkTheme : MyLightTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
          <Stack.Screen name="chatroomscreen" options={{ headerShown: false }} />
          <Stack.Screen name="userProfileScreen" options={{ headerShown: false }} />
          <Stack.Screen name="gamificationPage" options={{ headerShown: false }} />
          <Stack.Screen name="profile-page" options={{ headerShown: false }} />
          <Stack.Screen name="settingsPage" options={{ headerShown: false }} />
          <Stack.Screen name="faqsPage" options={{ headerShown: false }} />
          <Stack.Screen name="termsAndConditions" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[chatId]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaView>
  );
}
