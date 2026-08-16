import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, StatusBar, SafeAreaView, BackHandler } from "react-native";
import { cancelAlarm, snoozeAlarm } from "@/lib/alarmService";
import { FontAwesome6 } from "@expo/vector-icons";
import notifee from "@notifee/react-native";

const { width } = Dimensions.get("window");

export default function AlarmOverlay() {
  const [notification, setNotification] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    console.log("[AlarmOverlay] Mounting native alarm component...");
    
    const fetchNotification = async () => {
      try {
        const initial = await notifee.getInitialNotification();
        console.log("[AlarmOverlay] getInitialNotification result:", initial);
        
        if (initial?.notification) {
          console.log("[AlarmOverlay] Setting notification state from initial:", initial.notification.id);
          setNotification(initial.notification);
          return;
        }

        // Fallback: If Notifee didn't attach it to initialNotification (common for custom activities),
        // we can find it by looking at currently displayed notifications!
        console.log("[AlarmOverlay] Falling back to getDisplayedNotifications...");
        const displayed = await notifee.getDisplayedNotifications();
        console.log("[AlarmOverlay] Currently displayed notifications:", displayed.length);
        
        const alarmNotification = displayed.find(n => n.notification.data?.isAlarm === "true");
        if (alarmNotification) {
          console.log("[AlarmOverlay] Found alarm in displayed notifications:", alarmNotification.notification.id);
          setNotification(alarmNotification.notification);
        } else {
          console.error("[AlarmOverlay] FATAL: Could not find any active alarm notifications!");
        }
      } catch (err) {
        console.error("[AlarmOverlay] ERROR fetching notification data:", err);
      }
    };

    fetchNotification();

    // 1. Disable physical & gesture Back button while alarm is ringing
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => true);

    // 2. Continuous pulse & glow animation for visual urgency
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.9, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();

    return () => {
      backHandler.remove();
    };
  }, []);

  const alarmId = notification?.id || "alarm";
  const title = notification?.title || "Task Alarm";
  const body = notification?.body || "Your scheduled task starts now!";
  const location = notification?.data?.location || "";

  const handleSnooze = async () => {
    console.log(`[AlarmOverlay] Snoozing alarm ${alarmId}`);
    try {
      await snoozeAlarm(alarmId, title, body, 5);
      console.log("[AlarmOverlay] Snooze successful. Exiting app overlay.");
    } catch (e) {
      console.error("[AlarmOverlay] Snooze failed:", e);
    }
    BackHandler.exitApp();
  };

  const handleDismiss = async () => {
    console.log(`[AlarmOverlay] Dismissing alarm ${alarmId}`);
    try {
      await cancelAlarm(alarmId);
      console.log("[AlarmOverlay] Dismiss successful. Exiting app overlay.");
    } catch (e) {
      console.error("[AlarmOverlay] Dismiss failed:", e);
    }
    BackHandler.exitApp();
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const currentDate = new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={styles.headerArea}>
        <Text style={styles.dateText}>{currentDate}</Text>
        <Text style={styles.timeText}>{currentTime}</Text>
      </View>

      {/* Pulsing Bell Element */}
      <View style={styles.illustrationArea}>
        <Animated.View style={[styles.glowRing, { opacity: glowAnim, transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={[styles.bellContainer, { transform: [{ scale: pulseAnim }] }]}>
          <FontAwesome6 name="bell" size={54} color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Task Details Card */}
      <View style={styles.detailsCard}>
        <View style={styles.badgeRow}>
          <FontAwesome6 name="triangle-exclamation" size={14} color="#FF9500" />
          <Text style={styles.badgeText}>TASK ALARM RINGING</Text>
        </View>

        <Text style={styles.taskTitle}>{title}</Text>
        <Text style={styles.taskBody}>{body}</Text>

        {location ? (
          <View style={styles.locationRow}>
            <FontAwesome6 name="location-dot" size={14} color="#6C8DFF" />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        ) : null}
      </View>

      {/* Prominent Action Buttons (Snooze & Dismiss) */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze} activeOpacity={0.8}>
          <FontAwesome6 name="clock" size={20} color="#FF9500" style={{ marginRight: 10 }} />
          <Text style={styles.snoozeText}>SNOOZE (5m)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.8}>
          <FontAwesome6 name="xmark" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.dismissText}>DISMISS ALARM</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerArea: {
    alignItems: "center",
    marginTop: 15,
  },
  dateText: {
    fontSize: 14,
    color: "#8E8E93",
    fontFamily: "Montserrat-Regular",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 54,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Montserrat-Bold",
    letterSpacing: 1,
  },
  illustrationArea: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
  glowRing: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(42, 82, 190, 0.35)",
  },
  bellContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#2A52BE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A52BE",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "#161C2E",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    color: "#FF9500",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
    fontFamily: "Montserrat-Bold",
  },
  taskBody: {
    fontSize: 14,
    color: "#A0A8C0",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Montserrat-Regular",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "rgba(42, 82, 190, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationText: {
    color: "#6C8DFF",
    fontSize: 13,
    fontWeight: "600",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 15,
  },
  snoozeBtn: {
    flexDirection: "row",
    width: "100%",
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255, 149, 0, 0.15)",
    borderWidth: 1.5,
    borderColor: "#FF9500",
    alignItems: "center",
    justifyContent: "center",
  },
  snoozeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9500",
    fontFamily: "Montserrat-Bold",
    letterSpacing: 1,
  },
  dismissBtn: {
    flexDirection: "row",
    width: "100%",
    height: 56,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Montserrat-Bold",
    letterSpacing: 1,
  },
});
