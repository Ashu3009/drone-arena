// backend/controllers/matchController.js
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const DroneLog = require('../models/DroneLog');
const axios = require('axios');
const { updateStandings } = require('./leaderboardController');
const DroneTelemetry = require('../models/DroneTelemetry');
const DroneReport = require('../models/DroneReport');  // ✅ Individual reports
const mqttService = require('../services/mqttService');  // ✅ MQTT for ESP32
const { spawn } = require('child_process');  // ✅ For ESP simulator subprocess
const path = require('path');
const { generateSummary, generateRecommendations } = require('../utils/reportTemplates');  // ✅ Report templates

// ✅ Global map to store running simulators (matchId -> process)
const runningSimulators = new Map();

// ✅ Global map to store active round timers (matchId-roundNumber -> timeoutId)
const activeRoundTimers = new Map();

/**
 * ✅ HELPER: Calculate Man of the Match based on DroneReports
 * Uses role-specific scoring and overall performance
 */
const calculateManOfTheMatch = async (matchId) => {
  try {
    const reports = await DroneReport.find({ match: matchId })
      .populate('team', 'name color members');

    if (!reports || reports.length === 0) {
      console.log('⚠️  No reports found for Man of the Match calculation');
      return null;
    }

    // Group reports by pilot
    const pilotStats = {};

    reports.forEach(report => {
      const pilotId = report.pilotId;

      if (!pilotStats[pilotId]) {
        pilotStats[pilotId] = {
          pilotId: report.pilotId,
          pilotName: report.pilotName,
          team: report.team,
          photo: null, // Will be set from team members
          totalScore: 0,
          roundsPlayed: 0,
          avgPerformance: 0,
          bestRound: 0
        };
      }

      const stats = pilotStats[pilotId];
      stats.totalScore += report.performanceScore || 0;
      stats.roundsPlayed++;

      if (report.performanceScore > stats.bestRound) {
        stats.bestRound = report.performanceScore;
      }
    });

    // Calculate averages and find best player
    let bestPlayer = null;
    let highestScore = 0;

    Object.values(pilotStats).forEach(stats => {
      stats.avgPerformance = Math.round(stats.totalScore / stats.roundsPlayed);

      // MOM Score = (Avg Performance × 0.6) + (Best Round × 0.4)
      const momScore = (stats.avgPerformance * 0.6) + (stats.bestRound * 0.4);

      if (momScore > highestScore) {
        highestScore = momScore;
        bestPlayer = stats;
      }
    });

    if (!bestPlayer) {
      return null;
    }

    // Find player photo from team members
    const member = bestPlayer.team.members.find(m => m._id.toString() === bestPlayer.pilotId);

    return {
      playerName: bestPlayer.pilotName,
      team: bestPlayer.team._id,
      photo: member?.photo || null,
      stats: {
        avgPerformance: bestPlayer.avgPerformance,
        roundsPlayed: bestPlayer.roundsPlayed,
        bestRound: bestPlayer.bestRound,
        totalScore: bestPlayer.totalScore
      }
    };

  } catch (error) {
    console.error('❌ Error calculating Man of the Match:', error);
    return null;
  }
};

