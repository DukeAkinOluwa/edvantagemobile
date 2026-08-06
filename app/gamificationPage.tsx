import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { NavigationHeader, useTheme } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useGlobalStyles } from "@/styles/globalStyles";
import { FontAwesome6 } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { updateLoginStreak, calculateCGPA, CourseGrade, GamificationProfile } from "@/lib/gamificationService";

export default function GamificationPage() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [courses, setCourses] = useState<CourseGrade[]>([
    { courseCode: "CSC 101", units: 3, grade: "A" }
  ]);
  
  useEffect(() => {
    if (user) {
      updateLoginStreak(user.uid).then(setProfile);
    }
  }, [user]);

  const addCourse = () => {
    setCourses([...courses, { courseCode: "", units: 2, grade: "C" }]);
  };

  const updateCourse = (index: number, field: keyof CourseGrade, value: any) => {
    const newCourses = [...courses];
    newCourses[index] = { ...newCourses[index], [field]: value };
    setCourses(newCourses);
  };

  const cgpa = calculateCGPA(courses);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title="Achievements & Goals" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Streak Card */}
        <View style={[styles.streakCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <FontAwesome6 name="fire" size={40} color="#ff9900" />
          <View style={{ marginLeft: 20 }}>
            <ThemedText style={[globalStyles.largeText, { fontWeight: "bold", color: theme.text }]}>
              {profile?.currentStreak || 1} Day Streak!
            </ThemedText>
            <ThemedText style={{ color: theme.placeholder }}>
              Longest: {profile?.longestStreak || 1} days
            </ThemedText>
          </View>
        </View>

        {/* CGPA Calculator */}
        <View style={[styles.cgpaCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.cgpaHeader}>
            <ThemedText style={[globalStyles.mediumText, { fontWeight: "bold", color: theme.text }]}>
              CGPA Calculator (5.0)
            </ThemedText>
            <View style={styles.cgpaBadge}>
              <Text style={styles.cgpaText}>{cgpa.toFixed(2)}</Text>
            </View>
          </View>

          {courses.map((course, idx) => (
            <View key={idx} style={styles.courseRow}>
              <TextInput 
                style={[styles.input, styles.inputCode, { color: theme.text, borderColor: theme.border }]} 
                placeholder="Course Code"
                placeholderTextColor={theme.placeholder}
                value={course.courseCode}
                onChangeText={(txt) => updateCourse(idx, "courseCode", txt)}
              />
              <TextInput 
                style={[styles.input, styles.inputUnits, { color: theme.text, borderColor: theme.border }]} 
                placeholder="Units"
                keyboardType="number-pad"
                placeholderTextColor={theme.placeholder}
                value={course.units.toString()}
                onChangeText={(txt) => updateCourse(idx, "units", parseInt(txt) || 0)}
              />
              <TextInput 
                style={[styles.input, styles.inputGrade, { color: theme.text, borderColor: theme.border }]} 
                placeholder="Grade"
                autoCapitalize="characters"
                maxLength={1}
                placeholderTextColor={theme.placeholder}
                value={course.grade}
                onChangeText={(txt) => updateCourse(idx, "grade", txt)}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addCourseBtn} onPress={addCourse}>
            <FontAwesome6 name="plus" size={14} color="#2A52BE" />
            <Text style={{ color: "#2A52BE", fontWeight: "bold", marginLeft: 8 }}>Add Course</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 15 },
  streakCard: { flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  cgpaCard: { padding: 20, borderRadius: 12, borderWidth: 1 },
  cgpaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cgpaBadge: { backgroundColor: "#2A52BE", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cgpaText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  courseRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  inputCode: { flex: 2, marginRight: 8 },
  inputUnits: { flex: 1, marginRight: 8, textAlign: "center" },
  inputGrade: { flex: 1, textAlign: "center" },
  addCourseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, marginTop: 10, borderWidth: 1, borderColor: "#2A52BE", borderRadius: 8, borderStyle: "dashed" },
});