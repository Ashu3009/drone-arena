/**
 * Report Template Generator
 * Generates varied, data-driven report summaries and recommendations
 * 20-30+ template variants per role based on actual performance
 */

// Helper function to pick random element from array
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generate role-specific summary based on performance metrics
 */
const generateSummary = (role, metrics) => {
  const { aggressiveness, defensiveness, performanceScore, teamwork, efficiency, speed, distance, stability } = metrics;

  switch (role) {
    case 'Forward':
      return generateForwardSummary({ aggressiveness, defensiveness, performanceScore, teamwork, efficiency, speed, distance, stability });

    case 'Center':
      return generateCenterSummary({ aggressiveness, defensiveness, performanceScore, teamwork, efficiency, speed, distance, stability });

    case 'Defender':
      return generateDefenderSummary({ aggressiveness, defensiveness, performanceScore, teamwork, efficiency, speed, distance, stability });

    case 'Keeper':
      return generateKeeperSummary({ aggressiveness, defensiveness, performanceScore, teamwork, efficiency, speed, distance, stability });

    default:
      return 'Standard performance recorded';
  }
};

/**
 * FORWARD SUMMARIES (30+ variants)
 */
const generateForwardSummary = (metrics) => {
  const { aggressiveness, defensiveness, performanceScore, teamwork, speed, distance } = metrics;

  // Excellent Forward (80-100 score, high aggression)
  if (performanceScore >= 80 && aggressiveness >= 70) {
    const variants = [
      `Outstanding attacking performance with ${aggressiveness}/100 aggression. Dominated opponent's half with precision strikes and excellent positioning.`,
      `Exceptional forward play showcasing aggressive runs and intelligent movement. Maintained constant pressure on defense with ${distance.toFixed(1)}m coverage.`,
      `Elite-level attacking display with relentless offensive mindset. Speed bursts of ${speed.toFixed(1)} m/s kept defenders on their toes throughout.`,
      `Masterclass in forward positioning. Combined ${aggressiveness}/100 aggression with smart decision-making to create multiple scoring opportunities.`,
      `Phenomenal attacking instincts on display. Clinical finishing combined with tireless running made you a constant threat in the final third.`,
      `World-class forward performance. Your aggressive pressing and intelligent runs disrupted defensive organization repeatedly.`,
      `Sensational attacking play with ${performanceScore}/100 score. Speed, power, and precision perfectly balanced in this display.`,
      `Devastating forward performance. Opponents struggled to contain your pace (${speed.toFixed(1)} m/s avg) and aggressive movement patterns.`
    ];
    return pickRandom(variants);
  }

  // Good Forward (65-79 score, decent aggression)
  if (performanceScore >= 65 && aggressiveness >= 60) {
    const variants = [
      `Strong forward performance with good attacking intent. ${aggressiveness}/100 aggression shows solid offensive mindset.`,
      `Solid attacking display covering ${distance.toFixed(1)}m. Consistent pressure on opponents with occasional breakthrough moments.`,
      `Effective forward play with good positioning. Speed of ${speed.toFixed(1)} m/s allowed you to exploit defensive gaps well.`,
      `Reliable forward performance. Maintained attacking threat throughout with ${performanceScore}/100 overall contribution.`,
      `Commendable offensive effort. Your runs created space for teammates and kept defense occupied.`,
      `Good attacking instincts demonstrated. Showed hunger for goals and willingness to take on defenders.`,
      `Productive forward display. Balance between aggression and smart play resulted in positive impact.`,
      `Solid contribution as forward. Consistent movement and positioning troubled the opposition defense.`
    ];
    return pickRandom(variants);
  }

  // Average Forward (50-64 score)
  if (performanceScore >= 50 && performanceScore < 65) {
    const variants = [
      `Decent forward performance with room for improvement. Aggression at ${aggressiveness}/100 could be increased for better impact.`,
      `Fair attacking display covering ${distance.toFixed(1)}m. More consistent pressure needed in opponent's half.`,
      `Moderate forward contribution. Some good moments but lacked sustained attacking threat throughout.`,
      `Acceptable performance with mixed results. Need more decisive actions in attacking third.`,
      `Average forward play. Showed flashes of quality but consistency was lacking in key moments.`,
      `Standard forward performance. Safe play observed more than aggressive attacking runs.`,
      `Basic forward duties fulfilled. More ambition and risk-taking required to become threatening.`,
      `Middling attacking display. Neither outstanding nor poor - steady improvement path ahead.`
    ];
    return pickRandom(variants);
  }

  // Poor Forward (below 50, low aggression or high defensiveness)
  if (defensiveness > aggressiveness) {
    const variants = [
      `Forward playing too defensively! Your ${defensiveness}/100 defensive score is too high for an attacker. Need to push forward more aggressively.`,
      `Concerning lack of attacking intent. Only ${aggressiveness}/100 aggression - forwards must lead the attack, not defend!`,
      `Playing like a defender, not a forward! Spent too much time in own half. Role mismatch evident - consider position change.`,
      `Critical issue: Forward mentality missing. Your defensive positioning (${defensiveness}/100) contradicts attacking role requirements.`,
      `Severe role confusion detected. Forwards should have high aggression (yours: ${aggressiveness}/100), not high defensiveness (${defensiveness}/100).`,
      `Unacceptable passivity for forward position. Need complete mindset shift towards attacking play or role reassignment recommended.`
    ];
    return pickRandom(variants);
  }

  // Poor performance but trying to attack
  const variants = [
    `Struggled as forward with ${performanceScore}/100 score. Attacking intent present but execution needs significant work.`,
    `Challenging performance at ${performanceScore}/100. Speed (${speed.toFixed(1)} m/s) and decision-making both need improvement.`,
    `Difficult outing as forward. Only covered ${distance.toFixed(1)}m - need more movement and involvement in attack.`,
    `Underwhelming forward display. Aggression (${aggressiveness}/100) present but effectiveness low. Intensive training required.`,
    `Poor attacking performance. Multiple areas need attention including positioning, timing, and finishing.`,
    `Ineffective as forward. Lacks sharpness and cutting edge needed for this demanding attacking role.`
  ];
  return pickRandom(variants);
};

