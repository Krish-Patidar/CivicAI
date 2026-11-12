import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackComplaint from './pages/TrackComplaint';
import DepartmentDashboard from './pages/DepartmentDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import CMDashboard from './pages/CMDashboard';
import CreditsPage from './pages/CreditsPage';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0b0f1a]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', fontFamily: 'Outfit, sans-serif' } }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />

          <Route path="/dashboard" element={<ProtectedRoute roles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/submit-complaint" element={<ProtectedRoute roles={['citizen']}><SubmitComplaint /></ProtectedRoute>} />
          <Route path="/track/:id?" element={<ProtectedRoute roles={['citizen']}><TrackComplaint /></ProtectedRoute>} />
          <Route path="/credits" element={<ProtectedRoute roles={['citizen']}><CreditsPage /></ProtectedRoute>} />

          <Route path="/department" element={<ProtectedRoute roles={['department_admin']}><DepartmentDashboard /></ProtectedRoute>} />
          <Route path="/worker" element={<ProtectedRoute roles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
          <Route path="/cm" element={<ProtectedRoute roles={['cm_admin']}><CMDashboard /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
