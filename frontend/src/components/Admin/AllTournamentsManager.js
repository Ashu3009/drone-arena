import React, { useState, useEffect } from 'react';
import { getTournaments, deleteTournament, getMatches, updateTournament } from '../../services/api';
import indiaCitiesData from '../../data/india-cities.json';
import './AllTournamentsManager.css';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AllTournamentsManager = () => {
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

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [tournamentStats, setTournamentStats] = useState(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
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

    if (stateFilter) {
      filtered = filtered.filter(t => t.location?.state === stateFilter);
    }
    if (cityFilter) {
      filtered = filtered.filter(t => t.location?.city === cityFilter);
    }
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

  const handleDeleteClick = async (tournament) => {
    setTournamentToDelete(tournament);
    setDeleteConfirmation(false);

    // Get tournament statistics
    try {
      const matchesRes = await getMatches();
      if (matchesRes.success) {
        const tournamentMatches = matchesRes.data.filter(
          m => m.tournament._id === tournament._id || m.tournament === tournament._id
        );

        setTournamentStats({
          totalMatches: tournamentMatches.length,
          completedMatches: tournamentMatches.filter(m => m.status === 'completed').length,
          hasGallery: tournament.media?.gallery?.length > 0,
          galleryCount: tournament.media?.gallery?.length || 0,
          hasAwards: tournament.winners?.champion || tournament.manOfTheTournament?.playerName
        });
      }
    } catch (error) {
      console.error('Error getting tournament stats:', error);
    }

    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (tournamentToDelete.status === 'completed' && !deleteConfirmation) {
      alert('Please confirm that you understand this will delete all historical data');
      return;
    }

    try {
      const response = await deleteTournament(tournamentToDelete._id);
      if (response.success) {
        alert(`Tournament "${tournamentToDelete.name}" deleted successfully`);
        setShowDeleteModal(false);
        setTournamentToDelete(null);
        setDeleteConfirmation(false);
        loadTournaments();
      } else {
        alert('Failed to delete tournament: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Error deleting tournament');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTournamentToDelete(null);
    setDeleteConfirmation(false);
    setTournamentStats(null);
  };

  const handleCompleteTournament = async (tournament) => {
    if (!window.confirm(`Mark "${tournament.name}" as completed?\n\nThis will also complete all pending matches in this tournament.`)) {
      return;
    }

    try {
      const response = await updateTournament(tournament._id, { status: 'completed' });
      if (response.success) {
        alert('Tournament marked as completed successfully!');
        loadTournaments();
      } else {
        alert('Failed to complete tournament: ' + response.message);
      }
    } catch (error) {
      console.error('Error completing tournament:', error);
      alert('Error completing tournament');
    }
  };

  const handleViewPublic = (tournamentId) => {
    const publicUrl = `/tournament/${tournamentId}`;
    window.open(publicUrl, '_blank');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#00d4ff';
      case 'ongoing': return '#ffab00';
      case 'upcoming': return '#00d4ff';
      default: return '#666';
    }
  };

  return (
    <div className="all-tournaments-manager">
      <div className="tournaments-header">
        <h2>All Tournaments</h2>
        <p>Manage and delete tournaments across all statuses</p>
      </div>

      {/* Filters */}
      <div className="tournaments-filters">
        <h3>Filters</h3>

        <div className="filter-row">
          <div className="filter-group">
            <label>Time Range</label>
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {timeFilter === 'custom' && (
            <>
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="filter-group">
            <label>State</label>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="">All States</option>
              {Object.keys(indiaCitiesData).map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              disabled={!stateFilter}
            >
              <option value="">All Cities</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <label style={{opacity: 0}}>Clear</label>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        </div>

        <div className="results-count">
          Showing {filteredTournaments.length} of {tournaments.length} tournaments
        </div>
      </div>

      {/* Tournaments Table */}
      <div className="tournaments-table-container">
        {loading ? (
          <div className="loading">Loading tournaments...</div>
        ) : filteredTournaments.length === 0 ? (
          <div className="empty-state">
            <p>No tournaments found</p>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        ) : (
          <table className="tournaments-table">
            <thead>
              <tr>
                <th>Banner</th>
                <th>Tournament Name</th>
                <th>Location</th>
                <th>Date</th>
                <th>Teams</th>
                <th>Status</th>
                <th>Prize Pool</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTournaments.map(tournament => (
                <tr key={tournament._id}>
                  <td>
                    {tournament.media?.bannerImage ? (
                      <img
                        src={`${BACKEND_URL}${tournament.media.bannerImage}`}
                        alt={tournament.name}
                        className="tournament-banner-thumb"
                      />
                    ) : (
                      <div className="banner-placeholder">🎯⚽</div>
                    )}
                  </td>
                  <td className="tournament-name">{tournament.name}</td>
                  <td>{tournament.location?.city}, {tournament.location?.state}</td>
                  <td>{new Date(tournament.startDate).toLocaleDateString()}</td>
                  <td>{tournament.currentTeams || 0}/{tournament.maxTeams}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{backgroundColor: getStatusColor(tournament.status)}}
                    >
                      {tournament.status || 'Upcoming'}
                    </span>
                  </td>
                  <td>
                    {tournament.prizePool?.totalAmount > 0
                      ? `${tournament.prizePool.currency} ${tournament.prizePool.totalAmount.toLocaleString()}`
                      : '-'}
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                      <button
                        className="view-public-btn"
                        onClick={() => handleViewPublic(tournament._id)}
                        title="View public page"
                      >
                        👁️ View
                      </button>

                      {tournament.status !== 'completed' && (
                        <button
                          className="complete-btn"
                          onClick={() => handleCompleteTournament(tournament)}
                          title="Mark as completed"
                        >
                          ✓ Complete
                        </button>
                      )}

                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteClick(tournament)}
                        title="Delete tournament"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tournamentToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {tournamentToDelete.status === 'completed'
                ? '⚠️ Delete Completed Tournament'
                : '⚠️ Delete Tournament'}
            </h3>

            <div className="modal-body">
              <p className="tournament-name-highlight">"{tournamentToDelete.name}"</p>

              {tournamentToDelete.status === 'completed' ? (
                <>
                  <div className="warning-box">
                    <p><strong>⚠️ This tournament contains historical records:</strong></p>
                    <ul>
                      <li>Status: Completed</li>
                      {tournamentStats && (
                        <>
                          <li>{tournamentStats.completedMatches} completed matches</li>
                          <li>{tournamentStats.totalMatches} total matches</li>
                          {tournamentStats.hasGallery && (
                            <li>Gallery with {tournamentStats.galleryCount} images</li>
                          )}
                          {tournamentStats.hasAwards && <li>Winners & Awards data</li>}
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="danger-warning">
                    <p>
                      <strong>⚠️ Warning:</strong> This will permanently delete ALL historical
                      data including match records, drone reports, and awards. This action
                      <strong> CANNOT be undone</strong>.
                    </p>
                  </div>

                  <div className="confirmation-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.checked)}
                      />
                      <span>I understand this will delete all historical records</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <p><strong>Status:</strong> {tournamentToDelete.status || 'Upcoming'}</p>
                  {tournamentStats && (
                    <p><strong>Matches:</strong> {tournamentStats.totalMatches} scheduled</p>
                  )}
                  <p className="warning-text">
                    This will delete the tournament and all associated matches.
                  </p>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCancelDelete}>
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={handleConfirmDelete}
                disabled={tournamentToDelete.status === 'completed' && !deleteConfirmation}
              >
                {tournamentToDelete.status === 'completed'
                  ? 'Permanently Delete'
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTournamentsManager;
