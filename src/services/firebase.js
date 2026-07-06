import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAaa6tJe31b5XVwF8ad8kbGWgktFm9DXlM",
  authDomain: "baby-tracker-47cda.firebaseapp.com",
  databaseURL: "https://baby-tracker-47cda-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "baby-tracker-47cda",
  storageBucket: "baby-tracker-47cda.firebasestorage.app",
  messagingSenderId: "609741196137",
  appId: "1:609741196137:web:b11940795e4502ff90cbf8",
  measurementId: "G-9GV8GZ9LWL"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Generate random 4-digit PIN
export const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Create a new room with a random PIN
export const createRoom = async (initialRecords, initialSettings, initialMilkBags, initialMemos) => {
  let pin = generatePin();
  let roomRef = ref(db, `rooms/${pin}`);
  let snapshot = await get(roomRef);
  
  // Ensure uniqueness
  while (snapshot.exists()) {
    pin = generatePin();
    roomRef = ref(db, `rooms/${pin}`);
    snapshot = await get(roomRef);
  }

  await set(roomRef, {
    records: initialRecords || [],
    settings: initialSettings || {},
    milkBags: initialMilkBags || [],
    memos: initialMemos || [],
    createdAt: new Date().toISOString()
  });

  return pin;
};

// Check if a room exists
export const joinRoom = async (pin) => {
  const roomRef = ref(db, `rooms/${pin}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) {
    throw new Error("Mã PIN không đúng hoặc phòng không tồn tại.");
  }
  return snapshot.val(); // Returns initial data
};

// Subscribe to real-time changes
export const subscribeToRoom = (pin, onRecordsChange, onSettingsChange, onMilkBagsChange, onMemosChange, onError) => {
  const recordsRef = ref(db, `rooms/${pin}/records`);
  const settingsRef = ref(db, `rooms/${pin}/settings`);
  const milkBagsRef = ref(db, `rooms/${pin}/milkBags`);
  const memosRef = ref(db, `rooms/${pin}/memos`);

  const handleErr = (err) => {
    if (onError) onError(err);
  };

  const unsubscribeRecords = onValue(recordsRef, (snapshot) => {
    onRecordsChange(snapshot.exists() ? snapshot.val() : []);
  }, handleErr);

  const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      onSettingsChange(snapshot.val());
    }
  }, handleErr);

  const unsubscribeMilkBags = onMilkBagsChange
    ? onValue(milkBagsRef, (snapshot) => {
        onMilkBagsChange(snapshot.exists() ? snapshot.val() : []);
      }, handleErr)
    : () => {};

  const unsubscribeMemos = onMemosChange
    ? onValue(memosRef, (snapshot) => {
        onMemosChange(snapshot.exists() ? snapshot.val() : []);
      }, handleErr)
    : () => {};

  return () => {
    unsubscribeRecords();
    unsubscribeSettings();
    unsubscribeMilkBags();
    unsubscribeMemos();
  };
};

// Update records
export const updateRoomRecords = async (pin, records) => {
  const recordsRef = ref(db, `rooms/${pin}/records`);
  await set(recordsRef, records);
};

// Update settings
export const updateRoomSettings = async (pin, settings) => {
  const settingsRef = ref(db, `rooms/${pin}/settings`);
  await set(settingsRef, settings);
};

// Update milk bags
export const updateRoomMilkBags = async (pin, milkBags) => {
  const milkBagsRef = ref(db, `rooms/${pin}/milkBags`);
  await set(milkBagsRef, milkBags);
};

// Update memos
export const updateRoomMemos = async (pin, memos) => {
  const memosRef = ref(db, `rooms/${pin}/memos`);
  await set(memosRef, memos);
};
