import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeams, getCurrentMatch, getMatches, getTournamentById } from '../../services/api';
import { MedalGoldIcon, MedalSilverIcon, MedalBronzeIcon, LocationIcon, AlertIcon, TrophyIcon, UsersIcon, SwordsIcon, CalendarIcon, TargetIcon, ArrowLeftIcon } from './icons';
import './PublicMobileLeaderboard.css';

const PublicMobileLeaderboard = () => {
  const navigate = useNavigate();
  const [teamStats, setTeamStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [tournamentStats, setTournamentStats] = useState(null);

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    try {
      const currentMatchResponse = await getCurrentMatch();

      if (currentMatchResponse.data && currentMatchResponse.data.tournament) {
        const tournamentId = currentMatchResponse.data.tournament._id;
        const tournamentResponse = await getTournamentById(tournamentId);
        setCurrentTournament(tournamentResponse.data);

        const matchesResponse = await getMatches({ tournamentId });
        const tournamentMatches = matchesResponse.data || [];

        const stats = calculateTeamStats(tournamentMatches);
        setTeamStats(stats);

        const tStats = calculateTournamentStats(tournamentResponse.data, tournamentMatches);
        setTournamentStats(tStats);
      } else {
        const teamsResponse = await getTeams();
        setTeamStats((teamsResponse.data || []).map(team => ({
          team,
          wins: 0,
          losses: 0,
          draws: 0,
          totalMatches: 0,
          points: 0,
          winRate: 0,
        })));
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTeamStats = (matches) => {
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

    return Object.values(statsMap).sort((a, b) => b.wins - a.wins);
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

  const getRankIcon = (rank) => {
    if (rank === 1) return <MedalGoldIcon size={24} />;
    if (rank === 2) return <MedalSilverIcon size={24} />;
    if (rank === 3) return <MedalBronzeIcon size={24} />;
    return <span className="pub-rank-number">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="pub-leaderboard-container public-mobile-view">
        <div className="pub-loading">
          <div className="pub-spinner" />
          <p>Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pub-leaderboard-container public-mobile-view">
      <div className="pub-leaderboard-header">
        <button className="pub-back-button" onClick={() => navigate('/watch')}>
          <ArrowLeftIcon size={20} />
        </button>
        <div className="pub-header-content">
          <h1>Leaderboard</h1>
          {currentTournament && <p>{currentTournament.name}</p>}
        </div>
      </div>

      {/* Top 3 Podium */}
      {teamStats.length > 0 && (
        <div className="pub-podium-section">
          <div className="pub-podium-container">
            {/* 2nd Place */}
            <div className={`pub-podium-item second ${!teamStats[1] ? 'empty' : ''}`}>
              <div className="pub-podium-medal">
                {teamStats[1] ? <MedalSilverIcon size={32} /> : <AlertIcon size={24} />}
              </div>
              <div className="pub-podium-rank">2nd</div>
              {teamStats[1] ? (
                <>
                  <div className="pub-podium-team-name" title={teamStats[1].team?.name}>
                    {teamStats[1].team?.name}
                  </div>
                  <div className="pub-podium-wins">{teamStats[1].wins} Wins</div>
                </>
              ) : (
                <div className="pub-podium-placeholder">Awaiting</div>
              )}
            </div>

            {/* 1st Place */}
            <div className="pub-podium-item first">
              <div className="pub-podium-medal">
                <MedalGoldIcon size={40} />
              </div>
              <div className="pub-podium-rank">1st</div>
              <div className="pub-podium-team-name" title={teamStats[0]?.team?.name}>
                {teamStats[0]?.team?.name}
              </div>
              <div className="pub-podium-wins">{teamStats[0]?.wins} Wins</div>
            </div>

            {/* 3rd Place */}
            <div className={`pub-podium-item third ${!teamStats[2] ? 'empty' : ''}`}>
              <div className="pub-podium-medal">
                {teamStats[2] ? <MedalBronzeIcon size={32} /> : <AlertIcon size={24} />}
              </div>
              <div className="pub-podium-rank">3rd</div>
              {teamStats[2] ? (
                <>
                  <div className="pub-podium-team-name" title={teamStats[2].team?.name}>
                    {teamStats[2].team?.name}
                  </div>
                  <div className="pub-podium-wins">{teamStats[2].wins} Wins</div>
                </>
              ) : (
                <div className="pub-podium-placeholder">Awaiting</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="pub-rankings-list">
        <h2>Full Rankings</h2>
        {teamStats.length === 0 ? (
          <div className="pub-no-rankings">
            <TrophyIcon size={64} color="var(--pub-neutral-300)" />
            <p>No rankings available</p>
          </div>
        ) : (
          teamStats.map((team, index) => {
            const rank = index + 1;

            return (
              <div key={team.team?._id || index} className={`pub-ranking-card ${rank <= 3 ? 'top-three' : ''}`}>
                <div className="pub-ranking-rank">{getRankIcon(rank)}</div>
                <div className="pub-ranking-color-bar" style={{ backgroundColor: team.team?.color || '#64748b' }} />
                <div className="pub-ranking-info">
                  <div className="pub-ranking-team-name">{team.team?.name}</div>
                  <div className="pub-ranking-location">
                    <LocationIcon size={12} />
                    <span>{team.team?.location?.city || 'Unknown'}</span>
                  </div>
                </div>
                <div className="pub-ranking-stats">
                  <div className="pub-stat-item">
                    <div className="pub-stat-value">{team.wins}</div>
                    <div className="pub-stat-label">W</div>
                  </div>
                  <div className="pub-stat-item">
                    <div className="pub-stat-value">{team.losses}</div>
                    <div className="pub-stat-label">L</div>
                  </div>
                  <div className="pub-stat-item">
                    <div className="pub-stat-value">{team.winRate}%</div>
                    <div className="pub-stat-label">Rate</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tournament Stats */}
      {currentTournament && tournamentStats && (
        <div className="pub-stats-summary">
          <div className="pub-stats-header">
            <TrophyIcon size={18} />
            <h2 className="pub-section-title">Tournament Stats</h2>
          </div>
          <div className="pub-summary-grid">
            <div className="pub-summary-card">
              <div className="pub-summary-icon">
                <UsersIcon size={24} />
              </div>
              <div className="pub-summary-value">{tournamentStats.totalTeams}</div>
              <div className="pub-summary-label">Teams</div>
            </div>
            <div className="pub-summary-card">
              <div className="pub-summary-icon">
                <SwordsIcon size={24} />
              </div>
              <div className="pub-summary-value">{tournamentStats.completedMatches}</div>
              <div className="pub-summary-label">Played</div>
            </div>
            <div className="pub-summary-card">
              <div className="pub-summary-icon">
                <CalendarIcon size={24} />
              </div>
              <div className="pub-summary-value">{tournamentStats.remainingMatches}</div>
              <div className="pub-summary-label">Remaining</div>
            </div>
            <div className="pub-summary-card">
              <div className="pub-summary-icon">
                <TargetIcon size={24} />
              </div>
              <div className="pub-summary-value">{tournamentStats.progress}%</div>
              <div className="pub-summary-label">Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMobileLeaderboard;
