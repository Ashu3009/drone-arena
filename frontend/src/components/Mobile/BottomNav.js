import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mobileTheme } from '../../theme/mobileTheme';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      activeIcon: '🏠',
      path: '/mobile',
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      icon: '🏆',
      activeIcon: '🏆',
      path: '/mobile/tournaments',
    },
    {
      id: 'leaderboard',
      label: 'Rankings',
      icon: '📊',
      activeIcon: '📊',
      path: '/mobile/leaderboard',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      activeIcon: '👤',
      path: '/mobile/profile',
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map((item) => {
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              {/* Ripple Effect */}
              {active && <div className="nav-ripple"></div>}

              {/* Icon */}
              <div className="nav-icon">
                <span className="icon-emoji">
                  {active ? item.activeIcon : item.icon}
                </span>
                {active && <div className="icon-glow"></div>}
              </div>

              {/* Label */}
              <span className="nav-label">{item.label}</span>

              {/* Active Indicator */}
              {active && <div className="active-dot"></div>}
            </button>
          );
        })}
      </div>

      {/* Safe area padding for devices with notches */}
      <div className="bottom-nav-safe-area"></div>
    </nav>
  );
};

export default BottomNav;
