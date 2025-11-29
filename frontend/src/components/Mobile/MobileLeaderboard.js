import React, { useState, useEffect } from 'react';
import { getTeams, getCurrentMatch, getMatches, getTournamentById } from '../../services/api';
import './MobileLeaderboard.css';

const MobileLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('wins'); // wins, totalMatches, winRate
  const [currentTournament, setCurrentTournament] = useState(null);
  const [tournamentStats, setTournamentStats] = useState(null);
  const [teamStats, setTeamStats] = useState([]);

  useEffect(() => {
    fetchCurrentTournamentData();
  }, []);

  const fetchCurrentTournamentData = async () => {
    try {
      // 1. Get current match to find tournament
      const currentMatchResponse = await getCurrentMatch();
      console.log('Current Match Response:', currentMatchResponse);

      if (currentMatchResponse.data && currentMatchResponse.data.tournament) {
        const tournamentId = currentMatchResponse.data.tournament._id;

        // 2. Fetch tournament details
        const tournamentResponse = await getTournamentById(tournamentId);
        setCurrentTournament(tournamentResponse.data);
        console.log('Tournament:', tournamentResponse.data);

        // 3. Fetch all matches for this tournament
        const matchesResponse = await getMatches({ tournamentId });
        const tournamentMatches = matchesResponse.data || [];
        console.log('Tournament Matches:', tournamentMatches.length);

        // 4. Calculate team stats for this tournament
        const stats = calculateTournamentTeamStats(tournamentMatches);
        console.log('Team Stats:', stats);
        setTeamStats(stats);

        // 5. Calculate tournament-level stats
        const tStats = calculateTournamentStats(tournamentResponse.data, tournamentMatches);
        setTournamentStats(tStats);
      } else {
        console.log('No current match found');
        // Fallback: get last completed tournament
        const teamsResponse = await getTeams();
        setTeams(teamsResponse.data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching tournament data:', error);
      setLoading(false);
    }
  };

  const calculateTournamentTeamStats = (matches) => {
    const statsMap = {};

    matches.forEach(match => {
      if (match.teamA && match.teamB) {
        // Initialize team stats if not exists
        if (!statsMap[match.teamA._id]) {
          statsMap[match.teamA._id] = {
            team: match.teamA,
            wins: 0,
            losses: 0,
            draws: 0,
            totalMatches: 0,
            points: 0,
            winRate: 0
          };
        }
        if (!statsMap[match.teamB._id]) {
          statsMap[match.teamB._id] = {
            team: match.teamB,
            wins: 0,
            losses: 0,
            draws: 0,
            totalMatches: 0,
            points: 0,
            winRate: 0
          };
        }

        // Count stats for completed matches only
        if (match.status === 'completed' && match.finalScoreA !== undefined && match.finalScoreB !== undefined) {
          statsMap[match.teamA._id].totalMatches++;
          statsMap[match.teamB._id].totalMatches++;

          if (match.finalScoreA > match.finalScoreB) {
            statsMap[match.teamA._id].wins++;
            statsMap[match.teamA._id].points += 3;
            statsMap[match.teamB._id].losses++;
          } else if (match.finalScoreB > match.finalScoreA) {
            statsMap[match.teamB._id].wins++;
            statsMap[match.teamB._id].points += 3;
            statsMap[match.teamA._id].losses++;
          } else {
            statsMap[match.teamA._id].draws++;
            statsMap[match.teamB._id].draws++;
            statsMap[match.teamA._id].points++;
            statsMap[match.teamB._id].points++;
          }
        }
      }
    });

    // Calculate win rates
    Object.values(statsMap).forEach(stat => {
      if (stat.totalMatches > 0) {
        stat.winRate = Math.round((stat.wins / stat.totalMatches) * 100);
      }
    });

    return Object.values(statsMap);
  };

  const calculateTournamentStats = (tournament, matches) => {
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const totalMatches = matches.length;
    const remainingMatches = totalMatches - completedMatches;
    const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

    return {
      totalTeams: tournament.registeredTeams?.length || 0,
      totalMatches,
      completedMatches,
      remainingMatches,
      progress
    };
  };

  const getSortedTeams = () => {
    if (teamStats.length === 0) return [];

    return [...teamStats].sort((a, b) => {
      if (sortBy === 'wins') return b.wins - a.wins;
      if (sortBy === 'totalMatches') return b.totalMatches - a.totalMatches;
      if (sortBy === 'winRate') return b.winRate - a.winRate;
      return b.points - a.points;
    });
  };

  const getPodiumStat = (team) => {
    if (!team) return { value: 0, label: 'N/A' };

    if (sortBy === 'wins') {
      return { value: team.wins || 0, label: 'Wins' };
    } else if (sortBy === 'winRate') {
      return { value: `${team.winRate || 0}%`, label: 'Win Rate' };
    } else if (sortBy === 'totalMatches') {
      return { value: team.totalMatches || 0, label: 'Matches' };
    }
    return { value: team.wins || 0, label: 'Wins' };
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
  console.log('Sorted Teams for Podium:', sortedTeams.length, sortedTeams);

  // Debug team names
  if (sortedTeams.length > 0) {
    console.log('Team 1 Name:', sortedTeams[0]?.team?.name);
    if (sortedTeams[1]) console.log('Team 2 Name:', sortedTeams[1]?.team?.name);
    if (sortedTeams[2]) console.log('Team 3 Name:', sortedTeams[2]?.team?.name);
  }

  return (
    <div className="mobile-leaderboard">
      {/* Header */}
      <div className="leaderboard-header">
        <h1 className="page-title">Leaderboard</h1>
        {currentTournament && (
          <p className="page-subtitle">{currentTournament.name}</p>
        )}
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

      {/* Top 3 Podium - Shows available teams (1, 2, or 3) */}
      {sortedTeams.length > 0 && (
        <div className="podium-section">
          <div className="podium-container">
            {/* 2nd Place */}
            <div className={`podium-item second ${!sortedTeams[1] ? 'empty' : ''}`}>
              <div className="podium-rank">
                <span className="rank-emoji">🥈</span>
                <span className="rank-number">2nd</span>
              </div>
              {sortedTeams[1] ? (
                <>
                  <div
                    className="podium-team-color"
                    style={{ backgroundColor: sortedTeams[1].team?.color || '#94a3b8' }}
                  ></div>
                  <div className="podium-team-name">{sortedTeams[1].team?.name}</div>
                  <div className="podium-stats">
                    <div className="podium-stat-value">{getPodiumStat(sortedTeams[1]).value}</div>
                    <div className="podium-stat-label">{getPodiumStat(sortedTeams[1]).label}</div>
                  </div>
                </>
              ) : (
                <div className="podium-placeholder">
                  <div className="placeholder-icon">❓</div>
                  <div className="placeholder-text">Awaiting Team</div>
                </div>
              )}
            </div>

            {/* 1st Place */}
            <div className="podium-item first">
              <div className="podium-rank">
                <span className="rank-emoji">🥇</span>
                <span className="rank-number">1st</span>
              </div>
              <div
                className="podium-team-color"
                style={{ backgroundColor: sortedTeams[0]?.team?.color || '#fbbf24' }}
              ></div>
              <div className="podium-team-name">{sortedTeams[0]?.team?.name || 'Champion'}</div>
              <div className="podium-stats">
                <div className="podium-stat-value">{getPodiumStat(sortedTeams[0]).value}</div>
                <div className="podium-stat-label">{getPodiumStat(sortedTeams[0]).label}</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className={`podium-item third ${!sortedTeams[2] ? 'empty' : ''}`}>
              <div className="podium-rank">
                <span className="rank-emoji">🥉</span>
                <span className="rank-number">3rd</span>
              </div>
              {sortedTeams[2] ? (
                <>
                  <div
                    className="podium-team-color"
                    style={{ backgroundColor: sortedTeams[2].team?.color || '#f59e0b' }}
                  ></div>
                  <div className="podium-team-name">{sortedTeams[2].team?.name}</div>
                  <div className="podium-stats">
                    <div className="podium-stat-value">{getPodiumStat(sortedTeams[2]).value}</div>
                    <div className="podium-stat-label">{getPodiumStat(sortedTeams[2]).label}</div>
                  </div>
                </>
              ) : (
                <div className="podium-placeholder">
                  <div className="placeholder-icon">❓</div>
                  <div className="placeholder-text">Awaiting Team</div>
                </div>
              )}
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
              <div key={team.team?._id || index} className={`ranking-card ${rank <= 3 ? 'top-three' : ''}`}>
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
                  style={{ backgroundColor: team.team?.color || '#64748b' }}
                ></div>

                {/* Team Info */}
                <div className="ranking-info">
                  <h3 className="ranking-team-name">{team.team?.name}</h3>
                  <div className="ranking-location">
                    <span className="location-icon">📍</span>
                    {team.team?.location?.city || 'Unknown'}, {team.team?.location?.state || 'Unknown'}
                  </div>
                </div>

                {/* Stats */}
                <div className="ranking-stats">
                  <div className="stat-item">
                    <div className="stat-value">{team.wins || 0}</div>
                    <div className="stat-label">W</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{team.losses || 0}</div>
                    <div className="stat-label">L</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{team.draws || 0}</div>
                    <div className="stat-label">D</div>
                  </div>
                  <div className="stat-item win-rate">
                    <div className="stat-value">{team.winRate || 0}%</div>
                    <div className="stat-label">Win Rate</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Tournament Stats */}
      {currentTournament && tournamentStats && (
        <div className="stats-summary">
          <div className="tournament-stats-header">
            <h2 className="section-title">Tournament Statistics</h2>
            <div className="tournament-name-badge">{currentTournament.name}</div>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-value">{tournamentStats.totalTeams}</div>
              <div className="summary-label">Registered Teams</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">⚔️</div>
              <div className="summary-value">{tournamentStats.completedMatches}</div>
              <div className="summary-label">Matches Played</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📅</div>
              <div className="summary-value">{tournamentStats.remainingMatches}</div>
              <div className="summary-label">Matches Remaining</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🎯</div>
              <div className="summary-value">{tournamentStats.progress}%</div>
              <div className="summary-label">Tournament Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileLeaderboard;
