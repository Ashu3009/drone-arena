import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReportsViewer.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔧 API_URL configured as:', API_URL);
console.log('🔧 env var REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

const ReportsViewer = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [droneReports, setDroneReports] = useState({}); // ✅ Map of roundNumber -> DroneReports
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all tournaments on load
  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      console.log('🔍 Fetching tournaments...');
      const response = await axios.get(`${API_URL}/tournaments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📡 Tournaments API Response:', response.data);

      const allTournaments = Array.isArray(response.data)
        ? response.data
        : (response.data.data || []);

      console.log('✅ Parsed tournaments:', allTournaments.length, allTournaments);

      setTournaments(allTournaments);
    } catch (err) {
      console.error('❌ Error fetching tournaments:', err);
    }
  };

  const fetchMatchesForTournament = async (tournamentId) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allMatches = Array.isArray(response.data)
        ? response.data
        : (response.data.data || []);

      // Filter matches for this tournament and with completed rounds
      const tournamentMatches = allMatches.filter(m =>
        m.tournament._id === tournamentId &&
        (m.status === 'completed' || (m.rounds && m.rounds.some(r => r.status === 'completed')))
      );

      setMatches(tournamentMatches);
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  const fetchAnalysis = async (matchId, roundNumber) => {
    setLoading(true);
    setError('');
    setAnalysisData(null);

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/analysis/round/${matchId}/${roundNumber}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAnalysisData(response.data);

      // ✅ Fetch actual DroneReport documents for PDF download
      const reportsResponse = await axios.get(
        `${API_URL}/reports/matches/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allReports = reportsResponse.data.data?.reports || [];
      const roundReports = allReports.filter(r => r.roundNumber === parseInt(roundNumber));

      // Create map of droneId -> report for easy lookup
      const reportMap = {};
      roundReports.forEach(report => {
        reportMap[report.droneId] = report;
      });

      setDroneReports(reportMap);
      console.log('✅ Fetched DroneReports:', roundReports.length, reportMap);

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Download PDF for individual drone report
  const downloadDronePDF = async (reportId, droneId, pilotName) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/reports/${reportId}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob' // Important for PDF download
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${pilotName}_${droneId}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log(`✅ PDF downloaded for ${droneId}`);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to download PDF report');
    }
  };

  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
    setSelectedMatch(null);
    setSelectedRound(null);
    setAnalysisData(null);
    setMatches([]);
    fetchMatchesForTournament(tournament._id);
  };

  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
    setSelectedRound(null);
    setAnalysisData(null);
  };

  const handleRoundSelect = (round) => {
    setSelectedRound(round);
    fetchAnalysis(selectedMatch._id, round.roundNumber);
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#4caf50';
    if (grade.startsWith('B')) return '#2196f3';
    if (grade.startsWith('C')) return '#ff9800';
    return '#f44336';
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#4caf50';
    if (score >= 55) return '#2196f3';
    if (score >= 45) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="reports-viewer">
      <h2>📊 Drone Performance Analysis</h2>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        Select Tournament → Match → Round to view detailed performance analysis
      </p>

      <div className="reports-layout">
        {/* Tournament Selection */}
        <div className="matches-list">
          <h3>1. Select Tournament</h3>
          {tournaments.length === 0 ? (
            <p className="no-data">No tournaments found</p>
          ) : (
            tournaments.map(tournament => (
              <div
                key={tournament._id}
                className={`match-card ${selectedTournament?._id === tournament._id ? 'selected' : ''}`}
                onClick={() => handleTournamentSelect(tournament)}
              >
                <div className="match-teams">
                  <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{tournament.name}</span>
                </div>
                <div className="match-tournament">
                  {tournament.city || 'Tournament'} • {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : ''}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Match Selection */}
        {selectedTournament && (
          <div className="matches-list">
            <h3>2. Select Match</h3>
            {matches.length === 0 ? (
              <p className="no-data">No completed matches in this tournament</p>
            ) : (
              matches.map(match => (
                <div
                  key={match._id}
                  className={`match-card ${selectedMatch?._id === match._id ? 'selected' : ''}`}
                  onClick={() => handleMatchSelect(match)}
                >
                  <div className="match-teams">
                    <span className="team-red">{match.teamA?.name || 'Team A'}</span>
                    <span className="vs">vs</span>
                    <span className="team-blue">{match.teamB?.name || 'Team B'}</span>
                  </div>
                  <div className="match-score">
                    {match.finalScoreA} - {match.finalScoreB}
                  </div>
                  <div className="match-tournament">
                    {match.tournament?.name || 'Tournament'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Round Selection */}
        {selectedMatch && (
          <div className="rounds-list">
            <h3>3. Select Round</h3>
            {selectedMatch.rounds.map(round => (
              <div
                key={round.roundNumber}
                className={`round-card ${selectedRound?.roundNumber === round.roundNumber ? 'selected' : ''}`}
                onClick={() => handleRoundSelect(round)}
              >
                <div className="round-header">
                  <span className="round-number">Round {round.roundNumber}</span>
                  <span className={`round-status ${round.status}`}>{round.status}</span>
                </div>
                <div className="round-score">
                  {round.scoreA} - {round.scoreB}
                </div>
                <div className="round-drones">
                  {round.registeredDrones.length} drones
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analysis Results */}
        {selectedRound && (
          <div className="analysis-results">
            <h3>Analysis Results</h3>

            {loading && <div className="loading">Analyzing performance...</div>}

            {error && <div className="error-message">{error}</div>}

            {analysisData && (
              <div className="analysis-content">
                {/* Team Stats Summary */}
                <div className="team-stats">
                  <h4>Team Performance</h4>
                  {Object.entries(analysisData.teamStats).map(([teamName, stats]) => (
                    <div key={teamName} className="team-stat-card">
                      <div className="team-name">{teamName}</div>
                      <div className="team-score">{stats.avgScore}/100</div>
                      <div className="team-drones">{stats.dronesAnalyzed} drones analyzed</div>
                    </div>
                  ))}
                </div>

                {/* Individual Drone Reports */}
                <div className="drone-reports">
                  <h4>Individual Drone Performance</h4>
                  {analysisData.reports.map(report => (
                    <div key={report.droneId} className={`drone-report-card ${report.status === 'disconnected' || report.status === 'not_registered' ? 'disconnected' : ''}`}>
                      {(report.status === 'disconnected' || report.status === 'not_registered') ? (
                        <div className="report-disconnected">
                          {/* Header */}
                          <div className="report-header">
                            <div className="drone-info">
                              <span className={`drone-id ${report.droneId.startsWith('R') ? 'red' : 'blue'}`}>
                                {report.droneId}
                              </span>
                              <span className="role-badge">{report.role}</span>
                              <span className="team-name">{report.team}</span>
                            </div>
                            <div className="status-badge disconnected">
                              🔴 {report.status === 'not_registered' ? 'NOT REGISTERED' : 'DISCONNECTED'}
                            </div>
                          </div>

                          {/* Message */}
                          <div className="disconnected-message">
                            <h5>{report.message}</h5>
                            <p>No telemetry data was received during this round.</p>
                          </div>

                          {/* Insights */}
                          <div className="insights-section">
                            <h5>Possible Reasons</h5>
                            <ul className="insights-list">
                              {report.performance.insights.map((insight, idx) => (
                                <li key={idx} className="warning">
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Recommendations */}
                          <div className="recommendations-section">
                            <h5>Troubleshooting Steps</h5>
                            <ul className="recommendations-list">
                              {report.performance.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Button */}
                          {report.status === 'not_registered' && (
                            <div className="action-section">
                              <button
                                className="register-esp-button"
                                onClick={() => window.location.href = '/admin?tab=esp'}
                              >
                                Register ESP Hardware
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Header */}
                          <div className="report-header">
                            <div className="drone-info">
                              <span className={`drone-id ${report.droneId.startsWith('R') ? 'red' : 'blue'}`}>
                                {report.droneId}
                              </span>
                              <span className="role-badge">{report.role}</span>
                              <span className="team-name">{report.team}</span>
                            </div>
                            <div className="grade-circle" style={{ backgroundColor: getGradeColor(report.grade) }}>
                              {report.grade}
                            </div>
                          </div>

                          {/* Performance Scores */}
                          <div className="performance-scores">
                            <div className="score-bar">
                              <label>Overall</label>
                              <div className="bar-container">
                                <div
                                  className="bar-fill"
                                  style={{
                                    width: `${report.performance.overallScore}%`,
                                    backgroundColor: getScoreColor(report.performance.overallScore)
                                  }}
                                />
                                <span className="score-value">{report.performance.overallScore}</span>
                              </div>
                            </div>

                            <div className="score-bar">
                              <label>Aggression</label>
                              <div className="bar-container">
                                <div
                                  className="bar-fill"
                                  style={{
                                    width: `${report.performance.aggression}%`,
                                    backgroundColor: getScoreColor(report.performance.aggression)
                                  }}
                                />
                                <span className="score-value">{report.performance.aggression}</span>
                              </div>
                            </div>

                            <div className="score-bar">
                              <label>Consistency</label>
                              <div className="bar-container">
                                <div
                                  className="bar-fill"
                                  style={{
                                    width: `${report.performance.consistency}%`,
                                    backgroundColor: getScoreColor(report.performance.consistency)
                                  }}
                                />
                                <span className="score-value">{report.performance.consistency}</span>
                              </div>
                            </div>

                            <div className="score-bar">
                              <label>Effectiveness</label>
                              <div className="bar-container">
                                <div
                                  className="bar-fill"
                                  style={{
                                    width: `${report.performance.effectiveness}%`,
                                    backgroundColor: getScoreColor(report.performance.effectiveness)
                                  }}
                                />
                                <span className="score-value">{report.performance.effectiveness}</span>
                              </div>
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="metrics-grid">
                            <div className="metric">
                              <span className="metric-label">Avg Intensity</span>
                              <span className="metric-value">{report.metrics.avgIntensity} m/s²</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Burst Count</span>
                              <span className="metric-value">{report.metrics.burstCount}</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Active Time</span>
                              <span className="metric-value">{(100 - report.metrics.idlePercentage).toFixed(1)}%</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Maneuvers</span>
                              <span className="metric-value">{report.metrics.directionChanges}</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Distance</span>
                              <span className="metric-value">{report.metrics.totalDistance}</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Data Points</span>
                              <span className="metric-value">{report.metrics.dataPoints}</span>
                            </div>
                          </div>

                          {/* Insights */}
                          <div className="insights-section">
                            <h5>Insights</h5>
                            <ul className="insights-list">
                              {report.performance.insights.map((insight, idx) => (
                                <li key={idx} className={insight.includes('⚠️') ? 'warning' : 'positive'}>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Recommendations */}
                          <div className="recommendations-section">
                            <h5>Recommendations</h5>
                            <ul className="recommendations-list">
                              {report.performance.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>

                          {/* PDF Download Button */}
                          {droneReports[report.droneId] && (
                            <div className="pdf-download-section" style={{ marginTop: '15px', textAlign: 'center' }}>
                              <button
                                className="pdf-download-button"
                                onClick={() => downloadDronePDF(
                                  droneReports[report.droneId]._id,
                                  report.droneId,
                                  droneReports[report.droneId].pilotName || 'Pilot'
                                )}
                                style={{
                                  padding: '10px 20px',
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  margin: '0 auto'
                                }}
                              >
                                📄 Download PDF Report
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsViewer;
