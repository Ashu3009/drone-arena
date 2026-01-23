import React, { useState, useEffect } from 'react';
import { getCurrentMatch, getSiteStats } from '../../services/api';
import {
  initSocket,
  joinMatch,
  leaveMatch,
  onScoreUpdated,
  onMatchCompleted,
  onTelemetry,
  onCurrentMatchUpdated,
  removeAllListeners,
} from '../../services/socket';
import Arena2D from '../Mobile/Arena2D';
import './PublicMobileHome.css';

// Professional Trophy Icon
const TrophyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C15.866 15 19 11.866 19 8V5H5V8C5 11.866 8.13401 15 12 15Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V19M12 19H8M12 19H16" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 5H21V7C21 8.65685 19.6569 10 18 10H19" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5H3V7C3 8.65685 4.34315 10 6 10H5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Professional Match/Game Icon
const GoalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="#F97316" strokeWidth="2"/>
    <path d="M12 3V21M21 12H3" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="4" stroke="#F97316" strokeWidth="2"/>
  </svg>
);

// Professional Team/Group Icon
const StageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="7" r="4" stroke="#10B981" strokeWidth="2"/>
    <path d="M20 8V14M23 11H17" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Professional Drone Icon
const DroneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="8" height="4" rx="1" stroke="#3B82F6" strokeWidth="2"/>
    <circle cx="5" cy="5" r="2" stroke="#3B82F6" strokeWidth="2"/>
    <circle cx="19" cy="5" r="2" stroke="#3B82F6" strokeWidth="2"/>
    <circle cx="5" cy="19" r="2" stroke="#3B82F6" strokeWidth="2"/>
    <circle cx="19" cy="19" r="2" stroke="#3B82F6" strokeWidth="2"/>
    <path d="M8 10L5 5M16 10L19 5M8 14L5 19M16 14L19 19" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Drone indicator
const DroneIndicator = ({ status }) => (
  <div className={`drone-indicator ${status === 'active' ? 'drone-active' : 'drone-inactive'}`}>
    D
  </div>
);

