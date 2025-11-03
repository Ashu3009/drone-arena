import React, { useState, useEffect } from 'react';
import { getMatches } from '../../services/api';

const Leaderboard = ({ tournamentId }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [tournamentId]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await getMatches();
      if (response.success) {
        const matches = tournamentId
          ? response.data.filter(m => m.tournament?._id === tournamentId)
          : response.data;

        // Calculate team standings
        const teamStats = {};

        matches.forEach(match => {
          if (match.status === 'completed') {
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
            const scoreA = match.teamAScore || 0;
            const scoreB = match.teamBScore || 0;

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
    <div style={styles.container}>
      <h3 style={styles.title}>Leaderboard</h3>

      {loading ? (
        <p style={styles.loading}>Loading leaderboard...</p>
      ) : teams.length === 0 ? (
        <p style={styles.empty}>No completed matches yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>#</th>
              <th style={{...styles.th, textAlign: 'left'}}>Team</th>
              <th style={styles.th}>W</th>
              <th style={styles.th}>D</th>
              <th style={styles.th}>L</th>
              <th style={styles.th}>Score</th>
              <th style={styles.th}>Points</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={index} style={index === 0 ? styles.firstPlace : styles.row}>
                <td style={styles.td}>{index + 1}</td>
                <td style={{...styles.td, textAlign: 'left', fontWeight: 'bold'}}>
                  {team.name}
                  {index === 0 && <span style={styles.trophy}>🏆</span>}
                </td>
                <td style={styles.td}>{team.wins}</td>
                <td style={styles.td}>{team.draws}</td>
                <td style={styles.td}>{team.losses}</td>
                <td style={styles.td}>{team.totalScore}</td>
                <td style={{...styles.td, ...styles.points}}>{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '24px'
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '24px',
    paddingBottom: '12px',
    borderBottom: '2px solid #333'
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '40px'
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    padding: '40px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  headerRow: {
    backgroundColor: '#2a2a2a',
    borderBottom: '2px solid #444'
  },
  th: {
    padding: '12px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#aaa',
    textTransform: 'uppercase'
  },
  row: {
    borderBottom: '1px solid #333'
  },
  firstPlace: {
    backgroundColor: '#2a3a2a',
    borderBottom: '1px solid #4CAF50'
  },
  td: {
    padding: '14px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#ccc'
  },
  trophy: {
    marginLeft: '8px',
    fontSize: '18px'
  },
  points: {
    fontWeight: 'bold',
    color: '#4CAF50',
    fontSize: '16px'
  }
};

export default Leaderboard;
