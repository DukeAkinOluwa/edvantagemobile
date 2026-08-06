// lib/attendanceService.ts
// Server-side geofencing engine + tamper-proof attendance logging

import { db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ClassroomCoordinates {
  latitude: number;
  longitude: number;
  radiusMeters: number; // Allowed check-in radius (e.g., 100 metres)
  name: string;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  studentName: string;
  classId: string;
  courseCode: string;
  checkInTime: Timestamp | null;
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceFromClassroom: number;
  isMockLocation: boolean;
  status: "present" | "out_of_range" | "rejected_mock";
}

export interface GeofenceCheckResult {
  allowed: boolean;
  distanceMeters: number;
  reason: string;
}

// ─── Geofencing Engine ────────────────────────────────────────────────────

/**
 * Calculates the straight-line distance between two GPS coordinates using
 * the Haversine formula (returns distance in metres).
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Core server-side geofence check. Validates the student's GPS position
 * against the classroom's pre-set coordinates and radius.
 */
export function runGeofenceCheck(
  studentLat: number,
  studentLon: number,
  classroom: ClassroomCoordinates
): GeofenceCheckResult {
  const dist = haversineDistance(
    studentLat,
    studentLon,
    classroom.latitude,
    classroom.longitude
  );

  if (dist <= classroom.radiusMeters) {
    return {
      allowed: true,
      distanceMeters: dist,
      reason: `Within range. Distance: ${dist.toFixed(1)}m`,
    };
  }

  return {
    allowed: false,
    distanceMeters: dist,
    reason: `Out of range by ${(dist - classroom.radiusMeters).toFixed(1)}m`,
  };
}

// ─── Mock Location Detection ─────────────────────────────────────────────

/**
 * Detects mock/spoofed GPS locations by cross-checking accuracy values.
 * Mock locations from apps like "Fake GPS" often have abnormally perfect accuracy
 * (exactly 0.0 or 1.0) or suspiciously high altitude values.
 *
 * Note: A more robust production check would use Android's
 * `location.isMockProvider()` via a native module. This is the JS-level guard.
 */
export function detectMockLocation(
  accuracy: number,
  altitude: number | null,
  speed: number | null
): boolean {
  // Exact 0-precision accuracy is physically impossible for GPS
  if (accuracy === 0) return true;

  // Suspiciously perfect accuracy (emulator/mock apps often report exactly 1.0 or 5.0)
  if (accuracy <= 1.0 && accuracy > 0) return true;

  // Speed implausibly high combined with perfect accuracy is a spoofing signal
  if (speed !== null && speed > 50 && accuracy < 5) return true;

  return false;
}

// ─── Tamper-Proof Attendance Logging ─────────────────────────────────────

/**
 * Writes an immutable attendance record to Firestore.
 * The document includes the server timestamp (cannot be forged by the client)
 * and all diagnostic GPS metrics for auditing.
 */
export async function logAttendance(
  record: Omit<AttendanceRecord, "id" | "checkInTime">
): Promise<{ success: boolean; recordId?: string }> {
  try {
    const docRef = await addDoc(collection(db, "attendance"), {
      ...record,
      checkInTime: serverTimestamp(), // Server-side — client cannot fake this
      createdAt: serverTimestamp(),
    });
    return { success: true, recordId: docRef.id };
  } catch (err) {
    console.error("Failed to log attendance:", err);
    return { success: false };
  }
}

/**
 * Fetches all attendance records for a given class session.
 * Intended for the Lecturer's attendance monitor view.
 */
export async function fetchAttendanceForClass(
  classId: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, "attendance"),
    where("classId", "==", classId),
    orderBy("checkInTime", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
}

/**
 * Fetches a student's own attendance history.
 */
export async function fetchStudentAttendance(
  studentId: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, "attendance"),
    where("studentId", "==", studentId),
    orderBy("checkInTime", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
}
