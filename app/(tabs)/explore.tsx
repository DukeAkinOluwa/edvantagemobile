// app/(tabs)/explore.tsx
// AI Chat screen placeholder – external AI API removed.
// Firebase is the only data source in this app.

import { useTheme } from "@/components/Header";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6 } from "@expo/vector-icons";

export default function ExploreScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      <View style={styles.iconWrapper}>
        <FontAwesome6 name="robot" size={64} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>
        AI Assistant
      </Text>
      <Text style={[styles.subtitle, { color: theme.placeholder }]}>
        Coming Soon
      </Text>
      <Text style={[styles.body, { color: theme.placeholder }]}>
        The AI-powered study assistant is under development.{"\n"}
        Check back for updates!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  iconWrapper: {
    marginBottom: 24,
    opacity: 0.7,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1,
  },
  body: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
