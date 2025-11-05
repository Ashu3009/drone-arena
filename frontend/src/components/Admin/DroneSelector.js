import React, { useState, useEffect } from 'react';
import { getAllDrones, getDronesByRole } from '../../services/api';

const DroneSelector = ({ matchId, roundNumber, teamA, teamB, onRegister }) => {
  const [allDrones, setAllDrones] = useState([]);
  const [teamALineup, setTeamALineup] = useState([
    { position: 'Forward', pilot: '', droneId: '', role: 'Forward' },
    { position: 'Center', pilot: '', droneId: '', role: 'Center' },
    { position: 'Defender', pilot: '', droneId: '', role: 'Defender' },
    { position: 'Keeper', pilot: '', droneId: '', role: 'Keeper' }
  ]);
  const [teamBLineup, setTeamBLineup] = useState([
    { position: 'Forward', pilot: '', droneId: '', role: 'Forward' },
    { position: 'Center', pilot: '', droneId: '', role: 'Center' },
    { position: 'Defender', pilot: '', droneId: '', role: 'Defender' },
    { position: 'Keeper', pilot: '', droneId: '', role: 'Keeper' }
  ]);

  useEffect(() => {
    loadDrones();
  }, []);

  const loadDrones = async () => {
    try {
      const response = await getAllDrones();
      if (response.success) {
        setAllDrones(response.data);
      }
    } catch (error) {
      console.error('Error loading drones:', error);
    }
  };

  const getRoleEmoji = (role) => {
    const emojis = {
      Forward: '⚡',
      Center: '⚖️',
      Defender: '🛡️',
      Keeper: '🔋'
    };
    return emojis[role] || '🤖';
  };

  // Get team members filtered by role (including All-rounders)
  const getMembersByRole = (team, role) => {
    if (!team || !team.members) return [];
    return team.members.filter(m => m.role === role || m.role === 'All-rounder');
  };

  // Get drones filtered by role and status
  const getDronesByRoleFiltered = (role) => {
    return allDrones.filter(d => d.role === role && d.status === 'Active');
  };

  const handleTeamAChange = (index, field, value) => {
    const newLineup = [...teamALineup];
    newLineup[index] = { ...newLineup[index], [field]: value };
    setTeamALineup(newLineup);
  };

  const handleTeamBChange = (index, field, value) => {
    const newLineup = [...teamBLineup];
    newLineup[index] = { ...newLineup[index], [field]: value };
    setTeamBLineup(newLineup);
  };

  const handleRegister = async () => {
    // Validate Team A
    const teamAValid = teamALineup.every(item => item.pilot && item.droneId);
    if (!teamAValid) {
      alert(`Please select pilot and drone for all ${teamA?.name} positions`);
      return;
    }

    // Validate Team B
    const teamBValid = teamBLineup.every(item => item.pilot && item.droneId);
    if (!teamBValid) {
      alert(`Please select pilot and drone for all ${teamB?.name} positions`);
      return;
    }

    // Check for duplicate drones
    const allSelectedDrones = [
      ...teamALineup.map(l => l.droneId),
      ...teamBLineup.map(l => l.droneId)
    ];
    const uniqueDrones = new Set(allSelectedDrones);
    if (uniqueDrones.size !== allSelectedDrones.length) {
      alert('Each drone can only be used once per round!');
      return;
    }

    // Get drone specifications for each selected drone
    const getDroneSpecs = (droneId) => {
      const drone = allDrones.find(d => d.droneId === droneId);
      return drone ? drone.specifications : {};
    };

    // Format for backend: [{droneId, team, role, pilot, specifications}, ...]
    const dronesArray = [
      ...teamALineup.map(item => ({
        droneId: item.droneId,
        team: teamA._id,
        role: item.role,
        pilot: item.pilot,
        specifications: getDroneSpecs(item.droneId)
      })),
      ...teamBLineup.map(item => ({
        droneId: item.droneId,
        team: teamB._id,
        role: item.role,
        pilot: item.pilot,
        specifications: getDroneSpecs(item.droneId)
      }))
    ];

    await onRegister(roundNumber, dronesArray);
  };

  const renderPositionSelector = (lineup, setLineup, team, teamColor) => {
    return lineup.map((item, index) => {
      const members = getMembersByRole(team, item.role);
      const drones = getDronesByRoleFiltered(item.role);

      return (
        <div key={index} style={styles.positionRow}>
          <div style={styles.positionLabel}>
            {getRoleEmoji(item.role)} {item.position}
          </div>

          <div style={styles.selectorGroup}>
            <div style={styles.selectWrapper}>
              <label style={styles.selectLabel}>Pilot:</label>
              <select
                value={item.pilot}
                onChange={(e) => {
                  if (team === teamA) {
                    handleTeamAChange(index, 'pilot', e.target.value);
                  } else {
                    handleTeamBChange(index, 'pilot', e.target.value);
                  }
                }}
                style={styles.select}
              >
                <option value="">Select Pilot</option>
                {members.map((member, idx) => (
                  <option key={idx} value={member.name}>
                    {member.name} {member.role === 'All-rounder' ? '🌟' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.selectWrapper}>
              <label style={styles.selectLabel}>Drone:</label>
              <select
                value={item.droneId}
                onChange={(e) => {
                  if (team === teamA) {
                    handleTeamAChange(index, 'droneId', e.target.value);
                  } else {
                    handleTeamBChange(index, 'droneId', e.target.value);
                  }
                }}
                style={styles.select}
                disabled={!item.pilot}
              >
                <option value="">Select Drone</option>
                {drones.map((drone, idx) => (
                  <option key={idx} value={drone.droneId}>
                    {drone.droneId} - Speed: {drone.specifications.speed}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {item.pilot && item.droneId && (
            <div style={styles.selectionSummary}>
              ✅ {item.pilot} → {item.droneId}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Configure Round {roundNumber} Lineup</h4>
      <p style={styles.subtitle}>Select pilot and drone for each position (4 positions per team)</p>

      {/* Team A */}
      <div style={styles.teamSection}>
        <h5 style={{ ...styles.teamTitle, color: '#ff4444' }}>
          {teamA?.name || 'Team A'}
        </h5>
        {renderPositionSelector(teamALineup, setTeamALineup, teamA, '#ff4444')}
      </div>

      {/* Team B */}
      <div style={styles.teamSection}>
        <h5 style={{ ...styles.teamTitle, color: '#4444ff' }}>
          {teamB?.name || 'Team B'}
        </h5>
        {renderPositionSelector(teamBLineup, setTeamBLineup, teamB, '#4444ff')}
      </div>

      <button
        onClick={handleRegister}
        style={styles.registerButton}
      >
        Register Lineup for Round {roundNumber}
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    marginBottom: '20px',
    color: 'white'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  subtitle: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#aaa'
  },
  teamSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px'
  },
  teamTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  positionRow: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#1e1e1e',
    borderRadius: '6px',
    border: '1px solid #444'
  },
  positionLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#fff'
  },
  selectorGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  selectWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  selectLabel: {
    fontSize: '13px',
    marginBottom: '6px',
    color: '#aaa'
  },
  select: {
    padding: '10px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer'
  },
  selectionSummary: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#2a4a2a',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#4CAF50',
    textAlign: 'center'
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '16px 32px',
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
