import React, { useState, useEffect } from 'react';
import { getTournaments, createTournament, updateTournament, deleteTournament } from '../../services/api';

const TournamentManager = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadTournaments();
  }, []);

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

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Please fill all required fields');
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
        setShowCreateForm(false);
        setEditingTournament(null);
        setFormData({ name: '', description: '', startDate: '', endDate: '' });
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
      endDate: tournament.endDate?.split('T')[0] || ''
    });
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setShowCreateForm(false);
    setEditingTournament(null);
    setFormData({ name: '', description: '', startDate: '', endDate: '' });
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
        <form onSubmit={handleCreateOrUpdate} style={styles.form}>
          <h3 style={styles.formTitle}>
            {editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
          </h3>

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
              style={{...styles.input, minHeight: '80px'}}
              placeholder="Tournament description..."
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

              <div style={styles.cardDates}>
                <span>Start: {new Date(tournament.startDate).toLocaleDateString()}</span>
                <span>End: {new Date(tournament.endDate).toLocaleDateString()}</span>
              </div>

              <div style={styles.cardActions}>
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
  form: {
    backgroundColor: '#1e1e1e',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '30px'
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
    padding: '40px'
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
