import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from "firebase/firestore";
const env = import.meta.env;
export const configured = !!(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_SHARED_EMAIL
);
const app = configured
  ? initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    })
  : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
if (
  import.meta.env.DEV &&
  env.VITE_USE_FIREBASE_EMULATORS === "true" &&
  auth &&
  db
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
export type Category = { id: string; name: string; color: string };
export type Entry = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  allDay: boolean;
  category: string;
  notes: string;
};
export type CalendarData = { categories: Category[]; events: Entry[] };
export const initial: CalendarData = {
  categories: [
    { id: "date", name: "約會時光", color: "#d99484" },
    { id: "life", name: "日常生活", color: "#90a78c" },
    { id: "work", name: "工作安排", color: "#8d9db1" },
    { id: "special", name: "重要日子", color: "#c4a35e" },
  ],
  events: [],
};
export async function loginCalendar(password: string) {
  await signInWithEmailAndPassword(
    auth!,
    env.VITE_FIREBASE_SHARED_EMAIL!,
    password,
  );
}
export const observeAuth = (cb: (ready: boolean) => void) =>
  onAuthStateChanged(auth!, (user) => cb(!!user));
export const logoutCalendar = () => signOut(auth!);
export function subscribeCalendar(
  cb: (data: CalendarData) => void,
  fail: (error: Error) => void,
) {
  const base = `calendars/${auth!.currentUser!.uid}`;
  let data: CalendarData = { events: [], categories: [] };
  const off1 = onSnapshot(
    collection(db!, base + "/events"),
    (s) => {
      data = {
        ...data,
        events: s.docs.map((d) => ({ ...d.data(), id: d.id }) as Entry),
      };
      cb(data);
    },
    fail,
  );
  const off2 = onSnapshot(
    collection(db!, base + "/categories"),
    (s) => {
      data = {
        ...data,
        categories: s.docs.map((d) => ({ ...d.data(), id: d.id }) as Category),
      };
      cb(data);
    },
    fail,
  );
  return () => {
    off1();
    off2();
  };
}
export async function seedCategories() {
  const c = collection(db!, `calendars/${auth!.currentUser!.uid}/categories`);
  if ((await getDocs(c)).empty) {
    const batch = writeBatch(db!);
    initial.categories.forEach((x) => batch.set(doc(c, x.id), x));
    await batch.commit();
  }
}
export async function remote(
  action: string,
  payload: Record<string, unknown> = {},
) {
  const base = `calendars/${auth!.currentUser!.uid}`;
  const category = action.includes("category");
  const type = category ? "categories" : "events";
  if (action.startsWith("save")) {
    const value = payload[category ? "category" : "event"] as Entry | Category;
    await setDoc(doc(db!, base + "/" + type, value.id), value);
  } else if (action.startsWith("delete"))
    await deleteDoc(doc(db!, base + "/" + type, payload.id as string));
}
