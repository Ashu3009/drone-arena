// backend/controllers/droneReportController.js
const DroneReport = require('../models/DroneReport');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const { generateReportPDF } = require('../utils/pdfGenerator');

// @desc    Get all tournaments with report counts (for filtering)
// @route   GET /api/reports/tournaments
// @access  Private (Admin only)
const getReportsByTournament = async (req, res) => {
  try {
    const { city, dateFrom, dateTo } = req.query;

    // Build tournament filter
    const tournamentFilter = {};
    if (city) {
      tournamentFilter['location.city'] = new RegExp(city, 'i');
    }
    if (dateFrom || dateTo) {
      tournamentFilter.startDate = {};
      if (dateFrom) tournamentFilter.startDate.$gte = new Date(dateFrom);
      if (dateTo) tournamentFilter.startDate.$lte = new Date(dateTo);
    }

    // Get tournaments with match counts
    const tournaments = await Tournament.find(tournamentFilter).sort({ startDate: -1 });

    // Get report counts for each tournament
    const tournamentsWithCounts = await Promise.all(
      tournaments.map(async (tournament) => {
        const reportCount = await DroneReport.countDocuments({ tournament: tournament._id });
        const matchCount = await Match.countDocuments({ tournament: tournament._id });

        return {
          _id: tournament._id,
          name: tournament.name,
          location: tournament.location,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          reportCount,
          matchCount
        };
      })
    );

    res.json({
      success: true,
      count: tournamentsWithCounts.length,
      data: tournamentsWithCounts
    });
  } catch (error) {
    console.error('Error in getReportsByTournament:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get team aggregate stats for a tournament
// @route   GET /api/reports/tournaments/:tournamentId/teams
// @access  Private (Admin only)
const getTournamentTeamAggregates = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Get all reports for this tournament
    const reports = await DroneReport.find({ tournament: tournamentId })
      .populate('team', 'name color members')
      .populate('match', 'teamA teamB finalScoreA finalScoreB');

    if (reports.length === 0) {
      return res.json({
        success: true,
        message: 'No reports found for this tournament',
        data: []
      });
    }

    // Group by team
    const teamStats = {};

    reports.forEach(report => {
      const teamId = report.team._id.toString();

      if (!teamStats[teamId]) {
        teamStats[teamId] = {
          team: report.team,
          totalMatches: 0,
          totalReports: 0,
          totalDistance: 0,
          avgSpeed: 0,
          avgPerformanceScore: 0,
          avgStability: 0,
          avgAggressiveness: 0,
          avgDefensiveness: 0,
          avgEfficiency: 0,
          bestPerformance: 0,
          totalBatteryUsed: 0,
          matchesPlayed: new Set(),
          droneCount: new Set()
        };
      }

      const stats = teamStats[teamId];
      stats.totalReports++;
      stats.totalDistance += report.totalDistance || 0;
      stats.avgSpeed += report.averageSpeed || 0;
      stats.avgPerformanceScore += report.performanceScore || 0;
      stats.avgStability += report.positionAccuracy || 0;
      stats.avgAggressiveness += report.mlAnalysis?.aggressiveness || 0;
      stats.avgDefensiveness += report.mlAnalysis?.defensiveness || 0;
      stats.avgEfficiency += report.mlAnalysis?.efficiency || 0;
      stats.totalBatteryUsed += report.batteryUsage?.consumed || 0;
      stats.matchesPlayed.add(report.match._id.toString());
      stats.droneCount.add(report.droneId);

      if (report.performanceScore > stats.bestPerformance) {
        stats.bestPerformance = report.performanceScore;
        stats.bestDrone = report.droneId;
      }
    });

    // Calculate averages
    const aggregates = Object.values(teamStats).map(stats => {
      const count = stats.totalReports;
      return {
        team: stats.team,
        totalMatches: stats.matchesPlayed.size,
        totalReports: count,
        totalDrones: stats.droneCount.size,
        totalDistance: Math.round(stats.totalDistance * 10) / 10,
        avgSpeed: Math.round((stats.avgSpeed / count) * 10) / 10,
        avgPerformanceScore: Math.round(stats.avgPerformanceScore / count),
        avgStability: Math.round(stats.avgStability / count),
        avgAggressiveness: Math.round(stats.avgAggressiveness / count),
        avgDefensiveness: Math.round(stats.avgDefensiveness / count),
        avgEfficiency: Math.round(stats.avgEfficiency / count),
        bestPerformance: Math.round(stats.bestPerformance),
        bestDrone: stats.bestDrone,
        totalBatteryUsed: Math.round(stats.totalBatteryUsed * 10) / 10,
        playingStyle: getPlayingStyle(
          stats.avgAggressiveness / count,
          stats.avgDefensiveness / count
        )
      };
    });

    // Sort by average performance
    aggregates.sort((a, b) => b.avgPerformanceScore - a.avgPerformanceScore);

    res.json({
      success: true,
      count: aggregates.length,
      data: aggregates
    });
  } catch (error) {
    console.error('Error in getTournamentTeamAggregates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reports for a match (grouped by rounds)
// @route   GET /api/reports/matches/:matchId
// @access  Private (Admin only)
const getReportsByMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const reports = await DroneReport.find({ match: matchId })
      .populate('team', 'name color members')
      .sort({ roundNumber: 1, 'team.name': 1, droneId: 1 });

    // Group by round
    const roundGroups = {};
    reports.forEach(report => {
      const roundNum = report.roundNumber;
      if (!roundGroups[roundNum]) {
        roundGroups[roundNum] = [];
      }
      roundGroups[roundNum].push(report);
    });

    res.json({
      success: true,
      count: reports.length,
      data: {
        reports,
        byRound: roundGroups,
        totalRounds: Object.keys(roundGroups).length
      }
    });
  } catch (error) {
    console.error('Error in getReportsByMatch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single detailed report
// @route   GET /api/reports/:reportId
// @access  Private (Admin only)
const getReportById = async (req, res) => {
  try {
    const report = await DroneReport.findById(req.params.reportId)
      .populate('match', 'teamA teamB finalScoreA finalScoreB rounds')
      .populate('team', 'name color members')
      .populate('tournament', 'name location');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Find pilot name from team members
    const pilot = report.team.members.find(m =>
      report.match.rounds[report.roundNumber - 1]?.registeredDrones?.some(d =>
        d.droneId === report.droneId && d.pilot === m.name
      )
    );

    res.json({
      success: true,
      data: {
        ...report.toObject(),
        pilotName: pilot?.name || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Error in getReportById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pilot aggregate stats for a tournament (pilot-wise performance)
// @route   GET /api/reports/tournaments/:tournamentId/pilots
// @access  Private (Admin only)
const getTournamentPilotAggregates = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Get all reports for this tournament
    const reports = await DroneReport.find({ tournament: tournamentId })
      .populate('team', 'name color');

    if (reports.length === 0) {
      return res.json({
        success: true,
        message: 'No reports found for this tournament',
        data: []
      });
    }

    // Group by pilot
    const pilotStats = {};

    reports.forEach(report => {
      const pilotId = report.pilotId;

      if (!pilotStats[pilotId]) {
        pilotStats[pilotId] = {
          pilotId: report.pilotId,
          pilotName: report.pilotName,
          team: report.team,
          totalMatches: 0,
          totalRounds: 0,
          totalDistance: 0,
          avgSpeed: 0,
          avgPerformanceScore: 0,
          avgStability: 0,
          avgAggressiveness: 0,
          avgDefensiveness: 0,
          avgEfficiency: 0,
          bestPerformance: 0,
          totalBatteryUsed: 0,
          matchesPlayed: new Set(),
          dronesUsed: new Set()
        };
      }

      const stats = pilotStats[pilotId];
      stats.totalRounds++;
      stats.totalDistance += report.totalDistance || 0;
      stats.avgSpeed += report.averageSpeed || 0;
      stats.avgPerformanceScore += report.performanceScore || 0;
      stats.avgStability += report.positionAccuracy || 0;
      stats.avgAggressiveness += report.mlAnalysis?.aggressiveness || 0;
      stats.avgDefensiveness += report.mlAnalysis?.defensiveness || 0;
      stats.avgEfficiency += report.mlAnalysis?.efficiency || 0;
      stats.totalBatteryUsed += report.batteryUsage?.consumed || 0;
      stats.matchesPlayed.add(report.match.toString());
      stats.dronesUsed.add(report.droneId);

      if (report.performanceScore > stats.bestPerformance) {
        stats.bestPerformance = report.performanceScore;
        stats.bestDrone = report.droneId;
      }
    });

    // Calculate averages
    const aggregates = Object.values(pilotStats).map(stats => {
      const count = stats.totalRounds;
      return {
        pilotId: stats.pilotId,
        pilotName: stats.pilotName,
        team: stats.team,
        totalMatches: stats.matchesPlayed.size,
        totalRounds: count,
        totalDrones: stats.dronesUsed.size,
        totalDistance: Math.round(stats.totalDistance * 10) / 10,
        avgSpeed: Math.round((stats.avgSpeed / count) * 10) / 10,
        avgPerformanceScore: Math.round(stats.avgPerformanceScore / count),
        avgStability: Math.round(stats.avgStability / count),
        avgAggressiveness: Math.round(stats.avgAggressiveness / count),
        avgDefensiveness: Math.round(stats.avgDefensiveness / count),
        avgEfficiency: Math.round(stats.avgEfficiency / count),
        bestPerformance: Math.round(stats.bestPerformance),
        bestDrone: stats.bestDrone,
        totalBatteryUsed: Math.round(stats.totalBatteryUsed * 10) / 10,
        playingStyle: getPlayingStyle(
          stats.avgAggressiveness / count,
          stats.avgDefensiveness / count
        )
      };
    });

    // Sort by average performance
    aggregates.sort((a, b) => b.avgPerformanceScore - a.avgPerformanceScore);

    res.json({
      success: true,
      count: aggregates.length,
      data: aggregates
    });
  } catch (error) {
    console.error('Error in getTournamentPilotAggregates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to determine playing style
const getPlayingStyle = (aggressiveness, defensiveness) => {
  if (aggressiveness > 60 && defensiveness < 40) {
    return 'Aggressive';
  } else if (defensiveness > 60 && aggressiveness < 40) {
    return 'Defensive';
  } else if (Math.abs(aggressiveness - defensiveness) < 20) {
    return 'Balanced';
  } else if (aggressiveness > defensiveness) {
    return 'Offensive-minded';
  } else {
    return 'Defensive-minded';
  }
};

// @desc    Download PDF report for a specific drone report
// @route   GET /api/reports/:reportId/pdf
// @access  Private (Admin only)
const downloadReportPDF = async (req, res) => {
  try {
    const { reportId } = req.params;

    console.log(`📄 PDF download requested for report: ${reportId}`);

    // Fetch the report with all necessary populated fields
    const report = await DroneReport.findById(reportId)
      .populate('team', 'name color members')
      .populate('tournament', 'name location')
      .populate({
        path: 'match',
        populate: [
          { path: 'teamA', select: 'name color' },
          { path: 'teamB', select: 'name color' },
          { path: 'winner', select: 'name color' }
        ]
      });

    if (!report) {
      console.error(`❌ Report not found: ${reportId}`);
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    console.log(`   ✅ Report found: ${report.pilotName || 'Unknown'} (${report.droneId})`);
    console.log(`   📊 Match: ${report.match?.matchNumber || 'N/A'}`);
    console.log(`   🎯 Round: ${report.roundNumber}`);

    // Generate PDF
    console.log(`   🔨 Generating PDF...`);
    const pdfDoc = generateReportPDF(report, report.match);

    // Set response headers for PDF download
    const fileName = report.pilotName
      ? `Report_${report.pilotName.replace(/\s+/g, '_')}_Round${report.roundNumber}_${Date.now()}.pdf`
      : `Report_${report.droneId}_Round${report.roundNumber}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    // Handle PDF generation errors
    pdfDoc.on('error', (err) => {
      console.error('❌ PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'PDF generation failed' });
      }
    });

    // Pipe the PDF to response
    pdfDoc.pipe(res);

    pdfDoc.on('end', () => {
      console.log(`   ✅ PDF generated successfully for ${report.pilotName}`);
    });

    console.log(`📥 PDF streaming started for ${report.pilotName} (${report.droneId}) - Round ${report.roundNumber}`);

  } catch (error) {
    console.error('❌ Error in downloadReportPDF:', error);
    console.error('❌ Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: `Failed to generate PDF report: ${error.message}` });
    }
  }
};

module.exports = {
  getReportsByTournament,
  getTournamentTeamAggregates,
  getTournamentPilotAggregates,
  getReportsByMatch,
  getReportById,
  downloadReportPDF
};
