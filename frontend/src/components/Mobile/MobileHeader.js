import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import {
  BellIcon,
  HomeIcon,
  TrophyIcon,
  ChartIcon,
  UserIcon,
  SettingsIcon,
  LogoutIcon,
  LockIcon,
  ChevronRightIcon,
  XIcon,
  GamepadIcon,
  StarIcon,
} from './icons';
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

  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
  }, [location]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (menuOpen) setMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const notifications = [
    {
      id: 1,
      type: 'match',
      title: 'Match Starting Soon',
      message: 'Red Hawks vs Blue Storm starts in 10 minutes',
      time: '5 min ago',
      read: false,
    },
    {
      id: 2,
      type: 'tournament',
      title: 'Tournament Update',
      message: 'Winter Championship 2024 - Round 2 begins tomorrow',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 3,
      type: 'achievement',
      title: 'New Achievement',
      message: 'You unlocked "Arena Spectator" badge',
      time: '2 hours ago',
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const menuItems = [
    { icon: HomeIcon, label: 'Home', path: '/mobile' },
    { icon: TrophyIcon, label: 'Tournaments', path: '/mobile/tournaments' },
    { icon: ChartIcon, label: 'Rankings', path: '/mobile/leaderboard' },
    { icon: ChartIcon, label: 'Reports', path: '/reports' },
    { icon: UserIcon, label: 'Profile', path: '/mobile/profile' },
    { divider: true },
    { icon: SettingsIcon, label: 'Admin Panel', path: '/admin' },
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match':
        return <GamepadIcon size={18} />;
      case 'tournament':
        return <TrophyIcon size={18} />;
      case 'achievement':
        return <StarIcon size={18} />;
      default:
        return <BellIcon size={18} />;
    }
  };

  return (
    <>
      <header className={`mobile-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="header-logo" onClick={() => navigate('/mobile')}>
            <div className="logo-icon">
              <img src={logo} alt="DroneNova" />
            </div>
            <div className="logo-text">
              <span className="logo-brand">DroneNova</span>
              <span className="logo-tagline">INDIA</span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className={`header-action-btn ${notificationsOpen ? 'active' : ''}`}
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <BellIcon size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            <button
              className={`header-action-btn menu-btn ${menuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Menu"
            >
              <div className="hamburger">
                <span />
                <span />
                <span />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
        <div className="menu-content">
          <div className="menu-header">
            <div className="menu-user">
              <div className="menu-avatar">
                {isAuthenticated && user?.photo ? (
                  <img src={user.photo} alt={user.name} />
                ) : (
                  <span>{isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : 'G'}</span>
                )}
              </div>
              <div className="menu-user-info">
                <div className="menu-user-name">
                  {isAuthenticated && user?.name ? user.name : 'Guest User'}
                </div>
                <div className="menu-user-status">
                  <span className={`status-dot ${isAuthenticated ? 'online' : ''}`} />
                  {isAuthenticated ? 'Online' : 'Not Logged In'}
                </div>
              </div>
            </div>
            <button className="menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <XIcon size={20} />
            </button>
          </div>

          <nav className="menu-nav">
            {menuItems.map((item, index) =>
              item.divider ? (
                <div key={index} className="menu-divider" />
              ) : (
                <button
                  key={index}
                  className="menu-item"
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="menu-item-icon">
                    <item.icon size={20} />
                  </span>
                  <span className="menu-item-label">{item.label}</span>
                  <ChevronRightIcon size={18} className="menu-item-arrow" />
                </button>
              )
            )}
          </nav>

          <div className="menu-footer">
            {isAuthenticated ? (
              <button
                className="menu-logout-btn"
                onClick={async () => {
                  await logout();
                  setMenuOpen(false);
                  navigate('/login');
                }}
              >
                <LogoutIcon size={18} />
                Sign Out
              </button>
            ) : (
              <button
                className="menu-login-btn"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/login');
                }}
              >
                <LockIcon size={18} />
                Login
              </button>
            )}
            <div className="menu-version">v1.0.0</div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <div className={`notifications-panel ${notificationsOpen ? 'open' : ''}`}>
        <div className="notifications-overlay" onClick={() => setNotificationsOpen(false)} />
        <div className="notifications-content">
          <div className="notifications-header">
            <h3 className="notifications-title">Notifications</h3>
            <button className="notifications-close" onClick={() => setNotificationsOpen(false)} aria-label="Close">
              <XIcon size={20} />
            </button>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notifications-empty">
                <BellIcon size={48} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-body">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                  {!notification.read && <div className="notification-dot" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notifications-footer">
              <button className="mark-all-read">Mark all as read</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileHeader;
