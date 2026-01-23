import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import {
  LockIcon,
  CheckIcon,
  GamepadIcon,
  CrownIcon,
  TrophyIcon,
  TargetIcon,
  GoalIcon,
  MedalIcon,
  StarIcon,
  InfoIcon,
  EmailIcon,
  PhoneIcon,
  LocationIcon,
  CalendarIcon,
  ShieldCheckIcon,
  AlertIcon,
  ActivityIcon,
  CheckCircleIcon,
  XCircleIcon,
  EditIcon,
  SettingsIcon,
  LogOutIcon
} from './icons';
import './MobileProfile.css';

const MobileProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useUserAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="mobile-profile">
        <div className="profile-loading">
          <div className="loading-spinner-large" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mobile-profile">
        <div className="profile-not-logged-in">
          <div className="not-logged-icon">
            <LockIcon size={64} />
          </div>
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
        <div className="profile-header-bg" />
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
              <CheckIcon size={16} color="white" />
            </div>
          )}
        </div>
        <h1 className="profile-name">{user.name}</h1>
        <p className="profile-email">{user.email}</p>
        <div className="profile-role-badge">
          {user.role === 'player' && (
            <>
              <GamepadIcon size={16} /> Player
            </>
          )}
          {user.role === 'team_captain' && (
            <>
              <CrownIcon size={16} /> Team Captain
            </>
          )}
          {user.role === 'tournament_organizer' && (
            <>
              <TrophyIcon size={16} /> Organizer
            </>
          )}
        </div>
      </div>

      {/* Profile Stats */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <TargetIcon size={28} />
          </div>
          <div className="stat-value">{user.stats?.matchesPlayed || 0}</div>
          <div className="stat-label">Matches</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <GoalIcon size={28} />
          </div>
          <div className="stat-value">{user.stats?.totalGoals || 0}</div>
          <div className="stat-label">Goals</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <MedalIcon size={28} />
          </div>
          <div className="stat-value">{user.stats?.totalAssists || 0}</div>
          <div className="stat-label">Assists</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <StarIcon size={28} />
          </div>
          <div className="stat-value">
            {user.stats?.avgPerformance ? user.stats.avgPerformance.toFixed(1) : '0.0'}
          </div>
          <div className="stat-label">Avg Score</div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="profile-info-section">
        <h2 className="section-title">
          <InfoIcon size={20} />
          Personal Information
        </h2>

        <div className="info-card">
          <div className="info-item">
            <div className="info-label">
              <EmailIcon size={16} />
              Email
            </div>
            <div className="info-value">{user.email}</div>
          </div>

          {user.phone && (
            <div className="info-item">
              <div className="info-label">
                <PhoneIcon size={16} />
                Phone
              </div>
              <div className="info-value">{user.phone}</div>
            </div>
          )}

          {user.location?.city && (
            <div className="info-item">
              <div className="info-label">
                <LocationIcon size={16} />
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
              <CalendarIcon size={16} />
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
              <ShieldCheckIcon size={16} />
              Account Status
            </div>
            <div className="info-value">
              {user.emailVerified ? (
                <span className="status-verified">
                  <CheckCircleIcon size={16} /> Verified
                </span>
              ) : (
                <span className="status-unverified">
                  <AlertIcon size={16} /> Unverified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Profile */}
      {user.role === 'player' && user.playerProfile && (
        <div className="profile-info-section">
          <h2 className="section-title">
            <GamepadIcon size={20} />
            Player Profile
          </h2>

          <div className="info-card">
            {user.playerProfile.preferredRole && (
              <div className="info-item">
                <div className="info-label">
                  <TargetIcon size={16} />
                  Preferred Role
                </div>
                <div className="info-value">{user.playerProfile.preferredRole}</div>
              </div>
            )}

            {user.playerProfile.skillLevel && (
              <div className="info-item">
                <div className="info-label">
                  <StarIcon size={16} />
                  Skill Level
                </div>
                <div className="info-value">{user.playerProfile.skillLevel}</div>
              </div>
            )}

            {user.playerProfile.experienceYears > 0 && (
              <div className="info-item">
                <div className="info-label">
                  <ActivityIcon size={16} />
                  Experience
                </div>
                <div className="info-value">
                  {user.playerProfile.experienceYears} year{user.playerProfile.experienceYears > 1 ? 's' : ''}
                </div>
              </div>
            )}

            <div className="info-item">
              <div className="info-label">
                <CheckCircleIcon size={16} />
                Available as Substitute
              </div>
              <div className="info-value">
                {user.playerProfile.availableAsSubstitute ? (
                  <span className="status-yes">
                    <CheckCircleIcon size={16} /> Yes
                  </span>
                ) : (
                  <span className="status-no">
                    <XCircleIcon size={16} /> No
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="profile-actions">
        <button className="action-btn edit-btn" onClick={() => navigate('/mobile/edit-profile')}>
          <EditIcon size={18} />
          Edit Profile
        </button>

        <button className="action-btn settings-btn" onClick={() => navigate('/mobile/settings')}>
          <SettingsIcon size={18} />
          Settings
        </button>

        <button
          className="action-btn logout-btn"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOutIcon size={18} />
          Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertIcon size={48} />
            </div>
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
