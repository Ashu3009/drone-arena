import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './PublicMobileLayout.css';

// DroneNova Propeller Logo SVG
const DroneNovaLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
    {/* Center hub */}
    <circle cx="50" cy="50" r="12" fill="#1a3a5c"/>
    <circle cx="50" cy="50" r="8" fill="#FF9933"/>
    {/* Propeller blades - 4 directions */}
    <ellipse cx="50" cy="25" rx="8" ry="20" fill="#138808" opacity="0.9"/>
    <ellipse cx="75" cy="50" rx="20" ry="8" fill="#FF9933" opacity="0.9"/>
    <ellipse cx="50" cy="75" rx="8" ry="20" fill="#138808" opacity="0.9"/>
    <ellipse cx="25" cy="50" rx="20" ry="8" fill="#FF9933" opacity="0.9"/>
    {/* Blade connectors */}
    <circle cx="50" cy="25" r="4" fill="#1a3a5c"/>
    <circle cx="75" cy="50" r="4" fill="#1a3a5c"/>
    <circle cx="50" cy="75" r="4" fill="#1a3a5c"/>
    <circle cx="25" cy="50" r="4" fill="#1a3a5c"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a3a5c">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
  </svg>
);

const HomeIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#F97316" : "#9CA3AF"}>
    <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
  </svg>
);

const TournamentIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#F97316" : "#9CA3AF"}>
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
);

const RankingsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#F97316" : "#9CA3AF"}>
    <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z"/>
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#F97316" : "#9CA3AF"}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const PublicMobileLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = location.pathname === '/watch';

  return (
    <div className="pub-mobile-container">
      {/* ========== HEADER ========== */}
      <header className="pub-header-new">
        <button className="pub-menu-btn-new" onClick={() => setMenuOpen(!menuOpen)}>
          <MenuIcon />
        </button>

        <div className="pub-logo-container-new">
          <DroneNovaLogo />
          <div className="pub-logo-text-wrapper">
            <span className="pub-logo-main">DroneNova</span>
            <span className="pub-logo-india">— INDIA —</span>
          </div>
        </div>

        <button className="pub-menu-btn-new" onClick={() => setMenuOpen(!menuOpen)}>
          <MenuIcon />
        </button>
      </header>

      {/* Menu Dropdown */}
      {menuOpen && (
        <div className="pub-menu-dropdown-new">
          <button
            className="pub-menu-item-new"
            onClick={() => {
              navigate('/login');
              setMenuOpen(false);
            }}
          >
            Login
          </button>
          <button
            className="pub-menu-item-new"
            onClick={() => {
              navigate('/signup');
              setMenuOpen(false);
            }}
          >
            Sign Up
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="pub-main-content-new">
        <Outlet />
      </main>

      {/* ========== BOTTOM NAVIGATION ========== */}
      <div className="pub-bottom-nav-container">
        <div className="pub-nav-orange-line" />
        <nav className="pub-bottom-nav-new">
          {[
            { id: 'home', icon: HomeIcon, label: 'HOME', route: '/watch' },
            { id: 'tournaments', icon: TournamentIcon, label: 'TOURNAMENTS', route: '/watch/tournaments' },
            { id: 'rankings', icon: RankingsIcon, label: 'RANKINGS', route: '/watch/leaderboard' },
            { id: 'profile', icon: ProfileIcon, label: 'PROFILE', route: '/watch/profile' },
          ].map(({ id, icon: Icon, label, route }) => (
            <button key={id} className="pub-nav-item-new" onClick={() => navigate(route)}>
              <Icon active={location.pathname === route} />
              <span className={`pub-nav-label-new ${location.pathname === route ? 'pub-nav-label-active' : 'pub-nav-label-inactive'}`}>
                {label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default PublicMobileLayout;
