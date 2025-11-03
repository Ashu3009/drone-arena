import React, { useState, useEffect } from 'react';
import { getTeams, createTeam, updateTeam, deleteTeam } from '../../services/api';

const TeamManager = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    captainName: '',
    members: ''
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const response = await getTeams();
      if (response.success) {
        setTeams(response.data);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      alert('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.captainName) {
      alert('Please fill all required fields');
      return;
    }

    // Convert comma-separated members to array
    const teamData = {
      name: formData.name,
      captainName: formData.captainName,
      members: formData.members
        ? formData.members.split(',').map(m => m.trim()).filter(m => m)
        : []
    };

    setLoading(true);
    try {
      let response;
      if (editingTeam) {
        response = await updateTeam(editingTeam._id, teamData);
      } else {
        response = await createTeam(teamData);
      }

      if (response.success) {
        alert(editingTeam ? 'Team updated!' : 'Team created!');
        setShowCreateForm(false);
        setEditingTeam(null);
        setFormData({ name: '', captainName: '', members: '' });
        loadTeams();
      }
    } catch (error) {
      console.error('Error saving team:', error);
      alert(error.response?.data?.message || 'Failed to save team');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await deleteTeam(teamId);
      if (response.success) {
        alert('Team deleted!');
        loadTeams();
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert(error.response?.data?.message || 'Failed to delete team');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      captainName: team.captainName || '',
      members: team.members?.join(', ') || ''
    });
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setShowCreateForm(false);
    setEditingTeam(null);
    setFormData({ name: '', captainName: '', members: '' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Team Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={styles.createButton}
          disabled={loading}
        >
          {showCreateForm ? 'Cancel' : '+ Create Team'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateOrUpdate} style={styles.form}>
          <h3 style={styles.formTitle}>
            {editingTeam ? 'Edit Team' : 'Create New Team'}
          </h3>

          <div style={styles.formGroup}>
            <label style={styles.label}>Team Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              placeholder="e.g., Team Alpha"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Captain Name *</label>
            <input
              type="text"
              value={formData.captainName}
              onChange={(e) => setFormData({ ...formData, captainName: e.target.value })}
              style={styles.input}
              placeholder="e.g., John Doe"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Team Members (comma-separated)</label>
            <input
              type="text"
              value={formData.members}
              onChange={(e) => setFormData({ ...formData, members: e.target.value })}
              style={styles.input}
              placeholder="e.g., Alice, Bob, Charlie"
            />
            <small style={styles.hint}>Enter member names separated by commas</small>
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
            </button>
            <button type="button" onClick={handleCancelEdit} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Teams List */}
      <div style={styles.teamList}>
        {loading && teams.length === 0 ? (
          <p style={styles.loadingText}>Loading teams...</p>
        ) : teams.length === 0 ? (
          <p style={styles.emptyText}>No teams found. Create your first team!</p>
        ) : (
          teams.map((team) => (
            <div key={team._id} style={styles.teamCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{team.name}</h3>
              </div>

              <div style={styles.cardInfo}>
                <p style={styles.infoRow}>
                  <strong>Captain:</strong> {team.captainName || 'N/A'}
                </p>
                {team.members && team.members.length > 0 && (
                  <p style={styles.infoRow}>
                    <strong>Members:</strong> {team.members.join(', ')}
                  </p>
                )}
                <p style={styles.infoRow}>
                  <strong>Created:</strong> {new Date(team.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div style={styles.cardActions}>
                <button
                  onClick={() => handleEdit(team)}
                  style={styles.editButton}
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(team._id)}
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
    marginBottom: '16px'
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
  hint: {
    display: 'block',
    marginTop: '4px',
    fontSize: '12px',
    color: '#888'
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
  teamList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
  teamCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #333'
  },
  cardHeader: {
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #333'
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px'
  },
  cardInfo: {
    marginBottom: '16px'
  },
  infoRow: {
    margin: '8px 0',
    fontSize: '14px',
    color: '#ccc'
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

export default TeamManager;
