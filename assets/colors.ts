import { Appearance } from "react-native";

export const lightTheme = {
  background: "#FFFFFF",
  text: "#000000",
  primary: "#2A52BE",
  secondary: "#5856D6",
  accent: "#FF2D55",
  border: "#E5E5E5",
};

export const darkTheme = {
  background: "#1C1C1E",
  text: "#FFFFFF",
  primary: "#0A84FF",
  secondary: "#5E5CE6",
  accent: "#FF375F",
  border: "#2C2C2E",
};

export const getSystemTheme = () => {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === "dark" ? darkTheme : lightTheme;
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  system: getSystemTheme(),
};
