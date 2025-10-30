import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TelemetryGraph = ({ telemetryData, droneId }) => {
  if (!telemetryData || telemetryData.length === 0) {
    return (
      <div style={styles.noData}>
        <p>📊 No telemetry data available</p>
      </div>
    );
  }

  // Prepare data for graph
  const graphData = telemetryData.map((log, index) => ({
    index: index,
    x: log.x,
    y: log.y,
    z: log.z,
    battery: log.battery,
    timestamp: new Date(log.timestamp).toLocaleTimeString()
  }));

  return (
    <div style={styles.container}>
      <h3>📊 Telemetry Graph - {droneId}</h3>
      
      {/* Position Graph */}
      <div style={styles.graphContainer}>
        <h4>Position (X, Y, Z)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="index" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="x" stroke="#8884d8" strokeWidth={2} dot={false} name="X Position" />
            <Line type="monotone" dataKey="y" stroke="#82ca9d" strokeWidth={2} dot={false} name="Y Position" />
            <Line type="monotone" dataKey="z" stroke="#ffc658" strokeWidth={2} dot={false} name="Z Position" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Battery Graph */}
      <div style={styles.graphContainer}>
        <h4>Battery Level</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="index" stroke="#888" />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="battery" stroke="#ff6b6b" strokeWidth={2} dot={false} name="Battery %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span>📦 Total Logs:</span>
          <strong>{telemetryData.length}</strong>
        </div>
        <div style={styles.statCard}>
          <span>🔋 Current Battery:</span>
          <strong>{telemetryData[telemetryData.length - 1]?.battery}%</strong>
        </div>
        <div style={styles.statCard}>
          <span>📍 Last Position:</span>
          <strong>
            ({telemetryData[telemetryData.length - 1]?.x.toFixed(1)}, 
             {telemetryData[telemetryData.length - 1]?.y.toFixed(1)}, 
             {telemetryData[telemetryData.length - 1]?.z.toFixed(1)})
          </strong>
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
  graphContainer: {
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px'
  },
  stats: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px',
    flexWrap: 'wrap'
  },
  statCard: {
    flex: 1,
    minWidth: '200px',
    padding: '15px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }
};

export default TelemetryGraph;