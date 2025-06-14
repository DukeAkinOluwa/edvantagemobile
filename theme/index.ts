// theme/index.ts
import { DarkTheme as NavigationDark, DefaultTheme as NavigationDefault } from '@react-navigation/native';

export const MyLightTheme = {
  ...NavigationDefault,
  colors: {
    ...NavigationDefault.colors,
    background: '#FAFBFD', // your custom background color
  },
};

export const MyDarkTheme = {
  ...NavigationDark,
  colors: {
    ...NavigationDark.colors,
    background: '#121212', // your custom dark background
  },
};