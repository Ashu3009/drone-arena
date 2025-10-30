import React, { useState, useEffect } from 'react';
import ControlPanel from './ControlPanel';
import DroneView3D from './DroneView3D';
import TelemetryGraph from './TelemetryGraph';
import { getMatches, getAllTelemetry } from '../services/api';

const Dashboard = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [telemetryData, setTelemetryData] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState('R1');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load matches on component mount
  useEffect(() => {
    loadMatches();
  }, []);

  // Auto-refresh telemetry every 2 seconds
  useEffect(() => {
    if (autoRefresh && selectedMatch) {
      const interval = setInterval(() => {
        loadTelemetry();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedMatch]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await getMatches();
      if (response.success) {
        setMatches(response.data);
        // Auto-select first match
        if (response.data.length > 0) {
          setSelectedMatch(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTelemetry = async () => {
    if (!selectedMatch) return;
    
    try {
      const response = await getAllTelemetry(selectedMatch._id);
      if (response.success) {
        setTelemetryData(response.data);
      }
    } catch (error) {
      console.error('Error loading telemetry:', error);
    }
  };

  const getSelectedDroneTelemetry = () => {
    const droneData = telemetryData.find(d => d.droneId === selectedDrone);
    return droneData ? droneData.logs : [];
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>⏳ Loading...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1>⚽ Drone Football Arena Dashboard</h1>
        <div style={styles.headerInfo}>
          <span>📡 Live Telemetry</span>
          <label style={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (2s)
          </label>
        </div>
      </header>

      {/* Match selector */}
      <div style={styles.matchSelector}>
        <label>Select Match:</label>
        <select 
          value={selectedMatch?._id || ''} 
          onChange={(e) => {
            const match = matches.find(m => m._id === e.target.value);
            setSelectedMatch(match);
          }}
          style={styles.select}
        >
          {matches.map(match => (
            <option key={match._id} value={match._id}>
              {match.tournament?.name || 'Tournament'} - Round {match.currentRound} ({match.status})
            </option>
          ))}
        </select>
        <button onClick={loadMatches} style={styles.refreshButton}>
          🔄 Refresh Matches
        </button>
        <button onClick={loadTelemetry} style={styles.refreshButton}>
          📊 Refresh Telemetry
        </button>
      </div>

      {selectedMatch && (
        <>
          {/* Match Info */}
          <div style={styles.matchInfo}>
            <div style={styles.infoCard}>
              <strong>🏆 Tournament:</strong> {selectedMatch.tournament?.name || 'N/A'}
            </div>
            <div style={styles.infoCard}>
              <strong>📍 Match ID:</strong> {selectedMatch._id}
            </div>
            <div style={styles.infoCard}>
              <strong>🔴 Team A:</strong> {selectedMatch.teamA?.name || 'N/A'}
            </div>
            <div style={styles.infoCard}>
              <strong>🔵 Team B:</strong> {selectedMatch.teamB?.name || 'N/A'}
            </div>
            <div style={styles.infoCard}>
              <strong>🎯 Round:</strong> {selectedMatch.currentRound} / 3
            </div>
            <div style={styles.infoCard}>
              <strong>📊 Status:</strong> {selectedMatch.status}
            </div>
          </div>

          {/* Control Panel */}
          <ControlPanel 
            matchId={selectedMatch._id} 
            currentRound={selectedMatch.currentRound}
          />

          {/* 3D Arena View */}
          <DroneView3D telemetryData={telemetryData} />

          {/* Drone selector for graphs */}
          <div style={styles.droneSelector}>
            <label>Select Drone for Detailed View:</label>
            <select 
              value={selectedDrone} 
              onChange={(e) => setSelectedDrone(e.target.value)}
              style={styles.select}
            >
              <option value="R1">R1 - Red Team</option>
              <option value="R2">R2 - Red Team</option>
              <option value="R3">R3 - Red Team</option>
              <option value="R4">R4 - Red Team</option>
              <option value="B1">B1 - Blue Team</option>
              <option value="B2">B2 - Blue Team</option>
              <option value="B3">B3 - Blue Team</option>
              <option value="B4">B4 - Blue Team</option>
            </select>
          </div>

          {/* Telemetry Graph */}
          <TelemetryGraph 
            telemetryData={getSelectedDroneTelemetry()} 
            droneId={selectedDrone}
          />
        </>
      )}

      {!selectedMatch && (
        <div style={styles.noMatch}>
          <h2>⚠️ No match selected</h2>
          <p>Create a match using the backend API or select an existing match.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: 'white',
    padding: '20px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: 'white'
  },
  header: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  headerInfo: {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    alignItems: 'center'
  },
  autoRefreshLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  matchSelector: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  select: {
    flex: 1,
    minWidth: '200px',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #444',
    backgroundColor: '#2a2a2a',
    color: 'white',
    fontSize: '14px'
  },
  refreshButton: {
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  matchInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  infoCard: {
    padding: '12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '5px',
    fontSize: '14px'
  },
  droneSelector: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  noMatch: {
    textAlign: 'center',
    padding: '60px',
    color: '#888'
  }
};

export default Dashboard;