/**
 * CENTER SUMMARIES (30+ variants)
 */
const generateCenterSummary = (metrics) => {
  const { aggressiveness, defensiveness, performanceScore, teamwork, distance, speed } = metrics;

  const isBalanced = Math.abs(aggressiveness - defensiveness) <= 15;

  // Excellent Center (80-100 score, balanced, high teamwork)
  if (performanceScore >= 80 && isBalanced && teamwork >= 65) {
    const variants = [
      `Outstanding midfielder performance! Perfect balance (Agg: ${aggressiveness}, Def: ${defensiveness}) with exceptional ${distance.toFixed(1)}m coverage.`,
      `Masterful midfield display. Controlled the game's tempo with ${teamwork}/100 teamwork and tireless running throughout.`,
      `Elite center play showcasing complete midfielder qualities. Seamless transitions between attack and defense.`,
      `Phenomenal box-to-box performance covering ${distance.toFixed(1)}m. Your presence felt in every area of the field.`,
      `World-class midfield orchestration. Balance, vision, and work rate all at premium levels (${performanceScore}/100).`,
      `Sensational center performance. Acted as perfect link between defense and attack with intelligent positioning.`,
      `Complete midfielder display. Dominated both phases of play with ${teamwork}/100 teamwork coordination.`,
      `Exceptional midfield engine room performance. Your ${distance.toFixed(1)}m coverage kept team ticking all match.`
    ];
    return pickRandom(variants);
  }

  // Good Center (65-79 score, decent balance)
  if (performanceScore >= 65 && isBalanced) {
    const variants = [
      `Strong midfield performance with good balance (Agg: ${aggressiveness}, Def: ${defensiveness}). Covered ${distance.toFixed(1)}m effectively.`,
      `Solid center display. Your ${teamwork}/100 teamwork score shows good coordination with teammates in both phases.`,
      `Effective midfield contribution. Balanced approach and high work rate (${distance.toFixed(1)}m) anchored team play.`,
      `Reliable midfielder performance. Transitioned well between defense and attack maintaining team structure.`,
      `Commendable center play. Showed maturity in balancing attacking support with defensive duties.`,
      `Good all-around midfield display. Work rate and positioning both at satisfactory levels throughout.`,
      `Productive center performance covering significant ground (${distance.toFixed(1)}m) in both halves.`,
      `Solid midfielder contribution. Balance and consistency maintained for ${performanceScore}/100 rating.`
    ];
    return pickRandom(variants);
  }

  // Unbalanced but decent score
  if (performanceScore >= 60 && !isBalanced) {
    if (aggressiveness > defensiveness + 15) {
      const variants = [
        `Good attacking midfielder play but too attack-heavy (${aggressiveness} agg vs ${defensiveness} def). Need more defensive balance.`,
        `Strong forward-thinking midfielder but neglecting defensive duties. Balance required for complete center performance.`,
        `Effective going forward but leaving gaps behind. Center role demands equal contribution in both phases.`,
        `Impressive attacking contributions but defensive positioning needs attention. Teamwork (${teamwork}/100) affected by imbalance.`
      ];
      return pickRandom(variants);
    } else {
      const variants = [
        `Solid defensive midfielder but too conservative (${defensiveness} def vs ${aggressiveness} agg). Need more attacking ambition.`,
        `Good defensive shielding but lacking forward support. Center requires balanced approach in both directions.`,
        `Strong in protecting defense but rarely supporting attacks. More offensive involvement needed from midfield.`,
        `Reliable defensively but invisible in attack. Center role demands contribution in both penalty boxes.`
      ];
      return pickRandom(variants);
    }
  }

  // Average Center
  if (performanceScore >= 50) {
    const variants = [
      `Moderate midfield performance at ${performanceScore}/100. Balance present but intensity lacking in key moments.`,
      `Fair center display covering ${distance.toFixed(1)}m. More impact needed in both attacking and defensive phases.`,
      `Average midfielder contribution. Neither excelled nor failed significantly - steady improvement path ahead.`,
      `Standard midfield performance. Fulfilled basic duties but lacked game-changing quality.`,
      `Middling center display. Showed glimpses of ability but consistency and decisiveness missing.`
    ];
    return pickRandom(variants);
  }

  // Poor Center
  const variants = [
    `Struggled in midfield with ${performanceScore}/100 score. Only ${distance.toFixed(1)}m covered - need much more mobility.`,
    `Ineffective as center. Low work rate and poor positioning resulted in team imbalance throughout.`,
    `Disappointing midfield performance. Failed to control tempo or support either defense or attack adequately.`,
    `Challenging outing as midfielder. Lack of presence (${distance.toFixed(1)}m) and influence evident.`,
    `Poor center performance. Both attacking (${aggressiveness}) and defensive (${defensiveness}) contributions below expectations.`
  ];
  return pickRandom(variants);
};

