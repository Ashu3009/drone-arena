import React, { useState, useEffect } from 'react';
import {
  getReportTournaments,
  getTournamentPilotAggregates,
  getMatches,
  getMatchReports,
  downloadReportPDF
} from '../../services/api';

const ReportsManager = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'teams'

  // Matches Tab State
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchReports, setMatchReports] = useState(null);

  // Teams Tab State
  const [pilotAggregates, setPilotAggregates] = useState([]);

  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ city: '', dateFrom: '', dateTo: '' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const response = await getReportTournaments(filters);
      if (response.success) {
        setTournaments(response.data);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      alert('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadTournaments();
  };

  const clearFilters = () => {
    setFilters({ city: '', dateFrom: '', dateTo: '' });
    setTimeout(() => loadTournaments(), 100);
  };

  const handleTournamentSelect = async (tournament) => {
    setSelectedTournament(tournament);
    setActiveTab('matches');
    setSelectedMatch(null);
    setMatchReports(null);
    setPilotAggregates([]);
    setMatches([]);

    // Load matches for this tournament
    setLoading(true);
    try {
      const response = await getMatches({ tournamentId: tournament._id });
      if (response.success) {
        const completedMatches = response.data.filter(m => m.status === 'completed');
        setMatches(completedMatches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      alert('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchSelect = async (match) => {
    setSelectedMatch(match);
    setLoading(true);
    try {
      const response = await getMatchReports(match._id);
      if (response.success) {
        setMatchReports(response.data);
      }
    } catch (error) {
      console.error('Error loading match reports:', error);
      alert('Failed to load match reports');
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = async (tab) => {
    setActiveTab(tab);
    setSelectedMatch(null);
    setMatchReports(null);

    if (tab === 'teams' && pilotAggregates.length === 0) {
      // Load pilot aggregates for first time
      setLoading(true);
      try {
        const response = await getTournamentPilotAggregates(selectedTournament._id);
        if (response.success) {
          setPilotAggregates(response.data);
        }
      } catch (error) {
        console.error('Error loading pilot aggregates:', error);
        alert('Failed to load pilot statistics');
      } finally {
        setLoading(false);
      }
    }
  };

  const getPlayingStyleColor = (style) => {
    switch (style) {
      case 'Aggressive': return '#ff4444';
      case 'Defensive': return '#00d4ff';
      case 'Balanced': return '#00d4ff';
      case 'Offensive-minded': return '#ffab00';
      case 'Defensive-minded': return '#00BCD4';
      default: return '#888';
    }
  };

  const handleDownloadPDF = async (report) => {
    try {
      setLoading(true);
      await downloadReportPDF(report._id, report.pilotName, report.roundNumber);
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Reports & Analytics</h2>

      {/* Filters Section */}
      {!selectedTournament && (
        <div style={styles.filterSection}>
          <h3 style={styles.filterTitle}>Tournament Filters</h3>
          <div style={styles.filterGrid}>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>City:</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Enter city name"
                style={styles.filterInput}
              />
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>From Date:</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                style={styles.filterInput}
              />
            </div>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>To Date:</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                style={styles.filterInput}
              />
            </div>
          </div>
          <div style={styles.filterButtons}>
            <button onClick={applyFilters} style={styles.btnApply}>Apply Filters</button>
            <button onClick={clearFilters} style={styles.btnClear}>Clear Filters</button>
          </div>
        </div>
      )}

      {/* Tournament List */}
      {!selectedTournament && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Select Tournament</h3>
          {loading && <p style={styles.loading}>Loading tournaments...</p>}
          {!loading && tournaments.length === 0 && <p style={styles.noData}>No tournaments found</p>}
          <div style={styles.tournamentGrid}>
            {tournaments.map((tournament) => (
              <div
                key={tournament._id}
                style={styles.tournamentCard}
                onClick={() => handleTournamentSelect(tournament)}
              >
                <h4 style={styles.tournamentName}>{tournament.name}</h4>
                <div style={styles.tournamentInfo}>
                  <p>📍 {tournament.location?.city || 'N/A'}</p>
                  <p>📅 {new Date(tournament.startDate).toLocaleDateString()}</p>
                  <p>🏆 {tournament.matchCount} Matches</p>
                  <p>📊 {tournament.reportCount} Reports</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournament Selected View */}
      {selectedTournament && (
        <div>
          {/* Breadcrumb */}
          <div style={styles.breadcrumb}>
            <button onClick={() => setSelectedTournament(null)} style={styles.backButton}>
              ← Back to Tournaments
            </button>
            <h3 style={styles.breadcrumbText}>{selectedTournament.name}</h3>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={activeTab === 'matches' ? {...styles.tab, ...styles.tabActive} : styles.tab}
              onClick={() => handleTabSwitch('matches')}
            >
              📋 Matches
            </button>
            <button
              style={activeTab === 'teams' ? {...styles.tab, ...styles.tabActive} : styles.tab}
              onClick={() => handleTabSwitch('teams')}
            >
              👥 Teams (Pilot Stats)
            </button>
          </div>

          {/* Matches Tab Content */}
          {activeTab === 'matches' && !selectedMatch && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Matches</h3>
              {loading && <p style={styles.loading}>Loading matches...</p>}
              {!loading && matches.length === 0 && <p style={styles.noData}>No completed matches found</p>}
              <div style={styles.matchGrid}>
                {matches.map((match) => (
                  <div
                    key={match._id}
                    style={styles.matchCard}
                    onClick={() => handleMatchSelect(match)}
                  >
                    <div style={styles.matchHeader}>
                      <h4 style={styles.matchTitle}>Match {match.matchNumber}</h4>
                      <span style={styles.matchDate}>
                        {new Date(match.scheduledTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.matchTeams}>
                      <div style={styles.team}>
                        <span style={{...styles.teamName, color: match.teamA?.color}}>
                          {match.teamA?.name}
                        </span>
                        <span style={styles.teamScore}>{match.finalScoreA}</span>
                      </div>
                      <span style={styles.vs}>vs</span>
                      <div style={styles.team}>
                        <span style={{...styles.teamName, color: match.teamB?.color}}>
                          {match.teamB?.name}
                        </span>
                        <span style={styles.teamScore}>{match.finalScoreB}</span>
                      </div>
                    </div>
                    {match.winner && (
                      <div style={styles.matchWinner}>
                        🏆 Winner: {match.winner.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match Reports View */}
          {activeTab === 'matches' && selectedMatch && matchReports && (
            <div>
              <div style={styles.breadcrumb}>
                <button onClick={() => setSelectedMatch(null)} style={styles.backButton}>
                  ← Back to Matches
                </button>
                <h3 style={styles.breadcrumbText}>Match {selectedMatch.matchNumber} - Reports</h3>
              </div>

              <div style={styles.section}>
                {loading && <p style={styles.loading}>Loading reports...</p>}
                {!loading && matchReports.byRound && Object.keys(matchReports.byRound).map((roundNum) => (
                  <div key={roundNum} style={styles.roundSection}>
                    <h4 style={styles.roundTitle}>Round {roundNum}</h4>
                    <div style={styles.reportGrid}>
                      {matchReports.byRound[roundNum].map((report) => (
                        <div key={report._id} style={styles.reportCard}>
                          <div style={styles.reportHeader}>
                            <span style={{...styles.reportDrone, color: report.team?.color}}>
                              {report.droneId}
                            </span>
                            <span style={styles.reportScore}>{report.performanceScore}/100</span>
                          </div>

                          <div style={styles.pilotInfo}>
                            👤 {report.pilotName}
                          </div>

                          <div style={styles.reportStats}>
                            <div style={styles.stat}>
                              <span>Distance:</span>
                              <span>{report.totalDistance?.toFixed(1) || 0}m</span>
                            </div>
                            <div style={styles.stat}>
                              <span>Avg Speed:</span>
                              <span>{report.averageSpeed?.toFixed(1) || 0} m/s</span>
                            </div>
                            <div style={styles.stat}>
                              <span>Battery:</span>
                              <span>{report.batteryUsage?.consumed?.toFixed(1) || 0}%</span>
                            </div>
                            <div style={styles.stat}>
                              <span>Stability:</span>
                              <span>{report.positionAccuracy || 0}%</span>
                            </div>
                          </div>

                          {report.mlAnalysis && (
                            <div style={styles.mlSummary}>
                              <p style={styles.mlSummaryText}>{report.mlAnalysis.summary}</p>
                              <div style={styles.mlMetricsSmall}>
                                <span style={styles.mlBadge}>🔴 Agg: {report.mlAnalysis.aggressiveness}</span>
                                <span style={styles.mlBadge}>🟢 Def: {report.mlAnalysis.defensiveness}</span>
                                <span style={styles.mlBadge}>🔵 Eff: {report.mlAnalysis.efficiency}</span>
                              </div>
                            </div>
                          )}

                          {/* Download PDF Button */}
                          <button
                            style={styles.downloadButton}
                            onClick={() => handleDownloadPDF(report)}
                            disabled={loading}
                          >
                            📥 Download PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teams Tab Content */}
          {activeTab === 'teams' && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Pilot Performance (Tournament-wide)</h3>
              {loading && <p style={styles.loading}>Loading pilot statistics...</p>}
              {!loading && pilotAggregates.length === 0 && <p style={styles.noData}>No pilot data found</p>}
              <div style={styles.pilotGrid}>
                {pilotAggregates.map((pilot, index) => (
                  <div key={pilot.pilotId} style={styles.pilotCard}>
                    <div style={styles.pilotRank}>#{index + 1}</div>
                    <h4 style={styles.pilotName}>{pilot.pilotName}</h4>
                    <div style={{...styles.pilotTeam, color: pilot.team?.color}}>
                      {pilot.team?.name}
                    </div>

                    <div style={styles.pilotStatRow}>
                      <span>Avg Performance:</span>
                      <span style={styles.pilotStatValue}>{pilot.avgPerformanceScore}/100</span>
                    </div>

                    <div style={styles.pilotStatRow}>
                      <span>Matches Played:</span>
                      <span style={styles.pilotStatValue}>{pilot.totalMatches}</span>
                    </div>

                    <div style={styles.pilotStatRow}>
                      <span>Total Rounds:</span>
                      <span style={styles.pilotStatValue}>{pilot.totalRounds}</span>
                    </div>

                    <div style={styles.pilotStatRow}>
                      <span>Drones Used:</span>
                      <span style={styles.pilotStatValue}>{pilot.totalDrones}</span>
                    </div>

                    <div style={styles.pilotStatRow}>
                      <span>Total Distance:</span>
                      <span style={styles.pilotStatValue}>{pilot.totalDistance}m</span>
                    </div>

                    <div style={styles.pilotStatRow}>
                      <span>Avg Speed:</span>
                      <span style={styles.pilotStatValue}>{pilot.avgSpeed} m/s</span>
                    </div>

                    {/* Playing Style Badge */}
                    <div style={{
                      ...styles.playingStyleBadge,
                      backgroundColor: getPlayingStyleColor(pilot.playingStyle)
                    }}>
                      {pilot.playingStyle}
                    </div>

                    {/* ML Metrics */}
                    <div style={styles.mlMetrics}>
                      <div style={styles.metricBar}>
                        <span style={styles.metricLabel}>Aggressive</span>
                        <div style={styles.barContainer}>
                          <div style={{
                            ...styles.barFill,
                            width: `${pilot.avgAggressiveness}%`,
                            backgroundColor: '#ff4444'
                          }} />
                        </div>
                        <span style={styles.metricValue}>{pilot.avgAggressiveness}%</span>
                      </div>

                      <div style={styles.metricBar}>
                        <span style={styles.metricLabel}>Defensive</span>
                        <div style={styles.barContainer}>
                          <div style={{
                            ...styles.barFill,
                            width: `${pilot.avgDefensiveness}%`,
                            backgroundColor: '#00d4ff'
                          }} />
                        </div>
                        <span style={styles.metricValue}>{pilot.avgDefensiveness}%</span>
                      </div>

                      <div style={styles.metricBar}>
                        <span style={styles.metricLabel}>Efficiency</span>
                        <div style={styles.barContainer}>
                          <div style={{
                            ...styles.barFill,
                            width: `${pilot.avgEfficiency}%`,
                            backgroundColor: '#00d4ff'
                          }} />
                        </div>
                        <span style={styles.metricValue}>{pilot.avgEfficiency}%</span>
                      </div>
                    </div>

                    {/* Best Drone */}
                    {pilot.bestDrone && (
                      <div style={styles.bestDrone}>
                        🏆 Best with: {pilot.bestDrone} ({pilot.bestPerformance}/100)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#00d4ff'
  },

  // Filters
  filterSection: {
    backgroundColor: '#1e1e1e',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  filterTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#00d4ff'
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  filterLabel: {
    fontSize: '14px',
    color: '#888'
  },
  filterInput: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #333',
    backgroundColor: '#2a2a2a',
    color: 'white',
    fontSize: '14px'
  },
  filterButtons: {
    display: 'flex',
    gap: '10px'
  },
  btnApply: {
    backgroundColor: '#00d4ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  btnClear: {
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },

  // Common
  section: {
    marginTop: '20px'
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#00d4ff'
  },
  loading: {
    color: '#888',
    textAlign: 'center',
    padding: '40px'
  },
  noData: {
    color: '#888',
    textAlign: 'center',
    padding: '40px'
  },

  // Breadcrumb
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px'
  },
  backButton: {
    backgroundColor: '#444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  breadcrumbText: {
    fontSize: '20px',
    color: 'white'
  },

  // Tabs
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #333'
  },
  tab: {
    backgroundColor: 'transparent',
    color: '#888',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s'
  },
  tabActive: {
    color: '#00d4ff',
    borderBottomColor: '#00d4ff'
  },

  // Tournament Grid
  tournamentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  tournamentCard: {
    backgroundColor: '#1e1e1e',
    padding: '20px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: '2px solid transparent'
  },
  tournamentName: {
    fontSize: '18px',
    marginBottom: '10px',
    color: '#00d4ff'
  },
  tournamentInfo: {
    fontSize: '14px',
    color: '#888'
  },

  // Match Grid
  matchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  matchCard: {
    backgroundColor: '#1e1e1e',
    padding: '20px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: '2px solid transparent'
  },
  matchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  matchTitle: {
    fontSize: '18px',
    color: '#00d4ff'
  },
  matchDate: {
    fontSize: '12px',
    color: '#888'
  },
  matchTeams: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px'
  },
  team: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px'
  },
  teamName: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  teamScore: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00d4ff'
  },
  vs: {
    fontSize: '14px',
    color: '#888',
    fontWeight: 'bold'
  },
  matchWinner: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#FFD700'
  },

  // Round Section
  roundSection: {
    marginBottom: '30px'
  },
  roundTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#00d4ff',
    borderBottom: '2px solid #333',
    paddingBottom: '8px'
  },

  // Report Grid
  reportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '15px'
  },
  reportCard: {
    backgroundColor: '#1e1e1e',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #333'
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  reportDrone: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  reportScore: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#00d4ff'
  },
  pilotInfo: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '10px',
    padding: '6px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px'
  },
  reportStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px'
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#ccc'
  },
  mlSummary: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px'
  },
  mlSummaryText: {
    fontSize: '12px',
    color: '#ccc',
    marginBottom: '8px'
  },
  mlMetricsSmall: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  mlBadge: {
    fontSize: '11px',
    padding: '4px 8px',
    backgroundColor: '#333',
    borderRadius: '4px',
    color: '#ccc'
  },

  // Pilot Grid
  pilotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  pilotCard: {
    backgroundColor: '#1e1e1e',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #333',
    position: 'relative'
  },
  pilotRank: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#00d4ff',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  pilotName: {
    fontSize: '20px',
    marginBottom: '5px',
    color: 'white'
  },
  pilotTeam: {
    fontSize: '14px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  pilotStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #333',
    fontSize: '14px',
    color: '#ccc'
  },
  pilotStatValue: {
    fontWeight: 'bold',
    color: '#00d4ff'
  },
  playingStyleBadge: {
    marginTop: '15px',
    padding: '8px',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white'
  },
  mlMetrics: {
    marginTop: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  metricBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px'
  },
  metricLabel: {
    width: '70px',
    color: '#888'
  },
  barContainer: {
    flex: 1,
    height: '8px',
    backgroundColor: '#333',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    transition: 'width 0.3s'
  },
  metricValue: {
    width: '40px',
    textAlign: 'right',
    color: '#ccc',
    fontWeight: 'bold'
  },
  bestDrone: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    fontSize: '13px',
    textAlign: 'center',
    color: '#FFD700'
  },

  // Download Button
  downloadButton: {
    marginTop: '12px',
    width: '100%',
    padding: '10px',
    backgroundColor: '#00d4ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: '#45a049'
    },
    ':disabled': {
      backgroundColor: '#666',
      cursor: 'not-allowed'
    }
  }
};

export default ReportsManager;
