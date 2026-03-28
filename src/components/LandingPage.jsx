import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="landing">
        <div>
          <h1 className="landing-title">Yoga with Indhu</h1>
          <p className="landing-subtitle">Attendance Tracker</p>
        </div>
        <div className="landing-buttons">
          <button
            className="btn-landing btn-attendance"
            onClick={() => navigate('/attendance')}
          >
            Take Attendance
          </button>
          <button
            className="btn-landing btn-reports"
            onClick={() => navigate('/reports')}
          >
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
