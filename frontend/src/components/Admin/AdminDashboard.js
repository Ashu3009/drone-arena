import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TournamentManager from './TournamentManager';
import AllTournamentsManager from './AllTournamentsManager';
import SchoolManager from './SchoolManager';
import TeamManager from './TeamManager';
import MatchManager from './MatchManager';
import ReportsViewer from './ReportsViewer';
import DroneManagement from './DroneManagement';
import StatsManager from './StatsManager';
import ESPManagement from './ESPManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('tournaments');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tournaments':
        return <TournamentManager />;
      case 'all-tournaments':
        return <AllTournamentsManager />;
      case 'schools':
        return <SchoolManager />;
      case 'teams':
        return <TeamManager />;
      case 'drones':
        return <DroneManagement />;
      case 'matches':
        return <MatchManager />;
      case 'reports':
        return <ReportsViewer />;
      case 'stats':
        return <StatsManager />;
      case 'esp':
        return <ESPManagement />;
      default:
        return <TournamentManager />;
    }
  };

  const tabs = [
    { id: 'tournaments', label: 'Tournaments', icon: '🏆' },
    { id: 'all-tournaments', label: 'All Tournaments', icon: '📋' },
    { id: 'schools', label: 'Schools', icon: '🏫' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'drones', label: 'Drones', icon: '🚁' },
    { id: 'matches', label: 'Matches', icon: '⚔️' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'stats', label: 'Stats', icon: '📈' },
    { id: 'esp', label: 'ESP Devices', icon: '🔌' }
  ];

  // Bottom nav items (main 4 + hamburger)
  const bottomNavItems = [
    { id: 'tournaments', label: 'Home', icon: '🏠' },
    { id: 'matches', label: 'Matches', icon: '⚔️' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'menu', label: 'Menu', icon: '☰' }
  ];

  // Drawer menu items (remaining options)
  const drawerItems = [
    { id: 'all-tournaments', label: 'All Tournaments', icon: '📋' },
    { id: 'schools', label: 'Schools', icon: '🏫' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'drones', label: 'Drones', icon: '🚁' },
    { id: 'stats', label: 'Stats', icon: '📈' },
    { id: 'esp', label: 'ESP Devices', icon: '🔌' }
  ];

  const handleDrawerItemClick = (tabId) => {
    setActiveTab(tabId);
    setDrawerOpen(false);
  };

  return (
    <div className="admin-container">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <div className="logo-circle">DA</div>
            <div className="logo-text">
              <h1>Drone Arena</h1>
              <p>Admin Panel</p>
            </div>
          </div>
          <div className="admin-user">
            <span className="user-name">{admin?.username || 'Admin'}</span>
            <button onClick={handleLogout} className="logout-btn">
              <span>Logout</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      {!isMobile && (
        <nav className="admin-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Main Content */}
      <main className={`admin-main ${isMobile ? 'mobile' : 'desktop'}`}>
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          <nav className="admin-bottom-nav">
            {bottomNavItems.map(item => (
              <button
                key={item.id}
                className={`bottom-nav-btn ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'menu') {
                    setDrawerOpen(true);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Side Drawer */}
          {drawerOpen && (
            <>
              {/* Backdrop */}
              <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}></div>

              {/* Drawer */}
              <div className="drawer">
                <div className="drawer-header">
                  <h3>Navigation Menu</h3>
                  <button className="drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
                </div>
                <div className="drawer-content">
                  {drawerItems.map(item => (
                    <button
                      key={item.id}
                      className={`drawer-item ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => handleDrawerItemClick(item.id)}
                    >
                      <span className="drawer-icon">{item.icon}</span>
                      <span className="drawer-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
