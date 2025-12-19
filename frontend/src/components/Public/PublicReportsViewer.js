import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PublicReportsViewer.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PublicReportsViewer = () => {
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);

  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, []);

    const fetchTournaments = async () => {
    try {
      const response = await axios.get(`${API_URL}/tournaments`);

      const allTournaments = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setTournaments(allTournaments);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    }
  };

  const fetchMatchesForTournament = async (tournamentId) => {
  try {
    const response = await axios.get(`${API_URL}/matches`);

      const allMatches = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const tournamentMatches = allMatches.filter(m =>
        m.tournament._id === tournamentId &&
        (m.status === 'completed' || (m.rounds && m.rounds.some(r => r.status === 'completed')))
      );

      setMatches(tournamentMatches);
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

    const fetchAnalysisForRound = async (matchId, roundNumber) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/analysis/round/${matchId}/${roundNumber}`
      );

      console.log('✅ Analysis data received:', response.data);
      console.log('📊 Team A Reports:', response.data.teamAReports);
      console.log('📊 Team B Reports:', response.data.teamBReports);
      console.log('📊 Team A Reports Length:', response.data.teamAReports?.length);
      console.log('📊 Team B Reports Length:', response.data.teamBReports?.length);
      setAnalysisData(response.data);
    } catch (err) {
      console.error('❌ Error fetching analysis:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentClick = (tournament) => {
    setSelectedTournament(tournament);
    setSelectedMatch(null);
    setSelectedRound(null);
    setAnalysisData(null);
    fetchMatchesForTournament(tournament._id);
  };

  const handleMatchClick = (match) => {
    setSelectedMatch(match);
    setSelectedRound(null);
    setAnalysisData(null);
  };

  const handleRoundClick = (round) => {
    setSelectedRound(round);
    fetchAnalysisForRound(selectedMatch._id, round.roundNumber);
  };

  const goBackToTournaments = () => {
    setSelectedTournament(null);
    setSelectedMatch(null);
    setSelectedRound(null);
    setAnalysisData(null);
    setMatches([]);
  };

  const goBackToMatches = () => {
    setSelectedMatch(null);
    setSelectedRound(null);
    setAnalysisData(null);
  };

  const goBackToRounds = () => {
    setSelectedRound(null);
    setAnalysisData(null);
  };

  const downloadPDF = async (reportId) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/${reportId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Drone_Report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#4caf50';
    if (score >= 55) return '#2196f3';
    if (score >= 45) return '#ffab00';
    return '#f44336';
  };

  // VIEW 1: Tournament List
  if (!selectedTournament) {
    return (
      <div className="reports-viewer">
        <h2>📊 Drone Performance Reports</h2>
        <p>Select a tournament to view reports</p>

        {tournaments.length === 0 ? (
          <p className="no-data">No tournaments found</p>
        ) : (
          <div className="items-grid">
            {tournaments.map(tournament => (
              <div
                key={tournament._id}
                className="item-card"
                onClick={() => handleTournamentClick(tournament)}
              >
                <div className="item-title">{tournament.name}</div>
                <div className="item-subtitle">
                  {tournament.location?.city || tournament.city || 'Unknown'}
                </div>
                <div className="item-subtitle">
                  {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: Match List (for selected tournament)
  if (selectedTournament && !selectedMatch) {
    return (
      <div className="reports-viewer">
        <button className="back-button" onClick={goBackToTournaments}>
          ← Back to Tournaments
        </button>
        <h2>{selectedTournament.name}</h2>
        <p>Select a match to view round reports</p>

        {matches.length === 0 ? (
          <p className="no-data">No matches found for this tournament</p>
        ) : (
          <div className="items-grid">
            {matches.map(match => (
              <div
                key={match._id}
                className="item-card"
                onClick={() => handleMatchClick(match)}
              >
                <div className="item-title">
                  {match.teamA?.name || 'Team A'} vs {match.teamB?.name || 'Team B'}
                </div>
                <div className="item-score">
                  {match.finalScoreA || 0} - {match.finalScoreB || 0}
                </div>
                <div className="item-subtitle">
                  {match.status === 'completed' ? '✓ Completed' : match.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // VIEW 3: Round List (for selected match)
  if (selectedMatch && !selectedRound) {
    return (
      <div className="reports-viewer">
        <button className="back-button" onClick={goBackToMatches}>
          ← Back to Matches
        </button>
        <h2>{selectedMatch.teamA?.name || 'Team A'} vs {selectedMatch.teamB?.name || 'Team B'}</h2>
        <p>Select a round to view performance reports</p>

        <div className="rounds-grid">
          {selectedMatch.rounds?.map(round => (
            <div
              key={round.roundNumber}
              className="round-block"
              onClick={() => handleRoundClick(round)}
            >
              <div className="round-header-block">
                <div className="round-title">Round {round.roundNumber}</div>
                <div className={`round-status-badge ${round.status}`}>
                  {round.status}
                </div>
              </div>
              <div className="round-score-display">
                {round.teamAScore || 0} - {round.teamBScore || 0}
              </div>
              <div className="round-details">
                <div className="round-detail-row">
                  <span className="round-detail-label">Drones</span>
                  <span className="round-detail-value">{round.registeredDrones?.length || 0}</span>
                </div>
                <div className="round-detail-row">
                  <span className="round-detail-label">Duration</span>
                  <span className="round-detail-value">{round.duration || 180}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VIEW 4: Reports (for selected round)
  return (
    <div className="reports-viewer">
      <button className="back-button" onClick={goBackToRounds}>
        ← Back to Rounds
      </button>
      <h2>Round {selectedRound.roundNumber} - Performance Reports</h2>

      {loading ? (
        <p className="loading">Loading reports...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : analysisData ? (
        <>
          {/* Team Stats */}
          <div className="team-stats">
            <div className="team-stat-card">
              <div className="team-name">{selectedMatch.teamA?.name || 'Team A'}</div>
              <div className="team-score">{analysisData.teamAScore?.toFixed(2) || 0}</div>
              <div className="team-drones">{analysisData.teamAReports?.length || 0} Drones</div>
            </div>
            <div className="team-stat-card">
              <div className="team-name">{selectedMatch.teamB?.name || 'Team B'}</div>
              <div className="team-score">{analysisData.teamBScore?.toFixed(2) || 0}</div>
              <div className="team-drones">{analysisData.teamBReports?.length || 0} Drones</div>
            </div>
          </div>

          {/* Team A Reports */}
          <h3 style={{ color: '#00d4ff', marginTop: '30px', marginBottom: '15px' }}>
            {selectedMatch.teamA?.name || 'Team A'} Drones
          </h3>
          {!analysisData.teamAReports || analysisData.teamAReports.length === 0 ? (
            <p className="no-data">No reports found for Team A</p>
          ) : (
            <div className="reports-grid">
            {analysisData.teamAReports.map(report => (
            <div key={report._id} className={`drone-report-card ${!report.performance ? 'disconnected' : ''}`}>
              <div className="report-header">
                <div className="drone-info">
                  <span className={`drone-id ${report.droneId.startsWith('R') ? 'red' : 'blue'}`}>
                    {report.droneId}
                  </span>
                  <span className="role-badge">{report.role}</span>
                </div>
                {report.performance && report.performance.overallScore > 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <div className="score-display">
                      {report.performance.overallScore.toFixed(2)}
                    </div>
                    <div className="score-label">out of 100</div>
                  </div>
                ) : (
                  <span className="status-badge disconnected">
                    {report.status === 'not_registered' ? 'NOT REG' : 'OFFLINE'}
                  </span>
                )}
              </div>

              {report.performance ? (
                <>
                  <div className="performance-scores">
                    <div className="score-bar">
                      <label>Overall</label>
                      <div className="bar-container">
                        <div className="bar-fill" style={{
                          width: `${(report.performance.overallScore / 100).toFixed(2)}%`,
                          backgroundColor: getScoreColor(report.performance.overallScore / 100)
                        }} />
                        <span className="score-value">{(report.performance.overallScore / 100).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="score-bar">
                      <label>Aggression</label>
                      <div className="bar-container">
                        <div className="bar-fill" style={{
                          width: `${(report.performance.aggression / 100).toFixed(2)}%`,
                          backgroundColor: getScoreColor(report.performance.aggression / 100)
                        }} />
                        <span className="score-value">{(report.performance.aggression / 100).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="score-bar">
                      <label>Consistency</label>
                      <div className="bar-container">
                        <div className="bar-fill" style={{
                          width: `${report.performance.consistency}%`,
                          backgroundColor: getScoreColor(report.performance.consistency)
                        }} />
                        <span className="score-value">{report.performance.consistency.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="score-bar">
                      <label>Effectiveness</label>
                      <div className="bar-container">
                        <div className="bar-fill" style={{
                          width: `${(report.performance.effectiveness / 100).toFixed(2)}%`,
                          backgroundColor: getScoreColor(report.performance.effectiveness / 100)
                        }} />
                        <span className="score-value">{(report.performance.effectiveness / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="metrics-grid">
                    <div className="metric">
                      <span className="metric-label">Avg Intensity</span>
                      <span className="metric-value">{report.metrics.avgIntensity} m/s²</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Peak Intensity</span>
                      <span className="metric-value">{report.metrics.peakIntensity} m/s²</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Active Time</span>
                      <span className="metric-value">{report.metrics.activeTimePercentage}%</span>
                    </div>
                  </div>

                  {report.insights?.insights?.length > 0 && (
                    <div className="insights-section">
                      <h5>Insights</h5>
                      <ul className="insights-list">
                        {report.insights.insights.map((insight, idx) => (
                          <li key={idx} className={insight.includes('⚠️') ? 'warning' : ''}>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.insights?.recommendations?.length > 0 && (
                    <div className="recommendations-section">
                      <h5>Recommendations</h5>
                      <ul className="recommendations-list">
                        {report.insights.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pdf-download-section">
                    <button
                      className="pdf-download-button"
                      onClick={() => downloadPDF(report._id)}
                    >
                      📄 Download PDF Report
                    </button>
                  </div>
                </>
              ) : (
                <div className="disconnected-message">
                  <h5>Drone Disconnected</h5>
                  <p>No telemetry data received during this round</p>
                </div>
              )}
            </div>
          ))}
            </div>
          )}

          {/* Team B Reports */}
          <h3 style={{ color: '#3b82f6', marginTop: '30px', marginBottom: '15px' }}>
            {selectedMatch.teamB?.name || 'Team B'} Drones
          </h3>
          {!analysisData.teamBReports || analysisData.teamBReports.length === 0 ? (
            <p className="no-data">No reports found for Team B</p>
          ) : (
            <div className="reports-grid">
            {analysisData.teamBReports.map(report => (
            <div key={report._id} className={`drone-report-card ${!report.performance ? 'disconnected' : ''}`}>
              <div className="report-header">
                <div className="drone-info">
                  <span className={`drone-id ${report.droneId.startsWith('R') ? 'red' : 'blue'}`}>
                    {report.droneId}
                  </span>
                  <span className="role-badge">{report.role}</span>
                </div>
                {report.performance && report.performance.overallScore > 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <div className="score-display">
                      {report.performance.overallScore.toFixed(2)}
                    </div>
                    <div className="score-label">out of 100</div>
                  </div>
                ) : (
                  <span className="status-badge disconnected">
                    {report.status === 'not_registered' ? 'NOT REG' : 'OFFLINE'}
                  </span>
                )}
              </div>

              {report.performance ? (
                <>
                  <div className="performance-scores">
                    <div className="score-bar">
                      <label>Overall</label>
                      <div className="bar-container">
                        <div className="bar-fill" style={{
                          width: `${(report.performance.overallScore / 100).toFixed(2)}%`,
                          backgroundColor: getScoreColor(report.performance.overallScore / 100)
                        }} />
                        <span className="score-value">{(report.performance.overallScore / 100).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="score-bar">
                      <label>Aggression</label>
                      <div className="bar-container">
                        <div className="bar-fill" style={{
                          width: `${(report.performance.aggression / 100).toFixed(2)}%`,
                          backgroundColor: getScoreColor(report.performance.aggression / 100)
                        }} />
                        <span className="score-value">{(report.performance.aggression / 100).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="score-bar">
                      <label>Consistency</label>
                      <div className="bar-container">
                        <div className="bar-fill" style={{
                          width: `${report.performance.consistency}%`,
                          backgroundColor: getScoreColor(report.performance.consistency)
                        }} />
                        <span className="score-value">{report.performance.consistency.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="score-bar">
                      <label>Effectiveness</label>
                      <div className="bar-container">
                        <div className="bar-fill" style={{
                          width: `${(report.performance.effectiveness / 100).toFixed(2)}%`,
                          backgroundColor: getScoreColor(report.performance.effectiveness / 100)
                        }} />
                        <span className="score-value">{(report.performance.effectiveness / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="metrics-grid">
                    <div className="metric">
                      <span className="metric-label">Avg Intensity</span>
                      <span className="metric-value">{report.metrics.avgIntensity} m/s²</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Peak Intensity</span>
                      <span className="metric-value">{report.metrics.peakIntensity} m/s²</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Active Time</span>
                      <span className="metric-value">{report.metrics.activeTimePercentage}%</span>
                    </div>
                  </div>

                  {report.insights?.insights?.length > 0 && (
                    <div className="insights-section">
                      <h5>Insights</h5>
                      <ul className="insights-list">
                        {report.insights.insights.map((insight, idx) => (
                          <li key={idx} className={insight.includes('⚠️') ? 'warning' : ''}>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.insights?.recommendations?.length > 0 && (
                    <div className="recommendations-section">
                      <h5>Recommendations</h5>
                      <ul className="recommendations-list">
                        {report.insights.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pdf-download-section">
                    <button
                      className="pdf-download-button"
                      onClick={() => downloadPDF(report._id)}
                    >
                      📄 Download PDF Report
                    </button>
                  </div>
                </>
              ) : (
                <div className="disconnected-message">
                  <h5>Drone Disconnected</h5>
                  <p>No telemetry data received during this round</p>
                </div>
              )}
            </div>
          ))}
            </div>
          )}
        </>
      ) : (
        <p className="no-data">No reports available for this round</p>
      )}
    </div>
  );
};

export default PublicReportsViewer;
