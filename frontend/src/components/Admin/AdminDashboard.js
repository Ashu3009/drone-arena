import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TournamentManager from './TournamentManager';
import SchoolManager from './SchoolManager';
import TeamManager from './TeamManager';
import MatchManager from './MatchManager';
import ReportsManager from './ReportsManager';
import DroneManagement from './DroneManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('tournaments');
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tournaments':
        return <TournamentManager />;
      case 'schools':
        return <SchoolManager />;
      case 'teams':
        return <TeamManager />;
      case 'drones':
        return <DroneManagement />;
      case 'matches':
        return <MatchManager />;
      case 'reports':
        return <ReportsManager />;
      default:
        return <TournamentManager />;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Drone Arena - Admin Dashboard</h1>
          <p style={styles.welcome}>Welcome, {admin?.username || 'Admin'}</p>
        </div>
        <div style={styles.headerRight}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.nav}>
        <button
          style={activeTab === 'tournaments' ? {...styles.navButton, ...styles.navButtonActive} : styles.navButton}
          onClick={() => setActiveTab('tournaments')}
        >
          Tournaments
        </button>
        <button
          style={activeTab === 'schools' ? {...styles.navButton, ...styles.navButtonActive} : styles.navButton}
          onClick={() => setActiveTab('schools')}
        >
          Schools
        </button>
        <button
          style={activeTab === 'teams' ? {...styles.navButton, ...styles.navButtonActive} : styles.navButton}
          onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
        <button
          style={activeTab === 'drones' ? {...styles.navButton, ...styles.navButtonActive} : styles.navButton}
          onClick={() => setActiveTab('drones')}
        >
          Drones
        </button>
        <button
          style={activeTab === 'matches' ? {...styles.navButton, ...styles.navButtonActive} : styles.navButton}
          onClick={() => setActiveTab('matches')}
        >
          Matches
        </button>
        <button
          style={activeTab === 'reports' ? {...styles.navButton, ...styles.navButtonActive} : styles.navButton}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
        <a href="/" style={styles.viewPublicLink} target="_blank" rel="noopener noreferrer">
          View Public Dashboard
        </a>
      </nav>

      {/* Content Area */}
      <main style={styles.content}>
        {renderContent()}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: 'white'
  },
  header: {
    backgroundColor: '#1e1e1e',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #333'
  },
  headerLeft: {
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold'
  },
  welcome: {
    margin: '5px 0 0 0',
    color: '#888',
    fontSize: '14px'
  },
  headerRight: {
    display: 'flex',
    gap: '12px'
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  nav: {
    backgroundColor: '#1e1e1e',
    padding: '0 40px',
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid #333',
    alignItems: 'center'
  },
  navButton: {
    backgroundColor: 'transparent',
    color: '#888',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '16px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  navButtonActive: {
    color: '#4CAF50',
    borderBottomColor: '#4CAF50'
  },
  viewPublicLink: {
    marginLeft: 'auto',
    color: '#4CAF50',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '16px 24px',
    fontWeight: '600'
  },
  content: {
    padding: '40px'
  }
};

export default AdminDashboard;
