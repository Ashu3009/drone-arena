import React, { useState, useEffect } from 'react';

const TimerDisplayPublic = ({ round }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const MAX_TIME = 180; // 3 minutes

  useEffect(() => {
    if (round.timerStatus === 'running') {
      const interval = setInterval(() => {
        const now = Date.now();
        const start = new Date(round.startTime).getTime();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);
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

      {/* Status Only - No Controls */}
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
  status: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#aaa'
  }
};

export default TimerDisplayPublic;