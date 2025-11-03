import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

// Initialize socket connection
export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('✅ Socket.io connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

// Get socket instance
export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// Join a match room
export const joinMatch = (matchId) => {
  const s = getSocket();
  s.emit('join-match', matchId);
  console.log(`🔗 Joined match room: ${matchId}`);
};

// Leave a match room
export const leaveMatch = (matchId) => {
  const s = getSocket();
  s.emit('leave-match', matchId);
  console.log(`🔌 Left match room: ${matchId}`);
};

// Listen to round-started event
export const onRoundStarted = (callback) => {
  const s = getSocket();
  s.on('round-started', callback);
};

// Listen to score-updated event
export const onScoreUpdated = (callback) => {
  const s = getSocket();
  s.on('score-updated', callback);
};

// Listen to round-ended event
export const onRoundEnded = (callback) => {
  const s = getSocket();
  s.on('round-ended', callback);
};

// Listen to match-completed event
export const onMatchCompleted = (callback) => {
  const s = getSocket();
  s.on('match-completed', callback);
};

// Listen to telemetry event
export const onTelemetry = (callback) => {
  const s = getSocket();
  s.on('telemetry', callback);
};

// Listen to current-match-updated event
export const onCurrentMatchUpdated = (callback) => {
  const s = getSocket();
  s.on('current-match-updated', callback);
};

// Remove all listeners (cleanup)
export const removeAllListeners = () => {
  const s = getSocket();
  s.off('round-started');
  s.off('score-updated');
  s.off('round-ended');
  s.off('match-completed');
  s.off('telemetry');
  s.off('current-match-updated');
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected');
  }
};

export default {
  initSocket,
  getSocket,
  joinMatch,
  leaveMatch,
  onRoundStarted,
  onScoreUpdated,
  onRoundEnded,
  onMatchCompleted,
  onTelemetry,
  onCurrentMatchUpdated,
  removeAllListeners,
  disconnectSocket
};
