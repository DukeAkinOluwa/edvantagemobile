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

// Component named to match the route (Signup4 for /signup4)
export default function Signup4() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter();

  // State for objective, not university
  const [objective, setObjective] = useState("");

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
    if (!objective.trim()) {
      alert("Please enter your main objective");
      return;
    }
    router.push("/signup5");
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
        value={objective}
        onChangeText={setObjective}
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

        <TouchableOpacity onPress={() => router.push("/signup3")}>
          <ThemedText style={[{ color: "white" }]}>Previous</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
