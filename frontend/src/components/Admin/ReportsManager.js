import React, { useState, useEffect } from 'react';
import { getTournaments, getMatches, getMatchReports } from '../../services/api';

const ReportsManager = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [reports, setReports] = useState([]);
  const [groupedReports, setGroupedReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await getTournaments();
      if (response.success) {
        setTournaments(response.data);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      alert('Failed to load tournaments');
    }
  };

  const loadMatchReports = async (matchId) => {
    setLoading(true);
    try {
      const response = await getMatchReports(matchId);
      if (response.success) {
        setReports(response.data);
        groupReportsByRound(response.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const groupReportsByRound = (reportsData) => {
    const grouped = {};

    reportsData.forEach(report => {
      const roundNum = report.roundNumber;
      if (!grouped[roundNum]) {
        grouped[roundNum] = [];
      }
      grouped[roundNum].push(report);
    });

    setGroupedReports(grouped);
  };

  const handleTournamentSelect = async (tournamentId) => {
    setSelectedTournament(tournamentId);
    setSelectedMatch(null);
    setReports([]);
    setGroupedReports({});
    
    // Load matches for this tournament
    try {
      const response = await getMatches();
      if (response.success) {
        const filteredMatches = response.data.filter(m => m.tournament === tournamentId);
        setMatches(filteredMatches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const handleMatchSelect = (matchId) => {
    setSelectedMatch(matchId);
    loadMatchReports(matchId);
    setSelectedReport(null);
  };

  const viewReportDetails = (report) => {
    setSelectedReport(report);
  };

  const closeReportDetails = () => {
    setSelectedReport(null);
  };

  const downloadReport = (report) => {
    const reportData = {
      droneId: report.droneId,
      team: report.team?.name || 'Unknown',
      round: report.roundNumber,
      batteryUsed: report.batteryUsage?.consumed || 0,
      totalDistance: report.totalDistance || 0,
      avgSpeed: report.averageSpeed || 0,
      maxSpeed: report.maxSpeed || 0,
      performanceScore: report.performanceScore || 0,
      generatedAt: new Date(report.generatedAt).toLocaleString()
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.droneId}_Round${report.roundNumber}_Report.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllReports = () => {
    if (reports.length === 0) return;

    const allReportsData = reports.map(report => ({
      droneId: report.droneId,
      team: report.team?.name || 'Unknown',
      round: report.roundNumber,
      batteryUsed: report.batteryUsage?.consumed || 0,
      totalDistance: report.totalDistance || 0,
      avgSpeed: report.averageSpeed || 0,
      maxSpeed: report.maxSpeed || 0,
      performanceScore: report.performanceScore || 0,
      generatedAt: new Date(report.generatedAt).toLocaleString()
    }));

    const dataStr = JSON.stringify(allReportsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Match_Reports_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 Reports Management</h2>

      {/* Tournament Selection */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🏆 Select Tournament</h3>
        <div style={styles.tournamentGrid}>
          {tournaments.map(tournament => (
            <button
              key={tournament._id}
              onClick={() => handleTournamentSelect(tournament._id)}
              style={{
                ...styles.tournamentButton,
                backgroundColor: selectedTournament === tournament._id ? '#4CAF50' : '#333'
              }}
            >
              {tournament.name}
            </button>
          ))}
        </div>
      </div>

      {/* Match Selection */}
      {selectedTournament && matches.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>⚽ Select Match</h3>
          <div style={styles.matchGrid}>
            {matches.map(match => (
              <button
                key={match._id}
                onClick={() => handleMatchSelect(match._id)}
                style={{
                  ...styles.matchButton,
                  backgroundColor: selectedMatch === match._id ? '#2196F3' : '#444'
                }}
              >
                <div>{match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}</div>
                <div style={styles.matchDate}>
                  {new Date(match.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && <p style={styles.loading}>Loading reports...</p>}

      {/* No Match Selected */}
      {selectedTournament && matches.length > 0 && !selectedMatch && !loading && (
        <p style={styles.noData}>👆 Select a match to view reports</p>
      )}

      {/* No Reports */}
      {!loading && selectedMatch && reports.length === 0 && (
        <p style={styles.noData}>No reports found for this match.</p>
      )}

      {/* Reports Display */}
      {!loading && selectedMatch && reports.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              📋 Reports ({reports.length} drones)
            </h3>
            <button style={styles.downloadAllButton} onClick={downloadAllReports}>
              ⬇️ Download All Reports
            </button>
          </div>

          {/* Grouped by Round */}
          {Object.keys(groupedReports).sort((a, b) => Number(a) - Number(b)).map(roundNum => {
            const roundReports = groupedReports[roundNum];

            return (
              <div key={roundNum} style={styles.roundGroup}>
                <h4 style={styles.roundTitle}>Round {roundNum}</h4>

                <div style={styles.reportsGrid}>
                  {roundReports.map(report => (
                    <div
                      key={report._id}
                      style={styles.reportCard}
                    >
                      <div style={styles.reportHeader}>
                        <span style={styles.droneId}>{report.droneId}</span>
                        <span style={{
                          ...styles.teamBadge,
                          backgroundColor: report.team?.color || '#888'
                        }}>
                          {report.team?.name || 'Team'}
                        </span>
                      </div>

                      <div style={styles.reportStats}>
                        <div style={styles.stat}>
                          <span style={styles.statLabel}>Battery Used:</span>
                          <span style={styles.statValue}>{(report.batteryUsage?.consumed || 0).toFixed(1)}%</span>
                        </div>
                        <div style={styles.stat}>
                          <span style={styles.statLabel}>Distance:</span>
                          <span style={styles.statValue}>{(report.totalDistance || 0).toFixed(1)}m</span>
                        </div>
                        <div style={styles.stat}>
                          <span style={styles.statLabel}>Avg Speed:</span>
                          <span style={styles.statValue}>{(report.averageSpeed || 0).toFixed(2)} m/s</span>
                        </div>
                        <div style={styles.stat}>
                          <span style={styles.statLabel}>Performance:</span>
                          <span style={styles.statValue}>{(report.performanceScore || 0).toFixed(0)}</span>
                        </div>
                      </div>

                      <div style={styles.buttonGroup}>
                        <button 
                          style={styles.viewButton}
                          onClick={() => viewReportDetails(report)}
                        >
                          👁️ View Details
                        </button>
                        <button 
                          style={styles.downloadButton}
                          onClick={() => downloadReport(report)}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div style={styles.modal} onClick={closeReportDetails}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={closeReportDetails}>×</button>

            <h3 style={styles.modalTitle}>
              🚁 Drone Report: {selectedReport.droneId}
            </h3>

            <div style={styles.modalSection}>
              <h4 style={styles.modalSectionTitle}>Basic Info</h4>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Team:</span>
                  <span style={styles.infoValue}>{selectedReport.team?.name || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Round:</span>
                  <span style={styles.infoValue}>{selectedReport.roundNumber}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Status:</span>
                  <span style={styles.infoValue}>{selectedReport.status}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Generated At:</span>
                  <span style={styles.infoValue}>
                    {new Date(selectedReport.generatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h4 style={styles.modalSectionTitle}>Performance Metrics</h4>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Total Distance:</span>
                  <span style={styles.infoValue}>{(selectedReport.totalDistance || 0).toFixed(2)}m</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Avg Speed:</span>
                  <span style={styles.infoValue}>{(selectedReport.averageSpeed || 0).toFixed(2)} m/s</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Max Speed:</span>
                  <span style={styles.infoValue}>{(selectedReport.maxSpeed || 0).toFixed(2)} m/s</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Performance Score:</span>
                  <span style={styles.infoValue}>{(selectedReport.performanceScore || 0).toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h4 style={styles.modalSectionTitle}>Battery Usage</h4>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Start:</span>
                  <span style={styles.infoValue}>{(selectedReport.batteryUsage?.start || 100)}%</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>End:</span>
                  <span style={styles.infoValue}>{(selectedReport.batteryUsage?.end || 100)}%</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Consumed:</span>
                  <span style={styles.infoValue}>{(selectedReport.batteryUsage?.consumed || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {selectedReport.mlAnalysis && Object.keys(selectedReport.mlAnalysis).some(k => selectedReport.mlAnalysis[k] !== 0) && (
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>ML Analysis</h4>
                <div style={styles.mlAnalysis}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Aggressiveness:</span>
                    <span style={styles.infoValue}>{selectedReport.mlAnalysis.aggressiveness || 0}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Defensiveness:</span>
                    <span style={styles.infoValue}>{selectedReport.mlAnalysis.defensiveness || 0}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Teamwork:</span>
                    <span style={styles.infoValue}>{selectedReport.mlAnalysis.teamwork || 0}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Efficiency:</span>
                    <span style={styles.infoValue}>{selectedReport.mlAnalysis.efficiency || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    color: 'white',
    minHeight: '100vh'
  },
  title: {
    fontSize: '28px',
    marginBottom: '30px',
    borderBottom: '2px solid #4CAF50',
    paddingBottom: '15px'
  },
  section: {
    backgroundColor: '#1e1e1e',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '25px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '20px',
    margin: 0,
    color: '#4CAF50'
  },
  tournamentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px'
  },
  matchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '15px'
  },
  tournamentButton: {
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #555',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'all 0.3s ease'
  },
  matchButton: {
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #555',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    textAlign: 'left'
  },
  matchDate: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '5px'
  },
  downloadAllButton: {
    padding: '10px 20px',
    backgroundColor: '#FF9800',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px'
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#888',
    padding: '40px'
  },
  noData: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#888',
    padding: '40px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px'
  },
  roundGroup: {
    marginBottom: '30px',
    backgroundColor: '#2a2a2a',
    padding: '20px',
    borderRadius: '8px'
  },
  roundTitle: {
    fontSize: '18px',
    marginBottom: '20px',
    color: '#4CAF50',
    borderBottom: '1px solid #333',
    paddingBottom: '10px'
  },
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '15px'
  },
  reportCard: {
    backgroundColor: '#333',
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid transparent',
    transition: 'all 0.3s ease'
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  droneId: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  teamBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white'
  },
  reportStats: {
    marginBottom: '15px'
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  statLabel: {
    color: '#aaa',
    fontSize: '14px'
  },
  statValue: {
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  viewButton: {
    padding: '10px',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px'
  },
  downloadButton: {
    padding: '10px',
    backgroundColor: '#2196F3',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '700px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    position: 'relative',
    border: '2px solid #4CAF50'
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '36px',
    cursor: 'pointer',
    lineHeight: '1'
  },
  modalTitle: {
    fontSize: '24px',
    marginBottom: '25px',
    color: '#4CAF50',
    borderBottom: '2px solid #4CAF50',
    paddingBottom: '15px'
  },
  modalSection: {
    marginBottom: '25px'
  },
  modalSectionTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#fff'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  infoLabel: {
    color: '#aaa',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  infoValue: {
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  mlAnalysis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px'
  }
};

export default ReportsManager;