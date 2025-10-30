// backend/controllers/matchController.js
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const DroneLog = require('../models/DroneLog');
const axios = require('axios');
const { updateStandings } = require('./leaderboardController');
const DroneTelemetry = require('../models/DroneTelemetry');  // ✅ ADD THIS

// @desc    Get all matches
// @route   GET /api/matches
const getAllMatches = async (req, res) => {
  try {
    const { tournamentId } = req.query;
    
    const filter = tournamentId ? { tournament: tournamentId } : {};
    
    const matches = await Match.find(filter)
      .populate('tournament', 'name')
      .populate('teamA', 'name color')
      .populate('teamB', 'name color')
      .populate('winner', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single match
// @route   GET /api/matches/:matchId
const getMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId)
      .populate('tournament', 'name')
      .populate('teamA', 'name color droneIds')
      .populate('teamB', 'name color droneIds')
      .populate('winner', 'name');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new match
// @route   POST /api/matches
const createMatch = async (req, res) => {
  try {
    const { tournamentId, teamAId, teamBId, scheduledTime } = req.body;
    
    // Validation
    if (!tournamentId || !teamAId || !teamBId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide tournament, teamA, and teamB'
      });
    }
    
    // Check if teams are different
    if (teamAId === teamBId) {
      return res.status(400).json({
        success: false,
        message: 'Teams must be different'
      });
    }
    
    // Verify tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    // Verify teams exist
    const teamA = await Team.findById(teamAId);
    const teamB = await Team.findById(teamBId);
    
    if (!teamA || !teamB) {
      return res.status(404).json({
        success: false,
        message: 'One or both teams not found'
      });
    }
    
    // Create match with 3 empty rounds
    const match = await Match.create({
      tournament: tournamentId,
      teamA: teamAId,
      teamB: teamBId,
      scheduledTime: scheduledTime || new Date(),
      rounds: [
        { roundNumber: 1, status: 'pending', teamAScore: 0, teamBScore: 0 },
        { roundNumber: 2, status: 'pending', teamAScore: 0, teamBScore: 0 },
        { roundNumber: 3, status: 'pending', teamAScore: 0, teamBScore: 0 }
      ],
      currentRound: 0,
      status: 'scheduled'
    });
    
    // Populate before sending
    await match.populate('teamA teamB tournament');
    
    res.status(201).json({
      success: true,
      data: match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start a round
// @route   PUT /api/matches/:matchId/start-round
const startRound = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    console.log('🎬 Starting round for match:', matchId);
    
    const match = await Match.findById(matchId)
      .populate('teamA', 'name color')
      .populate('teamB', 'name color');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if match is already completed
    if (match.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Match is already completed'
      });
    }
    
    // Check if there's already an active round
    const activeRound = match.rounds.find(r => r.status === 'in_progress');
    if (activeRound) {
      return res.status(400).json({
        success: false,
        message: `Round ${activeRound.roundNumber} is already in progress`
      });
    }
    
    // Find next pending round
    const nextRound = match.rounds.find(r => r.status === 'pending');
    if (!nextRound) {
      return res.status(400).json({
        success: false,
        message: 'All rounds completed'
      });
    }
    
    // Start the round
    nextRound.status = 'in_progress';
    nextRound.startTime = new Date();
    match.currentRound = nextRound.roundNumber;
    match.status = 'in_progress';
    
    await match.save();
    
    console.log(`✅ Round ${nextRound.roundNumber} started`);
    
    res.json({
      success: true,
      message: `Round ${nextRound.roundNumber} started`,
      data: match
    });
    
  } catch (error) {
    console.error('Error in startRound:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update live score
// @route   PUT /api/matches/:matchId/update-score
const updateScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { team, increment } = req.body; // team: 'A' or 'B', increment: 1 or -1
    
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    if (match.currentRound === 0) {
      return res.status(400).json({
        success: false,
        message: 'No round is currently active'
      });
    }
    
    const currentRound = match.rounds[match.currentRound - 1];
    
    if (currentRound.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Current round is not active'
      });
    }
    
    // Update score
    if (team === 'A') {
      currentRound.teamAScore = Math.max(0, currentRound.teamAScore + increment);
      match.finalScoreA = Math.max(0, match.finalScoreA + increment);
    } else if (team === 'B') {
      currentRound.teamBScore = Math.max(0, currentRound.teamBScore + increment);
      match.finalScoreB = Math.max(0, match.finalScoreB + increment);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid team specified'
      });
    }
    
    await match.save();
    await match.populate('teamA teamB');
    
    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    End current round and trigger ML analysis
