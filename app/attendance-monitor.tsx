import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { NavigationHeader, useTheme } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { FontAwesome6 } from "@expo/vector-icons";
import { fetchAttendanceForClass, AttendanceRecord } from "@/lib/attendanceService";
import { useLocalSearchParams } from "expo-router";

const STATUS_CONFIG = {
  present: { label: "Present", color: "#4CAF50", icon: "circle-check" },
  out_of_range: { label: "Out of Range", color: "#FF9800", icon: "triangle-exclamation" },
  rejected_mock: { label: "Flagged (Mock GPS)", color: "#F44336", icon: "shield-halved" },
};

export default function AttendanceMonitor() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ classId: string; courseCode: string }>();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "present" | "out_of_range" | "rejected_mock">("all");

  const presentCount = records.filter((r) => r.status === "present").length;
  const flaggedCount = records.filter((r) => r.status === "rejected_mock").length;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAttendanceForClass(params.classId);
      setRecords(data);
      setLoading(false);
    };
    load();
  }, [params.classId]);

  const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title="Attendance Monitor" />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label="Present" value={presentCount} color="#4CAF50" />
        <StatCard label="Total Attempts" value={records.length} color="#2A52BE" />
        <StatCard label="Flagged" value={flaggedCount} color="#F44336" />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(["all", "present", "out_of_range", "rejected_mock"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.chip,
              {
                backgroundColor:
                  filter === f
                    ? "#2A52BE"
                    : theme.backgroundSecondary,
                borderColor: filter === f ? "#2A52BE" : theme.border,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={{
                color: filter === f ? "#fff" : theme.text,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {f === "all" ? "All" : STATUS_CONFIG[f].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2A52BE" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id || item.studentId}
          contentContainerStyle={{ padding: 15, paddingBottom: 60 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <FontAwesome6 name="users" size={40} color={theme.placeholder} />
              <ThemedText style={{ color: theme.text, marginTop: 10 }}>
                No records yet.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.present;
            const checkTime = item.checkInTime
              ? new Date((item.checkInTime as any).toDate()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "--";

            return (
              <View
                style={[
                  styles.recordCard,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                    borderLeftColor: cfg.color,
                  },
                ]}
              >
                <FontAwesome6
                  name={cfg.icon as any}
                  size={20}
                  color={cfg.color}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <ThemedText
                    style={{ fontWeight: "bold", fontSize: 14, color: theme.text }}
                  >
                    {item.studentName}
                  </ThemedText>
                  <View style={styles.metaRow}>
                    <FontAwesome6 name="clock" size={10} color={theme.placeholder} />
                    <Text style={{ color: theme.placeholder, fontSize: 11, marginLeft: 5 }}>
                      {checkTime}
                    </Text>
                    <FontAwesome6
                      name="location-dot"
                      size={10}
                      color={theme.placeholder}
                      style={{ marginLeft: 12 }}
                    />
                    <Text style={{ color: theme.placeholder, fontSize: 11, marginLeft: 5 }}>
                      {item.distanceFromClassroom.toFixed(1)}m away · ±{item.accuracy.toFixed(1)}m accuracy
                    </Text>
                  </View>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: cfg.color + "22" }]}
                >
                  <Text style={{ color: cfg.color, fontSize: 11, fontWeight: "bold" }}>
                    {cfg.label}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <Text style={{ fontSize: 28, fontWeight: "bold", color }}>{value}</Text>
    <Text style={{ fontSize: 12, color: "#888", textAlign: "center" }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    paddingBottom: 10,
  },
  statCard: {
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 15, paddingBottom: 10, flexWrap: "wrap" },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, flexWrap: "wrap" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },
});
