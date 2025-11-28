import React, { useState, useEffect } from 'react';
import { getCurrentMatch } from '../../services/api';
import { initSocket, joinMatch, leaveMatch, onRoundStarted, onScoreUpdated, onRoundEnded, onMatchCompleted, onTelemetry, removeAllListeners } from '../../services/socket';
// import Arena3D from './Arena3D';

import DroneView3D from '../DroneView3D';
import Leaderboard from './Leaderboard';
import TimerDisplayPublic from './TimerDisplayPublic';
import './PublicViewer.css';

const PublicViewer = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveUpdate, setLiveUpdate] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    initSocket();

    // Load current match
    loadCurrentMatch();

    // Cleanup on unmount
    return () => {
      if (currentMatch) {
        leaveMatch(currentMatch._id);
      }
      removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (currentMatch) {
      // Join match room
      joinMatch(currentMatch._id);

      // Setup real-time listeners
      onRoundStarted((data) => {
        console.log('Round started:', data);
        setLiveUpdate(`Round ${data.roundNumber} started!`);
        setTimeout(() => setLiveUpdate(null), 3000);
        loadCurrentMatch();
      });

      onScoreUpdated((data) => {
        console.log('Score updated:', data);
        setCurrentMatch(prev => ({
          ...prev,
          finalScoreA: data.finalScoreA,
          finalScoreB: data.finalScoreB
        }));
        setLiveUpdate(`Score updated: ${data.finalScoreA} - ${data.finalScoreB}`);
        setTimeout(() => setLiveUpdate(null), 3000);
      });

      onRoundEnded((data) => {
        console.log('Round ended:', data);
        setLiveUpdate(`Round ${data.roundNumber} ended!`);
        setTimeout(() => setLiveUpdate(null), 3000);
        loadCurrentMatch();
      });

      onMatchCompleted((data) => {
        console.log('Match completed:', data);
        setLiveUpdate(`Match completed! Winner: ${data.winner}`);
        setTimeout(() => setLiveUpdate(null), 5000);
        loadCurrentMatch();
      });

      onTelemetry((data) => {
        // Telemetry received - handled by DroneView3D component
        console.log('Telemetry update:', data.droneId);
      });
    }
  }, [currentMatch]);

  const loadCurrentMatch = async () => {
    setLoading(true);
    try {
      const response = await getCurrentMatch();
      if (response.success && response.data) {
        setCurrentMatch(response.data);
      } else {
        setCurrentMatch(null);
      }
    } catch (error) {
      console.error('Error loading current match:', error);
      setCurrentMatch(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-public">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="no-match-public">
        <h1>No Live Match</h1>
        <p>There is no match currently in progress.</p>
        <p>Check back later!</p>
      </div>
    );
  }

  const activeRound = currentMatch.rounds?.find(r => r.status === 'in_progress');

  return (
    <div className="public-viewer-container">
      {/* Live Update Banner */}
      {liveUpdate && (
        <div className="live-update-banner">
          {liveUpdate}
        </div>
      )}

      {/* Header */}
      <header className="header-public">
        <div className="header-content-public">
          <h1 className="title-public">DroneNova - Live Match</h1>
          <div className="live-badge-public">LIVE</div>
        </div>
        <p className="tournament-public">{currentMatch.tournament?.name || 'Tournament'}</p>
      </header>

      {/* Match Info */}
      <div className="match-info-public">
        <div className="team-public">
          <h2 className="team-name-public">{currentMatch.teamA?.name || 'Team A'}</h2>
          <div className="score-display-public">{currentMatch.finalScoreA || 0}</div>
        </div>

        <div className="vs-section-public">
          <span className="vs-public">VS</span>
          <div className="round-info-public">
            <span>Round {currentMatch.currentRound || 1} / 3</span>
            {activeRound && <span className="round-status-public">IN PROGRESS</span>}
          </div>
        </div>

        <div className="team-public">
          <h2 className="team-name-public">{currentMatch.teamB?.name || 'Team B'}</h2>
          <div className="score-display-public">{currentMatch.finalScoreB || 0}</div>
        </div>
      </div>

      {/* Timer Display - Visible to Viewers (No Controls) */}
      {activeRound && activeRound.timerStatus && (
        <div className="timer-section-public">
          <h3 className="section-title-public">Round Timer</h3>
          <TimerDisplayPublic round={activeRound} />
        </div>
      )}

      {/* 3D Arena View */}
      <div className="arena-section-public">
        <h3 className="section-title-public">3D Arena View</h3>
        <DroneView3D matchId={currentMatch?._id} />
      </div>

      {/* Leaderboard */}
      <div className="leaderboard-section-public">
        <Leaderboard tournamentId={currentMatch.tournament?._id} />
      </div>

      {/* Admin Link */}
      <div className="footer-public">
        <a href="/admin/login" className="admin-link-public">Admin Login</a>
      </div>
    </div>
  );
};

export default PublicViewer;
