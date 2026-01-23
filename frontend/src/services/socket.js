import io from 'socket.io-client';

// Dynamic Socket URL - uses current hostname for network compatibility
const getSocketUrl = () => {
  // If env variable is set and not localhost, use it
  if (process.env.REACT_APP_SOCKET_URL && !process.env.REACT_APP_SOCKET_URL.includes('localhost')) {
    return process.env.REACT_APP_SOCKET_URL;
  }

  // Dynamic: use current hostname with backend port
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

  // If accessing via localhost, use localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // Otherwise use the same hostname (network IP) with backend port
  return `${protocol}//${hostname}:5000`;
};

const SOCKET_URL = getSocketUrl();

let socket = null;

// Initialize socket connection
export const initSocket = () => {
  if (!socket) {
    console.log('🔌 Initializing socket connection to:', SOCKET_URL);
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Socket.io connected:', socket.id);
      console.log('📡 Socket URL:', SOCKET_URL);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected. Reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('📍 Trying to connect to:', SOCKET_URL);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
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
  s.on('round-started', (data) => {
    console.log('🎬 [SOCKET] Round started received:', data);
    callback(data);
  });
};

// Listen to score-updated event
export const onScoreUpdated = (callback) => {
  const s = getSocket();
  s.on('score-updated', (data) => {
    console.log('⚽ [SOCKET] Score update received:', data);
    callback(data);
  });
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
  s.on('telemetry', (data) => {
    console.log('📡 Telemetry received:', data.droneId, `X:${data.x}, Y:${data.y}, Z:${data.z}`);
    callback(data);
  });
};

// Listen to current-match-updated event
export const onCurrentMatchUpdated = (callback) => {
  const s = getSocket();
  s.on('current-match-updated', callback);
};

// Listen to timer-paused event
export const onTimerPaused = (callback) => {
  const s = getSocket();
  s.on('timer-paused', callback);
};

// Listen to timer-resumed event
export const onTimerResumed = (callback) => {
  const s = getSocket();
  s.on('timer-resumed', callback);
};

// Listen to timer-reset event
export const onTimerReset = (callback) => {
  const s = getSocket();
  s.on('timer-reset', callback);
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
  s.off('timer-paused');
  s.off('timer-resumed');
  s.off('timer-reset');
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected');
  }
};

const socketService = {
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
  onTimerPaused,
  onTimerResumed,
  onTimerReset,
  removeAllListeners,
  disconnectSocket
};

export default socketService;
