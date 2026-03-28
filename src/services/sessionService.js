import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const SESSIONS_COL = collection(db, 'sessions');

// Create a new session, returns the doc ID
export async function createSession(sessionName, description = '', comments = '') {
  const now = Timestamp.now();
  const docRef = await addDoc(SESSIONS_COL, {
    sessionName,
    description,
    comments,
    createdAt: now,
    lastEditedAt: now,
    attendees: [],
    adHocAttendees: [],
  });
  return docRef.id;
}

// Save attendance for a session
export async function saveAttendance(sessionId, attendees, adHocAttendees, comments = '') {
  const docRef = doc(db, 'sessions', sessionId);
  await updateDoc(docRef, {
    attendees,
    adHocAttendees,
    comments,
    lastEditedAt: Timestamp.now(),
  });
}

// Get a single session by ID
export async function getSession(sessionId) {
  const snap = await getDoc(doc(db, 'sessions', sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Get all sessions, most recent first
export async function getAllSessions() {
  const q = query(SESSIONS_COL, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
