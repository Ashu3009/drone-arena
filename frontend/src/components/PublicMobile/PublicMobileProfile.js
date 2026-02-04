import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { getPlayerProfile } from '../../services/api';
import './PublicMobileProfile.css';

// ========== SVG ICONS ==========
const AvatarIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="#F97316" strokeWidth="1.5"/>
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const MatchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#3B82F6" strokeWidth="2"/>
    <path d="M12 7v5l3 3" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const WinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M9 12l2 2 4-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="9" stroke="#10B981" strokeWidth="2"/>
  </svg>
);

const AvgIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 3v18h18" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 17l4-5 4 3 5-7" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HighIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M13 3l3 7h7l-5.5 4.5 2 7L13 17l-6.5 4.5 2-7L3 10h7l3-7z" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinejoin="round"/>
  </svg>
);

const TrophySmallIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 15c3.866 0 7-3.134 7-7V5H5v3c0 3.866 3.134 7 7 7z" stroke="#F59E0B" strokeWidth="2"/>
    <path d="M12 15v4m-4 0h8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MedalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="14" r="6" stroke="#F97316" strokeWidth="2"/>
    <path d="M9 3l-1 5m7-5l1 5" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 11v3l2 1" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 17l5-5-5-5M21 12H9" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DroneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="10" width="6" height="4" rx="1" stroke="#3B82F6" strokeWidth="2"/>
    <circle cx="6" cy="6" r="2" stroke="#3B82F6" strokeWidth="1.5"/>
    <circle cx="18" cy="6" r="2" stroke="#3B82F6" strokeWidth="1.5"/>
    <circle cx="6" cy="18" r="2" stroke="#3B82F6" strokeWidth="1.5"/>
    <circle cx="18" cy="18" r="2" stroke="#3B82F6" strokeWidth="1.5"/>
    <path d="M9 10L6 6M15 10L18 6M9 14L6 18M15 14L18 18" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TeamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="3" stroke="#8B5CF6" strokeWidth="1.5"/>
    <circle cx="15" cy="7" r="3" stroke="#8B5CF6" strokeWidth="1.5"/>
    <path d="M3 21c0-3.5 2.5-6 6-6 1 0 2 .3 3 .8M12 15.8c1-.5 2-.8 3-.8 3.5 0 6 2.5 6 6" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const FlagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="5" fill="#FF9933"/>
    <rect x="4" y="9" width="16" height="6" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="0.5"/>
    <rect x="4" y="15" width="16" height="5" fill="#138808"/>
    <circle cx="12" cy="12" r="2" stroke="#000080" strokeWidth="1" fill="none"/>
  </svg>
);

