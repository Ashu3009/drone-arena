import React, { useState, useEffect } from 'react';
import { getTournaments, getTournamentReports, getMatchReports } from '../../services/api';

const ReportsManager = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
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

  const loadTournamentReports = async (tournamentId) => {
    setLoading(true);
    try {
      const response = await getTournamentReports(tournamentId);
      if (response.success) {
        setReports(response.data);
        groupReportsByMatch(response.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const groupReportsByMatch = (reportsData) => {
    const grouped = {};

    reportsData.forEach(report => {
      const matchId = report.match._id;
      if (!grouped[matchId]) {
        grouped[matchId] = {
          matchInfo: report.match,
          rounds: {}
        };
      }

      const roundNum = report.roundNumber;
      if (!grouped[matchId].rounds[roundNum]) {
        grouped[matchId].rounds[roundNum] = [];
      }

      grouped[matchId].rounds[roundNum].push(report);
    });

    setGroupedReports(grouped);
  };

  const handleTournamentSelect = (tournamentId) => {
    setSelectedTournament(tournamentId);
    loadTournamentReports(tournamentId);
    setSelectedReport(null);
  };

  const viewReportDetails = (report) => {
    setSelectedReport(report);
  };

  const closeReportDetails = () => {
    setSelectedReport(null);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Reports Management</h2>

      {/* Tournament Selection */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Select Tournament</h3>
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

      {/* Reports Display */}
      {loading && <p style={styles.loading}>Loading reports...</p>}

      {!loading && selectedTournament && reports.length === 0 && (
        <p style={styles.noData}>No reports found for this tournament.</p>
      )}

      {!loading && selectedTournament && reports.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            Reports ({reports.length} drones)
          </h3>

          {/* Grouped by Match */}
          {Object.keys(groupedReports).map(matchId => {
            const matchData = groupedReports[matchId];

            return (
              <div key={matchId} style={styles.matchGroup}>
                <h4 style={styles.matchTitle}>
                  Match: {matchData.matchInfo.teamA?.name || 'Team A'} vs {matchData.matchInfo.teamB?.name || 'Team B'}
                </h4>

                {/* Grouped by Round */}
                {Object.keys(matchData.rounds).sort().map(roundNum => {
                  const roundReports = matchData.rounds[roundNum];

                  return (
                    <div key={roundNum} style={styles.roundGroup}>
                      <h5 style={styles.roundTitle}>Round {roundNum}</h5>

                      <div style={styles.reportsGrid}>
                        {roundReports.map(report => (
                          <div
                            key={report._id}
                            style={styles.reportCard}
                            onClick={() => viewReportDetails(report)}
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
                                <span style={styles.statLabel}>Score:</span>
                                <span style={styles.statValue}>{report.score || 0}</span>
                              </div>
                              <div style={styles.stat}>
                                <span style={styles.statLabel}>Targets:</span>
                                <span style={styles.statValue}>{report.targetsHit || 0}</span>
                              </div>
                              <div style={styles.stat}>
                                <span style={styles.statLabel}>Distance:</span>
                                <span style={styles.statValue}>{(report.totalDistance || 0).toFixed(1)}m</span>
                              </div>
                            </div>

                            <button style={styles.viewButton}>View Details</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
              Drone Report: {selectedReport.droneId}
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
                  <span style={styles.infoLabel}>Score:</span>
                  <span style={styles.infoValue}>{selectedReport.score || 0}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Targets Hit:</span>
                  <span style={styles.infoValue}>{selectedReport.targetsHit || 0}</span>
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
                  <span style={styles.infoLabel}>Avg Velocity:</span>
                  <span style={styles.infoValue}>{(selectedReport.avgVelocity || 0).toFixed(2)} m/s</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Max Velocity:</span>
                  <span style={styles.infoValue}>{(selectedReport.maxVelocity || 0).toFixed(2)} m/s</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Time in Arena:</span>
                  <span style={styles.infoValue}>{(selectedReport.timeInArena || 0).toFixed(1)}s</span>
                </div>
              </div>
            </div>

            {selectedReport.mlAnalysis && (
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>ML Analysis</h4>
                <div style={styles.mlAnalysis}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Strategy:</span>
                    <span style={styles.infoValue}>{selectedReport.mlAnalysis.strategy || 'N/A'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Efficiency:</span>
                    <span style={styles.infoValue}>{selectedReport.mlAnalysis.efficiency || 'N/A'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Pattern:</span>
                    <span style={styles.infoValue}>{selectedReport.mlAnalysis.pattern || 'N/A'}</span>
                  </div>
                  {selectedReport.mlAnalysis.insights && (
                    <div style={styles.insights}>
                      <span style={styles.infoLabel}>Insights:</span>
                      <p style={styles.insightsText}>{selectedReport.mlAnalysis.insights}</p>
                    </div>
                  )}
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
    color: 'white'
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
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#4CAF50'
  },
  tournamentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#888'
  },
  noData: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#888',
    padding: '40px'
  },
  matchGroup: {
    marginBottom: '30px',
    backgroundColor: '#2a2a2a',
    padding: '20px',
    borderRadius: '8px'
  },
  matchTitle: {
    fontSize: '18px',
    marginBottom: '20px',
    color: '#4CAF50',
    borderBottom: '1px solid #333',
    paddingBottom: '10px'
  },
  roundGroup: {
    marginBottom: '25px'
  },
  roundTitle: {
    fontSize: '16px',
    marginBottom: '15px',
    color: '#aaa'
  },
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '15px'
  },
  reportCard: {
    backgroundColor: '#333',
    padding: '15px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid transparent'
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
  viewButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4CAF50',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  insights: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    gridColumn: '1 / -1'
  },
  insightsText: {
    color: '#ddd',
    fontSize: '14px',
    lineHeight: '1.6',
    backgroundColor: '#2a2a2a',
    padding: '15px',
    borderRadius: '6px',
    margin: 0
  }
};

export default ReportsManager;
