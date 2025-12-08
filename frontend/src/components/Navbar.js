import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    setMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Don't show navbar on admin login page
  if (location.pathname === '/admin/login') {
    return null;
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo/Brand */}
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <img src={logo} alt="DroneNova Logo" className="brand-icon" />
            <span className="brand-text">DroneNova</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nav-links-desktop">
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
            >
              Live Match
            </Link>

            <Link
              to="/tournaments"
              className={`nav-link ${isActive('/tournaments') || location.pathname.startsWith('/tournament/') ? 'nav-link-active' : ''}`}
            >
              Tournaments
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`nav-link ${isActive('/admin/dashboard') ? 'nav-link-active' : ''}`}
                >
                  Admin Dashboard
                </Link>
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/admin/login" className="login-button">
                Admin Login
              </Link>
            )}
          </div>

          {/* Hamburger Menu Button */}
          <button
            className={`hamburger-button ${menuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`nav-links-mobile ${menuOpen ? 'active' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
            onClick={closeMenu}
          >
            Live Match
          </Link>

          <Link
            to="/tournaments"
            className={`nav-link ${isActive('/tournaments') || location.pathname.startsWith('/tournament/') ? 'nav-link-active' : ''}`}
            onClick={closeMenu}
          >
            Tournaments
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/admin/dashboard"
                className={`nav-link ${isActive('/admin/dashboard') ? 'nav-link-active' : ''}`}
                onClick={closeMenu}
              >
                Admin Dashboard
              </Link>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
          ) : (
            <Link to="/admin/login" className="login-button" onClick={closeMenu}>
              Admin Login
            </Link>
          )}
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`menu-overlay ${menuOpen ? 'active' : ''}`}
        onClick={closeMenu}
      ></div>
    </>
  );
};

export default Navbar;
