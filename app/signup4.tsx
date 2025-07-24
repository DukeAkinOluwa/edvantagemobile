import { useTheme } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Signup4() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState({
    firstName: (params.firstName as string) || "",
    lastName: (params.lastName as string) || "",
    email: (params.email as string) || "",
    university: (params.university as string) || "",
    major: (params.major as string) || "",
    bio: (params.bio as string) || "",
  });
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    setIsLoading(true);
    if (!formData.bio.trim()) {
      setError("Please enter your main objective");
      alert("Please enter your main objective");
      setIsLoading(false);
      return;
    }
    router.push({ pathname: "/signup5", params: formData });
    setIsLoading(false);
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
    card: {
      width: screenWidth - 20,
      padding: 15,
      borderRadius: 8,
      backgroundColor: theme.background,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 4,
      marginBottom: 20,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: "center",
      paddingVertical: 20,
      justifyContent: "center",
      backgroundColor: theme.primary,
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
        What's your main objective in Edvantage? Your choice here won't limit
        what you can do.
      </ThemedText>
      <ThemedText style={[{ marginBottom: 5, color: "white" }]}>
        What's your main objective?
      </ThemedText>
      <TextInput
        style={[responsiveStyles.input, globalStyles.baseText]}
        placeholder="Enter your main objective *"
        placeholderTextColor={theme.placeholder}
        value={formData.bio}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, bio: text }))}
        editable={!isLoading}
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
