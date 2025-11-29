import React, { useState, useEffect } from 'react';
import { getTeams, createTeam, updateTeam, deleteTeam, getAllSchools, uploadMemberPhoto } from '../../services/api';

const TeamManager = () => {
  const [teams, setTeams] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    school: '', // Optional
    teamType: 'School',
    location: {
      city: '',
      state: '',
      country: 'India'
    },
    captain: '',
    color: '#3B82F6',
    members: [
      { name: '', role: 'Forward', photo: null, photoFile: null, jerseyNumber: '' },
      { name: '', role: 'Defender', photo: null, photoFile: null, jerseyNumber: '' },
      { name: '', role: 'Striker', photo: null, photoFile: null, jerseyNumber: '' },
      { name: '', role: 'Central', photo: null, photoFile: null, jerseyNumber: '' }
    ]
  });

  useEffect(() => {
    loadTeams();
    loadSchools();
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

  const loadSchools = async () => {
    try {
      const response = await getAllSchools();
      if (response.success) {
        setSchools(response.data);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...formData.members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setFormData({ ...formData, members: newMembers });
  };

  const addExtraMember = () => {
    setFormData({
      ...formData,
      members: [...formData.members, { name: '', role: 'Substitute', photo: null, photoFile: null, jerseyNumber: '' }]
    });
  };

  const removeMember = (index) => {
    if (index < 4) {
      alert('Cannot remove first 4 members');
      return;
    }
    const newMembers = formData.members.filter((_, i) => i !== index);
    setFormData({ ...formData, members: newMembers });
  };

  const handlePhotoChange = (index, file) => {
    if (file && file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Photo size should be less than 2MB');
      return;
    }
    const newMembers = [...formData.members];
    newMembers[index] = {
      ...newMembers[index],
      photoFile: file,
      photo: file ? URL.createObjectURL(file) : null
    };
    setFormData({ ...formData, members: newMembers });
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();

    // Validate: At least 1 member with name
    const validMembers = formData.members.filter(m => m.name && m.name.trim());
    if (validMembers.length === 0) {
      alert('Please add at least one team member');
      return;
    }

    // Validate location
    if (!formData.location.city || !formData.location.city.trim()) {
      alert('Please provide team location (city is required)');
      return;
    }

    // Prepare member data (remove photoFile and photo URL - these are for preview only)
    const membersData = validMembers.map(m => ({
      name: m.name,
      role: m.role,
      jerseyNumber: m.jerseyNumber || undefined
    }));

    const teamData = {
      name: formData.name,
      school: formData.school || null,
      teamType: formData.teamType,
      location: formData.location,
      captain: formData.captain,
      color: formData.color,
      members: membersData
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
        const teamId = response.data._id;

        // Upload member photos
        for (let i = 0; i < validMembers.length; i++) {
          if (validMembers[i].photoFile) {
            try {
              await uploadMemberPhoto(teamId, i, validMembers[i].photoFile);
            } catch (photoError) {
              console.error(`Error uploading photo for member ${i}:`, photoError);
            }
          }
        }

        alert(editingTeam ? 'Team updated!' : 'Team created!');
        handleCancelEdit();
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

    // Ensure at least 4 primary members
    const members = team.members && team.members.length >= 4
      ? team.members
      : [
          { name: '', role: 'Forward', contactEmail: '', isPrimary: true },
          { name: '', role: 'Striker', contactEmail: '', isPrimary: true },
          { name: '', role: 'Defender', contactEmail: '', isPrimary: true },
          { name: '', role: 'Central', contactEmail: '', isPrimary: true }
        ];

    setFormData({
      name: team.name,
      school: team.school?._id || '',
      teamType: team.teamType || 'School',
      location: team.location || { city: '', state: '', country: 'India' },
      captain: team.captain || '',
      color: team.color || '#3B82F6',
      members
    });
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setShowCreateForm(false);
    setEditingTeam(null);
    setFormData({
      name: '',
      school: '',
      teamType: 'School',
      location: {
        city: '',
        state: '',
        country: 'India'
      },
      captain: '',
      color: '#3B82F6',
      members: [
        { name: '', role: 'Forward', contactEmail: '', isPrimary: true },
        { name: '', role: 'Striker', contactEmail: '', isPrimary: true },
        { name: '', role: 'Defender', contactEmail: '', isPrimary: true },
        { name: '', role: 'Central', contactEmail: '', isPrimary: true }
      ]
    });
  };

  const getRoleEmoji = (role) => {
    return '';
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
              placeholder="e.g., Red Dragons"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Team Type *</label>
            <select
              value={formData.teamType}
              onChange={(e) => setFormData({ ...formData, teamType: e.target.value })}
              style={styles.input}
            >
              <option value="School">School</option>
              <option value="Corporate">Corporate</option>
              <option value="Independent">Independent</option>
            </select>
          </div>

          {formData.teamType === 'School' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>School (Optional)</label>
              <select
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Select School (Optional) --</option>
                {schools.map(school => (
                  <option key={school._id} value={school._id}>
                    {school.name} - {school.location.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Location *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, city: e.target.value }
                })}
                style={styles.input}
                placeholder="City *"
                required
              />
              <input
                type="text"
                value={formData.location.state}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, state: e.target.value }
                })}
                style={styles.input}
                placeholder="State"
              />
            </div>
            <input
              type="text"
              value={formData.location.country}
              onChange={(e) => setFormData({
                ...formData,
                location: { ...formData.location, country: e.target.value }
              })}
              style={{...styles.input, marginTop: '10px'}}
              placeholder="Country"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Captain Name</label>
            <input
              type="text"
              value={formData.captain}
              onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
              style={styles.input}
              placeholder="e.g., John Doe"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Team Color</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              style={styles.colorInput}
            />
          </div>

          <div style={styles.membersSection}>
            <h4 style={styles.sectionTitle}>Team Members</h4>
            <p style={styles.helperText}>Upload photo (optional), enter name, select role, and add jersey number (optional) for each member</p>

            {formData.members.slice(0, 4).map((member, index) => (
              <div key={index} style={styles.memberRow}>
                <div style={styles.memberNumber}>#{index + 1}</div>

                {/* Photo Upload */}
                <div style={styles.photoUpload}>
                  {member.photo ? (
                    <img src={member.photo} alt="Member" style={styles.memberPhoto} />
                  ) : (
                    <div style={styles.noPhoto}>No Photo</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(index, e.target.files[0])}
                    style={styles.fileInput}
                  />
                </div>

                {/* Name */}
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                  style={styles.memberInput}
                  placeholder="Player name"
                  required
                />

                {/* Role */}
                <select
                  value={member.role}
                  onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                  style={styles.memberSelect}
                  required
                >
                  <option value="Forward">Forward</option>
                  <option value="Defender">Defender</option>
                  <option value="Striker">Striker</option>
                  <option value="Central">Central</option>
                  <option value="Substitute">Substitute</option>
                </select>

                {/* Jersey Number */}
                <input
                  type="number"
                  value={member.jerseyNumber}
                  onChange={(e) => handleMemberChange(index, 'jerseyNumber', e.target.value)}
                  style={{...styles.memberInput, width: '80px'}}
                  placeholder="Jersey #"
                  min="1"
                  max="99"
                />
              </div>
            ))}
          </div>

          {formData.members.length > 4 && (
            <div style={styles.membersSection}>
              <h4 style={styles.sectionTitle}>Additional Members</h4>

              {formData.members.slice(4).map((member, index) => (
                <div key={index + 4} style={styles.memberRow}>
                  {/* Photo Upload */}
                  <div style={styles.photoUpload}>
                    {member.photo ? (
                      <img src={member.photo} alt="Member" style={styles.memberPhoto} />
                    ) : (
                      <div style={styles.noPhoto}>No Photo</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(index + 4, e.target.files[0])}
                      style={styles.fileInput}
                    />
                  </div>

                  {/* Name */}
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleMemberChange(index + 4, 'name', e.target.value)}
                    style={styles.memberInput}
                    placeholder="Player name"
                  />

                  {/* Role */}
                  <select
                    value={member.role}
                    onChange={(e) => handleMemberChange(index + 4, 'role', e.target.value)}
                    style={styles.memberSelect}
                  >
                    <option value="Forward">Forward</option>
                    <option value="Defender">Defender</option>
                    <option value="Striker">Striker</option>
                    <option value="Central">Central</option>
                    <option value="Substitute">Substitute</option>
                  </select>

                  {/* Jersey Number */}
                  <input
                    type="number"
                    value={member.jerseyNumber}
                    onChange={(e) => handleMemberChange(index + 4, 'jerseyNumber', e.target.value)}
                    style={{...styles.memberInput, width: '80px'}}
                    placeholder="Jersey #"
                    min="1"
                    max="99"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeMember(index + 4)}
                    style={styles.removeButton}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addExtraMember}
            style={styles.addMemberButton}
          >
            + Add Extra Member
          </button>

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
                <h3 style={styles.cardTitle}>
                  <span style={{ ...styles.colorBadge, backgroundColor: team.color }}></span>
                  {team.name}
                </h3>
              </div>

              <div style={styles.cardInfo}>
                {team.captain && (
                  <p style={styles.infoRow}>
                    <strong>Captain:</strong> {team.captain}
                  </p>
                )}
                {team.members && team.members.length > 0 && (
                  <div style={styles.membersList}>
                    <strong>Members:</strong>
                    {team.members.map((member, idx) => (
                      <div key={idx} style={styles.memberBadge}>
                        {getRoleEmoji(member.role)} {member.name} ({member.role})
                      </div>
                    ))}
                  </div>
                )}
                <p style={styles.infoRow}>
                  <strong>Wins:</strong> {team.wins || 0} | <strong>Losses:</strong> {team.losses || 0}
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
    margin: '0 auto',
    padding: '20px'
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
  colorInput: {
    width: '100px',
    height: '40px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  membersSection: {
    marginTop: '24px',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px'
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  helperText: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#888',
    fontStyle: 'italic'
  },
  memberRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
    alignItems: 'center'
  },
  memberNumber: {
    minWidth: '50px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#aaa'
  },
  photoUpload: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px'
  },
  memberPhoto: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #4CAF50'
  },
  noPhoto: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#666',
    border: '2px solid #444'
  },
  fileInput: {
    fontSize: '10px',
    color: '#aaa',
    width: '60px'
  },
  memberInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '8px',
    color: '#fff',
    fontSize: '13px'
  },
  memberSelect: {
    minWidth: '160px',
    backgroundColor: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '8px',
    color: '#fff',
    fontSize: '13px'
  },
  removeButton: {
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  addMemberButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '16px',
    width: '100%'
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  loadingText: {
    textAlign: 'center',
    color: '#888',
    padding: '40px',
    gridColumn: '1 / -1'
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    padding: '40px',
    gridColumn: '1 / -1'
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
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  colorBadge: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  cardInfo: {
    marginBottom: '16px'
  },
  infoRow: {
    margin: '8px 0',
    fontSize: '14px',
    color: '#ccc'
  },
  membersList: {
    margin: '8px 0'
  },
  memberBadge: {
    display: 'inline-block',
    backgroundColor: '#2a2a2a',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    margin: '4px 4px 0 0',
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
