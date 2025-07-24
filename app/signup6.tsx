import { useTheme } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useGlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function Signup6() {
  const router = useRouter();
  const globalStyles = useGlobalStyles();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    setIsLoading(true);
    router.push("/(tabs)");
    setIsLoading(false);
  };

  return (
    <ThemedView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.primary,
      }}
    >
      <ThemedText style={[globalStyles.xLargeText, { color: theme.text }]}>
        Congratulations
      </ThemedText>
      <ThemedText
        style={[
          globalStyles.semiMediumText,
          { marginTop: 10, marginBottom: 20, color: theme.text },
        ]}
      >
        You're all set
      </ThemedText>
      <Image
        source={require("../assets/images/Image7.webp")}
        style={{ width: 300, height: 300, alignSelf: "center" }}
      />
      <TouchableOpacity
        style={{
          backgroundColor: theme.primary,
          padding: 12,
          paddingHorizontal: 20,
          marginTop: 20,
          borderRadius: 7,
          borderWidth: 1,
          borderColor: theme.text,
          opacity: isLoading ? 0.5 : 1,
        }}
        onPress={handleContinue}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.text} />
        ) : (
          <ThemedText style={[{ color: theme.text }]}>Continue</ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({});
