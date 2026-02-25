import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import LanguageOnboarding from './components/language/LanguageOnboarding';

const Home = lazy(() => import('./pages/Home'));
const DiabetesPage = lazy(() => import('./pages/DiabetesPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const PrescriptionPage = lazy(() => import('./pages/PrescriptionPage'));
const HealthRecordsPage = lazy(() => import('./pages/HealthRecordsPage'));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage'));
const HospitalsPage = lazy(() => import('./pages/HospitalsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FirstAidPage = lazy(() => import('./pages/FirstAid'));
const MedicinesPage = lazy(() => import('./pages/Medicines'));
const ReportsPage = lazy(() => import('./pages/Reports'));
const FamilyVaultPage = lazy(() => import('./pages/FamilyVault'));
const HealthToolsPage = lazy(() => import('./pages/HealthTools'));

function RouteLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-white/50 p-8 backdrop-blur-md ring-1 ring-slate-200/50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Syncing Workspace...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
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
    <div className="relative flex h-screen w-full overflow-hidden bg-[#fcfdfe]">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-teal-400/10 blur-[120px]" />

      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container Area */}
      <div className="relative flex flex-1 flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/diabetes" element={<DiabetesPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/prescription" element={<PrescriptionPage />} />
                <Route path="/health" element={<HealthRecordsPage />} />
                <Route path="/hospitals" element={<HospitalsPage />} />
                <Route path="/emergency" element={<EmergencyPage />} />
                <Route path="/first-aid" element={<FirstAidPage />} />
                <Route path="/medicines" element={<MedicinesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/family-vault" element={<FamilyVaultPage />} />
                <Route path="/health-tools" element={<HealthToolsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
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
          <LanguageOnboarding />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'premium-toast',
              style: {
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.1)',
                color: '#0f172a',
                padding: '16px 24px',
              },
            }}
          />
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