/**
 * DEFENDER SUMMARIES (30+ variants)
 */
const generateDefenderSummary = (metrics) => {
  const { aggressiveness, defensiveness, performanceScore, stability, efficiency } = metrics;

  // Excellent Defender (80-100 score, high defense, high stability)
  if (performanceScore >= 80 && defensiveness >= 70 && stability >= 75) {
    const variants = [
      `Outstanding defensive masterclass! Rock-solid ${defensiveness}/100 defensive rating with ${stability}% stability. Impenetrable wall.`,
      `Exceptional defensive performance. Clinical positioning and ${efficiency}/100 efficiency made you virtually unbeatable.`,
      `World-class defending on display. Your ${stability}% stability and intelligent reading of play shut down all threats.`,
      `Phenomenal defensive display. Timing, positioning, and composure all at elite level (${performanceScore}/100).`,
      `Masterful defensive work. Dominated your zone with ${defensiveness}/100 defensive presence and smart interventions.`,
      `Elite defender performance. Opponents found no way through your well-organized and stable defensive line.`,
      `Sensational defensive effort. Your ${stability}% flight stability and anticipation were key to clean sheet mentality.`,
      `Outstanding last-line heroics. Defensive awareness (${defensiveness}/100) and positioning excellence throughout.`
    ];
    return pickRandom(variants);
  }

  // Good Defender (65-79 score)
  if (performanceScore >= 65 && defensiveness >= 60) {
    const variants = [
      `Strong defensive performance with ${defensiveness}/100 rating. Reliable presence that limited opponent opportunities.`,
      `Solid defending throughout. Your ${stability}% stability and good positioning kept danger at bay effectively.`,
      `Effective defensive display. Made crucial interventions and maintained disciplined positioning for ${performanceScore}/100 score.`,
      `Commendable defensive work. Showed good understanding of role with ${efficiency}/100 efficiency in duties.`,
      `Reliable defender performance. Consistent throughout with few lapses - foundation for team's defensive structure.`,
      `Good defensive contribution. Smart positioning and timely challenges disrupted opponent's attacking rhythm.`,
      `Solid last-line performance. Your ${defensiveness}/100 defensive work gave team confidence going forward.`,
      `Productive defending with ${stability}% stability. Rarely beaten and recovered well when pressure came.`
    ];
    return pickRandom(variants);
  }

  // Average Defender
  if (performanceScore >= 50) {
    const variants = [
      `Moderate defensive performance at ${performanceScore}/100. Some good moments but consistency needed.`,
      `Fair defending with ${defensiveness}/100 rating. Handled routine situations well but struggled under intense pressure.`,
      `Average defensive display. Neither dominated nor exposed significantly - room for improvement in stability (${stability}%).`,
      `Standard defender performance. Fulfilled basic duties but lacked commanding presence at times.`,
      `Decent defensive work. Showed understanding of role but execution could be sharper and more decisive.`
    ];
    return pickRandom(variants);
  }

  // Poor Defender (too aggressive)
  if (aggressiveness > defensiveness) {
    const variants = [
      `Critical role error! Defender showing ${aggressiveness}/100 aggression vs only ${defensiveness}/100 defense. Playing out of position!`,
      `Unacceptable for defender - too aggressive (${aggressiveness}) and not defensive enough (${defensiveness}). Role reassignment needed.`,
      `Severe positional confusion. Defenders must prioritize defense (yours: ${defensiveness}/100) over attack (${aggressiveness}/100).`,
      `Playing like forward, not defender! Your ${aggressiveness}/100 aggression leaves dangerous gaps. Complete role mismatch.`,
      `Concerning defensive mentality. High aggression (${aggressiveness}) for defender creates vulnerability. Immediate correction required.`
    ];
    return pickRandom(variants);
  }
 
  // Poor defensive performance
  const variants = [
    `Struggled defensively with ${performanceScore}/100 score. Positioning (${stability}%) and timing both need major improvement.`,
    `Weak defensive display. Only ${defensiveness}/100 defensive contribution - far below requirements for this role.`,
    `Ineffective as defender. Exposed repeatedly and failed to provide reliable protection for ${efficiency}/100 efficiency.`,
    `Poor defensive performance. Lack of concentration and positioning awareness evident throughout.`,
    `Disappointing defensive work. Your ${stability}% stability suggests uncertain decision-making and hesitant challenges.`
  ];
  return pickRandom(variants);
};

