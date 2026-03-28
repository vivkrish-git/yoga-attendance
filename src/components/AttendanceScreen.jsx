import { useState } from 'react';
import Header from './common/Header';
import Toast from './common/Toast';
import SessionForm from './SessionForm';
import SessionList from './SessionList';
import AttendanceMarker from './AttendanceMarker';
import useMasterList from '../hooks/useMasterList';
import useSessions from '../hooks/useSessions';
import { createSession } from '../services/sessionService';

function AttendanceScreen() {
  const { names, lastRefreshedAt, loading: masterLoading, refreshing, refresh } = useMasterList();
  const { sessions, loading: sessionsLoading, reload: reloadSessions } = useSessions();

  const [view, setView] = useState('menu'); // 'menu' | 'new' | 'edit-list' | 'marking'
  const [activeSession, setActiveSession] = useState(null);
  const [toast, setToast] = useState(null);

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

  function handleBack() {
    if (view === 'marking') {
      setView('menu');
      setActiveSession(null);
      reloadSessions();
    } else {
      setView('menu');
    }
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
          ) : names.length === 0 ? (
            <div className="section">
              <p className="text-muted mb-1">No students loaded. Refresh the master list first.</p>
              <button className="btn btn-primary btn-small" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh Master List'}
              </button>
            </div>
          ) : (
            <AttendanceMarker
              session={activeSession}
              masterNames={names}
              onSaved={() => reloadSessions()}
            />
          )}
        </div>
      )}

      {/* Menu view */}
      {view === 'menu' && (
        <div>
          <div className="section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => setView('new')}>
              Create New Session
            </button>
            <button className="btn btn-secondary" onClick={() => setView('edit-list')}>
              Edit Past Session
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
