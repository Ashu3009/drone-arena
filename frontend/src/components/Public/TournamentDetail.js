import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTournamentById, getMatches } from '../../services/api';

const TournamentDetail = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadTournamentData();
  }, [id]);

  const loadTournamentData = async () => {
    setLoading(true);
    try {
      const [tournamentRes, matchesRes] = await Promise.all([
        getTournamentById(id),
        getMatches()
      ]);

      if (tournamentRes.success) {
        setTournament(tournamentRes.data);
      }

      if (matchesRes.success) {
        // Filter matches for this tournament
        const tournamentMatches = matchesRes.data.filter(
          m => m.tournament._id === id || m.tournament === id
        );
        setMatches(tournamentMatches);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = dateFilter
    ? matches.filter(m => {
        const matchDate = new Date(m.scheduledTime).toISOString().split('T')[0];
        return matchDate === dateFilter;
      })
    : matches;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading tournament details...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Tournament not found</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {tournament.media?.bannerImage && (
          <img
            src={`http://localhost:5000${tournament.media.bannerImage}`}
            alt={tournament.name}
            style={styles.banner}
          />
        )}
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{tournament.name}</h1>
          <div style={styles.headerInfo}>
            <span style={styles.location}>
              Location: {tournament.location?.city}, {tournament.location?.state}
            </span>
            <span style={styles.dates}>
              {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
            </span>
            <span style={{...styles.status, backgroundColor: tournament.status === 'completed' ? '#4CAF50' : '#FF9800'}}>
              {tournament.status || 'Upcoming'}
            </span>
          </div>
          {tournament.description && (
            <p style={styles.description}>{tournament.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? styles.tabActive : styles.tab}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          style={activeTab === 'matches' ? styles.tabActive : styles.tab}
        >
          Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          style={activeTab === 'teams' ? styles.tabActive : styles.tab}
        >
          Teams ({tournament.registeredTeams?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('awards')}
          style={activeTab === 'awards' ? styles.tabActive : styles.tab}
        >
          Awards
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          style={activeTab === 'gallery' ? styles.tabActive : styles.tab}
        >
          Gallery ({tournament.media?.gallery?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={styles.sectionTitle}>Champions</h2>
            {tournament.winners?.champion || tournament.winners?.runnerUp || tournament.winners?.thirdPlace ? (
              <div style={styles.winnersGrid}>
                {tournament.winners.champion && (
                  <div style={styles.winnerCard}>
                    <div style={styles.medal}>🥇</div>
                    <h3 style={styles.winnerTitle}>Champion</h3>
                    <p style={styles.winnerTeam}>
                      {tournament.winners.champion.name || 'TBD'}
                    </p>
                  </div>
                )}
                {tournament.winners.runnerUp && (
                  <div style={styles.winnerCard}>
                    <div style={styles.medal}>🥈</div>
                    <h3 style={styles.winnerTitle}>Runner Up</h3>
                    <p style={styles.winnerTeam}>
                      {tournament.winners.runnerUp.name || 'TBD'}
                    </p>
                  </div>
                )}
                {tournament.winners.thirdPlace && (
                  <div style={styles.winnerCard}>
                    <div style={styles.medal}>🥉</div>
                    <h3 style={styles.winnerTitle}>Third Place</h3>
                    <p style={styles.winnerTeam}>
                      {tournament.winners.thirdPlace.name || 'TBD'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p style={styles.emptyText}>Winners will be announced after tournament completion</p>
            )}

            {/* Man of the Tournament */}
            <h2 style={styles.sectionTitle}>Man of the Tournament</h2>
            {tournament.manOfTheTournament?.playerName ? (
              <div style={styles.motCard}>
                {tournament.manOfTheTournament.photo && (
                  <img
                    src={`http://localhost:5000${tournament.manOfTheTournament.photo}`}
                    alt={tournament.manOfTheTournament.playerName}
                    style={styles.motPhoto}
                  />
                )}
                <div style={styles.motInfo}>
                  <h3 style={styles.motName}>{tournament.manOfTheTournament.playerName}</h3>
                  <p style={styles.motTeam}>
                    Team: {tournament.manOfTheTournament.team?.name || 'N/A'}
                  </p>
                  <div style={styles.motStats}>
                    <div style={styles.statItem}>
                      <span style={styles.statValue}>{tournament.manOfTheTournament.stats?.goals || 0}</span>
                      <span style={styles.statLabel}>Goals</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={styles.statValue}>{tournament.manOfTheTournament.stats?.assists || 0}</span>
                      <span style={styles.statLabel}>Assists</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={styles.statValue}>{tournament.manOfTheTournament.stats?.matchesPlayed || 0}</span>
                      <span style={styles.statLabel}>Matches</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={styles.emptyText}>Man of the Tournament will be announced soon</p>
            )}

            {/* Tournament Info */}
            <h2 style={styles.sectionTitle}>Tournament Information</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <p style={styles.infoLabel}>Venue</p>
                <p style={styles.infoValue}>{tournament.location?.venue || 'TBD'}</p>
              </div>
              <div style={styles.infoCard}>
                <p style={styles.infoLabel}>Teams</p>
                <p style={styles.infoValue}>{tournament.currentTeams || 0} / {tournament.maxTeams}</p>
              </div>
              <div style={styles.infoCard}>
                <p style={styles.infoLabel}>Match Type</p>
                <p style={styles.infoValue}>{tournament.settings?.matchType || 'Best of 2'}</p>
              </div>
              <div style={styles.infoCard}>
                <p style={styles.infoLabel}>Round Duration</p>
                <p style={styles.infoValue}>{tournament.settings?.roundDuration || 3} minutes</p>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div>
            <div style={styles.filterRow}>
              <h2 style={styles.sectionTitle}>All Matches</h2>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={styles.dateFilter}
                placeholder="Filter by date"
              />
            </div>

            {filteredMatches.length === 0 ? (
              <p style={styles.emptyText}>No matches scheduled yet</p>
            ) : (
              <div style={styles.matchesList}>
                {filteredMatches.map(match => (
                  <div key={match._id} style={styles.matchCard}>
                    <div style={styles.matchHeader}>
                      <span style={styles.matchDate}>
                        {new Date(match.scheduledTime).toLocaleDateString()}
                      </span>
                      <span style={{...styles.matchStatus, backgroundColor: getStatusColor(match.status)}}>
                        {match.status}
                      </span>
                    </div>
                    <div style={styles.matchTeams}>
                      <div style={styles.matchTeam}>
                        <span style={styles.teamName}>{match.teamA?.name || 'Team A'}</span>
                        <span style={styles.teamScore}>{match.finalScoreA || 0}</span>
                      </div>
                      <span style={styles.vs}>VS</span>
                      <div style={styles.matchTeam}>
                        <span style={styles.teamScore}>{match.finalScoreB || 0}</span>
                        <span style={styles.teamName}>{match.teamB?.name || 'Team B'}</span>
                      </div>
                    </div>
                    {match.winner && (
                      <div style={styles.matchWinner}>
                        Winner: {match.winner.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <div>
            <h2 style={styles.sectionTitle}>Registered Teams</h2>
            {tournament.registeredTeams?.length === 0 ? (
              <p style={styles.emptyText}>No teams registered yet</p>
            ) : (
              <div style={styles.teamsGrid}>
                {tournament.registeredTeams.map(team => (
                  <div key={team._id} style={styles.teamCard}>
                    <h3 style={styles.teamCardName}>{team.name}</h3>
                    <p style={styles.teamCardLocation}>
                      📍 {team.location?.city}, {team.location?.state}
                    </p>
                    <p style={styles.teamCardType}>
                      Type: {team.teamType || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AWARDS TAB */}
        {activeTab === 'awards' && (
          <div>
            <h2 style={styles.sectionTitle}>Prize Pool</h2>
            {tournament.prizePool?.totalAmount > 0 ? (
              <div>
                <div style={styles.totalPrize}>
                  <span style={styles.totalPrizeLabel}>Total Prize Pool</span>
                  <span style={styles.totalPrizeAmount}>
                    {tournament.prizePool.currency} {tournament.prizePool.totalAmount.toLocaleString()}
                  </span>
                </div>

                {tournament.prizePool.prizes?.length > 0 && (
                  <div style={styles.prizesGrid}>
                    {tournament.prizePool.prizes.map((prize, index) => (
                      <div key={index} style={styles.prizeCard}>
                        <div style={styles.prizePosition}>{prize.position}</div>
                        <div style={styles.prizeAmount}>
                          {tournament.prizePool.currency} {prize.amount?.toLocaleString() || '0'}
                        </div>
                        {prize.description && (
                          <div style={styles.prizeDescription}>{prize.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={styles.emptyText}>Prize pool information not available</p>
            )}

            {/* Organizer Info */}
            {tournament.organizer?.name && (
              <div style={styles.organizerSection}>
                <h2 style={styles.sectionTitle}>Organized By</h2>
                <div style={styles.organizerCard}>
                  <h3 style={styles.organizerName}>{tournament.organizer.name}</h3>
                  {tournament.organizer.email && (
                    <p style={styles.organizerContact}>📧 {tournament.organizer.email}</p>
                  )}
                  {tournament.organizer.phone && (
                    <p style={styles.organizerContact}>📞 {tournament.organizer.phone}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div>
            <h2 style={styles.sectionTitle}>Photo Gallery</h2>
            {tournament.media?.gallery?.length === 0 || !tournament.media?.gallery ? (
              <p style={styles.emptyText}>No photos available yet</p>
            ) : (
              <div style={styles.galleryGrid}>
                {tournament.media.gallery.map((image, index) => (
                  <div key={index} style={styles.galleryItem}>
                    <img
                      src={`http://localhost:5000${image}`}
                      alt={`Gallery ${index + 1}`}
                      style={styles.galleryImage}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  switch(status) {
    case 'completed': return '#4CAF50';
    case 'in_progress': return '#FF9800';
    case 'scheduled': return '#2196F3';
    default: return '#666';
  }
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#888'
  },
  error: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#ff4444'
  },
  header: {
    marginBottom: '30px',
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  banner: {
    width: '100%',
    height: '300px',
    objectFit: 'cover'
  },
  headerContent: {
    padding: '30px'
  },
  title: {
    fontSize: '36px',
    margin: '0 0 16px 0',
    color: '#fff'
  },
  headerInfo: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  location: {
    fontSize: '16px',
    color: '#aaa'
  },
  dates: {
    fontSize: '16px',
    color: '#aaa'
  },
  status: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white'
  },
  description: {
    fontSize: '16px',
    color: '#ccc',
    lineHeight: '1.6',
    margin: '16px 0 0 0'
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '30px',
    borderBottom: '2px solid #333',
    overflowX: 'auto'
  },
  tab: {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap'
  },
  tabActive: {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid #4CAF50',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#4CAF50',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  tabContent: {
    minHeight: '400px'
  },
  sectionTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#fff',
    borderBottom: '2px solid #333',
    paddingBottom: '10px'
  },
  winnersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  winnerCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    border: '2px solid #333'
  },
  medal: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  winnerTitle: {
    fontSize: '18px',
    color: '#888',
    margin: '0 0 8px 0'
  },
  winnerTeam: {
    fontSize: '24px',
    color: '#fff',
    fontWeight: 'bold',
    margin: 0
  },
  motCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '30px',
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
    marginBottom: '40px',
    border: '2px solid #333'
  },
  motPhoto: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #4CAF50'
  },
  motInfo: {
    flex: 1
  },
  motName: {
    fontSize: '28px',
    margin: '0 0 8px 0',
    color: '#fff'
  },
  motTeam: {
    fontSize: '18px',
    color: '#888',
    margin: '0 0 20px 0'
  },
  motStats: {
    display: 'flex',
    gap: '40px'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  statLabel: {
    fontSize: '14px',
    color: '#888',
    marginTop: '4px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  infoCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #333'
  },
  infoLabel: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 8px 0'
  },
  infoValue: {
    fontSize: '20px',
    color: '#fff',
    fontWeight: 'bold',
    margin: 0
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  dateFilter: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '10px',
    color: '#fff',
    fontSize: '14px'
  },
  matchesList: {
    display: 'grid',
    gap: '16px'
  },
  matchCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #333'
  },
  matchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  matchDate: {
    fontSize: '14px',
    color: '#888'
  },
  matchStatus: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white'
  },
  matchTeams: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px'
  },
  matchTeam: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  teamName: {
    fontSize: '18px',
    color: '#fff',
    fontWeight: 'bold'
  },
  teamScore: {
    fontSize: '24px',
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  vs: {
    fontSize: '16px',
    color: '#888',
    fontWeight: 'bold'
  },
  matchWinner: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #333',
    color: '#4CAF50',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  teamsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  teamCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid #333',
    transition: 'transform 0.2s, border-color 0.2s'
  },
  teamCardName: {
    fontSize: '20px',
    margin: '0 0 12px 0',
    color: '#fff'
  },
  teamCardLocation: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 8px 0'
  },
  teamCardType: {
    fontSize: '14px',
    color: '#aaa',
    margin: 0
  },
  totalPrize: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    marginBottom: '30px',
    border: '2px solid #4CAF50'
  },
  totalPrizeLabel: {
    display: 'block',
    fontSize: '18px',
    color: '#888',
    marginBottom: '8px'
  },
  totalPrizeAmount: {
    display: 'block',
    fontSize: '42px',
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  prizesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  prizeCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    border: '1px solid #333'
  },
  prizePosition: {
    fontSize: '16px',
    color: '#888',
    marginBottom: '12px',
    fontWeight: 'bold'
  },
  prizeAmount: {
    fontSize: '28px',
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  prizeDescription: {
    fontSize: '14px',
    color: '#aaa'
  },
  organizerSection: {
    marginTop: '40px'
  },
  organizerCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid #333'
  },
  organizerName: {
    fontSize: '22px',
    margin: '0 0 12px 0',
    color: '#fff'
  },
  organizerContact: {
    fontSize: '16px',
    color: '#aaa',
    margin: '8px 0'
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px'
  },
  galleryItem: {
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    border: '1px solid #333'
  },
  galleryImage: {
    width: '100%',
    height: '250px',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.3s'
  },
  emptyText: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '16px',
    color: '#888'
  }
};

export default TournamentDetail;