/**
 * KEEPER SUMMARIES (30+ variants)
 */
const generateKeeperSummary = (metrics) => {
  const { defensiveness, performanceScore, stability, efficiency, distance } = metrics;

  // Excellent Keeper (80-100 score, ultra defense, ultra stability)
  if (performanceScore >= 80 && defensiveness >= 85 && stability >= 85) {
    const variants = [
      `Outstanding goalkeeping! Near-perfect ${defensiveness}/100 defensive positioning with ${stability}% stability. Last line of defense excellence.`,
      `Exceptional keeper performance. Commanding presence with ${efficiency}/100 efficiency and minimal unnecessary movement (${distance.toFixed(1)}m).`,
      `World-class shot-stopping and positioning. Your ${stability}% stability kept goal perfectly protected throughout.`,
      `Phenomenal goalkeeping display at ${performanceScore}/100. Unbeatable positioning and lightning-fast reactions when called upon.`,
      `Masterclass in goalkeeping. Your ${defensiveness}/100 defensive work and economy of movement were textbook perfect.`,
      `Elite keeper performance. Dominated the goal area with ${stability}% stability and made crucial saves look routine.`,
      `Sensational goalkeeping effort. Perfect positioning (${distance.toFixed(1)}m minimal movement) and ultra-defensive (${defensiveness}/100).`,
      `Outstanding last line defense. Your ${efficiency}/100 efficiency and stability made goal impenetrable.`
    ];
    return pickRandom(variants);
  }

  // Good Keeper (65-79 score)
  if (performanceScore >= 65 && defensiveness >= 75) {
    const variants = [
      `Strong goalkeeping performance with ${defensiveness}/100 defensive presence. Reliable and alert throughout.`,
      `Solid keeper display. Your ${stability}% stability and minimal movement (${distance.toFixed(1)}m) show good positioning discipline.`,
      `Effective goalkeeping with ${performanceScore}/100 rating. Made necessary saves and commanded area well.`,
      `Commendable keeper work. Good positioning and ${efficiency}/100 efficiency in goal protection duties.`,
      `Reliable goalkeeping throughout. Your ${defensiveness}/100 defensive work gave team confidence in defense.`,
      `Good keeper performance. Handled pressure well and maintained composure with ${stability}% stability.`,
      `Solid last-line protection. Minimal errors and good decision-making for ${performanceScore}/100 contribution.`,
      `Productive goalkeeping. Your ${efficiency}/100 efficiency and smart positioning prevented dangerous situations.`
    ];
    return pickRandom(variants);
  }

  // Average Keeper
  if (performanceScore >= 50) {
    const variants = [
      `Moderate goalkeeping at ${performanceScore}/100. Some good saves but positioning (${stability}%) could improve.`,
      `Fair keeper performance with ${defensiveness}/100 defensive work. Handled routine shots but nervous under pressure.`,
      `Average goalkeeping display. Neither spectacular nor catastrophic - steady improvement path ahead.`,
      `Standard keeper performance. Fulfilled basic duties but lacked commanding presence in goal area.`,
      `Decent goalkeeping but moved too much (${distance.toFixed(1)}m). Keepers should stay rooted except when necessary.`
    ];
    return pickRandom(variants);
  }

  // Poor Keeper (too much movement or low defense)
  if (distance > 50) {
    const variants = [
      `Critical keeper error! Moved ${distance.toFixed(1)}m - way too much! Goalkeepers must stay in goal zone (20-35m max).`,
      `Unacceptable for goalkeeper - excessive roaming (${distance.toFixed(1)}m). You abandoned goal position repeatedly!`,
      `Severe positional indiscipline. Keepers covering ${distance.toFixed(1)}m leave goal exposed. Stay in box!`,
      `Playing like outfield player, not keeper! Your ${distance.toFixed(1)}m movement is 3x what keepers should do.`,
      `Goalkeeper fundamentals missing. Excessive movement (${distance.toFixed(1)}m) vs required stability (${stability}%). Retraining needed.`
    ];
    return pickRandom(variants);
  }

  if (defensiveness < 70) {
    const variants = [
      `Weak defensive presence for keeper - only ${defensiveness}/100. Goalkeepers must have ultra-high defensive (85+) mentality.`,
      `Insufficient defensive instinct (${defensiveness}/100) for last line role. Keepers are ultimate defenders!`,
      `Poor goalkeeping mindset. Your ${defensiveness}/100 defense rating is too low - need 85+ for this position.`
    ];
    return pickRandom(variants);
  }

  // General poor performance
  const variants = [
    `Struggled as goalkeeper with ${performanceScore}/100 score. Positioning (${stability}%) and reactions both need work.`,
    `Ineffective goalkeeping. Only ${defensiveness}/100 defensive contribution - below minimum for last line role.`,
    `Weak keeper performance. Uncertain positioning and poor decision-making evident throughout.`,
    `Disappointing goalkeeping work. Your ${efficiency}/100 efficiency suggests lack of preparation and focus.`
  ];
  return pickRandom(variants);
};

