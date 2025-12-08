import React, { useState, useEffect } from 'react';
import { getMatches } from '../../services/api';
import './Leaderboard.css';

const Leaderboard = ({ tournamentId }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await getMatches();
      if (response.success) {
        const matches = tournamentId
          ? response.data.filter(m => String(m.tournament?._id) === String(tournamentId))
          : response.data;

        // Calculate team standings
        const teamStats = {};

        matches.forEach(match => {
          if (match.status === 'completed' || match.status === 'in_progress') {
            const teamAId = match.teamA?._id;
            const teamBId = match.teamB?._id;
            const teamAName = match.teamA?.name || 'Team A';
            const teamBName = match.teamB?.name || 'Team B';

            // Initialize teams
            if (!teamStats[teamAId]) {
              teamStats[teamAId] = { name: teamAName, wins: 0, losses: 0, draws: 0, points: 0, totalScore: 0 };
            }
            if (!teamStats[teamBId]) {
              teamStats[teamBId] = { name: teamBName, wins: 0, losses: 0, draws: 0, points: 0, totalScore: 0 };
            }

            // Update stats
            const scoreA = match.finalScoreA || 0;
            const scoreB = match.finalScoreB || 0;

            teamStats[teamAId].totalScore += scoreA;
            teamStats[teamBId].totalScore += scoreB;

            if (scoreA > scoreB) {
              teamStats[teamAId].wins++;
              teamStats[teamAId].points += 3;
              teamStats[teamBId].losses++;
            } else if (scoreB > scoreA) {
              teamStats[teamBId].wins++;
              teamStats[teamBId].points += 3;
              teamStats[teamAId].losses++;
            } else {
              teamStats[teamAId].draws++;
              teamStats[teamAId].points += 1;
              teamStats[teamBId].draws++;
              teamStats[teamBId].points += 1;
            }
          }
        });

        // Convert to array and sort by points
        const sortedTeams = Object.values(teamStats).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.totalScore - a.totalScore; // Tiebreaker: total score
        });

        setTeams(sortedTeams);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard-container">
      <h3 className="leaderboard-title">Leaderboard</h3>

      {loading ? (
        <p className="leaderboard-loading">Loading leaderboard...</p>
      ) : teams.length === 0 ? (
        <p className="leaderboard-empty">No completed matches yet.</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr className="leaderboard-header-row">
              <th className="leaderboard-th">#</th>
              <th className="leaderboard-th leaderboard-th-left">Team</th>
              <th className="leaderboard-th">W</th>
              <th className="leaderboard-th">D</th>
              <th className="leaderboard-th">L</th>
              <th className="leaderboard-th">Score</th>
              <th className="leaderboard-th">Points</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={index} className={index === 0 ? 'leaderboard-first-place' : 'leaderboard-row'}>
                <td className="leaderboard-td">{index + 1}</td>
                <td className="leaderboard-td leaderboard-td-left">
                  {team.name}
                  {index === 0 && <span className="leaderboard-trophy">★</span>}
                </td>
                <td className="leaderboard-td">{team.wins}</td>
                <td className="leaderboard-td">{team.draws}</td>
                <td className="leaderboard-td">{team.losses}</td>
                <td className="leaderboard-td">{team.totalScore}</td>
                <td className="leaderboard-td leaderboard-points">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leaderboard;
