import { useAuth } from "@/context/AuthContext";
import { NavigationHeader, useTheme, useUserData } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProfilePageNavListTemplate } from "@/global/templates";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import React, { memo, useMemo, useState } from "react";
import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { removeData } from "../utils/storage";

// Memoized Image component to prevent flickering
const ProfileImage = memo(
  ({ uri, borderColor }: { uri: string; borderColor: string }) => (
    <Image source={{ uri }} style={[styles.avatar, { borderColor }]} />
  )
);

export default function ProfilePage() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const { userData } = useUserData();
  const { logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const NOTIFICATIONS_FILE = `${FileSystem.documentDirectory}notifications.json`;

  // Memoize image URI to prevent flickering
  const imageUri = useMemo(() => {
    return userData.profilePic || "https://via.placeholder.com/100";
  }, [userData.profilePic]);

  const profileNavigationList = [
    {
      id: 1,
      name: "Settings",
      link: "/settingsPage",
    },
    {
      id: 2,
      name: "FAQs",
      link: "/faqsPage",
    },
    {
      id: 3,
      name: "Terms and Conditions",
      link: "/termsAndConditions",
    },
  ];

  const dynamicStyles = StyleSheet.create({
    summaryCard: {
      width: screenWidth - 20,
      alignItems: "center",
      padding: 20,
      backgroundColor: theme.background,
    },
    profilePageNavigationContainer: {
      width: screenWidth - 40,
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: theme.background,
    },
  });
  
  const handleLogout = async () => {
    try {
      setError(null);
      // Clear local cached task + notification data
      await removeData("tasks");
      await removeData("scheduled_notifications");
      try {
        await FileSystem.deleteAsync(NOTIFICATIONS_FILE, { idempotent: true });
      } catch (fileError) {
        console.warn("Failed to delete notifications.json:", fileError);
      }
      // Firebase Auth sign out — AuthContext listener will redirect to login
      await logout();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to log out";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
      console.error("Logout error:", error);
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationHeader title="Profile" />
      <ParallaxScrollView>
        <ThemedView style={dynamicStyles.summaryCard}>
          <ProfileImage uri={imageUri} borderColor={theme.border} />
          <ThemedText style={globalStyles.semiLargeText}>
            {userData.firstName || ""} {userData.lastName || ""}
          </ThemedText>
          <ThemedText style={globalStyles.mediumText}>
            {userData.university || "University not set"}
          </ThemedText>
          <View style={{ flexDirection: "row", gap: 5 }}>
            <ThemedText style={globalStyles.smallText}>
              {userData.course || "Course: Not set"}
            </ThemedText>
            <ThemedText style={globalStyles.smallText}>|</ThemedText>
            <ThemedText style={globalStyles.smallText}>
              {userData.level || "Level: Not set"}
            </ThemedText>
          </View>
        </ThemedView>
        <ThemedView style={dynamicStyles.profilePageNavigationContainer}>
          {userData.role === "lecturer" && (
            <TouchableOpacity style={{ marginBottom: 15 }} onPress={() => router.push("/staff-dashboard")}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ThemedView style={{ backgroundColor: "#2A52BE", padding: 8, borderRadius: 8 }}>
                    <ThemedText style={{ color: "#fff", fontWeight: "bold" }}>👨‍🏫</ThemedText>
                  </ThemedView>
                  <ThemedText style={[globalStyles.mediumText, { color: theme.primary, fontWeight: "bold" }]}>Staff Portal</ThemedText>
                </View>
                <ThemedText style={{ color: theme.border }}>{">"}</ThemedText>
              </View>
            </TouchableOpacity>
          )}
          {profileNavigationList.map((list) => (
            <ProfilePageNavListTemplate key={list.id} list={list} />
          ))}
          <TouchableOpacity onPress={handleLogout}>
            <ThemedText style={[globalStyles.baseText, globalStyles.actionTextRed]}>Log Out</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ParallaxScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 0.3,
  },
});