/**
 * Generate role-specific recommendations
 */
const generateRecommendations = (role, metrics) => {
  const { aggressiveness, defensiveness, performanceScore, teamwork, efficiency, speed, distance, stability } = metrics;
  const recommendations = [];

  switch (role) {
    case 'Forward':
      // Stability issues
      if (stability < 70) {
        const variants = [
          `Practice smooth acceleration and deceleration to improve ${stability}% stability`,
          `Work on controlled turns - current stability (${stability}%) indicates jerky movements`,
          `Drill: Figure-8 patterns at high speed to build ${stability}% stability`,
          `Reduce rapid direction changes - smoother movements will boost stability from ${stability}%`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Low aggression
      if (aggressiveness < 60) {
        const variants = [
          `Increase attacking aggression from ${aggressiveness}/100 - forwards must be bold!`,
          `Practice aggressive attacking runs - current ${aggressiveness}/100 too passive`,
          `Build confidence in opponent's half - ${aggressiveness}/100 aggression needs boost`,
          `Take more risks going forward - ${aggressiveness}/100 is below forward expectations`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Low teamwork
      if (teamwork < 60) {
        const variants = [
          `Improve coordination with center - teamwork at ${teamwork}/100 limits attack effectiveness`,
          `Practice passing drills with teammates to boost ${teamwork}/100 teamwork`,
          `Work on 'give and go' tactics - ${teamwork}/100 teamwork shows solo play tendency`,
          `Build chemistry with midfielders to improve ${teamwork}/100 coordination`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Too defensive
      if (defensiveness > 50) {
        const variants = [
          `Stop defending so much (${defensiveness}/100)! Forwards should focus on attack`,
          `Stay in opponent's half - ${defensiveness}/100 defensiveness too high for forward`,
          `Let defenders defend - your ${defensiveness}/100 shows you're too far back`,
          `Push forward more - ${defensiveness}/100 defensive work isn't your job`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Speed issues
      if (speed < 4) {
        recommendations.push(`Increase average speed from ${speed.toFixed(1)} m/s - forwards need 4-6 m/s`);
      }

      // Distance issues
      if (distance < 70) {
        recommendations.push(`Cover more ground - ${distance.toFixed(1)}m is low for forward (target: 80-110m)`);
      }

      // Add general forward tips if doing well
      if (recommendations.length < 2) {
        const generalTips = [
          `Study opponent defender patterns to anticipate gaps`,
          `Practice 1v1 situations against defenders`,
          `Work on finishing from different angles`,
          `Improve off-ball movement timing`,
          `Develop fake-out maneuvers for tight situations`
        ];
        recommendations.push(pickRandom(generalTips));
      }
      break;

    case 'Center':
      // Imbalance
      if (Math.abs(aggressiveness - defensiveness) > 20) {
        if (aggressiveness > defensiveness) {
          recommendations.push(`Better defensive balance needed - ${aggressiveness} agg vs ${defensiveness} def too attack-heavy`);
        } else {
          recommendations.push(`More attacking support required - ${defensiveness} def vs ${aggressiveness} agg too defensive`);
        }
      }

      // Low distance
      if (distance < 100) {
        const variants = [
          `Increase mobility - ${distance.toFixed(1)}m coverage too low for center (target: 120-160m)`,
          `Centers must cover more ground - current ${distance.toFixed(1)}m insufficient`,
          `Box-to-box movement needed - ${distance.toFixed(1)}m shows limited range`,
          `Work on stamina - ${distance.toFixed(1)}m indicates tiring or passive play`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Low teamwork
      if (teamwork < 65) {
        const variants = [
          `Enhance teamwork from ${teamwork}/100 - midfielders are coordination hub`,
          `Practice transition plays to boost ${teamwork}/100 teamwork`,
          `Improve communication with forwards and defenders (teamwork: ${teamwork}/100)`,
          `Work on quick passing combinations to increase ${teamwork}/100 coordination`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Stability
      if (stability < 70) {
        recommendations.push(`Improve flight stability from ${stability}% for better control in transition`);
      }

      // General tips
      if (recommendations.length < 2) {
        const generalTips = [
          `Practice quick zone transitions between attack and defense`,
          `Work on receiving passes under pressure`,
          `Develop peripheral vision for better field awareness`,
          `Improve stamina for consistent box-to-box coverage`,
          `Master quick turn techniques in tight spaces`
        ];
        recommendations.push(pickRandom(generalTips));
      }
      break;

    case 'Defender':
      // Too aggressive
      if (aggressiveness > 50) {
        const variants = [
          `Reduce aggression from ${aggressiveness}/100 - defenders must prioritize position over attack`,
          `Stop pushing forward so much (${aggressiveness}/100)! Focus on defensive duties`,
          `${aggressiveness}/100 aggression too high for defender - stay back and protect`,
          `Defensive discipline needed - ${aggressiveness}/100 aggression leaves gaps`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Low defense
      if (defensiveness < 70) {
        const variants = [
          `Increase defensive presence from ${defensiveness}/100 - defenders need 70-90 rating`,
          `More defensive intensity required - ${defensiveness}/100 insufficient for this role`,
          `Strengthen defensive mindset - current ${defensiveness}/100 too passive`,
          `Build defensive confidence to boost ${defensiveness}/100 protection level`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Low stability
      if (stability < 70) {
        const variants = [
          `Improve positioning stability from ${stability}% - defenders need solid anchoring`,
          `Reduce unnecessary movements - ${stability}% stability too low for reliable defense`,
          `Practice holding defensive line - ${stability}% shows positional uncertainty`,
          `Work on staying rooted - ${stability}% stability indicates too much wandering`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Efficiency
      if (efficiency < 75) {
        recommendations.push(`Better energy management needed - ${efficiency}/100 efficiency means wasted movements`);
      }

      // General tips
      if (recommendations.length < 2) {
        const generalTips = [
          `Practice reading opponent's attacking patterns`,
          `Work on positioning for interceptions`,
          `Improve reaction time to sudden threats`,
          `Develop better communication with keeper`,
          `Master timing for challenges and clearances`
        ];
        recommendations.push(pickRandom(generalTips));
      }
      break;

    case 'Keeper':
      // Too much movement
      if (distance > 40) {
        const variants = [
          `CRITICAL: Stop roaming! ${distance.toFixed(1)}m movement way too high - keepers max 35m`,
          `Stay in goal! Your ${distance.toFixed(1)}m coverage means you abandoned position`,
          `Goalkeeper fundamentals: minimal movement! Current ${distance.toFixed(1)}m unacceptable`,
          `Position discipline required - ${distance.toFixed(1)}m vs required 20-35m maximum`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Low defensiveness
      if (defensiveness < 85) {
        const variants = [
          `Ultra-defensive mindset needed - ${defensiveness}/100 too low for keeper (need 85+)`,
          `Increase defensive presence from ${defensiveness}/100 - keepers are ultimate defenders`,
          `Strengthen last-line mentality - ${defensiveness}/100 insufficient for goalkeeper`,
          `Build commanding defensive presence - current ${defensiveness}/100 too passive for keeper`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Low stability
      if (stability < 80) {
        const variants = [
          `Improve hover stability from ${stability}% - keepers need 85%+ for sharp reactions`,
          `Practice stationary positioning - ${stability}% shows fidgety movement`,
          `Master goal-line positioning - ${stability}% stability too low for last line`,
          `Work on staying rooted yet alert - ${stability}% indicates positioning uncertainty`
        ];
        recommendations.push(pickRandom(variants));
      }

      // Efficiency
      if (efficiency < 85) {
        recommendations.push(`Better energy conservation needed - ${efficiency}/100 means unnecessary actions`);
      }

      // General tips
      if (recommendations.length < 2) {
        const generalTips = [
          `Practice quick lateral movements from set position`,
          `Work on anticipating shot trajectories`,
          `Develop better angle coverage techniques`,
          `Improve communication with defenders`,
          `Master positioning for corner and crossing situations`
        ];
        recommendations.push(pickRandom(generalTips));
      }
      break;
  }

  // Ensure at least 2 recommendations
  if (recommendations.length < 2) {
    recommendations.push('Maintain current strengths while working on areas identified above');
  }

  return recommendations;
};

module.exports = {
  generateSummary,
  generateRecommendations
};
