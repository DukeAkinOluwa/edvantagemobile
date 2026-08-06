import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from "react-native";
import { cancelAlarm, snoozeAlarm } from "../lib/alarmService";
import { startAlarmAudio, stopAlarmAudio, initializeAudio } from "../lib/alarmAudioService";
import { FontAwesome6 } from "@expo/vector-icons";
import notifee from "@notifee/react-native";

const { width } = Dimensions.get("window");

export default function AlarmOverlay() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Initialize and start continuous audio/haptics
    const triggerAudio = async () => {
      await initializeAudio();
      await startAlarmAudio();
    };
    triggerAudio();

    // 2. Pulse animation for visual urgency
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      stopAlarmAudio();
    };
  }, []);

  const handleSnooze = async () => {
    await stopAlarmAudio();
    // Default id is 'alarm'. In a real app you'd pass this via props or fetch active notifications
    await snoozeAlarm("alarm", "Alarm", "Snoozed for 5 minutes", 5);
  };

  const handleDismiss = async () => {
    await stopAlarmAudio();
    await cancelAlarm("alarm");
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bellContainer, { transform: [{ scale: pulseAnim }] }]}>
        <FontAwesome6 name="bell" size={60} color="#fff" />
      </Animated.View>

      <Text style={styles.time}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      <Text style={styles.title}>Wake Up!</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze}>
          <Text style={styles.snoozeText}>Snooze (5m)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  bellContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2A52BE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    shadowColor: "#2A52BE",
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  time: {
    fontSize: 54,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    color: "#ccc",
    marginBottom: 60,
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  snoozeBtn: {
    flex: 1,
    backgroundColor: "#333",
    paddingVertical: 18,
    borderRadius: 30,
    marginRight: 10,
    alignItems: "center",
  },
  snoozeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  dismissBtn: {
    flex: 1,
    backgroundColor: "#ff4d4d",
    paddingVertical: 18,
    borderRadius: 30,
    marginLeft: 10,
    alignItems: "center",
  },
  dismissText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
