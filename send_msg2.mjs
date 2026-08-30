import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import fs from 'fs';

// Read config from project root
const firebaseConfig = JSON.parse(fs.readFileSync('c:/Users/obami/Documents/codes/jobs/edvantagemobile-mikes_branch/firebase-env.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const chatId = 'chat_dummy_class_1';
  const senderId = 'dummy_student_1';
  const senderName = 'Dummy Student 1';
  
  // 1. Add message
  const msgRef = collection(db, 'chatRooms', chatId, 'messages');
  await addDoc(msgRef, {
    text: 'Hey guys, when is the next assignment due?',
    sender: senderId,
    senderName: senderName,
    timestamp: new Date().toISOString(),
    type: 'text'
  });

  // 2. Update room metadata so unread badge shows for "global" user
  const roomRef = doc(db, 'chatRooms', chatId);
  await updateDoc(roomRef, {
    lastMessage: 'Hey guys, when is the next assignment due?',
    lastMessageTime: new Date().toISOString(),
    'unreadCounts.global': 1
  });

  console.log('Sent message! Unread count for global updated.');
  process.exit(0);
}
run();
