import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import useIsMobile from './hooks/useIsMobile';

// Admin Components
import Login from './components/Admin/Login';
import AdminDashboard from './components/Admin/AdminDashboard';

// Public User Auth Components
import UserSignup from './components/Auth/UserSignup';
import UserLogin from './components/Auth/UserLogin';
import EmailVerification from './components/Auth/EmailVerification';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

// Public Components
import PublicReportsViewer from './components/Public/PublicReportsViewer';
import PublicViewer from './components/Public/PublicViewer';
import TournamentDetail from './components/Public/TournamentDetail';
import TournamentsList from './components/Public/TournamentsList';

// PublicMobile Components (Public Viewer)
import {
  PublicMobileLayout,
  PublicMobileHome,
  PublicMobileTournaments,
  PublicMobileLeaderboard,
  PublicMobileProfile,
} from './components/PublicMobile';

import './App.css';

// Responsive Home Component - Auto-detects mobile/desktop
const ResponsiveHome = () => {
  const isMobile = useIsMobile();

  // Redirect mobile users to PublicMobile viewer
  if (isMobile) {
    return <Navigate to="/watch" replace />;
  }

  return (
    <div key="desktop-home" style={{ width: '100%', height: '100%' }}>
      <Navbar />
      <PublicViewer />
    </div>
  );
};

// Responsive Tournaments List - Dynamically switches mobile/desktop
const ResponsiveTournaments = () => {
  const isMobile = useIsMobile();

  // Redirect mobile users to PublicMobile tournaments
  if (isMobile) {
    return <Navigate to="/watch/tournaments" replace />;
  }

  return (
    <div key="desktop-tournaments" style={{ width: '100%', height: '100%' }}>
      <Navbar />
      <TournamentsList />
    </div>
  );
};

// Responsive Leaderboard - Dynamically switches mobile/desktop
const ResponsiveLeaderboard = () => {
  const isMobile = useIsMobile();

  // Redirect mobile users to PublicMobile leaderboard
  if (isMobile) {
    return <Navigate to="/watch/leaderboard" replace />;
  }

  // Desktop leaderboard (can be added later, for now redirect to home)
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <UserAuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Responsive Routes - Auto-detect Mobile/Desktop */}
            <Route path="/" element={<ResponsiveHome />} />
            <Route path="/tournaments" element={<ResponsiveTournaments />} />
            <Route path="/leaderboard" element={<ResponsiveLeaderboard />} />
            <Route path="/tournament/:id" element={<><Navbar /><TournamentDetail /></>} />

            {/* Public Mobile Routes (Public Viewer for Mobile) */}
            <Route path="/watch" element={<PublicMobileLayout />}>
              <Route index element={<PublicMobileHome />} />
              <Route path="tournaments" element={<PublicMobileTournaments />} />
              <Route path="leaderboard" element={<PublicMobileLeaderboard />} />
              <Route path="profile" element={<PublicMobileProfile />} />
            </Route>

            {/* Mobile Routes - Redirect to PublicMobile (watch) */}
            <Route path="/mobile" element={<Navigate to="/watch" replace />} />
            <Route path="/mobile/tournaments" element={<Navigate to="/watch/tournaments" replace />} />
            <Route path="/mobile/leaderboard" element={<Navigate to="/watch/leaderboard" replace />} />
            <Route path="/mobile/profile" element={<Navigate to="/watch/profile" replace />} />

            {/* Public User Auth Routes */}
            <Route path="/reports" element={<PublicReportsViewer />} />
            <Route path="/signup" element={<UserSignup />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/verify-email/:token" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
      </UserAuthProvider>
    </AuthProvider>
  );
}

export default App;
