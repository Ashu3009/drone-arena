import React, { useState, useEffect } from 'react';
import { getTeams } from '../../services/api';
import './MobileLeaderboard.css';

const MobileLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('wins'); // wins, totalMatches, winRate

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await getTeams();
      if (response.data) {
        setTeams(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setLoading(false);
    }
  };

  const calculateWinRate = (wins, total) => {
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  const getSortedTeams = () => {
    const teamsWithStats = teams.map((team, index) => ({
      ...team,
      wins: Math.floor(Math.random() * 20) + 5, // Mock data
      losses: Math.floor(Math.random() * 10),
      draws: Math.floor(Math.random() * 5),
      totalMatches: 0,
      points: 0,
    }));

    teamsWithStats.forEach(team => {
      team.totalMatches = team.wins + team.losses + team.draws;
      team.points = (team.wins * 3) + team.draws;
      team.winRate = calculateWinRate(team.wins, team.totalMatches);
    });

    return teamsWithStats.sort((a, b) => {
      if (sortBy === 'wins') return b.wins - a.wins;
      if (sortBy === 'totalMatches') return b.totalMatches - a.totalMatches;
      if (sortBy === 'winRate') return b.winRate - a.winRate;
      return b.points - a.points;
    });
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', color: '#fbbf24' };
    if (rank === 2) return { emoji: '🥈', color: '#94a3b8' };
    if (rank === 3) return { emoji: '🥉', color: '#f59e0b' };
    return { emoji: rank, color: '#64748b' };
  };

  if (loading) {
    return (
      <div className="mobile-leaderboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const sortedTeams = getSortedTeams();

  return (
    <div className="mobile-leaderboard">
      {/* Header */}
      <div className="leaderboard-header">
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">Team Rankings & Statistics</p>
      </div>

      {/* Sort Options */}
      <div className="sort-options">
        <button
          className={`sort-btn ${sortBy === 'wins' ? 'active' : ''}`}
          onClick={() => setSortBy('wins')}
        >
          Most Wins
        </button>
        <button
          className={`sort-btn ${sortBy === 'winRate' ? 'active' : ''}`}
          onClick={() => setSortBy('winRate')}
        >
          Win Rate
        </button>
        <button
          className={`sort-btn ${sortBy === 'totalMatches' ? 'active' : ''}`}
          onClick={() => setSortBy('totalMatches')}
        >
          Most Active
        </button>
      </div>

      {/* Top 3 Podium */}
      {sortedTeams.length >= 3 && (
        <div className="podium-section">
          <div className="podium-container">
            {/* 2nd Place */}
            <div className="podium-item second">
              <div className="podium-rank">
                <span className="rank-emoji">🥈</span>
                <span className="rank-number">2nd</span>
              </div>
              <div
                className="podium-team-color"
                style={{ backgroundColor: sortedTeams[1]?.color || '#94a3b8' }}
              ></div>
              <div className="podium-team-name">{sortedTeams[1]?.name}</div>
              <div className="podium-stats">
                <div className="podium-stat-value">{sortedTeams[1]?.wins}</div>
                <div className="podium-stat-label">Wins</div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="podium-item first">
              <div className="podium-rank">
                <span className="rank-emoji">🥇</span>
                <span className="rank-number">1st</span>
              </div>
              <div
                className="podium-team-color"
                style={{ backgroundColor: sortedTeams[0]?.color || '#fbbf24' }}
              ></div>
              <div className="podium-team-name">{sortedTeams[0]?.name}</div>
              <div className="podium-stats">
                <div className="podium-stat-value">{sortedTeams[0]?.wins}</div>
                <div className="podium-stat-label">Wins</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="podium-item third">
              <div className="podium-rank">
                <span className="rank-emoji">🥉</span>
                <span className="rank-number">3rd</span>
              </div>
              <div
                className="podium-team-color"
                style={{ backgroundColor: sortedTeams[2]?.color || '#f59e0b' }}
              ></div>
              <div className="podium-team-name">{sortedTeams[2]?.name}</div>
              <div className="podium-stats">
                <div className="podium-stat-value">{sortedTeams[2]?.wins}</div>
                <div className="podium-stat-label">Wins</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="rankings-section">
        <h2 className="section-title">Full Rankings</h2>
        <div className="rankings-list">
          {sortedTeams.map((team, index) => {
            const rank = index + 1;
            const badge = getRankBadge(rank);

            return (
              <div key={team._id} className={`ranking-card ${rank <= 3 ? 'top-three' : ''}`}>
                {/* Rank */}
                <div className="ranking-rank" style={{ color: badge.color }}>
                  {typeof badge.emoji === 'string' && badge.emoji.includes('🥇') ? (
                    <span className="rank-medal">{badge.emoji}</span>
                  ) : (
                    <span className="rank-number">{rank}</span>
                  )}
                </div>

                {/* Team Color Bar */}
                <div
                  className="ranking-color-bar"
                  style={{ backgroundColor: team.color || '#64748b' }}
                ></div>

                {/* Team Info */}
                <div className="ranking-info">
                  <h3 className="ranking-team-name">{team.name}</h3>
                  <div className="ranking-location">
                    <span className="location-icon">📍</span>
                    {team.location?.city || 'Unknown'}, {team.location?.state || 'Unknown'}
                  </div>
                </div>

                {/* Stats */}
                <div className="ranking-stats">
                  <div className="stat-item">
                    <div className="stat-value">{team.wins}</div>
                    <div className="stat-label">W</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{team.losses}</div>
                    <div className="stat-label">L</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{team.draws}</div>
                    <div className="stat-label">D</div>
                  </div>
                  <div className="stat-item win-rate">
                    <div className="stat-value">{team.winRate}%</div>
                    <div className="stat-label">Win Rate</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <h2 className="section-title">Overall Statistics</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-value">{teams.length}</div>
            <div className="summary-label">Total Teams</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">⚔️</div>
            <div className="summary-value">
              {sortedTeams.reduce((sum, t) => sum + t.totalMatches, 0)}
            </div>
            <div className="summary-label">Matches Played</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🏆</div>
            <div className="summary-value">
              {sortedTeams[0]?.wins || 0}
            </div>
            <div className="summary-label">Most Wins</div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-value">
              {Math.round(sortedTeams.reduce((sum, t) => sum + t.winRate, 0) / teams.length)}%
            </div>
            <div className="summary-label">Avg Win Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLeaderboard;
