import { NavigationHeader, useTheme, useUserData } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ProfilePageNavListTemplate } from "@/global/templates";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function ProfilePage() {
  const { theme } = useTheme();
  const { userData } = useUserData();
  const globalStyles = useGlobalStyles();
  const { screenHeight, screenWidth } = useResponsiveDimensions();
  const dynamicStyles = StyleSheet.create({
    summaryCard: {
      width: screenWidth - 20,
    },
    profilePageNavigationContainer: {
      width: screenWidth - 20 - 20, // Adjusted for Padding
    },
  });

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

  return (
    <>
      <ThemedView
        style={{ flex: 1, padding: 10, backgroundColor: theme.background }}
      >
        <NavigationHeader title="Profile" />

        <ParallaxScrollView>
          <ThemedView style={[styles.container]}>
            <Image
              source={{
                uri: userData.profilePic || "https://via.placeholder.com/150",
              }}
              style={[styles.avatar, { borderColor: theme.border }]}
            />
            <Text
              style={[
                {
                  color: theme.text,
                  fontFamily: globalStyles.semiLargeText.fontFamily,
                  fontSize: globalStyles.semiLargeText.fontSize,
                },
              ]}
            >
              {userData.firstName || ""} {userData.lastName || ""}
            </Text>
            <ThemedText style={[globalStyles.mediumText]}>
              {userData.university || "University not set"}
            </ThemedText>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: theme.background,
              }}
            >
              <Text
                style={[
                  {
                    color: theme.text,
                    fontFamily: globalStyles.smallText.fontFamily,
                    fontSize: globalStyles.smallText.fontSize,
                  },
                ]}
              >
                {userData.course || "Course: Not set"}
              </Text>
              <Text
                style={[
                  {
                    color: theme.text,
                    fontFamily: globalStyles.smallText.fontFamily,
                    fontSize: globalStyles.smallText.fontSize,
                  },
                ]}
              >
                {" | "}
              </Text>
              <Text
                style={[
                  {
                    color: theme.text,
                    fontFamily: globalStyles.smallText.fontFamily,
                    fontSize: globalStyles.smallText.fontSize,
                  },
                ]}
              >
                {userData.level || "Level: Not set"}
              </Text>
            </View>
          </ThemedView>
          <ThemedView
            style={[
              styles.profilePageNavigationContainer,
              dynamicStyles.profilePageNavigationContainer,
              { borderColor: theme.border, backgroundColor: theme.background },
            ]}
          >
            {profileNavigationList.map((list) => (
              <ProfilePageNavListTemplate key={list.id} list={list} />
            ))}
          </ThemedView>
        </ParallaxScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 0.3,
  },
  profilePageNavigationContainer: {
    flexDirection: "column",
    gap: 5,
    borderWidth: 0.5,
    borderRadius: 10,
    borderColor: "rgba(17, 17, 17, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  profilePic: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    borderWidth: 0.3,
  },
  label: {
    marginVertical: 10,
    textAlign: "center",
  },
});
