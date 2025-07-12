import { NavigationHeader, useTheme, useUserData } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProfilePageNavListTemplate } from "@/global/templates";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import React, { memo, useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";

// Memoized Image component to prevent flickering
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

  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationHeader title="Profile" />
      <ParallaxScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ alignItems: "center", paddingBottom: 20 }}
      >
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
