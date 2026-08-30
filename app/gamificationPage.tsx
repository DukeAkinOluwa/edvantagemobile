import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { NavigationHeader, useTheme } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useGlobalStyles } from "@/styles/globalStyles";
import { FontAwesome6 } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useUserData } from "@/components/HeaderContext";
import { updateLoginStreak, calculateCGPA, CourseGrade, GamificationProfile } from "@/lib/gamificationService";

export default function GamificationPage() {
  const { theme } = useTheme();
  const globalStyles = useGlobalStyles();
  const { user } = useAuth();
  const { userData } = useUserData();
  
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

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, idx) => idx !== index));
  };

  const updateCourse = (index: number, field: keyof CourseGrade, value: any) => {
    const newCourses = [...courses];
    newCourses[index] = { ...newCourses[index], [field]: value };
    setCourses(newCourses);
  };

  const cgpa = calculateCGPA(courses);

  const calculateProfilePoints = () => {
    let p = 0;
    if (userData.firstName) p += 10;
    if (userData.lastName) p += 10;
    if (userData.bio) p += 20;
    if (userData.dob) p += 10;
    if (userData.gender) p += 10;
    if (userData.profilePic) p += 20;
    if (userData.course) p += 10;
    if (userData.level) p += 10;
    return p;
  };

  const profilePoints = calculateProfilePoints();
  const userLevel = Math.floor(profilePoints / 20) + 1;

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

        {/* Level and Points Card */}
        <View style={[styles.streakCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <FontAwesome6 name="star" size={40} color="#FFD700" />
          <View style={{ marginLeft: 20 }}>
            <ThemedText style={[globalStyles.largeText, { fontWeight: "bold", color: theme.text }]}>
              Level {userLevel}
            </ThemedText>
            <ThemedText style={{ color: theme.placeholder }}>
              {profilePoints} Profile Points (Complete profile to level up!)
            </ThemedText>
          </View>
        </View>

        {/* CGPA Calculator */}
        <View style={[styles.cgpaCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.cgpaHeader}>
            <ThemedText style={[globalStyles.mediumText, { fontWeight: "bold", color: theme.text, marginBottom: 0 }]}>
              CGPA Calculator (5.0)
            </ThemedText>
            <View style={styles.cgpaBadge}>
              <Text style={styles.cgpaText}>{cgpa.toFixed(2)}</Text>
            </View>
          </View>

          {courses.map((course, idx) => (
            <View key={idx} style={styles.courseRow}>
              <TextInput 
                style={[styles.input, { flex: 2, color: theme.text, borderColor: theme.border }]} 
                placeholder="Course Code"
                placeholderTextColor={theme.placeholder}
                value={course.courseCode}
                onChangeText={(txt) => updateCourse(idx, "courseCode", txt)}
              />
              <TextInput 
                style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]} 
                placeholder="Units"
                keyboardType="numeric"
                placeholderTextColor={theme.placeholder}
                value={course.units.toString()}
                onChangeText={(txt) => updateCourse(idx, "units", parseInt(txt) || 0)}
              />
              <TextInput 
                style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]} 
                placeholder="Grade"
                autoCapitalize="characters"
                placeholderTextColor={theme.placeholder}
                value={course.grade}
                onChangeText={(txt) => updateCourse(idx, "grade", txt)}
              />
              <TouchableOpacity onPress={() => removeCourse(idx)} style={{ justifyContent: 'center', paddingHorizontal: 5 }}>
                <FontAwesome6 name="trash-can" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addCourseBtn} onPress={addCourse}>
            <FontAwesome6 name="plus" size={14} color="#2A52BE" />
            <Text style={{ color: "#2A52BE", fontWeight: "bold", marginLeft: 8 }}>Add Course</Text>
          </TouchableOpacity>
        </View>



        {/* Achievements */}
        <ThemedText style={[globalStyles.mediumText, { fontWeight: "bold", color: theme.text, marginTop: 25, marginBottom: 15 }]}>
          Achievements
        </ThemedText>
        <View style={styles.achievementsRow}>
          <View style={[styles.achievementBadge, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(255, 193, 7, 0.2)" }]}>
              <FontAwesome6 name="medal" size={24} color="#FFC107" />
            </View>
            <ThemedText style={{ color: theme.text, fontWeight: "bold", marginTop: 8, textAlign: "center" }}>Early Bird</ThemedText>
            <ThemedText style={{ color: theme.placeholder, fontSize: 11, textAlign: "center" }}>Check-in before 8AM</ThemedText>
          </View>

          <View style={[styles.achievementBadge, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(76, 175, 80, 0.2)" }]}>
              <FontAwesome6 name="check-double" size={24} color="#4CAF50" />
            </View>
            <ThemedText style={{ color: theme.text, fontWeight: "bold", marginTop: 8, textAlign: "center" }}>Perfect Week</ThemedText>
            <ThemedText style={{ color: theme.placeholder, fontSize: 11, textAlign: "center" }}>No missed classes</ThemedText>
          </View>

          <View style={[styles.achievementBadge, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, opacity: 0.5 }]}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(128, 128, 128, 0.2)" }]}>
              <FontAwesome6 name="book-open" size={24} color={theme.placeholder} />
            </View>
            <ThemedText style={{ color: theme.text, fontWeight: "bold", marginTop: 8, textAlign: "center" }}>Bookworm</ThemedText>
            <ThemedText style={{ color: theme.placeholder, fontSize: 11, textAlign: "center" }}>Read 10 resources</ThemedText>
          </View>
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
  goalCard: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4, width: "100%", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  achievementsRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  achievementBadge: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  iconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
});