// lib/scheduleService.ts
// Handles Class Schedules and auto-hooks into Native Alarms

import { db } from "./firebase";
import { collection, doc, setDoc, getDocs, query, where, deleteDoc, onSnapshot } from "firebase/firestore";
import { scheduleAlarm, cancelAlarm } from "./alarmService";

export interface ScheduleEvent {
  id: string;
  title: string;
  courseCode: string;
  lecturerId: string;
  lecturerName: string;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  location: string;       // Human-readable hall/room name
  classroomLat: number;   // Classroom GPS latitude for geofencing
  classroomLon: number;   // Classroom GPS longitude for geofencing
  classroomRadius: number; // Check-in radius in metres (e.g., 100)
  description?: string;
  participants: string[]; // UIDs of students in the course
}

// ─── Firestore Operations ──────────────────────────────────────────────────

/**
 * Creates a new schedule event (Lecturer only) and schedules an alarm.
 */
export async function createScheduleEvent(event: Omit<ScheduleEvent, "id">): Promise<string> {
  const eventRef = doc(collection(db, "schedules"));
  const newEvent: ScheduleEvent = { ...event, id: eventRef.id };
  
  await setDoc(eventRef, newEvent);

  // Automatically hook into the native alarm system for the creator
  // Schedule alarm 15 minutes before class starts
  const alarmTime = event.startTime - (15 * 60 * 1000);
  if (alarmTime > Date.now()) {
    await scheduleAlarm(
      `class_${eventRef.id}`, 
      alarmTime, 
      `Upcoming Class: ${event.courseCode}`, 
      `${event.title} starts in 15 minutes at ${event.location}.`
    );
  }

  return eventRef.id;
}

/**
 * Fetches the schedule for a specific user (either as a participant or the lecturer).
 */
export async function fetchUserSchedule(uid: string, role: "student" | "lecturer"): Promise<ScheduleEvent[]> {
  const schedulesRef = collection(db, "schedules");
  let q;

  if (role === "lecturer") {
    q = query(schedulesRef, where("lecturerId", "==", uid));
  } else {
    q = query(schedulesRef, where("participants", "array-contains", uid));
  }

  const snapshot = await getDocs(q);
  const events: ScheduleEvent[] = [];
  
  snapshot.forEach((doc) => {
    events.push(doc.data() as ScheduleEvent);
  });

  return events.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Syncs the schedule and ensures all native alarms are set.
 * Should be called when the app starts or when the user opens the schedule tab.
 */
export async function syncScheduleAlarms(uid: string, role: "student" | "lecturer") {
  const events = await fetchUserSchedule(uid, role);
  
  for (const event of events) {
    const alarmTime = event.startTime - (15 * 60 * 1000);
    // Only schedule if the alarm time is in the future
    if (alarmTime > Date.now()) {
      await scheduleAlarm(
        `class_${event.id}`, 
        alarmTime, 
        `Upcoming Class: ${event.courseCode}`, 
        `${event.title} starts in 15 minutes at ${event.location}.`
      );
    }
  }
}

/**
 * Deletes an event and cancels its native alarm.
 */
export async function deleteScheduleEvent(eventId: string) {
  await deleteDoc(doc(db, "schedules", eventId));
  await cancelAlarm(`class_${eventId}`);
}

/**
 * Subscribes to the schedule for a specific user in real-time.
 */
export function subscribeUserSchedule(
  uid: string,
  role: "student" | "lecturer",
  onData: (events: ScheduleEvent[]) => void
) {
  const schedulesRef = collection(db, "schedules");
  let q;

  if (role === "lecturer") {
    q = query(schedulesRef, where("lecturerId", "==", uid));
  } else {
    q = query(schedulesRef, where("participants", "array-contains", uid));
  }

  return onSnapshot(q, (snapshot) => {
    const events: ScheduleEvent[] = [];
    snapshot.forEach((doc) => {
      events.push(doc.data() as ScheduleEvent);
    });
    onData(events.sort((a, b) => a.startTime - b.startTime));
  });
}
