import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './PublicMobileLayout.css';
import logoImg from '../../assets/DroneNova India 2026.png';

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a3a5c">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a3a5c">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
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

const MatchesIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#F97316" : "#9CA3AF"}>
    <circle cx="12" cy="12" r="9" stroke={active ? "#F97316" : "#9CA3AF"} strokeWidth="2" fill="none"/>
    <polygon points="12,4 14,10 20,10 15,14 17,20 12,16 7,20 9,14 4,10 10,10" fill={active ? "#F97316" : "#9CA3AF"}/>
  </svg>
);

const StatsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#F97316" : "#9CA3AF"}>
    <path d="M3 3v18h18" stroke={active ? "#F97316" : "#9CA3AF"} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="7" y="13" width="3" height="7" rx="1" fill={active ? "#F97316" : "#9CA3AF"}/>
    <rect x="12" y="9" width="3" height="11" rx="1" fill={active ? "#F97316" : "#9CA3AF"} opacity="0.7"/>
    <rect x="17" y="5" width="3" height="15" rx="1" fill={active ? "#F97316" : "#9CA3AF"} opacity="0.5"/>
  </svg>
);

const AwardsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#F97316" : "#9CA3AF"}>
    <circle cx="12" cy="9" r="6" stroke={active ? "#F97316" : "#9CA3AF"} strokeWidth="2" fill="none"/>
    <path d="M12 6v6l3 2" stroke={active ? "#F97316" : "#9CA3AF"} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M8 15l-2 7h12l-2-7" fill={active ? "#F97316" : "#9CA3AF"} opacity="0.4"/>
  </svg>
);

const PublicMobileLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="pub-mobile-container">
      {/* ========== HEADER ========== */}
      <header className="pub-header-new">
        <button className="pub-menu-btn-new" onClick={() => setMenuOpen(!menuOpen)}>
          <MenuIcon />
        </button>

        <div className="pub-logo-container-new">
          <img src={logoImg} alt="DroneNova India" className="pub-header-logo-img" />
        </div>

        <div style={{ width: 40 }} />
      </header>

      {/* Sidebar Overlay */}
      {menuOpen && <div className="pub-sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`pub-sidebar ${menuOpen ? 'pub-sidebar-open' : ''}`}>
        <div className="pub-sidebar-header">
          <div className="pub-sidebar-brand">
            <img src={logoImg} alt="DroneNova India" className="pub-sidebar-logo-img" />
          </div>
          <button className="pub-sidebar-close" onClick={() => setMenuOpen(false)}>
            <CloseIcon />
          </button>
        </div>

        <nav className="pub-sidebar-nav">
          {[
            { id: 'home', icon: HomeIcon, label: 'Home', route: '/watch' },
            { id: 'profile', icon: ProfileIcon, label: 'Profile', route: '/watch/profile' },
            { id: 'tournaments', icon: TournamentIcon, label: 'Tournaments', route: '/watch/tournaments' },
            { id: 'matches', icon: MatchesIcon, label: 'Matches', route: '/watch/matches' },
            { id: 'stats', icon: StatsIcon, label: 'Stats', route: '/watch/stats' },
            { id: 'awards', icon: AwardsIcon, label: 'Awards', route: '/watch/awards' },
          ].map(({ id, icon: Icon, label, route }) => (
            <button
              key={id}
              className={`pub-sidebar-item ${location.pathname === route ? 'pub-sidebar-item-active' : ''}`}
              onClick={() => {
                navigate(route);
                setMenuOpen(false);
              }}
            >
              <Icon active={location.pathname === route} />
              <span className="pub-sidebar-item-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="pub-sidebar-footer">
          <button
            className="pub-sidebar-login-btn"
            onClick={() => {
              navigate('/admin/login');
              setMenuOpen(false);
            }}
          >
            Admin Login
          </button>
        </div>
      </aside>

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
