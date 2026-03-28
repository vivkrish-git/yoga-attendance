import { useState, useMemo } from 'react';
import SearchBox from './common/SearchBox';
import StudentCheckbox from './common/StudentCheckbox';
import Toast from './common/Toast';
import { saveAttendance } from '../services/sessionService';

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AttendanceMarker({ session, masterNames, onSaved }) {
  // Checked state: set of names marked present
  const [checked, setChecked] = useState(() => {
    const set = new Set();
    (session.attendees || []).forEach((n) => set.add(n));
    (session.adHocAttendees || []).forEach((n) => set.add(n));
    return set;
  });

  const [adHocNames, setAdHocNames] = useState(session.adHocAttendees || []);
  const [adHocInput, setAdHocInput] = useState('');
  const [showAdHocInput, setShowAdHocInput] = useState(false);
  const [comments, setComments] = useState(session.comments || '');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Filter master list by search
  const filteredNames = useMemo(() => {
    if (!search.trim()) return masterNames;
    const q = search.toLowerCase();
    return masterNames.filter((n) => n.toLowerCase().includes(q));
  }, [masterNames, search]);

  // Filter ad-hoc names by search
  const filteredAdHoc = useMemo(() => {
    if (!search.trim()) return adHocNames;
    const q = search.toLowerCase();
    return adHocNames.filter((n) => n.toLowerCase().includes(q));
  }, [adHocNames, search]);

  function toggleName(name) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function addAdHoc() {
    const name = adHocInput.trim();
    if (!name) return;
    // Don't add if already in master list or ad-hoc list
    if (masterNames.includes(name) || adHocNames.includes(name)) {
      setToast({ message: 'Name already exists!', type: 'error' });
      setAdHocInput('');
      return;
    }
    setAdHocNames((prev) => [...prev, name]);
    setChecked((prev) => new Set(prev).add(name));
    setAdHocInput('');
    setShowAdHocInput(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const attendees = masterNames.filter((n) => checked.has(n));
      const adHoc = adHocNames.filter((n) => checked.has(n));
      await saveAttendance(session.id, attendees, adHoc, comments);
      setToast({ message: 'Attendance saved!', type: 'success' });
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Save failed:', err);
      setToast({ message: 'Failed to save. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const presentCount = checked.size;

  return (
    <div>
      {/* Session info bar */}
      <div className="info-bar">
        <strong>{session.sessionName}</strong>
        <span>Created: {formatDate(session.createdAt)}</span>
        {session.lastEditedAt && (
          <span>Last edited: {formatDate(session.lastEditedAt)}</span>
        )}
        <span className="mt-1">{presentCount} marked present</span>
      </div>

      {/* Comments */}
      <div className="section">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Comments (optional)</label>
          <textarea
            rows="2"
            placeholder="Any notes about this session..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>
      </div>

      {/* Search + Ad-hoc */}
      <div className="section" style={{ paddingBottom: 8 }}>
        <SearchBox value={search} onChange={setSearch} />
        <div className="mt-1">
          {showAdHocInput ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                className="search-box"
                type="text"
                placeholder="Enter name..."
                value={adHocInput}
                onChange={(e) => setAdHocInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAdHoc()}
                autoFocus
              />
              <button className="btn btn-primary btn-small" onClick={addAdHoc}>
                Add
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowAdHocInput(false);
                  setAdHocInput('');
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary btn-small mt-1"
              onClick={() => setShowAdHocInput(true)}
            >
              + Ad-hoc Attendee
            </button>
          )}
        </div>
      </div>

      {/* Student list */}
      <div>
        {filteredNames.map((name) => (
          <StudentCheckbox
            key={name}
            name={name}
            checked={checked.has(name)}
            onChange={() => toggleName(name)}
          />
        ))}

        {/* Ad-hoc attendees at bottom */}
        {filteredAdHoc.length > 0 && (
          <>
            <div
              className="section text-muted"
              style={{ paddingBottom: 4, paddingTop: 12, fontSize: '0.8rem', fontWeight: 600 }}
            >
              AD-HOC ATTENDEES
            </div>
            {filteredAdHoc.map((name) => (
              <StudentCheckbox
                key={`adhoc-${name}`}
                name={name}
                checked={checked.has(name)}
                onChange={() => toggleName(name)}
                isAdHoc
              />
            ))}
          </>
        )}
      </div>

      {/* Floating save */}
      <div className="floating-save">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default AttendanceMarker;
