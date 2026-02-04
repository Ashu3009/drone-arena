import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournaments } from '../../services/api';
import indiaCitiesData from '../../data/india-cities.json';
import './TournamentsList.css';

const TournamentsList = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    // Update available cities when state changes
    if (stateFilter && indiaCitiesData[stateFilter]) {
      setAvailableCities(indiaCitiesData[stateFilter]);
    } else {
      setAvailableCities([]);
      setCityFilter('');
    }
  }, [stateFilter]);

  useEffect(() => {
    applyFilters();
  }, [tournaments, timeFilter, customStartDate, customEndDate, stateFilter, cityFilter, statusFilter]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const response = await getTournaments();
      if (response.success) {
        setTournaments(response.data);
        setFilteredTournaments(response.data);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tournaments];

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch(timeFilter) {
        case 'last_month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          filtered = filtered.filter(t => new Date(t.startDate) >= startDate);
          break;
        case 'last_3_months':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          filtered = filtered.filter(t => new Date(t.startDate) >= startDate);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            filtered = filtered.filter(t => {
              const tDate = new Date(t.startDate);
              return tDate >= new Date(customStartDate) && tDate <= new Date(customEndDate);
            });
          }
          break;
        default:
          break;
      }
    }

    // Location filters
    if (stateFilter) {
      filtered = filtered.filter(t => t.location?.state === stateFilter);
    }
    if (cityFilter) {
      filtered = filtered.filter(t => t.location?.city === cityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    setFilteredTournaments(filtered);
  };

  const clearFilters = () => {
    setTimeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setStateFilter('');
    setCityFilter('');
    setStatusFilter('all');
  };

  const handleTournamentClick = (tournamentId) => {
    navigate(`/tournament/${tournamentId}`);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#4CAF50';
      case 'ongoing': return '#FF9800';
      case 'upcoming': return '#2196F3';
      default: return '#666';
    }
  };

  return (
    <div className="tournaments-list-container">
      <div className="tournaments-list-header">
        <h1 className="tournaments-list-title">All Tournaments</h1>
        <p className="tournaments-list-subtitle">Browse and explore drone soccer tournaments</p>
      </div>

      {/* Filters */}
      <div className="tournaments-filters-container">
        <h3 className="tournaments-filter-title">Filters</h3>

        <div className="tournaments-filter-row">
          {/* Time Filter */}
          <div className="tournaments-filter-group">
            <label className="tournaments-filter-label">Time Range</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="tournaments-filter-input"
            >
              <option value="all">All Time</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {timeFilter === 'custom' && (
            <>
              <div className="tournaments-filter-group">
                <label className="tournaments-filter-label">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="tournaments-filter-input"
                />
              </div>
              <div className="tournaments-filter-group">
                <label className="tournaments-filter-label">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="tournaments-filter-input"
                />
              </div>
            </>
          )}

          {/* State Filter */}
          <div className="tournaments-filter-group">
            <label className="tournaments-filter-label">State</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="tournaments-filter-input"
            >
              <option value="">All States</option>
              {Object.keys(indiaCitiesData).map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="tournaments-filter-group">
            <label className="tournaments-filter-label">City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="tournaments-filter-input"
              disabled={!stateFilter}
            >
              <option value="">All Cities</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="tournaments-filter-group">
            <label className="tournaments-filter-label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="tournaments-filter-input"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="tournaments-filter-group">
            <label className="tournaments-filter-label" style={{opacity: 0}}>Clear</label>
            <button onClick={clearFilters} className="tournaments-clear-button">
              Clear Filters
            </button>
          </div>
        </div>

        <div className="tournaments-results-count">
          Showing {filteredTournaments.length} of {tournaments.length} tournaments
        </div>
      </div>

      {/* Tournaments Grid */}
      <div className="tournaments-grid">
        {loading ? (
          <div className="tournaments-loading">Loading tournaments...</div>
        ) : filteredTournaments.length === 0 ? (
          <div className="tournaments-empty">
            <p>No tournaments found matching your filters</p>
            <button onClick={clearFilters} className="tournaments-clear-button">
              Clear Filters
            </button>
          </div>
        ) : (
          filteredTournaments.map(tournament => (
            <div
              key={tournament._id}
              className="tournament-card"
              onClick={() => handleTournamentClick(tournament._id)}
            >
              <div className="tournament-card-content">
                <div className="tournament-card-header">
                  <h3 className="tournament-card-title">{tournament.name}</h3>
                  <span className="tournament-card-status" style={{backgroundColor: getStatusColor(tournament.status)}}>
                    {tournament.status || 'Upcoming'}
                  </span>
                </div>

                {tournament.description && (
                  <p className="tournament-card-description">
                    {tournament.description.length > 100
                      ? `${tournament.description.substring(0, 100)}...`
                      : tournament.description}
                  </p>
                )}

                <div className="tournament-card-info">
                  <div className="tournament-info-item">
                    <span className="tournament-info-icon">📍</span>
                    <span>{tournament.location?.city}, {tournament.location?.state}</span>
                  </div>
                  <div className="tournament-info-item">
                    <span className="tournament-info-icon">📅</span>
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="tournament-info-item">
                    <span className="tournament-info-icon">👥</span>
                    <span>{tournament.currentTeams || 0}/{tournament.maxTeams} Teams</span>
                  </div>
                </div>

                <button className="tournament-view-button">
                  View Details →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentsList;
