import { useState } from 'react';
import useMasterList from '../hooks/useMasterList';
import { getStudentReport } from '../services/reportService';

function formatDateShort(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReportByStudent() {
  const { names } = useMasterList();
  const [selectedName, setSelectedName] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!selectedName || !fromDate || !toDate) return;
    setLoading(true);
    setSearched(true);
    try {
      const result = await getStudentReport(
        selectedName,
        new Date(fromDate),
        new Date(toDate)
      );
      setReport(result);
    } catch (err) {
      console.error('Report query failed:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section">
      {/* Student selector */}
      <div className="form-group">
        <label>Student Name</label>
        <select
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
          style={{
            padding: '10px 14px',
            fontSize: '1rem',
            border: '2px solid #dfe6e9',
            borderRadius: 8,
            background: '#fff',
          }}
        >
          <option value="">-- Select a student --</option>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Search button */}
      <button
        className="btn btn-primary"
        onClick={handleSearch}
        disabled={!selectedName || !fromDate || !toDate || loading}
        style={{ width: '100%' }}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      {/* Results */}
      {searched && !loading && report && (
        <div className="mt-2">
          {/* Summary */}
          <div
            style={{
              background: '#e8f5f1',
              padding: 14,
              borderRadius: 8,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {report.studentName} attended{' '}
              <span style={{ color: '#2d8f7b', fontSize: '1.3rem' }}>
                {report.attendedCount}
              </span>{' '}
              out of{' '}
              <span style={{ fontSize: '1.3rem' }}>{report.totalSessions}</span>{' '}
              sessions
            </p>
          </div>

          {/* Breakdown */}
          {report.totalSessions === 0 ? (
            <p className="text-muted text-center">No sessions found in this date range.</p>
          ) : (
            <div>
              <p className="text-muted mb-1" style={{ fontWeight: 600 }}>
                Date-wise breakdown:
              </p>
              {report.breakdown.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: '1px solid #f0f0f0',
                    opacity: item.attended ? 1 : 0.5,
                  }}
                >
                  <span
                    className={`attendance-status ${
                      item.attended ? 'status-present' : 'status-absent'
                    }`}
                  >
                    {item.attended ? '✓' : '✗'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                      {item.sessionName}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {formatDateShort(item.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportByStudent;
