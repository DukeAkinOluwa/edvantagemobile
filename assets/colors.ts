import { Appearance } from "react-native";

export const lightTheme = {
  background: "#FAFBFD",
  text: "#101011ff",
  primary: "#2A52BE",
  secondary: '#FAFBFD',
  accent: "#FF2D55",
  border: "#E5E5E5",
  shadow: "#000",
  placeholder: "#687076",
  error: "#FF0000",
  backgroundSecondary: "#F4F4F4",
  icon: "#687076",
  tabIconDefault: "#687076",
  tabIconSelected: "#0a7ea4",
  tint: "#0a7ea4",
  modalBackdrop: "rgba(0, 0, 0, 0.5)"
};

export const darkTheme = {
  background: "#1C1C1E",
  text: "#FAFBFD",
  primary: "#FAFBFD",
  secondary: '#2A52BE',
  accent: "#FF375F",
  border: "#2C2C2E",
  shadow: "#fff",
  placeholder: "#9BA1A6",
  error: "#FF5555",
  backgroundSecondary: "#2C2C2E",
  icon: "#9BA1A6",
  tabIconDefault: "#9BA1A6",
  tabIconSelected: "#fff",
  tint: "#fff",
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
