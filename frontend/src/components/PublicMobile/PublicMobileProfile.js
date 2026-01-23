import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import './PublicMobileProfile.css';

// Professional Icons
const UserIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="#F97316" strokeWidth="2"/>
    <path d="M5 20C5 16.6863 7.68629 14 11 14H13C16.3137 14 19 16.6863 19 20" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const TrophyIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C15.866 15 19 11.866 19 8V5H5V8C5 11.866 8.13401 15 12 15Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V19M12 19H8M12 19H16" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 5H21V7C21 8.65685 19.6569 10 18 10H19" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5H3V7C3 8.65685 4.34315 10 6 10H5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DroneIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="8" height="4" rx="1" stroke="#3B82F6" strokeWidth="2"/>
    <circle cx="5" cy="5" r="2" stroke="#3B82F6" strokeWidth="2"/>
    <circle cx="19" cy="5" r="2" stroke="#3B82F6" strokeWidth="2"/>
    <circle cx="5" cy="19" r="2" stroke="#3B82F6" strokeWidth="2"/>
    <circle cx="19" cy="19" r="2" stroke="#3B82F6" strokeWidth="2"/>
    <path d="M8 10L5 5M16 10L19 5M8 14L5 19M16 14L19 19" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const StatsIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V21H21" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 16L12 11L16 15L21 10" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="16" r="2" fill="#10B981"/>
    <circle cx="12" cy="11" r="2" fill="#10B981"/>
    <circle cx="16" cy="15" r="2" fill="#10B981"/>
    <circle cx="21" cy="10" r="2" fill="#10B981"/>
  </svg>
);

const TeamIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="7" r="3" stroke="#8B5CF6" strokeWidth="2"/>
    <circle cx="15" cy="7" r="3" stroke="#8B5CF6" strokeWidth="2"/>
    <path d="M3 21C3 17.6863 5.68629 15 9 15C10.0929 15 11.1175 15.2922 12 15.8027" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 15.8027C12.8825 15.2922 13.9071 15 15 15C18.3137 15 21 17.6863 21 21" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PublicMobileProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useUserAuth();

  // If user is logged in, show their profile
  if (loading) {
    return (
      <div className="pub-profile-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner-large"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="pub-profile-container">
        {/* User Profile Header */}
        <div className="pub-profile-hero">
          <div className="pub-profile-user-avatar">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="pub-avatar-img" />
            ) : (
              <div className="pub-avatar-placeholder">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <h1 className="pub-profile-title">{user.name}</h1>
          <p className="pub-profile-subtitle">{user.email}</p>
          {user.emailVerified ? (
            <span className="pub-verified-badge">✅ Verified</span>
          ) : (
            <span className="pub-unverified-badge">⚠️ Email Not Verified</span>
          )}
        </div>

        {/* User Stats */}
        <div className="pub-profile-stats-banner">
          <div className="pub-profile-stat-item">
            <div className="pub-profile-stat-value">0</div>
            <div className="pub-profile-stat-label">Tournaments</div>
          </div>
          <div className="pub-profile-stat-divider"></div>
          <div className="pub-profile-stat-item">
            <div className="pub-profile-stat-value">0</div>
            <div className="pub-profile-stat-label">Matches</div>
          </div>
          <div className="pub-profile-stat-divider"></div>
          <div className="pub-profile-stat-item">
            <div className="pub-profile-stat-value">-</div>
            <div className="pub-profile-stat-label">Rank</div>
          </div>
        </div>

        {/* User Info */}
        <div className="pub-profile-info-section">
          <h2 className="pub-profile-section-title">Account Details</h2>
          <div className="pub-profile-info-card">
            <div className="pub-profile-info-row">
              <span className="pub-info-label">Member Since</span>
              <span className="pub-info-value">
                {new Date(user.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="pub-profile-info-row">
              <span className="pub-info-label">Login Method</span>
              <span className="pub-info-value">
                {user.authMethod === 'google' ? '🔐 Google' : '📧 Email'}
              </span>
            </div>
            <div className="pub-profile-info-row">
              <span className="pub-info-label">Status</span>
              <span className="pub-info-value pub-status-active">
                🟢 Active
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pub-profile-actions-section">
          <h2 className="pub-profile-section-title">Quick Actions</h2>
          <div className="pub-profile-action-grid">
            <button
              className="pub-action-card"
              onClick={() => navigate('/watch/tournaments')}
            >
              <TrophyIcon />
              <span>Tournaments</span>
            </button>
            <button
              className="pub-action-card"
              onClick={() => navigate('/watch/leaderboard')}
            >
              <StatsIcon />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pub-profile-logout-section">
          <button
            className="pub-profile-btn-logout"
            onClick={async () => {
              await logout();
              navigate('/watch');
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* Footer */}
        <div className="pub-profile-footer">
          <p>🇮🇳 DroneNova Arena - Made in India</p>
        </div>
      </div>
    );
  }

  // If user is NOT logged in, show signup/login prompt
  const features = [
    {
      icon: <TrophyIcon />,
      title: 'Tournament Stats',
      description: 'Track wins and rankings',
      color: '#F59E0B'
    },
    {
      icon: <DroneIcon />,
      title: 'Drone Management',
      description: 'Register and monitor drones',
      color: '#3B82F6'
    },
    {
      icon: <StatsIcon />,
      title: 'Match Reports',
      description: 'View detailed analytics',
      color: '#10B981'
    },
    {
      icon: <TeamIcon />,
      title: 'Team Play',
      description: 'Join or create teams',
      color: '#8B5CF6'
    }
  ];

  return (
    <div className="pub-profile-container">
      {/* Hero Section */}
      <div className="pub-profile-hero">
        <div className="pub-profile-icon-wrapper">
          <UserIcon />
        </div>
        <h1 className="pub-profile-title">DroneNova</h1>
        <p className="pub-profile-subtitle">
          India's Premier Drone Soccer League
        </p>
      </div>

      {/* Features Section */}
      <div className="pub-profile-features">
        <h2 className="pub-profile-section-title">Member Features</h2>
        <div className="pub-profile-feature-grid">
          {features.map((feature, index) => (
            <div key={index} className="pub-profile-feature-card">
              <div className="pub-profile-feature-icon" style={{ '--icon-color': feature.color }}>
                {feature.icon}
              </div>
              <h3 className="pub-profile-feature-title">{feature.title}</h3>
              <p className="pub-profile-feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="pub-profile-cta-section">
        <div className="pub-profile-cta-card">
          <h2 className="pub-profile-cta-title">Sign In to Continue</h2>
          <p className="pub-profile-cta-desc">
            Access your profile and team stats
          </p>
          <div className="pub-profile-cta-buttons">
            <button
              className="pub-profile-btn-primary"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
            <button
              className="pub-profile-btn-secondary"
              onClick={() => navigate('/signup')}
            >
              Create Account
            </button>
          </div>
          <p className="pub-profile-cta-note">
            <span className="pub-profile-india-flag">🇮🇳</span>
            Made in India
          </p>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="pub-profile-stats-banner">
        <div className="pub-profile-stat-item">
          <div className="pub-profile-stat-value">100+</div>
          <div className="pub-profile-stat-label">Players</div>
        </div>
        <div className="pub-profile-stat-divider"></div>
        <div className="pub-profile-stat-item">
          <div className="pub-profile-stat-value">200+</div>
          <div className="pub-profile-stat-label">Matches</div>
        </div>
        <div className="pub-profile-stat-divider"></div>
        <div className="pub-profile-stat-item">
          <div className="pub-profile-stat-value">25+</div>
          <div className="pub-profile-stat-label">Tournaments</div>
        </div>
      </div>

      {/* Footer */}
      <div className="pub-profile-footer">
        <p>🇮🇳 DroneNova - India's Drone Soccer League</p>
      </div>
    </div>
  );
};

export default PublicMobileProfile;
