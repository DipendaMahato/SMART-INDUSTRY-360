/**
 * src/services/firebase.ts
 *
 * Firebase Realtime Database client for Smart Industry 360 frontend.
 * Project: smart-industry-90b78  |  DB: asia-southeast1
 *
 * Exports:
 *   writeData(path, value)      – set / overwrite a node
 *   pushData(path, value)       – push a new child and return the key
 *   subscribe(path, cb)         – real-time listener; returns unsubscribe fn
 *   getOnce(path)               – read a path once (Promise)
 *   removeData(path)            – delete a node
 *   db                          – raw Firebase Database instance
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  push,
  get,
  remove,
  onValue,
  type DataSnapshot,
  type Unsubscribe,
} from "firebase/database";

// ── Firebase project configuration ──────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyArhBYR_W_4ecN_USTcGMnrjnaDKgxI0IU",
  authDomain:        "smart-industry-90b78.firebaseapp.com",
  databaseURL:       "https://smart-industry-90b78-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "smart-industry-90b78",
  storageBucket:     "smart-industry-90b78.firebasestorage.app",
  messagingSenderId: "15277675949",
  appId:             "1:15277675949:web:2275dd30d498a68c73bd24",
  measurementId:     "G-MPJ414FPGC",
};

// Guard: only call initializeApp once (important during React hot-reloads)
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

/** Raw Firebase Database instance — export for advanced use-cases. */
export const db = getDatabase(app);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Write (set/overwrite) a value at `path`.
 * Example: writeData("live_telemetry/DEV-ENV-01", { metric_value: 24.5 })
 */
export const writeData = async (path: string, value: unknown): Promise<void> => {
  await set(ref(db, path), value);
};

/**
 * Push a new child under a list path.
 * Returns the Firebase-generated push key.
 * Example: pushData("incidents", { title: "Gas leak", severity: "CRITICAL" })
 */
export const pushData = async (path: string, value: unknown): Promise<string> => {
  const newRef = await push(ref(db, path), value);
  return newRef.key as string;
};

/**
 * Subscribe to real-time updates at `path`.
 * `callback` is called immediately with the current value and on every change.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 *
 * Example:
 *   const unsub = subscribe("live_telemetry/DEV-ENV-01", (data) => setTemp(data?.metric_value));
 *   return () => unsub();
 */
export const subscribe = (
  path: string,
  callback: (data: unknown) => void
): Unsubscribe => {
  const reference = ref(db, path);
  const unsubscribe: Unsubscribe = onValue(reference, (snapshot: DataSnapshot) => {
    callback(snapshot.val());
  });
  return unsubscribe;
};

/**
 * Read the value at `path` once (no ongoing listener).
 * Returns null if the node does not exist.
 *
 * Example:
 *   const plant = await getOnce("plants/1");
 */
export const getOnce = async <T = unknown>(path: string): Promise<T | null> => {
  const snapshot = await get(ref(db, path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
};

/**
 * Delete the node at `path`.
 * Example: removeData("incidents/INC-20261028-0001")
 */
export const removeData = async (path: string): Promise<void> => {
  await remove(ref(db, path));
};
