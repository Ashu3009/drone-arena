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

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicViewer />} />
            <Route path="/tournaments" element={<TournamentsList />} />
            <Route path="/tournament/:id" element={<TournamentDetail />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Redirect unknown routes to public viewer */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
