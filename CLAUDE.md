# CLAUDE.md — Yoga Attendance Tracker

## Project Overview

A mobile-friendly web application for a yoga instructor to track student attendance across multiple daily sessions. The instructor opens the app on their phone, creates a session, marks who attended from a master student list, and saves. Later, they can review attendance by session or by student.

**Live URL:** https://yoga-attendance-2.web.app
**Future custom domain:** www.yogawithindhu.com (can be configured via Firebase Hosting)
**Expected scale:** < 100 students, a few sessions per day

---

## Tech Stack

| Layer        | Technology                     |
| ------------ | ------------------------------ |
| Frontend     | React 18+ with Vite            |
| UI Framework | CSS (mobile-first, responsive) |
| Database     | Firebase Cloud Firestore       |
| Hosting      | Firebase Hosting               |
| Master List  | Google Sheets (published CSV)  |

**No backend server.** The React app talks directly to Firestore using the Firebase JS SDK.

---

## Data Sources

### Student Master List (Read-Only, External)

- **Source:** Google Sheets, published as CSV
- **Published CSV URL:** Stored in `.env` as `VITE_GOOGLE_SHEET_CSV_URL`
- **Sheet name:** `Personal Health Status (Responses)`
- **Column to read:** `Name`
- The app fetches this CSV, parses it, and extracts only the `Name` column.
- The app caches the master list locally (in Firestore, under a `masterList` collection or document).
- Refresh is **manual only** — triggered by a "Refresh Master List" button in the UI.
- The app must store and display the **last refresh timestamp**.
- Names should be displayed in **alphabetical order** everywhere in the app.
- The app **never writes** to the Google Sheet.

---

## Firestore Data Model

### Collection: `sessions`

Each document represents one yoga session.

```
{
  sessionId: string (auto-generated Firestore doc ID),
  sessionName: string (e.g., "Apartment_7_to_8am"),
  description: string (optional, can be empty),
  comments: string (optional, can be empty — free-text notes about the session),
  createdAt: Firestore Timestamp (auto-captured when session is created),
  lastEditedAt: Firestore Timestamp (updated on every save/edit),
  attendees: string[] (array of student names who were marked present),
  adHocAttendees: string[] (array of names NOT in master list, added for this session only)
}
```

**Notes:**
- `attendees` contains names from the master list who were marked present.
- `adHocAttendees` contains names typed in manually for this session only. These names do NOT persist to the master list cache or appear in future sessions.
- `lastEditedAt` is set on creation and updated on every subsequent save.

### Collection: `config`

A single document `masterList` to cache the student names.

```
{
  names: string[] (alphabetically sorted),
  lastRefreshedAt: Firestore Timestamp
}
```

---

## Application Screens & Workflows

### Screen 1: Landing Page (`/`)

- Clean, simple layout.
- **Two large buttons**, stacked vertically, centered on screen:
  1. **"Take Attendance"** — navigates to the attendance screen
  2. **"View Reports"** — navigates to the reports screen
- App title/header at the top: "Yoga with Indhu" (or similar branding)

---

### Screen 2: Take Attendance (`/attendance`)

This screen handles both creating new sessions and editing past sessions.

#### Top Navigation Bar:
- Back button (← to landing page)
- Screen title: "Take Attendance"

#### Session Selection Area (top section):
- **"Create New Session" button** — opens an inline form or modal:
  - Text field: **Session Name** (required, e.g., "Apartment_7_to_8am")
  - Text field: **Description** (optional)
  - "Create" button → creates the session document in Firestore with current date/time, then loads the attendance marking view
- **"Edit Past Session" dropdown/list** — shows a scrollable list of past sessions ordered by `createdAt` descending (most recent first). Each item shows:
  - Session name
  - Date and time
  - Tap to open → loads that session's attendance for editing

#### Attendance Marking View (main area, shown after session is created/selected):
- **Session info bar** at top: session name, date/time, last edited time
- **Search box**: text input to filter the student list. Case-insensitive. Filters as the user types.
- **"Add Ad-hoc Attendee" button**: opens a small input to type a name not in the master list. That name appears in the list with a visual indicator (e.g., italic or a tag) showing it's ad-hoc. This name exists only for this session.
- **Student list**: full master list displayed as a scrollable list of checkboxes.
  - Each row: `[ ] Student Name`
  - Alphabetically sorted
  - Tap the checkbox or the name to toggle present/absent
  - **Default state: all unchecked (absent)**
  - If editing a past session, pre-check the students who were previously marked present
  - Ad-hoc attendees (if any) appear at the bottom of the list, visually distinguished
