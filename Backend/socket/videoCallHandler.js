const handleVideoCall = (io, socket) => {
  // Store user socket mapping
  const users = {};

  // When a user joins, store their socket id
  socket.on('join', (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} joined with socket ID: ${socket.id}`);
  });

  // Handle call initiation
  socket.on('callUser', ({ userToCall, signalData, from, name, isVideoCall }) => {
    const toSocketId = users[userToCall];
    if (toSocketId) {
      io.to(toSocketId).emit('callUser', {
        signal: signalData,
        from,
        name,
        isVideoCall
      });
    } else {
      // Notify caller that recipient is not available
      socket.emit('userUnavailable', { userId: userToCall });
    }
  });

  // Handle call acceptance
  socket.on('answerCall', (data) => {
    const toSocketId = users[data.to];
    if (toSocketId) {
      io.to(toSocketId).emit('callAccepted', data.signal);
    }
  });

  // Handle call rejection
  socket.on('rejectCall', (data) => {
    const toSocketId = users[data.to];
    if (toSocketId) {
      io.to(toSocketId).emit('callRejected', {
        from: data.from
      });
    }
  });

  // Handle call end
  socket.on('endCall', (data) => {
    const toSocketId = users[data.to];
    if (toSocketId) {
      io.to(toSocketId).emit('callEnded');
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    // Remove user from users object
    const userId = Object.keys(users).find(key => users[key] === socket.id);
    if (userId) {
      delete users[userId];
      console.log(`User ${userId} disconnected`);
    }
  });
};

module.exports = handleVideoCall; 