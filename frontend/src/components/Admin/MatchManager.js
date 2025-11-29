import React, { useState, useEffect } from 'react';
import {
  getMatches,
  getTournaments,
  getTournamentById,
  getTeams,
  createMatch,
  deleteMatch,
  setCurrentMatch,
  startRound,
  endRound,
  completeMatch,
  startAllDrones,
  stopAllDrones,
  resetAllDrones,
  pauseTimer,
  resumeTimer,
  resetTimer,
  registerDronesForRound,
  updateMatchScore,
  setManOfTheMatch
} from '../../services/api';
import DroneSelector from './DroneSelector';
import TimerDisplay from './TimerDisplay';

const MatchManager = () => {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]); // Filtered teams based on selected tournament
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState(''); // Filter for viewing matches
  const [expandedRounds, setExpandedRounds] = useState({}); // Track which rounds are expanded {matchId: roundNumber}
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    tournament: '',
    teamA: '',
    teamB: ''
  });

  // Man of the Match modal state
  const [showMOMModal, setShowMOMModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [momData, setMomData] = useState({
    selectedTeam: '',
    playerName: '',
    goals: 0,
    assists: 0,
    saves: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  // Fetch tournament's registered teams when tournament is selected
  useEffect(() => {
    const fetchTournamentTeams = async () => {
      if (!formData.tournament) {
        setAvailableTeams([]);
        return;
      }

      try {
        const response = await getTournamentById(formData.tournament);
        if (response.success && response.data.registeredTeams) {
          setAvailableTeams(response.data.registeredTeams);
          // Reset team selection when tournament changes
          setFormData(prev => ({ ...prev, teamA: '', teamB: '' }));
        }
      } catch (error) {
        console.error('Error fetching tournament teams:', error);
        setAvailableTeams([]);
      }
    };

    fetchTournamentTeams();
  }, [formData.tournament]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchesRes, tournamentsRes, teamsRes] = await Promise.all([
        getMatches(),
        getTournaments(),
        getTeams()
      ]);

      if (matchesRes.success) setMatches(matchesRes.data);
      if (tournamentsRes.success) {
        // Filter to show only upcoming and ongoing tournaments for match creation
        const activeTournaments = tournamentsRes.data.filter(
          t => t.status === 'upcoming' || t.status === 'ongoing'
        );
        setTournaments(activeTournaments);
      }
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
      const response = await startRound(matchId);
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
    if (!window.confirm(`End Round ${roundNumber}? This will trigger ML analysis.`)) return;

    setLoading(true);
    try {
      const response = await endRound(matchId);
      if (response.success) {
        alert(`Round ${roundNumber} ended successfully!`);
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

  // Timer control handlers
  const handlePauseTimer = async (matchId, roundNumber) => {
    setLoading(true);
    try {
      const response = await pauseTimer(matchId, roundNumber);
      if (response.success) {
        alert('Timer paused!');
        loadData();
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      alert(error.response?.data?.message || 'Failed to pause timer');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeTimer = async (matchId, roundNumber) => {
    setLoading(true);
    try {
      const response = await resumeTimer(matchId, roundNumber);
      if (response.success) {
        alert('Timer resumed!');
        loadData();
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
      alert(error.response?.data?.message || 'Failed to resume timer');
    } finally {
      setLoading(false);
    }
  };

  const handleResetTimer = async (matchId, roundNumber) => {
    if (!window.confirm('Reset timer to 0? This will restart the timer.')) return;

    setLoading(true);
    try {
      const response = await resetTimer(matchId, roundNumber);
      if (response.success) {
        alert('Timer reset!');
        loadData();
      }
    } catch (error) {
      console.error('Error resetting timer:', error);
      alert(error.response?.data?.message || 'Failed to reset timer');
    } finally {
      setLoading(false);
    }
  };

  // Drone registration handler
  const handleRegisterDrones = async (matchId, roundNumber, drones) => {
    setLoading(true);
    try {
      const response = await registerDronesForRound(matchId, roundNumber, drones);
      if (response.success) {
        alert(`Drones registered for Round ${roundNumber}!`);
        loadData();
      }
    } catch (error) {
      console.error('Error registering drones:', error);
      alert(error.response?.data?.message || 'Failed to register drones');
    } finally {
      setLoading(false);
    }
  };

  // Manual Score Update Handler
  const handleScoreUpdate = async (matchId, team, increment) => {
    try {
      const response = await updateMatchScore(matchId, team, increment);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error updating score:', error);
      alert(error.response?.data?.message || 'Failed to update score');
    }
  };

  // Man of the Match handlers
  const handleOpenMOMModal = (match) => {
    setSelectedMatch(match);
    setShowMOMModal(true);
    setMomData({
      selectedTeam: '',
      playerName: '',
      goals: 0,
      assists: 0,
      saves: 0
    });
  };

  const handleCloseMOMModal = () => {
    setShowMOMModal(false);
    setSelectedMatch(null);
    setMomData({
      selectedTeam: '',
      playerName: '',
      goals: 0,
      assists: 0,
      saves: 0
    });
  };

  const handleSetManOfMatch = async (e) => {
    e.preventDefault();

    if (!momData.selectedTeam || !momData.playerName) {
      alert('Please select team and player');
      return;
    }

    setLoading(true);
    try {
      const response = await setManOfTheMatch(selectedMatch._id, {
        playerName: momData.playerName,
        teamId: momData.selectedTeam,
        stats: {
          goals: parseInt(momData.goals) || 0,
          assists: parseInt(momData.assists) || 0,
          saves: parseInt(momData.saves) || 0
        }
      });

      if (response.success) {
        alert('Man of the Match set successfully!');
        handleCloseMOMModal();
        loadData();
      }
    } catch (error) {
      console.error('Error setting Man of the Match:', error);
      alert(error.response?.data?.message || 'Failed to set Man of the Match');
    } finally {
      setLoading(false);
    }
  };

  // Get available players for selected team
  const getAvailablePlayers = () => {
    if (!selectedMatch || !momData.selectedTeam) {
      return [];
    }

    // Safely convert IDs to strings for comparison
    const selectedTeamId = String(momData.selectedTeam);
    const teamAId = String(selectedMatch.teamA?._id || '');
    const teamBId = String(selectedMatch.teamB?._id || '');

    const team = selectedTeamId === teamAId
      ? selectedMatch.teamA
      : selectedMatch.teamB;

    return team?.members || [];
  };

  // Toggle round expansion
  const toggleRound = (matchId, roundNumber) => {
    setExpandedRounds(prev => {
      const key = `${matchId}-${roundNumber}`;
      if (prev[key]) {
        // Collapse if already expanded
        const newState = { ...prev };
        delete newState[key];
        return newState;
      } else {
        // Expand this round
        return { ...prev, [key]: true };
      }
    });
  };

  const isRoundExpanded = (matchId, roundNumber) => {
    return expandedRounds[`${matchId}-${roundNumber}`] || false;
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
                disabled={!formData.tournament || availableTeams.length === 0}
              >
                <option value="">
                  {!formData.tournament
                    ? 'Select Tournament First'
                    : availableTeams.length === 0
                    ? 'No Teams Registered in Tournament'
                    : 'Select Team A'}
                </option>
                {availableTeams.map(t => (
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
                disabled={!formData.tournament || availableTeams.length === 0}
                required
              >
                <option value="">
                  {!formData.tournament
                    ? 'Select Tournament First'
                    : availableTeams.length === 0
                    ? 'No Teams Registered in Tournament'
                    : 'Select Team B'}
                </option>
                {availableTeams.map(t => (
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

      {/* Tournament Filter */}
      <div style={styles.filterSection}>
        <label style={styles.filterLabel}>Filter by Tournament:</label>
        <select
          value={selectedTournamentFilter}
          onChange={(e) => setSelectedTournamentFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Tournaments</option>
          {tournaments.map((tournament) => (
            <option key={tournament._id} value={tournament._id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {/* Matches List */}
      <div style={styles.matchList}>
        {loading && matches.length === 0 ? (
          <p style={styles.loadingText}>Loading matches...</p>
        ) : matches.length === 0 ? (
          <p style={styles.emptyText}>No matches found. Create your first match!</p>
        ) : (
          matches
            .filter((match) =>
              !selectedTournamentFilter || match.tournament?._id === selectedTournamentFilter
            )
            .map((match) => {
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
                      Match {match.matchNumber || '?'}: {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
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

                {/* Rounds Section */}
                <div style={styles.roundsContainer}>
                  <h4 style={styles.roundsTitle}>Rounds</h4>

                  {match.rounds && match.rounds.map((round) => {
                    const isExpanded = isRoundExpanded(match._id, round.roundNumber);
                    return (
                    <div key={round.roundNumber} style={{
                      ...styles.roundCard,
                      border: round.status === 'in_progress' ? '2px solid #4CAF50' : '1px solid #444'
                    }}>
                      {/* Round Header - Clickable */}
                      <div
                        style={{...styles.roundHeader, cursor: 'pointer'}}
                        onClick={() => toggleRound(match._id, round.roundNumber)}
                      >
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <span style={{fontSize: '16px'}}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                          <h5 style={styles.roundTitle}>Round {round.roundNumber}</h5>
                        </div>
                        <span style={{
                          ...styles.roundStatusBadge,
                          backgroundColor:
                            round.status === 'completed' ? '#2196F3' :
                            round.status === 'in_progress' ? '#4CAF50' : '#666'
                        }}>
                          {round.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>

                      {/* Collapsible Round Content */}
                      {isExpanded && (<>


                      {/* Round Scores */}
                      {(round.status === 'in_progress' || round.status === 'completed') && (
                        <div style={styles.roundScores}>
                          <div style={styles.roundScore}>
                            <span style={styles.scoreLabel}>{match.teamA?.name}</span>
                            <span style={styles.scoreValue}>{round.teamAScore || 0}</span>
                            {/* Manual Score Control - Team A */}
                            {round.status === 'in_progress' && (
                              <div style={styles.scoreControls}>
                                <button
                                  onClick={() => handleScoreUpdate(match._id, 'A', -1)}
                                  style={{...styles.scoreButton, backgroundColor: '#ff5722'}}
                                  disabled={loading}
                                >
                                  -1
                                </button>
                                <button
                                  onClick={() => handleScoreUpdate(match._id, 'A', 1)}
                                  style={{...styles.scoreButton, backgroundColor: '#4CAF50'}}
                                  disabled={loading}
                                >
                                  +1
                                </button>
                              </div>
                            )}
                          </div>
                          <div style={styles.roundScore}>
                            <span style={styles.scoreLabel}>{match.teamB?.name}</span>
                            <span style={styles.scoreValue}>{round.teamBScore || 0}</span>
                            {/* Manual Score Control - Team B */}
                            {round.status === 'in_progress' && (
                              <div style={styles.scoreControls}>
                                <button
                                  onClick={() => handleScoreUpdate(match._id, 'B', -1)}
                                  style={{...styles.scoreButton, backgroundColor: '#ff5722'}}
                                  disabled={loading}
                                >
                                  -1
                                </button>
                                <button
                                  onClick={() => handleScoreUpdate(match._id, 'B', 1)}
                                  style={{...styles.scoreButton, backgroundColor: '#4CAF50'}}
                                  disabled={loading}
                                >
                                  +1
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Registered Drones Display */}
                      {round.registeredDrones && round.registeredDrones.length > 0 && (
                        <div style={styles.registeredDrones}>
                          <span style={styles.dronesLabel}>Registered Drones:</span>
                          <div style={styles.dronesList}>
                            {round.registeredDrones.map((drone, idx) => (
                              <span key={idx} style={{
                                ...styles.droneChip,
                                backgroundColor: drone.droneId.startsWith('R') ? '#ff4444' : '#4444ff'
                              }}>
                                {drone.droneId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timer Display (when round is active) */}
                      {round.status === 'in_progress' && round.timerStatus && (
                        <TimerDisplay
                          round={round}
                          matchId={match._id}
                          onPause={handlePauseTimer}
                          onResume={handleResumeTimer}
                          onReset={handleResetTimer}
                        />
                      )}

                      {/* Drone Selector (before starting round) */}
                      {round.status === 'pending' && (!round.registeredDrones || round.registeredDrones.length === 0) && (
                        <DroneSelector
                          matchId={match._id}
                          roundNumber={round.roundNumber}
                          teamA={match.teamA}
                          teamB={match.teamB}
                          onRegister={(roundNumber, drones) => handleRegisterDrones(match._id, roundNumber, drones)}
                        />
                      )}

                      {/* Round Controls */}
                      {round.status === 'pending' && round.registeredDrones && round.registeredDrones.length > 0 && (
                        <button
                          onClick={() => handleStartRound(match._id, round.roundNumber)}
                          style={{...styles.controlButton, backgroundColor: '#4CAF50', width: '100%', marginTop: '10px'}}
                          disabled={loading}
                        >
                          Start Round {round.roundNumber}
                        </button>
                      )}

                      {round.status === 'in_progress' && (
                        <button
                          onClick={() => handleEndRound(match._id, round.roundNumber)}
                          style={{...styles.controlButton, backgroundColor: '#ff9800', width: '100%', marginTop: '10px'}}
                          disabled={loading}
                        >
                          End Round {round.roundNumber}
                        </button>
                      )}
                      </>)}
                    </div>
                  );
                  })}
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

                  {activeRound && (
                    <>
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

                  {/* Man of the Match Button (for completed matches) */}
                  {match.status === 'completed' && (
                    <button
                      onClick={() => handleOpenMOMModal(match)}
                      style={{...styles.controlButton, backgroundColor: '#9C27B0'}}
                      disabled={loading}
                    >
                      {match.manOfTheMatch?.playerName ? '✓ Man of Match Set' : 'Set Man of Match'}
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

      {/* Man of the Match Modal */}
      {showMOMModal && selectedMatch && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Set Man of the Match</h3>
            <p style={styles.modalSubtitle}>
              {selectedMatch.teamA?.name} vs {selectedMatch.teamB?.name}
            </p>

            <form onSubmit={handleSetManOfMatch}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Team *</label>
                <select
                  value={momData.selectedTeam}
                  onChange={(e) => setMomData({ ...momData, selectedTeam: e.target.value, playerName: '' })}
                  style={styles.input}
                  required
                >
                  <option value="">Choose Team</option>
                  <option value={selectedMatch.teamA._id}>{selectedMatch.teamA.name}</option>
                  <option value={selectedMatch.teamB._id}>{selectedMatch.teamB.name}</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Select Player *</label>
                <select
                  value={momData.playerName}
                  onChange={(e) => setMomData({ ...momData, playerName: e.target.value })}
                  style={styles.input}
                  disabled={!momData.selectedTeam}
                  required
                >
                  <option value="">
                    {!momData.selectedTeam ? 'Select Team First' :
                     getAvailablePlayers().length === 0 ? 'No players found in this team' :
                     'Choose Player'}
                  </option>
                  {getAvailablePlayers().map((member, idx) => (
                    <option key={idx} value={member.name}>
                      {member.name} - {member.role}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Goals</label>
                  <input
                    type="number"
                    min="0"
                    value={momData.goals}
                    onChange={(e) => setMomData({ ...momData, goals: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Assists</label>
                  <input
                    type="number"
                    min="0"
                    value={momData.assists}
                    onChange={(e) => setMomData({ ...momData, assists: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Saves</label>
                  <input
                    type="number"
                    min="0"
                    value={momData.saves}
                    onChange={(e) => setMomData({ ...momData, saves: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitButton} disabled={loading}>
                  {loading ? 'Setting...' : 'Set Man of the Match'}
                </button>
                <button type="button" onClick={handleCloseMOMModal} style={styles.cancelButton} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  filterSection: {
    backgroundColor: '#1e1e1e',
    padding: '16px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  filterLabel: {
    fontSize: '14px',
    color: '#ccc',
    fontWeight: '500',
    minWidth: 'fit-content'
  },
  filterSelect: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '10px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    maxWidth: '400px'
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
    padding: '20px',
    border: '1px solid #333',
    position: 'relative',
    maxWidth: '900px',
    margin: '0 auto'
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
  },
  // New round styles
  roundsContainer: {
    marginTop: '20px',
    marginBottom: '20px'
  },
  roundsTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    color: '#fff',
    fontWeight: 'bold'
  },
  roundCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px'
  },
  roundHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  roundTitle: {
    margin: 0,
    fontSize: '16px',
    color: '#fff'
  },
  roundStatusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'white'
  },
  roundScores: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px'
  },
  roundScore: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#1e1e1e',
    borderRadius: '6px'
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '6px'
  },
  scoreValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  registeredDrones: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#1e1e1e',
    borderRadius: '6px'
  },
  dronesLabel: {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '8px',
    display: 'block'
  },
  dronesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  droneChip: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'white'
  },
  scoreControls: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    justifyContent: 'center'
  },
  scoreButton: {
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '50px',
    transition: 'transform 0.1s ease'
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid #444'
  },
  modalTitle: {
    margin: '0 0 8px 0',
    fontSize: '22px',
    color: '#fff'
  },
  modalSubtitle: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#888'
  },
  statsRow: {
    display: 'flex',
    gap: '16px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  }
};

export default MatchManager;
