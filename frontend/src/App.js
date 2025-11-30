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
import PublicViewer from './components/Public/PublicViewer';
import TournamentDetail from './components/Public/TournamentDetail';
import TournamentsList from './components/Public/TournamentsList';

// Mobile Components
import {
  MobileLayout,
  MobileHome,
  MobileLeaderboard,
  MobileTournaments,
  MobileProfile,
} from './components/Mobile';

import './App.css';
import './styles/mobileResponsive.css';
import './styles/indianTheme.css';

// Responsive Home Component - Auto-detects mobile/desktop
const ResponsiveHome = () => {
  const isMobile = useIsMobile();

  // Render mobile view with layout (header + bottom nav)
  if (isMobile) {
    return (
      <MobileLayout key="mobile-home">
        <MobileHome />
      </MobileLayout>
    );
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

  // Pure responsive rendering (no redirect)
  if (isMobile) {
    return (
      <MobileLayout key="mobile-tournaments">
        <MobileTournaments />
      </MobileLayout>
    );
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

  if (isMobile) {
    return (
      <MobileLayout key="mobile-leaderboard">
        <MobileLeaderboard />
      </MobileLayout>
    );
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

            {/* Mobile Routes (for testing/force mobile view) */}
            <Route path="/mobile" element={<MobileLayout />}>
              <Route index element={<MobileHome />} />
              <Route path="tournaments" element={<MobileTournaments />} />
              <Route path="leaderboard" element={<MobileLeaderboard />} />
              <Route path="profile" element={<MobileProfile />} />
            </Route>

            {/* Public User Auth Routes */}
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
