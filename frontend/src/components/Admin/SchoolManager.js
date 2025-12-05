// frontend/src/components/Admin/SchoolManager.js
import React, { useState, useEffect } from 'react';
import {
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool
} from '../../services/api';

const SchoolManager = () => {
  const [schools, setSchools] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: {
      city: '',
      state: '',
      country: 'India'
    },
    contactInfo: {
      email: '',
      phone: '',
      coordinatorName: ''
    },
    established: new Date().getFullYear(),
    logo: '',
    description: '',
    status: 'Active'
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const response = await getAllSchools();
      if (response.success) {
        setSchools(response.data);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      alert('Failed to load schools');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLocationChange = (field, value) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        [field]: value
      }
    });
  };

  const handleContactChange = (field, value) => {
    setFormData({
      ...formData,
      contactInfo: {
        ...formData.contactInfo,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingSchool) {
        const response = await updateSchool(editingSchool._id, formData);
        if (response.success) {
          alert('School updated successfully!');
          resetForm();
          loadSchools();
        }
      } else {
        const response = await createSchool(formData);
        if (response.success) {
          alert('School created successfully!');
          resetForm();
          loadSchools();
        }
      }
    } catch (error) {
      console.error('Error saving school:', error);
      alert(error.response?.data?.message || 'Failed to save school');
    }
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      location: school.location,
      contactInfo: school.contactInfo,
      established: school.established || new Date().getFullYear(),
      logo: school.logo || '',
      description: school.description || '',
      status: school.status
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (schoolId, schoolName) => {
    if (!window.confirm(`Are you sure you want to delete ${schoolName}?`)) {
      return;
    }

    try {
      const response = await deleteSchool(schoolId);
      if (response.success) {
        alert('School deleted successfully!');
        loadSchools();
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      alert(error.response?.data?.message || 'Failed to delete school');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: {
        city: '',
        state: '',
        country: 'India'
      },
      contactInfo: {
        email: '',
        phone: '',
        coordinatorName: ''
      },
      established: new Date().getFullYear(),
      logo: '',
      description: '',
      status: 'Active'
    });
    setEditingSchool(null);
    setIsFormOpen(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>School Management</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          style={styles.addButton}
        >
          + Add School
        </button>
      </div>

      {/* Schools Grid */}
      <div style={styles.schoolGrid}>
        {schools.length === 0 ? (
          <p style={styles.emptyMessage}>No schools found. Create one to get started!</p>
        ) : (
          schools.map(school => (
            <div key={school._id} style={styles.schoolCard}>
              <div style={styles.schoolHeader}>
                <h3 style={styles.schoolName}>{school.name}</h3>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: school.status === 'Active' ? '#00d4ff' : '#9E9E9E'
                  }}
                >
                  {school.status}
                </span>
              </div>

              <div style={styles.schoolDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Location:</span>
                  <span>{school.location.city}, {school.location.state}</span>
                </div>
                {school.contactInfo?.coordinatorName && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Coordinator:</span>
                    <span>{school.contactInfo.coordinatorName}</span>
                  </div>
                )}
                {school.contactInfo?.email && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Email:</span>
                    <span style={styles.detailValue}>{school.contactInfo.email}</span>
                  </div>
                )}
                {school.established && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Established:</span>
                    <span>{school.established}</span>
                  </div>
                )}
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Teams:</span>
                  <span style={styles.teamCount}>{school.totalTeams || 0}</span>
                </div>
              </div>

              <div style={styles.schoolActions}>
                <button
                  onClick={() => handleEdit(school)}
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(school._id, school.name)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* School Form Modal */}
      {isFormOpen && (
        <div style={styles.modalOverlay} onClick={resetForm}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingSchool ? 'Edit School' : 'Create New School'}
            </h3>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* School Name */}
              <div style={styles.formGroup}>
                <label style={styles.label}>School Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Delhi Public School"
                  required
                  style={styles.input}
                />
              </div>

              {/* Location Section */}
              <div style={styles.sectionTitle}>Location</div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>City *</label>
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                    placeholder="e.g., Mumbai"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>State</label>
                  <input
                    type="text"
                    value={formData.location.state}
                    onChange={(e) => handleLocationChange('state', e.target.value)}
                    placeholder="e.g., Maharashtra"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Country</label>
                <input
                  type="text"
                  value={formData.location.country}
                  onChange={(e) => handleLocationChange('country', e.target.value)}
                  style={styles.input}
                />
              </div>

              {/* Contact Info Section */}
              <div style={styles.sectionTitle}>Contact Information</div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Coordinator Name</label>
                <input
                  type="text"
                  value={formData.contactInfo.coordinatorName}
                  onChange={(e) => handleContactChange('coordinatorName', e.target.value)}
                  placeholder="e.g., John Doe"
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    placeholder="email@school.com"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone</label>
                  <input
                    type="tel"
                    value={formData.contactInfo.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Other Details */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Established Year</label>
                  <input
                    type="number"
                    name="established"
                    value={formData.established}
                    onChange={handleInputChange}
                    min="1800"
                    max={new Date().getFullYear()}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description about the school..."
                  rows="3"
                  style={{...styles.input, resize: 'vertical'}}
                />
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.submitButton}>
                  {editingSchool ? 'Update School' : 'Create School'}
                </button>
                <button type="button" onClick={resetForm} style={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold'
  },
  addButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, rgba(0, 79, 249, 0.3), rgba(0, 123, 255, 0.2))',
    color: '#00d4ff',
    border: '1px solid rgba(0, 123, 255, 0.5)',
    boxShadow: '0 0 15px rgba(0, 123, 255, 0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  schoolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '16px',
    gridColumn: '1 / -1'
  },
  schoolCard: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  schoolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #f0f0f0'
  },
  schoolName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    color: 'white',
    fontWeight: 'bold'
  },
  schoolDetails: {
    marginBottom: '16px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '14px',
    color: '#555'
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#333'
  },
  detailValue: {
    color: '#00d4ff',
    textDecoration: 'none'
  },
  teamCount: {
    background: 'linear-gradient(135deg, rgba(0, 79, 249, 0.3), rgba(0, 123, 255, 0.2))',
    color: '#00d4ff',
    border: '1px solid rgba(0, 123, 255, 0.5)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  schoolActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '16px'
  },
  editButton: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, rgba(0, 79, 249, 0.3), rgba(0, 123, 255, 0.2))',
    color: '#00d4ff',
    border: '1px solid rgba(0, 123, 255, 0.5)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  deleteButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    margin: '0 0 20px 0',
    fontSize: '22px',
    fontWeight: 'bold'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginTop: '8px',
    paddingBottom: '8px',
    borderBottom: '2px solid #f0f0f0'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px'
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, rgba(0, 79, 249, 0.3), rgba(0, 123, 255, 0.2))',
    color: '#00d4ff',
    border: '1px solid rgba(0, 123, 255, 0.5)',
    boxShadow: '0 0 15px rgba(0, 123, 255, 0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#9E9E9E',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  }
};

export default SchoolManager;
