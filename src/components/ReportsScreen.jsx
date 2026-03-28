import { useState } from 'react';
import Header from './common/Header';
import ReportBySession from './ReportBySession';
import ReportByStudent from './ReportByStudent';

function ReportsScreen() {
  const [activeTab, setActiveTab] = useState('session');

  return (
    <div className="app-container">
      <Header title="View Reports" />

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          By Session
        </button>
        <button
          className={`tab ${activeTab === 'student' ? 'active' : ''}`}
          onClick={() => setActiveTab('student')}
        >
          By Student
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'session' && <ReportBySession />}
      {activeTab === 'student' && <ReportByStudent />}
    </div>
  );
}

export default ReportsScreen;
