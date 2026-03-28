import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';

const CSV_URL = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL;

const MASTER_LIST_REF = doc(db, 'config', 'masterList');

// Fetch CSV from Google Sheets, parse Name column, save to Firestore
export async function refreshMasterList() {
  const response = await fetch(CSV_URL);
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  // Extract Name column, trim whitespace, remove blanks, deduplicate, sort
  const names = [
    ...new Set(
      parsed.data
        .map((row) => (row['Name'] || '').trim())
        .filter((name) => name.length > 0)
    ),
  ].sort((a, b) => a.localeCompare(b));

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