const PublicMobileHome = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [telemetryData, setTelemetryData] = useState(null);
  const [siteStats, setSiteStats] = useState({
    totalMatches: 0,
    activeTeams: 0,
    totalTournaments: 0,
    activeDrones: 0,
  });
  const [expandedFeature, setExpandedFeature] = useState(null);

  // Backend Integration
  useEffect(() => {
    initSocket();
    loadCurrentMatch();
    loadSiteStats();

    return () => {
      if (currentMatch) {
        leaveMatch(currentMatch._id);
      }
      removeAllListeners();
    };
  }, []);

  // Modal management - ESC key and body scroll
  useEffect(() => {
    if (expandedFeature) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // ESC key handler
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          setExpandedFeature(null);
        }
      };

      window.addEventListener('keydown', handleEsc);

      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [expandedFeature]);

  // Load site stats
  const loadSiteStats = async () => {
    try {
      const response = await getSiteStats();
      if (response.success && response.data) {
        setSiteStats(response.data);
      }
    } catch (error) {
      console.error('Error loading site stats:', error);
    }
  };

  useEffect(() => {
    if (!currentMatch) return;

    joinMatch(currentMatch._id);

    // Get initial scores from current/active round or final scores
    let initialScoreA = 0;
    let initialScoreB = 0;

    if (currentMatch.status === 'completed') {
      initialScoreA = currentMatch.finalScoreA || 0;
      initialScoreB = currentMatch.finalScoreB || 0;
    } else if (currentMatch.rounds && currentMatch.rounds.length > 0) {
      // Sum scores from all completed rounds + active round
      currentMatch.rounds.forEach(round => {
        initialScoreA += round.teamAScore || 0;
        initialScoreB += round.teamBScore || 0;
      });
    }

    console.log('🔢 Initial Scores Set:', { scoreA: initialScoreA, scoreB: initialScoreB });
    setScoreA(initialScoreA);
    setScoreB(initialScoreB);

    // Set up socket listeners
    onScoreUpdated((data) => {
      setScoreA(data.scoreA);
      setScoreB(data.scoreB);
    });

    onMatchCompleted((data) => {
      setCurrentMatch((prev) => ({ ...prev, status: 'completed', finalScoreA: data.scoreA, finalScoreB: data.scoreB }));
    });

    onTelemetry((data) => {
      setTelemetryData(data);
    });

    onCurrentMatchUpdated((data) => {
      setCurrentMatch(data);
    });

    return () => {
      leaveMatch(currentMatch._id);
      removeAllListeners();
    };
  }, [currentMatch?._id]);

  const loadCurrentMatch = async () => {
    try {
      console.log('🔍 Fetching current match...');
      console.log('📡 API URL:', process.env.REACT_APP_API_URL);
      const response = await getCurrentMatch();
      console.log('✅ API Response:', response);
      console.log('📦 Match Data:', response.data);
      setCurrentMatch(response.data);
    } catch (error) {
      console.error('❌ Error loading current match:', error);
      console.error('📍 Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const teamA = currentMatch?.teamA || { name: 'Team A', color: '#3B82F6' };
  const teamB = currentMatch?.teamB || { name: 'Team B', color: '#EF4444' };
  const isLive = currentMatch?.status === 'in_progress';
  const isCompleted = currentMatch?.status === 'completed';

  // Log match info for debugging
  console.log('⚽ Match Number:', currentMatch?.matchNumber || currentMatch?.round || 'N/A');
  console.log('🎯 Score A:', isCompleted ? currentMatch?.finalScoreA : scoreA);
  console.log('🎯 Score B:', isCompleted ? currentMatch?.finalScoreB : scoreB);
  console.log('📡 Match Status:', currentMatch?.status);

  // Drone status calculation
  const activeDronesA = telemetryData?.teamA?.length || 0;
  const activeDronesB = telemetryData?.teamB?.length || 0;
  const totalDrones = 4;

  // Ball position
  const ballPosition = telemetryData?.ball || { x: 50, y: 50 };

  // Get current round info
  const getCurrentRoundInfo = () => {
    console.log('📊 Current Match Data:', currentMatch);
    console.log('🔄 Rounds Data:', currentMatch?.rounds);
    console.log('🎯 Current Round Field:', currentMatch?.currentRound);

    // If no rounds array, try to get from other fields
    if (!currentMatch?.rounds || currentMatch.rounds.length === 0) {
      const fallbackRound = currentMatch?.currentRound || 1;
      const fallbackTotal = 3; // Default 3 rounds
      console.log(`⚠️ Using fallback: Round ${fallbackRound}/${fallbackTotal}`);
      return {
        roundNumber: fallbackRound,
        totalRounds: fallbackTotal
      };
    }

    // Use currentRound field from match if available
    const totalRounds = currentMatch.rounds.length;
    let roundNum = currentMatch.currentRound || 1;

    // Validate round number
    if (roundNum < 1) roundNum = 1;
    if (roundNum > totalRounds) roundNum = totalRounds;

    console.log(`✅ Dynamic Round Info: ${roundNum}/${totalRounds}`);
    return {
      roundNumber: roundNum,
      totalRounds: totalRounds,
    };
  };

  const roundInfo = getCurrentRoundInfo();

  // Get match stage name
  const getMatchStage = () => {
    const stage = currentMatch?.stage || currentMatch?.round;
    if (stage) return stage;

    // Derive from match number or round
    const matchNum = currentMatch?.matchNumber;
    if (matchNum === 1) return 'Final';
    if (matchNum <= 2) return 'Semi-Final';
    if (matchNum <= 4) return 'Quarter-Final';
    return `Round ${roundInfo.roundNumber}`;
  };

  // Get player initials (first letter of player names)
  const getPlayerInitials = (team) => {
    // Try to get players from multiple possible field names
    const players = team?.players || team?.members || team?.teamMembers || [];

    console.log('🔍 Team data for initials:', team);
    console.log('👥 Players found:', players);

    // If we have players, return their first letters
    if (players && players.length > 0) {
      return players.slice(0, totalDrones).map((player, idx) => {
        // Handle different player data structures
        const name = player?.name ||
                     player?.username ||
                     player?.playerName ||
                     player?.user?.name ||
                     player?.user?.username ||
                     '';

        const initial = name.charAt(0).toUpperCase();
        console.log(`Player ${idx}: ${name} -> ${initial}`);
        return initial || 'D';
      });
    }

    // Fallback: return D1, D2, D3, D4 if no player data
    console.warn('⚠️ No players found, using fallback initials');
    return Array(totalDrones).fill(null).map((_, idx) => `D${idx + 1}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading live match...</p>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="no-match-container">
        <TrophyIcon />
        <h2 className="no-match-title">No Live Match</h2>
        <p className="no-match-text">Check back soon for live drone soccer action!</p>
      </div>
    );
  }

  return (
    <div>
      {/* ========== HERO SECTION ========== */}
      <div className="hero-section">
        {/* Background Video */}
        {/* <video
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/PublicMobile/assets/videos/Hero_video_8.mp4" type="video/mp4" />
        </video> */}

        {/* Overlay Content */}
        {/* <div className="hero-overlay">
          <h1 className="hero-main-title">DroneSoccer</h1>
          <p className="hero-subtitle">LEAGUE</p>
        </div> */}
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <main className="home-main-content">

        {/* ========== CURRENT MATCH HEADER ========== */}
        <div className="current-match-section-header">
          <h2 className="current-match-section-title">Current Match</h2>
          {isLive && (
            <div className="live-badge-pulsing">
              <span className="live-text-badge">LIVE</span>
            </div>
          )}
        </div>

        {/* ========== TOURNAMENT BAR ========== */}
        <div className="tournament-bar">
          <TrophyIcon />
          <h2 className="tournament-name">
            {currentMatch.tournament?.name || 'Tournament'}
          </h2>
        </div>

        {/* ========== MATCH CONTENT ========== */}
        <div className="match-content">
            {/* Match Info Header - Match Number + Round Badge */}
            <div className="match-info-header">
              <p className="match-number">
                MATCH #{currentMatch.matchNumber || currentMatch.matchNo || currentMatch.round || currentMatch._id?.slice(-4) || '—'}
              </p>
              <div className="round-badge">
                Round {roundInfo.roundNumber}/{roundInfo.totalRounds}
              </div>
            </div>

            {/* Team A Card */}
            <div className="team-card">
              <div className="team-info">
                <h3 className="team-name">{teamA.name}</h3>
                <div className="drone-indicators-row">
                  {getPlayerInitials(teamA).map((initial, idx) => (
                    <div
                      key={idx}
                      className={`drone-indicator ${idx < activeDronesA ? 'drone-active' : 'drone-inactive'}`}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
              </div>
              <span className="team-score">
                {isCompleted ? (currentMatch.finalScoreA ?? currentMatch.scoreA ?? 0) : (scoreA ?? currentMatch.scoreA ?? 0)}
              </span>
            </div>

            {/* VS Badge */}
            <div className="vs-badge-container">
              <div className="vs-badge">vs</div>
            </div>

            {/* Team B Card */}
            <div className="team-card">
              <div className="team-info">
                <h3 className="team-name">{teamB.name}</h3>
                <div className="drone-indicators-row">
                  {getPlayerInitials(teamB).map((initial, idx) => (
                    <div
                      key={idx}
                      className={`drone-indicator ${idx < activeDronesB ? 'drone-active' : 'drone-inactive'}`}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
              </div>
              <span className="team-score">
                {isCompleted ? (currentMatch.finalScoreB ?? currentMatch.scoreB ?? 0) : (scoreB ?? currentMatch.scoreB ?? 0)}
              </span>
            </div>

            {/* Match Result */}
            {isCompleted && (
              <div className="match-result">
                {currentMatch.finalScoreA > currentMatch.finalScoreB
                  ? `${teamA.name} Wins!`
                  : currentMatch.finalScoreB > currentMatch.finalScoreA
                  ? `${teamB.name} Wins!`
                  : "It's a Draw!"}
              </div>
            )}
          </div>

        {/* ========== 2D ARENA SECTION ========== */}
        <div className="arena-section">
          <h3 className="arena-header">Live Arena View</h3>
          <Arena2D
            teamA={{
              name: teamA.name,
              color: teamA.color,
              drones: telemetryData?.teamA || [],
            }}
            teamB={{
              name: teamB.name,
              color: teamB.color,
              drones: telemetryData?.teamB || [],
            }}
            ballPosition={ballPosition}
            showBall={isLive}
          />
        </div>

        {/* ========== QUICK STATS SECTION ========== */}
        <div className="stats-section">
          <h2 className="stats-header">Quick Stats</h2>
          <div className="stats-grid">
            {/* Total Matches */}
            <div className="stat-card">
              <div className="stat-icon-wrapper orange">
                <GoalIcon />
              </div>
              <div className="stat-content">
                <div className="stat-value">{siteStats.totalMatches || 0}</div>
                <div className="stat-label">Total Matches</div>
              </div>
            </div>

            {/* Active Teams */}
            <div className="stat-card">
              <div className="stat-icon-wrapper green">
                <StageIcon />
              </div>
              <div className="stat-content">
                <div className="stat-value">{siteStats.activeTeams || 0}</div>
                <div className="stat-label">Active Teams</div>
              </div>
            </div>

            {/* Active Drones */}
            <div className="stat-card">
              <div className="stat-icon-wrapper blue">
                <DroneIcon />
              </div>
              <div className="stat-content">
                <div className="stat-value">{siteStats.activeDrones || 0}</div>
                <div className="stat-label">Active Drones</div>
              </div>
            </div>

            {/* Tournaments */}
            <div className="stat-card">
              <div className="stat-icon-wrapper saffron">
                <TrophyIcon />
              </div>
              <div className="stat-content">
                <div className="stat-value">{siteStats.totalTournaments || 0}</div>
                <div className="stat-label">Tournaments</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== FEATURES SECTION ========== */}
        <div className="features-section">
          <h2 className="features-header">Features</h2>
          <div className="features-grid">
            {/* Real-time Analytics */}
            <div
              className="feature-card"
              onClick={() => setExpandedFeature('analytics')}
            >
              <div className="feature-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 20V10" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 20V4" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 20V14" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-content">
                <h4 className="feature-title">Real-time Analytics</h4>
                <p className="feature-description">Live performance tracking</p>
              </div>
              <svg className="feature-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Live Streaming */}
            <div
              className="feature-card"
              onClick={() => setExpandedFeature('streaming')}
            >
              <div className="feature-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="#10B981" strokeWidth="2"/>
                </svg>
              </div>
              <div className="feature-content">
                <h4 className="feature-title">Live Streaming</h4>
                <p className="feature-description">Watch matches in real-time</p>
              </div>
              <svg className="feature-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Performance Reports */}
            <div
              className="feature-card"
              onClick={() => setExpandedFeature('reports')}
            >
              <div className="feature-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 6H23V12" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-content">
                <h4 className="feature-title">Performance Reports</h4>
                <p className="feature-description">Detailed pilot analytics</p>
              </div>
              <svg className="feature-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </main>

      {/* ========== FEATURE DETAILS MODAL ========== */}
      {expandedFeature && (
        <div className="feature-modal-overlay" onClick={() => setExpandedFeature(null)}>
          <div className="feature-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className="modal-close" onClick={() => setExpandedFeature(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Real-time Analytics Details */}
            {expandedFeature === 'analytics' && (
              <div className="feature-modal-content">
                <div className="modal-header">
                  <div className="modal-icon blue">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 20V10" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 20V4" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 20V14" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="modal-title">Real-time Analytics</h3>
                </div>

                <p className="modal-subtitle">What We Track:</p>

                <div className="modal-list">
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Position Data:</h4>
                    <p className="list-item-description">Real-time X, Y, Z coordinates with sub-meter accuracy for precise drone location tracking during matches.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Velocity Metrics:</h4>
                    <p className="list-item-description">Speed, acceleration, and directional movement analysis to monitor drone agility and responsiveness.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Role Performance:</h4>
                    <p className="list-item-description">Forward, Striker, Defender, and Goalkeeper positioning effectiveness with heat maps and coverage analysis.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Hit Detection:</h4>
                    <p className="list-item-description">Successful hits, misses, and contact accuracy metrics for improved shooting and defensive strategies.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Energy Levels:</h4>
                    <p className="list-item-description">Battery consumption monitoring, power efficiency ratings, and estimated flight time remaining alerts.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Live Streaming Details */}
            {expandedFeature === 'streaming' && (
              <div className="feature-modal-content">
                <div className="modal-header">
                  <div className="modal-icon green">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="#10B981" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="modal-title">Live Streaming</h3>
                </div>

                <p className="modal-subtitle">What You Get:</p>

                <div className="modal-list">
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Live Arena Visualization:</h4>
                    <p className="list-item-description">2D top-down view with real-time drone positions, ball tracking, and goal ring highlights.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Real-time Score Updates:</h4>
                    <p className="list-item-description">Instant score changes, round progression, and match status updates as they happen.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Instant Goal Notifications:</h4>
                    <p className="list-item-description">Immediate alerts when goals are scored with team celebration animations and replay indicators.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Match Progress Tracking:</h4>
                    <p className="list-item-description">Round timer, current stage display, and live statistics dashboard for complete match awareness.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Multi-angle Views:</h4>
                    <p className="list-item-description">Switch between arena overview, team focus, and goal zone perspectives during live matches.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Reports Details */}
            {expandedFeature === 'reports' && (
              <div className="feature-modal-content">
                <div className="modal-header">
                  <div className="modal-icon orange">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 6H23V12" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="modal-title">Performance Reports</h3>
                </div>

                <p className="modal-subtitle">Detailed Insights:</p>

                <div className="modal-list">
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Match Statistics:</h4>
                    <p className="list-item-description">Comprehensive post-match data including goals, assists, saves, and possession percentages.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Performance Metrics:</h4>
                    <p className="list-item-description">Advanced analytics on flight efficiency, reaction times, accuracy ratings, and consistency scores.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Personalized Recommendations:</h4>
                    <p className="list-item-description">AI-driven suggestions for improving piloting technique, positioning, and strategic decision-making.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Skill Improvement Tracking:</h4>
                    <p className="list-item-description">Progress charts showing growth over time in key areas like accuracy, speed control, and teamwork.</p>
                  </div>
                  <div className="modal-list-item">
                    <h4 className="list-item-title">Comparative Analysis:</h4>
                    <p className="list-item-description">Benchmark your performance against team averages and top players in the league.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMobileHome;
