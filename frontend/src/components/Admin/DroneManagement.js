// frontend/src/components/Admin/DroneManagement.js
import React, { useState, useEffect } from 'react';
import {
  getAllDrones,
  createDrone,
  updateDrone,
  deleteDrone,
  getRoleSpecs
} from '../../services/api';
import './DroneManagement.css';

const DroneManagement = () => {
  const [drones, setDrones] = useState([]);
  const [filteredDrones, setFilteredDrones] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [roleSpecs, setRoleSpecs] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDrone, setEditingDrone] = useState(null);
  const [formData, setFormData] = useState({
    droneId: '',
    role: 'Forward',
    status: 'Active',
    specifications: {
      speed: 0,
      agility: 0,
      stability: 0,
      batteryCapacity: 0,
      weight: 0
    }
  });

  useEffect(() => {
    loadDrones();
    loadRoleSpecs();
  }, []);

  useEffect(() => {
    if (roleFilter === 'All') {
      setFilteredDrones(drones);
    } else {
      setFilteredDrones(drones.filter(d => d.role === roleFilter));
    }
  }, [roleFilter, drones]);

  const loadDrones = async () => {
    try {
      const response = await getAllDrones();
      if (response.success) {
        setDrones(response.data);
      }
    } catch (error) {
      console.error('Error loading drones:', error);
      alert('Failed to load drones');
    }
  };

  const loadRoleSpecs = async () => {
    try {
      const response = await getRoleSpecs();
      if (response.success) {
        setRoleSpecs(response.data);
      }
    } catch (error) {
      console.error('Error loading role specs:', error);
    }
  };

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role,
      specifications: roleSpecs[role] || formData.specifications
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSpecChange = (field, value) => {
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        [field]: parseFloat(value) || 0
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingDrone) {
        const response = await updateDrone(editingDrone._id, formData);
        if (response.success) {
          alert('Drone updated successfully!');
          resetForm();
          loadDrones();
        }
      } else {
        const response = await createDrone(formData);
        if (response.success) {
          alert('Drone created successfully!');
          resetForm();
          loadDrones();
        }
      }
    } catch (error) {
      console.error('Error saving drone:', error);
      alert(error.response?.data?.message || 'Failed to save drone');
    }
  };

  const handleEdit = (drone) => {
    setEditingDrone(drone);
    setFormData({
      droneId: drone.droneId,
      role: drone.role,
      status: drone.status,
      specifications: drone.specifications
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (droneId, droneName) => {
    if (!window.confirm(`Are you sure you want to delete drone ${droneName}?`)) {
      return;
    }

    try {
      const response = await deleteDrone(droneId);
      if (response.success) {
        alert('Drone deleted successfully!');
        loadDrones();
      }
    } catch (error) {
      console.error('Error deleting drone:', error);
      alert('Failed to delete drone');
    }
  };

  const resetForm = () => {
    setFormData({
      droneId: '',
      role: 'Forward',
      status: 'Active',
      specifications: roleSpecs['Forward'] || {
        speed: 0,
        agility: 0,
        stability: 0,
        batteryCapacity: 0,
        weight: 0
      }
    });
    setEditingDrone(null);
    setIsFormOpen(false);
  };

  const getRoleEmoji = (role) => {
    return '';
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: '#00d4ff',
      Inactive: '#9E9E9E',
      Maintenance: '#ffab00'
    };
    return colors[status] || '#9E9E9E';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Drone Management</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          style={styles.addButton}
        >
          + Add Drone
        </button>
      </div>

      {/* Role Filter */}
      <div style={styles.filterSection}>
        <label style={styles.filterLabel}>Filter by Role:</label>
        <div style={styles.filterButtons}>
          {['All', 'Forward', 'Striker', 'Defender', 'Keeper'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              style={{
                ...styles.filterButton,
                ...(roleFilter === role ? styles.filterButtonActive : {})
              }}
            >
              {role !== 'All' && getRoleEmoji(role)} {role}
            </button>
          ))}
        </div>
      </div>

      {/* Drone List */}
      <div style={styles.droneGrid}>
        {filteredDrones.length === 0 ? (
          <p style={styles.emptyMessage}>No drones found. Create one to get started!</p>
        ) : (
          filteredDrones.map(drone => (
            <div key={drone._id} style={styles.droneCard}>
              <div style={styles.droneHeader}>
                <span style={styles.droneId}>{drone.droneId}</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(drone.status)
                  }}
                >
                  {drone.status}
                </span>
              </div>

              <div style={styles.droneRole}>
                {getRoleEmoji(drone.role)} {drone.role}
              </div>

              <div style={styles.specs}>
                <div style={styles.specRow}>
                  <span>Speed:</span>
                  <span>{drone.specifications.speed} cm/s</span>
                </div>
                <div style={styles.specRow}>
                  <span>Agility:</span>
                  <span>{drone.specifications.agility} deg/s</span>
                </div>
                <div style={styles.specRow}>
                  <span>Stability:</span>
                  <span>{drone.specifications.stability}/100</span>
                </div>
                <div style={styles.specRow}>
                  <span>Battery:</span>
                  <span>{drone.specifications.batteryCapacity} mAh</span>
                </div>
              </div>

              <div style={styles.droneActions}>
                <button
                  onClick={() => handleEdit(drone)}
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(drone._id, drone.droneId)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drone Form Modal */}
      {isFormOpen && (
        <div style={styles.modalOverlay} onClick={resetForm}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingDrone ? 'Edit Drone' : 'Create New Drone'}
            </h3>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Drone ID:</label>
                <input
                  type="text"
                  name="droneId"
                  value={formData.droneId}
                  onChange={handleInputChange}
                  placeholder="e.g., R1, B1, D1"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role:</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={styles.select}
                >
                  <option value="Forward">Forward</option>
                  <option value="Striker">Striker</option>
                  <option value="Defender">Defender</option>
                  <option value="Keeper">Keeper</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Status:</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div style={styles.specsSection}>
                <h4 style={styles.specsTitle}>Specifications:</h4>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Speed (cm/s):</label>
                  <input
                    type="number"
                    value={formData.specifications.speed}
                    onChange={(e) => handleSpecChange('speed', e.target.value)}
                    min="0"
                    max="200"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Agility (deg/s):</label>
                  <input
                    type="number"
                    value={formData.specifications.agility}
                    onChange={(e) => handleSpecChange('agility', e.target.value)}
                    min="0"
                    max="100"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Stability (0-100):</label>
                  <input
                    type="number"
                    value={formData.specifications.stability}
                    onChange={(e) => handleSpecChange('stability', e.target.value)}
                    min="0"
                    max="100"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Battery Capacity (mAh):</label>
                  <input
                    type="number"
                    value={formData.specifications.batteryCapacity}
                    onChange={(e) => handleSpecChange('batteryCapacity', e.target.value)}
                    min="1000"
                    max="5000"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Weight (grams):</label>
                  <input
                    type="number"
                    value={formData.specifications.weight}
                    onChange={(e) => handleSpecChange('weight', e.target.value)}
                    min="100"
                    max="500"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.submitButton}>
                  {editingDrone ? 'Update Drone' : 'Create Drone'}
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
    background: 'linear-gradient(135deg, rgba(0, 79, 249, 0.3), rgba(0, 123, 255, 0.2))', color: '#00d4ff', border: '1px solid rgba(0, 123, 255, 0.5)', boxShadow: '0 0 15px rgba(0, 123, 255, 0.3)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  filterSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  filterLabel: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  filterButtonActive: {
    background: 'linear-gradient(135deg, rgba(0, 79, 249, 0.3), rgba(0, 123, 255, 0.2))', color: '#00d4ff', border: '1px solid rgba(0, 123, 255, 0.5)',
    color: 'white',
    borderColor: '#00d4ff'
  },
  droneGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
    gap: '20px'
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '16px',
    gridColumn: '1 / -1'
  },
  droneCard: {
    backgroundColor: 'rgba(0, 13, 41, 0.3)',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(0, 123, 255, 0.3)',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 0 20px rgba(0, 123, 255, 0.15)',
    transition: 'all 0.3s ease'
  },
  droneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  droneId: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    color: 'white',
    fontWeight: 'bold'
  },
  droneRole: {
    fontSize: '16px',
    color: '#64748b',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eee'
  },
  specs: {
    marginBottom: '12px'
  },
  specRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '14px',
    color: '#555'
  },
  droneActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px'
  },
  editButton: {
    flex: 1,
    padding: '8px',
    background: 'linear-gradient(135deg, rgba(0, 79, 249, 0.3), rgba(0, 123, 255, 0.2))', color: '#00d4ff', border: '1px solid rgba(0, 123, 255, 0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  deleteButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
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
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
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
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  select: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  specsSection: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    marginTop: '8px'
  },
  specsTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px'
  },
  submitButton: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, rgba(0, 79, 249, 0.3), rgba(0, 123, 255, 0.2))', color: '#00d4ff', border: '1px solid rgba(0, 123, 255, 0.5)', boxShadow: '0 0 15px rgba(0, 123, 255, 0.3)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#9E9E9E',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default DroneManagement;
