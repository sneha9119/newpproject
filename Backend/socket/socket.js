const handleVideoCall = require('./videoCallHandler');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected');

    // Initialize video call handling
    handleVideoCall(io, socket);

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

module.exports = setupSocket; 