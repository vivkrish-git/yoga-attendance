import { useState } from 'react';
import Header from './common/Header';
import Toast from './common/Toast';
import SessionForm from './SessionForm';
import SessionList from './SessionList';
import AttendanceMarker from './AttendanceMarker';
import useMasterList from '../hooks/useMasterList';
import useSessions from '../hooks/useSessions';
import { createSession, deleteSessions } from '../services/sessionService';
import { DEFAULT_SESSION_TYPES, getDefaultSessions } from '../services/defaultSessionsService';

// Format today's date in IST as DD-MON-YYYY (e.g. 11-APR-2026)
function getTodayIST() {
  const now = new Date();
  const day = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit' });
  const month = now
    .toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' })
    .toUpperCase();
  const year = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric' });
  return `${day}-${month}-${year}`;
}

function AttendanceScreen() {
  const { names, lastRefreshedAt, loading: masterLoading, refreshing, refresh } = useMasterList();
  const { sessions, loading: sessionsLoading, reload: reloadSessions } = useSessions();

  const [view, setView] = useState('menu'); // 'menu' | 'new' | 'edit-list' | 'marking'
  const [activeSession, setActiveSession] = useState(null);
  const [toast, setToast] = useState(null);

  // Override masterNames used in marking view for default sessions (column-specific names)
  const [overrideMasterNames, setOverrideMasterNames] = useState(null);

  // Tracks which default session button is currently loading (null if none)
  const [defaultSessionLoading, setDefaultSessionLoading] = useState(null);

  // Duplicate session warning state: { sessionType, sessionName, existingSession } | null
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Delete view state
  const [deleteSelected, setDeleteSelected] = useState(new Set()); // selected session IDs
  const [deleteConfirm, setDeleteConfirm] = useState(false);       // show confirmation prompt
  const [deleting, setDeleting] = useState(false);

  async function handleCreate(sessionName, description) {
    try {
      const id = await createSession(sessionName, description);
      const newSession = {
        id,
        sessionName,
        description,
        comments: '',
        createdAt: { toDate: () => new Date() },
        lastEditedAt: { toDate: () => new Date() },
        attendees: [],
        adHocAttendees: [],
      };
      setActiveSession(newSession);
      setView('marking');
      reloadSessions();
    } catch (err) {
      console.error('Failed to create session:', err);
      setToast({ message: 'Failed to create session.', type: 'error' });
    }
  }

  async function handleCreateDefault(sessionType) {
    setDefaultSessionLoading(sessionType);
    try {
      const sessionName = `${sessionType}-${getTodayIST()}`;

      // Duplicate check against already-loaded sessions list
      const existing = sessions.find((s) => s.sessionName === sessionName);
      if (existing) {
        setDuplicateWarning({ sessionType, sessionName, existingSession: existing });
        return;
      }

      await doCreateDefaultSession(sessionType, sessionName);
    } catch (err) {
      console.error('Failed to create default session:', err);
      setToast({ message: 'Failed to create session.', type: 'error' });
    } finally {
      setDefaultSessionLoading(null);
    }
  }

  async function doCreateDefaultSession(sessionType, sessionName) {
    const cached = await getDefaultSessions();
    const columnNames = cached[sessionType] ?? [];

    if (columnNames.length === 0) {
      setToast({
        message: 'No names loaded for this session. Please refresh the master list first.',
        type: 'error',
      });
      return;
    }

    const id = await createSession(sessionName, '');
    setOverrideMasterNames(columnNames);
    setActiveSession({
      id,
      sessionName,
      description: '',
      comments: '',
      createdAt: { toDate: () => new Date() },
      lastEditedAt: { toDate: () => new Date() },
      attendees: [],
      adHocAttendees: [],
    });
    setView('marking');
    reloadSessions();
  }

  async function handleOpenExisting() {
    const { sessionType, existingSession } = duplicateWarning;
    try {
      const cached = await getDefaultSessions();
      setOverrideMasterNames(cached[sessionType] ?? []);
      setDuplicateWarning(null);
      handleSelectSession(existingSession);
    } catch (err) {
      console.error('Failed to open existing session:', err);
      setToast({ message: 'Failed to open session.', type: 'error' });
    }
  }

  function handleSelectSession(session) {
    setActiveSession(session);
    setView('marking');
  }

  async function handleRefresh() {
    const result = await refresh();
    if (result.success) {
      setToast({ message: 'Master list refreshed!', type: 'success' });
    } else {
      setToast({ message: 'Failed to refresh list.', type: 'error' });
    }
  }

  function toggleDeleteSelect(id) {
    setDeleteSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDeleteConfirmed() {
    setDeleting(true);
    try {
      await deleteSessions([...deleteSelected]);
      setToast({ message: `${deleteSelected.size} session(s) deleted.`, type: 'success' });
      setDeleteSelected(new Set());
      setDeleteConfirm(false);
      setView('menu');
      reloadSessions();
    } catch (err) {
      console.error('Failed to delete sessions:', err);
      setToast({ message: 'Failed to delete sessions.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  function handleBack() {
    if (view === 'marking') {
      setView('menu');
      setActiveSession(null);
      setOverrideMasterNames(null);
      reloadSessions();
    } else if (view === 'delete-list') {
      setDeleteSelected(new Set());
      setDeleteConfirm(false);
      setView('menu');
    } else {
      setView('menu');
    }
    setDuplicateWarning(null);
  }

  return (
    <div className="app-container">
      <Header title="Take Attendance" />

      {/* Marking view */}
      {view === 'marking' && activeSession && (
        <div>
          <div className="section" style={{ paddingBottom: 0 }}>
            <button className="btn btn-secondary btn-small" onClick={handleBack}>
              ← Back to menu
            </button>
          </div>
          {masterLoading ? (
            <p className="section text-muted">Loading student list...</p>
          ) : (overrideMasterNames ?? names).length === 0 ? (
            <div className="section">
              <p className="text-muted mb-1">No students loaded. Refresh the master list first.</p>
              <button className="btn btn-primary btn-small" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh Master List'}
              </button>
            </div>
          ) : (
            <AttendanceMarker
              session={activeSession}
              masterNames={overrideMasterNames ?? names}
              onSaved={() => reloadSessions()}
            />
          )}
        </div>
      )}

      {/* Menu view */}
      {view === 'menu' && (
        <div>
          {/* Duplicate session warning */}
          {duplicateWarning && (
            <div
              className="section"
              style={{
                background: '#fff8e1',
                border: '1px solid #f9a825',
                borderRadius: 8,
                marginBottom: 4,
              }}
            >
              <p style={{ fontWeight: 600, color: '#e65100', marginBottom: 6 }}>
                ⚠️ Session already exists
              </p>
              <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>
                <strong>"{duplicateWarning.sessionName}"</strong> was already created today.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-small" onClick={handleOpenExisting}>
                  Open Existing
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setDuplicateWarning(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Default sessions group */}
            <div
              style={{
                border: '1.5px solid #b2dfdb',
                borderRadius: 8,
                padding: 14,
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  color: '#00796b',
                  marginBottom: 10,
                  fontSize: 14,
                  letterSpacing: 0.3,
                }}
              >
                Create Default Session
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DEFAULT_SESSION_TYPES.map((type) => (
                  <button
                    key={type}
                    className="btn btn-primary btn-small"
                    onClick={() => handleCreateDefault(type)}
                    disabled={defaultSessionLoading !== null || refreshing}
                  >
                    {defaultSessionLoading === type ? 'Creating...' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom session */}
            <button className="btn btn-secondary" onClick={() => setView('new')}>
              Create Session
            </button>
            <button className="btn btn-secondary" onClick={() => setView('edit-list')}>
              Edit Session
            </button>
            <button className="btn btn-secondary" onClick={() => setView('delete-list')}>
              Delete Session
            </button>
          </div>

          {/* Refresh master list */}
          <div className="section" style={{ borderTop: '1px solid #dfe6e9', paddingTop: 16 }}>
            <button
              className="btn btn-secondary btn-small"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Master List'}
            </button>
            <p className="text-muted mt-1">
              {lastRefreshedAt
                ? `Last refreshed: ${lastRefreshedAt.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Never refreshed'}
            </p>
            <p className="text-muted">{names.length} students loaded</p>
          </div>
        </div>
      )}

      {/* New session form */}
      {view === 'new' && (
        <div>
          <div className="section" style={{ paddingBottom: 0 }}>
            <button className="btn btn-secondary btn-small" onClick={() => setView('menu')}>
              ← Back
            </button>
          </div>
          <SessionForm onCreate={handleCreate} />
        </div>
      )}

      {/* Edit past session list */}
      {view === 'edit-list' && (
        <div>
          <div className="section" style={{ paddingBottom: 0 }}>
            <button className="btn btn-secondary btn-small" onClick={() => setView('menu')}>
              ← Back
            </button>
          </div>
          <div className="section" style={{ paddingBottom: 4 }}>
            <p className="text-muted" style={{ fontWeight: 600 }}>Select a session to edit:</p>
          </div>
          <SessionList
            sessions={sessions}
            onSelect={handleSelectSession}
            loading={sessionsLoading}
          />
        </div>
      )}

      {/* Delete session view */}
      {view === 'delete-list' && (
        <div>
          <div className="section" style={{ paddingBottom: 0 }}>
            <button className="btn btn-secondary btn-small" onClick={handleBack}>
              ← Back
            </button>
          </div>

          {/* Confirmation prompt */}
          {deleteConfirm && (
            <div
              className="section"
              style={{
                background: '#fff8e1',
                border: '1px solid #f9a825',
                borderRadius: 8,
                marginBottom: 4,
              }}
            >
              <p style={{ fontWeight: 600, color: '#e65100', marginBottom: 6 }}>
                ⚠️ Confirm Deletion
              </p>
              <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>
                Are you sure you want to delete{' '}
                <strong>{deleteSelected.size} session(s)</strong>? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-small"
                  onClick={handleDeleteConfirmed}
                  disabled={deleting}
                  style={{ background: '#c0392b', borderColor: '#c0392b' }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="section" style={{ paddingBottom: 4 }}>
            <p className="text-muted" style={{ fontWeight: 600 }}>
              Select sessions to delete:
            </p>
          </div>

          {sessionsLoading ? (
            <p className="section text-muted">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="section text-muted">No sessions found.</p>
          ) : (
            <div>
              {sessions.map((s) => {
                const date = s.createdAt?.toDate
                  ? s.createdAt.toDate().toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '';
                const checked = deleteSelected.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleDeleteSelect(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      background: checked ? '#fff3f3' : 'white',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDeleteSelect(s.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: 20, height: 20, accentColor: '#c0392b', flexShrink: 0 }}
                    />
                    <div>
                      <p style={{ fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>
                        {s.sessionName}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>{date}</p>
                    </div>
                  </div>
                );
              })}

              {/* Delete button — fixed at bottom */}
              <div className="section" style={{ paddingTop: 16 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setDeleteConfirm(true)}
                  disabled={deleteSelected.size === 0}
                  style={{
                    background: deleteSelected.size > 0 ? '#c0392b' : undefined,
                    borderColor: deleteSelected.size > 0 ? '#c0392b' : undefined,
                  }}
                >
                  {deleteSelected.size > 0
                    ? `Delete ${deleteSelected.size} Session(s)`
                    : 'Select sessions to delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

export default AttendanceScreen;
