import React, { useState, useEffect } from 'react';
import { getCurrentMatch } from '../../services/api';
import {
  initSocket,
  joinMatch,
  leaveMatch,
  onScoreUpdated,
  onMatchCompleted,
  onTelemetry,
  onCurrentMatchUpdated,
  removeAllListeners,
} from '../../services/socket';
import Arena2D from '../Mobile/Arena2D';
import { ClockIcon, UsersIcon, LocationIcon, TrophyIcon, PlayIcon, CheckCircleIcon } from './icons';
import './PublicMobileViewer.css';

const PublicMobileViewer = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [telemetryData, setTelemetryData] = useState(null);

  useEffect(() => {
    initSocket();
    loadCurrentMatch();

    return () => {
      if (currentMatch) {
        leaveMatch(currentMatch._id);
      }
      removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (!currentMatch) return;

    joinMatch(currentMatch._id);
    setScoreA(currentMatch.scoreA || 0);
    setScoreB(currentMatch.scoreB || 0);

    const unsubScoreUpdate = onScoreUpdated((data) => {
      setScoreA(data.scoreA);
      setScoreB(data.scoreB);
    });

    const unsubMatchComplete = onMatchCompleted((data) => {
      setCurrentMatch({ ...currentMatch, status: 'completed', finalScoreA: data.scoreA, finalScoreB: data.scoreB });
    });

    const unsubTelemetry = onTelemetry((data) => {
      setTelemetryData(data);
    });

    const unsubMatchUpdate = onCurrentMatchUpdated((data) => {
      setCurrentMatch(data);
    });

    return () => {
      leaveMatch(currentMatch._id);
      unsubScoreUpdate();
      unsubMatchComplete();
      unsubTelemetry();
      unsubMatchUpdate();
    };
  }, [currentMatch?._id]);

  const loadCurrentMatch = async () => {
    try {
      const response = await getCurrentMatch();
      setCurrentMatch(response.data);
    } catch (error) {
      console.error('Error loading current match:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pub-viewer-container">
        <div className="pub-loading">
          <div className="pub-spinner" />
          <p>Loading live match...</p>
        </div>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="pub-viewer-container">
        <div className="pub-no-match">
          <TrophyIcon size={64} color="var(--pub-neutral-300)" />
          <h2>No Live Match</h2>
          <p>Check back soon for live drone soccer action!</p>
        </div>
      </div>
    );
  }

  const teamA = currentMatch.teamA || { name: 'Team A', color: '#3B82F6' };
  const teamB = currentMatch.teamB || { name: 'Team B', color: '#EF4444' };
  const isLive = currentMatch.status === 'in_progress';
  const isCompleted = currentMatch.status === 'completed';

  // Extract ball position from telemetry
  const ballPosition = telemetryData?.ball || { x: 50, y: 50 };

  return (
    <div className="pub-viewer-container public-mobile-view">
      {/* Live Badge */}
      {isLive && (
        <div className="pub-live-header">
          <div className="pub-live-badge">
            <span className="pub-live-dot" />
            LIVE
          </div>
        </div>
      )}

      {/* Match Info Card */}
      <div className="pub-match-info-card">
        <div className="pub-info-row">
          <div className="pub-info-item">
            <TrophyIcon size={16} color="var(--pub-neutral-600)" />
            <span>{currentMatch.tournament?.name || 'Tournament'}</span>
          </div>
          {currentMatch.round && (
            <div className="pub-info-item">
              <span className="pub-round-badge">Round {currentMatch.round}</span>
            </div>
          )}
        </div>

        {currentMatch.location && (
          <div className="pub-info-row">
            <div className="pub-info-item">
              <LocationIcon size={16} color="var(--pub-neutral-600)" />
              <span>{currentMatch.location.venue || currentMatch.location.city}</span>
            </div>
          </div>
        )}

        {currentMatch.duration && (
          <div className="pub-info-row">
            <div className="pub-info-item">
              <ClockIcon size={16} color="var(--pub-neutral-600)" />
              <span>{currentMatch.duration} minutes</span>
            </div>
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="pub-score-section">
        <div className="pub-team-score">
          <div className="pub-team-color" style={{ backgroundColor: teamA.color }} />
          <div className="pub-team-info">
            <div className="pub-team-name">{teamA.name}</div>
            <div className="pub-team-players">
              <UsersIcon size={14} />
              <span>{teamA.players?.length || 0} players</span>
            </div>
          </div>
          <div className="pub-score">{isCompleted ? currentMatch.finalScoreA : scoreA}</div>
        </div>

        <div className="pub-vs">VS</div>

        <div className="pub-team-score">
          <div className="pub-score">{isCompleted ? currentMatch.finalScoreB : scoreB}</div>
          <div className="pub-team-info">
            <div className="pub-team-name">{teamB.name}</div>
            <div className="pub-team-players">
              <UsersIcon size={14} />
              <span>{teamB.players?.length || 0} players</span>
            </div>
          </div>
          <div className="pub-team-color" style={{ backgroundColor: teamB.color }} />
        </div>
      </div>

      {/* Arena 2D */}
      <div className="pub-arena-section">
        <div className="pub-arena-header">
          <h3>Live Arena</h3>
          {isLive ? (
            <div className="pub-status-badge live">
              <PlayIcon size={14} />
              <span>In Progress</span>
            </div>
          ) : isCompleted ? (
            <div className="pub-status-badge completed">
              <CheckCircleIcon size={14} />
              <span>Completed</span>
            </div>
          ) : (
            <div className="pub-status-badge pending">
              <ClockIcon size={14} />
              <span>Pending</span>
            </div>
          )}
        </div>

        <Arena2D
          teamA={{
            name: teamA.name,
            color: teamA.color,
            drones: telemetryData?.teamA || [],
          }}
          teamB={{
            name: teamB.name,
            color: teamB.color,
            drones: telemetryData?.teamB || [],
          }}
          ballPosition={ballPosition}
          showBall={isLive}
        />
      </div>

      {/* Match Status */}
      {isCompleted && (
        <div className="pub-match-result">
          <h3>Match Result</h3>
          <p className="pub-winner">
            {currentMatch.finalScoreA > currentMatch.finalScoreB
              ? `${teamA.name} Wins!`
              : currentMatch.finalScoreB > currentMatch.finalScoreA
              ? `${teamB.name} Wins!`
              : "It's a Draw!"}
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicMobileViewer;
