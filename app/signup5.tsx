import { useTheme } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useResponsiveDimensions } from "@/hooks/useResponsiveDimensions";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Picker from "react-native-picker-select";

// Component named to match the route (Signup5 for /signup5)
export default function Signup5() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { screenWidth } = useResponsiveDimensions();
  const router = useRouter();

  // State for academic level
  const [level, setLevel] = useState("100");

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

  // Validation before navigation
  const handleNext = () => {
    if (!level) {
      alert("Please select your academic level");
      return;
    }
    router.push("/signup6");
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
        Stating your academic level helps provide relevant resources.
      </ThemedText>

      <ThemedText style={[{ marginBottom: 5, color: "white" }]}>
        What is your academic level?
      </ThemedText>

      <Picker
        value={level}
        onValueChange={setLevel}
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

        <TouchableOpacity onPress={() => router.push("/signup4")}>
          <ThemedText style={[{ color: "white" }]}>Previous</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
