// backend/controllers/analysisController.js
const DroneTelemetry = require('../models/DroneTelemetry');
const Match = require('../models/Match');
const ESPDevice = require('../models/ESPDevice');
const DroneReport = require('../models/DroneReport');

// ========================================
// Helper Functions: Metric Calculations
// ========================================

/**
 * Calculate movement intensity (magnitude of acceleration vector)
 */
function calculateIntensity(logs) {
  return logs.map(log => {
    const { x, y, z } = log;
    return Math.sqrt(x * x + y * y + z * z);
  });
}

/**
 * Calculate average value of array
 */
function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate standard deviation (measure of consistency)
 */
function standardDeviation(arr) {
  if (arr.length === 0) return 0;
  const avg = average(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

/**
 * Normalize value to 0-100 range
 */
function normalize(value, min, max) {
  if (value <= min) return 0;
  if (value >= max) return 100;
  return ((value - min) / (max - min)) * 100;
}

/**
 * Detect burst patterns (sudden high acceleration)
 */
function detectBursts(intensityArray, threshold = 18) {
  let burstCount = 0;
  let inBurst = false;

  for (let i = 0; i < intensityArray.length; i++) {
    if (intensityArray[i] > threshold && !inBurst) {
      burstCount++;
      inBurst = true;
    } else if (intensityArray[i] <= threshold) {
      inBurst = false;
    }
  }

  return burstCount;
}

/**
 * Calculate idle time percentage (low movement)
 */
function calculateIdlePercentage(intensityArray, idleThreshold = 2) {
  const idleCount = intensityArray.filter(val => val < idleThreshold).length;
  return (idleCount / intensityArray.length) * 100;
}

/**
 * Count direction changes (maneuverability)
 */
function countDirectionChanges(logs, threshold = 30) {
  let changes = 0;

  for (let i = 1; i < logs.length; i++) {
    const prevLog = logs[i - 1];
    const currLog = logs[i];

    const pitchChange = Math.abs(currLog.pitch - prevLog.pitch);
    const rollChange = Math.abs(currLog.roll - prevLog.roll);

    if (pitchChange > threshold || rollChange > threshold) {
      changes++;
    }
  }

  return changes;
}

/**
 * Estimate total distance traveled (rough approximation)
 */
function estimateDistance(intensityArray, intervalSeconds = 0.05) {
  // Approximate distance = sum of (velocity * time)
  // velocity ≈ acceleration * time
  let totalDistance = 0;

  for (let i = 0; i < intensityArray.length; i++) {
    const velocity = intensityArray[i] * intervalSeconds;
    totalDistance += velocity * intervalSeconds;
  }

  return totalDistance;
}

// ========================================
// Role-Based Analysis Functions
// ========================================

/**
 * Analyze Forward performance (Aggressive attacker)
 */
function analyzeForward(metrics) {
  const { avgIntensity, burstCount, idlePercentage, directionChanges } = metrics;

  // Forward scoring weights
  const aggressionScore = normalize(avgIntensity, 8, 25) * 100; // High movement = good
  const activityScore = (100 - idlePercentage); // Low idle = good
  const burstScore = normalize(burstCount, 5, 30) * 100; // Many bursts = good

  const overallScore = (
    aggressionScore * 0.4 +
    activityScore * 0.3 +
    burstScore * 0.3
  );

  // Generate insights
  const insights = [];
  if (aggressionScore > 80) {
    insights.push('High aggression maintained throughout round');
  } else if (aggressionScore < 50) {
    insights.push('⚠️ Low aggression - increase movement intensity');
  }

  if (burstCount > 20) {
    insights.push(`${burstCount} attack rushes detected (Excellent!)`);
  } else if (burstCount < 10) {
    insights.push(`⚠️ Only ${burstCount} attack rushes - be more aggressive`);
  }

  if (idlePercentage < 10) {
    insights.push(`${(100 - idlePercentage).toFixed(1)}% active play time`);
  } else {
    insights.push(`⚠️ ${idlePercentage.toFixed(1)}% idle time - stay active`);
  }

  // Recommendations
  const recommendations = [];
  if (burstCount < 15) {
    recommendations.push('Increase frequency of attack rushes');
  }
  if (idlePercentage > 15) {
    recommendations.push('Reduce idle time - maintain constant pressure');
  }
  if (aggressionScore > 80 && burstCount > 20) {
    recommendations.push('Excellent aggressive play! Coordinate with Striker');
  }

  return {
    overallScore: Math.round(overallScore),
    aggression: Math.round(aggressionScore),
    consistency: Math.round(activityScore),
    effectiveness: Math.round(burstScore),
    insights,
    recommendations
  };
}

/**
 * Analyze Striker performance (Goal scorer)
 */
function analyzeStriker(metrics) {
  const { avgIntensity, burstCount, stdDevIntensity, directionChanges } = metrics;

  // Striker scoring weights
  const burstScore = normalize(burstCount, 8, 25) * 100; // Shot attempts
  const balanceScore = normalize(avgIntensity, 10, 20) * 100; // Balanced movement
  const maneuverScore = normalize(directionChanges, 50, 200) * 100; // Sharp turns

  const overallScore = (
    burstScore * 0.4 +
    balanceScore * 0.3 +
    maneuverScore * 0.3
  );

  const insights = [];
  if (burstCount > 15) {
    insights.push(`${burstCount} shot attempts detected (Great positioning!)`);
  } else {
    insights.push(`⚠️ Only ${burstCount} shot attempts - position better`);
  }

  if (avgIntensity >= 10 && avgIntensity <= 20) {
    insights.push('Balanced movement - good positioning');
  } else if (avgIntensity > 20) {
    insights.push('⚠️ Too aggressive - focus on accuracy');
  } else {
    insights.push('⚠️ Too passive - increase pressure');
  }

  const recommendations = [];
  if (burstCount < 12) {
    recommendations.push('More sustained pressure near opponent goal');
  }
  if (directionChanges < 100) {
    recommendations.push('Improve maneuverability with sharper turns');
  }
  if (burstScore > 75) {
    recommendations.push('Excellent shot attempts! Work on timing');
  }

  return {
    overallScore: Math.round(overallScore),
    aggression: Math.round(burstScore),
    consistency: Math.round(balanceScore),
    effectiveness: Math.round(maneuverScore),
    insights,
    recommendations
  };
}

/**
 * Analyze Defender performance (Territory protector)
 */
function analyzeDefender(metrics) {
  const { avgIntensity, burstCount, stdDevIntensity, idlePercentage } = metrics;

  // Defender scoring weights
  const reactionScore = normalize(burstCount, 5, 20) * 100; // Quick reactions
  const stabilityScore = normalize(20 - stdDevIntensity, 0, 20) * 100; // Controlled flight
  const zoneControlScore = normalize(avgIntensity, 6, 15) * 100; // Moderate movement

  const overallScore = (
    reactionScore * 0.3 +
    stabilityScore * 0.4 +
    zoneControlScore * 0.3
  );

  const insights = [];
  if (burstCount > 12) {
    insights.push(`${burstCount} interception attempts (Excellent defense!)`);
  } else {
    insights.push(`⚠️ ${burstCount} interceptions - improve reaction time`);
  }

  if (stdDevIntensity < 8) {
    insights.push('Stable positioning - good zone control');
  } else {
    insights.push('⚠️ Erratic movement - maintain consistent positioning');
  }

  const recommendations = [];
  if (burstCount < 10) {
    recommendations.push('Faster response to opponent attacks');
  }
  if (stdDevIntensity > 10) {
    recommendations.push('Maintain more controlled flight patterns');
  }
  if (stabilityScore > 80 && reactionScore > 70) {
    recommendations.push('Strong defensive play! Anticipate attacks earlier');
  }

  return {
    overallScore: Math.round(overallScore),
    aggression: Math.round(reactionScore),
    consistency: Math.round(stabilityScore),
    effectiveness: Math.round(zoneControlScore),
    insights,
    recommendations
  };
}

/**
 * Analyze Keeper performance (Goal guardian)
 */
function analyzeKeeper(metrics) {
  const { avgIntensity, burstCount, idlePercentage, stdDevIntensity } = metrics;

  // Keeper scoring weights
  const saveScore = normalize(burstCount, 3, 15) * 100; // Save attempts
  const positioningScore = (100 - idlePercentage); // Should be mostly stationary
  const stabilityScore = normalize(25 - avgIntensity, 0, 25) * 100; // Low baseline movement

  const overallScore = (
    saveScore * 0.4 +
    positioningScore * 0.3 +
    stabilityScore * 0.3
  );

  const insights = [];
  if (burstCount > 8) {
    insights.push(`${burstCount} save attempts (Great reflexes!)`);
  } else {
    insights.push(`⚠️ ${burstCount} saves - anticipate attacks better`);
  }

  if (idlePercentage > 70) {
    insights.push(`${idlePercentage.toFixed(1)}% stable positioning (Excellent!)`);
  } else {
    insights.push('⚠️ Too much movement - hold position near goal');
  }

  const recommendations = [];
  if (burstCount < 6) {
    recommendations.push('Anticipate attacks earlier for faster saves');
  }
  if (idlePercentage < 60) {
    recommendations.push('Maintain more stable positioning near goal');
  }
  if (saveScore > 75 && idlePercentage > 70) {
    recommendations.push('Outstanding goalkeeping! Perfect positioning');
  }

  return {
    overallScore: Math.round(overallScore),
    aggression: Math.round(saveScore),
    consistency: Math.round(positioningScore),
    effectiveness: Math.round(stabilityScore),
    insights,
    recommendations
  };
}

// ========================================
// Main Analysis Function
// ========================================

/**
 * Analyze single drone performance
 */
async function analyzeDrone(telemetryDoc, espDevice) {
  const { logs } = telemetryDoc;
  const role = espDevice.role;

  if (!logs || logs.length === 0) {
    return {
      status: 'disconnected',
      droneId: telemetryDoc.droneId,
      role: role,
      message: '⚠️ Connection Lost - No hardware telemetry received',
      performance: {
        overallScore: 0,
        aggression: 0,
        consistency: 0,
        effectiveness: 0,
        insights: ['Hardware not connected or powered off'],
        recommendations: [
          'Check ESP32 connection',
          'Verify drone is powered on',
          'Ensure network connectivity',
          'Register ESP hardware if not done'
        ]
      },
      metrics: {
        avgIntensity: 0,
        burstCount: 0,
        idlePercentage: 100,
        directionChanges: 0,
        totalDistance: '0m',
        dataPoints: 0
      },
      grade: 'N/A'
    };
  }

  // Calculate base metrics
  const intensityArray = calculateIntensity(logs);
  const avgIntensity = average(intensityArray);
  const stdDevIntensity = standardDeviation(intensityArray);
  const burstCount = detectBursts(intensityArray);
  const idlePercentage = calculateIdlePercentage(intensityArray);
  const directionChanges = countDirectionChanges(logs);
  const estimatedDistance = estimateDistance(intensityArray);

  const baseMetrics = {
    avgIntensity: parseFloat(avgIntensity.toFixed(2)),
    burstCount,
    idlePercentage: parseFloat(idlePercentage.toFixed(1)),
    directionChanges,
    totalDistance: `~${Math.round(estimatedDistance)}m`,
    dataPoints: logs.length,
    stdDevIntensity: parseFloat(stdDevIntensity.toFixed(2))
  };

  // Role-based analysis
  let performance;
  switch (role) {
    case 'Forward':
      performance = analyzeForward({ ...baseMetrics, avgIntensity, burstCount, idlePercentage, directionChanges });
      break;
    case 'Striker':
      performance = analyzeStriker({ ...baseMetrics, avgIntensity, burstCount, stdDevIntensity, directionChanges });
      break;
    case 'Defender':
      performance = analyzeDefender({ ...baseMetrics, avgIntensity, burstCount, stdDevIntensity, idlePercentage });
      break;
    case 'Keeper':
      performance = analyzeKeeper({ ...baseMetrics, avgIntensity, burstCount, idlePercentage, stdDevIntensity });
      break;
    default:
      performance = {
        overallScore: 0,
        aggression: 0,
        consistency: 0,
        effectiveness: 0,
        insights: ['Unknown role'],
        recommendations: []
      };
  }

  // Determine grade
  const score = performance.overallScore;
  let grade;
  if (score >= 85) grade = 'A+';
  else if (score >= 75) grade = 'A';
  else if (score >= 65) grade = 'B+';
  else if (score >= 55) grade = 'B';
  else if (score >= 45) grade = 'C';
  else grade = 'D';

  return {
    droneId: telemetryDoc.droneId,
    role,
    performance,
    metrics: baseMetrics,
    grade
  };
}

// ========================================
// API Controller: Analyze Round
// ========================================

const analyzeRound = async (req, res) => {
  try {
    const { matchId, roundNumber } = req.params;

    // Find match
    const match = await Match.findById(matchId).populate('teamA teamB');
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Find round
    const round = match.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    // Get all registered drones for this round
    const registeredDrones = round.registeredDrones || [];

    // Get all telemetry for this round
    const telemetryDocs = await DroneTelemetry.find({
      matchId,
      roundNumber: parseInt(roundNumber)
    });

    // Create a map of drones with telemetry
    const telemetryMap = {};
    telemetryDocs.forEach(doc => {
      telemetryMap[doc.droneId] = doc;
    });

    // Analyze each registered drone
    const reports = [];
    for (const drone of registeredDrones) {
      const droneId = drone.droneId; // Extract droneId string from drone object
      const espDevice = await ESPDevice.findOne({ droneId });

      let analysis;
      let teamId = droneId.startsWith('R') ? match.teamA._id : match.teamB._id;

      if (!espDevice) {
        // Drone registered but no ESP device found
        analysis = {
          status: 'not_registered',
          droneId: droneId,
          role: drone.role || 'Unknown',
          team: droneId.startsWith('R') ? match.teamA.name : match.teamB.name,
          teamId: teamId,
          message: '⚠️ ESP Hardware Not Registered',
          pilotName: drone.pilotName || 'Unknown',
          pilotId: drone.pilotId || null,
          totalDistance: 0,
          averageSpeed: 0,
          maxSpeed: 0,
          positionAccuracy: 0,
          batteryUsage: {
            start: 100,
            end: 100,
            consumed: 0
          },
          mlAnalysis: {
            aggressiveness: 0,
            defensiveness: 0,
            teamwork: 0,
            efficiency: 0,
            summary: 'ESP hardware not registered - no performance data available'
          },
          performance: {
            overallScore: 0,
            aggression: 0,
            consistency: 0,
            effectiveness: 0
          },
          insights: {
            insights: ['ESP hardware not registered for this drone'],
            recommendations: [
              'Register ESP device in Admin Panel → ESP Devices',
              'Assign MAC address to this drone ID'
            ]
          },
          metrics: {
            avgIntensity: 0,
            burstCount: 0,
            idlePercentage: 100,
            directionChanges: 0,
            totalDistanceCalc: '0m',
            dataPoints: 0
          },
          grade: 'N/A'
        };
      } else {
        // Check if telemetry exists for this drone
        const telemetryDoc = telemetryMap[droneId];

        if (!telemetryDoc) {
          // ESP registered but no telemetry received
          analysis = {
            status: 'disconnected',
            droneId: droneId,
            role: espDevice.role,
            message: '⚠️ Connection Lost - No telemetry data received',
            pilotName: drone.pilotName || 'Unknown',
            pilotId: drone.pilotId || null,
            totalDistance: 0,
            averageSpeed: 0,
            maxSpeed: 0,
            positionAccuracy: 0,
            batteryUsage: {
              start: 100,
              end: 100,
              consumed: 0
            },
            mlAnalysis: {
              aggressiveness: 0,
              defensiveness: 0,
              teamwork: 0,
              efficiency: 0,
              summary: 'Drone disconnected during match - no telemetry data received'
            },
            performance: {
              overallScore: 0,
              aggression: 0,
              consistency: 0,
              effectiveness: 0
            },
            insights: {
              insights: ['Hardware not connected or powered off during match'],
              recommendations: [
                'Check ESP32 power supply',
                'Verify WiFi connection',
                'Ensure device was online during match',
                'Check Serial Monitor for connection errors'
              ]
            },
            metrics: {
              avgIntensity: 0,
              burstCount: 0,
              idlePercentage: 100,
              directionChanges: 0,
              totalDistanceCalc: '0m',
              dataPoints: 0
            },
            grade: 'N/A'
          };

          // Add team info
          if (droneId.startsWith('R')) {
            analysis.team = match.teamA.name;
            analysis.teamId = match.teamA._id;
          } else if (droneId.startsWith('B')) {
            analysis.team = match.teamB.name;
            analysis.teamId = match.teamB._id;
          }
        } else {
          // Normal analysis for drones with telemetry
          analysis = await analyzeDrone(telemetryDoc, espDevice);

          // Add team info
          if (droneId.startsWith('R')) {
            analysis.team = match.teamA.name;
            analysis.teamId = match.teamA._id;
          } else if (droneId.startsWith('B')) {
            analysis.team = match.teamB.name;
            analysis.teamId = match.teamB._id;
          }
        }
      }

      // Save to database
      try {
        // Check if report already exists
        let savedReport = await DroneReport.findOne({
          match: matchId,
          roundNumber: parseInt(roundNumber),
          droneId: droneId
        });

        if (savedReport) {

          // ✅ DON'T overwrite completed reports - just return existing data
          if (savedReport.status === 'completed' && savedReport.performance?.overallScore > 0) {
            analysis._id = savedReport._id;
            reports.push(savedReport.toObject());
            continue; // Skip to next drone
          }
  
          // Update existing report (only if incomplete)
          // Update existing report
          Object.assign(savedReport, {
            tournament: match.tournament,
            team: teamId,
            teamId: teamId,
            role: analysis.role,
            pilotName: analysis.pilotName || 'Unknown',
            pilotId: analysis.pilotId || null,
            totalDistance: analysis.totalDistance || 0,
            averageSpeed: analysis.averageSpeed || 0,
            maxSpeed: analysis.maxSpeed || 0,
            positionAccuracy: analysis.positionAccuracy || 0,
            batteryUsage: analysis.batteryUsage || { start: 100, end: 100, consumed: 0 },
            mlAnalysis: analysis.mlAnalysis || { aggressiveness: 0, defensiveness: 0, teamwork: 0, efficiency: 0 },
            performance: analysis.performance,
            metrics: analysis.metrics,
            insights: analysis.insights,
            grade: analysis.grade,
            status: analysis.status || 'completed',
          });
          await savedReport.save();
        } else {
          // Create new report
          savedReport = await DroneReport.create({
            match: matchId,
            tournament: match.tournament,
            roundNumber: parseInt(roundNumber),
            droneId: droneId,
            team: teamId,
            teamId: teamId,
            role: analysis.role,
            pilotName: analysis.pilotName || 'Unknown',
            pilotId: analysis.pilotId || null,
            totalDistance: analysis.totalDistance || 0,
            averageSpeed: analysis.averageSpeed || 0,
            maxSpeed: analysis.maxSpeed || 0,
            positionAccuracy: analysis.positionAccuracy || 0,
            batteryUsage: analysis.batteryUsage || { start: 100, end: 100, consumed: 0 },
            mlAnalysis: analysis.mlAnalysis || { aggressiveness: 0, defensiveness: 0, teamwork: 0, efficiency: 0 },
            performance: analysis.performance,
            metrics: analysis.metrics,
            insights: analysis.insights,
            grade: analysis.grade,
            status: analysis.status || 'completed'
          });
        }

        // Add _id and other fields to the analysis object
        analysis._id = savedReport._id;
        reports.push(analysis);
      } catch (saveError) {
        console.error('❌ Error saving report for', droneId, ':', saveError.message);
        // Still push the analysis even if save fails
        reports.push(analysis);
      }
    }

    // Calculate team averages
    console.log('📊 Total reports:', reports.length);
    console.log('🔍 Team A ID:', match.teamA._id.toString());
    console.log('🔍 Team B ID:', match.teamB._id.toString());
    console.log('🔍 Sample report teamId:', reports[0]?.teamId?.toString());

    const teamAReports = reports.filter(r => r.teamId?.toString() === match.teamA._id.toString());
    const teamBReports = reports.filter(r => r.teamId?.toString() === match.teamB._id.toString());

    console.log('✅ Team A Reports:', teamAReports.length);
    console.log('✅ Team B Reports:', teamBReports.length);

    const teamAAvg = teamAReports.length > 0
      ? average(teamAReports.map(r => r.performance?.overallScore || 0))
      : 0;

    const teamBAvg = teamBReports.length > 0
      ? average(teamBReports.map(r => r.performance?.overallScore || 0))
      : 0;

    res.status(200).json({
      success: true,
      matchId,
      roundNumber: parseInt(roundNumber),
      roundDuration: `${round.duration || 180}s`,
      reports,
      teamAReports,  // ✅ Added for frontend
      teamBReports,  // ✅ Added for frontend
      teamAScore: teamAAvg,  // ✅ Added for frontend
      teamBScore: teamBAvg,  // ✅ Added for frontend
      teamStats: {
        [match.teamA.name]: {
          avgScore: Math.round(teamAAvg),
          dronesAnalyzed: teamAReports.length
        },
        [match.teamB.name]: {
          avgScore: Math.round(teamBAvg),
          dronesAnalyzed: teamBReports.length
        }
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  analyzeRound
};
