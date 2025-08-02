import { NavigationHeader, useTheme, useUserData } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProfilePageNavListTemplate } from "@/global/templates";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { memo, useMemo, useState } from "react";
import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";

const ProfileImage = memo(
  ({ uri, borderColor }: { uri: string; borderColor: string }) => (
    <Image source={{ uri }} style={[styles.avatar, { borderColor }]} />
  )
);

export default function ProfilePage() {
  const { theme } = useTheme();
  const { userData } = useUserData();
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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

  const handleLogout = async () => {
    try {
      setError(null);
      // Navigate to login screen without clearing any data
      router.replace("/login");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to log out";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
      console.error("Logout error:", error);
    }
  };

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

  if (error) {
    return (
      <ThemedView
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ThemedText type="base" style={{ color: theme.error }}>
          Error: {error}
        </ThemedText>
        <ThemedText type="base">
          Please check the console for details.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationHeader title="Profile" />
      <ParallaxScrollView>
        <View
          style={{
            justifyContent: "space-evenly",
            flexDirection: "column",
          }}
        >
          <ThemedView style={{ flex: 1 }}>
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
              {profileNavigationList.map((list) => (
                <ProfilePageNavListTemplate key={list.id} list={list} />
              ))}
            </ThemedView>
          </ThemedView>

          <ThemedView
            style={[globalStyles.button2, { flex: 1, marginTop: 50 }]}
          >
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: "red",
                paddingHorizontal: 20,
                paddingVertical: 5,
                borderRadius: 5,
              }}
            >
              <ThemedText style={globalStyles.semiLargeText}>
                Log Out
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
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
