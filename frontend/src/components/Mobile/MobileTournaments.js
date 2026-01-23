import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournaments } from '../../services/api';
import {
  TrophyIcon,
  CalendarIcon,
  LocationIcon,
  UsersIcon,
  PrizeIcon,
  SwordsIcon,
  CheckCircleIcon,
  EyeIcon,
  XIcon,
} from './icons';
import './MobileTournaments.css';

const MobileTournaments = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await getTournaments();
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
      upcoming: { text: 'Upcoming', className: 'upcoming' },
      ongoing: { text: 'Live', className: 'live' },
      completed: { text: 'Completed', className: 'completed' },
    };
    return badges[status] || badges.upcoming;
  };

  const getFilteredTournaments = () => {
    let filtered = filter === 'all' ? tournaments : tournaments.filter((t) => t.status === filter);
    if (selectedDate) {
      filtered = filtered.filter((t) => {
        if (!t.startDate) return false;
        const tournamentDate = new Date(t.startDate).toDateString();
        const filterDate = new Date(selectedDate).toDateString();
        return tournamentDate === filterDate;
      });
    }
    if (selectedCity) {
      filtered = filtered.filter((t) => t.location?.city === selectedCity);
    }
    if (selectedState) {
      filtered = filtered.filter((t) => t.location?.state === selectedState);
    }
    return filtered;
  };

  // Get unique cities and states from tournaments
  const getUniqueCities = () => {
    const cities = tournaments
      .map((t) => t.location?.city)
      .filter((city) => city);
    return [...new Set(cities)].sort();
  };

  const getUniqueStates = () => {
    const states = tournaments
      .map((t) => t.location?.state)
      .filter((state) => state);
    return [...new Set(states)].sort();
  };

  const formatDate = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
        <div className="tournaments-loading">
          <div className="spinner" />
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
      <div className="filter-section">
        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({tournaments.length})
          </button>
          <button className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>
            Upcoming
          </button>
          <button className={`filter-tab ${filter === 'ongoing' ? 'active' : ''}`} onClick={() => setFilter('ongoing')}>
            Live
          </button>
          <button className={`filter-tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>
            Past
          </button>
        </div>

        <div className="location-filters">
          {/* City Filter */}
          <div className="filter-dropdown">
            <select
              className={`location-select ${selectedCity ? 'active' : ''}`}
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">All Cities</option>
              {getUniqueCities().map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {selectedCity && (
              <button className="clear-filter" onClick={() => setSelectedCity('')}>
                <XIcon size={14} />
              </button>
            )}
          </div>

          {/* State Filter */}
          <div className="filter-dropdown">
            <select
              className={`location-select ${selectedState ? 'active' : ''}`}
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="">All States</option>
              {getUniqueStates().map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {selectedState && (
              <button className="clear-filter" onClick={() => setSelectedState('')}>
                <XIcon size={14} />
              </button>
            )}
          </div>

          {/* Date Filter */}
          <label className={`date-picker ${selectedDate ? 'active' : ''}`}>
            <CalendarIcon size={16} />
            <span>{selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Date'}</span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </label>
          {selectedDate && (
            <button className="clear-date" onClick={() => setSelectedDate('')}>
              <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tournaments List */}
      <div className="tournaments-content">
        {filteredTournaments.length === 0 ? (
          <div className="no-tournaments">
            <TrophyIcon size={48} />
            <h3>No Tournaments Found</h3>
            <p>{filter === 'all' ? 'No tournaments available at the moment' : `No ${filter} tournaments`}</p>
          </div>
        ) : (
          <div className="tournaments-list">
            {filteredTournaments.map((tournament) => {
              const badge = getStatusBadge(tournament.status);
              return (
                <div key={tournament._id} className="tournament-card" onClick={() => handleTournamentClick(tournament._id)}>
                  {/* Banner */}
                  <div className="tournament-banner">
                    {tournament.banner ? (
                      <img src={tournament.banner} alt={tournament.name} />
                    ) : (
                      <div className="banner-placeholder">
                        <TrophyIcon size={32} />
                      </div>
                    )}
                    <div className={`status-badge ${badge.className}`}>
                      {tournament.status === 'ongoing' && <span className="live-dot" />}
                      {badge.text}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="tournament-body">
                    <h3 className="tournament-name">{tournament.name}</h3>
                    {tournament.description && (
                      <p className="tournament-desc">
                        {tournament.description.length > 80 ? `${tournament.description.substring(0, 80)}...` : tournament.description}
                      </p>
                    )}

                    {/* Info Grid */}
                    <div className="tournament-info">
                      <div className="info-row">
                        <CalendarIcon size={14} />
                        <span>{getDateRange(tournament.startDate, tournament.endDate)}</span>
                      </div>
                      {tournament.location && (
                        <div className="info-row">
                          <LocationIcon size={14} />
                          <span>{tournament.location.city}, {tournament.location.state}</span>
                        </div>
                      )}
                      <div className="info-row">
                        <UsersIcon size={14} />
                        <span>{tournament.currentTeams || 0} / {tournament.maxTeams || 16} Teams</span>
                      </div>
                      {tournament.awards?.winner?.prize && (
                        <div className="info-row prize">
                          <PrizeIcon size={14} />
                          <span>{tournament.awards.winner.prize}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress (ongoing) */}
                    {tournament.status === 'ongoing' && (
                      <div className="tournament-progress">
                        <div className="progress-header">
                          <span>Progress</span>
                          <span>65%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: '65%' }} />
                        </div>
                      </div>
                    )}

                    {/* Registered Teams */}
                    {tournament.registeredTeams && tournament.registeredTeams.length > 0 && (
                      <div className="registered-teams">
                        <span className="teams-label">Teams:</span>
                        <div className="teams-avatars">
                          {tournament.registeredTeams.slice(0, 4).map((team, idx) => (
                            <div key={idx} className="team-avatar" style={{ background: team.color || '#64748b' }} title={team.name}>
                              {team.name ? team.name.substring(0, 2).toUpperCase() : '?'}
                            </div>
                          ))}
                          {tournament.registeredTeams.length > 4 && (
                            <div className="team-avatar more">+{tournament.registeredTeams.length - 4}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    <button className="tournament-btn">
                      {tournament.status === 'upcoming' && <><EyeIcon size={16} /> View Details</>}
                      {tournament.status === 'ongoing' && <><EyeIcon size={16} /> Watch Live</>}
                      {tournament.status === 'completed' && <><CheckCircleIcon size={16} /> View Results</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {filteredTournaments.length > 0 && (
        <div className="tournaments-stats">
          <div className="stat-item">
            <TrophyIcon size={18} />
            <div className="stat-info">
              <span className="stat-value">{tournaments.length}</span>
              <span className="stat-label">Tournaments</span>
            </div>
          </div>
          <div className="stat-item">
            <UsersIcon size={18} />
            <div className="stat-info">
              <span className="stat-value">{tournaments.reduce((sum, t) => sum + (t.currentTeams || 0), 0)}</span>
              <span className="stat-label">Teams</span>
            </div>
          </div>
          <div className="stat-item">
            <SwordsIcon size={18} />
            <div className="stat-info">
              <span className="stat-value">{tournaments.reduce((sum, t) => sum + (t.totalMatches || 0), 0)}</span>
              <span className="stat-label">Matches</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTournaments;
