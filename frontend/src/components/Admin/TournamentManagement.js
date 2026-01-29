import React, { useState, useEffect } from 'react';
import {
  uploadTournamentBanner,
  uploadTournamentGallery,
  deleteTournamentGalleryImage,
  setManOfTournament,
  setTournamentWinners,
  getTournamentById
} from '../../services/api';
import defaultBanner from '../../assets/logo.png';
import TournamentAwardsManager from './TournamentAwardsManager';

const BACKEND_URL = process.env.REACT_APP_API_URL || '${BACKEND_URL}';

// Helper function to get full image URL
const getImageUrl = (path) => {
  if (!path) return '';
  // If already a full URL (starts with http:// or https://), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Otherwise, prepend BACKEND_URL
  return `${BACKEND_URL}${path}`;
};

const TournamentManagement = ({ tournament: initialTournament, teams, onClose, onUpdate }) => {
  const [tournament, setTournament] = useState(initialTournament);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('banner');

  // Banner upload
  const [bannerFile, setBannerFile] = useState(null);

  // Gallery upload
  const [galleryFiles, setGalleryFiles] = useState([]);

  // Winners
  const [winnersData, setWinnersData] = useState({
    champion: tournament.winners?.champion?._id || '',
    runnerUp: tournament.winners?.runnerUp?._id || '',
    thirdPlace: tournament.winners?.thirdPlace?._id || ''
  });

  // Man of Tournament
  const [motData, setMotData] = useState({
    playerName: tournament.manOfTheTournament?.playerName || '',
    team: tournament.manOfTheTournament?.team?._id || '',
    photo: null,
    stats: tournament.manOfTheTournament?.stats || {
      goals: 0,
      assists: 0,
      matchesPlayed: 0
    }
  });

  const refreshTournament = async () => {
    try {
      const response = await getTournamentById(tournament._id);
      if (response.success) {
        setTournament(response.data);
        if (onUpdate) onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error refreshing tournament:', error);
    }
  };

  const handleBannerUpload = async () => {
    if (!bannerFile) {
      alert('Please select a banner image');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('banner', bannerFile);

      const response = await uploadTournamentBanner(tournament._id, formData);
      if (response.success) {
        alert('Banner uploaded successfully!');
        setBannerFile(null);
        await refreshTournament();
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert(error.response?.data?.message || 'Failed to upload banner');
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryUpload = async () => {
    if (!galleryFiles || galleryFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Array.from(galleryFiles).forEach(file => {
        formData.append('images', file);
      });

      const response = await uploadTournamentGallery(tournament._id, formData);
      if (response.success) {
        alert(`${galleryFiles.length} image(s) uploaded successfully!`);
        setGalleryFiles([]);
        await refreshTournament();
      }
    } catch (error) {
      console.error('Error uploading gallery:', error);
      alert(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGalleryImage = async (index) => {
    if (!window.confirm('Delete this image from gallery?')) return;

    setLoading(true);
    try {
      const response = await deleteTournamentGalleryImage(tournament._id, index);
      if (response.success) {
        alert('Image deleted successfully!');
        await refreshTournament();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(error.response?.data?.message || 'Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  const handleSetWinners = async () => {
    setLoading(true);
    try {
      const response = await setTournamentWinners(tournament._id, winnersData);
      if (response.success) {
        alert('Winners set successfully!');
        await refreshTournament();
      }
    } catch (error) {
      console.error('Error setting winners:', error);
      alert(error.response?.data?.message || 'Failed to set winners');
    } finally {
      setLoading(false);
    }
  };

  const handleSetManOfTournament = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('playerName', motData.playerName);
      formData.append('team', motData.team);
      formData.append('stats', JSON.stringify(motData.stats));
      if (motData.photo) {
        formData.append('photo', motData.photo);
      }

      const response = await setManOfTournament(tournament._id, formData);
      if (response.success) {
        alert('Man of the Tournament set successfully!');
        setMotData({ ...motData, photo: null });
        await refreshTournament();
      }
    } catch (error) {
      console.error('Error setting Man of Tournament:', error);
      alert(error.response?.data?.message || 'Failed to set Man of the Tournament');
    } finally {
      setLoading(false);
    }
  };

  // Get tournament teams for dropdown
  const tournamentTeams = tournament.registeredTeams || [];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Manage: {tournament.name}</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveSection('banner')}
            style={activeSection === 'banner' ? styles.tabActive : styles.tab}
          >
            Banner
          </button>
          <button
            onClick={() => setActiveSection('gallery')}
            style={activeSection === 'gallery' ? styles.tabActive : styles.tab}
          >
            Gallery ({tournament.media?.gallery?.length || 0})
          </button>
          <button
            onClick={() => setActiveSection('winners')}
            style={activeSection === 'winners' ? styles.tabActive : styles.tab}
          >
            Winners
          </button>
          <button
            onClick={() => setActiveSection('mot')}
            style={activeSection === 'mot' ? styles.tabActive : styles.tab}
          >
            Man of Tournament
          </button>
          <button
            onClick={() => setActiveSection('teams')}
            style={activeSection === 'teams' ? styles.tabActive : styles.tab}
          >
            Teams ({tournamentTeams.length})
          </button>
          <button
            onClick={() => setActiveSection('awards')}
            style={activeSection === 'awards' ? styles.tabActive : styles.tab}
          >
            🏆 Awards & Points
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* BANNER SECTION */}
          {activeSection === 'banner' && (
            <div>
              <h3 style={styles.sectionTitle}>Tournament Banner</h3>

              {tournament.media?.bannerImage ? (
                <div style={styles.currentBanner}>
                  <p style={styles.label}>Current Banner:</p>
                  <img
                    src={getImageUrl(tournament.media.bannerImage)}
                    alt="Current Banner"
                    style={styles.bannerPreview}
                  />
                </div>
              ) : (
                <div style={styles.currentBanner}>
                  <p style={styles.label}>Default Banner:</p>
                  <img
                    src={defaultBanner}
                    alt="Default Banner"
                    style={styles.bannerPreview}
                  />
                </div>
              )}

              <div style={styles.uploadSection}>
                <label style={styles.label}>Upload New Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files[0])}
                  style={styles.fileInput}
                />
                {bannerFile && (
                  <p style={styles.fileName}>Selected: {bannerFile.name}</p>
                )}
                <button
                  onClick={handleBannerUpload}
                  disabled={!bannerFile || loading}
                  style={styles.uploadButton}
                >
                  {loading ? 'Uploading...' : 'Upload Banner'}
                </button>
              </div>
            </div>
          )}

          {/* GALLERY SECTION */}
          {activeSection === 'gallery' && (
            <div>
              <h3 style={styles.sectionTitle}>Photo Gallery</h3>

              {/* Current Gallery */}
              {tournament.media?.gallery?.length > 0 && (
                <div style={styles.gallerySection}>
                  <p style={styles.label}>Current Gallery Images:</p>
                  <div style={styles.galleryGrid}>
                    {tournament.media.gallery.map((image, index) => (
                      <div key={index} style={styles.galleryItem}>
                        <img
                          src={getImageUrl(image)}
                          alt={`Gallery ${index + 1}`}
                          style={styles.galleryImage}
                        />
                        <button
                          onClick={() => handleDeleteGalleryImage(index)}
                          style={styles.deleteImageButton}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              <div style={styles.uploadSection}>
                <label style={styles.label}>Upload New Images (Max 10)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setGalleryFiles(e.target.files)}
                  style={styles.fileInput}
                />
                {galleryFiles.length > 0 && (
                  <p style={styles.fileName}>
                    {galleryFiles.length} file(s) selected
                  </p>
                )}
                <button
                  onClick={handleGalleryUpload}
                  disabled={!galleryFiles.length || loading}
                  style={styles.uploadButton}
                >
                  {loading ? 'Uploading...' : 'Upload Images'}
                </button>
              </div>
            </div>
          )}

          {/* WINNERS SECTION */}
          {activeSection === 'winners' && (
            <div>
              <h3 style={styles.sectionTitle}>Set Tournament Winners</h3>

              <div style={styles.formGroup}>
                <label style={styles.label}>🥇 Champion</label>
                <select
                  value={winnersData.champion}
                  onChange={(e) => setWinnersData({ ...winnersData, champion: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select Champion</option>
                  {tournamentTeams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>🥈 Runner Up</label>
                <select
                  value={winnersData.runnerUp}
                  onChange={(e) => setWinnersData({ ...winnersData, runnerUp: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select Runner Up</option>
                  {tournamentTeams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>🥉 Third Place</label>
                <select
                  value={winnersData.thirdPlace}
                  onChange={(e) => setWinnersData({ ...winnersData, thirdPlace: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select Third Place</option>
                  {tournamentTeams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSetWinners}
                disabled={loading}
                style={styles.saveButton}
              >
                {loading ? 'Saving...' : 'Set Winners'}
              </button>
            </div>
          )}

          {/* MAN OF TOURNAMENT SECTION */}
          {activeSection === 'mot' && (
            <div>
              <h3 style={styles.sectionTitle}>Man of the Tournament</h3>

              {tournament.manOfTheTournament?.playerName && (
                <div style={styles.currentMotSection}>
                  <p style={styles.label}>Current Man of Tournament:</p>
                  <div style={styles.motPreview}>
                    {tournament.manOfTheTournament.photo && (
                      <img
                        src={getImageUrl(tournament.manOfTheTournament.photo)}
                        alt={tournament.manOfTheTournament.playerName}
                        style={styles.motPhotoPreview}
                      />
                    )}
                    <div>
                      <p style={styles.motNamePreview}>{tournament.manOfTheTournament.playerName}</p>
                      <p style={styles.motTeamPreview}>
                        Team: {tournament.manOfTheTournament.team?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Player Name *</label>
                <input
                  type="text"
                  value={motData.playerName}
                  onChange={(e) => setMotData({ ...motData, playerName: e.target.value })}
                  style={styles.input}
                  placeholder="Enter player name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Team *</label>
                <select
                  value={motData.team}
                  onChange={(e) => setMotData({ ...motData, team: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select Team</option>
                  {tournamentTeams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Player Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMotData({ ...motData, photo: e.target.files[0] })}
                  style={styles.fileInput}
                />
                {motData.photo && (
                  <p style={styles.fileName}>Selected: {motData.photo.name}</p>
                )}
              </div>

              <div style={styles.statsRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Goals</label>
                  <input
                    type="number"
                    value={motData.stats.goals}
                    onChange={(e) => setMotData({
                      ...motData,
                      stats: { ...motData.stats, goals: parseInt(e.target.value) || 0 }
                    })}
                    style={styles.input}
                    min="0"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Assists</label>
                  <input
                    type="number"
                    value={motData.stats.assists}
                    onChange={(e) => setMotData({
                      ...motData,
                      stats: { ...motData.stats, assists: parseInt(e.target.value) || 0 }
                    })}
                    style={styles.input}
                    min="0"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Matches Played</label>
                  <input
                    type="number"
                    value={motData.stats.matchesPlayed}
                    onChange={(e) => setMotData({
                      ...motData,
                      stats: { ...motData.stats, matchesPlayed: parseInt(e.target.value) || 0 }
                    })}
                    style={styles.input}
                    min="0"
                  />
                </div>
              </div>

              <button
                onClick={handleSetManOfTournament}
                disabled={!motData.playerName || !motData.team || loading}
                style={styles.saveButton}
              >
                {loading ? 'Saving...' : 'Set Man of the Tournament'}
              </button>
            </div>
          )}

          {/* TEAMS SECTION */}
          {activeSection === 'teams' && (
            <div>
              <h3 style={styles.sectionTitle}>Registered Teams</h3>
              {tournamentTeams.length === 0 ? (
                <p style={styles.emptyText}>No teams registered yet</p>
              ) : (
                <div style={styles.teamsList}>
                  {tournamentTeams.map((team, index) => (
                    <div key={team._id} style={styles.teamItem}>
                      <span style={styles.teamNumber}>{index + 1}.</span>
                      <div style={styles.teamInfo}>
                        <p style={styles.teamName}>{team.name}</p>
                        <p style={styles.teamLocation}>
                          {team.location?.city}, {team.location?.state}
                        </p>
                      </div>
                      <span style={styles.teamType}>{team.teamType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AWARDS & POINTS SECTION */}
          {activeSection === 'awards' && (
            <div>
              <TournamentAwardsManager tournamentId={tournament._id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    padding: '50px',
    overflow: 'auto'
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '1000px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #333',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    margin: 'auto',
    position: 'relative'
  },
  modalHeader: {
    padding: '28px 32px',
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#fff'
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    padding: '16px 32px 0 32px',
    borderBottom: '2px solid #333',
    overflowX: 'auto'
  },
  tab: {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#888',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid #00d4ff',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00d4ff',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  content: {
    padding: '30px 32px',
    overflowY: 'auto',
    flex: 1
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#fff',
    borderBottom: '2px solid #333',
    paddingBottom: '10px'
  },
  currentBanner: {
    marginBottom: '24px'
  },
  bannerPreview: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginTop: '8px'
  },
  uploadSection: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #333'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '8px'
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    marginBottom: '12px'
  },
  fileName: {
    fontSize: '13px',
    color: '#00d4ff',
    marginBottom: '12px'
  },
  uploadButton: {
    width: '100%',
    backgroundColor: '#00d4ff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  gallerySection: {
    marginBottom: '24px'
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '12px'
  },
  galleryItem: {
    position: 'relative'
  },
  galleryImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px'
  },
  deleteImageButton: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    backgroundColor: '#ff4444',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  formGroup: {
    marginBottom: '20px'
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
  saveButton: {
    width: '100%',
    backgroundColor: '#00d4ff',
    border: 'none',
    borderRadius: '6px',
    padding: '14px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '12px'
  },
  currentMotSection: {
    marginBottom: '24px',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #333'
  },
  motPreview: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginTop: '12px'
  },
  motPhotoPreview: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #00d4ff'
  },
  motNamePreview: {
    fontSize: '18px',
    color: '#fff',
    fontWeight: 'bold',
    margin: '0 0 4px 0'
  },
  motTeamPreview: {
    fontSize: '14px',
    color: '#888',
    margin: 0
  },
  statsRow: {
    display: 'flex',
    gap: '16px'
  },
  teamsList: {
    display: 'grid',
    gap: '12px'
  },
  teamItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  teamNumber: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#00d4ff',
    minWidth: '30px'
  },
  teamInfo: {
    flex: 1
  },
  teamName: {
    fontSize: '16px',
    color: '#fff',
    fontWeight: 'bold',
    margin: '0 0 4px 0'
  },
  teamLocation: {
    fontSize: '14px',
    color: '#888',
    margin: 0
  },
  teamType: {
    fontSize: '13px',
    color: '#aaa',
    padding: '4px 12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '12px'
  },
  emptyText: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#888'
  }
};

export default TournamentManagement;
