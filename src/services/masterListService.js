import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';

const CSV_URL = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL;

// Columns to read from the sheet — all names across these columns form the master list
const SESSION_COLUMNS = ['Mihira Morning', 'Mihira Evening', 'Online'];

const MASTER_LIST_REF = doc(db, 'config', 'masterList');

// Fetch CSV from Google Sheets, combine all session columns into one master list
export async function refreshMasterList() {
  const response = await fetch(CSV_URL);
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: false });

  // Collect all names from all 3 columns, deduplicate, sort alphabetically
  const allNames = parsed.data.flatMap((row) =>
    SESSION_COLUMNS.map((col) => (row[col] || '').trim()).filter((n) => n.length > 0)
  );

  const names = [...new Set(allNames)].sort((a, b) => a.localeCompare(b));

  await setDoc(MASTER_LIST_REF, {
    names,
    lastRefreshedAt: Timestamp.now(),
  });

  return { names, lastRefreshedAt: new Date() };
}

// Load cached master list from Firestore
export async function getMasterList() {
  const snap = await getDoc(MASTER_LIST_REF);
  if (!snap.exists()) {
    return { names: [], lastRefreshedAt: null };
  }
  const data = snap.data();
  return {
    names: data.names || [],
    lastRefreshedAt: data.lastRefreshedAt?.toDate() || null,
  };
}
