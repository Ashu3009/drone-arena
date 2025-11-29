import React, { useState, useEffect } from 'react';
import { getSiteStatsDetails, overrideSiteStats, resetSiteStats } from '../../services/api';

const StatsManager = () => {
  const [statsDetails, setStatsDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualValues, setManualValues] = useState({
    totalMatches: 0,
    activeTeams: 0,
    activeDrones: 16,
    totalTournaments: 0
  });

  useEffect(() => {
    loadStatsDetails();
  }, []);

  const loadStatsDetails = async () => {
    setLoading(true);
    try {
      const response = await getSiteStatsDetails();
      if (response.success && response.data) {
        setStatsDetails(response.data);
        // Set manual values from current data
        setManualValues({
          totalMatches: response.data.displayStats.totalMatches,
          activeTeams: response.data.displayStats.activeTeams,
          activeDrones: response.data.displayStats.activeDrones,
          totalTournaments: response.data.displayStats.totalTournaments
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      alert('Failed to load stats details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setManualValues(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  const handleOverride = async () => {
    if (!window.confirm('Force override stats with manual values?\n\nThis will replace auto-calculated values.')) {
      return;
    }

    try {
      const response = await overrideSiteStats(manualValues);
      if (response.success) {
        alert('Stats manually overridden successfully!');
        loadStatsDetails();
      }
    } catch (error) {
      console.error('Failed to override stats:', error);
      alert('Failed to override stats');
    }
  };

  const handleResetField = async (field) => {
    if (!window.confirm(`Reset ${field} to auto-calculated value?`)) {
      return;
    }

    try {
      const response = await resetSiteStats([field]);
      if (response.success) {
        alert(`${field} reset to auto-calculated!`);
        loadStatsDetails();
      }
    } catch (error) {
      console.error('Failed to reset field:', error);
      alert('Failed to reset field');
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Reset ALL stats to auto-calculated values?')) {
      return;
    }

    try {
      const response = await resetSiteStats();
      if (response.success) {
        alert('All stats reset to auto-calculated!');
        loadStatsDetails();
      }
    } catch (error) {
      console.error('Failed to reset all stats:', error);
      alert('Failed to reset all stats');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Site Statistics Manager</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (!statsDetails) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Site Statistics Manager</h2>
        <p>Failed to load stats</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Site Statistics Manager</h2>
        <p style={styles.subtitle}>Hybrid system: Auto-calculated + Manual Override</p>
      </div>

      {/* Stats Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Stat Name</th>
              <th style={styles.th}>Auto-Calculated</th>
              <th style={styles.th}>Manual Override</th>
              <th style={styles.th}>Current Display</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Total Matches */}
            <tr style={styles.tr}>
              <td style={styles.td}>🎯 Total Matches</td>
              <td style={styles.td}>{statsDetails.autoCalculated.totalMatches}</td>
              <td style={styles.td}>
                <input
                  type="number"
                  value={manualValues.totalMatches}
                  onChange={(e) => handleInputChange('totalMatches', e.target.value)}
                  style={styles.input}
                  min="0"
                />
              </td>
              <td style={styles.td}>
                <strong>{statsDetails.displayStats.totalMatches}</strong>
              </td>
              <td style={styles.td}>
                {statsDetails.manualOverride.totalMatches ? (
                  <span style={styles.badgeManual}>Manual</span>
                ) : (
                  <span style={styles.badgeAuto}>Auto</span>
                )}
              </td>
              <td style={styles.td}>
                {statsDetails.manualOverride.totalMatches && (
                  <button
                    onClick={() => handleResetField('totalMatches')}
                    style={styles.resetButton}
                  >
                    Reset to Auto
                  </button>
                )}
              </td>
            </tr>

            {/* Active Teams */}
            <tr style={styles.tr}>
              <td style={styles.td}>👥 Active Teams</td>
              <td style={styles.td}>{statsDetails.autoCalculated.activeTeams}</td>
              <td style={styles.td}>
                <input
                  type="number"
                  value={manualValues.activeTeams}
                  onChange={(e) => handleInputChange('activeTeams', e.target.value)}
                  style={styles.input}
                  min="0"
                />
              </td>
              <td style={styles.td}>
                <strong>{statsDetails.displayStats.activeTeams}</strong>
              </td>
              <td style={styles.td}>
                {statsDetails.manualOverride.activeTeams ? (
                  <span style={styles.badgeManual}>Manual</span>
                ) : (
                  <span style={styles.badgeAuto}>Auto</span>
                )}
              </td>
              <td style={styles.td}>
                {statsDetails.manualOverride.activeTeams && (
                  <button
                    onClick={() => handleResetField('activeTeams')}
                    style={styles.resetButton}
                  >
                    Reset to Auto
                  </button>
                )}
              </td>
            </tr>

            {/* Active Drones */}
            <tr style={styles.tr}>
              <td style={styles.td}>🚁 Active Drones</td>
              <td style={styles.td}>{statsDetails.autoCalculated.activeDrones}</td>
              <td style={styles.td}>
                <input
                  type="number"
                  value={manualValues.activeDrones}
                  onChange={(e) => handleInputChange('activeDrones', e.target.value)}
                  style={styles.input}
                  min="0"
                />
              </td>
              <td style={styles.td}>
                <strong>{statsDetails.displayStats.activeDrones}</strong>
              </td>
              <td style={styles.td}>
                {statsDetails.manualOverride.activeDrones ? (
                  <span style={styles.badgeManual}>Manual</span>
                ) : (
                  <span style={styles.badgeAuto}>Auto</span>
                )}
              </td>
              <td style={styles.td}>
                {statsDetails.manualOverride.activeDrones && (
                  <button
                    onClick={() => handleResetField('activeDrones')}
                    style={styles.resetButton}
                  >
                    Reset to Auto
                  </button>
                )}
              </td>
            </tr>

            {/* Total Tournaments */}
            <tr style={styles.tr}>
              <td style={styles.td}>🏆 Total Tournaments</td>
              <td style={styles.td}>{statsDetails.autoCalculated.totalTournaments}</td>
              <td style={styles.td}>
                <input
                  type="number"
                  value={manualValues.totalTournaments}
                  onChange={(e) => handleInputChange('totalTournaments', e.target.value)}
                  style={styles.input}
                  min="0"
                />
              </td>
              <td style={styles.td}>
                <strong>{statsDetails.displayStats.totalTournaments}</strong>
              </td>
              <td style={styles.td}>
                {statsDetails.manualOverride.totalTournaments ? (
                  <span style={styles.badgeManual}>Manual</span>
                ) : (
                  <span style={styles.badgeAuto}>Auto</span>
                )}
              </td>
              <td style={styles.td}>
                {statsDetails.manualOverride.totalTournaments && (
                  <button
                    onClick={() => handleResetField('totalTournaments')}
                    style={styles.resetButton}
                  >
                    Reset to Auto
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button onClick={handleOverride} style={styles.overrideButton}>
          Force Override All Stats
        </button>
        <button onClick={handleResetAll} style={styles.resetAllButton}>
          Reset All to Auto
        </button>
        <button onClick={loadStatsDetails} style={styles.refreshButton}>
          Refresh Data
        </button>
      </div>

      {/* Info Section */}
      <div style={styles.infoBox}>
        <h4 style={styles.infoTitle}>How It Works:</h4>
        <ul style={styles.infoList}>
          <li><strong>Auto-Calculated:</strong> Real-time values from database (matches, teams, tournaments count)</li>
          <li><strong>Manual Override:</strong> Edit input fields and click "Force Override" to set custom values</li>
          <li><strong>Current Display:</strong> What users see on mobile/public view (manual or auto)</li>
          <li><strong>Status:</strong> Shows if stat is using Auto or Manual value</li>
          <li><strong>Reset:</strong> Switch back to auto-calculated for specific field or all fields</li>
        </ul>
        <p style={styles.infoNote}>
          <strong>Last Updated:</strong> {new Date(statsDetails.displayStats.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    color: '#e2e8f0'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '14px'
  },
  tableContainer: {
    overflowX: 'auto',
    marginBottom: '30px',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '10px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #334155',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: '600'
  },
  tr: {
    borderBottom: '1px solid #334155'
  },
  td: {
    padding: '12px',
    color: '#e2e8f0',
    fontSize: '14px'
  },
  input: {
    padding: '6px 10px',
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '14px',
    width: '100px'
  },
  badgeAuto: {
    padding: '4px 12px',
    backgroundColor: '#10b981',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  badgeManual: {
    padding: '4px 12px',
    backgroundColor: '#f59e0b',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  resetButton: {
    padding: '6px 12px',
    backgroundColor: '#64748b',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },
  actions: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },
  overrideButton: {
    padding: '12px 24px',
    backgroundColor: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  resetAllButton: {
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  refreshButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  infoBox: {
    backgroundColor: '#1e293b',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #334155'
  },
  infoTitle: {
    color: '#fff',
    marginBottom: '12px',
    fontSize: '16px'
  },
  infoList: {
    color: '#cbd5e1',
    fontSize: '13px',
    lineHeight: '1.8',
    marginBottom: '15px'
  },
  infoNote: {
    color: '#94a3b8',
    fontSize: '12px',
    fontStyle: 'italic'
  }
};

export default StatsManager;
