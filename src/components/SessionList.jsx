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

function SessionList({ sessions, onSelect, loading }) {
  if (loading) return <p className="section text-muted">Loading sessions...</p>;
  if (sessions.length === 0) return <p className="section text-muted">No past sessions found.</p>;

  return (
    <div>
      {sessions.map((s) => (
        <div key={s.id} className="session-item" onClick={() => onSelect(s)}>
          <div className="session-item-name">{s.sessionName}</div>
          <div className="session-item-meta">
            {formatDate(s.createdAt)} · {(s.attendees?.length || 0) + (s.adHocAttendees?.length || 0)} attended
          </div>
        </div>
      ))}
    </div>
  );
}

export default SessionList;
