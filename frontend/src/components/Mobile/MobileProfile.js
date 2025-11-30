// frontend/src/components/Mobile/MobileProfile.js - Mobile User Profile Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import './MobileProfile.css';

const MobileProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useUserAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Removed auto-redirect - allow guest viewing
  // Users can browse the app without login, profile shows login prompt

  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="mobile-profile">
        <div className="profile-loading">
          <div className="loading-spinner-large"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mobile-profile">
        <div className="profile-not-logged-in">
          <div className="not-logged-icon">🔒</div>
          <h2>Not Logged In</h2>
          <p>Please login to view your profile</p>
          <button className="login-redirect-btn" onClick={() => navigate('/login')}>
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-bg"></div>
        <div className="profile-avatar-section">
          {user.photo ? (
            <img src={user.photo} alt={user.name} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          {user.emailVerified && (
            <div className="verified-badge" title="Email Verified">
              ✓
            </div>
          )}
        </div>
        <h1 className="profile-name">{user.name}</h1>
        <p className="profile-email">{user.email}</p>
        <div className="profile-role-badge">
          {user.role === 'player' && '🎮 Player'}
          {user.role === 'team_captain' && '👑 Team Captain'}
          {user.role === 'tournament_organizer' && '🏆 Organizer'}
        </div>
      </div>

      {/* Profile Stats */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{user.stats?.matchesPlayed || 0}</div>
          <div className="stat-label">Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚽</div>
          <div className="stat-value">{user.stats?.totalGoals || 0}</div>
          <div className="stat-label">Goals</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎖️</div>
          <div className="stat-value">{user.stats?.totalAssists || 0}</div>
          <div className="stat-label">Assists</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">
            {user.stats?.avgPerformance ? user.stats.avgPerformance.toFixed(1) : '0.0'}
          </div>
          <div className="stat-label">Avg Score</div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="profile-info-section">
        <h2 className="section-title">
          <span className="title-icon">ℹ️</span>
          Personal Information
        </h2>

        <div className="info-card">
          <div className="info-item">
            <div className="info-label">
              <span className="info-icon">📧</span>
              Email
            </div>
            <div className="info-value">{user.email}</div>
          </div>

          {user.phone && (
            <div className="info-item">
              <div className="info-label">
                <span className="info-icon">📱</span>
                Phone
              </div>
              <div className="info-value">{user.phone}</div>
            </div>
          )}

          {user.location?.city && (
            <div className="info-item">
              <div className="info-label">
                <span className="info-icon">📍</span>
                Location
              </div>
              <div className="info-value">
                {user.location.city}
                {user.location.state && `, ${user.location.state}`}
              </div>
            </div>
          )}

          <div className="info-item">
            <div className="info-label">
              <span className="info-icon">📅</span>
              Member Since
            </div>
            <div className="info-value">
              {new Date(user.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric'
              })}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">
              <span className="info-icon">🔐</span>
              Account Status
            </div>
            <div className="info-value">
              {user.emailVerified ? (
                <span className="status-verified">✅ Verified</span>
              ) : (
                <span className="status-unverified">⚠️ Unverified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Profile (if role is player) */}
      {user.role === 'player' && user.playerProfile && (
        <div className="profile-info-section">
          <h2 className="section-title">
            <span className="title-icon">🎮</span>
            Player Profile
          </h2>

          <div className="info-card">
            {user.playerProfile.preferredRole && (
              <div className="info-item">
                <div className="info-label">
                  <span className="info-icon">🎯</span>
                  Preferred Role
                </div>
                <div className="info-value">{user.playerProfile.preferredRole}</div>
              </div>
            )}

            {user.playerProfile.skillLevel && (
              <div className="info-item">
                <div className="info-label">
                  <span className="info-icon">⭐</span>
                  Skill Level
                </div>
                <div className="info-value">{user.playerProfile.skillLevel}</div>
              </div>
            )}

            {user.playerProfile.experienceYears > 0 && (
              <div className="info-item">
                <div className="info-label">
                  <span className="info-icon">📊</span>
                  Experience
                </div>
                <div className="info-value">
                  {user.playerProfile.experienceYears} year{user.playerProfile.experienceYears > 1 ? 's' : ''}
                </div>
              </div>
            )}

            <div className="info-item">
              <div className="info-label">
                <span className="info-icon">🔄</span>
                Available as Substitute
              </div>
              <div className="info-value">
                {user.playerProfile.availableAsSubstitute ? '✅ Yes' : '❌ No'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="profile-actions">
        <button className="action-btn edit-btn" onClick={() => navigate('/mobile/edit-profile')}>
          <span className="btn-icon">✏️</span>
          Edit Profile
        </button>

        <button className="action-btn settings-btn" onClick={() => navigate('/mobile/settings')}>
          <span className="btn-icon">⚙️</span>
          Settings
        </button>

        <button
          className="action-btn logout-btn"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <span className="btn-icon">🚪</span>
          Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h3 className="modal-title">Confirm Logout</h3>
            <p className="modal-message">Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn confirm-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileProfile;
