import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { NavigationHeader, useTheme } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { FontAwesome6 } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import {
  runGeofenceCheck,
  detectMockLocation,
  logAttendance,
  ClassroomCoordinates,
} from "@/lib/attendanceService";

const { width } = Dimensions.get("window");

// Status types for the check-in flow
type CheckInStatus =
  | "idle"
  | "requesting_permission"
  | "locating"
  | "checking"
  | "success"
  | "out_of_range"
  | "mock_detected"
  | "error";

export default function AttendanceCheckIn() {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    classId: string;
    courseCode: string;
    classTitle: string;
    classroomLat: string;
    classroomLon: string;
    classroomRadius: string;
    classroomName: string;
  }>();

  const [status, setStatus] = useState<CheckInStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    distanceMeters: number;
  } | null>(null);

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start pulsing animation for the GPS orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const runFeedbackAnimation = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleCheckIn = async () => {
    if (!user || !profile) return;

    try {
      // ── Step 1: Request Location Permission ─────────────────────────────
      setStatus("requesting_permission");
      const { status: permStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (permStatus !== "granted") {
        setStatus("error");
        setErrorMessage(
          "Location permission denied. You must allow location access to check in."
        );
        return;
      }

      // ── Step 2: Get Current Precise GPS Position ─────────────────────────
      setStatus("locating");
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const { latitude, longitude, accuracy, altitude, speed } =
        position.coords;

      // ── Step 3: Mock Location Detection ─────────────────────────────────
      setStatus("checking");
      const isMock = detectMockLocation(
        accuracy || 0,
        altitude,
        speed
      );

      if (isMock) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStatus("mock_detected");

        // Log the rejected attempt as evidence
        await logAttendance({
          studentId: user.uid,
          studentName:
            profile.displayName ||
            `${profile.firstName} ${profile.lastName}`,
          classId: params.classId || "",
          courseCode: params.courseCode || "",
          latitude,
          longitude,
          accuracy: accuracy || 0,
          distanceFromClassroom: 0,
          isMockLocation: true,
          status: "rejected_mock",
        });
        runFeedbackAnimation();
        return;
      }

      // ── Step 4: Server-Side Geofence Check ──────────────────────────────
      const classroom: ClassroomCoordinates = {
        latitude: parseFloat(params.classroomLat || "0"),
        longitude: parseFloat(params.classroomLon || "0"),
        radiusMeters: parseFloat(params.classroomRadius || "100"),
        name: params.classroomName || "",
      };

      const geofenceResult = runGeofenceCheck(latitude, longitude, classroom);
      const distanceMeters = geofenceResult.distanceMeters;

      setLocationData({ latitude, longitude, accuracy: accuracy || 0, distanceMeters });

      if (!geofenceResult.allowed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setStatus("out_of_range");
        // Still log the attempt for audit trail
        await logAttendance({
          studentId: user.uid,
          studentName:
            profile.displayName ||
            `${profile.firstName} ${profile.lastName}`,
          classId: params.classId || "",
          courseCode: params.courseCode || "",
          latitude,
          longitude,
          accuracy: accuracy || 0,
          distanceFromClassroom: distanceMeters,
          isMockLocation: false,
          status: "out_of_range",
        });
        runFeedbackAnimation();
        return;
      }

      // ── Step 5: Successful Check-In ─────────────────────────────────────
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await logAttendance({
        studentId: user.uid,
        studentName:
          profile.displayName ||
          `${profile.firstName} ${profile.lastName}`,
        classId: params.classId || "",
        courseCode: params.courseCode || "",
        latitude,
        longitude,
        accuracy: accuracy || 0,
        distanceFromClassroom: distanceMeters,
        isMockLocation: false,
        status: "present",
      });

      setStatus("success");
      runFeedbackAnimation();
    } catch (err) {
      setStatus("error");
      setErrorMessage("Could not obtain GPS signal. Please try again outside.");
    }
  };

  const renderStatusContent = () => {
    switch (status) {
      case "requesting_permission":
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#2A52BE" />
            <ThemedText style={[styles.statusLabel, { color: theme.text }]}>
              Requesting Location Access...
            </ThemedText>
          </View>
        );

      case "locating":
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#2A52BE" />
            <ThemedText style={[styles.statusLabel, { color: theme.text }]}>
              Acquiring GPS Signal...
            </ThemedText>
            <ThemedText style={[styles.statusSub, { color: theme.placeholder }]}>
              Please hold still for the best accuracy
            </ThemedText>
          </View>
        );

      case "checking":
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#2A52BE" />
            <ThemedText style={[styles.statusLabel, { color: theme.text }]}>
              Verifying Location...
            </ThemedText>
          </View>
        );

      case "success":
        return (
          <Animated.View
            style={[styles.resultCard, styles.successCard, { opacity: fadeAnim }]}
          >
            <FontAwesome6 name="circle-check" size={64} color="#4CAF50" />
            <Text style={[styles.resultTitle, { color: "#4CAF50" }]}>
              Checked In!
            </Text>
            <ThemedText style={{ color: theme.text, textAlign: "center" }}>
              {params.courseCode}: {params.classTitle}
            </ThemedText>
            {locationData && (
              <View style={styles.metricsBox}>
                <MetricRow
                  icon="location-dot"
                  label="Distance"
                  value={`${locationData.distanceMeters.toFixed(1)}m from class`}
                  color="#4CAF50"
                />
                <MetricRow
                  icon="bullseye"
                  label="GPS Accuracy"
                  value={`±${locationData.accuracy.toFixed(1)}m`}
                  color="#2A52BE"
                />
              </View>
            )}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#4CAF50" }]}
              onPress={() => router.back()}
            >
              <Text style={styles.btnText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case "out_of_range":
        return (
          <Animated.View
            style={[styles.resultCard, styles.warningCard, { opacity: fadeAnim }]}
          >
            <FontAwesome6 name="triangle-exclamation" size={64} color="#FF9800" />
            <Text style={[styles.resultTitle, { color: "#FF9800" }]}>
              Out of Range
            </Text>
            {locationData && (
              <ThemedText style={{ color: theme.text, textAlign: "center", marginBottom: 10 }}>
                You are{" "}
                <Text style={{ fontWeight: "bold", color: "#FF9800" }}>
                  {locationData.distanceMeters.toFixed(0)}m
                </Text>{" "}
                away. You must be within{" "}
                {params.classroomRadius || 100}m of {params.classroomName}.
              </ThemedText>
            )}
            <ThemedText style={[styles.statusSub, { color: theme.placeholder }]}>
              Move closer to the classroom and try again.
            </ThemedText>
            <TouchableOpacity style={styles.btn} onPress={() => setStatus("idle")}>
              <Text style={styles.btnText}>Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case "mock_detected":
        return (
          <Animated.View
            style={[styles.resultCard, styles.errorCard, { opacity: fadeAnim }]}
          >
            <FontAwesome6 name="shield-halved" size={64} color="#F44336" />
            <Text style={[styles.resultTitle, { color: "#F44336" }]}>
              Spoofed GPS Detected
            </Text>
            <ThemedText style={{ color: theme.text, textAlign: "center" }}>
              A mock location app was detected on your device. This attempt has
              been logged and flagged for review.
            </ThemedText>
          </Animated.View>
        );

      case "error":
        return (
          <View style={styles.resultCard}>
            <FontAwesome6 name="circle-xmark" size={64} color="#F44336" />
            <Text style={[styles.resultTitle, { color: "#F44336" }]}>Error</Text>
            <ThemedText style={{ color: theme.text, textAlign: "center" }}>
              {errorMessage}
            </ThemedText>
            <TouchableOpacity style={styles.btn} onPress={() => setStatus("idle")}>
              <Text style={styles.btnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );

      default: // idle
        return (
          <View style={styles.idleContainer}>
            <Animated.View
              style={[
                styles.gpsPulseOuter,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={styles.gpsPulseInner}>
                <FontAwesome6 name="location-crosshairs" size={42} color="#fff" />
              </View>
            </Animated.View>

            <ThemedText
              style={[styles.classTitle, { color: theme.text }]}
            >
              {params.courseCode}: {params.classTitle}
            </ThemedText>
            <ThemedText style={[styles.statusSub, { color: theme.placeholder }]}>
              Tap the button below to verify you are inside{" "}
              <Text style={{ fontWeight: "bold", color: theme.text }}>
                {params.classroomName}
              </Text>{" "}
              and mark yourself present.
            </ThemedText>

            <View style={styles.warningNote}>
              <FontAwesome6 name="shield-halved" size={14} color="#2A52BE" />
              <Text style={{ color: "#2A52BE", fontSize: 12, marginLeft: 8, flex: 1 }}>
                GPS spoofing detection is active. Any mock location usage will be
                logged and flagged.
              </Text>
            </View>

            <TouchableOpacity style={styles.checkInBtn} onPress={handleCheckIn}>
              <FontAwesome6 name="location-dot" size={20} color="#fff" />
              <Text style={styles.checkInBtnText}>Verify & Check In</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title="Attendance Check-In" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStatusContent()}
      </ScrollView>
    </ThemedView>
  );
}

const MetricRow = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) => (
  <View style={styles.metricRow}>
    <FontAwesome6 name={icon as any} size={14} color={color} />
    <Text style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>{label}:</Text>
    <Text style={{ color, fontWeight: "bold", fontSize: 13, marginLeft: 4 }}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, alignItems: "center", paddingBottom: 60 },

  // Idle Screen
  idleContainer: { alignItems: "center", width: "100%", paddingTop: 20 },
  gpsPulseOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(42, 82, 190, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  gpsPulseInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2A52BE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A52BE",
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  classTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  statusSub: { fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 20 },
  warningNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(42, 82, 190, 0.08)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 30,
    width: "100%",
  },
  checkInBtn: {
    flexDirection: "row",
    backgroundColor: "#2A52BE",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
    gap: 12,
    shadowColor: "#2A52BE",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  checkInBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // Status Screens
  statusContainer: { alignItems: "center", paddingTop: 60 },
  statusLabel: { fontSize: 18, fontWeight: "600", marginTop: 20, textAlign: "center" },

  // Result Cards
  resultCard: {
    width: "100%",
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    marginTop: 20,
    gap: 14,
  },
  successCard: { backgroundColor: "rgba(76, 175, 80, 0.08)" },
  warningCard: { backgroundColor: "rgba(255, 152, 0, 0.08)" },
  errorCard: { backgroundColor: "rgba(244, 67, 54, 0.08)" },
  resultTitle: { fontSize: 26, fontWeight: "bold" },

  // Metrics
  metricsBox: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  metricRow: { flexDirection: "row", alignItems: "center" },

  // Buttons
  btn: {
    backgroundColor: "#2A52BE",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
