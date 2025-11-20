// frontend/src/components/Public/DroneView3D.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const DroneView3D = ({ matchId }) => {
  const [dronePositions, setDronePositions] = useState({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // ✅ Socket.IO Connection
  useEffect(() => {
    if (!matchId) {
      console.warn('⚠️ No matchId provided to DroneView3D');
      return;
    }

    console.log('🔌 Initializing Socket.IO for match:', matchId);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
      
      // Join match room
      socket.emit('join_match', matchId);
      console.log(`📍 Joined match room: match_${matchId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnected(false);
    });

    // ✅ Listen for real-time telemetry updates
    socket.on('telemetry_update', (data) => {
      console.log('📡 Telemetry received:', data);
      
      setDronePositions(prev => ({
        ...prev,
        [data.droneId]: {
          x: data.position.x,
          y: data.position.y,
          z: data.position.z,
          battery: data.battery,
          droneId: data.droneId,
          timestamp: data.timestamp
        }
      }));
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      socket.disconnect();
    };
  }, [matchId]);

  // ✅ Fetch initial telemetry data on mount
  useEffect(() => {
    if (!matchId) return;

    const fetchInitialData = async () => {
      try {
        console.log('📥 Fetching initial telemetry for match:', matchId);
        
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${BACKEND_URL}/api/telemetry/match/${matchId}/latest`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('📊 Initial data loaded:', result.data.length, 'drones');
          
          // Convert to dronePositions format
          const positions = {};
          result.data.forEach(drone => {
            if (drone.logs && drone.logs.length > 0) {
              const latest = drone.logs[drone.logs.length - 1];
              positions[drone.droneId] = {
                x: latest.x,
                y: latest.y,
                z: latest.z,
                battery: latest.battery,
                droneId: drone.droneId,
                timestamp: latest.timestamp
              };
            }
          });
          
          setDronePositions(positions);
        }
      } catch (error) {
        console.error('❌ Failed to fetch initial telemetry:', error);
      }
    };

    fetchInitialData();
  }, [matchId]);

  // No matchId provided
  if (!matchId) {
    return (
      <div style={styles.noData}>
        <p>⚠️ No match selected</p>
      </div>
    );
  }

  // No data state
  if (Object.keys(dronePositions).length === 0) {
    return (
      <div style={styles.noData}>
        <p>⚽ No drone data available</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          {connected ? '🟢 Connected - Waiting for telemetry...' : '🔴 Connecting...'}
        </p>
        <p style={{ fontSize: '10px', color: '#444', marginTop: '5px' }}>
          Match ID: {matchId}
        </p>
      </div>
    );
  }

  // Arena configuration
  const ARENA_WIDTH = 6.1;   // 20 feet = 6.1 meters
  const ARENA_HEIGHT = 3.05;  // 10 feet = 3.05 meters
  const DRONE_RADIUS = 0.15;  // 6 inches = 0.15 meters
  
  const DISPLAY_WIDTH = 800;
  const DISPLAY_HEIGHT = 400;
  
  const SCALE_X = DISPLAY_WIDTH / ARENA_WIDTH;
  const SCALE_Y = DISPLAY_HEIGHT / ARENA_HEIGHT;
  const DRONE_SIZE = DRONE_RADIUS * SCALE_X * 2;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Drone Soccer Arena (20ft × 10ft)</h3>
        <div style={styles.statusBar}>
          <span style={{
            color: connected ? '#4CAF50' : '#f44336',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {connected ? '🟢 LIVE' : '🔴 OFFLINE'}
          </span>
          <span style={{ fontSize: '12px', color: '#888', marginLeft: '15px' }}>
            {Object.keys(dronePositions).length} drones active
          </span>
        </div>
      </div>
      
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
          
          {/* Left goal (Blue) */}
          <rect 
            x="0" 
            y={DISPLAY_HEIGHT / 2 - DISPLAY_HEIGHT / 4} 
            width={DISPLAY_WIDTH / 8} 
            height={DISPLAY_HEIGHT / 2} 
            fill="none" 
            stroke="#2196F3" 
            strokeWidth="2" 
          />
          
          {/* Right goal (Red) */}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  title: {
    margin: 0,
    fontSize: '18px'
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center'
  },
  noData: {
    padding: '40px',
    textAlign: 'center',
    color: '#888',
    backgroundColor: '#1e1e1e',
    borderRadius: '10px'
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
    transition: 'all 0.3s ease',
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