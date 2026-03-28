import { useState } from 'react';
import useSessions from '../hooks/useSessions';
import useMasterList from '../hooks/useMasterList';

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

function ReportBySession() {
  const { sessions, loading } = useSessions();
  const { names: masterNames } = useMasterList();
  const [expandedId, setExpandedId] = useState(null);

  if (loading) return <p className="section text-muted">Loading sessions...</p>;
  if (sessions.length === 0) return <p className="section text-muted">No sessions found.</p>;

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      {sessions.map((s) => {
        const isExpanded = expandedId === s.id;
        const attendees = s.attendees || [];
        const adHoc = s.adHocAttendees || [];
        const totalPresent = attendees.length + adHoc.length;

        return (
          <div key={s.id}>
            <div className="session-item" onClick={() => toggleExpand(s.id)}>
              <div className="session-item-name">
                {isExpanded ? '▼' : '▶'} {s.sessionName}
              </div>
              <div className="session-item-meta">
                {formatDate(s.createdAt)} · {totalPresent} attended
              </div>
            </div>

            {isExpanded && (
              <div style={{ background: '#f9fffe', padding: '12px 16px' }}>
                {/* Session metadata */}
                {s.description && (
                  <p className="text-muted mb-1">Description: {s.description}</p>
                )}
                {s.comments && (
                  <p className="text-muted mb-1">Comments: {s.comments}</p>
                )}
                <p className="text-muted mb-1">
                  Last edited: {formatDate(s.lastEditedAt)}
                </p>
                <p className="text-muted mb-1" style={{ fontWeight: 600 }}>
                  {totalPresent} of {masterNames.length} students present
                </p>

                {/* Full master list with status */}
                <div style={{ marginTop: 8 }}>
                  {masterNames.map((name) => {
                    const present = attendees.includes(name);
                    return (
                      <div
                        key={name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 0',
                          borderBottom: '1px solid #f0f0f0',
                          opacity: present ? 1 : 0.5,
                        }}
                      >
                        <span className={`attendance-status ${present ? 'status-present' : 'status-absent'}`}>
                          {present ? '✓' : '✗'}
                        </span>
                        <span style={{ fontSize: '0.95rem' }}>{name}</span>
                      </div>
                    );
                  })}

                  {/* Ad-hoc attendees */}
                  {adHoc.length > 0 && (
                    <>
                      <p
                        className="text-muted"
                        style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 12, marginBottom: 4 }}
                      >
                        AD-HOC ATTENDEES
                      </p>
                      {adHoc.map((name) => (
                        <div
                          key={`adhoc-${name}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 0',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                        >
                          <span className="attendance-status status-present">✓</span>
                          <span style={{ fontSize: '0.95rem', fontStyle: 'italic' }}>{name}</span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              background: '#ffeaa7',
                              color: '#6c5200',
                              padding: '2px 8px',
                              borderRadius: 10,
                            }}
                          >
                            ad-hoc
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ReportBySession;
