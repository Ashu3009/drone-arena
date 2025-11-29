/**
 * PDF Generator for Drone Performance Reports
 * Generates professional 2-page PDF reports with role-specific formatting
 */

const PDFDocument = require('pdfkit');

/**
 * Generate a comprehensive drone performance report PDF
 * @param {Object} report - DroneReport document with populated team
 * @param {Object} match - Match document with populated teams
 * @returns {PDFDocument} - PDF stream
 */
const generateReportPDF = (report, match) => {
  try {
    console.log('📝 Starting PDF generation...');
    console.log(`   Report ID: ${report._id}`);
    console.log(`   Pilot: ${report.pilotName}`);
    console.log(`   Drone: ${report.droneId}`);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    // Get team color (use team's color or default based on drone ID)
    const teamColor = report.team?.color || (report.droneId.startsWith('R') ? '#FF0000' : '#0000FF');
    const teamName = report.team?.name || 'Unknown Team';
    const opponentTeam = match?.teamA?._id?.equals(report.team._id) ? match.teamB : match.teamA;

    console.log(`   Team: ${teamName} (${teamColor})`);
    console.log(`   Opponent: ${opponentTeam?.name || 'Unknown'}`);

    // ============================================================
    // PAGE 1: PERFORMANCE OVERVIEW
    // ============================================================

    // Header with Indian Tricolor - Saffron, White, Green
    doc.rect(0, 0, 595, 23).fill('#FF9933');      // Saffron
    doc.rect(0, 23, 595, 24).fill('#FFFFFF');     // White
    doc.rect(0, 47, 595, 23).fill('#138808');     // Green

    // Title on white section with dark text
    doc.fillColor('#000000')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('DRONE PERFORMANCE REPORT', 0, 20, { align: 'center', width: 595 });

    // Subtitle on green section with white text
    doc.fillColor('#FFFFFF')
       .fontSize(11)
       .font('Helvetica')
       .text(`Match ${match?.matchNumber || 'N/A'} - Round ${report.roundNumber}`, 0, 51, { align: 'center', width: 595 });

    // Reset text color to dark
    doc.fillColor('#000000');

    let yPos = 90;

    // Pilot & Match Information Box
    doc.rect(40, yPos, 515, 80).fillAndStroke('#F5F5F5', '#CCCCCC');

    doc.fillColor('#000000')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('PILOT DETAILS', 50, yPos + 10);

    yPos += 30;
    doc.fontSize(10)
       .font('Helvetica')
       .text('Pilot Name:', 50, yPos)
       .font('Helvetica-Bold')
       .text(report.pilotName || 'Unknown', 150, yPos);

    doc.font('Helvetica')
       .text('Team:', 320, yPos)
       .font('Helvetica-Bold')
       .text(teamName, 380, yPos);

    yPos += 18;
    doc.font('Helvetica')
       .text('Drone ID:', 50, yPos)
       .font('Helvetica-Bold')
       .text(report.droneId || 'N/A', 150, yPos);

    const role = getDroneRole(report);
    doc.font('Helvetica')
       .text('Role:', 320, yPos)
       .font('Helvetica-Bold')
       .text(role, 380, yPos);

    yPos += 18;
    doc.font('Helvetica')
       .text('Opponent:', 50, yPos)
       .font('Helvetica-Bold')
       .text(opponentTeam?.name || 'N/A', 150, yPos);

    doc.font('Helvetica')
       .text('Date:', 320, yPos)
       .font('Helvetica-Bold')
       .text(new Date(report.generatedAt).toLocaleDateString(), 380, yPos);

    // Calculate performance score early (needed for Match Context Box)
    const perfScore = report.performanceScore || 0;
    const scoreColor = getScoreColor(perfScore);

    // Match Context Box
    yPos += 25;
    doc.rect(40, yPos, 515, 65).fillAndStroke('#FFF9E6', '#FFD700');

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#CC8800')
       .text('MATCH CONTEXT', 50, yPos + 8);

    yPos += 26;
    const finalScoreA = match?.finalScoreA || 0;
    const finalScoreB = match?.finalScoreB || 0;
    const teamAName = match?.teamA?.name || 'Team A';
    const teamBName = match?.teamB?.name || 'Team B';
    const matchResult = match?.winner ? `Winner: ${match.winner.name}` : `${teamAName} ${finalScoreA} - ${finalScoreB} ${teamBName}`;

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#333333')
       .text(`Match Score: ${matchResult}`, 50, yPos, { width: 495 });

    yPos += 16;
    const performanceRating = getPerformanceRating(perfScore);
    doc.text(`Your Performance Rating: `, 50, yPos);
    doc.fillColor(performanceRating.color)
       .font('Helvetica-Bold')
       .text(performanceRating.label, 175, yPos);

    // Performance Score - Big highlight
    yPos += 35;
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('OVERALL PERFORMANCE', 40, yPos);

    yPos += 25;
    doc.rect(40, yPos, 515, 60).fillAndStroke('#F9F9F9', '#DDDDDD');

    doc.fontSize(42)
       .fillColor(scoreColor)
       .font('Helvetica-Bold')
       .text(perfScore.toString(), 0, yPos + 10, { align: 'center', width: 595 });

    doc.fontSize(10)
       .fillColor('#666666')
       .font('Helvetica')
       .text('/100', 0, yPos + 42, { align: 'center', width: 595 });

    // Flight Metrics Section
    yPos = 320;
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('FLIGHT METRICS', 40, yPos);

    yPos += 25;
    const metrics = [
      { label: 'Total Distance', value: `${(report.totalDistance || 0).toFixed(1)} m` },
      { label: 'Average Speed', value: `${(report.averageSpeed || 0).toFixed(1)} m/s` },
      { label: 'Max Speed', value: `${(report.maxSpeed || 0).toFixed(1)} m/s` },
      { label: 'Position Accuracy', value: `${(report.positionAccuracy || 0).toFixed(0)}%` }
    ];

    metrics.forEach((metric, idx) => {
      const xPos = idx % 2 === 0 ? 40 : 308;
      const y = yPos + Math.floor(idx / 2) * 35;

      doc.rect(xPos, y, 247, 30).fillAndStroke('#F5F5F5', '#DDDDDD');

      doc.fontSize(9)
         .fillColor('#666666')
         .font('Helvetica')
         .text(metric.label, xPos + 10, y + 7);

      doc.fontSize(13)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(metric.value, xPos + 10, y + 18);
    });

    // Key Highlights Section
    yPos = 430;
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('KEY HIGHLIGHTS', 40, yPos);

    yPos += 22;
    const highlights = getKeyHighlights(report, role);
    highlights.forEach((highlight) => {
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica')
         .text(`• ${highlight}`, 50, yPos, { width: 495, lineGap: 1 });
      yPos += 18;
    });

    // ML Analysis Progress Bars
    yPos += 20;
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('AI ANALYSIS METRICS', 40, yPos);

    const mlMetrics = [
      { label: 'Aggressiveness', value: report.mlAnalysis?.aggressiveness || 0, color: '#FF4444' },
      { label: 'Defensiveness', value: report.mlAnalysis?.defensiveness || 0, color: '#4444FF' },
      { label: 'Teamwork', value: report.mlAnalysis?.teamwork || 0, color: '#44AA44' },
      { label: 'Efficiency', value: report.mlAnalysis?.efficiency || 0, color: '#FFA500' }
    ];

    yPos += 25;
    mlMetrics.forEach((metric, idx) => {
      const y = yPos + (idx * 32);

      // Label
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000')
         .text(metric.label, 50, y);

      // Progress bar background
      doc.rect(170, y - 2, 300, 14).fillAndStroke('#E0E0E0', '#CCCCCC');

      // Progress bar fill
      const barWidth = (metric.value / 100) * 300;
      doc.rect(170, y - 2, barWidth, 14).fill(metric.color);

      // Value text
      doc.fillColor('#000000')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text(`${metric.value}`, 480, y - 1);
    });

    // Footer for Page 1
    const tournamentName = report.tournament?.name || 'Tournament';
    doc.fontSize(8)
       .fillColor('#999999')
       .font('Helvetica')
       .text(`${tournamentName} | Page 1 of 2`, 0, 760, { align: 'center', width: 595 });

    doc.fontSize(7)
       .fillColor('#666666')
       .font('Helvetica-Oblique')
       .text('Powered by DroneNova - Advanced Drone Tournament Analytics', 0, 775, { align: 'center', width: 595 });

    // ============================================================
    // PAGE 2: ANALYSIS & RECOMMENDATIONS
    // ============================================================
    doc.addPage();

    // Page 2 Header with Indian Tricolor
    doc.rect(0, 0, 595, 17).fill('#FF9933');      // Saffron
    doc.rect(0, 17, 595, 16).fill('#FFFFFF');     // White
    doc.rect(0, 33, 595, 17).fill('#138808');     // Green

    // Title on white section with dark text
    doc.fillColor('#000000')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('PERFORMANCE ANALYSIS & RECOMMENDATIONS', 0, 17, { align: 'center', width: 595 });

    // Reset text color to dark
    doc.fillColor('#000000');

    // Role-Specific Summary
    yPos = 70;
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .text(`${role.toUpperCase()} ANALYSIS`, 40, yPos);

    yPos += 25;
    const summary = report.mlAnalysis?.summary || 'No detailed analysis available for this performance.';

    doc.rect(40, yPos, 515, 90).fillAndStroke('#F9F9F9', '#DDDDDD');
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text(summary, 50, yPos + 10, {
         width: 495, 
         align: 'left',
         lineGap: 3
       });

    // Strengths Section
    yPos = 190;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#008800')
       .text('STRENGTHS', 40, yPos);

    yPos += 20;
    const strengths = getStrengths(report, role);
    strengths.forEach((strength, idx) => {
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica')
         .text(`${idx + 1}. ${strength}`, 50, yPos, { width: 495, align: 'left', lineGap: 1 });
      yPos += 20;
    });

    // Recommendations Section
    yPos += 10;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#FF6600')
       .text('RECOMMENDATIONS', 40, yPos);

    yPos += 18;
    let recommendations = report.mlAnalysis?.recommendations || [];

    // Ensure we always have substantial recommendations
    if (recommendations.length < 3) {
      recommendations = getRoleRecommendations(report, role);
    }

    recommendations.slice(0, 5).forEach((rec, idx) => {
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica')
         .text(`${idx + 1}. ${rec}`, 50, yPos, { width: 495, align: 'left', lineGap: 1 });
      yPos += 22;
    });

    // Training Focus
    yPos += 10;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#0066CC')
       .text('TRAINING FOCUS', 40, yPos);

    yPos += 18;
    const trainingTips = getTrainingFocus(report, role);
    trainingTips.forEach((tip, idx) => {
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica')
         .text(`${idx + 1}. ${tip}`, 50, yPos, { width: 495, align: 'left', lineGap: 1 });
      yPos += 20;
    });

    // Performance Comparison Box
    if (yPos < 630) {
      yPos += 20;
      doc.rect(40, yPos, 515, 70).fillAndStroke('#F0F0FF', '#CCCCDD');

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#0066CC')
         .text('ROLE BENCHMARKS', 50, yPos + 10);

      yPos += 28;
      const benchmarks = getRoleBenchmarks(role);
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#333333')
         .text(benchmarks, 50, yPos, { width: 495, align: 'justify', lineGap: 2 });
    }

    // Footer for Page 2
    doc.fontSize(8)
       .fillColor('#999999')
       .font('Helvetica')
       .text(`${tournamentName} | Page 2 of 2`, 0, 760, { align: 'center', width: 595 });

    doc.fontSize(7)
       .fillColor('#666666')
       .font('Helvetica-Oblique')
       .text('Powered by DroneNova - Advanced Drone Tournament Analytics', 0, 775, { align: 'center', width: 595 });

    doc.fontSize(6)
       .fillColor('#888888')
       .text(`Generated: ${new Date().toLocaleString()}`, 0, 788, { align: 'center', width: 595 });

    // Finalize PDF
    doc.end();

    console.log('✅ PDF generation completed successfully');
    return doc;

  } catch (error) {
    console.error('❌ Error in generateReportPDF:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get performance rating label and color
 */
const getPerformanceRating = (score) => {
  if (score >= 90) return { label: '⭐ EXCELLENT', color: '#00AA00' };
  if (score >= 75) return { label: '✓ GOOD', color: '#4CAF50' };
  if (score >= 60) return { label: '○ AVERAGE', color: '#FFA500' };
  if (score >= 45) return { label: '△ NEEDS IMPROVEMENT', color: '#FF8800' };
  return { label: '✗ POOR', color: '#CC0000' };
};

/**
 * Get key highlights for the performance
 */
const getKeyHighlights = (report, role) => {
  const highlights = [];
  const ml = report.mlAnalysis || {};

  // Performance-based highlights
  if (report.performanceScore >= 85) {
    highlights.push(`Outstanding ${role} performance with ${report.performanceScore}/100 score`);
  } else if (report.performanceScore >= 70) {
    highlights.push(`Solid ${role} performance with room for tactical improvements`);
  }

  // Speed highlights
  if (report.maxSpeed >= 5.5) {
    highlights.push(`Achieved impressive maximum speed of ${report.maxSpeed.toFixed(1)} m/s`);
  } else if (report.averageSpeed >= 4.0) {
    highlights.push(`Maintained good average speed of ${report.averageSpeed.toFixed(1)} m/s throughout round`);
  }

  // Distance highlights
  if (report.totalDistance >= 120) {
    highlights.push(`Excellent field coverage with ${report.totalDistance.toFixed(0)}m total distance traveled`);
  }

  // Role-specific highlights
  if (role === 'Forward' && ml.aggressiveness >= 75) {
    highlights.push(`Strong offensive presence with ${ml.aggressiveness}% aggressiveness rating`);
  } else if (role === 'Keeper' && ml.defensiveness >= 85) {
    highlights.push(`Elite goal protection with ${ml.defensiveness}% defensive rating`);
  } else if (role === 'Center' && ml.teamwork >= 70) {
    highlights.push(`Exceptional team coordination with ${ml.teamwork}% teamwork score`);
  } else if (role === 'Defender' && report.positionAccuracy >= 80) {
    highlights.push(`Superior positioning accuracy at ${report.positionAccuracy}%`);
  }

  // Battery efficiency
  if (report.batteryUsage?.consumed <= 12) {
    highlights.push(`Excellent energy efficiency - only ${report.batteryUsage.consumed}% battery consumed`);
  }

  // Efficiency highlight
  if (ml.efficiency >= 80) {
    highlights.push(`High efficiency rating of ${ml.efficiency}% demonstrates smart gameplay`);
  }

  // Default if no highlights
  if (highlights.length === 0) {
    highlights.push(`Completed round as ${role} with consistent performance`);
    highlights.push(`Gained valuable match experience for future improvements`);
  }

  return highlights.slice(0, 3); // Return top 3 highlights
};

/**
 * Get drone role from report
 */
const getDroneRole = (report) => {
  if (report.role) return report.role;
  const droneNum = parseInt(report.droneId.substring(1));
  const roles = ['Forward', 'Center', 'Defender', 'Keeper'];
  return roles[(droneNum - 1) % 4] || 'Forward';
};

/**
 * Get color based on performance score
 */
const getScoreColor = (score) => {
  if (score >= 80) return '#00AA00';
  if (score >= 65) return '#FFA500';
  if (score >= 50) return '#FF8800';
  return '#CC0000';
};

/**
 * Get strengths based on metrics and role
 */
const getStrengths = (report, role) => {
  const strengths = [];
  const ml = report.mlAnalysis || {};

  switch (role) {
    case 'Forward':
      if (ml.aggressiveness >= 70) strengths.push('Strong attacking mindset with consistent pressure');
      if (report.averageSpeed >= 4.5) strengths.push(`Excellent speed control (${report.averageSpeed.toFixed(1)} m/s)`);
      if (report.totalDistance >= 90) strengths.push('High mobility and field coverage');
      if (ml.efficiency >= 75) strengths.push('Efficient energy management during attacks');
      break;

    case 'Center':
      if (ml.teamwork >= 70) strengths.push('Outstanding teamwork and coordination');
      if (report.totalDistance >= 130) strengths.push('Exceptional field coverage and presence');
      if (ml.aggressiveness >= 45 && ml.defensiveness >= 45) strengths.push('Well-balanced offensive and defensive play');
      if (ml.efficiency >= 70) strengths.push('Efficient transition play');
      break;

    case 'Defender':
      if (ml.defensiveness >= 70) strengths.push('Solid defensive positioning and awareness');
      if (report.positionAccuracy >= 75) strengths.push('Excellent positioning accuracy');
      if (report.batteryUsage?.consumed <= 15) strengths.push('Superior battery efficiency');
      if (ml.efficiency >= 80) strengths.push('Highly efficient defensive operations');
      break;

    case 'Keeper':
      if (ml.defensiveness >= 85) strengths.push('Elite goal protection instincts');
      if (report.positionAccuracy >= 80) strengths.push('Outstanding positioning stability');
      if (report.batteryUsage?.consumed <= 10) strengths.push('Exceptional energy conservation');
      if (ml.efficiency >= 85) strengths.push('Masterful efficiency in goal area');
      break;
  }

  // General strengths for all roles
  if (report.performanceScore >= 80) strengths.push('Consistently high performance throughout the round');
  if (report.performanceScore >= 90) strengths.push('Elite-level execution and decision making');
  if (ml.teamwork >= 75) strengths.push('Strong collaborative play with teammates');
  if (report.maxSpeed >= 5.5) strengths.push(`Impressive top speed of ${report.maxSpeed.toFixed(1)} m/s demonstrates excellent drone control`);
  if (report.positionAccuracy >= 85) strengths.push('Exceptional spatial awareness and positioning precision');
  if (ml.efficiency >= 85) strengths.push('Outstanding energy efficiency and resource management');

  if (strengths.length === 0) {
    strengths.push('Completed the round successfully and gained valuable experience');
    strengths.push('Shows potential for improvement with focused training');
    strengths.push('Demonstrated basic competency in role requirements');
  }

  return strengths.slice(0, 5); // Return top 5 strengths
};

/**
 * Get training focus based on weaknesses
 */
const getTrainingFocus = (report, role) => {
  const tips = [];
  const ml = report.mlAnalysis || {};

  switch (role) {
    case 'Forward':
      if (ml.aggressiveness < 60) tips.push('Practice aggressive attacking drills to boost offensive presence');
      if (report.averageSpeed < 4) tips.push('Work on acceleration techniques to increase attack speed');
      if (ml.efficiency < 70) tips.push('Focus on energy-efficient attacking patterns');
      if (report.positionAccuracy < 70) tips.push('Improve positioning accuracy with target practice drills');
      break;

    case 'Center':
      if (ml.teamwork < 65) tips.push('Train on coordinated team maneuvers and passing patterns');
      if (report.totalDistance < 120) tips.push('Increase endurance training for better field coverage');
      if (ml.aggressiveness < 45) tips.push('Work on offensive support tactics');
      if (ml.defensiveness < 45) tips.push('Practice defensive support positioning');
      break;

    case 'Defender':
      if (ml.defensiveness < 70) tips.push('Strengthen defensive positioning and interception skills');
      if (report.positionAccuracy < 75) tips.push('Practice zone coverage and marking drills');
      if (ml.teamwork < 60) tips.push('Improve communication with keeper and other defenders');
      if (ml.efficiency < 75) tips.push('Focus on efficient defensive movements');
      break;

    case 'Keeper':
      if (ml.defensiveness < 85) tips.push('Enhance goal protection reflexes and reaction time');
      if (report.positionAccuracy < 80) tips.push('Practice optimal goal positioning techniques');
      if (ml.efficiency < 85) tips.push('Work on minimal-movement goal coverage strategies');
      if (ml.teamwork < 60) tips.push('Improve coordination with defensive line');
      break;
  }

  // General training tips for all roles
  if (report.batteryUsage?.consumed > 25) tips.push('Practice battery conservation: reduce unnecessary movements and hover time');
  if (report.performanceScore < 70) tips.push('Focus on consistent performance across all metrics with daily 30-min practice sessions');
  if (report.averageSpeed < 3.5) tips.push('Speed training: practice acceleration drills and quick directional changes');
  if (ml.teamwork < 70) tips.push('Team coordination drills: practice synchronized movements with teammates for 20 mins daily');
  if (report.totalDistance < 80) tips.push('Endurance training: gradually increase flight duration to build stamina');

  if (tips.length === 0) {
    tips.push('Continue regular training sessions to maintain current level');
    tips.push('Watch match replays to identify improvement opportunities');
    tips.push('Practice role-specific scenarios for 15 minutes before each match');
    tips.push('Work with coach to refine advanced techniques and strategies');
  }

  return tips.slice(0, 5); // Return top 5 training tips
};

/**
 * Get comprehensive role-specific recommendations
 */
const getRoleRecommendations = (report, role) => {
  const recs = [];
  const ml = report.mlAnalysis || {};

  switch (role) {
    case 'Forward':
      recs.push('Increase offensive pressure by maintaining position in opponent\'s half for at least 60% of round time');
      recs.push('Practice quick acceleration bursts to break through defensive lines more effectively');
      recs.push('Work on shot accuracy drills - aim for 70%+ scoring zone presence');
      recs.push('Coordinate attack patterns with center midfielder for better offensive flow');
      recs.push('Study opponent keeper positioning to identify weak spots in goal coverage');
      break;

    case 'Center':
      recs.push('Focus on maintaining optimal field position - stay central to support both offense and defense');
      recs.push('Improve transition speed between defensive and offensive plays by 20%');
      recs.push('Develop better communication protocols with forwards and defenders');
      recs.push('Practice quick directional changes to intercept opponent passes more effectively');
      recs.push('Work on stamina training to maintain high mobility throughout the entire round');
      break;

    case 'Defender':
      recs.push('Strengthen zone coverage by maintaining defensive position 85%+ of the time');
      recs.push('Practice interception timing - aim to block 60%+ of opponent forward advances');
      recs.push('Improve communication with keeper for coordinated defensive strategies');
      recs.push('Work on predictive positioning based on opponent attack patterns');
      recs.push('Reduce unnecessary movements to conserve battery while maintaining defensive integrity');
      break;

    case 'Keeper':
      recs.push('Optimize goal positioning - stay within 2m of goal center for maximum coverage');
      recs.push('Practice reaction drills to improve response time to incoming attacks by 15%');
      recs.push('Develop better anticipation skills by studying opponent forward patterns');
      recs.push('Minimize energy consumption with efficient micro-adjustments instead of large movements');
      recs.push('Coordinate with defenders to create layered defense and reduce direct goal threats');
      break;
  }

  // Performance-based recommendations
  if (report.performanceScore < 65) {
    recs.push('Schedule extra practice sessions focusing on fundamental skills and role responsibilities');
  }
  if (report.batteryUsage?.consumed > 30) {
    recs.push('Implement energy-saving flight patterns - hover less, move with purpose');
  }
  if (ml.teamwork < 60) {
    recs.push('Participate in team coordination exercises to improve synchronized play');
  }

  return recs.slice(0, 5);
};

/**
 * Get role-specific benchmarks
 */
const getRoleBenchmarks = (role) => {
  const benchmarks = {
    'Forward': 'Elite forwards typically achieve 70-90 aggression, 4-6 m/s speed, and 80-110m distance. Your performance is compared against tournament leaders in the forward position.',
    'Center': 'Top centers maintain 45-65 balanced metrics, 120-160m distance, and 65-90 teamwork. Centers are evaluated on their ability to control the midfield and support both offense and defense.',
    'Defender': 'Strong defenders show 70-90 defensive rating, 75-90% accuracy, and under 15% battery use. Defensive excellence is measured by positioning, interceptions, and protective efficiency.',
    'Keeper': 'Elite keepers achieve 85-100 defensive rating, 80-95% accuracy, and under 10% battery use. Goalkeepers are judged on their ability to protect the goal with minimal movement.'
  };

  return benchmarks[role] || 'Performance benchmarks vary by role and tournament level.';
};

module.exports = { generateReportPDF };
