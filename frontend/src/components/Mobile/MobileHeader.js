import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import logo from '../../assets/logo.png';
import './MobileHeader.css';

const MobileHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useUserAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
    setNotificationsOpen(false);
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

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (menuOpen) setMenuOpen(false); // Close menu if open
  };

  // Sample notifications data (can be fetched from API later)
  const notifications = [
    {
      id: 1,
      type: 'match',
      icon: '🎮',
      title: 'Match Starting Soon',
      message: 'Red Hawks vs Blue Storm starts in 10 minutes',
      time: '5 min ago',
      read: false
    },
    {
      id: 2,
      type: 'tournament',
      icon: '🏆',
      title: 'Tournament Update',
      message: 'Winter Championship 2024 - Round 2 begins tomorrow',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'achievement',
      icon: '🌟',
      title: 'New Achievement',
      message: 'You unlocked "Arena Spectator" badge',
      time: '2 hours ago',
      read: true
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className={`mobile-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          {/* Logo */}
          <div className="header-logo" onClick={() => navigate('/mobile')}>
            <div className="logo-icon">
              <img src={logo} alt="DroneNova" className="drone-icon-img" />
              <div className="logo-pulse"></div>
            </div>
            <div className="logo-text">
              <span className="logo-brand"></span>
              <span className="logo-tagline"></span>
            </div>
          </div>

          {/* Page Title (shows on scroll) */}
          <div className={`header-title ${scrolled ? 'visible' : ''}`}>
            {getPageTitle()}
          </div>

          {/* Actions */}
          <div className="header-actions">
            {/* Notifications */}
            <button
              className={`header-action-btn notification-btn ${notificationsOpen ? 'active' : ''}`}
              onClick={toggleNotifications}
            >
              <span className="action-icon">🔔</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
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
                {isAuthenticated && user?.photo ? (
                  <img src={user.photo} alt={user.name} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                ) : isAuthenticated && user?.name ? (
                  <span className="avatar-icon">{user.name.charAt(0).toUpperCase()}</span>
                ) : (
                  <span className="avatar-icon">👤</span>
                )}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {isAuthenticated && user?.name ? user.name : 'Guest User'}
                </div>
                <div className="user-status">
                  {isAuthenticated ? '🟢 Online' : '⚪ Not Logged In'}
                </div>
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
            {isAuthenticated ? (
              <button className="logout-btn" onClick={async () => {
                await logout();
                setMenuOpen(false);
                navigate('/login');
              }}>
                <span className="logout-icon">🚪</span>
                Sign Out
              </button>
            ) : (
              <button className="logout-btn" onClick={() => {
                setMenuOpen(false);
                navigate('/login');
              }}>
                <span className="logout-icon">🔐</span>
                Login
              </button>
            )}
            <div className="menu-version">v1.0.0</div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <div className={`notifications-panel ${notificationsOpen ? 'open' : ''}`}>
        <div className="notifications-overlay" onClick={() => setNotificationsOpen(false)}></div>

        <div className="notifications-content">
          {/* Header */}
          <div className="notifications-header">
            <h3 className="notifications-title">Notifications</h3>
            <button
              className="notifications-close"
              onClick={() => setNotificationsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notifications-icon">🔔</div>
                <p className="no-notifications-text">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-icon">{notification.icon}</div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                  {!notification.read && <div className="notification-dot"></div>}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notifications-footer">
              <button className="mark-all-read-btn">Mark all as read</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileHeader;
