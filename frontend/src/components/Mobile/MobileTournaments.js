import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTournaments } from '../../services/api';
import { mobileTheme } from '../../theme/mobileTheme';
import './MobileTournaments.css';

const MobileTournaments = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, ongoing, completed

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await getAllTournaments();
      if (response.data) {
        setTournaments(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'Upcoming', color: '#3b82f6', icon: '📅' },
      ongoing: { text: 'Live', color: '#ef4444', icon: '🔴' },
      completed: { text: 'Completed', color: '#10b981', icon: '✅' },
    };
    return badges[status] || badges.upcoming;
  };

  const getFilteredTournaments = () => {
    if (filter === 'all') return tournaments;
    return tournaments.filter(t => t.status === filter);
  };

  const formatDate = (date) => {
    if (!date) return 'TBD';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDateRange = (start, end) => {
    const startDate = formatDate(start);
    const endDate = formatDate(end);
    if (startDate === endDate || !end) return startDate;
    return `${startDate} - ${endDate}`;
  };

  const handleTournamentClick = (tournamentId) => {
    navigate(`/tournament/${tournamentId}`);
  };

  if (loading) {
    return (
      <div className="mobile-tournaments">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tournaments...</p>
        </div>
      </div>
    );
  }

  const filteredTournaments = getFilteredTournaments();

  return (
    <div className="mobile-tournaments">
      {/* Header */}
      <div className="tournaments-header">
        <h1 className="page-title">Tournaments</h1>
        <p className="page-subtitle">Compete in Arena Combat</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({tournaments.length})
        </button>
        <button
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming ({tournaments.filter(t => t.status === 'upcoming').length})
        </button>
        <button
          className={`filter-tab ${filter === 'ongoing' ? 'active' : ''}`}
          onClick={() => setFilter('ongoing')}
        >
          Live ({tournaments.filter(t => t.status === 'ongoing').length})
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Past ({tournaments.filter(t => t.status === 'completed').length})
        </button>
      </div>

      {/* Tournaments List */}
      <div className="tournaments-list">
        {filteredTournaments.length === 0 ? (
          <div className="no-tournaments">
            <div className="no-tournaments-icon">🏆</div>
            <h3 className="no-tournaments-title">No Tournaments Found</h3>
            <p className="no-tournaments-text">
              {filter === 'all'
                ? 'No tournaments available at the moment'
                : `No ${filter} tournaments`}
            </p>
          </div>
        ) : (
          filteredTournaments.map((tournament) => {
            const badge = getStatusBadge(tournament.status);

            return (
              <div
                key={tournament._id}
                className="tournament-card"
                onClick={() => handleTournamentClick(tournament._id)}
              >
                {/* Banner Image */}
                {tournament.banner ? (
                  <div className="tournament-banner">
                    <img src={tournament.banner} alt={tournament.name} />
                    <div className="banner-overlay"></div>
                  </div>
                ) : (
                  <div className="tournament-banner-placeholder">
                    <div className="placeholder-icon">🏆</div>
                  </div>
                )}

                {/* Status Badge */}
                <div
                  className="tournament-status-badge"
                  style={{ backgroundColor: badge.color }}
                >
                  <span className="status-icon">{badge.icon}</span>
                  {badge.text}
                </div>

                {/* Content */}
                <div className="tournament-content">
                  <h3 className="tournament-name">{tournament.name}</h3>

                  {tournament.description && (
                    <p className="tournament-description">
                      {tournament.description.length > 100
                        ? `${tournament.description.substring(0, 100)}...`
                        : tournament.description}
                    </p>
                  )}

                  {/* Info Grid */}
                  <div className="tournament-info-grid">
                    {/* Date */}
                    <div className="info-item">
                      <span className="info-icon">📅</span>
                      <div className="info-content">
                        <div className="info-label">Date</div>
                        <div className="info-value">
                          {getDateRange(tournament.startDate, tournament.endDate)}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    {tournament.location && (
                      <div className="info-item">
                        <span className="info-icon">📍</span>
                        <div className="info-content">
                          <div className="info-label">Location</div>
                          <div className="info-value">
                            {tournament.location.city}, {tournament.location.state}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Teams */}
                    <div className="info-item">
                      <span className="info-icon">👥</span>
                      <div className="info-content">
                        <div className="info-label">Teams</div>
                        <div className="info-value">
                          {tournament.currentTeams || 0} / {tournament.maxTeams || 16}
                        </div>
                      </div>
                    </div>

                    {/* Prize Pool */}
                    {tournament.awards?.winner?.prize && (
                      <div className="info-item">
                        <span className="info-icon">💰</span>
                        <div className="info-content">
                          <div className="info-label">Prize Pool</div>
                          <div className="info-value">
                            {tournament.awards.winner.prize}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar (for ongoing tournaments) */}
                  {tournament.status === 'ongoing' && (
                    <div className="tournament-progress">
                      <div className="progress-header">
                        <span className="progress-label">Progress</span>
                        <span className="progress-percentage">65%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: '65%' }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Teams Display (for ongoing/completed) */}
                  {tournament.registeredTeams && tournament.registeredTeams.length > 0 && (
                    <div className="tournament-teams">
                      <div className="teams-label">Registered Teams:</div>
                      <div className="teams-avatars">
                        {tournament.registeredTeams.slice(0, 5).map((team, idx) => (
                          <div
                            key={idx}
                            className="team-avatar"
                            style={{ backgroundColor: team.color || '#64748b' }}
                            title={team.name}
                          >
                            {team.name ? team.name.substring(0, 2).toUpperCase() : '??'}
                          </div>
                        ))}
                        {tournament.registeredTeams.length > 5 && (
                          <div className="team-avatar more">
                            +{tournament.registeredTeams.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button className="tournament-action-btn">
                    {tournament.status === 'upcoming' && 'View Details'}
                    {tournament.status === 'ongoing' && 'Watch Live'}
                    {tournament.status === 'completed' && 'View Results'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats Footer */}
      {filteredTournaments.length > 0 && (
        <div className="tournaments-stats">
          <div className="stats-item">
            <div className="stats-icon">🏆</div>
            <div className="stats-content">
              <div className="stats-value">{tournaments.length}</div>
              <div className="stats-label">Total Tournaments</div>
            </div>
          </div>
          <div className="stats-item">
            <div className="stats-icon">👥</div>
            <div className="stats-content">
              <div className="stats-value">
                {tournaments.reduce((sum, t) => sum + (t.currentTeams || 0), 0)}
              </div>
              <div className="stats-label">Total Teams</div>
            </div>
          </div>
          <div className="stats-item">
            <div className="stats-icon">⚔️</div>
            <div className="stats-content">
              <div className="stats-value">
                {tournaments.reduce((sum, t) => sum + (t.totalMatches || 0), 0)}
              </div>
              <div className="stats-label">Total Matches</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTournaments;
