import React, { useState, useEffect } from 'react';
import { getTournaments, createTournament, updateTournament, deleteTournament, getTeams } from '../../services/api';
import indiaCitiesData from '../../data/india-cities.json';
import TournamentManagement from './TournamentManagement';

const TournamentManager = () => {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [managingTournament, setManagingTournament] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxTeams: 16,
    location: {
      city: '',
      state: '',
      country: 'India',
      venue: '',
      address: ''
    },
    prizePool: {
      totalAmount: 0,
      currency: 'INR',
      prizes: []
    },
    media: {
      bannerImage: '',
      logoImage: '',
      gallery: [],
      socialLinks: {
        website: '',
        facebook: '',
        twitter: '',
        instagram: '',
        youtube: ''
      }
    },
    organizer: {
      name: '',
      email: '',
      phone: ''
    },
    registration: {
      isOpen: true,
      deadline: '',
      fee: 0
    },
    registeredTeams: [],
    settings: {
      matchType: 'Best of 2',
      hasTiebreaker: true,
      roundDuration: 3
    }
  });

  useEffect(() => {
    loadTournaments();
    loadTeams();
  }, []);

  useEffect(() => {
    // Update available cities when state changes
    if (formData.location.state && indiaCitiesData[formData.location.state]) {
      setAvailableCities(indiaCitiesData[formData.location.state]);
    } else {
      setAvailableCities([]);
    }
  }, [formData.location.state]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const response = await getTournaments();
      if (response.success) {
        setTournaments(response.data);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      alert('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await getTeams();
      if (response.success) {
        setTeams(response.data);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Please fill all required fields (Name, Start Date, End Date)');
      return;
    }

    if (!formData.location.city) {
      alert('Please provide tournament city');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingTournament) {
        response = await updateTournament(editingTournament._id, formData);
      } else {
        response = await createTournament(formData);
      }

      if (response.success) {
        alert(editingTournament ? 'Tournament updated!' : 'Tournament created!');
        handleCancelEdit();
        loadTournaments();
      }
    } catch (error) {
      console.error('Error saving tournament:', error);
      alert(error.response?.data?.message || 'Failed to save tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to delete this tournament?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await deleteTournament(tournamentId);
      if (response.success) {
        alert('Tournament deleted!');
        loadTournaments();
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert(error.response?.data?.message || 'Failed to delete tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      startDate: tournament.startDate?.split('T')[0] || '',
      endDate: tournament.endDate?.split('T')[0] || '',
      maxTeams: tournament.maxTeams || 16,
      location: tournament.location || { city: '', state: '', country: 'India', venue: '', address: '' },
      prizePool: tournament.prizePool || { totalAmount: 0, currency: 'INR', prizes: [] },
      media: tournament.media || { bannerImage: '', logoImage: '', gallery: [], socialLinks: {} },
      organizer: tournament.organizer || { name: '', email: '', phone: '' },
      registration: tournament.registration || { isOpen: true, deadline: '', fee: 0 },
      registeredTeams: tournament.registeredTeams?.map(t => t._id || t) || [],
      settings: tournament.settings || { matchType: 'Best of 2', hasTiebreaker: true, roundDuration: 3 }
    });
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setShowCreateForm(false);
    setEditingTournament(null);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      maxTeams: 16,
      location: { city: '', state: '', country: 'India', venue: '', address: '' },
      prizePool: { totalAmount: 0, currency: 'INR', prizes: [] },
      media: { bannerImage: '', logoImage: '', gallery: [], socialLinks: {} },
      organizer: { name: '', email: '', phone: '' },
      registration: { isOpen: true, deadline: '', fee: 0 },
      registeredTeams: [],
      settings: { matchType: 'Best of 2', hasTiebreaker: true, roundDuration: 3 }
    });
  };

  const handleTeamToggle = (teamId) => {
    const currentTeams = formData.registeredTeams || [];
    if (currentTeams.includes(teamId)) {
      setFormData({
        ...formData,
        registeredTeams: currentTeams.filter(id => id !== teamId)
      });
    } else {
      if (currentTeams.length >= formData.maxTeams) {
        alert(`Cannot select more than ${formData.maxTeams} teams`);
        return;
      }
      setFormData({
        ...formData,
        registeredTeams: [...currentTeams, teamId]
      });
    }
  };

  const handleStateChange = (state) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        state: state,
        city: '' // Reset city when state changes
      }
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Tournament Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={styles.createButton}
          disabled={loading}
        >
          {showCreateForm ? 'Cancel' : '+ Create Tournament'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div style={styles.formModal}>
          <form onSubmit={handleCreateOrUpdate} style={styles.form}>
            <h3 style={styles.formTitle}>
              {editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
            </h3>

            {/* Basic Information */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Basic Information</h4>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tournament Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., Summer Championship 2025"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{...styles.input, minHeight: '60px', resize: 'vertical'}}
                  placeholder="Brief tournament description..."
                  rows="3"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Max Teams</label>
                  <input
                    type="number"
                    value={formData.maxTeams}
                    onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) || 16 })}
                    style={styles.input}
                    min="2"
                    max="32"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Location Details</h4>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>State *</label>
                  <select
                    value={formData.location.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    style={styles.input}
                    required
                  >
                    <option value="">Select State</option>
                    {Object.keys(indiaCitiesData).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>City *</label>
                  <select
                    value={formData.location.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value }
                    })}
                    style={styles.input}
                    required
                    disabled={!formData.location.state}
                  >
                    <option value="">Select City</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Country</label>
                  <input
                    type="text"
                    value={formData.location.country}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, country: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Venue Name</label>
                <input
                  type="text"
                  value={formData.location.venue}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, venue: e.target.value }
                  })}
                  style={styles.input}
                  placeholder="e.g., NSCI Dome"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Full Address</label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value }
                  })}
                  style={styles.input}
                  placeholder="Complete venue address"
                />
              </div>
            </div>

            {/* Match Settings */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Match Settings</h4>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Match Type</label>
                  <select
                    value={formData.settings.matchType}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, matchType: e.target.value }
                    })}
                    style={styles.input}
                  >
                    <option value="Best of 2">Best of 2</option>
                    <option value="Best of 3">Best of 3</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Has Tiebreaker Round?</label>
                  <select
                    value={formData.settings.hasTiebreaker ? 'yes' : 'no'}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, hasTiebreaker: e.target.value === 'yes' }
                    })}
                    style={styles.input}
                  >
                    <option value="yes">Yes (3rd round if draw)</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Round Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.settings.roundDuration}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, roundDuration: parseInt(e.target.value) || 3 }
                    })}
                    style={styles.input}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>

            {/* Team Selection */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>
                Participating Teams ({formData.registeredTeams.length}/{formData.maxTeams})
              </h4>

              <div style={styles.teamsGrid}>
                {teams.length === 0 ? (
                  <p style={styles.emptyText}>No teams available. Create teams first.</p>
                ) : (
                  teams.map(team => (
                    <label key={team._id} style={styles.teamCheckbox}>
                      <input
                        type="checkbox"
                        checked={formData.registeredTeams.includes(team._id)}
                        onChange={() => handleTeamToggle(team._id)}
                        style={styles.checkbox}
                      />
                      <span style={styles.teamName}>
                        {team.name} ({team.location?.city || 'N/A'})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Prize Pool */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Prize Pool (Optional)</h4>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Amount</label>
                  <input
                    type="number"
                    value={formData.prizePool.totalAmount}
                    onChange={(e) => setFormData({
                      ...formData,
                      prizePool: { ...formData.prizePool, totalAmount: parseFloat(e.target.value) || 0 }
                    })}
                    style={styles.input}
                    min="0"
                    placeholder="e.g., 100000"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Currency</label>
                  <select
                    value={formData.prizePool.currency}
                    onChange={(e) => setFormData({
                      ...formData,
                      prizePool: { ...formData.prizePool, currency: e.target.value }
                    })}
                    style={styles.input}
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Organizer */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Organizer Details (Optional)</h4>

              <div style={styles.formGroup}>
                <label style={styles.label}>Organizer Name</label>
                <input
                  type="text"
                  value={formData.organizer.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    organizer: { ...formData.organizer, name: e.target.value }
                  })}
                  style={styles.input}
                  placeholder="Organization or person name"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Email</label>
                  <input
                    type="email"
                    value={formData.organizer.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      organizer: { ...formData.organizer, email: e.target.value }
                    })}
                    style={styles.input}
                    placeholder="organizer@example.com"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.organizer.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      organizer: { ...formData.organizer, phone: e.target.value }
                    })}
                    style={styles.input}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Media & Links */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Media & Social Links (Optional)</h4>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Banner Image URL</label>
                  <input
                    type="url"
                    value={formData.media.bannerImage}
                    onChange={(e) => setFormData({
                      ...formData,
                      media: { ...formData.media, bannerImage: e.target.value }
                    })}
                    style={styles.input}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Logo URL</label>
                  <input
                    type="url"
                    value={formData.media.logoImage}
                    onChange={(e) => setFormData({
                      ...formData,
                      media: { ...formData.media, logoImage: e.target.value }
                    })}
                    style={styles.input}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Website</label>
                  <input
                    type="url"
                    value={formData.media.socialLinks.website}
                    onChange={(e) => setFormData({
                      ...formData,
                      media: {
                        ...formData.media,
                        socialLinks: { ...formData.media.socialLinks, website: e.target.value }
                      }
                    })}
                    style={styles.input}
                    placeholder="https://example.com"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Instagram</label>
                  <input
                    type="text"
                    value={formData.media.socialLinks.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      media: {
                        ...formData.media,
                        socialLinks: { ...formData.media.socialLinks, instagram: e.target.value }
                      }
                    })}
                    style={styles.input}
                    placeholder="@tournament_handle"
                  />
                </div>
              </div>
            </div>

            {/* Registration */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Registration Settings (Optional)</h4>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Registration Open</label>
                  <select
                    value={formData.registration.isOpen ? 'yes' : 'no'}
                    onChange={(e) => setFormData({
                      ...formData,
                      registration: { ...formData.registration, isOpen: e.target.value === 'yes' }
                    })}
                    style={styles.input}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Registration Deadline</label>
                  <input
                    type="date"
                    value={formData.registration.deadline}
                    onChange={(e) => setFormData({
                      ...formData,
                      registration: { ...formData.registration, deadline: e.target.value }
                    })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Registration Fee</label>
                  <input
                    type="number"
                    value={formData.registration.fee}
                    onChange={(e) => setFormData({
                      ...formData,
                      registration: { ...formData.registration, fee: parseFloat(e.target.value) || 0 }
                    })}
                    style={styles.input}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="submit" style={styles.submitButton} disabled={loading}>
                {loading ? 'Saving...' : editingTournament ? 'Update Tournament' : 'Create Tournament'}
              </button>
              <button type="button" onClick={handleCancelEdit} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tournaments List */}
      <div style={styles.tournamentList}>
        {loading && tournaments.length === 0 ? (
          <p style={styles.loadingText}>Loading tournaments...</p>
        ) : tournaments.length === 0 ? (
          <p style={styles.emptyText}>No tournaments found. Create your first tournament!</p>
        ) : (
          tournaments.map((tournament) => (
            <div key={tournament._id} style={styles.tournamentCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{tournament.name}</h3>
                <span style={styles.cardStatus}>
                  {tournament.status || 'Upcoming'}
                </span>
              </div>

              {tournament.description && (
                <p style={styles.cardDescription}>{tournament.description}</p>
              )}

              <div style={styles.cardInfo}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Location:</span>
                  <span>{tournament.location?.city}, {tournament.location?.state}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Teams:</span>
                  <span>{tournament.currentTeams || 0}/{tournament.maxTeams}</span>
                </div>
              </div>

              <div style={styles.cardDates}>
                <span>Start: {new Date(tournament.startDate).toLocaleDateString()}</span>
                <span>End: {new Date(tournament.endDate).toLocaleDateString()}</span>
              </div>

              <div style={styles.cardActions}>
                <button
                  onClick={() => setManagingTournament(tournament)}
                  style={styles.manageButton}
                  disabled={loading}
                >
                  Manage
                </button>
                <button
                  onClick={() => handleEdit(tournament)}
                  style={styles.editButton}
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(tournament._id)}
                  style={styles.deleteButton}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tournament Management Modal */}
      {managingTournament && (
        <TournamentManagement
          tournament={managingTournament}
          teams={teams}
          onClose={() => setManagingTournament(null)}
          onUpdate={(updatedTournament) => {
            setTournaments(tournaments.map(t =>
              t._id === updatedTournament._id ? updatedTournament : t
            ));
          }}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '24px',
    margin: 0
  },
  createButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  formModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '8px',
    marginBottom: '30px',
    maxHeight: '70vh',
    overflowY: 'auto',
    border: '1px solid #333'
  },
  form: {
    backgroundColor: '#1e1e1e',
    padding: '24px',
    borderRadius: '8px'
  },
  section: {
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #333'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: '16px',
    color: '#4CAF50'
  },
  formTitle: {
    marginTop: 0,
    marginBottom: '20px',
    fontSize: '18px'
  },
  formGroup: {
    marginBottom: '16px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#ccc'
  },
  input: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '10px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  teamsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px',
    marginTop: '12px'
  },
  teamCheckbox: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  checkbox: {
    marginRight: '10px',
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  },
  teamName: {
    fontSize: '14px',
    color: '#fff'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1
  },
  cancelButton: {
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  tournamentList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  loadingText: {
    textAlign: 'center',
    color: '#888',
    padding: '40px'
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    padding: '20px'
  },
  tournamentCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #333'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '12px'
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px',
    flex: 1
  },
  cardStatus: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  cardDescription: {
    color: '#aaa',
    fontSize: '14px',
    marginBottom: '12px'
  },
  cardInfo: {
    marginBottom: '12px'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '6px',
    color: '#ccc'
  },
  infoLabel: {
    color: '#888',
    fontWeight: 'bold'
  },
  cardDates: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#888',
    fontSize: '13px',
    marginBottom: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #333'
  },
  cardActions: {
    display: 'flex',
    gap: '8px'
  },
  manageButton: {
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1
  },
  editButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1
  }
};

export default TournamentManager;