// @desc    Get all matches
// @route   GET /api/matches
const getAllMatches = async (req, res) => {
  try {
    const { tournamentId } = req.query;
    
    const filter = tournamentId ? { tournament: tournamentId } : {};
    
    const matches = await Match.find(filter)
      .populate('tournament', 'name')
      .populate('teamA', 'name color members teamSize')
      .populate('teamB', 'name color members teamSize')
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
      .populate('teamA', 'name color members teamSize')
      .populate('teamB', 'name color members teamSize')
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

    // Auto-assign match number (count existing matches in tournament + 1)
    const matchCount = await Match.countDocuments({ tournament: tournamentId });
    const matchNumber = matchCount + 1;

    // Get round duration from tournament settings
    const roundDuration = tournament.settings?.roundDuration || 3;

    // Create rounds based on tiebreaker setting
    const rounds = [
      { roundNumber: 1, status: 'pending', teamAScore: 0, teamBScore: 0 },
      { roundNumber: 2, status: 'pending', teamAScore: 0, teamBScore: 0 }
    ];

    // Add 3rd round only if tiebreaker is enabled
    if (tournament.settings?.hasTiebreaker !== false) {
      rounds.push({ roundNumber: 3, status: 'pending', teamAScore: 0, teamBScore: 0 });
    }

    // Create match with rounds
    const match = await Match.create({
      tournament: tournamentId,
      matchNumber,
      teamA: teamAId,
      teamB: teamBId,
      scheduledTime: scheduledTime || new Date(),
      roundDuration,
      rounds,
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

// @desc    Delete a match
// @route   DELETE /api/matches/:matchId
const deleteMatch = async (req, res) => {
  try {
    const DroneReport = require('../models/DroneReport'); // ✅ Import model

    const match = await Match.findById(req.params.matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // ✅ Stop ESP simulator if running
    if (runningSimulators.has(req.params.matchId)) {
      console.log(`🛑 Stopping ESP Simulator for deleted match ${req.params.matchId}...`);
      runningSimulators.get(req.params.matchId).kill();
      runningSimulators.delete(req.params.matchId);
    }

    // ✅ Delete all drone reports for this match
    await DroneReport.deleteMany({ match: req.params.matchId });
    console.log(`🗑️  Deleted all reports for match ${req.params.matchId}`);

    await Match.findByIdAndDelete(req.params.matchId);

    res.json({
      success: true,
      message: 'Match and all reports deleted successfully'
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
      .populate('teamA', 'name color members teamSize')
      .populate('teamB', 'name color members teamSize');
    
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
    nextRound.timerStatus = 'running'; // ✅ Initialize timer
    match.currentRound = nextRound.roundNumber;
    match.status = 'in_progress';

    await match.save();

    console.log(`✅ Round ${nextRound.roundNumber} started`);

    // ✅ Send MQTT START commands to all registered drones
    if (nextRound.registeredDrones && nextRound.registeredDrones.length > 0) {
      console.log(`📡 Sending START commands to ${nextRound.registeredDrones.length} drones...`);

      for (const drone of nextRound.registeredDrones) {
        // Extract droneId string from drone object
        const droneId = typeof drone === 'string' ? drone : (drone.droneId || drone);

        const config = {
          command: 'START',
          status: 'active',
          matchId: matchId,
          roundNumber: nextRound.roundNumber,
          teamA: match.teamA._id.toString(),
          teamB: match.teamB._id.toString(),
          serverUrl: `http://${process.env.SERVER_IP || '192.168.0.64'}:${process.env.PORT || 5000}/api/telemetry`
        };

        mqttService.configureDrone(droneId, config);
        console.log(`   ✅ START sent to ${droneId}`);

        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // ✅ Emit Socket.io event for real-time updates
    if (global.io) {
      global.io.to(`match-${matchId}`).emit('round-started', {
        matchId: matchId,
        roundNumber: nextRound.roundNumber,
        startTime: nextRound.startTime,
        teamA: match.teamA.name,
        teamB: match.teamB.name,
        currentRound: match.currentRound
      });
      console.log(`📡 Socket event emitted: round-started (Round ${nextRound.roundNumber})`);
    }

    // ✅ AUTO-END TIMER: Automatically end round after configured duration
    const timerKey = `${matchId}-${nextRound.roundNumber}`;
    const roundDurationMinutes = match.roundDuration || 3;
    const MAX_ROUND_TIME = roundDurationMinutes * 60 * 1000; // Convert minutes to milliseconds

    // Clear any existing timer for this round
    if (activeRoundTimers.has(timerKey)) {
      clearTimeout(activeRoundTimers.get(timerKey));
      activeRoundTimers.delete(timerKey);
    }

    // Set new auto-end timer
    const autoEndTimer = setTimeout(async () => {
      try {
        console.log(`⏰ Auto-ending Round ${nextRound.roundNumber} after ${roundDurationMinutes} minutes...`);

        // Call endRound internally
        const endMatch = await Match.findById(matchId).populate('teamA teamB tournament');
        if (!endMatch) return;

        const endRound = endMatch.rounds.find(r => r.roundNumber === nextRound.roundNumber);
        if (!endRound || endRound.status !== 'in_progress') return;

        // End the round
        endRound.status = 'completed';
        endRound.endTime = new Date();
        endRound.timerStatus = 'ended';

        // Update match scores
        endMatch.finalScoreA += endRound.teamAScore || 0;
        endMatch.finalScoreB += endRound.teamBScore || 0;

        await endMatch.save();

        // Emit socket event
        if (global.io) {
          global.io.to(`match-${matchId}`).emit('round-ended', {
            matchId,
            roundNumber: nextRound.roundNumber,
            teamAScore: endMatch.finalScoreA,
            teamBScore: endMatch.finalScoreB
          });
        }

        // Clean up timer
        activeRoundTimers.delete(timerKey);

        console.log(`✅ Round ${nextRound.roundNumber} auto-ended successfully`);
      } catch (error) {
        console.error('❌ Error auto-ending round:', error);
      }
    }, MAX_ROUND_TIME);

    // Store timer reference
    activeRoundTimers.set(timerKey, autoEndTimer);
    console.log(`⏱️  Auto-end timer set for Round ${nextRound.roundNumber} (${roundDurationMinutes} minutes)`);

    // ✅ AUTO-START ESP SIMULATOR
    try {
      // Stop any existing simulator for this match
      if (runningSimulators.has(matchId)) {
        console.log(`🛑 Stopping existing simulator for match ${matchId}...`);
        runningSimulators.get(matchId).kill();
        runningSimulators.delete(matchId);
      }

      // Get path to ESP simulator
      const simulatorPath = path.join(__dirname, '..', '..', 'esp-simulator', 'virtual_drone.py');

      // Spawn Python process with match details
      const pythonProcess = spawn('python', [
        simulatorPath,
        matchId,
        nextRound.roundNumber.toString(),
        match.teamA._id.toString(),
        match.teamB._id.toString()
      ]);

      // Store process reference
      runningSimulators.set(matchId, pythonProcess);

      // Log simulator output
      pythonProcess.stdout.on('data', (data) => {
        console.log(`[ESP Simulator]: ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`[ESP Simulator Error]: ${data.toString().trim()}`);
      });

      pythonProcess.on('close', (code) => {
        console.log(`🛑 ESP Simulator stopped (exit code ${code})`);
        runningSimulators.delete(matchId);
      });

      console.log(`✅ ESP Simulator auto-started for Round ${nextRound.roundNumber}`);

    } catch (simError) {
      console.error('❌ Failed to start ESP simulator:', simError.message);
      // Don't fail the round start if simulator fails
    }

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

    // ✅ Emit Socket.io event for live score updates
    if (global.io) {
      const scoreData = {
        matchId: matchId,
        roundNumber: match.currentRound,
        teamAScore: currentRound.teamAScore,
        teamBScore: currentRound.teamBScore,
        finalScoreA: match.finalScoreA,
        finalScoreB: match.finalScoreB,
        updatedTeam: team
      };

      const roomSize = global.io.sockets.adapter.rooms.get(`match-${matchId}`)?.size || 0;
      console.log(`📡 [SOCKET] Emitting score-updated to match-${matchId} (${roomSize} clients)`);
      console.log(`   Score: Team ${team} ${increment > 0 ? '+1' : '-1'} | Final: ${match.finalScoreA} - ${match.finalScoreB}`);

      global.io.to(`match-${matchId}`).emit('score-updated', scoreData);
      console.log(`📡 Socket event emitted: score-updated (Team ${team})`);
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

// @desc    Pause round timer
// @route   PUT /api/matches/:matchId/rounds/:roundNumber/pause
const pauseTimer = async (req, res) => {
  try {
    const { matchId, roundNumber } = req.params;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const round = match.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ success: false, message: 'Round not found' });
    if (round.timerStatus !== 'running') return res.status(400).json({ success: false, message: 'Timer is not running' });

    const now = new Date();
    round.elapsedTime = Math.floor((now - round.startTime) / 1000);
    round.pausedAt = now;
    round.timerStatus = 'paused';
    await match.save();

    // ✅ Clear auto-end timer when paused
    const timerKey = `${matchId}-${roundNumber}`;
    if (activeRoundTimers.has(timerKey)) {
      clearTimeout(activeRoundTimers.get(timerKey));
      activeRoundTimers.delete(timerKey);
      console.log(`⏱️  Cleared auto-end timer for paused Round ${roundNumber}`);
    }

    console.log(`⏸️  Timer paused for Round ${roundNumber}`);

    // Emit socket event
    if (global.io) {
      global.io.to(`match-${matchId}`).emit('timer-paused', {
        matchId,
        roundNumber: parseInt(roundNumber),
        elapsedTime: round.elapsedTime,
        timerStatus: 'paused'
      });
    }

    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resume round timer
// @route   PUT /api/matches/:matchId/rounds/:roundNumber/resume
const resumeTimer = async (req, res) => {
  try {
    const { matchId, roundNumber } = req.params;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const round = match.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ success: false, message: 'Round not found' });
    if (round.timerStatus !== 'paused') return res.status(400).json({ success: false, message: 'Timer is not paused' });

    const pauseDuration = new Date() - round.pausedAt;
    round.startTime = new Date(round.startTime.getTime() + pauseDuration);
    round.pausedAt = null;
    round.timerStatus = 'running';
    await match.save();

    console.log(`▶️  Timer resumed for Round ${roundNumber}`);

    // Emit socket event
    if (global.io) {
      global.io.to(`match-${matchId}`).emit('timer-resumed', {
        matchId,
        roundNumber: parseInt(roundNumber),
        startTime: round.startTime,
        timerStatus: 'running'
      });
    }

    // ✅ Restart auto-end timer with remaining time
    const timerKey = `${matchId}-${roundNumber}`;
    const roundDurationMinutes = match.roundDuration || 3;
    const MAX_ROUND_TIME = roundDurationMinutes * 60; // Convert minutes to seconds
    const remainingTime = Math.max(0, MAX_ROUND_TIME - round.elapsedTime);

    if (remainingTime > 0) {
      const autoEndTimer = setTimeout(async () => {
        try {
          console.log(`⏰ Auto-ending Round ${roundNumber} after resume...`);

          const endMatch = await Match.findById(matchId).populate('teamA teamB tournament');
          if (!endMatch) return;

          const endRound = endMatch.rounds.find(r => r.roundNumber === parseInt(roundNumber));
          if (!endRound || endRound.status !== 'in_progress') return;

          endRound.status = 'completed';
          endRound.endTime = new Date();
          endRound.timerStatus = 'ended';

          endMatch.finalScoreA += endRound.teamAScore || 0;
          endMatch.finalScoreB += endRound.teamBScore || 0;

          await endMatch.save();

          if (global.io) {
            global.io.to(`match-${matchId}`).emit('round-ended', {
              matchId,
              roundNumber: parseInt(roundNumber),
              teamAScore: endMatch.finalScoreA,
              teamBScore: endMatch.finalScoreB
            });
          }

          activeRoundTimers.delete(timerKey);
          console.log(`✅ Round ${roundNumber} auto-ended after resume`);
        } catch (error) {
          console.error('❌ Error auto-ending round:', error);
        }
      }, remainingTime * 1000);

      activeRoundTimers.set(timerKey, autoEndTimer);
      console.log(`⏱️  Auto-end timer restarted with ${remainingTime}s remaining`);
    }

    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset round timer
// @route   PUT /api/matches/:matchId/rounds/:roundNumber/reset
const resetTimer = async (req, res) => {
  try {
    const { matchId, roundNumber } = req.params;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const round = match.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ success: false, message: 'Round not found' });

    round.startTime = new Date();
    round.elapsedTime = 0;
    round.pausedAt = null;
    round.timerStatus = 'running';
    await match.save();

    console.log(`🔄 Timer reset for Round ${roundNumber}`);

    // Emit socket event
    if (global.io) {
      global.io.to(`match-${matchId}`).emit('timer-reset', {
        matchId,
        roundNumber: parseInt(roundNumber),
        startTime: round.startTime,
        timerStatus: 'running'
      });
    }

    // ✅ Reset auto-end timer to full duration
    const timerKey = `${matchId}-${roundNumber}`;
    const roundDurationMinutes = match.roundDuration || 3;

    // Clear existing timer
    if (activeRoundTimers.has(timerKey)) {
      clearTimeout(activeRoundTimers.get(timerKey));
      activeRoundTimers.delete(timerKey);
    }

    // Set new timer
    const MAX_ROUND_TIME = roundDurationMinutes * 60 * 1000; // Convert minutes to milliseconds
    const autoEndTimer = setTimeout(async () => {
      try {
        console.log(`⏰ Auto-ending Round ${roundNumber} after ${roundDurationMinutes} minutes...`);

        const endMatch = await Match.findById(matchId).populate('teamA teamB tournament');
        if (!endMatch) return;

        const endRound = endMatch.rounds.find(r => r.roundNumber === parseInt(roundNumber));
        if (!endRound || endRound.status !== 'in_progress') return;

        endRound.status = 'completed';
        endRound.endTime = new Date();
        endRound.timerStatus = 'ended';

        endMatch.finalScoreA += endRound.teamAScore || 0;
        endMatch.finalScoreB += endRound.teamBScore || 0;

        await endMatch.save();

        if (global.io) {
          global.io.to(`match-${matchId}`).emit('round-ended', {
            matchId,
            roundNumber: parseInt(roundNumber),
            teamAScore: endMatch.finalScoreA,
            teamBScore: endMatch.finalScoreB
          });
        }

        activeRoundTimers.delete(timerKey);
        console.log(`✅ Round ${roundNumber} auto-ended successfully`);
      } catch (error) {
        console.error('❌ Error auto-ending round:', error);
      }
    }, MAX_ROUND_TIME);

    activeRoundTimers.set(timerKey, autoEndTimer);
    console.log(`⏱️  Auto-end timer reset to full ${roundDurationMinutes} minutes`);

    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    // ✅ Clear auto-end timer if exists
    const timerKey = `${matchId}-${roundNumber}`;
    if (activeRoundTimers.has(timerKey)) {
      clearTimeout(activeRoundTimers.get(timerKey));
      activeRoundTimers.delete(timerKey);
      console.log(`⏱️  Cleared auto-end timer for Round ${roundNumber}`);
    }

    activeRound.status = 'completed';
    activeRound.endTime = new Date();

    const duration = Math.round((activeRound.endTime - activeRound.startTime) / 1000);
    console.log(`⏱️  Round duration: ${duration} seconds`);

    // ✅ AUTO-STOP ESP SIMULATOR
    try {
      if (runningSimulators.has(matchId)) {
        console.log(`🛑 Stopping ESP Simulator for match ${matchId}...`);
        const simulatorProcess = runningSimulators.get(matchId);
        simulatorProcess.kill();
        runningSimulators.delete(matchId);
        console.log(`✅ ESP Simulator stopped`);

        // Wait a moment for final telemetry to arrive
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`⚠️  No running simulator found for match ${matchId}`);
      }
    } catch (simError) {
      console.error('❌ Error stopping ESP simulator:', simError.message);
      // Don't fail the round end if simulator stop fails
    }

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

    // ✅ CREATE INDIVIDUAL DRONE REPORTS
    try {
      console.log('📝 Creating individual drone reports...');

      // Fetch telemetry data again (includes all drones for this round)
      const telemetryForReports = await DroneTelemetry.find({
        matchId: matchId,
        roundNumber: roundNumber
      });

      let reportsCreated = 0;

      for (const droneData of telemetryForReports) {
        // Get pilot info from registered drones
        const droneRegistration = activeRound.registeredDrones.find(
          d => d.droneId === droneData.droneId
        );

        if (!droneRegistration) {
          console.log(`   ⚠️ Drone ${droneData.droneId} not in registered list, skipping`);
          continue;
        }

        // Calculate stats from telemetry logs
        const logs = droneData.logs || [];
        const logsCount = logs.length;

        if (logsCount === 0) {
          console.log(`   ⚠️ No logs for ${droneData.droneId}, skipping report`);
          continue;
        }

        const firstLog = logs[0];
        const lastLog = logs[logsCount - 1];

        // Battery calculation
        const batteryStart = firstLog.battery || 100;
        const batteryEnd = lastLog.battery || 100;
        const batteryUsed = batteryStart - batteryEnd;

        // Distance and speed calculations
        let totalDistance = 0;
        const speeds = [];

        for (let i = 1; i < logsCount; i++) {
          const prev = logs[i - 1];
          const curr = logs[i];

          // 3D distance
          const dx = (curr.x || 0) - (prev.x || 0);
          const dy = (curr.y || 0) - (prev.y || 0);
          const dz = (curr.z || 0) - (prev.z || 0);
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          totalDistance += dist;

          // Speed (m/s)
          const timeDiff = ((curr.timestamp || 0) - (prev.timestamp || 0)) / 1000; // seconds
          if (timeDiff > 0 && dist > 0 && dist < 10) { // Filter unrealistic values
            const speed = dist / timeDiff;
            if (speed < 50) { // Filter unrealistic speeds
              speeds.push(speed);
            }
          }
        }

        const averageSpeed = speeds.length > 0
          ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length
          : 0;
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

        // Sample flight path (take every 10th point to reduce size)
        const sampleRate = Math.max(1, Math.floor(logsCount / 50)); // Max 50 points
        const flightPath = logs
          .filter((_, index) => index % sampleRate === 0)
          .map(log => ({
            x: log.x || 0,
            y: log.y || 0,
            z: log.z || 0,
            timestamp: new Date(log.timestamp || Date.now())
          }));

        // ML Analysis - calculate stability metrics
        let totalVariance = 0;
        let rapidMovements = 0;
        let stablePositions = 0;

        for (let i = 1; i < logsCount; i++) {
          const pitchDiff = Math.abs((logs[i].pitch || 0) - (logs[i-1].pitch || 0));
          const rollDiff = Math.abs((logs[i].roll || 0) - (logs[i-1].roll || 0));
          totalVariance += pitchDiff + rollDiff;

          const dx = (logs[i].x || 0) - (logs[i-1].x || 0);
          const dy = (logs[i].y || 0) - (logs[i-1].y || 0);
          const dz = (logs[i].z || 0) - (logs[i-1].z || 0);
          const moveDist = Math.sqrt(dx*dx + dy*dy + dz*dz);

          if (moveDist > 0.5) rapidMovements++;
          if (moveDist < 0.1) stablePositions++;
        }

        const avgVariance = logsCount > 1 ? totalVariance / logsCount : 0;
        const stabilityScore = Math.max(0, 100 - (avgVariance * 100));

        const aggressiveness = Math.min(100, (rapidMovements / logsCount) * 200);
        const defensiveness = Math.min(100, (stablePositions / logsCount) * 200);
        const efficiency = Math.min(100, batteryEnd); // Higher end battery = more efficient
        const teamwork = 50; // Placeholder (would need multi-drone analysis)

        let summary = '';
        if (aggressiveness > 60) {
          summary = 'Aggressive flying with rapid movements';
        } else if (defensiveness > 60) {
          summary = 'Defensive flying with stable positioning';
        } else {
          summary = 'Balanced flying style';
        }

        const recommendations = [];
        if (efficiency < 50) recommendations.push('Optimize battery usage');
        if (aggressiveness > 70) recommendations.push('Reduce rapid movements');
        if (defensiveness > 70) recommendations.push('Increase mobility');
        if (recommendations.length === 0) recommendations.push('Maintain performance');

        // Performance score calculation
        const performanceScore = Math.round(
          (stabilityScore * 0.3) +
          (efficiency * 0.3) +
          ((totalDistance / 10) * 0.2) +
          (aggressiveness * 0.1) +
          (teamwork * 0.1)
        );

        // Create comprehensive report
        const report = await DroneReport.create({
          match: matchId,
          roundNumber: roundNumber,
          tournament: match.tournament,
          team: droneData.teamId,
          droneId: droneData.droneId,
          pilotId: droneRegistration.pilotId,
          pilotName: droneRegistration.pilotName,
          role: droneRegistration.role || 'Forward',
          totalDistance: Math.round(totalDistance * 100) / 100,
          averageSpeed: Math.round(averageSpeed * 100) / 100,
          maxSpeed: Math.round(maxSpeed * 100) / 100,
          flightPath: flightPath,
          batteryUsage: {
            start: batteryStart,
            end: batteryEnd,
            consumed: Math.round(batteryUsed * 10) / 10
          },
          mlAnalysis: {
            aggressiveness: Math.round(aggressiveness),
            defensiveness: Math.round(defensiveness),
            teamwork: Math.round(teamwork),
            efficiency: Math.round(efficiency),
            summary: summary,
            recommendations: recommendations
          },
          performanceScore: performanceScore,
          performance: {
            overallScore: performanceScore,
            aggression: Math.round(aggressiveness),
            consistency: Math.round(stabilityScore),
            effectiveness: Math.round(efficiency)
          },
          positionAccuracy: Math.round(stabilityScore),
          status: 'completed'
        });

        reportsCreated++;
        console.log(`   ✅ Report created for ${droneData.droneId} (Distance: ${totalDistance.toFixed(1)}m, Score: ${performanceScore})`);
      }

      console.log(`📝 Created ${reportsCreated} individual drone reports`);

      // ✅ FALLBACK: Create dummy reports if no telemetry data was found
      if (reportsCreated === 0 && activeRound.registeredDrones && activeRound.registeredDrones.length > 0) {
        console.log('⚠️  No telemetry data found - creating dummy reports for testing...');

        for (const drone of activeRound.registeredDrones) {
          try {
            // ✅ ROLE-SPECIFIC DUMMY DATA
            const role = drone.role || 'Forward'; // Default to Forward if no role
            let roleBasedData = {};

            switch (role) {
              case 'Forward':
                // Aggressive, high speed, attack-focused
                roleBasedData = {
                  totalDistance: 80 + Math.random() * 30, // 80-110m (high)
                  averageSpeed: 4 + Math.random() * 2, // 4-6 m/s (high)
                  maxSpeed: 7 + Math.random() * 3, // 7-10 m/s (very high)
                  batteryEnd: 75 + Math.random() * 10, // 75-85% (moderate drain)
                  batteryConsumed: 15 + Math.random() * 10, // 15-25%
                  aggressiveness: 70 + Math.random() * 20, // 70-90 (high)
                  defensiveness: 20 + Math.random() * 20, // 20-40 (low)
                  teamwork: 45 + Math.random() * 25, // 45-70 (moderate)
                  efficiency: 70 + Math.random() * 20, // 70-90 (good)
                  stability: 55 + Math.random() * 20, // 55-75 (moderate)
                  performanceScore: 65 + Math.random() * 25, // 65-90 (good-excellent)
                  summary: 'Aggressive attacking forward with good speed control'
                };
                break;

              case 'Center':
                // Balanced, highest distance, good coordination
                roleBasedData = {
                  totalDistance: 120 + Math.random() * 40, // 120-160m (highest)
                  averageSpeed: 3.5 + Math.random() * 1.5, // 3.5-5 m/s (moderate-high)
                  maxSpeed: 5 + Math.random() * 3, // 5-8 m/s (moderate)
                  batteryEnd: 70 + Math.random() * 15, // 70-85% (higher drain due to movement)
                  batteryConsumed: 15 + Math.random() * 15, // 15-30%
                  aggressiveness: 45 + Math.random() * 20, // 45-65 (balanced)
                  defensiveness: 45 + Math.random() * 20, // 45-65 (balanced)
                  teamwork: 65 + Math.random() * 25, // 65-90 (high coordination)
                  efficiency: 65 + Math.random() * 25, // 65-90 (good)
                  stability: 70 + Math.random() * 15, // 70-85 (high)
                  performanceScore: 70 + Math.random() * 25, // 70-95 (very good)
                  summary: 'Balanced midfielder with excellent coverage and teamwork'
                };
                break;

              case 'Defender':
                // Defensive, stable, lower mobility
                roleBasedData = {
                  totalDistance: 50 + Math.random() * 20, // 50-70m (lower)
                  averageSpeed: 2.5 + Math.random() * 1.5, // 2.5-4 m/s (moderate)
                  maxSpeed: 4 + Math.random() * 2, // 4-6 m/s (moderate)
                  batteryEnd: 85 + Math.random() * 10, // 85-95% (low drain)
                  batteryConsumed: 5 + Math.random() * 10, // 5-15%
                  aggressiveness: 25 + Math.random() * 20, // 25-45 (low)
                  defensiveness: 70 + Math.random() * 20, // 70-90 (high)
                  teamwork: 55 + Math.random() * 20, // 55-75 (moderate-good)
                  efficiency: 80 + Math.random() * 15, // 80-95 (excellent)
                  stability: 75 + Math.random() * 15, // 75-90 (high)
                  performanceScore: 60 + Math.random() * 30, // 60-90 (good)
                  summary: 'Strong defensive positioning with excellent stability'
                };
                break;

              case 'Keeper':
                // Minimal movement, very stable, ultra defensive
                roleBasedData = {
                  totalDistance: 20 + Math.random() * 15, // 20-35m (minimal)
                  averageSpeed: 1 + Math.random() * 1, // 1-2 m/s (low)
                  maxSpeed: 3 + Math.random() * 2, // 3-5 m/s (low)
                  batteryEnd: 90 + Math.random() * 8, // 90-98% (very low drain)
                  batteryConsumed: 2 + Math.random() * 8, // 2-10%
                  aggressiveness: 10 + Math.random() * 15, // 10-25 (very low)
                  defensiveness: 85 + Math.random() * 15, // 85-100 (very high)
                  teamwork: 50 + Math.random() * 20, // 50-70 (moderate)
                  efficiency: 90 + Math.random() * 10, // 90-100 (excellent)
                  stability: 85 + Math.random() * 15, // 85-100 (excellent)
                  performanceScore: 75 + Math.random() * 20, // 75-95 (very good)
                  summary: 'Excellent goal protection with outstanding stability'
                };
                break;

              default:
                // Fallback to balanced
                roleBasedData = {
                  totalDistance: 70 + Math.random() * 30,
                  averageSpeed: 3 + Math.random() * 2,
                  maxSpeed: 5 + Math.random() * 3,
                  batteryEnd: 75 + Math.random() * 15,
                  batteryConsumed: 10 + Math.random() * 15,
                  aggressiveness: 50 + Math.random() * 30,
                  defensiveness: 50 + Math.random() * 30,
                  teamwork: 50 + Math.random() * 30,
                  efficiency: 70 + Math.random() * 20,
                  stability: 65 + Math.random() * 25,
                  performanceScore: 60 + Math.random() * 30,
                  summary: 'Balanced performance across all metrics'
                };
            }

            // ✅ Generate varied summary and recommendations using templates
            const metricsForTemplates = {
              aggressiveness: Math.round(roleBasedData.aggressiveness),
              defensiveness: Math.round(roleBasedData.defensiveness),
              performanceScore: Math.round(roleBasedData.performanceScore),
              teamwork: Math.round(roleBasedData.teamwork),
              efficiency: Math.round(roleBasedData.efficiency),
              speed: Math.round(roleBasedData.averageSpeed * 10) / 10,
              distance: Math.round(roleBasedData.totalDistance * 10) / 10,
              stability: Math.round(roleBasedData.stability)
            };

            const generatedSummary = generateSummary(role, metricsForTemplates);
            const generatedRecommendations = generateRecommendations(role, metricsForTemplates);

            const dummyReport = await DroneReport.create({
              match: matchId,
              roundNumber: roundNumber,
              tournament: match.tournament,
              team: drone.team,
              droneId: drone.droneId,
              pilotId: drone.pilotId,
              pilotName: drone.pilotName,
              role: drone.role || 'Forward',
              totalDistance: metricsForTemplates.distance,
              averageSpeed: metricsForTemplates.speed,
              maxSpeed: Math.round(roleBasedData.maxSpeed * 10) / 10,
              flightPath: [],
              batteryUsage: {
                start: 100,
                end: Math.round(roleBasedData.batteryEnd),
                consumed: Math.round(roleBasedData.batteryConsumed)
              },
              mlAnalysis: {
                aggressiveness: metricsForTemplates.aggressiveness,
                defensiveness: metricsForTemplates.defensiveness,
                teamwork: metricsForTemplates.teamwork,
                efficiency: metricsForTemplates.efficiency,
                summary: generatedSummary,
                recommendations: generatedRecommendations
              },
              performanceScore: metricsForTemplates.performanceScore,
              performance: {
                overallScore: metricsForTemplates.performanceScore,
                aggression: metricsForTemplates.aggressiveness,
                consistency: metricsForTemplates.stability,
                effectiveness: metricsForTemplates.efficiency
              },
              positionAccuracy: metricsForTemplates.stability,
              status: 'completed'
            });

            reportsCreated++;
            console.log(`   ✅ Dummy report created for ${drone.droneId} - ${role} (Pilot: ${drone.pilotName}, Score: ${Math.round(roleBasedData.performanceScore)})`);
          } catch (dummyError) {
            console.error(`   ❌ Failed to create dummy report for ${drone.droneId}:`, dummyError.message);
          }
        }

        console.log(`📝 Created ${reportsCreated} dummy reports (ESP simulator was not running)`);
      }

    } catch (reportError) {
      console.error('❌ Error creating drone reports:', reportError.message);
      // Don't fail the whole round end if reports fail
    }

    console.log(`✅ Round ${roundNumber} completed!`);
    console.log(`   - Team A Score: ${activeRound.teamAScore}`);
    console.log(`   - Team B Score: ${activeRound.teamBScore}`);
    console.log('=====================================\n');

    await match.populate('teamA', 'name color members teamSize');
    await match.populate('teamB', 'name color members teamSize');

    // ✅ Emit Socket.io event for round completion
    if (global.io) {
      global.io.to(`match-${matchId}`).emit('round-ended', {
        matchId: matchId,
        roundNumber: roundNumber,
        teamAScore: activeRound.teamAScore,
        teamBScore: activeRound.teamBScore,
        finalScoreA: match.finalScoreA,
        finalScoreB: match.finalScoreB,
        duration: Math.round((activeRound.endTime - activeRound.startTime) / 1000),
        mlAnalysis: activeRound.mlAnalysis || null
      });
      console.log(`📡 Socket event emitted: round-ended (Round ${roundNumber})`);
    }

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
      .populate('teamA', 'name color teamSize')
      .populate('teamB', 'name color teamSize');
    
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

    // ✅ AUTO-CALCULATE MAN OF THE MATCH
    console.log('🏅 Calculating Man of the Match...');
    const manOfTheMatch = await calculateManOfTheMatch(matchId);

    if (manOfTheMatch) {
      match.manOfTheMatch = manOfTheMatch;
      await match.save();
      console.log(`   ⭐ Man of the Match: ${manOfTheMatch.playerName} (Avg: ${manOfTheMatch.stats.avgPerformance}/100)`);
    } else {
      console.log('   ⚠️  Could not determine Man of the Match');
    }

    // ✅ Check if all tournament matches are completed
    if (match.tournament) {
      const Tournament = require('../models/Tournament');
      const allMatches = await Match.find({ tournament: match.tournament });
      const allMatchesCompleted = allMatches.every(m => m.status === 'completed');

      if (allMatchesCompleted) {
        await Tournament.findByIdAndUpdate(match.tournament, { status: 'completed' });
        console.log(`🏆 All matches completed! Tournament marked as completed.`);

        // Calculate and update tournament awards
        await calculateTournamentAwards(match.tournament);
      }
    }

    // ✅ Emit Socket.io event for match completion
    if (global.io) {
      global.io.emit('match-completed', {
        matchId: match._id,
        status: 'completed',
        winner: winner,
        winnerName: winner ? (winner.toString() === match.teamA._id.toString() ? match.teamA.name : match.teamB.name) : 'Draw',
        finalScoreA: match.finalScoreA,
        finalScoreB: match.finalScoreB,
        teamA: match.teamA.name,
        teamB: match.teamB.name,
        completedAt: match.completedAt
      });
      console.log(`📡 Socket event emitted: match-completed`);
    }

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

    // Validate drones array length (should be 2-16: 1-8 per team)
    if (drones.length < 2 || drones.length > 16) {
      return res.status(400).json({ 
        success: false,
        message: 'At least 2 drones required (1-8 per team)' 
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

// @desc    Set current match (only one match can be current at a time)
// @route   PUT /api/matches/:matchId/set-current
const setCurrentMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    // First, unset any existing current match
    await Match.updateMany({}, { isCurrentMatch: false });

    // Set this match as current
    const match = await Match.findByIdAndUpdate(
      matchId,
      { isCurrentMatch: true },
      { new: true }
    )
      .populate('tournament', 'name')
      .populate('teamA', 'name color members teamSize')
      .populate('teamB', 'name color members teamSize');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    console.log(`✅ Current match set: ${match._id}`);

    // Emit Socket.io event
    if (global.io) {
      global.io.emit('current-match-updated', {
        matchId: match._id,
        tournament: match.tournament.name,
        teamA: match.teamA.name,
        teamB: match.teamB.name,
        status: match.status
      });
      console.log(`📡 Socket event emitted: current-match-updated`);
    }

    res.json({
      success: true,
      message: 'Current match set successfully',
      data: match
    });

  } catch (error) {
    console.error('Error in setCurrentMatch:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current match
// @route   GET /api/matches/current
const getCurrentMatch = async (req, res) => {
  try {
    const match = await Match.findOne({ isCurrentMatch: true })
      .populate('tournament', 'name')
      .populate('teamA', 'name color members teamSize')
      .populate('teamB', 'name color members teamSize')
      .populate('winner', 'name');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'No current match set'
      });
    }

    res.json({
      success: true,
      data: match
    });

  } catch (error) {
    console.error('Error in getCurrentMatch:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start all drones for current round (batch command)
// @route   POST /api/matches/:matchId/start-all-drones
const startAllDrones = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate('teamA', 'name')
      .populate('teamB', 'name');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Check if there's an active round
    const activeRound = match.rounds.find(r => r.status === 'in_progress');

    if (!activeRound) {
      return res.status(400).json({
        success: false,
        message: 'No active round. Please start a round first.'
      });
    }

    // Get registered drones for this round
    const drones = activeRound.registeredDrones;

    if (!drones || drones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No drones registered for this round'
      });
    }

    // Import MQTT service
    const { configureMatchDrones } = require('../services/mqttService');

    // Send START command to all drones
    await configureMatchDrones(
      matchId,
      activeRound.roundNumber,
      drones,
      match.teamA._id,
      match.teamB._id
    );

    console.log(`✅ Batch START sent to ${drones.length} drones`);

    res.json({
      success: true,
      message: `START command sent to ${drones.length} drones`,
      drones: drones.map(d => d.droneId)
    });

  } catch (error) {
    console.error('Error in startAllDrones:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Stop all drones (batch command)
// @route   POST /api/matches/:matchId/stop-all-drones
const stopAllDrones = async (req, res) => {
  try {
    const { stopAllDrones } = require('../services/mqttService');

    // Send STOP command to all drones via MQTT broadcast
    stopAllDrones();

    console.log(`✅ Batch STOP sent to all drones`);

    res.json({
      success: true,
      message: 'STOP command sent to all drones'
    });

  } catch (error) {
    console.error('Error in stopAllDrones:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset all drones (batch command)
// @route   POST /api/matches/:matchId/reset-all-drones
const resetAllDrones = async (req, res) => {
  try {
    const { resetAllDrones } = require('../services/mqttService');

    // Send RESET command to all drones via MQTT broadcast
    resetAllDrones();

    console.log(`✅ Batch RESET sent to all drones`);

    res.json({
      success: true,
      message: 'RESET command sent to all drones'
    });

  } catch (error) {
    console.error('Error in resetAllDrones:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Set Man of the Match (Hybrid: Auto-suggest or Manual)
// @route   PUT /api/matches/:matchId/man-of-match
const setManOfTheMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { playerName, teamId, stats } = req.body;

    const match = await Match.findById(matchId)
      .populate('teamA', 'members')
      .populate('teamB', 'members');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Find player in team members to get photo
    const team = teamId === match.teamA._id.toString() ? match.teamA : match.teamB;
    const member = team.members.find(m => m.name === playerName);

    match.manOfTheMatch = {
      playerName,
      team: teamId,
      photo: member?.photo || null,
      stats: stats || { goals: 0, assists: 0, saves: 0 }
    };

    await match.save();

    // Emit Socket.io event
    if (global.io) {
      global.io.emit('man-of-match-set', {
        matchId: match._id,
        manOfTheMatch: match.manOfTheMatch
      });
    }

    res.json({
      success: true,
      message: 'Man of the Match set successfully',
      data: match.manOfTheMatch
    });

  } catch (error) {
    console.error('Error setting Man of the Match:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Calculate and update tournament awards based on role performance
// @access  Internal (called automatically when tournament completes)
const calculateTournamentAwards = async (tournamentId) => {
  try {
    console.log(`🏆 Calculating tournament awards for tournament: ${tournamentId}`);

    const DroneReport = require('../models/DroneReport');
    const Tournament = require('../models/Tournament');
    const Team = require('../models/Team');

    // Get all reports for this tournament
    const reports = await DroneReport.find({ tournament: tournamentId })
      .populate('team', 'name members');

    if (reports.length === 0) {
      console.log('   ⚠️  No reports found for awards calculation');
      return;
    }

    console.log(`   📊 Processing ${reports.length} reports...`);

    // Group by pilotId and role
    const pilotRoleStats = {};

    reports.forEach(report => {
      const { pilotId, pilotName, role, performanceScore, team } = report;

      if (!role || !pilotId) return; // Skip if no role or pilot info

      const key = `${pilotId}_${role}`;

      if (!pilotRoleStats[key]) {
        pilotRoleStats[key] = {
          pilotId,
          pilotName,
          role,
          team,
          totalPerformance: 0,
          matchCount: 0,
          matches: new Set()
        };
      }

      pilotRoleStats[key].totalPerformance += performanceScore || 0;
      pilotRoleStats[key].matchCount++;
      pilotRoleStats[key].matches.add(report.match.toString());
    });

    // Calculate average performance for each pilot-role combination
    const pilotRoleAverages = Object.values(pilotRoleStats).map(stats => ({
      ...stats,
      avgPerformance: Math.round(stats.totalPerformance / stats.matchCount),
      totalMatches: stats.matches.size
    }));

    console.log(`   🎯 Calculated stats for ${pilotRoleAverages.length} pilot-role combinations`);

    // Find best performer for each role
    const roles = ['Forward', 'Center', 'Defender', 'Keeper'];
    const awards = {};

    for (const role of roles) {
      const rolePlayers = pilotRoleAverages.filter(p => p.role === role);

      if (rolePlayers.length === 0) {
        console.log(`   ⚠️  No players found for role: ${role}`);
        continue;
      }

      // Sort by average performance (descending)
      rolePlayers.sort((a, b) => b.avgPerformance - a.avgPerformance);

      const bestPlayer = rolePlayers[0];

      // Get player photo from team members
      let photo = null;
      if (bestPlayer.team && bestPlayer.team.members) {
        const member = bestPlayer.team.members.find(m => m.name === bestPlayer.pilotName);
        photo = member?.photo || null;
      }

      const roleKey = `best${role}`;
      awards[roleKey] = {
        playerName: bestPlayer.pilotName,
        team: bestPlayer.team._id,
        photo: photo,
        stats: {
          avgPerformance: bestPlayer.avgPerformance,
          totalMatches: bestPlayer.totalMatches
        }
      };

      console.log(`   ✅ Best ${role}: ${bestPlayer.pilotName} (Avg: ${bestPlayer.avgPerformance})`);
    }

    // Update tournament with awards
    await Tournament.findByIdAndUpdate(tournamentId, { awards });

    console.log(`🏆 Tournament awards updated successfully!`);

  } catch (error) {
    console.error('❌ Error calculating tournament awards:', error);
  }
};

module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  deleteMatch,
  startRound,
  pauseTimer,
  resumeTimer,
  resetTimer,
  updateScore,
  endRound,
  completeMatch,
  registerDrones,
  setCurrentMatch,
  getCurrentMatch,
  startAllDrones,
  stopAllDrones,
  resetAllDrones,
  setManOfTheMatch
};