import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Text } from '@react-three/drei';

const Drone = ({ position, droneId, color }) => {
  return (
    <group position={position}>
      <Sphere args={[0.3, 16, 16]}>
        <meshStandardMaterial color={color} />
      </Sphere>
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {droneId}
      </Text>
    </group>
  );
};

const Arena = () => {
  return (
    <>
      {/* Arena Floor */}
      <Box args={[10, 0.1, 10]} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#333333" />
      </Box>

      {/* Arena Walls (transparent) */}
      <Box args={[10, 5, 0.1]} position={[0, 2.5, 5]}>
        <meshStandardMaterial color="#666666" transparent opacity={0.2} />
      </Box>
      <Box args={[10, 5, 0.1]} position={[0, 2.5, -5]}>
        <meshStandardMaterial color="#666666" transparent opacity={0.2} />
      </Box>
      <Box args={[0.1, 5, 10]} position={[5, 2.5, 0]}>
        <meshStandardMaterial color="#666666" transparent opacity={0.2} />
      </Box>
      <Box args={[0.1, 5, 10]} position={[-5, 2.5, 0]}>
        <meshStandardMaterial color="#666666" transparent opacity={0.2} />
      </Box>

      {/* Grid Lines */}
      <gridHelper args={[10, 10, '#444444', '#222222']} />
    </>
  );
};

const Arena3D = ({ telemetryData = [] }) => {
  const getDroneColor = (droneId) => {
    if (droneId.startsWith('R')) return '#ff4444'; // Red team
    if (droneId.startsWith('B')) return '#4444ff'; // Blue team
    return '#44ff44'; // Default green
  };

  const convertToArenaPosition = (telemetry) => {
    // Convert telemetry x, y, z to arena coordinates
    // Assuming telemetry x, y, z are in cm or meters
    // Arena is 10x10 units, centered at origin
    const scale = 0.01; // Adjust based on your telemetry units
    return [
      (telemetry.x || 0) * scale,
      (telemetry.z || 0) * scale, // y in Three.js is height
      (telemetry.y || 0) * scale
    ];
  };

  return (
    <div style={styles.container}>
      <Canvas
        camera={{ position: [12, 8, 12], fov: 60 }}
        style={styles.canvas}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        {/* Arena */}
        <Arena />

        {/* Drones */}
        {telemetryData.map((telemetry) => (
          <Drone
            key={telemetry.droneId}
            position={convertToArenaPosition(telemetry)}
            droneId={telemetry.droneId}
            color={getDroneColor(telemetry.droneId)}
          />
        ))}

        {/* Orbit Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>

      {/* Drone Legend */}
      <div style={styles.legend}>
        <h4 style={styles.legendTitle}>Drones</h4>
        <div style={styles.legendItems}>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#ff4444'}} />
            <span>Red Team (R1-R4)</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#4444ff'}} />
            <span>Blue Team (B1-B4)</span>
          </div>
        </div>
        <div style={styles.droneCount}>
          Active Drones: {telemetryData.length} / 8
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    height: '600px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  canvas: {
    width: '100%',
    height: '100%'
  },
  legend: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: '16px',
    borderRadius: '8px',
    minWidth: '200px'
  },
  legendTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white'
  },
  legendItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#ccc'
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '50%'
  },
  droneCount: {
    fontSize: '12px',
    color: '#888',
    paddingTop: '12px',
    borderTop: '1px solid #333'
  }
};

export default Arena3D;
