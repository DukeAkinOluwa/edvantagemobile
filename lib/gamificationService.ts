// lib/gamificationService.ts
// Handles CGPA calculation and Login Streaks

import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface GamificationProfile {
  uid: string;
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string; // YYYY-MM-DD format
  achievements: string[];
}

export interface CourseGrade {
  courseCode: string;
  units: number;
  grade: "A" | "B" | "C" | "D" | "E" | "F";
}

// ─── Streaks & Gamification ───────────────────────────────────────────────

/**
 * Updates the user's login streak. Call this on app launch.
 */
export async function updateLoginStreak(uid: string): Promise<GamificationProfile> {
  const ref = doc(db, "gamification", uid);
  const snap = await getDoc(ref);
  
  const today = new Date().toISOString().split("T")[0]; // "2024-11-20"
  let profile: GamificationProfile = {
    uid,
    currentStreak: 1,
    longestStreak: 1,
    lastLoginDate: today,
    achievements: [],
  };

  if (snap.exists()) {
    profile = snap.data() as GamificationProfile;
    const lastDate = new Date(profile.lastLoginDate);
    const currentDate = new Date(today);
    
    // Calculate difference in days
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Logged in consecutive day
      profile.currentStreak += 1;
      profile.longestStreak = Math.max(profile.currentStreak, profile.longestStreak);
    } else if (diffDays > 1) {
      // Streak broken
      profile.currentStreak = 1;
    }
    profile.lastLoginDate = today;
    
    await updateDoc(ref, { ...profile });
  } else {
    // First time
    await setDoc(ref, profile);
  }

  return profile;
}

// ─── CGPA Engine ─────────────────────────────────────────────────────────

const GRADE_POINTS_5_SCALE: Record<string, number> = {
  "A": 5.0,
  "B": 4.0,
  "C": 3.0,
  "D": 2.0,
  "E": 1.0,
  "F": 0.0,
};

/**
 * Calculates CGPA on a 5.0 scale based on course units and grades.
 */
export function calculateCGPA(courses: CourseGrade[]): number {
  if (courses.length === 0) return 0.0;

  let totalQualityPoints = 0;
  let totalUnits = 0;

  for (const course of courses) {
    const point = GRADE_POINTS_5_SCALE[course.grade.toUpperCase()] || 0;
    totalQualityPoints += (point * course.units);
    totalUnits += course.units;
  }

  if (totalUnits === 0) return 0.0;
  return Number((totalQualityPoints / totalUnits).toFixed(2));
}
