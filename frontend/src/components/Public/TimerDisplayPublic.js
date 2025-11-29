import React, { useState, useEffect } from 'react';

const TimerDisplayPublic = ({ round, roundDuration }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const MAX_TIME = (roundDuration || 3) * 60; // Convert minutes to seconds

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

  const remaining = Math.max(0, MAX_TIME - elapsedTime);
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
    background: 'linear-gradient(135deg, rgba(255,153,51,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(19,136,8,0.1) 100%)',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '0',
    border: '2px solid',
    borderImage: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%) 1',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
  },
  timerDisplay: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '15px'
  },
  timeLabel: {
    fontSize: '14px',
    color: '#ccc',
    fontWeight: '600',
    letterSpacing: '1px'
  },
  time: {
    fontSize: '48px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#FF9933',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(255,153,51,0.6)'
  },
  elapsedLabel: {
    fontSize: '12px',
    color: '#999'
  },
  progressBar: {
    width: '100%',
    height: '10px',
    background: 'linear-gradient(90deg, rgba(255,153,51,0.2) 0%, rgba(19,136,8,0.2) 100%)',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '12px',
    border: '1px solid rgba(255,153,51,0.3)'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.5s ease, background-color 0.3s ease',
    background: 'linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
    boxShadow: '0 0 10px rgba(255,153,51,0.5)'
  },
  status: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#bbb',
    fontWeight: '600'
  }
};

export default TimerDisplayPublic;