import { StyleSheet } from "react-native";

import { NavigationHeader, useTheme } from "@/components/Header";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function ScheduleScreen() {
  const { theme } = useTheme();

  return (
    <>
      <NavigationHeader title="Schedule" />
      <ParallaxScrollView>
        <ThemedView
          style={[styles.container, { backgroundColor: theme.background }]}
        >
          <ThemedText type="title" style={{ color: theme.text }}>
            Your Schedule
          </ThemedText>
          <ThemedText style={{ color: theme.text }}>
            View upcoming events, tasks, and academic deadlines. Stay on top of
            your day.
          </ThemedText>
        </ThemedView>
      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  headerImage: {
    height: 150,
    width: 300,
    bottom: 0,
    left: 0,
    position: "absolute",
    borderColor: "rgba(17, 17, 17, 0.2)",
  },
});
