import React from 'react';

const DroneView3D = ({ telemetryData }) => {
  if (!telemetryData || telemetryData.length === 0) {
    return (
      <div style={styles.noData}>
        <p>⚽ No drone data available</p>
      </div>
    );
  }

  // Get latest position for each drone
  const dronePositions = {};
  
  telemetryData.forEach(data => {
    if (data.logs && data.logs.length > 0) {
      const latestLog = data.logs[data.logs.length - 1];
      dronePositions[data.droneId] = {
        x: latestLog.x,
        y: latestLog.y,
        z: latestLog.z,
        battery: latestLog.battery,
        droneId: data.droneId
      };
    }
  });

  // Arena size (in meters)
  const ARENA_WIDTH = 6.1;   // 20 feet = 6.1 meters
  const ARENA_HEIGHT = 3.05;  // 10 feet = 3.05 meters
  const DRONE_RADIUS = 0.15;  // 6 inches = 0.15 meters
  
  // Display size (in pixels)
  const DISPLAY_WIDTH = 800;
  const DISPLAY_HEIGHT = 400;
  
  // Scale: pixels per meter
  const SCALE_X = DISPLAY_WIDTH / ARENA_WIDTH;   // ~131 px/m
  const SCALE_Y = DISPLAY_HEIGHT / ARENA_HEIGHT; // ~131 px/m
  const DRONE_SIZE = DRONE_RADIUS * SCALE_X * 2; // Drone diameter in pixels

  return (
    <div style={styles.container}>
      <h3>⚽ Drone Football Arena (20ft × 10ft)</h3>
      
      <div style={{...styles.arena, width: `${DISPLAY_WIDTH}px`, height: `${DISPLAY_HEIGHT}px`}}>
        {/* Field markings */}
        <svg style={styles.field}>
          {/* Outer boundary */}
          <rect x="0" y="0" width={DISPLAY_WIDTH} height={DISPLAY_HEIGHT} fill="none" stroke="#4CAF50" strokeWidth="3" />
          
          {/* Center line */}
          <line 
            x1={DISPLAY_WIDTH / 2} 
            y1={0} 
            x2={DISPLAY_WIDTH / 2} 
            y2={DISPLAY_HEIGHT} 
            stroke="#4CAF50" 
            strokeWidth="2" 
          />
          
          {/* Center circle */}
          <circle 
            cx={DISPLAY_WIDTH / 2} 
            cy={DISPLAY_HEIGHT / 2} 
            r={DISPLAY_HEIGHT / 5} 
            fill="none" 
            stroke="#4CAF50" 
            strokeWidth="2" 
          />
          
          {/* Goal areas */}
          {/* Left goal */}
          <rect 
            x="0" 
            y={DISPLAY_HEIGHT / 2 - DISPLAY_HEIGHT / 4} 
            width={DISPLAY_WIDTH / 8} 
            height={DISPLAY_HEIGHT / 2} 
            fill="none" 
            stroke="#2196F3" 
            strokeWidth="2" 
          />
          
          {/* Right goal */}
          <rect 
            x={DISPLAY_WIDTH - DISPLAY_WIDTH / 8} 
            y={DISPLAY_HEIGHT / 2 - DISPLAY_HEIGHT / 4} 
            width={DISPLAY_WIDTH / 8} 
            height={DISPLAY_HEIGHT / 2} 
            fill="none" 
            stroke="#f44336" 
            strokeWidth="2" 
          />
          
          {/* Grid lines */}
          {[...Array(7)].map((_, i) => (
            <line
              key={`v${i}`}
              x1={(i * DISPLAY_WIDTH) / 6}
              y1={0}
              x2={(i * DISPLAY_WIDTH) / 6}
              y2={DISPLAY_HEIGHT}
              stroke="#333"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          {[...Array(4)].map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(i * DISPLAY_HEIGHT) / 3}
              x2={DISPLAY_WIDTH}
              y2={(i * DISPLAY_HEIGHT) / 3}
              stroke="#333"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
        </svg>

        {/* Drones */}
        {Object.values(dronePositions).map(drone => {
          const x = drone.x * SCALE_X;
          const y = (ARENA_HEIGHT - drone.y) * SCALE_Y; // Flip Y axis
          const color = drone.droneId.startsWith('R') ? '#f44336' : '#2196F3';
          const teamName = drone.droneId.startsWith('R') ? 'Red' : 'Blue';
          
          return (
            <div
              key={drone.droneId}
              style={{
                ...styles.drone,
                left: `${x}px`,
                top: `${y}px`,
                width: `${DRONE_SIZE}px`,
                height: `${DRONE_SIZE}px`,
                backgroundColor: color,
                boxShadow: `0 0 15px ${color}`
              }}
              title={`${drone.droneId} (${teamName})\nPos: (${drone.x.toFixed(2)}m, ${drone.y.toFixed(2)}m, ${drone.z.toFixed(2)}m)\nBattery: ${drone.battery}%`}
            >
              <span style={styles.droneLabel}>{drone.droneId}</span>
              <div style={styles.batteryBar}>
                <div 
                  style={{
                    ...styles.batteryFill, 
                    width: `${drone.battery}%`, 
                    backgroundColor: drone.battery > 20 ? '#4CAF50' : '#FFC107'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Info panel */}
      <div style={styles.infoPanel}>
        <div style={styles.infoCard}>
          <strong>📏 Arena:</strong> 20ft × 10ft (6.1m × 3.05m)
        </div>
        <div style={styles.infoCard}>
          <strong>🚁 Drone Size:</strong> 6" radius (0.15m)
        </div>
        <div style={styles.infoCard}>
          <strong>🔴 Red Goal:</strong> Right side
        </div>
        <div style={styles.infoCard}>
          <strong>🔵 Blue Goal:</strong> Left side
        </div>
        <div style={styles.infoCard}>
          <strong>📍 Active Drones:</strong> {Object.keys(dronePositions).length}
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#f44336'}}></div>
          <span>Red Team (R1-R4)</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#2196F3'}}></div>
          <span>Blue Team (B1-B4)</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '10px',
    color: 'white',
    margin: '20px 0'
  },
  noData: {
    padding: '40px',
    textAlign: 'center',
    color: '#888'
  },
  arena: {
    position: 'relative',
    backgroundColor: '#0a0a0a',
    border: '3px solid #4CAF50',
    margin: '20px auto',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  field: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0
  },
  drone: {
    position: 'absolute',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid white',
    zIndex: 10
  },
  droneLabel: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '0 0 3px black'
  },
  batteryBar: {
    position: 'absolute',
    bottom: '-6px',
    width: '25px',
    height: '3px',
    backgroundColor: '#333',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  batteryFill: {
    height: '100%',
    transition: 'width 0.3s'
  },
  infoPanel: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  infoCard: {
    padding: '8px 12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '5px',
    fontSize: '13px'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginTop: '15px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  legendColor: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid white'
  }
};

export default DroneView3D;