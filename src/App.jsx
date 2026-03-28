import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AttendanceScreen from './components/AttendanceScreen';
import ReportsScreen from './components/ReportsScreen';

// TODO Phase 2: Add Firebase Auth and protect routes

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/attendance" element={<AttendanceScreen />} />
        <Route path="/reports" element={<ReportsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
