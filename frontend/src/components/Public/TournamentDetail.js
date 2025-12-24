import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  getTournamentById,
  getMatches
} from '../../services/api';
import './TournamentDetail.css';
import defaultBanner from '../../assets/logo.png';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to get full image URL
const getImageUrl = (path) => {
  if (!path) return '';
  // If already a full URL (starts with http:// or https://), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Otherwise, prepend BACKEND_URL
  return `${BACKEND_URL}${path}`;
};

const TournamentDetail = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('');

  // Team Detail Modal state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Reports tab state
  const [selectedMatchForReports, setSelectedMatchForReports] = useState(null);
  const [selectedRoundForReports, setSelectedRoundForReports] = useState(null);
  const [roundAnalysisData, setRoundAnalysisData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    loadTournamentData();
  }, [id]);

  const loadTournamentData = async () => {
    setLoading(true);
    try {
      const [tournamentRes, matchesRes] = await Promise.all([
        getTournamentById(id),
        getMatches()
      ]);

      if (tournamentRes.success) {
        setTournament(tournamentRes.data);
      }

      if (matchesRes.success) {
        // Filter matches for this tournament
        const tournamentMatches = matchesRes.data.filter(
          m => m.tournament._id === id || m.tournament === id
        );
        setMatches(tournamentMatches);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = dateFilter
    ? matches.filter(m => {
        const matchDate = new Date(m.scheduledTime).toISOString().split('T')[0];
        return matchDate === dateFilter;
      })
    : matches;

  // Team modal handlers
  const handleOpenTeamModal = async (team) => {
  if (team && team._id) {
    // Calculate tournament-specific stats for this team
    const teamMatches = matches.filter(m => 
      m.teamA?._id === team._id || m.teamB?._id === team._id
    );
    
    const stats = {
      matchesPlayed: teamMatches.filter(m => m.status === 'completed').length,
      wins: teamMatches.filter(m => 
        m.status === 'completed' && m.winner?._id === team._id
      ).length,
      totalGoals: teamMatches.reduce((total, match) => {
        if (match.teamA?._id === team._id) {
          return total + (match.finalScoreA || 0);
        } else if (match.teamB?._id === team._id) {
          return total + (match.finalScoreB || 0);
        }
        return total;
      }, 0),
      losses: teamMatches.filter(m => 
        m.status === 'completed' && m.winner?._id !== team._id && m.winner !== null
      ).length
    };
    
    // Attach stats to team object
    const teamWithStats = {
      ...team,
      tournamentStats: stats
    };
    
    setSelectedTeam(teamWithStats);
    setShowTeamModal(true);
  }
};


  const handleCloseTeamModal = () => {
    setShowTeamModal(false);
    setSelectedTeam(null);
  };

  // Reports Tab handlers
  const handleSelectMatchForReports = (match) => {
    setSelectedMatchForReports(match);
    setSelectedRoundForReports(null);
    setRoundAnalysisData(null);
  };

  const handleSelectRoundForReports = async (round) => {
    setSelectedRoundForReports(round);
    setReportsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL.replace('/uploads', '')}/api/analysis/match/${selectedMatchForReports._id}/round/${round.roundNumber}`);
      const data = await response.json();

      if (data.success) {
        setRoundAnalysisData(data.data);
      } else {
        setRoundAnalysisData(null);
        alert('No analysis data available for this round');
      }
    } catch (error) {
      console.error('Error fetching round analysis:', error);
      setRoundAnalysisData(null);
      alert('Failed to load round analysis');
    } finally {
      setReportsLoading(false);
    }
  };

  const goBackToMatchSelection = () => {
    setSelectedMatchForReports(null);
    setSelectedRoundForReports(null);
    setRoundAnalysisData(null);
  };

  const goBackToRoundSelection = () => {
    setSelectedRoundForReports(null);
    setRoundAnalysisData(null);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#4caf50';
    if (score >= 55) return '#2196f3';
    if (score >= 45) return '#ffab00';
    return '#f44336';
  };

  if (loading) {
    return (
      <div className="tournament-detail-container">
        <div className="tournament-detail-loading">Loading tournament details...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tournament-detail-container">
        <div className="tournament-detail-error">Tournament not found</div>
      </div>
    );
  }

  return (
    <div className="tournament-detail-container">
      {/* Header */}
      <div className="tournament-detail-header">
        {tournament.media?.bannerImage ? (
          <img
            src={getImageUrl(tournament.media.bannerImage)}
            alt={tournament.name}
            className="tournament-detail-banner"
          />
        ) : (
          <img
            src={defaultBanner}
            alt="Default Tournament Banner"
            className="tournament-detail-banner"
          />
        )}
        <div className="tournament-detail-header-content">
          <h1 className="tournament-detail-title">{tournament.name}</h1>
          <div className="tournament-detail-header-info">
            <span className="tournament-detail-location">
              📍 {tournament.location?.city}, {tournament.location?.state}
            </span>
            <span className="tournament-detail-dates">
              📅 {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
            </span>
            <span className="tournament-detail-status" style={{backgroundColor: tournament.status === 'completed' ? '#4CAF50' : '#FF9800'}}>
              {tournament.status || 'Upcoming'}
            </span>
          </div>
          {tournament.description && (
            <p className="tournament-detail-description">{tournament.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tournament-detail-tabs-container">
        <button
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'tournament-detail-tab-active' : 'tournament-detail-tab'}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={activeTab === 'matches' ? 'tournament-detail-tab-active' : 'tournament-detail-tab'}
        >
          Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={activeTab === 'teams' ? 'tournament-detail-tab-active' : 'tournament-detail-tab'}
        >
          Teams ({tournament.registeredTeams?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('awards')}
          className={activeTab === 'awards' ? 'tournament-detail-tab-active' : 'tournament-detail-tab'}
        >
          Awards
        </button>
        {/* <button
          onClick={() => setActiveTab('reports')}
          className={activeTab === 'reports' ? 'tournament-detail-tab-active' : 'tournament-detail-tab'}
        >
          📊 Reports
        </button> */}
        <button
          onClick={() => setActiveTab('gallery')}
          className={activeTab === 'gallery' ? 'tournament-detail-tab-active' : 'tournament-detail-tab'}
        >
          Gallery ({tournament.media?.gallery?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tournament-detail-tab-content">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="tournament-detail-section-title">🏆 Champions</h2>
            {tournament.winners?.champion || tournament.winners?.runnerUp || tournament.winners?.thirdPlace ? (
              <div className="tournament-winners-grid">
                {tournament.winners.champion && (
                  <div
                    className="tournament-winner-card"
                    onClick={() => handleOpenTeamModal(tournament.winners.champion)}
                  >
                    <div className="tournament-winner-medal">🥇</div>
                    <h3 className="tournament-winner-title">Champion</h3>
                    <p className="tournament-winner-team">
                      {tournament.winners.champion.name || 'TBD'}
                    </p>
                    <p className="tournament-winner-click-hint">Click to view team details</p>
                  </div>
                )}
                {tournament.winners.runnerUp && (
                  <div
                    className="tournament-winner-card"
                    onClick={() => handleOpenTeamModal(tournament.winners.runnerUp)}
                  >
                    <div className="tournament-winner-medal">🥈</div>
                    <h3 className="tournament-winner-title">Runner Up</h3>
                    <p className="tournament-winner-team">
                      {tournament.winners.runnerUp.name || 'TBD'}
                    </p>
                    <p className="tournament-winner-click-hint">Click to view team details</p>
                  </div>
                )}
                {tournament.winners.thirdPlace && (
                  <div
                    className="tournament-winner-card"
                    onClick={() => handleOpenTeamModal(tournament.winners.thirdPlace)}
                  >
                    <div className="tournament-winner-medal">🥉</div>
                    <h3 className="tournament-winner-title">Third Place</h3>
                    <p className="tournament-winner-team">
                      {tournament.winners.thirdPlace.name || 'TBD'}
                    </p>
                    <p className="tournament-winner-click-hint">Click to view team details</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="tournament-empty-text">Winners will be announced after tournament completion</p>
            )}

            {/* Man of the Tournament */}
            <h2 className="tournament-detail-section-title">Man of the Tournament</h2>
            {tournament.manOfTheTournament?.playerName ? (
              <div className="tournament-mot-card">
                {tournament.manOfTheTournament.photo && (
                  <img
                    src={getImageUrl(tournament.manOfTheTournament.photo)}
                    alt={tournament.manOfTheTournament.playerName}
                    className="tournament-mot-photo"
                  />
                )}
                <div className="tournament-mot-info">
                  <h3 className="tournament-mot-name">{tournament.manOfTheTournament.playerName}</h3>
                  <p className="tournament-mot-team">
                    Team: {tournament.manOfTheTournament.team?.name || 'N/A'}
                  </p>
                  <div className="tournament-mot-stats">
                    <div className="tournament-stat-item">
                      <span className="tournament-stat-value">{tournament.manOfTheTournament.stats?.avgPerformance || 0}</span>
                      <span className="tournament-stat-label">Avg Score</span>
                    </div>
                    <div className="tournament-stat-item">
                      <span className="tournament-stat-value">{tournament.manOfTheTournament.stats?.totalMatches || 0}</span>
                      <span className="tournament-stat-label">Matches</span>
                    </div>
                    <div className="tournament-stat-item">
                      <span className="tournament-stat-value">{tournament.manOfTheTournament.stats?.avgSpeed?.toFixed(1) || '0.0'}</span>
                      <span className="tournament-stat-label">Avg Speed</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="tournament-empty-text">Man of the Tournament will be announced soon</p>
            )}

            {/* Tournament Info */}
            <h2 className="tournament-detail-section-title">Tournament Information</h2>
            <div className="tournament-info-grid">
              <div className="tournament-info-card">
                <p className="tournament-info-label">Venue</p>
                <p className="tournament-info-value">{tournament.location?.venue || 'TBD'}</p>
              </div>
              <div className="tournament-info-card">
                <p className="tournament-info-label">Teams</p>
                <p className="tournament-info-value">{tournament.currentTeams || 0} / {tournament.maxTeams}</p>
              </div>
              <div className="tournament-info-card">
                <p className="tournament-info-label">Match Type</p>
                <p className="tournament-info-value">{tournament.settings?.matchType || 'Best of 2'}</p>
              </div>
              <div className="tournament-info-card">
                <p className="tournament-info-label">Round Duration</p>
                <p className="tournament-info-value">{tournament.settings?.roundDuration || 3} minutes</p>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div>
            <div className="tournament-filter-row">
              <h2 className="tournament-detail-section-title">All Matches</h2>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="tournament-date-filter"
                placeholder="Filter by date"
              />
            </div>

            {filteredMatches.length === 0 ? (
              <p className="tournament-empty-text">No matches scheduled yet</p>
            ) : (
              <div className="tournament-matches-list">
                {filteredMatches.map(match => (
                  <div key={match._id} className="tournament-match-card">
                    <div className="tournament-match-header">
                      <span className="tournament-match-date">
                        {new Date(match.scheduledTime).toLocaleDateString()}
                      </span>
                      <span className="tournament-match-status" style={{backgroundColor: getStatusColor(match.status)}}>
                        {match.status}
                      </span>
                    </div>
                    <div className="tournament-match-teams">
                      <div className="tournament-match-team">
                        <span className="tournament-team-name">{match.teamA?.name || 'Team A'}</span>
                        <span className="tournament-team-score">{match.finalScoreA || 0}</span>
                      </div>
                      <span className="tournament-match-vs">VS</span>
                      <div className="tournament-match-team">
                        <span className="tournament-team-score">{match.finalScoreB || 0}</span>
                        <span className="tournament-team-name">{match.teamB?.name || 'Team B'}</span>
                      </div>
                    </div>
                    {match.winner && (
                      <div className="tournament-match-winner">
                        Winner: {match.winner.name}
                      </div>
                    )}

                    {/* Man of the Match Display */}
                    {match.status === 'completed' && match.manOfTheMatch?.playerName && (
                      <div className="tournament-mom-section">
                        <div className="tournament-mom-header">⭐ Man of the Match</div>
                        <div className="tournament-mom-content">
                          {match.manOfTheMatch.photo && (
                            <img
                              src={getImageUrl(match.manOfTheMatch.photo)}
                              alt={match.manOfTheMatch.playerName}
                              className="tournament-mom-photo-small"
                            />
                          )}
                          <div className="tournament-mom-details">
                            <div className="tournament-mom-player-name">{match.manOfTheMatch.playerName}</div>
                            <div className="tournament-mom-team-name">
                              {match.manOfTheMatch.team?.name || 'N/A'}
                            </div>
                            <div className="tournament-mom-stats-row">
                              <span className="tournament-mom-stat">
                                ⚽ {match.manOfTheMatch.stats?.goals || 0} Goals
                              </span>
                              <span className="tournament-mom-stat">
                                🎯 {match.manOfTheMatch.stats?.assists || 0} Assists
                              </span>
                              <span className="tournament-mom-stat">
                                🛡️ {match.manOfTheMatch.stats?.saves || 0} Saves
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <div>
            <h2 className="tournament-detail-section-title">Registered Teams</h2>
            {tournament.registeredTeams?.length === 0 ? (
              <p className="tournament-empty-text">No teams registered yet</p>
            ) : (
              <div className="tournament-teams-grid">
                {tournament.registeredTeams.map(team => (
                  <div key={team._id} className="tournament-team-card">
                    <h3 className="tournament-team-card-name">{team.name}</h3>
                    <p className="tournament-team-card-location">
                      📍 {team.location?.city}, {team.location?.state}
                    </p>
                    <p className="tournament-team-card-type">
                      Type: {team.teamType || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AWARDS TAB */}
        {activeTab === 'awards' && (
          <div>
            {/* Player Awards Section */}
            {(tournament.awards?.bestForward || tournament.awards?.bestCenter || tournament.awards?.bestDefender || tournament.awards?.bestKeeper) && (
              <>
                <h2 className="tournament-detail-section-title">Player Awards (Role-Based)</h2>
                <div className="tournament-awards-grid">
                  {/* Best Forward */}
                  {tournament.awards.bestForward && (
                    <div className="tournament-award-card">
                      <div className="tournament-award-icon">⚡</div>
                      <h3 className="tournament-award-title">Best Forward</h3>
                      {tournament.awards.bestForward.photo ? (
                        <img
                          src={getImageUrl(tournament.awards.bestForward.photo)}
                          alt={tournament.awards.bestForward.playerName}
                          className="tournament-award-photo"
                        />
                      ) : (
                        <div className="tournament-award-photo-placeholder">
                          {tournament.awards.bestForward.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="tournament-award-player-name">{tournament.awards.bestForward.playerName}</div>
                      <div className="tournament-award-team-name">
                        {tournament.awards.bestForward.team?.name || 'N/A'}
                      </div>
                      <div className="tournament-award-stat">
                        Avg: {tournament.awards.bestForward.stats?.avgPerformance || 0} pts
                      </div>
                      <div className="tournament-award-matches">
                        {tournament.awards.bestForward.stats?.totalMatches || 0} matches
                      </div>
                    </div>
                  )}

                
                  {/* Best Striker */}
                  {tournament.awards.bestStriker && (
                    <div className="tournament-award-card">
                      <div className="tournament-award-icon">🎯</div>
                      <h3 className="tournament-award-title">Best Striker</h3>
                      {tournament.awards.bestStriker.photo ? (
                        <img
                          src={getImageUrl(tournament.awards.bestStriker.photo)}
                          alt={tournament.awards.bestStriker.playerName}
                          className="tournament-award-photo"
                        />
                      ) : (
                        <div className="tournament-award-photo-placeholder">
                          {tournament.awards.bestStriker.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="tournament-award-player-name">{tournament.awards.bestStriker.playerName}</div>
                      <div className="tournament-award-team-name">
                        {tournament.awards.bestStriker.team?.name || 'N/A'}
                      </div>
                      <div className="tournament-award-stat">
                        Avg: {tournament.awards.bestStriker.stats?.avgPerformance || 0} pts
                      </div>
                      <div className="tournament-award-matches">
                        {tournament.awards.bestStriker.stats?.totalMatches || 0} matches
                      </div>
                    </div>
                  )}

                  {/* Best Defender */}
                  {tournament.awards.bestDefender && (
                    <div className="tournament-award-card">
                      <div className="tournament-award-icon">🛡️</div>
                      <h3 className="tournament-award-title">Best Defender</h3>
                      {tournament.awards.bestDefender.photo ? (
                        <img
                          src={getImageUrl(tournament.awards.bestDefender.photo)}
                          alt={tournament.awards.bestDefender.playerName}
                          className="tournament-award-photo"
                        />
                      ) : (
                        <div className="tournament-award-photo-placeholder">
                          {tournament.awards.bestDefender.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="tournament-award-player-name">{tournament.awards.bestDefender.playerName}</div>
                      <div className="tournament-award-team-name">
                        {tournament.awards.bestDefender.team?.name || 'N/A'}
                      </div>
                      <div className="tournament-award-stat">
                        Avg: {tournament.awards.bestDefender.stats?.avgPerformance || 0} pts
                      </div>
                      <div className="tournament-award-matches">
                        {tournament.awards.bestDefender.stats?.totalMatches || 0} matches
                      </div>
                    </div>
                  )}

                  {/* Best Keeper */}
                  {tournament.awards.bestKeeper && (
                    <div className="tournament-award-card">
                      <div className="tournament-award-icon">🥅</div>
                      <h3 className="tournament-award-title">Best Keeper</h3>
                      {tournament.awards.bestKeeper.photo ? (
                        <img
                          src={getImageUrl(tournament.awards.bestKeeper.photo)}
                          alt={tournament.awards.bestKeeper.playerName}
                          className="tournament-award-photo"
                        />
                      ) : (
                        <div className="tournament-award-photo-placeholder">
                          {tournament.awards.bestKeeper.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="tournament-award-player-name">{tournament.awards.bestKeeper.playerName}</div>
                      <div className="tournament-award-team-name">
                        {tournament.awards.bestKeeper.team?.name || 'N/A'}
                      </div>
                      <div className="tournament-award-stat">
                        Avg: {tournament.awards.bestKeeper.stats?.avgPerformance || 0} pts
                      </div>
                      <div className="tournament-award-matches">
                        {tournament.awards.bestKeeper.stats?.totalMatches || 0} matches
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <h2 className="tournament-detail-section-title">Prize Pool</h2>
            {tournament.prizePool?.totalAmount > 0 ? (
              <div>
                <div className="tournament-total-prize">
                  <span className="tournament-total-prize-label">Total Prize Pool</span>
                  <span className="tournament-total-prize-amount">
                    {tournament.prizePool.currency} {tournament.prizePool.totalAmount.toLocaleString()}
                  </span>
                </div>

                {tournament.prizePool.prizes?.length > 0 && (
                  <div className="tournament-prizes-grid">
                    {tournament.prizePool.prizes.map((prize, index) => (
                      <div key={index} className="tournament-prize-card">
                        <div className="tournament-prize-position">{prize.position}</div>
                        <div className="tournament-prize-amount">
                          {tournament.prizePool.currency} {prize.amount?.toLocaleString() || '0'}
                        </div>
                        {prize.description && (
                          <div className="tournament-prize-description">{prize.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="tournament-empty-text">Prize pool information not available</p>
            )}

            {/* Organizer Info */}
            {tournament.organizer?.name && (
              <div className="tournament-organizer-section">
                <h2 className="tournament-detail-section-title">Organized By</h2>
                <div className="tournament-organizer-card">
                  <h3 className="tournament-organizer-name">{tournament.organizer.name}</h3>
                  {tournament.organizer.email && (
                    <p className="tournament-organizer-contact">📧 {tournament.organizer.email}</p>
                  )}
                  {tournament.organizer.phone && (
                    <p className="tournament-organizer-contact">📞 {tournament.organizer.phone}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div>
            <h2 className="tournament-detail-section-title">Photo Gallery</h2>
            {tournament.media?.gallery?.length === 0 || !tournament.media?.gallery ? (
              <p className="tournament-empty-text">No photos available yet</p>
            ) : (
              <div className="tournament-gallery-grid">
                {tournament.media.gallery.map((image, index) => (
                  <div key={index} className="tournament-gallery-item">
                    <img
                      src={getImageUrl(image)}
                      alt={`Gallery ${index + 1}`}
                      className="tournament-gallery-image"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB - DISABLED (NOT WORKING YET) */}
        {false && activeTab === 'reports' && (
          <div>
            <h2 className="tournament-detail-section-title">📊 Performance Reports</h2>

            {!selectedMatchForReports ? (
              // Match Selection
              <div>
                <p className="tournament-reports-description">Select a match to view performance reports</p>
                {matches.filter(m => m.status === 'completed').length === 0 ? (
                  <p className="tournament-empty-text">No completed matches available</p>
                ) : (
                  <div className="tournament-matches-list">
                    {matches.filter(m => m.status === 'completed').map(match => (
                      <div
                        key={match._id}
                        className="tournament-match-card"
                        onClick={() => handleSelectMatchForReports(match)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="tournament-match-header">
                          <span className="tournament-match-number">Match {match.matchNumber}</span>
                          <span className="tournament-match-date">
                            {new Date(match.scheduledTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="tournament-match-teams-row">
                          <div className="tournament-match-team">
                            <span className="tournament-team-name">{match.teamA?.name || 'Team A'}</span>
                            <span className="tournament-team-score">{match.finalScoreA || 0}</span>
                          </div>
                          <span className="tournament-match-vs">VS</span>
                          <div className="tournament-match-team">
                            <span className="tournament-team-score">{match.finalScoreB || 0}</span>
                            <span className="tournament-team-name">{match.teamB?.name || 'Team B'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : !selectedRoundForReports ? (
              // Round Selection
              <div>
                <button className="tournament-back-button" onClick={goBackToMatchSelection}>
                  ← Back to Matches
                </button>
                <h3 className="tournament-subsection-title">
                  Match {selectedMatchForReports.matchNumber}: {selectedMatchForReports.teamA?.name} vs {selectedMatchForReports.teamB?.name}
                </h3>
                <p className="tournament-reports-description">Select a round to view performance analysis</p>
                <div className="tournament-rounds-grid">
                  {selectedMatchForReports.rounds?.filter(r => r.status === 'completed').map(round => (
                    <div
                      key={round.roundNumber}
                      className="tournament-round-card"
                      onClick={() => handleSelectRoundForReports(round)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h4>Round {round.roundNumber}</h4>
                      <div className="tournament-round-scores">
                        <div>Team A: {round.teamAScore || 0}</div>
                        <div>Team B: {round.teamBScore || 0}</div>
                      </div>
                      <div className="tournament-round-status">Click to view reports →</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Round Reports Display
              <div>
                <button className="tournament-back-button" onClick={goBackToRoundSelection}>
                  ← Back to Rounds
                </button>
                <h3 className="tournament-subsection-title">
                  Round {selectedRoundForReports.roundNumber} - Performance Reports
                </h3>

                {reportsLoading ? (
                  <p className="tournament-loading">Loading reports...</p>
                ) : !roundAnalysisData ? (
                  <p className="tournament-empty-text">No analysis data available for this round</p>
                ) : (
                  <>
                    {/* Team Stats */}
                    <div className="tournament-team-stats-grid">
                      <div className="tournament-team-stat-card">
                        <div className="tournament-team-stat-name">{selectedMatchForReports.teamA?.name || 'Team A'}</div>
                        <div className="tournament-team-stat-score">{roundAnalysisData.teamAScore?.toFixed(2) || 0}</div>
                        <div className="tournament-team-stat-drones">{roundAnalysisData.teamAReports?.length || 0} Drones</div>
                      </div>
                      <div className="tournament-team-stat-card">
                        <div className="tournament-team-stat-name">{selectedMatchForReports.teamB?.name || 'Team B'}</div>
                        <div className="tournament-team-stat-score">{roundAnalysisData.teamBScore?.toFixed(2) || 0}</div>
                        <div className="tournament-team-stat-drones">{roundAnalysisData.teamBReports?.length || 0} Drones</div>
                      </div>
                    </div>

                    {/* Team A Reports */}
                    <h4 className="tournament-team-reports-title">
                      {selectedMatchForReports.teamA?.name || 'Team A'} Drones
                    </h4>
                    {!roundAnalysisData.teamAReports || roundAnalysisData.teamAReports.length === 0 ? (
                      <p className="tournament-empty-text">No reports found for Team A</p>
                    ) : (
                      <div className="tournament-reports-grid">
                        {roundAnalysisData.teamAReports.map(report => (
                          <div key={report._id} className="tournament-drone-report-card">
                            <div className="tournament-drone-header">
                              <span className={`tournament-drone-id ${report.droneId?.startsWith('R') ? 'red' : 'blue'}`}>
                                {report.droneId}
                              </span>
                              <span className="tournament-role-badge">{report.role}</span>
                            </div>
                            {report.performance && report.performance.overallScore > 0 ? (
                              <>
                                <div className="tournament-drone-score">
                                  <div className="tournament-score-value">{report.performance.overallScore.toFixed(2)}</div>
                                  <div className="tournament-score-label">out of 100</div>
                                </div>
                                <div className="tournament-performance-bars">
                                  <div className="tournament-perf-bar">
                                    <label>Overall</label>
                                    <div className="tournament-bar-container">
                                      <div
                                        className="tournament-bar-fill"
                                        style={{
                                          width: `${report.performance.overallScore}%`,
                                          backgroundColor: getScoreColor(report.performance.overallScore)
                                        }}
                                      />
                                      <span className="tournament-bar-value">{report.performance.overallScore.toFixed(0)}</span>
                                    </div>
                                  </div>
                                  <div className="tournament-perf-bar">
                                    <label>Aggression</label>
                                    <div className="tournament-bar-container">
                                      <div
                                        className="tournament-bar-fill"
                                        style={{
                                          width: `${report.performance.aggression}%`,
                                          backgroundColor: getScoreColor(report.performance.aggression)
                                        }}
                                      />
                                      <span className="tournament-bar-value">{report.performance.aggression.toFixed(0)}</span>
                                    </div>
                                  </div>
                                  <div className="tournament-perf-bar">
                                    <label>Defense</label>
                                    <div className="tournament-bar-container">
                                      <div
                                        className="tournament-bar-fill"
                                        style={{
                                          width: `${report.performance.defense}%`,
                                          backgroundColor: getScoreColor(report.performance.defense)
                                        }}
                                      />
                                      <span className="tournament-bar-value">{report.performance.defense.toFixed(0)}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="tournament-drone-offline">OFFLINE</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Team B Reports */}
                    <h4 className="tournament-team-reports-title">
                      {selectedMatchForReports.teamB?.name || 'Team B'} Drones
                    </h4>
                    {!roundAnalysisData.teamBReports || roundAnalysisData.teamBReports.length === 0 ? (
                      <p className="tournament-empty-text">No reports found for Team B</p>
                    ) : (
                      <div className="tournament-reports-grid">
                        {roundAnalysisData.teamBReports.map(report => (
                          <div key={report._id} className="tournament-drone-report-card">
                            <div className="tournament-drone-header">
                              <span className={`tournament-drone-id ${report.droneId?.startsWith('R') ? 'red' : 'blue'}`}>
                                {report.droneId}
                              </span>
                              <span className="tournament-role-badge">{report.role}</span>
                            </div>
                            {report.performance && report.performance.overallScore > 0 ? (
                              <>
                                <div className="tournament-drone-score">
                                  <div className="tournament-score-value">{report.performance.overallScore.toFixed(2)}</div>
                                  <div className="tournament-score-label">out of 100</div>
                                </div>
                                <div className="tournament-performance-bars">
                                  <div className="tournament-perf-bar">
                                    <label>Overall</label>
                                    <div className="tournament-bar-container">
                                      <div
                                        className="tournament-bar-fill"
                                        style={{
                                          width: `${report.performance.overallScore}%`,
                                          backgroundColor: getScoreColor(report.performance.overallScore)
                                        }}
                                      />
                                      <span className="tournament-bar-value">{report.performance.overallScore.toFixed(0)}</span>
                                    </div>
                                  </div>
                                  <div className="tournament-perf-bar">
                                    <label>Aggression</label>
                                    <div className="tournament-bar-container">
                                      <div
                                        className="tournament-bar-fill"
                                        style={{
                                          width: `${report.performance.aggression}%`,
                                          backgroundColor: getScoreColor(report.performance.aggression)
                                        }}
                                      />
                                      <span className="tournament-bar-value">{report.performance.aggression.toFixed(0)}</span>
                                    </div>
                                  </div>
                                  <div className="tournament-perf-bar">
                                    <label>Defense</label>
                                    <div className="tournament-bar-container">
                                      <div
                                        className="tournament-bar-fill"
                                        style={{
                                          width: `${report.performance.defense}%`,
                                          backgroundColor: getScoreColor(report.performance.defense)
                                        }}
                                      />
                                      <span className="tournament-bar-value">{report.performance.defense.toFixed(0)}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="tournament-drone-offline">OFFLINE</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>





      {/* Team Detail Modal */}
      {showTeamModal && selectedTeam && (
        <div className="tournament-team-modal-overlay" onClick={handleCloseTeamModal}>
          <div className="tournament-team-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="tournament-team-modal-close-button" onClick={handleCloseTeamModal}>
              ×
            </button>

            <h2 className="tournament-team-modal-title">{selectedTeam.name}</h2>

            <div className="tournament-team-modal-info">
              <div className="tournament-team-info-row">
                <span className="tournament-team-info-label">Location:</span>
                <span className="tournament-team-info-value">
                  {selectedTeam.location?.city}, {selectedTeam.location?.state || selectedTeam.location?.country}
                </span>
              </div>
              <div className="tournament-team-info-row">
                <span className="tournament-team-info-label">Type:</span>
                <span className="tournament-team-info-value">{selectedTeam.teamType || 'N/A'}</span>
              </div>
              {selectedTeam.captain && (
                <div className="tournament-team-info-row">
                  <span className="tournament-team-info-label">Captain:</span>
                  <span className="tournament-team-info-value">{selectedTeam.captain}</span>
                </div>
              )}
            </div>

            <h3 className="tournament-members-title">Team Members</h3>
            {selectedTeam.members && selectedTeam.members.length > 0 ? (
              <div className="tournament-members-grid">
                {selectedTeam.members.map((member, index) => (
                  <div key={index} className="tournament-member-card">
                    {member.photo ? (
                      <img
                        src={getImageUrl(member.photo)}
                        alt={member.name}
                        className="tournament-member-photo"
                      />
                    ) : (
                      <div className="tournament-member-photo-placeholder">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="tournament-member-name">{member.name}</div>
                    <div className="tournament-member-role">{member.role}</div>
                    {member.jerseyNumber && (
                      <div className="tournament-member-jersey">#{member.jerseyNumber}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="tournament-empty-text">No team members available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  switch(status) {
    case 'completed': return '#4CAF50';
    case 'in_progress': return '#FF9800';
    case 'scheduled': return '#2196F3';
    default: return '#666';
  }
};


export default TournamentDetail;
