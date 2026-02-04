import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentById, getMatches } from '../../services/api';
import './PublicMobileTournamentDetail.css';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${BACKEND_URL}${path}`;
};

const PublicMobileTournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('');
  const [showMoreTabs, setShowMoreTabs] = useState(false);

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

  const formatDate = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredMatches = dateFilter
    ? matches.filter(m => {
        const matchDate = new Date(m.scheduledTime).toISOString().split('T')[0];
        return matchDate === dateFilter;
      })
    : matches;

  if (loading) {
    return (
      <div className="tour-detail-container">
        <div className="tour-detail-loading">
          <div className="tour-detail-spinner" />
          <p>Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tour-detail-container">
        <div className="tour-detail-error">Tournament not found</div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (tournament.status === 'ongoing') return { text: 'Live', className: 'live' };
    if (tournament.status === 'completed') return { text: 'Completed', className: 'completed' };
    return { text: 'Upcoming', className: 'upcoming' };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="tour-detail-container">
      {/* Header */}
      <div className="tour-detail-header">
        <button className="tour-detail-back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
      </div>

      {/* Cover - Tournament Showcase Style */}
      <div className="tour-detail-cover-wrapper">
        {/* Gradient Backdrop with Tournament Name */}
        <div className="tour-detail-cover-bg">
          <h1 className="tour-detail-banner-title">{tournament.name}</h1>
          <div className="tour-detail-banner-meta">
            <span>{tournament.location?.city}, {tournament.location?.state}</span>
            <span className="tour-detail-banner-dot">•</span>
            <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
          </div>
        </div>

        {/* MOT Photo / Tournament Logo */}
        <div className="tour-detail-cover-logo">
          {tournament.manOfTheTournament?.photo ? (
            <img
              src={getImageUrl(tournament.manOfTheTournament.photo)}
              alt={tournament.manOfTheTournament.playerName}
              className="tour-detail-logo-img"
            />
          ) : tournament.media?.logoImage ? (
            <img
              src={getImageUrl(tournament.media.logoImage)}
              alt={tournament.name}
              className="tour-detail-logo-img"
            />
          ) : (
            <div className="tour-detail-logo-placeholder">
              {tournament.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info Below Photo */}
        <div className="tour-detail-cover-info">
          {/* Show MOT name if available */}
          {tournament.manOfTheTournament?.playerName ? (
            <>
              <p className="tour-detail-mot-label">Man of the Tournament</p>
              <h2 className="tour-detail-mot-name">{tournament.manOfTheTournament.playerName}</h2>
              {tournament.manOfTheTournament.teamName && (
                <p className="tour-detail-mot-team">{tournament.manOfTheTournament.teamName}</p>
              )}
            </>
          ) : (
            <p className="tour-detail-subtitle">Tournament Showcase</p>
          )}

          <div className={`tour-detail-status-badge ${statusBadge.className}`}>
            {tournament.status === 'ongoing' && <span className="tour-detail-live-dot" />}
            {statusBadge.text}
          </div>

          {tournament.description && (
            <p className="tour-detail-description">{tournament.description}</p>
          )}
        </div>
      </div>

      {/* Tabs with Filter Icon */}
      <div className="tour-detail-tabs">
        <div className="tour-detail-tabs-row">
          <div className="tour-detail-tabs-scroll">
            <button
              className={`tour-detail-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tour-detail-tab ${activeTab === 'matches' ? 'active' : ''}`}
              onClick={() => setActiveTab('matches')}
            >
              Matches
            </button>
            <button
              className={`tour-detail-tab ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              Teams
            </button>
            <button
              className={`tour-detail-tab ${activeTab === 'awards' ? 'active' : ''}`}
              onClick={() => setActiveTab('awards')}
            >
              Awards
            </button>
            <button
              className={`tour-detail-tab ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              Gallery
            </button>
          </div>

          {/* More Tabs Dropdown Button */}
          <button
            className="tour-detail-more-btn"
            onClick={() => setShowMoreTabs(!showMoreTabs)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* Dropdown Menu - Only hidden tabs */}
        {showMoreTabs && (
          <div className="tour-detail-tabs-dropdown">
            <button
              className={`tour-detail-dropdown-item ${activeTab === 'awards' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('awards');
                setShowMoreTabs(false);
              }}
            >
              Awards
            </button>
            <button
              className={`tour-detail-dropdown-item ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('gallery');
                setShowMoreTabs(false);
              }}
            >
              Gallery
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="tour-detail-content">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* Quick Stats */}
            <div className="tour-quick-stats">
              <div className="tour-stat-card">
                <div className="tour-stat-value">{tournament.currentTeams || 0}/{tournament.maxTeams}</div>
                <div className="tour-stat-label">Teams</div>
              </div>
              <div className="tour-stat-card">
                <div className="tour-stat-value">{tournament.settings?.teamFormat || '4v4'}</div>
                <div className="tour-stat-label">Format</div>
              </div>
              <div className="tour-stat-card">
                <div className="tour-stat-value">{tournament.settings?.roundDuration || 3}m</div>
                <div className="tour-stat-label">Round</div>
              </div>
              <div className="tour-stat-card">
                <div className="tour-stat-value">
                  {tournament.prizePool?.totalAmount > 0
                    ? `₹${(tournament.prizePool.totalAmount / 1000).toFixed(0)}K`
                    : 'TBD'}
                </div>
                <div className="tour-stat-label">Prize</div>
              </div>
            </div>

            {/* Champions */}
            {(tournament.winners?.champion || tournament.winners?.runnerUp || tournament.winners?.thirdPlace) && (
              <>
                <h2 className="tour-section-title">Champions</h2>
                <div className="tour-winners-list">
                  {tournament.winners.champion && (
                    <div className="tour-winner-card">
                      <div className="tour-winner-medal gold">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                          <path d="M4 22h16"/>
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                        </svg>
                      </div>
                      <div className="tour-winner-info">
                        <div className="tour-winner-label">Champion</div>
                        <div className="tour-winner-name">{tournament.winners.champion.name}</div>
                      </div>
                    </div>
                  )}
                  {tournament.winners.runnerUp && (
                    <div className="tour-winner-card">
                      <div className="tour-winner-medal silver">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                          <path d="M4 22h16"/>
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                        </svg>
                      </div>
                      <div className="tour-winner-info">
                        <div className="tour-winner-label">Runner Up</div>
                        <div className="tour-winner-name">{tournament.winners.runnerUp.name}</div>
                      </div>
                    </div>
                  )}
                  {tournament.winners.thirdPlace && (
                    <div className="tour-winner-card">
                      <div className="tour-winner-medal bronze">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                          <path d="M4 22h16"/>
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                        </svg>
                      </div>
                      <div className="tour-winner-info">
                        <div className="tour-winner-label">3rd Place</div>
                        <div className="tour-winner-name">{tournament.winners.thirdPlace.name}</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Man of the Tournament */}
            {tournament.manOfTheTournament?.playerName && (
              <>
                <h2 className="tour-section-title">Man of the Tournament</h2>
                <div className="tour-mot-card">
                  {tournament.manOfTheTournament.photo ? (
                    <img
                      src={getImageUrl(tournament.manOfTheTournament.photo)}
                      alt={tournament.manOfTheTournament.playerName}
                      className="tour-mot-photo"
                    />
                  ) : (
                    <div className="tour-mot-photo-placeholder">
                      {tournament.manOfTheTournament.playerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="tour-mot-info">
                    <div className="tour-mot-name">{tournament.manOfTheTournament.playerName}</div>
                    <div className="tour-mot-team">{tournament.manOfTheTournament.team?.name || 'N/A'}</div>
                    <div className="tour-mot-stats">
                      <span>{tournament.manOfTheTournament.stats?.avgPerformance || 0} Avg</span>
                      <span>•</span>
                      <span>{tournament.manOfTheTournament.stats?.totalMatches || 0} Matches</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Venue & Details */}
            <h2 className="tour-section-title">Venue & Details</h2>
            <div className="tour-info-card">
              <div className="tour-info-row">
                <span className="tour-info-label">Venue</span>
                <span className="tour-info-value">{tournament.location?.venue || 'TBD'}</span>
              </div>
              <div className="tour-info-row">
                <span className="tour-info-label">Location</span>
                <span className="tour-info-value">
                  {tournament.location?.city}, {tournament.location?.state}
                </span>
              </div>
              <div className="tour-info-row">
                <span className="tour-info-label">Match Type</span>
                <span className="tour-info-value">{tournament.settings?.matchType || 'Best of 2'}</span>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div>
            <div className="tour-filter-row">
              <h2 className="tour-section-title">All Matches ({matches.length})</h2>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="tour-date-filter"
              />
            </div>

            {filteredMatches.length === 0 ? (
              <div className="tour-empty-state">
                <p>No matches available</p>
              </div>
            ) : (
              <div className="tour-matches-list">
                {filteredMatches.map(match => (
                  <div key={match._id} className="tour-match-card">
                    <div className="tour-match-header">
                      <span className="tour-match-date">{formatDate(match.scheduledTime)}</span>
                      <span className={`tour-match-status ${match.status}`}>
                        {match.status}
                      </span>
                    </div>
                    <div className="tour-match-teams">
                      <div className="tour-match-team">
                        <span className="tour-match-team-name">{match.teamA?.name || 'Team A'}</span>
                        <span className="tour-match-score">{match.finalScoreA || 0}</span>
                      </div>
                      <span className="tour-match-vs">VS</span>
                      <div className="tour-match-team">
                        <span className="tour-match-score">{match.finalScoreB || 0}</span>
                        <span className="tour-match-team-name">{match.teamB?.name || 'Team B'}</span>
                      </div>
                    </div>
                    {match.winner && (
                      <div className="tour-match-winner">Winner: {match.winner.name}</div>
                    )}

                    {/* Man of the Match */}
                    {match.status === 'completed' && match.manOfTheMatch?.playerName && (
                      <div className="tour-mom-section">
                        <div className="tour-mom-header">Man of the Match</div>
                        <div className="tour-mom-content">
                          {match.manOfTheMatch.photo ? (
                            <img
                              src={getImageUrl(match.manOfTheMatch.photo)}
                              alt={match.manOfTheMatch.playerName}
                              className="tour-mom-photo"
                            />
                          ) : (
                            <div className="tour-mom-photo-placeholder">
                              {match.manOfTheMatch.playerName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="tour-mom-info">
                            <div className="tour-mom-name">{match.manOfTheMatch.playerName}</div>
                            <div className="tour-mom-team">{match.manOfTheMatch.team?.name || 'N/A'}</div>
                            <div className="tour-mom-stats">
                              <span>{match.manOfTheMatch.stats?.goals || 0} Goals</span>
                              <span>•</span>
                              <span>{match.manOfTheMatch.stats?.assists || 0} Assists</span>
                              <span>•</span>
                              <span>{match.manOfTheMatch.stats?.saves || 0} Saves</span>
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
            <h2 className="tour-section-title">Registered Teams ({tournament.registeredTeams?.length || 0})</h2>
            {tournament.registeredTeams?.length === 0 ? (
              <div className="tour-empty-state">
                <p>No teams registered yet</p>
              </div>
            ) : (
              <div className="tour-teams-list">
                {tournament.registeredTeams.map(team => (
                  <div key={team._id} className="tour-team-card">
                    <div className="tour-team-name">{team.name}</div>
                    <div className="tour-team-location">
                      {team.location?.city}, {team.location?.state}
                    </div>
                    <div className="tour-team-type">Type: {team.teamType || 'N/A'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AWARDS TAB */}
        {activeTab === 'awards' && (
          <div>
            {/* Player Awards */}
            {(tournament.awards?.bestForward || tournament.awards?.bestStriker ||
              tournament.awards?.bestDefender || tournament.awards?.bestKeeper) && (
              <>
                <h2 className="tour-section-title">Player Awards</h2>
                <div className="tour-awards-grid">
                  {tournament.awards.bestForward && (
                    <div className="tour-award-card">
                      <div className="tour-award-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                      </div>
                      {tournament.awards.bestForward.photo ? (
                        <img
                          src={getImageUrl(tournament.awards.bestForward.photo)}
                          alt={tournament.awards.bestForward.playerName}
                          className="tour-award-photo"
                        />
                      ) : (
                        <div className="tour-award-photo-placeholder">
                          {tournament.awards.bestForward.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="tour-award-title">Best Forward</div>
                      <div className="tour-award-name">{tournament.awards.bestForward.playerName}</div>
                      <div className="tour-award-team">{tournament.awards.bestForward.team?.name || 'N/A'}</div>
                      <div className="tour-award-stat">
                        {tournament.awards.bestForward.stats?.avgPerformance || 0} pts
                      </div>
                    </div>
                  )}

                  {tournament.awards.bestStriker && (
                    <div className="tour-award-card">
                      <div className="tour-award-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <circle cx="12" cy="12" r="6"/>
                          <circle cx="12" cy="12" r="2"/>
                        </svg>
                      </div>
                      {tournament.awards.bestStriker.photo ? (
                        <img
                          src={getImageUrl(tournament.awards.bestStriker.photo)}
                          alt={tournament.awards.bestStriker.playerName}
                          className="tour-award-photo"
                        />
                      ) : (
                        <div className="tour-award-photo-placeholder">
                          {tournament.awards.bestStriker.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="tour-award-title">Best Striker</div>
                      <div className="tour-award-name">{tournament.awards.bestStriker.playerName}</div>
                      <div className="tour-award-team">{tournament.awards.bestStriker.team?.name || 'N/A'}</div>
                      <div className="tour-award-stat">
                        {tournament.awards.bestStriker.stats?.avgPerformance || 0} pts
                      </div>
                    </div>
                  )}

                  {tournament.awards.bestDefender && (
                    <div className="tour-award-card">
                      <div className="tour-award-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                      </div>
                      {tournament.awards.bestDefender.photo ? (
                        <img
                          src={getImageUrl(tournament.awards.bestDefender.photo)}
                          alt={tournament.awards.bestDefender.playerName}
                          className="tour-award-photo"
                        />
                      ) : (
                        <div className="tour-award-photo-placeholder">
                          {tournament.awards.bestDefender.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="tour-award-title">Best Defender</div>
                      <div className="tour-award-name">{tournament.awards.bestDefender.playerName}</div>
                      <div className="tour-award-team">{tournament.awards.bestDefender.team?.name || 'N/A'}</div>
                      <div className="tour-award-stat">
                        {tournament.awards.bestDefender.stats?.avgPerformance || 0} pts
                      </div>
                    </div>
                  )}

                  {tournament.awards.bestKeeper && (
                    <div className="tour-award-card">
                      <div className="tour-award-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      {tournament.awards.bestKeeper.photo ? (
                        <img
                          src={getImageUrl(tournament.awards.bestKeeper.photo)}
                          alt={tournament.awards.bestKeeper.playerName}
                          className="tour-award-photo"
                        />
                      ) : (
                        <div className="tour-award-photo-placeholder">
                          {tournament.awards.bestKeeper.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="tour-award-title">Best Keeper</div>
                      <div className="tour-award-name">{tournament.awards.bestKeeper.playerName}</div>
                      <div className="tour-award-team">{tournament.awards.bestKeeper.team?.name || 'N/A'}</div>
                      <div className="tour-award-stat">
                        {tournament.awards.bestKeeper.stats?.avgPerformance || 0} pts
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Prize Pool */}
            <h2 className="tour-section-title">Prize Pool</h2>
            {tournament.prizePool?.totalAmount > 0 ? (
              <div className="tour-prize-section">
                <div className="tour-total-prize">
                  Total: {tournament.prizePool.currency} {tournament.prizePool.totalAmount.toLocaleString()}
                </div>
                {tournament.prizePool.prizes?.length > 0 && (
                  <div className="tour-prizes-list">
                    {tournament.prizePool.prizes.map((prize, index) => (
                      <div key={index} className="tour-prize-row">
                        <span className="tour-prize-position">{prize.position}</span>
                        <span className="tour-prize-amount">
                          {tournament.prizePool.currency} {prize.amount?.toLocaleString() || '0'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="tour-empty-state">
                <p>Prize pool information not available</p>
              </div>
            )}

            {/* Organizer */}
            {tournament.organizer?.name && (
              <>
                <h2 className="tour-section-title">Organized By</h2>
                <div className="tour-organizer-card">
                  <div className="tour-organizer-name">{tournament.organizer.name}</div>
                  {tournament.organizer.email && (
                    <div className="tour-organizer-contact">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2"/>
                        <path d="m2 7 8.97 5.7a1.94 1.94 0 0 0 2.06 0L22 7"/>
                      </svg>
                      {tournament.organizer.email}
                    </div>
                  )}
                  {tournament.organizer.phone && (
                    <div className="tour-organizer-contact">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      {tournament.organizer.phone}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div>
            <h2 className="tour-section-title">Photo Gallery ({tournament.media?.gallery?.length || 0})</h2>
            {tournament.media?.gallery?.length === 0 || !tournament.media?.gallery ? (
              <div className="tour-empty-state">
                <p>No photos available yet</p>
              </div>
            ) : (
              <div className="tour-gallery-grid">
                {tournament.media.gallery.map((image, index) => (
                  <div key={index} className="tour-gallery-item">
                    <img
                      src={getImageUrl(image)}
                      alt={`Gallery ${index + 1}`}
                      className="tour-gallery-image"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMobileTournamentDetail;
