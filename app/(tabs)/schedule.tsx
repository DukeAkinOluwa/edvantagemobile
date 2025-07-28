import { Task } from "@/components/DashboardCalendar"; // Use your Task interface
import { useTheme } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useGlobalStyles } from "@/styles/globalStyles";
import { getData } from "@/utils/storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { SectionList, StyleSheet, Switch, View } from "react-native";

const formatDateHeader = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Check Today
  if (date.getTime() === today.getTime()) {
    return "Today";
  }

  // Check Tomorrow
  if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  // Otherwise format normally
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const MyTasks: React.FC = () => {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [includePast, setIncludePast] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadTasks = async () => {
        const saved = await getData("tasks");
        setTasks(saved || []);
      };
      loadTasks();
    }, [])
  );

  // Sort tasks by date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [tasks]);

  // Group tasks into sections
  const sections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const grouped: { title: string; data: Task[] }[] = [];

    sortedTasks.forEach((task) => {
      const taskDate = new Date(task.startTime);
      taskDate.setHours(0, 0, 0, 0);

      // Skip past tasks if not included
      if (!includePast && taskDate < today) return;

      const sectionTitle = formatDateHeader(taskDate);
      const sectionIndex = grouped.findIndex((sec) => sec.title === sectionTitle);

      if (sectionIndex === -1) {
        grouped.push({ title: sectionTitle, data: [task] });
      } else {
        grouped[sectionIndex].data.push(task);
      }
    });

    return grouped;
  }, [sortedTasks, includePast]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Toggle */}
      <View style={styles.header}>
        <ThemedText style={[globalStyles.mediumText, { color: theme.text }]}>
          Show Past Tasks
        </ThemedText>
        <Switch
          value={includePast}
          onValueChange={setIncludePast}
          trackColor={{ false: "#767577", true: theme.primary }}
          thumbColor={includePast ? theme.secondary : "#f4f3f4"}
        />
      </View>

      {/* Task List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <ThemedText
            style={[
              styles.sectionHeader,
              globalStyles.semiLargeText,
              { color: theme.text },
            ]}
          >
            {title}
          </ThemedText>
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.taskBox,
              { backgroundColor: theme.background, borderColor: theme.tint },
            ]}
          >
            <ThemedView
              style={{
                width: 6,
                height: 40,
                backgroundColor: "#2A52BE",
                borderTopLeftRadius: 5,
                borderBottomLeftRadius: 5,
              }}
            />
            <View style={{ paddingLeft: 10 }}>
              <ThemedText
                style={[
                  globalStyles.semiMediumText,
                  styles.taskTitle,
                  { color: theme.text },
                ]}
              >
                {item.title}
              </ThemedText>
              <ThemedText
                style={[
                  globalStyles.baseText,
                  styles.taskTime,
                  { color: theme.text },
                ]}
              >
                {item.startTimeAMPM} - {item.endTimeAMPM}
              </ThemedText>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <ThemedText
            style={[
              globalStyles.semiMediumLightText,
              { color: theme.text, textAlign: "center", marginTop: 20 },
            ]}
          >
            No tasks to show.
          </ThemedText>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </ThemedView>
  );
};

export default MyTasks;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "600",
  },
  taskBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 0.5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  taskTime: {
    fontSize: 12,
    marginTop: 2,
  },
});