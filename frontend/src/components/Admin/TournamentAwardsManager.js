// frontend/src/components/Admin/TournamentAwardsManager.js
// NEW COMPONENT - Tournament Awards & Points Management (Admin Only)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TournamentAwardsManager.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TournamentAwardsManager = ({ tournamentId }) => {
  const [activeTab, setActiveTab] = useState('points-entry');
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [teams, setTeams] = useState([]);
  const [playerPoints, setPlayerPoints] = useState([]);
  const [awards, setAwards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (tournamentId) {
      fetchMatches();
      fetchAwards();
    }
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/matches?tournament=${tournamentId}`);
      setMatches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      showMessage('error', 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async (matchId) => {
    try {
      setLoading(true);
      const matchResponse = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
      const match = matchResponse.data.data;

      setSelectedMatch(match);

      // Get all unique players from both teams
      const players = [];

      // Team A players
      if (match.teamA && match.teamA.members) {
        match.teamA.members.forEach(member => {
          players.push({
            name: member.name,
            team: match.teamA._id,
            teamName: match.teamA.name,
            teamColor: match.teamA.color,
            role: member.role
          });
        });
      }

      // Team B players
      if (match.teamB && match.teamB.members) {
        match.teamB.members.forEach(member => {
          players.push({
            name: member.name,
            team: match.teamB._id,
            teamName: match.teamB.name,
            teamColor: match.teamB.color,
            role: member.role
          });
        });
      }

      // Fetch existing points for this match
      const pointsResponse = await axios.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/player-points/match/${matchId}`
      );

      const existingPoints = pointsResponse.data.data || [];

      // Initialize player points with existing data or zeros
      const initializedPoints = players.map(player => {
        const existing = existingPoints.find(p => p.playerName === player.name);
        return {
          playerName: player.name,
          team: player.team,
          teamName: player.teamName,
          teamColor: player.teamColor,
          role: player.role,
          categoryPoints: existing?.categoryPoints || {
            strikerPoints: 0,
            forwardPoints: 0,
            defenderPoints: 0,
            goalkeeperPoints: 0
          },
          notes: existing?.notes || ''
        };
      });

      setPlayerPoints(initializedPoints);
    } catch (error) {
      console.error('Error fetching match details:', error);
      showMessage('error', 'Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const handlePointsChange = (playerIndex, category, value) => {
    const newPoints = [...playerPoints];
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    newPoints[playerIndex].categoryPoints[category] = numValue;
    setPlayerPoints(newPoints);
  };

  const handleNotesChange = (playerIndex, value) => {
    const newPoints = [...playerPoints];
    newPoints[playerIndex].notes = value;
    setPlayerPoints(newPoints);
  };

  const savePlayerPoints = async () => {
    if (!selectedMatch) {
      showMessage('error', 'Please select a match first');
      return;
    }

    try {
      setSaving(true);

      await axios.post(
        `${API_BASE_URL}/tournaments/${tournamentId}/player-points`,
        {
          matchId: selectedMatch._id,
          playerPoints: playerPoints
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      showMessage('success', 'Player points saved successfully!');
      fetchAwards(); // Refresh awards after saving
    } catch (error) {
      console.error('Error saving player points:', error);
      showMessage('error', error.response?.data?.message || 'Failed to save player points');
    } finally {
      setSaving(false);
    }
  };

  const fetchAwards = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/player-points/awards/calculate`
      );
      setAwards(response.data.data);
    } catch (error) {
      console.error('Error fetching awards:', error);
      // It's okay if no data exists yet
      setAwards(null);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const calculateTotal = (categoryPoints) => {
    return Object.values(categoryPoints).reduce((sum, val) => sum + val, 0);
  };

  return (
    <div className="awards-manager">
      <div className="awards-header">
        <h2>🏆 Tournament Awards Management</h2>
        <p className="admin-badge">Admin Panel - Points & Awards</p>
      </div>

      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="awards-tabs">
        <button
          className={`tab-btn ${activeTab === 'points-entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('points-entry')}
        >
          📝 Points Entry
        </button>
        <button
          className={`tab-btn ${activeTab === 'awards-view' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('awards-view');
            fetchAwards();
          }}
        >
          🏅 View Awards
        </button>
      </div>

      {activeTab === 'points-entry' && (
        <div className="points-entry-section">
          <div className="match-selector">
            <h3>Select Match to Enter Points</h3>
            <div className="matches-grid">
              {loading ? (
                <p>Loading matches...</p>
              ) : matches.length === 0 ? (
                <p>No matches found for this tournament</p>
              ) : (
                matches.map(match => (
                  <button
                    key={match._id}
                    className={`match-card ${selectedMatch?._id === match._id ? 'selected' : ''}`}
                    onClick={() => fetchMatchDetails(match._id)}
                  >
                    <div className="match-number">Match #{match.matchNumber}</div>
                    <div className="match-teams">
                      <span style={{ color: match.teamA?.color }}>{match.teamA?.name}</span>
                      <span className="vs">vs</span>
                      <span style={{ color: match.teamB?.color }}>{match.teamB?.name}</span>
                    </div>
                    <div className="match-status">{match.status}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedMatch && (
            <div className="points-form">
              <div className="form-header">
                <h3>Enter Player Points - Match #{selectedMatch.matchNumber}</h3>
                <button className="save-btn" onClick={savePlayerPoints} disabled={saving}>
                  {saving ? '💾 Saving...' : '💾 Save All Points'}
                </button>
              </div>

              <div className="category-legend">
                <span className="legend-item">⚡ Striker (0-100)</span>
                <span className="legend-item">🎯 Forward (0-100)</span>
                <span className="legend-item">🛡️ Defender (0-100)</span>
                <span className="legend-item">🥅 Goalkeeper (0-100)</span>
              </div>

              <div className="players-list">
                {playerPoints.map((player, index) => (
                  <div key={index} className="player-points-card">
                    <div className="player-info">
                      <div
                        className="team-indicator"
                        style={{ backgroundColor: player.teamColor }}
                      />
                      <div className="player-details">
                        <h4>{player.playerName}</h4>
                        <p className="player-meta">
                          {player.teamName} • {player.role}
                        </p>
                      </div>
                    </div>

                    <div className="points-inputs">
                      <div className="point-input-group">
                        <label>⚡ Striker</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={player.categoryPoints.strikerPoints}
                          onChange={(e) =>
                            handlePointsChange(index, 'strikerPoints', e.target.value)
                          }
                        />
                      </div>

                      <div className="point-input-group">
                        <label>🎯 Forward</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={player.categoryPoints.forwardPoints}
                          onChange={(e) =>
                            handlePointsChange(index, 'forwardPoints', e.target.value)
                          }
                        />
                      </div>

                      <div className="point-input-group">
                        <label>🛡️ Defender</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={player.categoryPoints.defenderPoints}
                          onChange={(e) =>
                            handlePointsChange(index, 'defenderPoints', e.target.value)
                          }
                        />
                      </div>

                      <div className="point-input-group">
                        <label>🥅 Goalkeeper</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={player.categoryPoints.goalkeeperPoints}
                          onChange={(e) =>
                            handlePointsChange(index, 'goalkeeperPoints', e.target.value)
                          }
                        />
                      </div>

                      <div className="point-total">
                        <strong>Total: {calculateTotal(player.categoryPoints)}</strong>
                      </div>
                    </div>

                    <div className="notes-section">
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={player.notes}
                        onChange={(e) => handleNotesChange(index, e.target.value)}
                        className="notes-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'awards-view' && (
        <div className="awards-view-section">
          <div className="awards-header-section">
            <h3>🏆 Auto-Calculated Awards</h3>
            <button className="refresh-btn" onClick={fetchAwards}>
              🔄 Refresh Awards
            </button>
          </div>

          {!awards ? (
            <div className="no-awards">
              <p>No player points data available yet.</p>
              <p>Enter points in the "Points Entry" tab to see calculated awards.</p>
            </div>
          ) : (
            <div className="awards-display">
              {/* Man of Tournament */}
              <div className="award-card main-award">
                <div className="award-icon">🥇</div>
                <h3>Man of the Tournament</h3>
                <div className="award-winner">
                  <h2>{awards.manOfTournament?.playerName}</h2>
                  <p className="team-name">
                    {awards.manOfTournament?.teamDetails?.name}
                  </p>
                  <div className="award-stats">
                    <span>Total Points: <strong>{awards.manOfTournament?.totalPoints}</strong></span>
                    <span>Matches: <strong>{awards.manOfTournament?.matchesPlayed}</strong></span>
                  </div>
                </div>
              </div>

              {/* Category Awards */}
              <div className="category-awards-grid">
                {/* Best Striker */}
                <div className="award-card">
                  <div className="award-icon">⚡</div>
                  <h4>Best Striker</h4>
                  <div className="award-winner-small">
                    <h3>{awards.bestStriker?.playerName}</h3>
                    <p>{awards.bestStriker?.teamDetails?.name}</p>
                    <div className="stat-badge">
                      Avg: {awards.bestStriker?.avgPoints?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Best Forward */}
                <div className="award-card">
                  <div className="award-icon">🎯</div>
                  <h4>Best Forward</h4>
                  <div className="award-winner-small">
                    <h3>{awards.bestForward?.playerName}</h3>
                    <p>{awards.bestForward?.teamDetails?.name}</p>
                    <div className="stat-badge">
                      Avg: {awards.bestForward?.avgPoints?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Best Defender */}
                <div className="award-card">
                  <div className="award-icon">🛡️</div>
                  <h4>Best Defender</h4>
                  <div className="award-winner-small">
                    <h3>{awards.bestDefender?.playerName}</h3>
                    <p>{awards.bestDefender?.teamDetails?.name}</p>
                    <div className="stat-badge">
                      Avg: {awards.bestDefender?.avgPoints?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Best Goalkeeper */}
                <div className="award-card">
                  <div className="award-icon">🥅</div>
                  <h4>Best Goalkeeper</h4>
                  <div className="award-winner-small">
                    <h3>{awards.bestGoalkeeper?.playerName}</h3>
                    <p>{awards.bestGoalkeeper?.teamDetails?.name}</p>
                    <div className="stat-badge">
                      Avg: {awards.bestGoalkeeper?.avgPoints?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* All Players Leaderboard */}
              <div className="leaderboard-section">
                <h3>📊 Complete Player Rankings</h3>
                <div className="leaderboard-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Player Name</th>
                        <th>Total Points</th>
                        <th>Matches</th>
                        <th>Striker Avg</th>
                        <th>Forward Avg</th>
                        <th>Defender Avg</th>
                        <th>Keeper Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {awards.allPlayers?.map((player, index) => (
                        <tr key={index} className={index < 3 ? 'top-rank' : ''}>
                          <td>
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && (index + 1)}
                          </td>
                          <td className="player-name-cell">{player._id}</td>
                          <td><strong>{player.totalPoints}</strong></td>
                          <td>{player.totalMatches}</td>
                          <td>{player.strikerAvg?.toFixed(1)}</td>
                          <td>{player.forwardAvg?.toFixed(1)}</td>
                          <td>{player.defenderAvg?.toFixed(1)}</td>
                          <td>{player.goalkeeperAvg?.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentAwardsManager;
