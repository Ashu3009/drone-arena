import React, { useState, useEffect } from 'react';
import { getTeams, getCurrentMatch, getMatches, getTournamentById } from '../../services/api';
import {
  MedalGoldIcon,
  MedalSilverIcon,
  MedalBronzeIcon,
  LocationIcon,
  UsersIcon,
  SwordsIcon,
  CalendarIcon,
  TargetIcon,
  AlertIcon,
  TrophyIcon,
} from './icons';
import './MobileLeaderboard.css';

const MobileLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('wins');
  const [currentTournament, setCurrentTournament] = useState(null);
  const [tournamentStats, setTournamentStats] = useState(null);
  const [teamStats, setTeamStats] = useState([]);

  useEffect(() => {
    fetchCurrentTournamentData();
  }, []);

  const fetchCurrentTournamentData = async () => {
    try {
      const currentMatchResponse = await getCurrentMatch();

      if (currentMatchResponse.data && currentMatchResponse.data.tournament) {
        const tournamentId = currentMatchResponse.data.tournament._id;

        const tournamentResponse = await getTournamentById(tournamentId);
        setCurrentTournament(tournamentResponse.data);

        const matchesResponse = await getMatches({ tournamentId });
        const tournamentMatches = matchesResponse.data || [];

        const stats = calculateTournamentTeamStats(tournamentMatches);
        setTeamStats(stats);

        const tStats = calculateTournamentStats(tournamentResponse.data, tournamentMatches);
        setTournamentStats(tStats);
      } else {
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

    matches.forEach((match) => {
      if (match.teamA && match.teamB) {
        if (!statsMap[match.teamA._id]) {
          statsMap[match.teamA._id] = {
            team: match.teamA,
            wins: 0,
            losses: 0,
            draws: 0,
            totalMatches: 0,
            points: 0,
            winRate: 0,
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
            winRate: 0,
          };
        }

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

    Object.values(statsMap).forEach((stat) => {
      if (stat.totalMatches > 0) {
        stat.winRate = Math.round((stat.wins / stat.totalMatches) * 100);
      }
    });

    return Object.values(statsMap);
  };

  const calculateTournamentStats = (tournament, matches) => {
    const completedMatches = matches.filter((m) => m.status === 'completed').length;
    const totalMatches = matches.length;
    const remainingMatches = totalMatches - completedMatches;
    const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

    return {
      totalTeams: tournament.registeredTeams?.length || 0,
      totalMatches,
      completedMatches,
      remainingMatches,
      progress,
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

  const getRankIcon = (rank) => {
    if (rank === 1) return <MedalGoldIcon size={20} />;
    if (rank === 2) return <MedalSilverIcon size={20} />;
    if (rank === 3) return <MedalBronzeIcon size={20} />;
    return null;
  };

  if (loading) {
    return (
      <div className="mobile-leaderboard">
        <div className="loading-container">
          <div className="spinner" />
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
        {currentTournament && <p className="page-subtitle">{currentTournament.name}</p>}
      </div>

      {/* Sort Options */}
      <div className="sort-section">
        <div className="sort-options">
          <button className={`sort-btn ${sortBy === 'wins' ? 'active' : ''}`} onClick={() => setSortBy('wins')}>
            Most Wins
          </button>
          <button className={`sort-btn ${sortBy === 'winRate' ? 'active' : ''}`} onClick={() => setSortBy('winRate')}>
            Win Rate
          </button>
          <button className={`sort-btn ${sortBy === 'totalMatches' ? 'active' : ''}`} onClick={() => setSortBy('totalMatches')}>
            Most Active
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {sortedTeams.length > 0 && (
        <div className="podium-section">
          <div className="podium-container">
            {/* 2nd Place */}
            <div className={`podium-item second ${!sortedTeams[1] ? 'empty' : ''}`}>
              <div className="podium-medal">
                <MedalSilverIcon size={32} />
              </div>
              <div className="podium-rank-label">2nd</div>
              {sortedTeams[1] ? (
                <>
                  <div className="podium-team-color" style={{ backgroundColor: sortedTeams[1].team?.color || '#94a3b8' }} />
                  <div className="podium-team-name">{sortedTeams[1].team?.name}</div>
                  <div className="podium-stats">
                    <div className="podium-stat-value">{getPodiumStat(sortedTeams[1]).value}</div>
                    <div className="podium-stat-label">{getPodiumStat(sortedTeams[1]).label}</div>
                  </div>
                </>
              ) : (
                <div className="podium-placeholder">
                  <AlertIcon size={24} />
                  <span>Awaiting</span>
                </div>
              )}
            </div>

            {/* 1st Place */}
            <div className="podium-item first">
              <div className="podium-medal">
                <MedalGoldIcon size={40} />
              </div>
              <div className="podium-rank-label">1st</div>
              <div className="podium-team-color" style={{ backgroundColor: sortedTeams[0]?.team?.color || '#fbbf24' }} />
              <div className="podium-team-name">{sortedTeams[0]?.team?.name || 'Champion'}</div>
              <div className="podium-stats">
                <div className="podium-stat-value">{getPodiumStat(sortedTeams[0]).value}</div>
                <div className="podium-stat-label">{getPodiumStat(sortedTeams[0]).label}</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className={`podium-item third ${!sortedTeams[2] ? 'empty' : ''}`}>
              <div className="podium-medal">
                <MedalBronzeIcon size={32} />
              </div>
              <div className="podium-rank-label">3rd</div>
              {sortedTeams[2] ? (
                <>
                  <div className="podium-team-color" style={{ backgroundColor: sortedTeams[2].team?.color || '#f59e0b' }} />
                  <div className="podium-team-name">{sortedTeams[2].team?.name}</div>
                  <div className="podium-stats">
                    <div className="podium-stat-value">{getPodiumStat(sortedTeams[2]).value}</div>
                    <div className="podium-stat-label">{getPodiumStat(sortedTeams[2]).label}</div>
                  </div>
                </>
              ) : (
                <div className="podium-placeholder">
                  <AlertIcon size={24} />
                  <span>Awaiting</span>
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

            return (
              <div key={team.team?._id || index} className={`ranking-card ${rank <= 3 ? 'top-three' : ''}`}>
                {/* Rank */}
                <div className="ranking-rank">
                  {rank <= 3 ? getRankIcon(rank) : <span className="rank-number">{rank}</span>}
                </div>

                {/* Team Color Bar */}
                <div className="ranking-color-bar" style={{ backgroundColor: team.team?.color || '#64748b' }} />

                {/* Team Info */}
                <div className="ranking-info">
                  <h3 className="ranking-team-name">{team.team?.name}</h3>
                  <div className="ranking-location">
                    <LocationIcon size={12} />
                    <span>
                      {team.team?.location?.city || 'Unknown'}, {team.team?.location?.state || 'Unknown'}
                    </span>
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
                    <div className="stat-label">Rate</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tournament Stats */}
      {currentTournament && tournamentStats && (
        <div className="stats-summary">
          <div className="stats-header">
            <TrophyIcon size={18} />
            <h2 className="section-title">Tournament Stats</h2>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">
                <UsersIcon size={24} />
              </div>
              <div className="summary-value">{tournamentStats.totalTeams}</div>
              <div className="summary-label">Teams</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">
                <SwordsIcon size={24} />
              </div>
              <div className="summary-value">{tournamentStats.completedMatches}</div>
              <div className="summary-label">Played</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">
                <CalendarIcon size={24} />
              </div>
              <div className="summary-value">{tournamentStats.remainingMatches}</div>
              <div className="summary-label">Remaining</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">
                <TargetIcon size={24} />
              </div>
              <div className="summary-value">{tournamentStats.progress}%</div>
              <div className="summary-label">Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileLeaderboard;
