import React, { useState, useEffect } from 'react';
import { getCurrentMatch } from '../../services/api';
import { initSocket, joinMatch, leaveMatch, onRoundStarted, onScoreUpdated, onRoundEnded, onMatchCompleted, onTelemetry, removeAllListeners } from '../../services/socket';
import Arena3D from './Arena3D';
import Leaderboard from './Leaderboard';

const PublicViewer = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [telemetryData, setTelemetryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveUpdate, setLiveUpdate] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    initSocket();

    // Load current match
    loadCurrentMatch();

    // Cleanup on unmount
    return () => {
      if (currentMatch) {
        leaveMatch(currentMatch._id);
      }
      removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (currentMatch) {
      // Join match room
      joinMatch(currentMatch._id);

      // Setup real-time listeners
      onRoundStarted((data) => {
        console.log('Round started:', data);
        setLiveUpdate(`Round ${data.roundNumber} started!`);
        setTimeout(() => setLiveUpdate(null), 3000);
        loadCurrentMatch();
      });

      onScoreUpdated((data) => {
        console.log('Score updated:', data);
        setCurrentMatch(prev => ({
          ...prev,
          teamAScore: data.teamAScore,
          teamBScore: data.teamBScore
        }));
        setLiveUpdate(`Score updated: ${data.teamAScore} - ${data.teamBScore}`);
        setTimeout(() => setLiveUpdate(null), 3000);
      });

      onRoundEnded((data) => {
        console.log('Round ended:', data);
        setLiveUpdate(`Round ${data.roundNumber} ended!`);
        setTimeout(() => setLiveUpdate(null), 3000);
        loadCurrentMatch();
      });

      onMatchCompleted((data) => {
        console.log('Match completed:', data);
        setLiveUpdate(`Match completed! Winner: ${data.winner}`);
        setTimeout(() => setLiveUpdate(null), 5000);
        loadCurrentMatch();
      });

      onTelemetry((data) => {
        // Update telemetry data for 3D visualization
        setTelemetryData(prev => {
          const existing = prev.find(d => d.droneId === data.droneId);
          if (existing) {
            return prev.map(d => d.droneId === data.droneId ? data : d);
          } else {
            return [...prev, data];
          }
        });
      });
    }
  }, [currentMatch]);

  const loadCurrentMatch = async () => {
    setLoading(true);
    try {
      const response = await getCurrentMatch();
      if (response.success && response.data) {
        setCurrentMatch(response.data);
      } else {
        setCurrentMatch(null);
      }
    } catch (error) {
      console.error('Error loading current match:', error);
      setCurrentMatch(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div style={styles.noMatch}>
        <h1>No Live Match</h1>
        <p>There is no match currently in progress.</p>
        <p>Check back later!</p>
      </div>
    );
  }

  const activeRound = currentMatch.rounds?.find(r => r.status === 'in_progress');

  return (
    <div style={styles.container}>
      {/* Live Update Banner */}
      {liveUpdate && (
        <div style={styles.liveUpdateBanner}>
          {liveUpdate}
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Drone Arena - Live Match</h1>
          <div style={styles.liveBadge}>LIVE</div>
        </div>
        <p style={styles.tournament}>{currentMatch.tournament?.name || 'Tournament'}</p>
      </header>

      {/* Match Info */}
      <div style={styles.matchInfo}>
        <div style={styles.team}>
          <h2 style={styles.teamName}>{currentMatch.teamA?.name || 'Team A'}</h2>
          <div style={styles.scoreDisplay}>{currentMatch.teamAScore || 0}</div>
        </div>

        <div style={styles.vsSection}>
          <span style={styles.vs}>VS</span>
          <div style={styles.roundInfo}>
            <span>Round {currentMatch.currentRound || 1} / 3</span>
            {activeRound && <span style={styles.roundStatus}>IN PROGRESS</span>}
          </div>
        </div>

        <div style={styles.team}>
          <h2 style={styles.teamName}>{currentMatch.teamB?.name || 'Team B'}</h2>
          <div style={styles.scoreDisplay}>{currentMatch.teamBScore || 0}</div>
        </div>
      </div>

      {/* 3D Arena View */}
      <div style={styles.arenaSection}>
        <h3 style={styles.sectionTitle}>3D Arena View</h3>
        <Arena3D telemetryData={telemetryData} />
      </div>

      {/* Leaderboard */}
      <div style={styles.leaderboardSection}>
        <Leaderboard tournamentId={currentMatch.tournament?._id} />
      </div>

      {/* Admin Link */}
      <div style={styles.footer}>
        <a href="/admin/login" style={styles.adminLink}>Admin Login</a>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: 'white',
    paddingBottom: '40px'
  },
  loading: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  noMatch: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  },
  liveUpdateBanner: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '16px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    animation: 'slideDown 0.3s ease'
  },
  header: {
    backgroundColor: '#1e1e1e',
    padding: '30px 40px',
    borderBottom: '2px solid #333'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '8px'
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold'
  },
  liveBadge: {
    backgroundColor: '#ff0000',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    animation: 'pulse 2s infinite'
  },
  tournament: {
    margin: 0,
    color: '#888',
    fontSize: '16px'
  },
  matchInfo: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '40px',
    backgroundColor: '#1e1e1e',
    marginBottom: '30px'
  },
  team: {
    textAlign: 'center',
    flex: 1
  },
  teamName: {
    fontSize: '28px',
    margin: '0 0 20px 0',
    fontWeight: 'bold'
  },
  scoreDisplay: {
    fontSize: '72px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  vsSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '0 40px'
  },
  vs: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#666'
  },
  roundInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    color: '#aaa'
  },
  roundStatus: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  arenaSection: {
    padding: '0 40px',
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid #333'
  },
  leaderboardSection: {
    padding: '0 40px'
  },
  footer: {
    textAlign: 'center',
    padding: '40px',
    marginTop: '40px',
    borderTop: '1px solid #333'
  },
  adminLink: {
    color: '#4CAF50',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default PublicViewer;
