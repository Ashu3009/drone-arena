import React, { useState } from 'react';
import axios from 'axios';

const ControlPanel = ({ matchId, currentRound }) => {
  const [droneId, setDroneId] = useState('R1');
  const [teamId, setTeamId] = useState('');
  const [message, setMessage] = useState('');

  const MQTT_API = 'http://192.168.0.64:5000/api/mqtt';

  const sendCommand = async (command, additionalData = {}) => {
    try {
      const payload = {
        topic: `drone/${droneId}/config`,
        message: {
          command: command.toUpperCase(),
          ...additionalData
        }
      };

      const response = await axios.post(`${MQTT_API}/publish`, payload);
      setMessage(`✅ ${command} command sent to ${droneId}`);
      console.log('Command sent:', response.data);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      console.error('Error sending command:', error);
    }
  };

  const handleStart = () => {
    if (!matchId || !teamId) {
      setMessage('❌ Please enter Match ID and Team ID');
      return;
    }
    sendCommand('START', {
      matchId,
      teamId,
      roundNumber: currentRound
    });
  };

  const handleStop = () => {
    sendCommand('STOP');
  };

  const handleReset = () => {
    sendCommand('RESET');
  };

  return (
    <div style={styles.container}>
      <h2>🎮 Drone Control Panel</h2>
      
      <div style={styles.inputGroup}>
        <label>Drone ID:</label>
        <select value={droneId} onChange={(e) => setDroneId(e.target.value)} style={styles.select}>
          <option value="R1">R1</option>
          <option value="R2">R2</option>
          <option value="R3">R3</option>
          <option value="R4">R4</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="B3">B3</option>
          <option value="B4">B4</option>
        </select>
      </div>

      <div style={styles.inputGroup}>
        <label>Team ID:</label>
        <input
          type="text"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="68f88b24e557ffe58546ca66"
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label>Match ID:</label>
        <input
          type="text"
          value={matchId}
          readOnly
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label>Current Round:</label>
        <input
          type="text"
          value={currentRound}
          readOnly
          style={styles.input}
        />
      </div>

      <div style={styles.buttonGroup}>
        <button onClick={handleStart} style={{...styles.button, ...styles.startButton}}>
          🚀 START
        </button>
        <button onClick={handleStop} style={{...styles.button, ...styles.stopButton}}>
          🛑 STOP
        </button>
        <button onClick={handleReset} style={{...styles.button, ...styles.resetButton}}>
          🔄 RESET
        </button>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '10px',
    color: 'white',
    maxWidth: '500px',
    margin: '20px auto'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  select: {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    borderRadius: '5px',
    border: '1px solid #444',
    backgroundColor: '#2a2a2a',
    color: 'white',
    fontSize: '16px'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    borderRadius: '5px',
    border: '1px solid #444',
    backgroundColor: '#2a2a2a',
    color: 'white',
    fontSize: '14px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  button: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  startButton: {
    backgroundColor: '#4CAF50',
    color: 'white'
  },
  stopButton: {
    backgroundColor: '#f44336',
    color: 'white'
  },
  resetButton: {
    backgroundColor: '#2196F3',
    color: 'white'
  },
  message: {
    marginTop: '15px',
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#2a2a2a',
    textAlign: 'center'
  }
};

export default ControlPanel;