// backend/controllers/leaderboardController.js
const TournamentStanding = require('../models/TournamentStanding');
const Tournament = require('../models/Tournament');

// @desc    Get tournament leaderboard
// @route   GET /api/leaderboard/:tournamentId
const getLeaderboard = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    // Get all standings for this tournament
    const standings = await TournamentStanding.find({ 
      tournament: tournamentId 
    })
    .populate('team', 'name color droneIds contactEmail')
    .lean(); // Convert to plain JS object for manipulation
    
    // Sort by: wins (desc) → totalScore (desc) → avgStability (desc) → matchesPlayed (asc)
    const sortedStandings = standings.sort((a, b) => {
      // 1. Compare wins (higher is better)
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      
      // 2. If wins are equal, compare total score (higher is better)
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      
      // 3. If score is equal, compare stability (higher is better)
      if (b.avgStability !== a.avgStability) {
        return b.avgStability - a.avgStability;
      }
      
      // 4. If everything is equal, fewer matches played is better (efficiency)
      return a.matchesPlayed - b.matchesPlayed;
    });
    
    // Add rank to each team
    const leaderboard = sortedStandings.map((standing, index) => ({
      rank: index + 1,
      team: standing.team,
      wins: standing.wins,
      losses: standing.losses,
      totalScore: standing.totalScore,
      matchesPlayed: standing.matchesPlayed,
      avgStability: standing.avgStability,
      winRate: standing.matchesPlayed > 0 
        ? ((standing.wins / standing.matchesPlayed) * 100).toFixed(1) 
        : 0
    }));
    
    res.json({
      success: true,
      tournament: {
        id: tournament._id,
        name: tournament.name,
        status: tournament.status
      },
      count: leaderboard.length,
      data: leaderboard
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get specific team standing in a tournament
// @route   GET /api/leaderboard/:tournamentId/:teamId
const getTeamStanding = async (req, res) => {
  try {
    const { tournamentId, teamId } = req.params;
    
    const standing = await TournamentStanding.findOne({
      tournament: tournamentId,
      team: teamId
    })
    .populate('team', 'name color droneIds')
    .populate('tournament', 'name status');
    
    if (!standing) {
      return res.status(404).json({
        success: false,
        message: 'Standing not found for this team in this tournament'
      });
    }
    
    // Get all standings to calculate rank
    const allStandings = await TournamentStanding.find({ 
      tournament: tournamentId 
    }).lean();
    
    // Sort to find rank
    const sortedStandings = allStandings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.avgStability !== a.avgStability) return b.avgStability - a.avgStability;
      return a.matchesPlayed - b.matchesPlayed;
    });
    
    const rank = sortedStandings.findIndex(s => 
      s.team.toString() === teamId
    ) + 1;
    
    res.json({
      success: true,
      data: {
        rank,
        standing: standing,
        winRate: standing.matchesPlayed > 0 
          ? ((standing.wins / standing.matchesPlayed) * 100).toFixed(1) 
          : 0
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update standings after match completion
// @route   POST /api/leaderboard/update
// @access  Internal (called by match completion)
const updateStandings = async (req, res) => {
  try {
    const { 
      matchId, 
      tournamentId, 
      winnerId, 
      loserId, 
      winnerScore, 
      loserScore,
      winnerStability,
      loserStability
    } = req.body;
    
    // Update winner's standing
    const winnerStanding = await TournamentStanding.findOne({
      tournament: tournamentId,
      team: winnerId
    });
    
    if (winnerStanding) {
      winnerStanding.wins += 1;
      winnerStanding.matchesPlayed += 1;
      winnerStanding.totalScore += winnerScore;
      
      // Update average stability
      const totalMatches = winnerStanding.matchesPlayed;
      const currentAvg = winnerStanding.avgStability;
      winnerStanding.avgStability = 
        ((currentAvg * (totalMatches - 1)) + winnerStability) / totalMatches;
      
      await winnerStanding.save();
    }
    
    // Update loser's standing
    const loserStanding = await TournamentStanding.findOne({
      tournament: tournamentId,
      team: loserId
    });
    
    if (loserStanding) {
      loserStanding.losses += 1;
      loserStanding.matchesPlayed += 1;
      loserStanding.totalScore += loserScore;
      
      // Update average stability
      const totalMatches = loserStanding.matchesPlayed;
      const currentAvg = loserStanding.avgStability;
      loserStanding.avgStability = 
        ((currentAvg * (totalMatches - 1)) + loserStability) / totalMatches;
      
      await loserStanding.save();
    }
    
    res.json({
      success: true,
      message: 'Standings updated successfully',
      data: {
        winner: winnerStanding,
        loser: loserStanding
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getLeaderboard,
  getTeamStanding,
  updateStandings
};
