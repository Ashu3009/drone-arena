import React, { useState, useEffect } from 'react';
import { getCurrentMatch } from '../../services/api';
import './MobileHome.css';

const MobileHome = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentMatch();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchCurrentMatch, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentMatch = async () => {
    try {
      const response = await getCurrentMatch();
      if (response.data) {
        setCurrentMatch(response.data);
      }
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setCurrentMatch(null);
      }
      setLoading(false);
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

  if (loading) {
    return (
      <div className="mobile-home">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading match data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-home">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">DroneNova</h1>
          <p className="hero-subtitle">Live Drone Combat Arena</p>
        </div>
        <div className="hero-pattern"></div>
      </div>

      {/* Live Match Section */}
      {currentMatch ? (
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
                          <img src={member.photo} alt={member.name} />
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
                          <img src={member.photo} alt={member.name} />
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

            {/* Tournament Info */}
            {currentMatch.tournament && (
              <div className="tournament-tag">
                <span className="tournament-icon">🏆</span>
                {currentMatch.tournament.name}
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

      {/* Quick Stats Section */}
      <div className="quick-stats-section">
        <h2 className="section-title">Quick Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">156</div>
            <div className="stat-label">Total Matches</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">24</div>
            <div className="stat-label">Active Teams</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚁</div>
            <div className="stat-value">16</div>
            <div className="stat-label">Active Drones</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">8</div>
            <div className="stat-label">Tournaments</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2 className="section-title">Features</h2>
        <div className="features-list">
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <div className="feature-content">
              <h4 className="feature-title">Real-time Analytics</h4>
              <p className="feature-description">
                Track drone performance with live telemetry and AI-powered insights
              </p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🎮</div>
            <div className="feature-content">
              <h4 className="feature-title">Live Match Streaming</h4>
              <p className="feature-description">
                Watch matches unfold with real-time score updates and 3D visualization
              </p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📈</div>
            <div className="feature-content">
              <h4 className="feature-title">Performance Reports</h4>
              <p className="feature-description">
                Detailed pilot reports with recommendations for improvement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
