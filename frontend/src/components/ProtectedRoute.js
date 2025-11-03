import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const styles = {
  loading: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
};

export default ProtectedRoute;