// @route   PUT /api/matches/:matchId/end-round
const endRound = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    console.log('=====================================');
    console.log('🏁 END ROUND REQUEST');
    console.log('Match ID:', matchId);
    console.log('=====================================');
    
    const match = await Match.findById(matchId);
    
    if (!match) {
      console.log('❌ Match not found!');
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    console.log('✅ Match found:', match._id);
    console.log('Current Round:', match.currentRound);
    
    const activeRound = match.rounds.find(r => r.status === 'in_progress');
    
    if (!activeRound) {
      console.log('❌ No active round found');
      return res.status(400).json({
        success: false,
        message: 'No active round to end'
      });
    }
    
    const roundNumber = activeRound.roundNumber;  // ✅ Defined here!
    console.log(`🏁 Ending Round ${roundNumber}...`);
    
    activeRound.status = 'completed';
    activeRound.endTime = new Date();
    
    const duration = Math.round((activeRound.endTime - activeRound.startTime) / 1000);
    console.log(`⏱️  Round duration: ${duration} seconds`);
    
    try {
      console.log('🤖 Calling ML service for stability analysis...');
      
      // ✅ FIXED: Use roundNumber variable
      const telemetryData = await DroneTelemetry.find({
        matchId: matchId,
        roundNumber: roundNumber  // ✅ Changed from currentRound
      });

      console.log(`📊 Found ${telemetryData.length} telemetry document(s)`);
      
      if (telemetryData.length === 0) {
        console.log('⚠️  No telemetry data found for ML analysis');
        activeRound.mlAnalysis = {
          error: 'No telemetry data',
          stabilityScore: 0,
          bonusPoints: 0
        };
      } else {
        const allLogs = [];
        let totalDataPoints = 0;
        
        telemetryData.forEach(droneLog => {
          if (droneLog.logs && droneLog.logs.length > 0) {
            droneLog.logs.forEach(log => {
              allLogs.push({
                droneId: droneLog.droneId,
                teamId: droneLog.teamId ? droneLog.teamId.toString() : 'unknown',
                x: log.x || 0,
                y: log.y || 0,
                z: log.z || 0,
                pitch: log.pitch || 0,
                roll: log.roll || 0,
                yaw: log.yaw || 0,
                timestamp: log.timestamp || Date.now()
              });
              totalDataPoints++;
            });
          }
        });
        
        console.log(`📤 Sending ${totalDataPoints} data points to ML service...`);
        
        if (totalDataPoints === 0) {
          console.log('⚠️  No data points in logs');
          activeRound.mlAnalysis = {
            error: 'No data points',
            stabilityScore: 0,
            bonusPoints: 0
          };
        } else {
          try {
            const mlResponse = await axios.post(
              'http://localhost:5001/analyze-stability',
              {
                matchId: matchId,
                roundNumber: roundNumber,
                telemetry: allLogs
              },
              {
                timeout: 10000,
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log('✅ ML Analysis received!');
            console.log(`   - Stability Score: ${mlResponse.data.stabilityScore || 0}`);
            console.log(`   - Bonus Points: ${mlResponse.data.bonusPoints || 0}`);
            
            activeRound.mlAnalysis = {
              stabilityScore: mlResponse.data.stabilityScore || 0,
              bonusPoints: mlResponse.data.bonusPoints || 0,
              flightQuality: mlResponse.data.flightQuality || 'good',
              details: mlResponse.data.details || {}
            };
            
            const bonusPoints = mlResponse.data.bonusPoints || 0;
            if (bonusPoints > 0) {
              if (activeRound.teamAScore > activeRound.teamBScore) {
                activeRound.teamAScore += bonusPoints;
                match.finalScoreA += bonusPoints;
                console.log(`   - Team A bonus: +${bonusPoints} points`);
              } else if (activeRound.teamBScore > activeRound.teamAScore) {
                activeRound.teamBScore += bonusPoints;
                match.finalScoreB += bonusPoints;
                console.log(`   - Team B bonus: +${bonusPoints} points`);
              } else {
                const splitBonus = Math.floor(bonusPoints / 2);
                activeRound.teamAScore += splitBonus;
                activeRound.teamBScore += splitBonus;
                match.finalScoreA += splitBonus;
                match.finalScoreB += splitBonus;
                console.log(`   - Bonus split: +${splitBonus} each`);
              }
            }
            
          } catch (mlError) {
            console.error('❌ ML Service Error:', mlError.message);
            if (mlError.code === 'ECONNREFUSED') {
              console.log('⚠️  ML service not running on localhost:5001');
            }
            activeRound.mlAnalysis = {
              error: 'ML service unavailable',
              message: mlError.message,
              stabilityScore: 0,
              bonusPoints: 0
            };
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error in ML analysis section:', error);
      activeRound.mlAnalysis = {
        error: 'Analysis failed',
        message: error.message
      };
    }
    
    await match.save();
    
    console.log(`✅ Round ${roundNumber} completed!`);
    console.log(`   - Team A Score: ${activeRound.teamAScore}`);
    console.log(`   - Team B Score: ${activeRound.teamBScore}`);
    console.log('=====================================\n');
    
    await match.populate('teamA', 'name color');
    await match.populate('teamB', 'name color');
    
    res.status(200).json({
      success: true,
      message: `Round ${roundNumber} ended successfully`,
      data: {
        roundNumber: activeRound.roundNumber,
        status: activeRound.status,
        startTime: activeRound.startTime,
        endTime: activeRound.endTime,
        duration: `${duration}s`,
        teamAScore: activeRound.teamAScore,
        teamBScore: activeRound.teamBScore,
        mlAnalysis: activeRound.mlAnalysis || null
      }
    });
    
  } catch (error) {
    console.error('❌ ERROR in endRound:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Complete match (determine winner)
// @route   PUT /api/matches/:matchId/complete
const completeMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findById(matchId)
      .populate('teamA', 'name color')
      .populate('teamB', 'name color');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if all rounds are completed
    const allRoundsCompleted = match.rounds.every(r => r.status === 'completed');
    
    if (!allRoundsCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Not all rounds are completed'
      });
    }
    
    // Determine winner
    let winner = null;
    if (match.finalScoreA > match.finalScoreB) {
      winner = match.teamA._id;
    } else if (match.finalScoreB > match.finalScoreA) {
      winner = match.teamB._id;
    }
    
    match.status = 'completed';
    match.winner = winner;
    match.completedAt = new Date();
    
    await match.save();
    
    console.log('🏆 Match completed!');
    console.log(`   Winner: ${winner ? (winner.toString() === match.teamA._id.toString() ? 'Team A' : 'Team B') : 'Draw'}`);
    
    res.json({
      success: true,
      message: 'Match completed',
      data: {
        matchId: match._id,
        status: match.status,
        winner: winner,
        finalScoreA: match.finalScoreA,
        finalScoreB: match.finalScoreB,
        completedAt: match.completedAt
      }
    });
    
  } catch (error) {
    console.error('Error in completeMatch:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register drones for a round
// @route   POST /api/matches/:matchId/register-drones
const registerDrones = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { roundNumber, drones } = req.body;

    // Validation
    if (!roundNumber || !drones || !Array.isArray(drones)) {
      return res.status(400).json({ 
        message: 'Round number and drones array are required' 
      });
    }

    // Validate drones array length (should be 8: 4 for each team)
    if (drones.length !== 8) {
      return res.status(400).json({ 
        message: 'Exactly 8 drones required (4 per team)' 
      });
    }

    // Find match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Check if match is not completed
    if (match.status === 'completed') {
      return res.status(400).json({ 
        message: 'Cannot register drones for completed match' 
      });
    }

    // Find or create round
    let round = match.rounds.find(r => r.roundNumber === roundNumber);
    
    if (!round) {
      // Create new round
      match.rounds.push({
        roundNumber,
        status: 'pending',
        registeredDrones: drones,
        teamAScore: 0,
        teamBScore: 0
      });
    } else {
      // Update existing round
      if (round.status === 'completed') {
        return res.status(400).json({ 
          message: 'Cannot register drones for completed round' 
        });
      }
      round.registeredDrones = drones;
    }

    await match.save();

    res.status(200).json({
      success: true,
      message: 'Drones registered successfully',
      match
    });

  } catch (error) {
    console.error('Error registering drones:', error);
    res.status(500).json({ 
      message: 'Error registering drones', 
      error: error.message 
    });
  }
};


const getMatchReport = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Find match with all populated data
    const match = await Match.findById(matchId)
      .populate('tournament', 'name description startDate endDate')
      .populate('teamA', 'name color members')
      .populate('teamB', 'name color members')
      .populate('winner', 'name color')
      .populate({
        path: 'rounds.registeredDrones.team',
        select: 'name color'
      });

    if (!match) {
      return res.status(404).json({ 
        success: false,
        message: 'Match not found' 
      });
    }

    // Calculate detailed statistics
    const report = {
      matchId: match._id,
      tournament: match.tournament,
      matchStatus: match.status,
      scheduledTime: match.scheduledTime,
      
      // Teams Info
      teams: {
        teamA: {
          _id: match.teamA._id,
          name: match.teamA.name,
          color: match.teamA.color,
          finalScore: match.finalScoreA,
          totalMembers: match.teamA.members.length
        },
        teamB: {
          _id: match.teamB._id,
          name: match.teamB.name,
          color: match.teamB.color,
          finalScore: match.finalScoreB,
          totalMembers: match.teamB.members.length
        }
      },

      // Winner Info
      winner: match.winner ? {
        _id: match.winner._id,
        name: match.winner.name,
        color: match.winner.color
      } : null,

      // Rounds Details
      rounds: match.rounds.map(round => {
        const teamADrones = round.registeredDrones.filter(
          d => d.team._id.toString() === match.teamA._id.toString()
        );
        const teamBDrones = round.registeredDrones.filter(
          d => d.team._id.toString() === match.teamB._id.toString()
        );

        return {
          roundNumber: round.roundNumber,
          status: round.status,
          startTime: round.startTime,
          endTime: round.endTime,
          duration: round.startTime && round.endTime 
            ? Math.round((new Date(round.endTime) - new Date(round.startTime)) / 1000) + ' seconds'
            : 'N/A',
          
          scores: {
            teamA: round.teamAScore,
            teamB: round.teamBScore,
            winner: round.teamAScore > round.teamBScore 
              ? match.teamA.name 
              : round.teamBScore > round.teamAScore 
                ? match.teamB.name 
                : 'Draw'
          },

          drones: {
            teamA: teamADrones.map(d => ({
              droneNumber: d.droneNumber,
              droneId: d.droneId,
              team: d.team.name
            })),
            teamB: teamBDrones.map(d => ({
              droneNumber: d.droneNumber,
              droneId: d.droneId,
              team: d.team.name
            }))
          },

          totalDrones: round.registeredDrones.length
        };
      }),

      // Overall Statistics
      statistics: {
        totalRounds: match.rounds.length,
        completedRounds: match.rounds.filter(r => r.status === 'completed').length,
        currentRound: match.currentRound,
        
        totalDronesUsed: [
          ...new Set(
            match.rounds.flatMap(r => 
              r.registeredDrones.map(d => d.droneNumber)
            )
          )
        ].length,

        roundsWonByTeamA: match.rounds.filter(
          r => r.teamAScore > r.teamBScore
        ).length,
        
        roundsWonByTeamB: match.rounds.filter(
          r => r.teamBScore > r.teamAScore
        ).length,

        totalPointsScored: match.finalScoreA + match.finalScoreB
      },

      // Drone Usage Summary
      droneUsageSummary: generateDroneUsageSummary(match),

      createdAt: match.createdAt,
      updatedAt: match.updatedAt
    };

    res.status(200).json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error generating match report:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating match report', 
      error: error.message 
    });
  }
};

// Helper function for drone usage summary
const generateDroneUsageSummary = (match) => {
  const droneUsage = {};

  match.rounds.forEach(round => {
    round.registeredDrones.forEach(drone => {
      if (!droneUsage[drone.droneNumber]) {
        droneUsage[drone.droneNumber] = {
          droneNumber: drone.droneNumber,
          timesUsed: 0,
          rounds: [],
          teams: new Set()
        };
      }
      
      droneUsage[drone.droneNumber].timesUsed++;
      droneUsage[drone.droneNumber].rounds.push(round.roundNumber);
      droneUsage[drone.droneNumber].teams.add(drone.team.name);
    });
  });

  return Object.values(droneUsage).map(drone => ({
    droneNumber: drone.droneNumber,
    timesUsed: drone.timesUsed,
    roundsUsedIn: drone.rounds,
    teamsUsedBy: Array.from(drone.teams)
  }));
};



module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  startRound,
  updateScore,
  endRound,
  completeMatch,
  registerDrones,
  getMatchReport
};