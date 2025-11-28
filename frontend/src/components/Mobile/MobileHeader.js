import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mobileTheme } from '../../theme/mobileTheme';
import './MobileHeader.css';

const MobileHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/mobile') return 'Home';
    if (path.includes('/tournaments')) return 'Tournaments';
    if (path.includes('/leaderboard')) return 'Rankings';
    if (path.includes('/profile')) return 'Profile';
    return 'DroneNova';
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <>
      <header className={`mobile-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          {/* Logo */}
          <div className="header-logo" onClick={() => navigate('/mobile')}>
            <div className="logo-icon">
              <span className="drone-icon">🚁</span>
              <div className="logo-pulse"></div>
            </div>
            <div className="logo-text">
              <span className="logo-brand">DroneNova</span>
              <span className="logo-tagline">Arena Combat</span>
            </div>
          </div>

          {/* Page Title (shows on scroll) */}
          <div className={`header-title ${scrolled ? 'visible' : ''}`}>
            {getPageTitle()}
          </div>

          {/* Actions */}
          <div className="header-actions">
            {/* Notifications */}
            <button className="header-action-btn notification-btn">
              <span className="action-icon">🔔</span>
              <span className="notification-badge">3</span>
            </button>

            {/* Menu Toggle */}
            <button
              className={`header-action-btn menu-btn ${menuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
            >
              <div className="hamburger">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </div>

        {/* Progress Bar (optional loading indicator) */}
        <div className="header-progress">
          <div className="progress-bar"></div>
        </div>
      </header>

      {/* Dropdown Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>

        <div className="menu-content">
          {/* Menu Header */}
          <div className="menu-header">
            <div className="menu-user-info">
              <div className="user-avatar">
                <span className="avatar-icon">👤</span>
              </div>
              <div className="user-details">
                <div className="user-name">Guest User</div>
                <div className="user-status">🟢 Online</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="menu-nav">
            <button
              className="menu-item"
              onClick={() => handleMenuItemClick('/mobile')}
            >
              <span className="menu-icon">🏠</span>
              <span className="menu-label">Home</span>
              <span className="menu-arrow">›</span>
            </button>

            <button
              className="menu-item"
              onClick={() => handleMenuItemClick('/mobile/tournaments')}
            >
              <span className="menu-icon">🏆</span>
              <span className="menu-label">Tournaments</span>
              <span className="menu-arrow">›</span>
            </button>

            <button
              className="menu-item"
              onClick={() => handleMenuItemClick('/mobile/leaderboard')}
            >
              <span className="menu-icon">📊</span>
              <span className="menu-label">Rankings</span>
              <span className="menu-arrow">›</span>
            </button>

            <button
              className="menu-item"
              onClick={() => handleMenuItemClick('/mobile/profile')}
            >
              <span className="menu-icon">👤</span>
              <span className="menu-label">Profile</span>
              <span className="menu-arrow">›</span>
            </button>

            <div className="menu-divider"></div>

            <button
              className="menu-item"
              onClick={() => handleMenuItemClick('/admin')}
            >
              <span className="menu-icon">⚙️</span>
              <span className="menu-label">Admin Panel</span>
              <span className="menu-arrow">›</span>
            </button>

            <button className="menu-item">
              <span className="menu-icon">ℹ️</span>
              <span className="menu-label">About</span>
              <span className="menu-arrow">›</span>
            </button>

            <button className="menu-item">
              <span className="menu-icon">🌙</span>
              <span className="menu-label">Dark Mode</span>
              <div className="menu-toggle">
                <input type="checkbox" id="dark-mode" defaultChecked />
                <label htmlFor="dark-mode"></label>
              </div>
            </button>
          </nav>

          {/* Menu Footer */}
          <div className="menu-footer">
            <button className="logout-btn">
              <span className="logout-icon">🚪</span>
              Sign Out
            </button>
            <div className="menu-version">v1.0.0</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;
