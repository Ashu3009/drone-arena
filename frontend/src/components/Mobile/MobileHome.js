import React, { useState, useEffect } from 'react';
import { getCurrentMatch, getSiteStats } from '../../services/api';
import TimerDisplayPublic from '../Public/TimerDisplayPublic';
import './MobileHome.css';

const MobileHome = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMatches: 0,
    activeTeams: 0,
    activeDrones: 16,
    totalTournaments: 0
  });
  const [selectedFeature, setSelectedFeature] = useState(null);

  useEffect(() => {
    fetchCurrentMatch();
    fetchStats();
    // Poll every 5 seconds for match updates
    const matchInterval = setInterval(fetchCurrentMatch, 5000);
    // Poll every 30 seconds for stats updates
    const statsInterval = setInterval(fetchStats, 30000);
    return () => {
      clearInterval(matchInterval);
      clearInterval(statsInterval);
    };
  }, []);

  const fetchCurrentMatch = async () => {
    try {
      const response = await getCurrentMatch();
      if (response.data) {
        setCurrentMatch(response.data);
        // Debug: Check if member photos are coming from backend
        console.log('📸 Team A Members:', response.data.teamA?.members);
        console.log('📸 Team B Members:', response.data.teamB?.members);
      }
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setCurrentMatch(null);
      }
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getSiteStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { text: 'Upcoming', color: '#3b82f6' },
      in_progress: { text: 'Live', color: '#ef4444' },
      completed: { text: 'Completed', color: '#10b981' },
    };
    return badges[status] || badges.scheduled;
  };

  const getCurrentRoundInfo = () => {
    if (!currentMatch) return null;

    const activeRound = currentMatch.rounds?.find(r => r.status === 'in_progress');
    if (activeRound) {
      return {
        roundNumber: activeRound.roundNumber,
        scoreA: activeRound.teamAScore,
        scoreB: activeRound.teamBScore,
      };
    }

    return {
      roundNumber: currentMatch.currentRound || 1,
      scoreA: currentMatch.finalScoreA || 0,
      scoreB: currentMatch.finalScoreB || 0,
    };
  };

  return (
    <div className="mobile-home">
      {/* Hero Section - Always visible */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">DroneNova</h1>
          <p className="hero-subtitle">Live Drone Combat Arena</p>
        </div>
        <div className="hero-pattern"></div>
      </div>

      {/* Live Match Section */}
      {loading ? (
        <div className="live-match-section">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading match data...</p>
          </div>
        </div>
      ) : currentMatch ? (
        <div className="live-match-section">
          <div className="section-header">
            <h2 className="section-title">Current Match</h2>
            <span
              className="status-badge live-badge"
              style={{ backgroundColor: getStatusBadge(currentMatch.status).color }}
            >
              <span className="pulse-dot"></span>
              {getStatusBadge(currentMatch.status).text}
            </span>
          </div>

          <div className="match-card">
            {/* Tournament Name - Prominent Display */}
            {currentMatch.tournament && (
              <div className="tournament-header">
                <span className="tournament-icon">🏆</span>
                <span className="tournament-name">{currentMatch.tournament.name}</span>
              </div>
            )}

            {/* Match Number & Round */}
            <div className="match-header">
              <div className="match-number">Match #{currentMatch.matchNumber}</div>
              <div className="round-info">
                Round {getCurrentRoundInfo()?.roundNumber || 1}/3
              </div>
            </div>

            {/* Teams Display */}
            <div className="teams-container">
              {/* Team A */}
              <div className="team-section">
                <div
                  className="team-color-bar"
                  style={{ backgroundColor: currentMatch.teamA?.color || '#dc2626' }}
                ></div>
                <div className="team-info">
                  <h3 className="team-name">{currentMatch.teamA?.name || 'Team A'}</h3>
                  <div className="team-members">
                    {currentMatch.teamA?.members?.slice(0, 3).map((member, idx) => (
                      <div key={idx} className="member-avatar">
                        {member.photo ? (
                          <img
                            src={`http://localhost:5000/${member.photo}`}
                            alt={member.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<div class="avatar-placeholder">${member.name[0]}</div>`;
                            }}
                          />
                        ) : (
                          <div className="avatar-placeholder">{member.name[0]}</div>
                        )}
                      </div>
                    ))}
                    {currentMatch.teamA?.members?.length > 3 && (
                      <div className="member-avatar more">
                        +{currentMatch.teamA.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                <div className="team-score">
                  {getCurrentRoundInfo()?.scoreA || 0}
                </div>
              </div>

              {/* VS Divider */}
              <div className="vs-divider">
                <div className="vs-circle">VS</div>
              </div>

              {/* Team B */}
              <div className="team-section">
                <div
                  className="team-color-bar"
                  style={{ backgroundColor: currentMatch.teamB?.color || '#2563eb' }}
                ></div>
                <div className="team-info">
                  <h3 className="team-name">{currentMatch.teamB?.name || 'Team B'}</h3>
                  <div className="team-members">
                    {currentMatch.teamB?.members?.slice(0, 3).map((member, idx) => (
                      <div key={idx} className="member-avatar">
                        {member.photo ? (
                          <img
                            src={`http://localhost:5000/${member.photo}`}
                            alt={member.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<div class="avatar-placeholder">${member.name[0]}</div>`;
                            }}
                          />
                        ) : (
                          <div className="avatar-placeholder">{member.name[0]}</div>
                        )}
                      </div>
                    ))}
                    {currentMatch.teamB?.members?.length > 3 && (
                      <div className="member-avatar more">
                        +{currentMatch.teamB.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                <div className="team-score">
                  {getCurrentRoundInfo()?.scoreB || 0}
                </div>
              </div>
            </div>

            {/* Timer Display (if round is active) */}
            {currentMatch.status === 'in_progress' && (() => {
              const activeRound = currentMatch.rounds?.find(r => r.status === 'in_progress');
              return activeRound && activeRound.timerStatus ? (
                <div style={{ marginTop: '20px' }}>
                  <TimerDisplayPublic
                    round={activeRound}
                    roundDuration={currentMatch.roundDuration || 3}
                  />
                </div>
              ) : null;
            })()}

            {/* Final Score (if completed) */}
            {currentMatch.status === 'completed' && (
              <div className="final-score-banner">
                <div className="final-score-label">Final Score</div>
                <div className="final-score-display">
                  <span className="final-score-team-a">
                    {currentMatch.finalScoreA || 0}
                  </span>
                  <span className="final-score-separator">-</span>
                  <span className="final-score-team-b">
                    {currentMatch.finalScoreB || 0}
                  </span>
                </div>
                {currentMatch.winner && (
                  <div className="winner-badge">
                    🏆 {currentMatch.winner.name} Wins!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-match-section">
          <div className="no-match-card">
            <div className="no-match-icon">📡</div>
            <h3 className="no-match-title">No Live Match</h3>
            <p className="no-match-text">
              No matches are currently in progress. Check back soon!
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats Section - Dynamic */}
      <div className="quick-stats-section">
        <h2 className="section-title">Quick Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{stats.totalMatches || 0}</div>
            <div className="stat-label">Total Matches</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.activeTeams || 0}</div>
            <div className="stat-label">Active Teams</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚁</div>
            <div className="stat-value">{stats.activeDrones || 16}</div>
            <div className="stat-label">Active Drones</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{stats.totalTournaments || 0}</div>
            <div className="stat-label">Tournaments</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2 className="section-title">Features</h2>
        <div className="features-list">
          <div
            className="feature-item"
            onClick={() => setSelectedFeature('analytics')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon">📊</div>
            <div className="feature-content">
              <h4 className="feature-title">Real-time Analytics</h4>
              <p className="feature-description">
                Track drone performance with live telemetry and AI-powered insights
              </p>
              <span style={{ color: '#3b82f6', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Tap for more details →
              </span>
            </div>
          </div>
          <div
            className="feature-item"
            onClick={() => setSelectedFeature('streaming')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon">🎮</div>
            <div className="feature-content">
              <h4 className="feature-title">Live Match Streaming</h4>
              <p className="feature-description">
                Watch matches unfold with real-time score updates and 3D visualization
              </p>
              <span style={{ color: '#3b82f6', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Tap for more details →
              </span>
            </div>
          </div>
          <div
            className="feature-item"
            onClick={() => setSelectedFeature('reports')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon">📈</div>
            <div className="feature-content">
              <h4 className="feature-title">Performance Reports</h4>
              <p className="feature-description">
                Detailed pilot reports with recommendations for improvement
              </p>
              <span style={{ color: '#3b82f6', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Tap for more details →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="modal-overlay" onClick={() => setSelectedFeature(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedFeature === 'analytics' && '📊 Real-time Analytics'}
                {selectedFeature === 'streaming' && '🎮 Live Match Streaming'}
                {selectedFeature === 'reports' && '📈 Performance Reports'}
              </h3>
              <button
                className="modal-close"
                onClick={() => setSelectedFeature(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {selectedFeature === 'analytics' && (
                <>
                  <h4 style={{ color: '#3b82f6', marginBottom: '10px' }}>What We Track:</h4>
                  <ul style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                    <li><strong>Position Data:</strong> Real-time X, Y, Z coordinates of all drones in 3D arena</li>
                    <li><strong>Velocity Metrics:</strong> Speed, acceleration, and movement patterns</li>
                    <li><strong>Role Performance:</strong> Forward, Striker, Defender, Central drone statistics</li>
                    <li><strong>Hit Detection:</strong> Successful hits, misses, and accuracy percentages</li>
                    <li><strong>Energy Levels:</strong> Battery consumption and efficiency analysis</li>
                  </ul>

                  <h4 style={{ color: '#10b981', marginTop: '20px', marginBottom: '10px' }}>AI-Powered Insights:</h4>
                  <ul style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                    <li>Movement pattern recognition and strategy analysis</li>
                    <li>Pilot performance scoring and ranking</li>
                    <li>Predictive analytics for match outcomes</li>
                    <li>Automated recommendations for improvement</li>
                  </ul>
                </>
              )}

              {selectedFeature === 'streaming' && (
                <>
                  <h4 style={{ color: '#3b82f6', marginBottom: '10px' }}>Live Features:</h4>
                  <ul style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                    <li><strong>Real-time Scores:</strong> Instant score updates via WebSocket connection</li>
                    <li><strong>3D Visualization:</strong> Interactive Three.js arena showing all 16 drones</li>
                    <li><strong>Round Timer:</strong> Live countdown with pause/resume/reset controls</li>
                    <li><strong>Team Indicators:</strong> Color-coded drones (Red vs Blue teams)</li>
                    <li><strong>Match Status:</strong> Scheduled, In Progress, Completed states</li>
                  </ul>

                  <h4 style={{ color: '#10b981', marginTop: '20px', marginBottom: '10px' }}>Interactive Controls:</h4>
                  <ul style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                    <li>Pan, zoom, and rotate 3D arena view</li>
                    <li>Select individual drones to view telemetry</li>
                    <li>Tournament leaderboard with live rankings</li>
                    <li>Match history and upcoming fixtures</li>
                  </ul>
                </>
              )}

              {selectedFeature === 'reports' && (
                <>
                  <h4 style={{ color: '#3b82f6', marginBottom: '10px' }}>Report Contents:</h4>
                  <ul style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                    <li><strong>Performance Metrics:</strong> Speed, hits, accuracy, consistency scores</li>
                    <li><strong>Visual Charts:</strong> Performance graphs and statistical breakdowns</li>
                    <li><strong>Role Analysis:</strong> Position-specific strengths and weaknesses</li>
                    <li><strong>Match Context:</strong> Tournament, teams, round details with Indian tricolor theme</li>
                    <li><strong>Comparative Data:</strong> Performance vs team average and opponents</li>
                  </ul>

                  <h4 style={{ color: '#f59e0b', marginTop: '20px', marginBottom: '10px' }}>AI Recommendations:</h4>
                  <ul style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                    <li>Personalized improvement suggestions</li>
                    <li>Training focus areas based on weaknesses</li>
                    <li>Strategic positioning advice</li>
                    <li>Equipment optimization tips</li>
                  </ul>

                  <h4 style={{ color: '#10b981', marginTop: '20px', marginBottom: '10px' }}>Export Options:</h4>
                  <ul style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                    <li>Download PDF reports with Indian flag colors</li>
                    <li>Round-wise performance tracking</li>
                    <li>Tournament aggregate reports</li>
                  </ul>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="modal-button-primary"
                onClick={() => setSelectedFeature(null)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHome;
