import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';

export const DEFAULT_SESSION_TYPES = ['Mihira Morning', 'Mihira Evening', 'Online'];

const CSV_URL = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL;
const DEFAULT_SESSIONS_REF = doc(db, 'config', 'defaultSessions');

// Fetch CSV from Google Sheets, parse all 3 columns, save to Firestore config/defaultSessions
export async function refreshDefaultSessions() {
  const response = await fetch(CSV_URL);
  const csvText = await response.text();

  // skipEmptyLines: false so we process all rows per-column and filter individually
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: false });

  const result = {};
  for (const sessionType of DEFAULT_SESSION_TYPES) {
    result[sessionType] = [
      ...new Set(
        parsed.data
          .map((row) => (row[sessionType] || '').trim())
          .filter((name) => name.length > 0)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }

  await setDoc(DEFAULT_SESSIONS_REF, {
    ...result,
    lastRefreshedAt: Timestamp.now(),
  });

  return { ...result, lastRefreshedAt: new Date() };
}

// Load cached default sessions from Firestore config/defaultSessions
export async function getDefaultSessions() {
  const snap = await getDoc(DEFAULT_SESSIONS_REF);
  if (!snap.exists()) {
    return {
      'Mihira Morning': [],
      'Mihira Evening': [],
      Online: [],
      lastRefreshedAt: null,
    };
  }
  const data = snap.data();
  return {
    'Mihira Morning': data['Mihira Morning'] || [],
    'Mihira Evening': data['Mihira Evening'] || [],
    Online: data['Online'] || [],
    lastRefreshedAt: data.lastRefreshedAt?.toDate() || null,
  };
}
