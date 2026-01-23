import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, TrophyIcon, ChartIcon, UserIcon } from './icons';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', Icon: HomeIcon, path: '/mobile' },
    { id: 'tournaments', label: 'Events', Icon: TrophyIcon, path: '/mobile/tournaments' },
    { id: 'leaderboard', label: 'Rankings', Icon: ChartIcon, path: '/mobile/leaderboard' },
    { id: 'profile', label: 'Profile', Icon: UserIcon, path: '/mobile/profile' },
  ];

  const isActive = (path) => {
    if (path === '/mobile') {
      return location.pathname === '/' || location.pathname === '/mobile';
    }
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
          const { Icon } = item;

          return (
            <button
              key={item.id}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="nav-icon">
                <Icon size={22} />
              </div>
              <span className="nav-label">{item.label}</span>
              {active && <div className="nav-indicator" />}
            </button>
          );
        })}
      </div>
      <div className="bottom-nav-safe-area" />
    </nav>
  );
};

export default BottomNav;
