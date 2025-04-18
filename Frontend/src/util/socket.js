import io from 'socket.io-client';

// Initialize socket connection
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true, // Add credentials if your backend requires it
});

// Socket event listeners for debugging
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

// Video call events
socket.on('callRequest', (data) => {
  console.log('Call request received:', data);
});

socket.on('callAccepted', (data) => {
  console.log('Call accepted:', data);
});

socket.on('callRejected', (data) => {
  console.log('Call rejected:', data);
});

socket.on('callEnded', (data) => {
  console.log('Call ended:', data);
});

// Export socket instance and helper functions
export const sendSocketMessage = (event, data) => {
  if (socket.connected) {
    socket.emit(event, data);
    return true;
  }
  return false;
};

// Video call helper functions
export const initiateCall = (recipientId, isVideoCall = true) => {
  if (socket.connected) {
    console.log('Initiating call to:', recipientId);
    socket.emit('initiateCall', {
      recipientId,
      isVideoCall
    });
    return true;
  }
  return false;
};

export default socket; 