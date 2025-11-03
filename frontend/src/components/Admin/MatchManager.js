import React, { useState, useEffect } from 'react';
import {
  getMatches,
  getTournaments,
  getTeams,
  createMatch,
  deleteMatch,
  setCurrentMatch,
  startRound,
  endRound,
  updateScore,
  completeMatch,
  startAllDrones,
  stopAllDrones,
  resetAllDrones
} from '../../services/api';

const MatchManager = () => {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [formData, setFormData] = useState({
    tournament: '',
    teamA: '',
    teamB: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchesRes, tournamentsRes, teamsRes] = await Promise.all([
        getMatches(),
        getTournaments(),
        getTeams()
      ]);

      if (matchesRes.success) setMatches(matchesRes.data);
      if (tournamentsRes.success) setTournaments(tournamentsRes.data);
      if (teamsRes.success) setTeams(teamsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();

    if (!formData.tournament || !formData.teamA || !formData.teamB) {
      alert('Please select tournament and both teams');
      return;
    }

    if (formData.teamA === formData.teamB) {
      alert('Team A and Team B must be different');
      return;
    }

    setLoading(true);
    try {
      const matchData = {
        tournamentId: formData.tournament,
        teamAId: formData.teamA,
        teamBId: formData.teamB
      };
      const response = await createMatch(matchData);
      if (response.success) {
        alert('Match created successfully!');
        setShowCreateForm(false);
        setFormData({ tournament: '', teamA: '', teamB: '' });
        loadData();
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert(error.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrent = async (matchId) => {
    setLoading(true);
    try {
      const response = await setCurrentMatch(matchId);
      if (response.success) {
        alert('Current match set!');
        loadData();
      }
    } catch (error) {
      console.error('Error setting current match:', error);
      alert(error.response?.data?.message || 'Failed to set current match');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRound = async (matchId, roundNumber) => {
    setLoading(true);
    try {
      const response = await startRound(matchId, roundNumber);
      if (response.success) {
        alert(`Round ${roundNumber} started!`);
        loadData();
      }
    } catch (error) {
      console.error('Error starting round:', error);
      alert(error.response?.data?.message || 'Failed to start round');
    } finally {
      setLoading(false);
    }
  };

  const handleEndRound = async (matchId, roundNumber) => {
    const teamAScore = parseInt(prompt('Enter Team A Score:') || '0');
    const teamBScore = parseInt(prompt('Enter Team B Score:') || '0');

    setLoading(true);
    try {
      const response = await endRound(matchId, roundNumber, { teamAScore, teamBScore });
      if (response.success) {
        alert(`Round ${roundNumber} ended! ML Analysis: ${response.data.analysis?.summary || 'Pending'}`);
        loadData();
      }
    } catch (error) {
      console.error('Error ending round:', error);
      alert(error.response?.data?.message || 'Failed to end round');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMatch = async (matchId) => {
    if (!window.confirm('Complete this match? This cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await completeMatch(matchId);
      if (response.success) {
        alert('Match completed!');
        loadData();
      }
    } catch (error) {
      console.error('Error completing match:', error);
      alert(error.response?.data?.message || 'Failed to complete match');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Delete this match? This cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await deleteMatch(matchId);
      if (response.success) {
        alert('Match deleted!');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert(error.response?.data?.message || 'Failed to delete match');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchCommand = async (matchId, command) => {
    setLoading(true);
    try {
      let response;
      if (command === 'start') {
        response = await startAllDrones(matchId);
      } else if (command === 'stop') {
        response = await stopAllDrones(matchId);
      } else if (command === 'reset') {
        response = await resetAllDrones(matchId);
      }

      if (response?.success) {
        alert(`All drones ${command}ed!`);
      }
    } catch (error) {
      console.error(`Error ${command}ing drones:`, error);
      alert(error.response?.data?.message || `Failed to ${command} drones`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Match Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={styles.createButton}
          disabled={loading}
        >
          {showCreateForm ? 'Cancel' : '+ Create Match'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateMatch} style={styles.form}>
          <h3 style={styles.formTitle}>Create New Match</h3>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tournament *</label>
            <select
              value={formData.tournament}
              onChange={(e) => setFormData({ ...formData, tournament: e.target.value })}
              style={styles.input}
              required
            >
              <option value="">Select Tournament</option>
              {tournaments.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Team A *</label>
              <select
                value={formData.teamA}
                onChange={(e) => setFormData({ ...formData, teamA: e.target.value })}
                style={styles.input}
                required
              >
                <option value="">Select Team A</option>
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Team B *</label>
              <select
                value={formData.teamB}
                onChange={(e) => setFormData({ ...formData, teamB: e.target.value })}
                style={styles.input}
                required
              >
                <option value="">Select Team B</option>
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create Match'}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Matches List */}
      <div style={styles.matchList}>
        {loading && matches.length === 0 ? (
          <p style={styles.loadingText}>Loading matches...</p>
        ) : matches.length === 0 ? (
          <p style={styles.emptyText}>No matches found. Create your first match!</p>
        ) : (
          matches.map((match) => {
            const activeRound = match.rounds?.find(r => r.status === 'in_progress');
            const currentRound = match.currentRound || 1;

            return (
              <div key={match._id} style={styles.matchCard}>
                {match.isCurrentMatch && (
                  <div style={styles.currentBadge}>CURRENT MATCH</div>
                )}

                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.matchTitle}>
                      {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
                    </h3>
                    <p style={styles.tournamentName}>{match.tournament?.name || 'Tournament'}</p>
                  </div>
                  <div style={styles.statusBadge}>
                    {match.status}
                  </div>
                </div>

                <div style={styles.scoreSection}>
                  <div style={styles.scoreBox}>
                    <span style={styles.teamLabel}>Team A</span>
                    <span style={styles.score}>{match.teamAScore || 0}</span>
                  </div>
                  <div style={styles.scoreBox}>
                    <span style={styles.teamLabel}>Team B</span>
                    <span style={styles.score}>{match.teamBScore || 0}</span>
                  </div>
                </div>

                <div style={styles.roundInfo}>
                  <span>Round: {currentRound} / 3</span>
                  {activeRound && <span style={styles.activeRound}>ROUND IN PROGRESS</span>}
                </div>

                {/* Match Controls */}
                <div style={styles.controls}>
                  {!match.isCurrentMatch && match.status !== 'completed' && (
                    <button
                      onClick={() => handleSetCurrent(match._id)}
                      style={styles.controlButton}
                      disabled={loading}
                    >
                      Set as Current
                    </button>
                  )}

                  {match.status === 'pending' && (
                    <button
                      onClick={() => handleStartRound(match._id, currentRound)}
                      style={{...styles.controlButton, backgroundColor: '#4CAF50'}}
                      disabled={loading}
                    >
                      Start Round {currentRound}
                    </button>
                  )}

                  {activeRound && (
                    <>
                      <button
                        onClick={() => handleEndRound(match._id, currentRound)}
                        style={{...styles.controlButton, backgroundColor: '#ff9800'}}
                        disabled={loading}
                      >
                        End Round {currentRound}
                      </button>

                      {/* Batch Drone Commands */}
                      <div style={styles.batchCommands}>
                        <span style={styles.batchLabel}>Batch Commands:</span>
                        <button
                          onClick={() => handleBatchCommand(match._id, 'start')}
                          style={styles.batchButton}
                          disabled={loading}
                        >
                          Start All
                        </button>
                        <button
                          onClick={() => handleBatchCommand(match._id, 'stop')}
                          style={{...styles.batchButton, backgroundColor: '#ff5722'}}
                          disabled={loading}
                        >
                          Stop All
                        </button>
                        <button
                          onClick={() => handleBatchCommand(match._id, 'reset')}
                          style={{...styles.batchButton, backgroundColor: '#9E9E9E'}}
                          disabled={loading}
                        >
                          Reset All
                        </button>
                      </div>
                    </>
                  )}

                  {match.status === 'in_progress' && currentRound >= 3 && !activeRound && (
                    <button
                      onClick={() => handleCompleteMatch(match._id)}
                      style={{...styles.controlButton, backgroundColor: '#2196F3'}}
                      disabled={loading}
                    >
                      Complete Match
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteMatch(match._id)}
                    style={{...styles.controlButton, backgroundColor: '#ff4444', marginLeft: 'auto'}}
                    disabled={loading}
                  >
                    Delete Match
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '24px',
    margin: 0
  },
  createButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  form: {
    backgroundColor: '#1e1e1e',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  formTitle: {
    marginTop: 0,
    marginBottom: '20px',
    fontSize: '18px'
  },
  formGroup: {
    marginBottom: '16px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#ccc'
  },
  input: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '10px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1
  },
  cancelButton: {
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  matchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  loadingText: {
    textAlign: 'center',
    color: '#888',
    padding: '40px'
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    padding: '40px'
  },
  matchCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid #333',
    position: 'relative'
  },
  currentBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#ff9800',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #333'
  },
  matchTitle: {
    margin: 0,
    fontSize: '20px'
  },
  tournamentName: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#888'
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  scoreSection: {
    display: 'flex',
    gap: '20px',
    marginBottom: '16px'
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: '16px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  teamLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px'
  },
  score: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  roundInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#aaa'
  },
  activeRound: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid #333'
  },
  controlButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  batchCommands: {
    flex: '1 0 100%',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px dashed #444',
    marginTop: '8px'
  },
  batchLabel: {
    fontSize: '13px',
    color: '#aaa',
    fontWeight: 'bold'
  },
  batchButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default MatchManager;
