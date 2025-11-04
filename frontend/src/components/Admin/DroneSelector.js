import React, { useState } from 'react';

const DroneSelector = ({ matchId, roundNumber, teamA, teamB, onRegister }) => {
  const [selectedDrones, setSelectedDrones] = useState({
    teamA: [],
    teamB: []
  });

  const redDrones = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];
  const blueDrones = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'];

  const toggleDrone = (team, droneId) => {
    setSelectedDrones(prev => {
      const teamDrones = prev[team];
      const isSelected = teamDrones.includes(droneId);

      // Max 8 drones per team
      if (!isSelected && teamDrones.length >= 8) {
        alert('Maximum 8 drones allowed per team');
        return prev;
      }

      return {
        ...prev,
        [team]: isSelected
          ? teamDrones.filter(d => d !== droneId)
          : [...teamDrones, droneId]
      };
    });
  };

  const handleRegister = async () => {
    // Validation - at least 1 drone per team, max 8
    if (selectedDrones.teamA.length < 1 || selectedDrones.teamA.length > 8) {
      alert('Team A must select 1-8 drones');
      return;
    }
    if (selectedDrones.teamB.length < 1 || selectedDrones.teamB.length > 8) {
      alert('Team B must select 1-8 drones');
      return;
    }

    // Format: [{droneId: 'R1', team: teamA._id}, ...]
    const dronesArray = [
      ...selectedDrones.teamA.map(droneId => ({
        droneId,
        team: teamA._id
      })),
      ...selectedDrones.teamB.map(droneId => ({
        droneId,
        team: teamB._id
      }))
    ];

    await onRegister(roundNumber, dronesArray);
  };

  return (
    <div style={styles.container}>
      <h4>Register Drones for Round {roundNumber}</h4>

      <div style={styles.teamSection}>
        <h5 style={{ color: '#ff4444' }}>{teamA?.name} (Red Drones)</h5>
        <div style={styles.droneGrid}>
          {redDrones.map(droneId => (
            <button
              key={droneId}
              onClick={() => toggleDrone('teamA', droneId)}
              style={{
                ...styles.droneButton,
                backgroundColor: selectedDrones.teamA.includes(droneId) ? '#ff4444' : '#333',
                border: selectedDrones.teamA.includes(droneId) ? '3px solid #ff8888' : '1px solid #555'
              }}
            >
              {droneId}
            </button>
          ))}
        </div>
        <p>Selected: {selectedDrones.teamA.length} / 8</p>
      </div>

      <div style={styles.teamSection}>
        <h5 style={{ color: '#4444ff' }}>{teamB?.name} (Blue Drones)</h5>
        <div style={styles.droneGrid}>
          {blueDrones.map(droneId => (
            <button
              key={droneId}
              onClick={() => toggleDrone('teamB', droneId)}
              style={{
                ...styles.droneButton,
                backgroundColor: selectedDrones.teamB.includes(droneId) ? '#4444ff' : '#333',
                border: selectedDrones.teamB.includes(droneId) ? '3px solid #8888ff' : '1px solid #555'
              }}
            >
              {droneId}
            </button>
          ))}
        </div>
        <p>Selected: {selectedDrones.teamB.length} / 8</p>
      </div>

      <button
        onClick={handleRegister}
        style={styles.registerButton}
        disabled={selectedDrones.teamA.length < 1 || selectedDrones.teamB.length < 1}
      >
        Register Drones
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    marginBottom: '20px',
    color: 'white'
  },
  teamSection: {
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px'
  },
  droneGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '10px',
    marginTop: '15px',
    marginBottom: '15px'
  },
  droneButton: {
    padding: '15px',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'all 0.3s ease'
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '15px 30px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    width: '100%',
    marginTop: '10px'
  }
};

export default DroneSelector;
