import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDQg1m8U65ZnXMa8Qo70aT8wuECKLbmITY",
  authDomain: "edvantae-mobile.firebaseapp.com",
  projectId: "edvantae-mobile",
  storageBucket: "edvantae-mobile.firebasestorage.app",
  messagingSenderId: "296171411586",
  appId: "1:296171411586:web:bf78f1a3c9bc828e85bc9b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DUMMY_EMAIL = "dummy_lecturer@edvantage.com";
const DUMMY_PASSWORD = "Password123!";

const MOCK_RESOURCES = [
  {
    filename: "Introduction to React Native.pdf",
    filepath: "/mock/resources/intro_to_react_native.pdf",
    uploadedBy: "Prof. AI Lecturer",
    summary: "A comprehensive guide to getting started with React Native and Expo.",
    createdAt: new Date().toISOString(),
  },
  {
    filename: "UI Design Principles.pptx",
    filepath: "/mock/resources/ui_design.pptx",
    uploadedBy: "Prof. AI Lecturer",
    summary: "Lecture slides on mobile UI/UX design heuristics.",
    createdAt: new Date().toISOString(),
  },
  {
    filename: "Data Structures Crash Course.mp4",
    filepath: "/mock/resources/ds_crash_course.mp4",
    uploadedBy: "Prof. AI Lecturer",
    summary: "Video recording of the crash course on Arrays, Trees, and Graphs.",
    createdAt: new Date().toISOString(),
  }
];

const MOCK_SCHEDULE = [
  // ─── ACTIVE CLASS ───
  {
    id: "dummy_class_active_1",
    title: "Mobile App Development Practicals",
    courseCode: "SEN 300",
    classCode: "SEN300",
    location: "Software Lab",
    lecturerId: "global",
    lecturerName: "Prof. AI Lecturer",
    startTime: Date.now() - 30 * 60 * 1000, // Started 30 mins ago
    endTime: Date.now() + 90 * 60 * 1000, // Ends in 1.5 hours
    participants: ["global"], 
    classroomLat: 6.5244,
    classroomLon: 3.3792,
    classroomRadius: 500
  },
  // ─── UPCOMING CLASS ───
  {
    id: "dummy_class_upcoming_1",
    title: "Introduction to React Native",
    courseCode: "CSC 401",
    classCode: "CSC401",
    location: "Lecture Hall A",
    lecturerId: "global",
    lecturerName: "Prof. AI Lecturer",
    startTime: Date.now() + 2 * 60 * 60 * 1000, // In 2 hours
    endTime: Date.now() + 4 * 60 * 60 * 1000, 
    participants: ["global"], 
    classroomLat: 6.5244,
    classroomLon: 3.3792,
    classroomRadius: 100
  },
  // ─── PAST CLASS ───
  {
    id: "dummy_class_past_1",
    title: "Database Management Systems",
    courseCode: "CSC 201",
    classCode: "CSC201",
    location: "Hall C",
    lecturerId: "global",
    lecturerName: "Dr. Codd",
    startTime: Date.now() - 48 * 60 * 60 * 1000, // 2 days ago
    endTime: Date.now() - 46 * 60 * 60 * 1000,
    participants: ["global"],
    classroomLat: 6.5244,
    classroomLon: 3.3792,
    classroomRadius: 100
  }
];

const MOCK_CHATS = [
  {
    isGroup: true,
    name: "CSC 401 General Discussion",
    participants: ["global"],
    isPublic: true, // Based on user rules, public groups can be joined by anyone
    createdAt: new Date().toISOString(),
    lastMessage: "Welcome to the class group!",
    lastMessageTime: new Date().toISOString()
  },
  {
    isGroup: true,
    name: "React Native Study Group",
    participants: ["global"],
    isPublic: true,
    createdAt: new Date().toISOString(),
    lastMessage: "Anyone finished the assignment yet?",
    lastMessageTime: new Date().toISOString()
  },
  {
    isGroup: true,
    name: "Faculty Announcements",
    participants: ["global"],
    isPublic: true,
    createdAt: new Date().toISOString(),
    lastMessage: "Please check your schedule for updates.",
    lastMessageTime: new Date().toISOString()
  }
];

