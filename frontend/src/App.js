import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Admin Components
import Login from './components/Admin/Login';
import AdminDashboard from './components/Admin/AdminDashboard';

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
} from './components/Mobile';

import './App.css';
import './styles/mobileResponsive.css';
import './styles/indianTheme.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Mobile Routes */}
            <Route path="/mobile" element={<MobileLayout />}>
              <Route index element={<MobileHome />} />
              <Route path="tournaments" element={<MobileTournaments />} />
              <Route path="leaderboard" element={<MobileLeaderboard />} />
              <Route path="profile" element={<div style={{padding: '20px', textAlign: 'center', color: '#94a3b8'}}>Profile Coming Soon</div>} />
            </Route>

            {/* Public Routes with Navbar */}
            <Route path="/" element={<><Navbar /><PublicViewer /></>} />
            <Route path="/tournaments" element={<><Navbar /><TournamentsList /></>} />
            <Route path="/tournament/:id" element={<><Navbar /><TournamentDetail /></>} />

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
    </AuthProvider>
  );
}

export default App;
