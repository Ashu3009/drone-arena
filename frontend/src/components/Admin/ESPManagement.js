import React, { useState, useEffect } from 'react';
import { getAllESPs, registerESP, updateESP, deleteESP, checkOfflineESPs } from '../../services/api';
import './ESPManagement.css';

const ESPManagement = () => {
  const [espDevices, setEspDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedESP, setSelectedESP] = useState(null);
  const [formData, setFormData] = useState({
    macAddress: '',
    droneId: 'R1',
    role: 'Forward',
    nickname: '',
    deviceType: 'ESP32-Dev'
  });

  useEffect(() => {
    fetchESPs();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchESPs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchESPs = async () => {
    try {
      const response = await getAllESPs();
      if (response.success) {
        setEspDevices(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ESPs:', error);
      setLoading(false);
    }
  };

  const handleAddESP = async (e) => {
    e.preventDefault();
    try {
      const response = await registerESP(formData);
      if (response.success) {
        alert('ESP registered successfully!');
        setShowAddModal(false);
        setFormData({
          macAddress: '',
          droneId: 'R1',
          role: 'Forward',
          nickname: '',
          deviceType: 'ESP32-Dev'
        });
        fetchESPs();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register ESP');
    }
  };

  const handleUpdateESP = async (e) => {
    e.preventDefault();
    try {
      const response = await updateESP(selectedESP._id, formData);
      if (response.success) {
        alert('ESP updated successfully!');
        setShowEditModal(false);
        setSelectedESP(null);
        fetchESPs();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update ESP');
    }
  };

  const handleDeleteESP = async (espId, droneId) => {
    if (window.confirm(`Are you sure you want to delete ${droneId}?`)) {
      try {
        await deleteESP(espId);
        alert('ESP deleted successfully!');
        fetchESPs();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete ESP');
      }
    }
  };

  const handleEditClick = (esp) => {
    setSelectedESP(esp);
    setFormData({
      macAddress: esp.macAddress,
      droneId: esp.droneId,
      role: esp.role,
      nickname: esp.nickname || '',
      deviceType: esp.deviceType
    });
    setShowEditModal(true);
  };

  const handleCheckOffline = async () => {
    try {
      const response = await checkOfflineESPs();
      alert(response.message);
      fetchESPs();
    } catch (error) {
      alert('Failed to check offline ESPs');
    }
  };

  const getStatusColor = (status) => {
    return status === 'online' ? '#00d4ff' : '#f44336';
  };

  const getTeamColor = (droneId) => {
    return droneId.startsWith('R') ? '#dc2626' : '#2563eb';
  };

  const formatLastSeen = (lastSeen) => {
    const seconds = Math.floor((Date.now() - new Date(lastSeen)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (loading) {
    return <div className="esp-loading">Loading ESP devices...</div>;
  }

  return (
    <div className="esp-management">
      <div className="esp-header">
        <h1>ESP Device Management</h1>
        <div className="esp-header-actions">
          <button onClick={handleCheckOffline} className="esp-btn-secondary">
            Check Offline
          </button>
          <button onClick={() => setShowAddModal(true)} className="esp-btn-primary">
            + Register ESP
          </button>
        </div>
      </div>

      <div className="esp-stats">
        <div className="esp-stat-card">
          <span className="esp-stat-value">{espDevices.length}</span>
          <span className="esp-stat-label">Total ESPs</span>
        </div>
        <div className="esp-stat-card">
          <span className="esp-stat-value" style={{ color: '#00d4ff' }}>
            {espDevices.filter(e => e.status === 'online').length}
          </span>
          <span className="esp-stat-label">Online</span>
        </div>
        <div className="esp-stat-card">
          <span className="esp-stat-value" style={{ color: '#f44336' }}>
            {espDevices.filter(e => e.status === 'offline').length}
          </span>
          <span className="esp-stat-label">Offline</span>
        </div>
      </div>

      <div className="esp-grid">
        {espDevices.map((esp) => (
          <div key={esp._id} className="esp-card">
            <div className="esp-card-header">
              <div className="esp-status-indicator" style={{ backgroundColor: getStatusColor(esp.status) }}></div>
              <h3 className="esp-drone-id" style={{ color: getTeamColor(esp.droneId) }}>
                {esp.droneId}
              </h3>
              <span className="esp-role-badge">{esp.role}</span>
            </div>

            <div className="esp-card-body">
              <div className="esp-info-row">
                <span className="esp-label">MAC Address:</span>
                <span className="esp-value">{esp.macAddress}</span>
              </div>
              <div className="esp-info-row">
                <span className="esp-label">Device Type:</span>
                <span className="esp-value">{esp.deviceType}</span>
              </div>
              <div className="esp-info-row">
                <span className="esp-label">Status:</span>
                <span className="esp-value" style={{ color: getStatusColor(esp.status), fontWeight: 'bold' }}>
                  {esp.status.toUpperCase()}
                </span>
              </div>
              <div className="esp-info-row">
                <span className="esp-label">Last Seen:</span>
                <span className="esp-value">{formatLastSeen(esp.lastSeen)}</span>
              </div>
              {esp.nickname && (
                <div className="esp-info-row">
                  <span className="esp-label">Nickname:</span>
                  <span className="esp-value">{esp.nickname}</span>
                </div>
              )}
              {esp.ipAddress && (
                <div className="esp-info-row">
                  <span className="esp-label">IP Address:</span>
                  <span className="esp-value">{esp.ipAddress}</span>
                </div>
              )}
            </div>

            <div className="esp-card-actions">
              <button onClick={() => handleEditClick(esp)} className="esp-btn-edit">
                Edit
              </button>
              <button onClick={() => handleDeleteESP(esp._id, esp.droneId)} className="esp-btn-delete">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {espDevices.length === 0 && (
        <div className="esp-empty">
          <p>No ESP devices registered</p>
          <button onClick={() => setShowAddModal(true)} className="esp-btn-primary">
            Register First ESP
          </button>
        </div>
      )}

      {/* Add ESP Modal */}
      {showAddModal && (
        <div className="esp-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="esp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Register New ESP</h2>
            <form onSubmit={handleAddESP}>
              <div className="esp-form-group">
                <label>MAC Address *</label>
                <input
                  type="text"
                  placeholder="AA:BB:CC:DD:EE:01"
                  value={formData.macAddress}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                  required
                />
              </div>

              <div className="esp-form-group">
                <label>Drone ID *</label>
                <select
                  value={formData.droneId}
                  onChange={(e) => setFormData({ ...formData, droneId: e.target.value })}
                  required
                >
                  <optgroup label="Red Team">
                    <option value="R1">R1</option>
                    <option value="R2">R2</option>
                    <option value="R3">R3</option>
                    <option value="R4">R4</option>
                    <option value="R5">R5</option>
                    <option value="R6">R6</option>
                    <option value="R7">R7</option>
                    <option value="R8">R8</option>
                  </optgroup>
                  <optgroup label="Blue Team">
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="B3">B3</option>
                    <option value="B4">B4</option>
                    <option value="B5">B5</option>
                    <option value="B6">B6</option>
                    <option value="B7">B7</option>
                    <option value="B8">B8</option>
                  </optgroup>
                </select>
              </div>

              <div className="esp-form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="Forward">Forward</option>
                  <option value="Striker">Striker</option>
                  <option value="Defender">Defender</option>
                  <option value="Keeper">Keeper</option>
                </select>
              </div>

              <div className="esp-form-group">
                <label>Device Type *</label>
                <select
                  value={formData.deviceType}
                  onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                  required
                >
                  <option value="ESP32-Dev">ESP32-Dev</option>
                  <option value="ESP32-CAM">ESP32-CAM</option>
                </select>
              </div>

              <div className="esp-form-group">
                <label>Nickname (optional)</label>
                <input
                  type="text"
                  placeholder="Red Forward Drone"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>

              <div className="esp-modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="esp-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="esp-btn-primary">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit ESP Modal */}
      {showEditModal && (
        <div className="esp-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="esp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit ESP Device</h2>
            <form onSubmit={handleUpdateESP}>
              <div className="esp-form-group">
                <label>MAC Address (Read-only)</label>
                <input type="text" value={formData.macAddress} disabled />
              </div>

              <div className="esp-form-group">
                <label>Drone ID *</label>
                <select
                  value={formData.droneId}
                  onChange={(e) => setFormData({ ...formData, droneId: e.target.value })}
                  required
                >
                  <optgroup label="Red Team">
                    <option value="R1">R1</option>
                    <option value="R2">R2</option>
                    <option value="R3">R3</option>
                    <option value="R4">R4</option>
                    <option value="R5">R5</option>
                    <option value="R6">R6</option>
                    <option value="R7">R7</option>
                    <option value="R8">R8</option>
                  </optgroup>
                  <optgroup label="Blue Team">
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="B3">B3</option>
                    <option value="B4">B4</option>
                    <option value="B5">B5</option>
                    <option value="B6">B6</option>
                    <option value="B7">B7</option>
                    <option value="B8">B8</option>
                  </optgroup>
                </select>
              </div>

              <div className="esp-form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="Forward">Forward</option>
                  <option value="Striker">Striker</option>
                  <option value="Defender">Defender</option>
                  <option value="Keeper">Keeper</option>
                </select>
              </div>

              <div className="esp-form-group">
                <label>Device Type *</label>
                <select
                  value={formData.deviceType}
                  onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                  required
                >
                  <option value="ESP32-Dev">ESP32-Dev</option>
                  <option value="ESP32-CAM">ESP32-CAM</option>
                </select>
              </div>

              <div className="esp-form-group">
                <label>Nickname (optional)</label>
                <input
                  type="text"
                  placeholder="Red Forward Drone"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>

              <div className="esp-modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="esp-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="esp-btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ESPManagement;
