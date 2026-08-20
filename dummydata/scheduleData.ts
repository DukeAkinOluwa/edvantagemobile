// dummydata/scheduleData.ts

export type ScheduleEventType = "lecture" | "lab" | "exam" | "meeting";

export interface ScheduleEvent {
  id: string;
  title: string;
  courseCode: string;
  type: ScheduleEventType;
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
  location: string;
  lecturer: string;
  description: string;
  mandatory: boolean;
}

// Helper to generate dates relative to today
const getRelativeDate = (daysOffset: number, hour: number, minute: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const DUMMY_SCHEDULE_DATA: ScheduleEvent[] = [
  {
    id: "evt_1",
    title: "Introduction to React Native",
    courseCode: "CS401",
    classCode: "CS401",
    type: "lecture",
    startTime: getRelativeDate(0, 9, 0), // Today at 9:00 AM
    endTime: getRelativeDate(0, 11, 0), // Today at 11:00 AM
    location: "Hall A, Science Building",
    lecturer: "Dr. Alan Turing",
    description: "Deep dive into mobile app architecture and React Native components.",
    mandatory: true,
  },
  {
    id: "evt_2",
    title: "Data Structures Lab",
    courseCode: "CS305",
    classCode: "CS305",
    type: "lab",
    startTime: getRelativeDate(0, 13, 30), // Today at 1:30 PM
    endTime: getRelativeDate(0, 15, 30), // Today at 3:30 PM
    location: "Computer Lab 3",
    lecturer: "Prof. Grace Hopper",
    description: "Implementing Red-Black Trees and Graph traversal algorithms.",
    mandatory: true,
  },
  {
    id: "evt_3",
    title: "Midterm Examination",
    courseCode: "MATH201",
    classCode: "MATH201",
    type: "exam",
    startTime: getRelativeDate(1, 10, 0), // Tomorrow at 10:00 AM
    endTime: getRelativeDate(1, 12, 0), // Tomorrow at 12:00 PM
    location: "Main Auditorium",
    lecturer: "Dr. John Nash",
    description: "Covers chapters 1 through 5. Bring your student ID.",
    mandatory: true,
  },
  {
    id: "evt_4",
    title: "Faculty Mentorship Meeting",
    courseCode: "GEN100",
    type: "meeting",
    startTime: getRelativeDate(2, 14, 0), // 2 days from now at 2:00 PM
    endTime: getRelativeDate(2, 15, 0), // 2 days from now at 3:00 PM
    location: "Block B, Room 104",
    lecturer: "Dr. Ada Lovelace",
    description: "One-on-one session to discuss final year project topics.",
    mandatory: false,
  },
  {
    id: "evt_5",
    title: "Advanced Cloud Architecture",
    courseCode: "CS502",
    type: "lecture",
    startTime: getRelativeDate(3, 8, 0), // 3 days from now at 8:00 AM
    endTime: getRelativeDate(3, 10, 0), // 3 days from now at 10:00 AM
    location: "Hall C",
    lecturer: "Dr. Vint Cerf",
    description: "Understanding Firebase, AWS, and distributed systems.",
    mandatory: true,
  },
];
