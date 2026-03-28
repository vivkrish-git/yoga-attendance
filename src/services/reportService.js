import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const SESSIONS_COL = collection(db, 'sessions');

// Get all sessions in a date range (for reports)
export async function getSessionsInRange(fromDate, toDate) {
  // fromDate and toDate are JS Date objects
  // Set toDate to end of day so it's inclusive
  const endOfDay = new Date(toDate);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    SESSIONS_COL,
    where('createdAt', '>=', Timestamp.fromDate(fromDate)),
    where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Get attendance report for a specific student in a date range
export async function getStudentReport(studentName, fromDate, toDate) {
  const sessions = await getSessionsInRange(fromDate, toDate);

  const totalSessions = sessions.length;
  let attendedCount = 0;

  const breakdown = sessions.map((session) => {
    const attended =
      session.attendees.includes(studentName) ||
      session.adHocAttendees.includes(studentName);
    if (attended) attendedCount++;

    return {
      sessionId: session.id,
      sessionName: session.sessionName,
      date: session.createdAt?.toDate() || null,
      attended,
    };
  });

  return {
    studentName,
    totalSessions,
    attendedCount,
    breakdown,
  };
}
