import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  writeBatch,
  getDocs
} from "firebase/firestore";
import { Shift, User, UserRole, Department, JobRole, ShiftStatus } from "../types";

// Helper to safely get env vars in different environments (Vite vs Node/Polyfill)
const getEnv = (key: string) => {
  try {
    // Cast to any to avoid TS errors if vite/client types are missing
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {}
  
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Initialize Firebase or Fallback
let db: any;
try {
    if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    } else {
        console.warn("Running in OFFLINE DEMO MODE (No API Key provided)");
    }
} catch (e) {
    console.error("Firebase Init Error:", e);
}

// --- MOCK DATA GENERATORS (For Offline Mode) ---

const generateMockUsers = (): User[] => {
    const users: User[] = [];
    // Admins
    for(let i=1; i<=3; i++) {
        users.push({ id: `ADM${String(i).padStart(3, '0')}`, name: `管理者${i}`, department: Department.OTHER, role: UserRole.HR_ADMIN, password: 'admin' });
    }
    // Nurses
    const depts = [Department.WARD_2A, Department.WARD_3A, Department.WARD_3B, Department.WARD_4A];
    for(let i=1; i<=70; i++) {
        users.push({ id: `NS${String(i).padStart(3, '0')}`, name: `看護師${i}`, department: depts[i % depts.length], role: UserRole.EMPLOYEE, password: '0000' });
    }
    // Assistants
    for(let i=1; i<=60; i++) {
        users.push({ id: `AS${String(i).padStart(3, '0')}`, name: `助手${i}`, department: depts[i % depts.length], role: UserRole.EMPLOYEE, password: '0000' });
    }
    return users;
};

const generateMockShifts = (): Shift[] => {
    const today = new Date().toISOString().split('T')[0];
    return [
        {
            id: 'demo1',
            title: '入浴介助ヘルプ',
            department: Department.WARD_2A,
            jobRole: JobRole.ASSISTANT,
            date: today,
            startTime: '09:00',
            endTime: '12:00',
            hourlyRateBoost: 500,
            description: '入浴介助の人員が不足しています。',
            requirements: '入浴介助経験者',
            status: ShiftStatus.OPEN,
            applicantIds: []
        },
        {
            id: 'demo2',
            title: '準夜帯フリー業務',
            department: Department.WARD_3A,
            jobRole: JobRole.NURSE,
            date: today,
            startTime: '18:00',
            endTime: '22:00',
            hourlyRateBoost: 800,
            description: '準夜帯のフリー業務をお願いします。',
            requirements: '3A病棟経験者優遇',
            status: ShiftStatus.OPEN,
            applicantIds: []
        }
    ];
};

// --- OPERATIONS ---

export const subscribeToShifts = (callback: (shifts: Shift[]) => void) => {
  if (!db) {
      // Offline Mode: Return mock shifts
      setTimeout(() => callback(generateMockShifts()), 500);
      return () => {};
  }
  
  const q = query(collection(db, "shifts"));
  return onSnapshot(q, (snapshot) => {
    const shifts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Shift[];
    callback(shifts);
  });
};

export const addShiftToFirestore = async (shift: Shift) => {
  if (!db) {
      alert("デモモードのためデータは保存されません");
      return;
  }
  const { id, ...shiftData } = shift; 
  await addDoc(collection(db, "shifts"), shiftData);
};

export const updateShiftInFirestore = async (shift: Shift) => {
  if (!db) {
      alert("デモモードのためデータは更新されません");
      return;
  }
  const shiftRef = doc(db, "shifts", shift.id);
  const { id, ...data } = shift; 
  await updateDoc(shiftRef, data as any);
};

export const deleteShiftFromFirestore = async (id: string) => {
  if (!db) return;
  await deleteDoc(doc(db, "shifts", id));
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  if (!db) {
      // Offline Mode: Return mock users immediately
      console.log("Returning Mock Users for Demo Login");
      setTimeout(() => callback(generateMockUsers()), 100);
      return () => {};
  }

  const q = query(collection(db, "users"), orderBy("id"));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data()) as User[];
    callback(users);
  });
};

export const updateUserInFirestore = async (user: User) => {
    if (!db) return;
    const userRef = doc(db, "users", user.id);
    await setDoc(userRef, user, { merge: true });
};

export const deleteUserFromFirestore = async (userId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "users", userId));
};

export const checkAndInitializeUsers = async (
    adminCount: number, 
    nurseCount: number, 
    assistantCount: number
) => {
    if (!db) return; // Skip if offline

    const snapshot = await getDocs(collection(db, "users"));
    if (!snapshot.empty) return; 

    console.log("Initializing Database with 130+ Users...");
    const batch = writeBatch(db);

    // Use the same logic as mock generator but for DB batch
    const users = generateMockUsers();
    users.forEach(user => {
        const userRef = doc(db, "users", user.id);
        batch.set(userRef, user);
    });

    await batch.commit();
    console.log("Initialization Complete.");
};