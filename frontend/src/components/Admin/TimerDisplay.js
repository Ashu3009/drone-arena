import React, { useState, useEffect } from 'react';

const TimerDisplay = ({ round, matchId, onPause, onResume, onReset }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const MAX_TIME = 180; // 3 minutes

  useEffect(() => {
    if (round.timerStatus === 'running') {
      const interval = setInterval(() => {
        const now = Date.now();
        const start = new Date(round.startTime).getTime();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);

        // Auto end at 3 minutes
        if (elapsed >= MAX_TIME) {
          clearInterval(interval);
          alert('3 minutes completed! Please end the round.');
        }
      }, 1000);

      return () => clearInterval(interval);
    } else if (round.timerStatus === 'paused') {
      setElapsedTime(round.elapsedTime);
    }
  }, [round]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remaining = MAX_TIME - elapsedTime;
  const percentage = (elapsedTime / MAX_TIME) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.timerDisplay}>
        <span style={styles.timeLabel}>Time Remaining:</span>
        <span style={{
          ...styles.time,
          color: remaining < 30 ? '#ff4444' : remaining < 60 ? '#ff9800' : '#4CAF50'
        }}>
          {formatTime(remaining)}
        </span>
        <span style={styles.elapsedLabel}>Elapsed: {formatTime(elapsedTime)}</span>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressBar}>
        <div style={{
          ...styles.progressFill,
          width: `${percentage}%`,
          backgroundColor: remaining < 30 ? '#ff4444' : remaining < 60 ? '#ff9800' : '#4CAF50'
        }} />
      </div>

      <div style={styles.controls}>
        {round.timerStatus === 'running' && (
          <button onClick={() => onPause(matchId, round.roundNumber)} style={styles.pauseButton}>
            Pause
          </button>
        )}
        {round.timerStatus === 'paused' && (
          <button onClick={() => onResume(matchId, round.roundNumber)} style={styles.resumeButton}>
            Resume
          </button>
        )}
        <button onClick={() => onReset(matchId, round.roundNumber)} style={styles.resetButton}>
          Reset
        </button>
      </div>

      <div style={styles.status}>
        Status: <span style={{
          color: round.timerStatus === 'running' ? '#4CAF50' :
                 round.timerStatus === 'paused' ? '#ff9800' : '#666',
          fontWeight: 'bold'
        }}>
          {round.timerStatus.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#1e1e1e',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '2px solid #333'
  },
  timerDisplay: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  timeLabel: {
    fontSize: '16px',
    color: '#aaa'
  },
  time: {
    fontSize: '64px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textShadow: '0 0 20px rgba(76, 175, 80, 0.5)'
  },
  elapsedLabel: {
    fontSize: '14px',
    color: '#888'
  },
  progressBar: {
    width: '100%',
    height: '12px',
    backgroundColor: '#333',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '20px'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.5s ease, background-color 0.3s ease'
  },
  controls: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '15px'
  },
  pauseButton: {
    backgroundColor: '#ff9800',
    color: 'white',
    padding: '12px 28px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '12px 28px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  resetButton: {
    backgroundColor: '#666',
    color: 'white',
    padding: '12px 28px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  status: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#aaa'
  }
};

export default TimerDisplay;
