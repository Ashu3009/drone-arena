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

  // Team Detail Modal state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

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

  // Team modal handlers
  const handleOpenTeamModal = (team) => {
    if (team && team._id) {
      setSelectedTeam(team);
      setShowTeamModal(true);
    }
  };

  const handleCloseTeamModal = () => {
    setShowTeamModal(false);
    setSelectedTeam(null);
  };

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
                  <div
                    style={{...styles.winnerCard, cursor: 'pointer'}}
                    onClick={() => handleOpenTeamModal(tournament.winners.champion)}
                  >
                    <div style={styles.medal}>🥇</div>
                    <h3 style={styles.winnerTitle}>Champion</h3>
                    <p style={styles.winnerTeam}>
                      {tournament.winners.champion.name || 'TBD'}
                    </p>
                    <p style={styles.clickHint}>Click to view team details</p>
                  </div>
                )}
                {tournament.winners.runnerUp && (
                  <div
                    style={{...styles.winnerCard, cursor: 'pointer'}}
                    onClick={() => handleOpenTeamModal(tournament.winners.runnerUp)}
                  >
                    <div style={styles.medal}>🥈</div>
                    <h3 style={styles.winnerTitle}>Runner Up</h3>
                    <p style={styles.winnerTeam}>
                      {tournament.winners.runnerUp.name || 'TBD'}
                    </p>
                    <p style={styles.clickHint}>Click to view team details</p>
                  </div>
                )}
                {tournament.winners.thirdPlace && (
                  <div
                    style={{...styles.winnerCard, cursor: 'pointer'}}
                    onClick={() => handleOpenTeamModal(tournament.winners.thirdPlace)}
                  >
                    <div style={styles.medal}>🥉</div>
                    <h3 style={styles.winnerTitle}>Third Place</h3>
                    <p style={styles.winnerTeam}>
                      {tournament.winners.thirdPlace.name || 'TBD'}
                    </p>
                    <p style={styles.clickHint}>Click to view team details</p>
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

                    {/* Man of the Match Display */}
                    {match.status === 'completed' && match.manOfTheMatch?.playerName && (
                      <div style={styles.momSection}>
                        <div style={styles.momHeader}>⭐ Man of the Match</div>
                        <div style={styles.momContent}>
                          {match.manOfTheMatch.photo && (
                            <img
                              src={`http://localhost:5000${match.manOfTheMatch.photo}`}
                              alt={match.manOfTheMatch.playerName}
                              style={styles.momPhotoSmall}
                            />
                          )}
                          <div style={styles.momDetails}>
                            <div style={styles.momPlayerName}>{match.manOfTheMatch.playerName}</div>
                            <div style={styles.momTeamName}>
                              {match.manOfTheMatch.team?.name || 'N/A'}
                            </div>
                            <div style={styles.momStatsRow}>
                              <span style={styles.momStat}>
                                ⚽ {match.manOfTheMatch.stats?.goals || 0} Goals
                              </span>
                              <span style={styles.momStat}>
                                🎯 {match.manOfTheMatch.stats?.assists || 0} Assists
                              </span>
                              <span style={styles.momStat}>
                                🛡️ {match.manOfTheMatch.stats?.saves || 0} Saves
                              </span>
                            </div>
                          </div>
                        </div>
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
            {/* Player Awards Section */}
            {(tournament.awards?.bestForward || tournament.awards?.bestCenter || tournament.awards?.bestDefender || tournament.awards?.bestKeeper) && (
              <>
                <h2 style={styles.sectionTitle}>Player Awards (Role-Based)</h2>
                <div style={styles.awardsGrid}>
                  {/* Best Forward */}
                  {tournament.awards.bestForward && (
                    <div style={styles.awardCard}>
                      <div style={styles.awardIcon}>⚡</div>
                      <h3 style={styles.awardTitle}>Best Forward</h3>
                      {tournament.awards.bestForward.photo ? (
                        <img
                          src={`http://localhost:5000${tournament.awards.bestForward.photo}`}
                          alt={tournament.awards.bestForward.playerName}
                          style={styles.awardPhoto}
                        />
                      ) : (
                        <div style={styles.awardPhotoPlaceholder}>
                          {tournament.awards.bestForward.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={styles.awardPlayerName}>{tournament.awards.bestForward.playerName}</div>
                      <div style={styles.awardTeamName}>
                        {tournament.awards.bestForward.team?.name || 'N/A'}
                      </div>
                      <div style={styles.awardStat}>
                        Avg: {tournament.awards.bestForward.stats?.avgPerformance || 0} pts
                      </div>
                      <div style={styles.awardMatches}>
                        {tournament.awards.bestForward.stats?.totalMatches || 0} matches
                      </div>
                    </div>
                  )}

                  {/* Best Center */}
                  {tournament.awards.bestCenter && (
                    <div style={styles.awardCard}>
                      <div style={styles.awardIcon}>🎯</div>
                      <h3 style={styles.awardTitle}>Best Center</h3>
                      {tournament.awards.bestCenter.photo ? (
                        <img
                          src={`http://localhost:5000${tournament.awards.bestCenter.photo}`}
                          alt={tournament.awards.bestCenter.playerName}
                          style={styles.awardPhoto}
                        />
                      ) : (
                        <div style={styles.awardPhotoPlaceholder}>
                          {tournament.awards.bestCenter.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={styles.awardPlayerName}>{tournament.awards.bestCenter.playerName}</div>
                      <div style={styles.awardTeamName}>
                        {tournament.awards.bestCenter.team?.name || 'N/A'}
                      </div>
                      <div style={styles.awardStat}>
                        Avg: {tournament.awards.bestCenter.stats?.avgPerformance || 0} pts
                      </div>
                      <div style={styles.awardMatches}>
                        {tournament.awards.bestCenter.stats?.totalMatches || 0} matches
                      </div>
                    </div>
                  )}

                  {/* Best Defender */}
                  {tournament.awards.bestDefender && (
                    <div style={styles.awardCard}>
                      <div style={styles.awardIcon}>🛡️</div>
                      <h3 style={styles.awardTitle}>Best Defender</h3>
                      {tournament.awards.bestDefender.photo ? (
                        <img
                          src={`http://localhost:5000${tournament.awards.bestDefender.photo}`}
                          alt={tournament.awards.bestDefender.playerName}
                          style={styles.awardPhoto}
                        />
                      ) : (
                        <div style={styles.awardPhotoPlaceholder}>
                          {tournament.awards.bestDefender.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={styles.awardPlayerName}>{tournament.awards.bestDefender.playerName}</div>
                      <div style={styles.awardTeamName}>
                        {tournament.awards.bestDefender.team?.name || 'N/A'}
                      </div>
                      <div style={styles.awardStat}>
                        Avg: {tournament.awards.bestDefender.stats?.avgPerformance || 0} pts
                      </div>
                      <div style={styles.awardMatches}>
                        {tournament.awards.bestDefender.stats?.totalMatches || 0} matches
                      </div>
                    </div>
                  )}

                  {/* Best Keeper */}
                  {tournament.awards.bestKeeper && (
                    <div style={styles.awardCard}>
                      <div style={styles.awardIcon}>🥅</div>
                      <h3 style={styles.awardTitle}>Best Keeper</h3>
                      {tournament.awards.bestKeeper.photo ? (
                        <img
                          src={`http://localhost:5000${tournament.awards.bestKeeper.photo}`}
                          alt={tournament.awards.bestKeeper.playerName}
                          style={styles.awardPhoto}
                        />
                      ) : (
                        <div style={styles.awardPhotoPlaceholder}>
                          {tournament.awards.bestKeeper.playerName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={styles.awardPlayerName}>{tournament.awards.bestKeeper.playerName}</div>
                      <div style={styles.awardTeamName}>
                        {tournament.awards.bestKeeper.team?.name || 'N/A'}
                      </div>
                      <div style={styles.awardStat}>
                        Avg: {tournament.awards.bestKeeper.stats?.avgPerformance || 0} pts
                      </div>
                      <div style={styles.awardMatches}>
                        {tournament.awards.bestKeeper.stats?.totalMatches || 0} matches
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

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

      {/* Team Detail Modal */}
      {showTeamModal && selectedTeam && (
        <div style={styles.teamModalOverlay} onClick={handleCloseTeamModal}>
          <div style={styles.teamModalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={handleCloseTeamModal}>
              ×
            </button>

            <h2 style={styles.teamModalTitle}>{selectedTeam.name}</h2>

            <div style={styles.teamModalInfo}>
              <div style={styles.teamInfoRow}>
                <span style={styles.teamInfoLabel}>Location:</span>
                <span style={styles.teamInfoValue}>
                  {selectedTeam.location?.city}, {selectedTeam.location?.state || selectedTeam.location?.country}
                </span>
              </div>
              <div style={styles.teamInfoRow}>
                <span style={styles.teamInfoLabel}>Type:</span>
                <span style={styles.teamInfoValue}>{selectedTeam.teamType || 'N/A'}</span>
              </div>
              {selectedTeam.captain && (
                <div style={styles.teamInfoRow}>
                  <span style={styles.teamInfoLabel}>Captain:</span>
                  <span style={styles.teamInfoValue}>{selectedTeam.captain}</span>
                </div>
              )}
            </div>

            <h3 style={styles.membersTitle}>Team Members</h3>
            {selectedTeam.members && selectedTeam.members.length > 0 ? (
              <div style={styles.membersGrid}>
                {selectedTeam.members.map((member, index) => (
                  <div key={index} style={styles.memberCard}>
                    {member.photo ? (
                      <img
                        src={`http://localhost:5000${member.photo}`}
                        alt={member.name}
                        style={styles.memberPhoto}
                      />
                    ) : (
                      <div style={styles.memberPhotoPlaceholder}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={styles.memberName}>{member.name}</div>
                    <div style={styles.memberRole}>{member.role}</div>
                    {member.jerseyNumber && (
                      <div style={styles.memberJersey}>#{member.jerseyNumber}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyText}>No team members available</p>
            )}
          </div>
        </div>
      )}
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
  },
  // Man of the Match styles
  momSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '2px solid #444'
  },
  momHeader: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  momContent: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  momPhotoSmall: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #FFD700'
  },
  momDetails: {
    flex: 1
  },
  momPlayerName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '4px'
  },
  momTeamName: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '10px'
  },
  momStatsRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  momStat: {
    fontSize: '13px',
    color: '#aaa',
    backgroundColor: '#2a2a2a',
    padding: '4px 12px',
    borderRadius: '12px'
  },
  // Awards styles
  awardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  awardCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    border: '2px solid #FFD700',
    position: 'relative'
  },
  awardIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },
  awardTitle: {
    fontSize: '18px',
    color: '#FFD700',
    margin: '0 0 20px 0',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  awardPhoto: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    margin: '0 auto 16px auto',
    display: 'block',
    border: '4px solid #FFD700'
  },
  awardPlayerName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '8px'
  },
  awardTeamName: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '16px'
  },
  awardStat: {
    fontSize: '16px',
    color: '#4CAF50',
    fontWeight: 'bold',
    backgroundColor: '#2a2a2a',
    padding: '8px 16px',
    borderRadius: '20px',
    display: 'inline-block',
    marginBottom: '8px'
  },
  awardMatches: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic'
  },
  awardPhotoPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    margin: '0 auto 16px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a3a3a',
    border: '4px solid #FFD700',
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#FFD700'
  },
  clickHint: {
    fontSize: '12px',
    color: '#4CAF50',
    margin: '8px 0 0 0',
    fontStyle: 'italic'
  },
  // Team Modal styles
  teamModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '20px'
  },
  teamModalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '2px solid #4CAF50',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '36px',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background-color 0.2s'
  },
  teamModalTitle: {
    fontSize: '32px',
    margin: '0 0 24px 0',
    color: '#4CAF50',
    textAlign: 'center'
  },
  teamModalInfo: {
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px'
  },
  teamInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '16px'
  },
  teamInfoLabel: {
    color: '#888',
    fontWeight: 'bold'
  },
  teamInfoValue: {
    color: '#fff'
  },
  membersTitle: {
    fontSize: '24px',
    margin: '0 0 20px 0',
    color: '#fff',
    borderBottom: '2px solid #333',
    paddingBottom: '10px'
  },
  membersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '20px'
  },
  memberCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    border: '1px solid #444',
    transition: 'transform 0.2s, border-color 0.2s'
  },
  memberPhoto: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    margin: '0 auto 12px auto',
    display: 'block',
    border: '3px solid #4CAF50'
  },
  memberPhotoPlaceholder: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    margin: '0 auto 12px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    fontSize: '40px',
    fontWeight: 'bold',
    color: '#888',
    border: '3px solid #666'
  },
  memberName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '6px'
  },
  memberRole: {
    fontSize: '13px',
    color: '#4CAF50',
    marginBottom: '6px',
    textTransform: 'uppercase',
    fontWeight: 'bold'
  },
  memberJersey: {
    fontSize: '12px',
    color: '#888',
    backgroundColor: '#1e1e1e',
    padding: '4px 10px',
    borderRadius: '12px',
    display: 'inline-block'
  }
};

export default TournamentDetail;
