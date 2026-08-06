// context/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

type ThemeSetting = 'light' | 'dark' | 'system';

type ThemeContextType = {
  themeSetting: ThemeSetting;
  resolvedTheme: 'light' | 'dark';
  setThemeSetting: (theme: ThemeSetting) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  themeSetting: 'system',
  resolvedTheme: 'light',
  setThemeSetting: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeSetting, setThemeSettingState] = useState<ThemeSetting>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem('themeSetting');
      const theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
      setThemeSettingState(theme);

      const systemTheme = Appearance.getColorScheme() ?? 'light';
      setResolvedTheme(theme === 'system' ? systemTheme : theme);
    };

    loadTheme();

    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeSetting === 'system') {
        setResolvedTheme(colorScheme ?? 'light');
      }
    });

    return () => listener.remove();
  }, []);

  const setThemeSetting = async (theme: ThemeSetting) => {
    setThemeSettingState(theme);
    await AsyncStorage.setItem('themeSetting', theme);

    const systemTheme = Appearance.getColorScheme() ?? 'light';
    setResolvedTheme(theme === 'system' ? systemTheme : theme);
  };

  return (
    <ThemeContext.Provider value={{ themeSetting, resolvedTheme, setThemeSetting }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);