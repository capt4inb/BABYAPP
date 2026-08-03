import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
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
const auth = getAuth(app);
const db = getDatabase(app);

let anonymousSignInPromise = null;

const isPermissionDenied = (error) => {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return code.includes("permission") || message.includes("permission denied");
};

const ensureFirebaseAuth = async () => {
  if (auth.currentUser) return auth.currentUser;

  if (!anonymousSignInPromise) {
    anonymousSignInPromise = signInAnonymously(auth)
      .then((credential) => credential.user)
      .catch((error) => {
        anonymousSignInPromise = null;
        throw error;
      });
  }

  return anonymousSignInPromise;
};

const withPermissionRetry = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (!auth.currentUser && isPermissionDenied(error)) {
      await ensureFirebaseAuth();
      return operation();
    }

    throw error;
  }
};

export const getFirebaseErrorMessage = (error) => {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  if (isPermissionDenied(error)) {
    return "Không có quyền truy cập phòng này. Hãy kiểm tra mã PIN hoặc cấu hình Firebase Realtime Database rules.";
  }

  if (code.includes("configuration-not-found")) {
    return "Dịch vụ Firebase Authentication chưa được bật hoặc chưa cấu hình đúng. Vui lòng vào Firebase Console > Build > Authentication và nhấn 'Get Started'.";
  }

  if (code.includes("operation-not-allowed")) {
    return "Firebase chưa bật đăng nhập ẩn danh. Hãy bật Anonymous sign-in trong Firebase Authentication.";
  }

  if (code.includes("network") || message.includes("network")) {
    return "Không thể kết nối Firebase. Hãy kiểm tra mạng rồi thử lại.";
  }

  return error?.message || "Đã xảy ra lỗi khi đồng bộ dữ liệu.";
};

// Generate random 4-digit PIN
export const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Create a new room with a random PIN
export const createRoom = async (
  initialRecords,
  initialSettings,
  initialMilkBags,
  initialMemos,
  initialDiapers = [],
  initialSleeps = [],
  initialVaccines = []
) => {
  return withPermissionRetry(async () => {
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
      diapers: initialDiapers || [],
      sleeps: initialSleeps || [],
      vaccines: initialVaccines || [],
      createdAt: new Date().toISOString()
    });

    return pin;
  });
};

// Check if a room exists
export const joinRoom = async (pin) => {
  const roomRef = ref(db, `rooms/${pin}`);
  const snapshot = await withPermissionRetry(() => get(roomRef));
  if (!snapshot.exists()) {
    throw new Error("Mã PIN không đúng hoặc phòng không tồn tại.");
  }
  return snapshot.val(); // Returns initial data
};

// Subscribe to real-time changes
export const subscribeToRoom = (
  pin,
  onRecordsChange,
  onSettingsChange,
  onMilkBagsChange,
  onMemosChange,
  onDiapersChange,
  onSleepsChange,
  onVaccinesChange,
  onError
) => {
  const recordsRef = ref(db, `rooms/${pin}/records`);
  const settingsRef = ref(db, `rooms/${pin}/settings`);
  const milkBagsRef = ref(db, `rooms/${pin}/milkBags`);
  const memosRef = ref(db, `rooms/${pin}/memos`);
  const diapersRef = ref(db, `rooms/${pin}/diapers`);
  const sleepsRef = ref(db, `rooms/${pin}/sleeps`);
  const vaccinesRef = ref(db, `rooms/${pin}/vaccines`);
  let unsubscribers = [];
  let isActive = true;
  let authRetryInFlight = false;

  const stopListeners = () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
  };

  const handleListenerError = async (error) => {
    stopListeners();

    if (!auth.currentUser && isPermissionDenied(error)) {
      if (authRetryInFlight) return;

      try {
        authRetryInFlight = true;
        await ensureFirebaseAuth();
        authRetryInFlight = false;
        if (isActive) startListeners();
        return;
      } catch (authError) {
        authRetryInFlight = false;
        if (isActive) onError?.(authError);
        return;
      }
    }

    if (isActive) onError?.(error);
  };

  const startListeners = () => {
    stopListeners();

    unsubscribers = [
      onValue(recordsRef, (snapshot) => {
        onRecordsChange(snapshot.exists() ? snapshot.val() : []);
      }, handleListenerError),
      onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          onSettingsChange(snapshot.val());
        }
      }, handleListenerError),
      onMilkBagsChange
        ? onValue(milkBagsRef, (snapshot) => {
            onMilkBagsChange(snapshot.exists() ? snapshot.val() : []);
          }, handleListenerError)
        : () => {},
      onMemosChange
        ? onValue(memosRef, (snapshot) => {
            onMemosChange(snapshot.exists() ? snapshot.val() : []);
          }, handleListenerError)
        : () => {},
      onDiapersChange
        ? onValue(diapersRef, (snapshot) => {
            onDiapersChange(snapshot.exists() ? snapshot.val() : []);
          }, handleListenerError)
        : () => {},
      onSleepsChange
        ? onValue(sleepsRef, (snapshot) => {
            onSleepsChange(snapshot.exists() ? snapshot.val() : []);
          }, handleListenerError)
        : () => {},
      onVaccinesChange
        ? onValue(vaccinesRef, (snapshot) => {
            onVaccinesChange(snapshot.exists() ? snapshot.val() : []);
          }, handleListenerError)
        : () => {},
    ];
  };

  startListeners();

  return () => {
    isActive = false;
    stopListeners();
  };
};

// Update records
export const updateRoomRecords = async (pin, records) => {
  const recordsRef = ref(db, `rooms/${pin}/records`);
  await withPermissionRetry(() => set(recordsRef, records));
};

// Update settings
export const updateRoomSettings = async (pin, settings) => {
  const settingsRef = ref(db, `rooms/${pin}/settings`);
  await withPermissionRetry(() => set(settingsRef, settings));
};

// Update milk bags
export const updateRoomMilkBags = async (pin, milkBags) => {
  const milkBagsRef = ref(db, `rooms/${pin}/milkBags`);
  await withPermissionRetry(() => set(milkBagsRef, milkBags));
};

// Update memos
export const updateRoomMemos = async (pin, memos) => {
  const memosRef = ref(db, `rooms/${pin}/memos`);
  await withPermissionRetry(() => set(memosRef, memos));
};

export const updateRoomDiapers = async (pin, diapers) => {
  const diapersRef = ref(db, `rooms/${pin}/diapers`);
  await withPermissionRetry(() => set(diapersRef, diapers));
};

export const updateRoomSleeps = async (pin, sleeps) => {
  const sleepsRef = ref(db, `rooms/${pin}/sleeps`);
  await withPermissionRetry(() => set(sleepsRef, sleeps));
};

export const updateRoomVaccines = async (pin, vaccines) => {
  const vaccinesRef = ref(db, `rooms/${pin}/vaccines`);
  await withPermissionRetry(() => set(vaccinesRef, vaccines));
};
