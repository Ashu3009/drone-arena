import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournaments } from '../../services/api';
import {
  TrophyIcon,
  CalendarIcon,
  LocationIcon,
  UsersIcon,
} from './icons';
import './PublicMobileTournaments.css';

const PublicMobileTournaments = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      console.log('🔍 Fetching tournaments...');
      console.log('📡 API URL:', process.env.REACT_APP_API_URL);
      const response = await getTournaments();
      console.log('✅ Tournaments Response:', response);
      setTournaments(response.data || []);
    } catch (error) {
      console.error('❌ Error loading tournaments:', error);
      console.error('📍 Error details:', error.response?.data || error.message);
    } finally {
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

    // City filter
    if (selectedCity) {
      filtered = filtered.filter((t) =>
        t.location?.city?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // State filter
    if (selectedState) {
      filtered = filtered.filter((t) => t.location?.state === selectedState);
    }

    return filtered;
  };

  // Get unique cities and states
  const uniqueCities = [...new Set(tournaments.map(t => t.location?.city).filter(Boolean))].sort();
  const uniqueStates = [...new Set(tournaments.map(t => t.location?.state).filter(Boolean))].sort();

  const hasActiveFilters = selectedCity || selectedState;

  const clearFilters = () => {
    setSelectedCity('');
    setSelectedState('');
  };

  const formatDate = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
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
      <div className="pub-tournaments-container">
        <div className="pub-loading">
          <div className="pub-spinner" />
          <p>Loading tournaments...</p>
        </div>
      </div>
    );
  }

  const filteredTournaments = getFilteredTournaments();

  return (
    <div className="pub-tournaments-container">
      {/* Header */}
      <div className="pub-tournaments-header">
        <h1 className="pub-page-title">Tournaments</h1>
        <p className="pub-page-subtitle">Drone Soccer Events</p>
      </div>

      {/* Filter Tabs */}
      <div className="pub-filter-section">
        <div className="pub-filter-tabs-row">
          <div className="pub-filter-tabs">
            <button
              className={`pub-filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`pub-filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`pub-filter-tab ${filter === 'ongoing' ? 'active' : ''}`}
              onClick={() => setFilter('ongoing')}
            >
              Live
            </button>
            <button
              className={`pub-filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Past
            </button>
          </div>

          {/* Filter Icon Button */}
          <button
            className={`pub-filter-icon-btn ${hasActiveFilters ? 'active' : ''}`}
            onClick={() => setShowExtraFilters(!showExtraFilters)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
              <circle cx="7" cy="6" r="2" fill="currentColor"/>
              <circle cx="17" cy="12" r="2" fill="currentColor"/>
              <circle cx="12" cy="18" r="2" fill="currentColor"/>
            </svg>
            {hasActiveFilters && <span className="pub-filter-dot"></span>}
          </button>
        </div>

        {/* Expandable Extra Filters */}
        {showExtraFilters && (
          <div className="pub-extra-filters-panel">
            <div className="pub-filter-dropdowns">
              {/* City Filter */}
              {uniqueCities.length > 0 && (
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="pub-filter-select"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map((city, idx) => (
                    <option key={idx} value={city}>{city}</option>
                  ))}
                </select>
              )}

              {/* State Filter */}
              {uniqueStates.length > 0 && (
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="pub-filter-select"
                >
                  <option value="">All States</option>
                  {uniqueStates.map((state, idx) => (
                    <option key={idx} value={state}>{state}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button className="pub-clear-all-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tournaments List */}
      <div className="pub-tournaments-content">
        {filteredTournaments.length === 0 ? (
          <div className="pub-no-tournaments">
            <TrophyIcon size={48} />
            <h3>No Tournaments Found</h3>
            <p>{filter === 'all' ? 'No tournaments available at the moment' : `No ${filter} tournaments`}</p>
          </div>
        ) : (
          <div className="pub-tournaments-list">
            {filteredTournaments.map((tournament) => {
              const badge = getStatusBadge(tournament.status);
              return (
                <div
                  key={tournament._id}
                  className="pub-tournament-card"
                  onClick={() => handleTournamentClick(tournament._id)}
                >
                  {/* Status Badge */}
                  <div className={`pub-status-badge ${badge.className}`}>
                    {tournament.status === 'ongoing' && <span className="pub-live-dot" />}
                    {badge.text}
                  </div>

                  {/* Content */}
                  <div className="pub-tournament-body">
                    <h3 className="pub-tournament-name">{tournament.name}</h3>

                    {/* Info Grid */}
                    <div className="pub-tournament-info">
                      <div className="pub-info-row">
                        <CalendarIcon size={16} />
                        <span>{getDateRange(tournament.startDate, tournament.endDate)}</span>
                      </div>
                      {tournament.location && (
                        <div className="pub-info-row">
                          <LocationIcon size={16} />
                          <span>{tournament.location.city}, {tournament.location.state}</span>
                        </div>
                      )}
                      <div className="pub-info-row">
                        <UsersIcon size={16} />
                        <span>{tournament.currentTeams || tournament.registeredTeams?.length || 0} / {tournament.maxTeams || 16} Teams</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default PublicMobileTournaments;
