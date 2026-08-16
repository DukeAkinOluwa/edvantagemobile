// components/HeaderContext.tsx
import { createContext, useContext } from "react";
import { lightTheme } from "../assets/colors";

export interface ThemeContextType {
  theme: typeof lightTheme;
  setThemeMode: (mode: "system" | "light" | "dark") => void;
}

export interface UserDataContextType {
  userData: {
    uid?: string;
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
    role?: "student" | "lecturer" | "admin";
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
  };
  setUserData: (data: Partial<UserDataContextType["userData"]>) => void;
  setIsFirstLaunch?: (value: boolean) => void;
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
