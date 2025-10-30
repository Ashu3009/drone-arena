// backend/services/mqttService.js
const mqtt = require('mqtt');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('✅ MQTT Broker connected');
  
  // Subscribe to all drone status updates
  client.subscribe('drone/+/status', (err) => {
    if (!err) {
      console.log('✅ Subscribed to drone status updates');
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`📩 MQTT: ${topic} → ${message.toString()}`);
});

client.on('error', (error) => {
  console.error('❌ MQTT Error:', error);
});

// Send configuration to specific drone
const configureDrone = (droneId, config) => {
  const topic = `drone/${droneId}/config`;
  const payload = JSON.stringify(config);
  
  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Failed to send config to ${droneId}:`, err);
    } else {
      console.log(`✅ Config sent to ${droneId}:`, config);
    }
  });
};

// Send command to all drones
const broadcastCommand = (command) => {
  const topic = 'drone/all/command';
  const payload = JSON.stringify(command);
  
  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Broadcast failed:', err);
    } else {
      console.log('📢 Broadcast sent:', command);
    }
  });
};

// Configure all drones in a match round
const configureMatchDrones = async (matchId, roundNumber, drones, teamAId, teamBId) => {
  console.log(`\n🎮 Configuring ${drones.length} drones for Round ${roundNumber}...`);
  
  for (const drone of drones) {
    const config = {
      command: 'START',
      matchId: matchId,
      teamId: drone.team.toString(),
      roundNumber: roundNumber,
      serverUrl: `http://${process.env.SERVER_IP || '192.168.0.136'}:${process.env.PORT || 5000}/api/telemetry`
    };
    
    configureDrone(drone.droneId, config);
    
    // Small delay between messages
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ All drones configured!\n`);
};

// Stop all drones
const stopAllDrones = () => {
  broadcastCommand({ command: 'STOP' });
  console.log('🛑 Stop command sent to all drones');
};

// Reset all drones
const resetAllDrones = () => {
  broadcastCommand({ command: 'RESET' });
  console.log('🔄 Reset command sent to all drones');
};

module.exports = {
  configureDrone,
  broadcastCommand,
  configureMatchDrones,
  stopAllDrones,
  resetAllDrones,
  mqttClient: client
};