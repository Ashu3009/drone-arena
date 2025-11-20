import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournaments } from '../../services/api';
import indiaCitiesData from '../../data/india-cities.json';

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
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>All Tournaments</h1>
        <p style={styles.subtitle}>Browse and explore drone soccer tournaments</p>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <h3 style={styles.filterTitle}>Filters</h3>

        <div style={styles.filterRow}>
          {/* Time Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Time Range</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={styles.filterInput}
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
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={styles.filterInput}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={styles.filterInput}
                />
              </div>
            </>
          )}

          {/* State Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>State</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={styles.filterInput}
            >
              <option value="">All States</option>
              {Object.keys(indiaCitiesData).map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              style={styles.filterInput}
              disabled={!stateFilter}
            >
              <option value="">All Cities</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterInput}
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div style={styles.filterGroup}>
            <label style={{...styles.filterLabel, opacity: 0}}>Clear</label>
            <button onClick={clearFilters} style={styles.clearButton}>
              Clear Filters
            </button>
          </div>
        </div>

        <div style={styles.resultsCount}>
          Showing {filteredTournaments.length} of {tournaments.length} tournaments
        </div>
      </div>

      {/* Tournaments Grid */}
      <div style={styles.tournamentsGrid}>
        {loading ? (
          <div style={styles.loading}>Loading tournaments...</div>
        ) : filteredTournaments.length === 0 ? (
          <div style={styles.empty}>
            <p>No tournaments found matching your filters</p>
            <button onClick={clearFilters} style={styles.clearButton}>
              Clear Filters
            </button>
          </div>
        ) : (
          filteredTournaments.map(tournament => (
            <div
              key={tournament._id}
              style={styles.tournamentCard}
              onClick={() => handleTournamentClick(tournament._id)}
            >
              {tournament.media?.bannerImage && (
                <img
                  src={`http://localhost:5000${tournament.media.bannerImage}`}
                  alt={tournament.name}
                  style={styles.cardBanner}
                />
              )}
              <div style={styles.cardContent}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{tournament.name}</h3>
                  <span style={{...styles.cardStatus, backgroundColor: getStatusColor(tournament.status)}}>
                    {tournament.status || 'Upcoming'}
                  </span>
                </div>

                {tournament.description && (
                  <p style={styles.cardDescription}>
                    {tournament.description.length > 100
                      ? `${tournament.description.substring(0, 100)}...`
                      : tournament.description}
                  </p>
                )}

                <div style={styles.cardInfo}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoIcon}>●</span>
                    <span>{tournament.location?.city}, {tournament.location?.state}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoIcon}>●</span>
                    <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoIcon}>●</span>
                    <span>{tournament.currentTeams || 0}/{tournament.maxTeams} Teams</span>
                  </div>
                  {tournament.prizePool?.totalAmount > 0 && (
                    <div style={styles.infoItem}>
                      <span style={styles.infoIcon}>●</span>
                      <span>{tournament.prizePool.currency} {tournament.prizePool.totalAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <button style={styles.viewButton}>
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

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  title: {
    fontSize: '42px',
    margin: '0 0 12px 0',
    color: '#fff'
  },
  subtitle: {
    fontSize: '18px',
    color: '#888',
    margin: 0
  },
  filtersContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '40px',
    border: '1px solid #333'
  },
  filterTitle: {
    fontSize: '20px',
    margin: '0 0 20px 0',
    color: '#fff'
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  filterGroup: {
    flex: '1 1 200px',
    minWidth: '150px'
  },
  filterLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '6px'
  },
  filterInput: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '10px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  clearButton: {
    width: '100%',
    backgroundColor: '#666',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  resultsCount: {
    fontSize: '14px',
    color: '#888',
    marginTop: '12px'
  },
  tournamentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px'
  },
  loading: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#888'
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px'
  },
  tournamentCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #333',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      borderColor: '#4CAF50'
    }
  },
  cardBanner: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  cardContent: {
    padding: '20px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '12px',
    gap: '12px'
  },
  cardTitle: {
    fontSize: '22px',
    margin: 0,
    color: '#fff',
    flex: 1
  },
  cardStatus: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
    whiteSpace: 'nowrap'
  },
  cardDescription: {
    fontSize: '14px',
    color: '#aaa',
    lineHeight: '1.5',
    marginBottom: '16px'
  },
  cardInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#ccc'
  },
  infoIcon: {
    fontSize: '16px'
  },
  viewButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default TournamentsList;
