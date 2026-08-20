// lib/scheduleService.ts
// Handles Class Schedules and auto-hooks into Native Alarms

import { db, auth } from "./firebase";
import { collection, doc, setDoc, getDocs, query, where, deleteDoc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { scheduleAlarm, cancelAlarm } from "./alarmService";

export interface ScheduleEvent {
  id: string;
  title: string;
  courseCode: string;
  classCode?: string; // Random 6-char code for students to join
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
  chatId?: string;        // ID of the automatically generated class group chat
}

// ─── Firestore Operations ──────────────────────────────────────────────────

import { createGroupChat } from "./firestoreService";

function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Creates a new schedule event (Lecturer only) and schedules an alarm.
 * Also automatically creates a dedicated Group Chat for the class.
 */
export async function createScheduleEvent(event: Omit<ScheduleEvent, "id" | "classCode" | "chatId">): Promise<string> {
  const eventRef = doc(collection(db, "schedules"));
  const classCode = generateClassCode();

  // Create the group chat for this class
  const groupName = `${event.courseCode}: ${event.title}`;
  // We use empty avatar for now, the UI can render initials
  const chatId = await createGroupChat(
    groupName,
    [event.lecturerId], // Initial participant is just the lecturer
    { [event.lecturerId]: event.lecturerName },
    { [event.lecturerId]: "" },
    true, // Make it public so it shows in Discover
    true, // Mark as Class Group
    eventRef.id // Link to this schedule event
  );

  const newEvent: ScheduleEvent = { 
    ...event, 
    id: eventRef.id,
    classCode,
    chatId,
    participants: [] // Start with no students
  };
  
  await setDoc(eventRef, newEvent);

  // Automatically hook into the native alarm system for the creator
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
 * Students join a class using a 6-character class code.
 * They are also automatically added to the class's Group Chat.
 */
export async function joinClass(uid: string, classCode: string, userName: string, userAvatar: string = ""): Promise<void> {
  const code = classCode.trim().toUpperCase();
  const q = query(collection(db, "schedules"), where("classCode", "==", code));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error("Invalid class code. No class found.");
  }
  
  const classDoc = snapshot.docs[0];
  const classData = classDoc.data() as ScheduleEvent;
  
  // 1. Add student to the class schedule participants
  await updateDoc(doc(db, "schedules", classDoc.id), {
    participants: arrayUnion(uid)
  });

  // 2. Add student to the class Group Chat if it exists
  if (classData.chatId) {
    const roomRef = doc(db, "chatRooms", classData.chatId);
    await updateDoc(roomRef, {
      participants: arrayUnion(uid),
      [`participantNames.${uid}`]: userName,
      [`participantAvatars.${uid}`]: userAvatar,
      [`unreadCounts.${uid}`]: 0
    });
  }
}

/**
 * Fetches the schedule for a specific user.
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
 */
export async function syncScheduleAlarms(uid: string, role: "student" | "lecturer") {
  const events = await fetchUserSchedule(uid, role);
  
  for (const event of events) {
    const alarmTime = event.startTime - (15 * 60 * 1000);
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
let hasAttemptedScheduleSeed = false;

export function subscribeUserSchedule(
  uid: string,
  role: "student" | "lecturer",
  onUpdate: (data: ScheduleEvent[]) => void
) {
  const schedulesRef = collection(db, "schedules");
  let q;

  if (role === "lecturer") {
    q = query(schedulesRef, where("lecturerId", "==", uid));
  } else {
    // For students, get classes they are enrolled in OR "global" classes (for testing backward compatibility)
    q = query(schedulesRef, where("participants", "array-contains-any", [uid, "global"]));
  }

  return onSnapshot(q, async (snapshot) => {
    let data = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as ScheduleEvent[];
      
    if (data.length === 0) {
      if (!hasAttemptedScheduleSeed && auth.currentUser) {
        hasAttemptedScheduleSeed = true;
        console.log("No schedule found, auto-seeding dummy data...");
        import("@/dummydata/scheduleData").then(({ seedDatabaseWithDummySchedule }) => {
            if(seedDatabaseWithDummySchedule) seedDatabaseWithDummySchedule().catch(console.error);
        });
      }
      import("@/dummydata/scheduleData").then(({ dummyScheduleData }) => {
        onUpdate(dummyScheduleData);
      }).catch(console.error);
    } else {
      onUpdate(data.sort((a, b) => a.startTime - b.startTime));
    }
  });
}

/**
 * Seed the database with global dummy data accessible to everyone for testing
 */
export async function seedDatabaseWithDummySchedule() {
  const dummyEvents = [
    {
      title: "Introduction to React Native",
      courseCode: "CS401",
      location: "Hall A, Science Building",
      classroomLat: 37.7749, // Dummy coords
      classroomLon: -122.4194,
      classroomRadius: 100,
      lecturerId: "global_dummy_lecturer",
      lecturerName: "Dr. Alan Turing",
      startTime: Date.now() + 1 * 60 * 60 * 1000, // Starts in 1 hour
      endTime: Date.now() + 3 * 60 * 60 * 1000,
      participants: ["global"],
    },
    {
      title: "Advanced Cloud Architecture",
      courseCode: "CS502",
      location: "Hall C",
      classroomLat: 37.7749, // Dummy coords
      classroomLon: -122.4194,
      classroomRadius: 100,
      lecturerId: "global_dummy_lecturer",
      lecturerName: "Dr. Vint Cerf",
      startTime: Date.now() + 24 * 60 * 60 * 1000, // Starts tomorrow
      endTime: Date.now() + 26 * 60 * 60 * 1000,
      participants: ["global"],
    }
  ];

  for (const event of dummyEvents) {
    try {
      await createScheduleEvent(event);
    } catch (e) {
      console.warn("Failed to seed dummy event", e);
    }
  }
}
