import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Don't show navbar on admin login page
  if (location.pathname === '/admin/login') {
    return null;
  }

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        {/* Logo/Brand */}
        <Link to="/" style={styles.brand}>
          <span style={styles.brandIcon}>▲</span>
          <span style={styles.brandText}>Drone Arena</span>
        </Link>

        {/* Navigation Links */}
        <div style={styles.navLinks}>
          <Link
            to="/"
            style={{
              ...styles.navLink,
              ...(isActive('/') ? styles.navLinkActive : {})
            }}
          >
            Live Match
          </Link>

          <Link
            to="/tournaments"
            style={{
              ...styles.navLink,
              ...(isActive('/tournaments') || location.pathname.startsWith('/tournament/') ? styles.navLinkActive : {})
            }}
          >
            Tournaments
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/admin/dashboard"
                style={{
                  ...styles.navLink,
                  ...(isActive('/admin/dashboard') ? styles.navLinkActive : {})
                }}
              >
                Admin Dashboard
              </Link>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              style={styles.loginButton}
            >
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#1a1a1a',
    borderBottom: '2px solid #333',
    padding: '0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '70px'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    color: '#fff',
    fontSize: '24px',
    fontWeight: 'bold',
    transition: 'opacity 0.2s'
  },
  brandIcon: {
    fontSize: '32px'
  },
  brandText: {
    background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  navLink: {
    textDecoration: 'none',
    color: '#aaa',
    fontSize: '16px',
    fontWeight: '500',
    padding: '10px 20px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  navLinkActive: {
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)'
  },
  loginButton: {
    textDecoration: 'none',
    backgroundColor: '#2196F3',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    padding: '10px 24px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginLeft: '8px'
  },
  logoutButton: {
    backgroundColor: '#f44336',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    padding: '10px 24px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginLeft: '8px'
  }
};

export default Navbar;