- **"Save" button** (prominent, at the bottom or floating):
  - Saves the attendance to Firestore (writes `attendees[]`, `adHocAttendees[]`, updates `lastEditedAt`)
  - Shows a success confirmation (e.g., toast message)
  - **No auto-save.** Only saves when this button is pressed. This is intentional to minimize server calls.
- **"Refresh Master List" button** (small, in a settings/utility area):
  - Fetches the CSV from the Google Sheet URL
  - Parses and extracts the `Name` column
  - Updates the Firestore `config/masterList` document
  - Updates the `lastRefreshedAt` timestamp
  - Displays: "Last refreshed: [date/time]"

---

### Screen 3: View Reports (`/reports`)

#### Top Navigation Bar:
- Back button (← to landing page)
- Screen title: "View Reports"

#### Two tabs or sub-sections:

##### Tab A: "By Session"
- Scrollable list of all past sessions, ordered by `createdAt` descending.
- Each item shows: session name, date, number of attendees (e.g., "15 attended").
- Tap a session → expands or navigates to a detail view:
  - Shows the **full master list** with present/absent indicators (✓ / ✗ or highlighted/greyed out)
  - Ad-hoc attendees shown separately at the bottom
  - Session metadata: name, description, created date/time, last edited date/time

##### Tab B: "By Student"
- **Student name selector**: dropdown or searchable field listing all students from the master list (alphabetical).
- **Date range picker**: "From" date and "To" date fields.
- **"Search" button** → queries Firestore for all sessions in the date range, checks which ones include this student.
- **Results display:**
  - **Summary count**: "Priya attended 18 out of 24 sessions"
  - **Date-wise breakdown**: a list showing each session in the range with date, session name, and present/absent status

---

## UI/UX Design Guidelines

### Mobile-First
- The primary use is on a **mobile phone**. Design for ~375px width first.
- All tap targets must be at least **44px × 44px** (thumb-friendly).
- Checkboxes and list items must have generous padding for easy tapping.
- The student list should be the main scrollable area — navigation stays fixed.

### Layout
- **No sidebar.** Navigation is at the top.
- Use a clean, minimal design. White background, clear typography.
- Color scheme: calming tones appropriate for a yoga app (soft greens, teals, or earth tones).

### Responsiveness
- Works on mobile (primary), tablet, and desktop.
- On larger screens, the layout can expand but should remain centered/readable (max-width container).

### Offline Consideration
- Not required for Phase 1. The app requires internet connectivity.

---

## Authentication

### Phase 1 (Current): No Authentication
- The app is open — anyone with the URL can access it.
- This is acceptable because the expected user base is just the instructor.

### Phase 2 (Future — do NOT implement now):
- Add Firebase Authentication (Google Sign-in).
- Protect all routes behind login.
- Only authorized email(s) can access the app.
- Placeholder comment in the code: `// TODO Phase 2: Add Firebase Auth`

---

## Firebase Configuration

### Firestore Security Rules (Phase 1)
Since there's no auth in Phase 1, rules allow open read/write:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> **Note:** This is intentionally open for Phase 1. Phase 2 will lock this down with auth rules.

### Firebase Hosting
- Single-page app (SPA) mode: all routes rewrite to `/index.html`.
- The `firebase.json` should include:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

---

## Project Structure

```
yoga-attendance-1/
├── CLAUDE.md                  # This file
├── README.md
├── package.json
├── vite.config.js
├── index.html
├── firebase.json              # Firebase hosting config
├── firestore.rules            # Firestore security rules
├── .firebaserc                # Firebase project alias
├── .env                       # Firebase config keys (not committed to git)
├── .env.example               # Template showing required env vars
├── .gitignore
├── public/
│   └── favicon.ico
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Router setup
│   ├── firebase.js            # Firebase initialization & config
│   ├── components/
│   │   ├── LandingPage.jsx
│   │   ├── AttendanceScreen.jsx
│   │   ├── SessionForm.jsx          # Create new session form
│   │   ├── SessionList.jsx          # List of past sessions (reused)
│   │   ├── AttendanceMarker.jsx     # Checkbox list + search + save
│   │   ├── ReportsScreen.jsx
│   │   ├── ReportBySession.jsx
│   │   ├── ReportByStudent.jsx
│   │   └── common/
│   │       ├── Header.jsx           # Top nav bar with back button
│   │       ├── SearchBox.jsx        # Reusable search/filter input
│   │       ├── StudentCheckbox.jsx  # Single student row with checkbox
│   │       └── Toast.jsx            # Success/error notification
│   ├── services/
│   │   ├── sessionService.js        # Firestore CRUD for sessions
│   │   ├── masterListService.js     # Fetch CSV + cache in Firestore
│   │   └── reportService.js         # Query logic for reports
│   ├── hooks/
│   │   ├── useMasterList.js         # Hook to load/refresh master list
│   │   └── useSessions.js           # Hook to load sessions
│   └── styles/
│       └── index.css                # Global styles (mobile-first)
```

