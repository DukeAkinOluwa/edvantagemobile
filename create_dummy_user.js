const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyDQg1m8U65ZnXMa8Qo70aT8wuECKLbmITY",
  authDomain: "edvantae-mobile.firebaseapp.com",
  projectId: "edvantae-mobile",
  storageBucket: "edvantae-mobile.firebasestorage.app",
  messagingSenderId: "296171411586",
  appId: "1:296171411586:web:bf78f1a3c9bc828e85bc9b",
  measurementId: "G-YG2D95B37W",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const dummyUsers = [
  {
    firstName: "Alice",
    lastName: "Johnson",
    university: "University of Lagos",
    course: "Computer Science",
    department: "Computer Science",
    bio: "I love coding and building things.",
    level: "300",
    phoneNumber: "+2348000000001",
  },
  {
    firstName: "Bob",
    lastName: "Smith",
    university: "University of Ibadan",
    course: "Mechanical Engineering",
    department: "Mechanical Engineering",
    bio: "Passionate about robotics and machines.",
    level: "200",
    phoneNumber: "+2348000000002",
  },
  {
    firstName: "Charlie",
    lastName: "Davis",
    university: "Covenant University",
    course: "Business Administration",
    department: "Business Administration",
    bio: "Aspiring entrepreneur looking to learn.",
    level: "400",
    phoneNumber: "+2348000000003",
  }
];

async function createDummyUsers() {
  for (const user of dummyUsers) {
    try {
      const email = user.firstName.toLowerCase() + Date.now() + "@example.com";
      const password = "Password123!";
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const dummyUserId = userCredential.user.uid;
      
      const userRef = doc(db, "users", dummyUserId);
      
      await setDoc(userRef, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: email,
        phoneNumber: user.phoneNumber,
        university: user.university,
        course: user.course,
        department: user.department,
        bio: user.bio,
        level: user.level,
        role: "student",
        language: "english",
        profilePic: "https://i.pravatar.cc/150?img=" + Math.floor(Math.random() * 70),
        allowNotifications: true,
        uid: dummyUserId,
        createdAt: Date.now()
      });

      console.log(`Successfully created ${user.firstName} ${user.lastName}!`);
      console.log("Email:", email);
      console.log("Password:", password);
      console.log("UID:", dummyUserId);
      console.log("----------------------------------");
    } catch (error) {
      console.error(`Error creating user ${user.firstName}:`, error);
    }
  }
  process.exit(0);
}

createDummyUsers();
