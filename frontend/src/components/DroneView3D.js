// frontend/src/components/Public/DroneView3D.js
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './DroneView3D.css';

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
      <div className="drone-view-no-data">
        <p>⚠️ No match selected</p>
      </div>
    );
  }

  return (
    <div className="drone-view-container">
      <div className="drone-view-header">
        <h3 className="drone-view-title">🚁 Drone Soccer Arena - 20ft × 10ft</h3>
        <div className="drone-view-status-bar">
          <span className={connected ? 'status-live' : 'status-offline'}>
            {connected ? '🟢 LIVE' : '🔴 OFFLINE'}
          </span>
          <span className="status-drones">
            {Object.keys(dronePositions).length} drones active
          </span>
        </div>
      </div>

      {/* Drone Soccer 3D Arena */}
      <div className="arena-3d-wrapper">
        <div className="arena-3d-scene">
          {/* Arena Floor with Grid */}
          <div className="arena-floor">
            {/* Scoring Ring 1 - Left (Saffron) */}
            <div className="scoring-ring scoring-ring-left"></div>

            {/* Scoring Ring 2 - Right (Green) */}
            <div className="scoring-ring scoring-ring-right"></div>
          </div>

          {/* Arena Walls - Box */}
          <div className="arena-wall arena-wall-front"></div>
          <div className="arena-wall arena-wall-back"></div>
          <div className="arena-wall arena-wall-left"></div>
          <div className="arena-wall arena-wall-right"></div>

          {/* Floating Lights */}
          <div className="arena-light arena-light-1"></div>
          <div className="arena-light arena-light-2"></div>
          <div className="arena-light arena-light-3"></div>
          <div className="arena-light arena-light-4"></div>
        </div>

        {/* Ready Badge */}
        <div className="arena-ready-badge">🏆 Arena Ready 🏆</div>
      </div>

      {/* Info panel */}
      <div className="drone-view-info-panel">
        <div className="drone-view-info-card">
          <strong>📏 Arena:</strong> 20ft × 10ft (6.1m × 3.05m)
        </div>
        <div className="drone-view-info-card">
          <strong>🚁 Drone Size:</strong> 6" radius (0.15m)
        </div>
        <div className="drone-view-info-card">
          <strong>🎯 Scoring:</strong> 2 Rings (Pass drones through)
        </div>
        <div className="drone-view-info-card">
          <strong>⚡ Status:</strong> Ready for Match
        </div>
      </div>

      {/* Legend */}
      <div className="drone-view-legend">
        <div className="drone-view-legend-item">
          <div className="drone-view-legend-color" style={{ backgroundColor: '#f44336' }}></div>
          <span>Red Team (R1-R8)</span>
        </div>
        <div className="drone-view-legend-item">
          <div className="drone-view-legend-color" style={{ backgroundColor: '#2196F3' }}></div>
          <span>Blue Team (B1-B8)</span>
        </div>
        <div className="drone-view-legend-item">
          <div className="drone-view-legend-color" style={{ backgroundColor: '#FF9933' }}></div>
          <span>Ring 1 (Saffron)</span>
        </div>
        <div className="drone-view-legend-item">
          <div className="drone-view-legend-color" style={{ backgroundColor: '#138808' }}></div>
          <span>Ring 2 (Green)</span>
        </div>
      </div>
    </div>
  );
};

export default DroneView3D;
