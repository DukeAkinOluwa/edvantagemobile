import { useTheme } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Component should be PascalCase and reflect the route (e.g., Signup3 for /signup3)
export default function Signup3() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter();

  // State for academic program/major
  const [major, setMajor] = useState("");

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

  // Validation before navigation
  const handleNext = () => {
    if (!major.trim()) {
      alert("Please enter your academic program or major");
      return;
    }
    router.push("/signup4");
  };

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
        Understanding your major or program allows for customized academic
        support.
      </ThemedText>

      <ThemedText style={[{ marginBottom: 5, color: "white" }]}>
        What's your Academic Program/Major?
      </ThemedText>

      <TextInput
        style={[responsiveStyles.input, globalStyles.baseText]}
        placeholder="Enter your Academic Program/Major *"
        placeholderTextColor={theme.placeholder}
        value={major}
        onChangeText={setMajor}
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
          onPress={handleNext} // Use handler for validation
          style={{ backgroundColor: "white", padding: 12, borderRadius: 7 }}
        >
          <ThemedText style={[{ color: theme.primary }]}>Next</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/signup2")}>
          <ThemedText style={[{ color: "white" }]}>Previous</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
