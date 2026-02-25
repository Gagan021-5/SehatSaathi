import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import DiabetesPage from './pages/DiabetesPage';
import ChatPage from './pages/ChatPage';
import PredictionPage from './pages/PredictionPage';
import PrescriptionPage from './pages/PrescriptionPage';
import HealthRecordsPage from './pages/HealthRecordsPage';
import EmergencyPage from './pages/EmergencyPage';
import HospitalsPage from './pages/HospitalsPage';
import ProfilePage from './pages/ProfilePage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import './App.css';

function ProtectedRoute({ children }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading SehatSaathi...</p>
      </div>
    </div>
  );
  return firebaseUser ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return null;
  return firebaseUser ? <Navigate to="/" /> : children;
}

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
            <Route path="/diabetes" element={<DiabetesPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/predict" element={<PredictionPage />} />
            <Route path="/prescription" element={<PrescriptionPage />} />
            <Route path="/health" element={<HealthRecordsPage />} />
            <Route path="/hospitals" element={<HospitalsPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