async function seed() {
  try {
    console.log("1. Authenticating...");
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, DUMMY_EMAIL, DUMMY_PASSWORD);
      console.log("   -> Created new dummy lecturer account.");
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        userCredential = await signInWithEmailAndPassword(auth, DUMMY_EMAIL, DUMMY_PASSWORD);
        console.log("   -> Signed into existing dummy lecturer account.");
      } else {
        throw e;
      }
    }
    const user = userCredential.user;

    console.log("2. Setting role to 'lecturer'...");
    await setDoc(doc(db, "users", user.uid), {
      firstName: "Dummy",
      lastName: "Lecturer",
      email: DUMMY_EMAIL,
      role: "lecturer",
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log("   -> Role set successfully.");

    console.log("3. Seeding dummy resources...");
    for (const res of MOCK_RESOURCES) {
      await addDoc(collection(db, "resources"), res);
    }
    console.log("   -> Seeded 3 resources.");

    console.log("4. Seeding dummy schedule & linked class chats...");
    let schedCount = 0;
    for (const schedule of MOCK_SCHEDULE) {
      schedule.lecturerId = user.uid;
      
      // 1. Create or overwrite the class group chat using a deterministic ID
      const chatRef = doc(db, "chatRooms", `chat_${schedule.id}`);
      await setDoc(chatRef, {
        name: `${schedule.courseCode}: ${schedule.title}`,
        participants: ["global", user.uid, "dummy_student_1", "dummy_student_2"],
        participantNames: { 
          [user.uid]: "Prof. AI Lecturer",
          "dummy_student_1": "Alice Student",
          "dummy_student_2": "Bob Learner"
        },
        participantAvatars: { [user.uid]: "", "dummy_student_1": "", "dummy_student_2": "" },
        isGroup: true,
        isPublic: true,
        isClassGroup: true,
        classId: schedule.id,
        lastMessage: "Are we doing a quiz this week?",
        lastMessageTime: new Date().toISOString(),
        unreadCounts: { [user.uid]: 0, "global": 0, "dummy_student_1": 0, "dummy_student_2": 0 },
        createdAt: new Date().toISOString()
      });

      // 1.5 Add messages to the chat to simulate a real group
      const messagesRef = collection(db, "chatRooms", chatRef.id, "messages");
      await setDoc(doc(messagesRef), {
        text: "Welcome to the class! Here is where announcements and discussions will happen.",
        sender: user.uid,
        senderName: "Prof. AI Lecturer",
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        readBy: ["global", user.uid, "dummy_student_1", "dummy_student_2"]
      });
      await setDoc(doc(messagesRef), {
        text: "Thanks professor!",
        sender: "dummy_student_1",
        senderName: "Alice Student",
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
        readBy: ["global", user.uid, "dummy_student_1", "dummy_student_2"]
      });
      await setDoc(doc(messagesRef), {
        text: "Are we doing a quiz this week?",
        sender: "dummy_student_2",
        senderName: "Bob Learner",
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 mins ago
        readBy: ["global", user.uid, "dummy_student_1", "dummy_student_2"]
      });

      // 2. Link chat to schedule
      schedule.chatId = chatRef.id;
      schedule.participants = ["global", user.uid, "dummy_student_1", "dummy_student_2"];

      // 3. Save schedule
      const schedRef = doc(db, "schedules", schedule.id);
      await setDoc(schedRef, schedule);
      schedCount++;

      // 3.5 Generate Past Meetings
      for (let i = 1; i <= 3; i++) {
        const pastId = `${schedule.id}_past_${i}`;
        const pastTime = schedule.startTime - (i * 7 * 24 * 60 * 60 * 1000); // 1, 2, 3 weeks ago
        
        await setDoc(doc(db, "schedules", pastId), {
          ...schedule,
          id: pastId,
          startTime: pastTime,
          endTime: pastTime + (schedule.endTime - schedule.startTime)
        });

        // 7. Create dummy Attendance for this past meeting
        await setDoc(doc(collection(db, "attendance")), {
          classId: pastId,
          courseCode: schedule.courseCode,
          date: new Date(pastTime).toISOString(),
          records: {
            "dummy_student_1": i % 2 === 0 ? "absent" : "present",
            "dummy_student_2": "present",
            "global": "present"
          },
          createdAt: new Date().toISOString()
        });
        schedCount++;
      }

      // 4. Create dummy Assignment
      await setDoc(doc(collection(db, "tasks")), {
        title: `Assignment 1: ${schedule.courseCode}`,
        description: `Please complete the first assignment for ${schedule.title}.`,
        classId: schedule.id,
        uid: user.uid,
        type: "assignment",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });

      // 5. Create dummy Resource
      await setDoc(doc(collection(db, "resources")), {
        title: `${schedule.courseCode} Syllabus`,
        type: "document",
        url: "https://example.com/syllabus.pdf",
        classId: schedule.id,
        uploadedBy: "Prof. AI Lecturer",
        createdAt: new Date().toISOString()
      });

      // 6. Create dummy Announcement (Broadcast)
      await setDoc(doc(collection(db, "broadcasts")), {
        title: "Welcome to the new semester",
        message: "Please review the syllabus before our next class.",
        classId: schedule.id,
        authorName: "Prof. AI Lecturer",
        createdAt: new Date(Date.now() - 86400000).toISOString()
      });
    }
    console.log(`   -> Seeded ${schedCount} schedule events with linked group chats.`);

    console.log("✅ FINISHED! All dummy data is now permanently in Firestore.");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR SEEDING DATA:", error);
    process.exit(1);
  }
}

seed();
