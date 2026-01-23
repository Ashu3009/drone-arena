import React from 'react';
import './Arena2D.css';

const Arena2D = ({
  teamA = { name: 'Team A', color: '#EF4444', drones: [] },
  teamB = { name: 'Team B', color: '#3B82F6', drones: [] },
  ballPosition = { x: 50, y: 50 },
  showBall = true,
}) => {
  // Arena dimensions in percentages
  const arenaWidth = 100;
  const arenaHeight = 100;
  const goalWidth = 8;
  const goalHeight = 30;

  // Default drone positions if not provided
  const defaultDronesA = [
    { x: 15, y: 30 }, { x: 15, y: 70 },
    { x: 30, y: 20 }, { x: 30, y: 50 }, { x: 30, y: 80 },
  ];

  const defaultDronesB = [
    { x: 85, y: 30 }, { x: 85, y: 70 },
    { x: 70, y: 20 }, { x: 70, y: 50 }, { x: 70, y: 80 },
  ];

  const dronesA = teamA.drones?.length > 0 ? teamA.drones : defaultDronesA;
  const dronesB = teamB.drones?.length > 0 ? teamB.drones : defaultDronesB;

  return (
    <div className="arena-2d-container">
      <svg
        viewBox="0 0 100 100"
        className="arena-2d-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Arena Background */}
        <rect
          x="0" y="0"
          width={arenaWidth} height={arenaHeight}
          className="arena-background"
        />

        {/* Field Lines */}
        <g className="arena-lines">
          {/* Outer Boundary */}
          <rect
            x="2" y="2"
            width="96" height="96"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.5"
          />

          {/* Center Line */}
          <line x1="50" y1="2" x2="50" y2="98" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />

          {/* Center Circle */}
          <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="1.5" fill="rgba(255,255,255,0.5)" />

          {/* Left Goal Area */}
          <rect
            x="2" y="35"
            width="10" height="30"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.5"
          />

          {/* Right Goal Area */}
          <rect
            x="88" y="35"
            width="10" height="30"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.5"
          />
        </g>

        {/* Left Goal Ring (Blue/Red) */}
        <g className="goal-ring goal-left">
          {/* Outer glow ring */}
          <circle
            cx="8"
            cy="50"
            r="14"
            fill="none"
            stroke={teamA.color}
            strokeWidth="0.8"
            opacity="0.2"
          />
          {/* Middle ring */}
          <circle
            cx="8"
            cy="50"
            r="11"
            fill="none"
            stroke={teamA.color}
            strokeWidth="1.5"
            opacity="0.5"
          />
          {/* Inner ring */}
          <circle
            cx="8"
            cy="50"
            r="8"
            fill="none"
            stroke={teamA.color}
            strokeWidth="2"
            opacity="0.8"
          />
          {/* Center dot */}
          <circle
            cx="8"
            cy="50"
            r="1"
            fill={teamA.color}
            opacity="0.6"
          />
        </g>

        {/* Right Goal Ring (Blue/Red) */}
        <g className="goal-ring goal-right">
          {/* Outer glow ring */}
          <circle
            cx="92"
            cy="50"
            r="14"
            fill="none"
            stroke={teamB.color}
            strokeWidth="0.8"
            opacity="0.2"
          />
          {/* Middle ring */}
          <circle
            cx="92"
            cy="50"
            r="11"
            fill="none"
            stroke={teamB.color}
            strokeWidth="1.5"
            opacity="0.5"
          />
          {/* Inner ring */}
          <circle
            cx="92"
            cy="50"
            r="8"
            fill="none"
            stroke={teamB.color}
            strokeWidth="2"
            opacity="0.8"
          />
          {/* Center dot */}
          <circle
            cx="92"
            cy="50"
            r="1"
            fill={teamB.color}
            opacity="0.6"
          />
        </g>

        {/* Team A Drones */}
        {dronesA.map((drone, index) => (
          <g key={`drone-a-${index}`} className="drone-group">
            <circle
              cx={drone.x}
              cy={drone.y}
              r="7"
              className="drone-pulse"
              style={{ stroke: teamA.color }}
            />
            <circle
              cx={drone.x}
              cy={drone.y}
              r="4.5"
              className="drone-marker"
              style={{ fill: teamA.color }}
            />
          </g>
        ))}

        {/* Team B Drones */}
        {dronesB.map((drone, index) => (
          <g key={`drone-b-${index}`} className="drone-group">
            <circle
              cx={drone.x}
              cy={drone.y}
              r="7"
              className="drone-pulse"
              style={{ stroke: teamB.color }}
            />
            <circle
              cx={drone.x}
              cy={drone.y}
              r="4.5"
              className="drone-marker"
              style={{ fill: teamB.color }}
            />
          </g>
        ))}

        {/* Ball */}
        {showBall && (
          <g className="ball-group">
            <circle
              cx={ballPosition.x}
              cy={ballPosition.y}
              r="6"
              className="ball-glow"
            />
            <circle
              cx={ballPosition.x}
              cy={ballPosition.y}
              r="3.5"
              className="ball-marker"
            />
          </g>
        )}
      </svg>

      {/* Team Labels */}
      <div className="arena-team-labels">
        <div className="team-label team-a" style={{ '--team-color': teamA.color }}>
          <span className="team-dot" style={{ background: teamA.color }} />
          {teamA.name}
        </div>
        <div className="team-label team-b" style={{ '--team-color': teamB.color }}>
          {teamB.name}
          <span className="team-dot" style={{ background: teamB.color }} />
        </div>
      </div>
    </div>
  );
};

export default Arena2D;
