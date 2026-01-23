import React, { useState, useEffect } from 'react';
import { getCurrentMatch, getSiteStats } from '../../services/api';
import TimerDisplayPublic from '../Public/TimerDisplayPublic';
import Arena2D from './Arena2D';
import {
  TrophyIcon,
  TargetIcon,
  UsersIcon,
  DroneIcon,
  ChartIcon,
  GamepadIcon,
  TrendingUpIcon,
  ActivityIcon,
} from './icons';
import './MobileHome.css';

const MobileHome = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMatches: 0,
    activeTeams: 0,
    activeDrones: 16,
    totalTournaments: 0,
  });

  useEffect(() => {
    fetchCurrentMatch();
    fetchStats();
    const matchInterval = setInterval(fetchCurrentMatch, 5000);
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
      scheduled: { text: 'Upcoming', className: 'upcoming' },
      in_progress: { text: 'Live', className: 'live' },
      completed: { text: 'Completed', className: 'completed' },
    };
    return badges[status] || badges.scheduled;
  };

  const getCurrentRoundInfo = () => {
    if (!currentMatch) return null;
    const activeRound = currentMatch.rounds?.find((r) => r.status === 'in_progress');
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

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  return (
    <div className="mobile-home">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">DroneSoccer</h1>
        <p className="hero-subtitle">Live Arena</p>
      </div>

      {/* Main Content */}
      <div className="home-content">
        {/* Live Match Section */}
        {loading ? (
          <div className="match-loading">
            <div className="spinner" />
            <p>Loading match data...</p>
          </div>
        ) : currentMatch ? (
          <div className="match-section">
            {/* Match Header */}
            <div className="match-header">
              <div className="match-info">
                {currentMatch.tournament && (
                  <div className="tournament-badge">
                    <TrophyIcon size={14} />
                    <span>{currentMatch.tournament.name}</span>
                  </div>
                )}
                <div className="match-meta">
                  Match #{currentMatch.matchNumber} | Round {getCurrentRoundInfo()?.roundNumber || 1}/3
                </div>
              </div>
              <div className={`status-badge ${getStatusBadge(currentMatch.status).className}`}>
                {currentMatch.status === 'in_progress' && <span className="live-dot" />}
                {getStatusBadge(currentMatch.status).text}
              </div>
            </div>

            {/* Match Card */}
            <div className="match-card">
              {/* Teams & Score */}
              <div className="teams-display">
                {/* Team A */}
                <div className="team-block">
                  <div className="team-color" style={{ background: currentMatch.teamA?.color || '#EF4444' }} />
                  <div className="team-details">
                    <span className="team-name">{currentMatch.teamA?.name || 'Team A'}</span>
                    <div className="team-members">
                      {currentMatch.teamA?.members?.slice(0, 3).map((member, idx) => (
                        <div key={idx} className="member-avatar">
                          {member.photo ? (
                            <img
                              src={`${API_BASE}/${member.photo}`}
                              alt={member.name}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <span>{member.name?.[0] || '?'}</span>
                          )}
                        </div>
                      ))}
                      {currentMatch.teamA?.members?.length > 3 && (
                        <div className="member-avatar more">+{currentMatch.teamA.members.length - 3}</div>
                      )}
                    </div>
                  </div>
                  <div className="team-score">{getCurrentRoundInfo()?.scoreA || 0}</div>
                </div>

                {/* VS */}
                <div className="vs-badge">VS</div>

                {/* Team B */}
                <div className="team-block">
                  <div className="team-score">{getCurrentRoundInfo()?.scoreB || 0}</div>
                  <div className="team-details right">
                    <span className="team-name">{currentMatch.teamB?.name || 'Team B'}</span>
                    <div className="team-members">
                      {currentMatch.teamB?.members?.slice(0, 3).map((member, idx) => (
                        <div key={idx} className="member-avatar">
                          {member.photo ? (
                            <img
                              src={`${API_BASE}/${member.photo}`}
                              alt={member.name}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <span>{member.name?.[0] || '?'}</span>
                          )}
                        </div>
                      ))}
                      {currentMatch.teamB?.members?.length > 3 && (
                        <div className="member-avatar more">+{currentMatch.teamB.members.length - 3}</div>
                      )}
                    </div>
                  </div>
                  <div className="team-color" style={{ background: currentMatch.teamB?.color || '#3B82F6' }} />
                </div>
              </div>

              {/* Timer (if live) */}
              {currentMatch.status === 'in_progress' && (() => {
                const activeRound = currentMatch.rounds?.find((r) => r.status === 'in_progress');
                return activeRound && activeRound.timerStatus ? (
                  <div className="timer-section">
                    <TimerDisplayPublic round={activeRound} roundDuration={currentMatch.roundDuration || 3} />
                  </div>
                ) : null;
              })()}

              {/* Final Score (if completed) */}
              {currentMatch.status === 'completed' && (
                <div className="final-score">
                  <span className="final-label">Final Score</span>
                  <div className="final-scores">
                    <span>{currentMatch.finalScoreA || 0}</span>
                    <span className="score-divider">-</span>
                    <span>{currentMatch.finalScoreB || 0}</span>
                  </div>
                  {currentMatch.winner && (
                    <div className="winner-badge">
                      <TrophyIcon size={14} />
                      {currentMatch.winner.name} Wins!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2D Arena View */}
            <div className="arena-section">
              <h3 className="section-label">Arena View</h3>
              <Arena2D
                teamA={{
                  name: currentMatch.teamA?.name || 'Team A',
                  color: currentMatch.teamA?.color || '#EF4444',
                  drones: [],
                }}
                teamB={{
                  name: currentMatch.teamB?.name || 'Team B',
                  color: currentMatch.teamB?.color || '#3B82F6',
                  drones: [],
                }}
              />
            </div>
          </div>
        ) : (
          <div className="no-match">
            <div className="no-match-icon">
              <ActivityIcon size={48} />
            </div>
            <h3>No Live Match</h3>
            <p>No matches are currently in progress. Check back soon!</p>
          </div>
        )}

        {/* Stats Section */}
        <div className="stats-section">
          <h3 className="section-title">Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <TargetIcon size={20} />
              </div>
              <div className="stat-value">{stats.totalMatches || 0}</div>
              <div className="stat-label">Matches</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <UsersIcon size={20} />
              </div>
              <div className="stat-value">{stats.activeTeams || 0}</div>
              <div className="stat-label">Teams</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <DroneIcon size={20} />
              </div>
              <div className="stat-value">{stats.activeDrones || 16}</div>
              <div className="stat-label">Drones</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <TrophyIcon size={20} />
              </div>
              <div className="stat-value">{stats.totalTournaments || 0}</div>
              <div className="stat-label">Events</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h3 className="section-title">Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <ChartIcon size={24} />
              </div>
              <div className="feature-content">
                <h4>Real-time Analytics</h4>
                <p>Track drone performance with live telemetry</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <GamepadIcon size={24} />
              </div>
              <div className="feature-content">
                <h4>Live Streaming</h4>
                <p>Watch matches with real-time score updates</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUpIcon size={24} />
              </div>
              <div className="feature-content">
                <h4>Performance Reports</h4>
                <p>Detailed pilot reports and recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
