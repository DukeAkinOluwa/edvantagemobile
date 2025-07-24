import { useTheme, useUserData } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Picker from "react-native-picker-select";
import { saveData } from "../utils/storage";

export default function Signup5() {
  const { theme } = useTheme();
  const { setUserData } = useUserData();
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState({
    firstName: (params.firstName as string) || "",
    lastName: (params.lastName as string) || "",
    email: (params.email as string) || "",
    university: (params.university as string) || "",
    major: (params.major as string) || "",
    bio: (params.bio as string) || "",
    level: (params.level as string) || "100",
  });
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      if (!formData.level) {
        throw new Error("Please select your academic level");
      }
      if (
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.email.trim() ||
        !formData.university.trim() ||
        !formData.major.trim() ||
        !formData.bio.trim()
      ) {
        throw new Error("Please fill in all required fields.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Invalid email address.");
      }

      const newUserData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        university: formData.university.trim(),
        department: formData.university.trim(),
        faculty: undefined,
        course: formData.university.trim(),
        level: formData.level,
        gender: undefined,
        dob: undefined,
        profilePic: undefined,
        themeMode: "system" as "system" | "light" | "dark",
        major: formData.major.trim(),
        bio: formData.bio.trim(),
        allowNotifications: true,
        allowAlarms: true,
        privacy: {
          showOnlineStatus: true,
          showProfileToGroups: true,
          allowFriendRequests: true,
          dataCollection: true,
        },
      };

      await setUserData(newUserData);
      await saveData("firstLaunch", "false");
      router.push("/signup6");
      Alert.alert("Success", "Sign-up completed!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign up";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const responsiveStyles = StyleSheet.create({
    input: {
      width: screenWidth - 50,
      borderWidth: 0.9,
      borderColor: theme.border,
      borderRadius: 6,
      padding: Platform.OS === "ios" ? 12 : 10,
      marginBottom: 12,
      color: theme.text,
      fontFamily: "Montserrat-Regular",
    },
    input1: {
      width: screenWidth - 50,
      borderWidth: 1,
      borderColor: "white",
      borderRadius: 6,
      padding: Platform.OS === "ios" ? 12 : 10,
      marginBottom: 12,
      color: "white",
      fontFamily: "Montserrat-Regular",
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
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: theme.primary,
        paddingHorizontal: 10,
      }}
    >
      <ThemedText
        style={[globalStyles.largeText, { color: "white", marginBottom: 20 }]}
      >
        Stating your academic level helps provide relevant resources.
      </ThemedText>
      <ThemedText style={[{ marginBottom: 5, color: "white" }]}>
        What is your academic level?
      </ThemedText>
      <Picker
        value={formData.level}
        onValueChange={(value) =>
          setFormData((prev) => ({ ...prev, level: value }))
        }
        items={[
          { label: "100 Level", value: "100" },
          { label: "200 Level", value: "200" },
          { label: "300 Level", value: "300" },
          { label: "400 Level", value: "400" },
          { label: "500 Level", value: "500" },
          { label: "Postgraduate Level", value: "Postgraduate" },
        ]}
        style={{
          inputIOS: responsiveStyles.input1,
          inputAndroid: responsiveStyles.input1,
        }}
        disabled={isLoading}
      />
      <View
        style={{
          flexDirection: "row",
          gap: 20,
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: "white",
            padding: 12,
            borderRadius: 7,
            opacity: isLoading ? 0.5 : 1,
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <ThemedText style={[{ color: theme.primary }]}>Next</ThemedText>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
          <ThemedText
            style={[{ color: "white", opacity: isLoading ? 0.5 : 1 }]}
          >
            Previous
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