---

## Key Implementation Details

### Fetching the Google Sheet CSV
```javascript
// Pseudocode — URL comes from environment variable
const CSV_URL = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL;

async function fetchMasterList() {
  const response = await fetch(CSV_URL);
  const csvText = await response.text();
  // Parse CSV, extract "Name" column, sort alphabetically
  // Save to Firestore config/masterList with timestamp
}
```

- Use a lightweight CSV parser (e.g., `papaparse` npm package).
- Handle edge cases: empty names, whitespace trimming, duplicate names.

### Firestore Queries for Reports
- **By Session:** `collection("sessions").orderBy("createdAt", "desc")`
- **By Student in date range:** `collection("sessions").where("createdAt", ">=", startDate).where("createdAt", "<=", endDate)` then filter client-side for the student name in `attendees` array.

### Save Behavior
- The "Save" button is the **only** trigger for writing to Firestore.
- On save, write: `attendees`, `adHocAttendees`, and update `lastEditedAt`.
- Show a toast/notification on success ("Attendance saved!") or error ("Failed to save. Please try again.").

---

## Development & Deployment Commands

```bash
# Install dependencies
npm install

# Run locally (development)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Firebase
firebase deploy
```

### Firebase CLI Setup (one-time)
```bash
npm install -g firebase-tools
firebase login
firebase init  # Select Hosting + Firestore
firebase deploy
```

---

## Environment Variables

The `.env` file should contain Firebase project configuration:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_SHEET_CSV_URL=
```

These values come from the Firebase Console → Project Settings → Your App → Config.

> **Important:** `.env` must be in `.gitignore`. Provide `.env.example` as a template.

---

## Constraints & Non-Goals

- **No authentication** in Phase 1.
- **No export** (CSV/Excel download) — not needed.
- **No offline mode** — internet required.
- **No push notifications.**
- **No payment/subscription tracking.**
- **No multi-language support.**
- **No student self-service** — only the instructor uses the app.
- **The app never writes to the Google Sheet.** It only reads from it.
- **Ad-hoc attendees are session-scoped** — they do not persist to the master list.

---

## Testing

- Use Firebase Emulators for local development to avoid hitting the live Firestore.
- Test on actual mobile devices (or Chrome DevTools mobile simulation) — this is the primary usage device.
- Verify: CSV fetch & parse, Firestore read/write, search filtering, checkbox state management, save/load round-trip.

---

## Current Implementation Status (Phase 1 — Complete)

- ✅ Landing page with "Take Attendance" and "View Reports"
- ✅ Create new session (name + description + comments)
- ✅ Mark attendance from master list (checkboxes, search, ad-hoc attendees)
- ✅ Manual save to Firestore
- ✅ Edit past sessions
- ✅ Google Sheets CSV fetch + Firestore cache with manual refresh
- ✅ Reports: By Session (expand to see full ✓/✗ list)
- ✅ Reports: By Student (name + date range → count + breakdown)
- ✅ Mobile-first responsive UI (teal/green theme)
- ✅ Deployed to Firebase Hosting

### Known Enhancements (Backlog)

- Unique session name constraint (prevent duplicate names — approach TBD)
- Firestore composite index for date-range queries (may be needed as data grows)

---

## Phase 2 Roadmap (Do NOT implement — for future reference only)

- Firebase Authentication (Google Sign-in, restrict access)
- Firestore security rules locked to authenticated users
- Student profile details (phone, email)
- Attendance export to CSV
- Dashboard with attendance trends/charts
- PWA support for add-to-home-screen