// ========== MAIN COMPONENT ==========
const PublicMobileProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useUserAuth();

  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Fetch player profile when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfileData();
    }
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfileData = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await getPlayerProfile();
      if (response.success) {
        setProfileData(response.data);
      } else {
        setProfileError('Failed to load profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setProfileError('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="profile-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Show loading while fetching profile data
    if (profileLoading && !profileData) {
      return (
        <div className="profile-container">
          <div className="profile-loading">
            <div className="profile-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      );
    }

    // Destructure profile data with fallbacks
    const profile = profileData?.profile || {};
    const stats = profileData?.stats || { matchesPlayed: 0, wins: 0, avgScore: 0, highestScore: 0 };
    const seasons = profileData?.seasons || [];
    const tournaments = profileData?.tournaments || [];
    const recentMatches = profileData?.recentMatches || [];
    const awards = profileData?.awards || { motm: 0, mott: 0, bestRole: 0 };

    const teamName = profile.team ? profile.team.name : 'No Team';
    const playerRole = profile.role || 'Player';

    return (
      <div className="profile-container">

        {/* Error Banner */}
        {profileError && (
          <div className="profile-error-banner">
            <p>{profileError}</p>
            <button onClick={fetchProfileData}>Retry</button>
          </div>
        )}

        {/* ========== PROFILE HEADER (Cover Style) ========== */}
        <div className="profile-cover-wrapper">
          <div className="profile-cover-bg"></div>
          <div className="profile-cover-avatar">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="profile-cover-info">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-team-role">{teamName}  <span className="profile-dot">•</span>  {playerRole}</p>
          </div>
        </div>

        {/* ========== STATS ROW ========== */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <MatchIcon />
            <span className="profile-stat-value">{stats.matchesPlayed}</span>
            <span className="profile-stat-label">Matches</span>
          </div>
          <div className="profile-stat-card">
            <WinIcon />
            <span className="profile-stat-value">{stats.wins}</span>
            <span className="profile-stat-label">Wins</span>
          </div>
          <div className="profile-stat-card">
            <AvgIcon />
            <span className="profile-stat-value">{stats.avgScore}</span>
            <span className="profile-stat-label">Avg Pts</span>
          </div>
          <div className="profile-stat-card">
            <HighIcon />
            <span className="profile-stat-value">{stats.highestScore}</span>
            <span className="profile-stat-label">Highest</span>
          </div>
        </div>

        {/* ========== SEASON STATS ========== */}
        <div className="profile-section">
          <h2 className="profile-section-title">Season Stats</h2>
          <div className="profile-season-table">
            <div className="profile-season-header">
              <span>Year</span>
              <span>Matches</span>
              <span>Wins</span>
              <span>Avg</span>
            </div>
            {seasons.length > 0 ? seasons.map((season, i) => (
              <div key={i} className="profile-season-row">
                <span className="profile-season-year">{season.year}</span>
                <span>{season.matches}</span>
                <span>{season.wins}</span>
                <span className="profile-season-avg">{season.avgScore}</span>
              </div>
            )) : (
              <>
                <div className="profile-season-row profile-row-muted">
                  <span className="profile-season-year">2026</span>
                  <span>0</span>
                  <span>0</span>
                  <span className="profile-season-avg">0.0</span>
                </div>
                <div className="profile-season-row profile-row-muted">
                  <span className="profile-season-year">2025</span>
                  <span>0</span>
                  <span>0</span>
                  <span className="profile-season-avg">0.0</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========== TOURNAMENTS ========== */}
        <div className="profile-section">
          <h2 className="profile-section-title">Tournaments Played</h2>
          <div className="profile-tournament-list">
            {tournaments.length > 0 ? tournaments.map((t, i) => {
              const statusClass = t.placement === 'Champion' ? 'gold'
                : t.placement === 'Runner Up' ? 'silver'
                : t.placement === '3rd Place' ? 'bronze' : 'default';
              return (
                <div key={i} className="profile-tournament-item">
                  <TrophySmallIcon />
                  <div className="profile-tournament-info">
                    <span className="profile-tournament-name">{t.name}</span>
                    <span className={`profile-tournament-result profile-result-${statusClass}`}>
                      {t.placement}
                    </span>
                  </div>
                  <ChevronIcon />
                </div>
              );
            }) : (
              <>
                <div className="profile-tournament-item profile-row-muted">
                  <TrophySmallIcon />
                  <div className="profile-tournament-info">
                    <span className="profile-tournament-name">Awaiting Tournament</span>
                    <span className="profile-tournament-result profile-result-default">Upcoming</span>
                  </div>
                  <ChevronIcon />
                </div>
                <div className="profile-tournament-item profile-row-muted">
                  <TrophySmallIcon />
                  <div className="profile-tournament-info">
                    <span className="profile-tournament-name">Awaiting Tournament</span>
                    <span className="profile-tournament-result profile-result-default">Upcoming</span>
                  </div>
                  <ChevronIcon />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========== RECENT MATCHES ========== */}
        <div className="profile-section">
          <h2 className="profile-section-title">Matches Played</h2>
          <div className="profile-matches-list">
            {recentMatches.length > 0 ? recentMatches.map((m, i) => (
              <div key={i} className="profile-match-item">
                <span className="profile-match-opponent">{m.opponent.name}</span>
                <span className="profile-match-score">{m.myScore} - {m.oppScore}</span>
                <span className={`profile-match-result profile-match-${m.result}`}>
                  {m.result}
                </span>
              </div>
            )) : (
              <>
                <div className="profile-match-item profile-row-muted">
                  <span className="profile-match-opponent">Awaiting Match</span>
                  <span className="profile-match-score">0 - 0</span>
                  <span className="profile-match-result profile-match-none">--</span>
                </div>
                <div className="profile-match-item profile-row-muted">
                  <span className="profile-match-opponent">Awaiting Match</span>
                  <span className="profile-match-score">0 - 0</span>
                  <span className="profile-match-result profile-match-none">--</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========== AWARDS ========== */}
        <div className="profile-section">
          <h2 className="profile-section-title">Awards</h2>
          <div className="profile-awards-grid">
            <div className="profile-award-card">
              <MedalIcon />
              <span className="profile-award-count">{awards.motm}x</span>
              <span className="profile-award-title">MOTM</span>
            </div>
            <div className="profile-award-card">
              <MedalIcon />
              <span className="profile-award-count">{awards.mott}x</span>
              <span className="profile-award-title">MOTT</span>
            </div>
            <div className="profile-award-card">
              <MedalIcon />
              <span className="profile-award-count">{awards.bestRole}x</span>
              <span className="profile-award-title">Best Role</span>
            </div>
          </div>
        </div>

        {/* ========== LOGOUT ========== */}
        <div className="profile-logout-section">
          <button
            className="profile-logout-btn"
            onClick={async () => {
              await logout();
              navigate('/watch');
            }}
          >
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>

      </div>
    );
  }

  // ========== NOT LOGGED IN ==========
  const features = [
    {
      icon: <TrophySmallIcon />,
      title: 'Tournament Stats',
      description: 'Track wins and rankings'
    },
    {
      icon: <DroneIcon />,
      title: 'Drone Management',
      description: 'Register and monitor drones'
    },
    {
      icon: <MatchIcon />,
      title: 'Match Reports',
      description: 'View detailed analytics'
    },
    {
      icon: <TeamIcon />,
      title: 'Team Play',
      description: 'Join or create teams'
    }
  ];

  return (
    <div className="profile-container">
      {/* Hero */}
      <div className="profile-guest-hero">
        <div className="profile-guest-icon">
          <AvatarIcon />
        </div>
        <h1 className="profile-guest-title">DroneNova</h1>
        <p className="profile-guest-subtitle">India's Premier Drone Soccer League</p>
      </div>

      {/* Features */}
      <div className="profile-guest-features">
        <h2 className="profile-section-title">Member Features</h2>
        <div className="profile-guest-feature-grid">
          {features.map((feature, i) => (
            <div key={i} className="profile-guest-feature-card">
              <div className="profile-guest-feature-icon">{feature.icon}</div>
              <h3 className="profile-guest-feature-title">{feature.title}</h3>
              <p className="profile-guest-feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA - Main Focus */}
      <div className="profile-cta-card">
        <div className="profile-cta-badge">Get Started</div>
        <h2 className="profile-cta-heading">Join India's First<br/>Drone Soccer League</h2>
        <p className="profile-cta-subtext">
          Sign in to track your matches, view stats,<br/>manage teams and compete in tournaments.
        </p>
        <div className="profile-cta-benefits">
          <div className="profile-cta-benefit">
            <WinIcon />
            <span>Track match results</span>
          </div>
          <div className="profile-cta-benefit">
            <AvgIcon />
            <span>View season stats</span>
          </div>
          <div className="profile-cta-benefit">
            <MedalIcon />
            <span>Earn awards & badges</span>
          </div>
        </div>
        <div className="profile-cta-actions">
          <button className="profile-cta-btn-signin" onClick={() => navigate('/admin/login')}>
            Sign In
          </button>
        </div>
        <p className="profile-cta-footer-note">
          <FlagIcon />
          <span>Made in India</span>
        </p>
      </div>

      {/* Stats Banner */}
      <div className="profile-guest-stats">
        <div className="profile-guest-stat">
          <span className="profile-guest-stat-value">100+</span>
          <span className="profile-guest-stat-label">Players</span>
        </div>
        <div className="profile-guest-stat-divider"></div>
        <div className="profile-guest-stat">
          <span className="profile-guest-stat-value">200+</span>
          <span className="profile-guest-stat-label">Matches</span>
        </div>
        <div className="profile-guest-stat-divider"></div>
        <div className="profile-guest-stat">
          <span className="profile-guest-stat-value">25+</span>
          <span className="profile-guest-stat-label">Tournaments</span>
        </div>
      </div>

      {/* Footer */}
      <div className="profile-guest-footer">
        <p>DroneNova Arena - India's Drone Soccer League</p>
      </div>
    </div>
  );
};

export default PublicMobileProfile;
