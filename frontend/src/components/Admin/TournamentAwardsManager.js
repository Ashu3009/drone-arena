// frontend/src/components/Admin/TournamentAwardsManager.js
// NEW COMPONENT - Tournament Awards & Points Management (Admin Only)
// Updated for Round-wise Points Entry with Auto-Generate
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TournamentAwardsManager.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TournamentAwardsManager = ({ tournamentId }) => {
  const [activeTab, setActiveTab] = useState('points-entry');
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedRound, setSelectedRound] = useState(1); // Round 1, 2, or 3
  const [playerPoints, setPlayerPoints] = useState([]);
  const [roundPoints, setRoundPoints] = useState({}); // Store points per round
  const [awards, setAwards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Create Match state
  const [teams, setTeams] = useState([]);
  const [newMatch, setNewMatch] = useState({
    teamA: '',
    teamB: '',
    matchNumber: matches.length + 1
  });

  useEffect(() => {
    if (tournamentId) {
      fetchMatches();
      fetchAwards();
      fetchTournamentTeams();
    }
  }, [tournamentId]);

  const fetchTournamentTeams = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}`);
      if (response.data.success) {
        setTeams(response.data.data.registeredTeams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const createMatch = async () => {
    if (!newMatch.teamA || !newMatch.teamB) {
      showMessage('error', 'Please select both teams');
      return;
    }

    if (newMatch.teamA === newMatch.teamB) {
      showMessage('error', 'Team A and Team B must be different');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.post(
        `${API_BASE_URL}/matches`,
        {
          tournamentId: tournamentId,
          teamAId: newMatch.teamA,
          teamBId: newMatch.teamB
        }
      );

      if (response.data.success) {
        showMessage('success', 'Match created successfully!');
        setNewMatch({
          teamA: '',
          teamB: '',
          matchNumber: matches.length + 2
        });
        fetchMatches(); // Refresh matches list
        setActiveTab('points-entry'); // Switch to points entry tab
      }
    } catch (error) {
      console.error('Error creating match:', error);
      showMessage('error', error.response?.data?.message || 'Failed to create match');
    } finally {
      setSaving(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/matches?tournamentId=${tournamentId}`);
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
      setSelectedRound(1); // Reset to round 1

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
            role: member.role || 'Forward' // Default role
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
            role: member.role || 'Forward'
          });
        });
      }

      // Fetch existing points for this match (all rounds)
      const pointsResponse = await axios.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/player-points/match/${matchId}`
      );

      const existingPoints = pointsResponse.data.data || [];
      const roundWise = pointsResponse.data.roundWise || {};

      // Store round-wise points
      setRoundPoints(roundWise);

      // Initialize player points for round 1 with existing data or zeros
      const initializedPoints = players.map(player => {
        // Find existing points for round 1
        const existingRound1 = existingPoints.find(
          p => p.playerName === player.name && p.round === 1
        );
        return {
          playerName: player.name,
          team: player.team,
          teamName: player.teamName,
          teamColor: player.teamColor,
          playerRole: existingRound1?.playerRole || player.role || 'Forward',
          goalsScored: existingRound1?.goalsScored || 0,
          categoryPoints: existingRound1?.categoryPoints || {
            strikerPoints: 0,
            forwardPoints: 0,
            defenderPoints: 0,
            goalkeeperPoints: 0
          },
          totalPoints: existingRound1?.totalPoints || 0,
          isGenerated: !!existingRound1
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

  // Switch round and load existing data
  const switchRound = async (round) => {
    if (!selectedMatch) return;
    setSelectedRound(round);

    try {
      // Fetch points for this specific round
      const pointsResponse = await axios.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/player-points/match/${selectedMatch._id}?round=${round}`
      );

      const existingPoints = pointsResponse.data.data || [];

      // Update playerPoints with round-specific data
      const updatedPoints = playerPoints.map(player => {
        const existingRoundData = existingPoints.find(
          p => p.playerName === player.playerName
        );
        return {
          ...player,
          playerRole: existingRoundData?.playerRole || player.playerRole,
          goalsScored: existingRoundData?.goalsScored || 0,
          categoryPoints: existingRoundData?.categoryPoints || {
            strikerPoints: 0,
            forwardPoints: 0,
            defenderPoints: 0,
            goalkeeperPoints: 0
          },
          totalPoints: existingRoundData?.totalPoints || 0,
          isGenerated: !!existingRoundData
        };
      });

      setPlayerPoints(updatedPoints);
    } catch (error) {
      console.error('Error fetching round data:', error);
    }
  };

  const handleGoalsChange = (playerIndex, value) => {
    const newPoints = [...playerPoints];
    const numValue = Math.max(0, parseInt(value) || 0);
    newPoints[playerIndex].goalsScored = numValue;
    newPoints[playerIndex].isGenerated = false; // Mark as not generated after manual change
    setPlayerPoints(newPoints);
  };

  const handleRoleChange = (playerIndex, role) => {
    const newPoints = [...playerPoints];
    newPoints[playerIndex].playerRole = role;
    newPoints[playerIndex].isGenerated = false;
    setPlayerPoints(newPoints);
  };

  // Auto-generate role-based points for current round
  const autoGeneratePoints = async () => {
    if (!selectedMatch) {
      showMessage('error', 'Please select a match first');
      return;
    }

    try {
      setGenerating(true);

      // Prepare player goals data
      const playerGoals = playerPoints.map(player => ({
        playerName: player.playerName,
        team: player.team,
        playerRole: player.playerRole,
        goalsScored: player.goalsScored
      }));

      const response = await axios.post(
        `${API_BASE_URL}/tournaments/${tournamentId}/player-points/auto-generate`,
        {
          matchId: selectedMatch._id,
          round: selectedRound,
          playerGoals: playerGoals
        }
      );

      // Update local state with generated points
      const generatedData = response.data.data || [];
      const updatedPoints = playerPoints.map(player => {
        const generated = generatedData.find(g => g.playerName === player.playerName);
        if (generated) {
          return {
            ...player,
            categoryPoints: generated.categoryPoints,
            totalPoints: generated.totalPoints,
            isGenerated: true
          };
        }
        return player;
      });

      setPlayerPoints(updatedPoints);
      showMessage('success', `Round ${selectedRound} points auto-generated!`);

      // Update MOM display
      if (response.data.manOfMatch) {
        setSelectedMatch(prev => ({
          ...prev,
          manOfTheMatch: response.data.manOfMatch
        }));
      }

      // Refresh matches list to show updated MOM badge
      fetchMatches();
      fetchAwards(); // Refresh awards
    } catch (error) {
      console.error('Error auto-generating points:', error);
      showMessage('error', error.response?.data?.message || 'Failed to auto-generate points');
    } finally {
      setGenerating(false);
    }
  };

  // Save manually entered points for current round
  const saveRoundPoints = async () => {
    if (!selectedMatch) {
      showMessage('error', 'Please select a match first');
      return;
    }

    try {
      setSaving(true);

      const pointsData = playerPoints.map(player => ({
        playerName: player.playerName,
        team: player.team,
        playerRole: player.playerRole,
        goalsScored: player.goalsScored,
        categoryPoints: player.categoryPoints
      }));

      await axios.post(
        `${API_BASE_URL}/tournaments/${tournamentId}/player-points`,
        {
          matchId: selectedMatch._id,
          round: selectedRound,
          playerPoints: pointsData
        }
      );

      showMessage('success', `Round ${selectedRound} points saved successfully!`);
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
          className={`tab-btn ${activeTab === 'create-match' ? 'active' : ''}`}
          onClick={() => setActiveTab('create-match')}
        >
          ➕ Create Match
        </button>
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

      {activeTab === 'create-match' && (
        <div className="create-match-section">
          <div className="match-form">
            <h3>Create New Match</h3>

            <div className="form-group">
              <label>Match Number</label>
              <input
                type="number"
                value={newMatch.matchNumber}
                onChange={(e) => setNewMatch({ ...newMatch, matchNumber: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Team A</label>
              <select
                value={newMatch.teamA}
                onChange={(e) => setNewMatch({ ...newMatch, teamA: e.target.value })}
              >
                <option value="">Select Team A</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Team B</label>
              <select
                value={newMatch.teamB}
                onChange={(e) => setNewMatch({ ...newMatch, teamB: e.target.value })}
              >
                <option value="">Select Team B</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="create-match-btn"
              onClick={createMatch}
              disabled={!newMatch.teamA || !newMatch.teamB || saving}
            >
              {saving ? 'Creating...' : 'Create Match'}
            </button>

            <div className="info-box">
              <p>ℹ️ After creating a match, you can assign player points for each round in the <strong>Points Entry</strong> tab.</p>
            </div>
          </div>
        </div>
      )}

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
                    {match.manOfTheMatch?.playerName && (
                      <div className="mom-badge">
                        🏅 MOM: {match.manOfTheMatch.playerName}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedMatch && (
            <div className="points-form">
              <div className="form-header">
                <h3>Match #{selectedMatch.matchNumber} - Round Points Entry</h3>
                {selectedMatch.manOfTheMatch?.playerName && (
                  <div className="mom-display">
                    🏅 MOM: <strong>{selectedMatch.manOfTheMatch.playerName}</strong>
                  </div>
                )}
              </div>

              {/* Round Selection Tabs */}
              <div className="round-tabs">
                {[1, 2, 3].map(round => (
                  <button
                    key={round}
                    className={`round-tab ${selectedRound === round ? 'active' : ''}`}
                    onClick={() => switchRound(round)}
                  >
                    Round {round}
                    {roundPoints[round]?.length > 0 && (
                      <span className="round-saved-badge">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="round-info">
                <p>📝 Enter goals for each player, set their role, then click <strong>Auto-Generate</strong> to calculate points based on role.</p>
              </div>

              <div className="action-buttons">
                <button
                  className="generate-btn"
                  onClick={autoGeneratePoints}
                  disabled={generating}
                >
                  {generating ? '⏳ Generating...' : '🎲 Auto-Generate Round Points'}
                </button>
                <button
                  className="save-btn"
                  onClick={saveRoundPoints}
                  disabled={saving}
                >
                  {saving ? '💾 Saving...' : '💾 Save Round Points'}
                </button>
              </div>

              <div className="players-list">
                {playerPoints.map((player, index) => (
                  <div key={index} className={`player-points-card ${player.isGenerated ? 'generated' : ''}`}>
                    <div className="player-info">
                      <div
                        className="team-indicator"
                        style={{ backgroundColor: player.teamColor }}
                      />
                      <div className="player-details">
                        <h4>{player.playerName}</h4>
                        <p className="player-meta">
                          {player.teamName}
                        </p>
                      </div>
                    </div>

                    <div className="player-inputs-row">
                      {/* Role Selection */}
                      <div className="input-group role-select">
                        <label>Role</label>
                        <select
                          value={player.playerRole}
                          onChange={(e) => handleRoleChange(index, e.target.value)}
                        >
                          <option value="Striker">Striker</option>
                          <option value="Forward">Forward</option>
                          <option value="Defender">Defender</option>
                          <option value="Keeper">Keeper</option>
                        </select>
                      </div>

                      {/* Goals Input */}
                      <div className="input-group goals-input">
                        <label>⚽ Goals</label>
                        <input
                          type="number"
                          min="0"
                          value={player.goalsScored}
                          onChange={(e) => handleGoalsChange(index, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Generated Points Display (Read-only) */}
                    {player.isGenerated && (
                      <div className="generated-points">
                        <div className="points-display">
                          <span className="point-badge striker">⚡ {player.categoryPoints.strikerPoints}</span>
                          <span className="point-badge forward">🎯 {player.categoryPoints.forwardPoints}</span>
                          <span className="point-badge defender">🛡️ {player.categoryPoints.defenderPoints}</span>
                          <span className="point-badge keeper">🥅 {player.categoryPoints.goalkeeperPoints}</span>
                        </div>
                        <div className="total-points">
                          Total: <strong>{calculateTotal(player.categoryPoints)}</strong>
                        </div>
                      </div>
                    )}
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
                    <span>Goals: <strong>{awards.manOfTournament?.totalGoals || 0}</strong></span>
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
                      ⚽ {awards.bestStriker?.totalGoals || 0} Goals
                    </div>
                    <div className="stat-badge">
                      Score: {awards.bestStriker?.weightedScore?.toFixed(2)}
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
                      ⚽ {awards.bestForward?.totalGoals || 0} Goals
                    </div>
                    <div className="stat-badge">
                      Score: {awards.bestForward?.weightedScore?.toFixed(2)}
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
