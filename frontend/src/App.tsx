import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ProfileProvider } from './context/ProfileContext';
import AnalysisPage from './pages/AnalysisPage';
import ReplayPage from './pages/ReplayPage';
import LearnPage from './pages/LearnPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <ProfileProvider>
    <div className="flex flex-col h-screen bg-base-100 text-base-content font-sans">
      <Navbar />
      <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/replay" replace />} />
          <Route path="/replay" element={<ReplayPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/replay" replace />} />
        </Routes>
      </div>
    </div>
    </ProfileProvider>
  );
}

export default App;
