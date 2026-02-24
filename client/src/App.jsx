import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import OfflineIndicator from './components/common/OfflineIndicator';
import LanguageOnboarding from './components/language/LanguageOnboarding';
import Home from './pages/Home';
import ChatPage from './pages/ChatPage';
import PredictionPage from './pages/PredictionPage';
import PrescriptionPage from './pages/PrescriptionPage';
import EmergencyPage from './pages/EmergencyPage';
import HospitalsPage from './pages/HospitalsPage';
import './App.css';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/predict" element={<PredictionPage />} />
            <Route path="/prescription" element={<PrescriptionPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/hospitals" element={<HospitalsPage />} />
          </Routes>
        </main>
      </div>
      <OfflineIndicator />
      <LanguageOnboarding />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppLayout />
      </LanguageProvider>
    </BrowserRouter>
  );
}
