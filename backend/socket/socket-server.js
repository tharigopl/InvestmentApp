const socketIO = require('socket.io');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join event room
    socket.on('join-event', (eventId) => {
      socket.join(`event-${eventId}`);
    });

    // Leave event room
    socket.on('leave-event', (eventId) => {
      socket.leave(`event-${eventId}`);
    });
  });

  return io;
}

// Emit contribution update
function emitContributionUpdate(io, eventId, contribution) {
  io.to(`event-${eventId}`).emit('contribution-received', {
    contributor: contribution.contributor,
    amount: contribution.amount,
    message: contribution.message,
    currentTotal: contribution.event.currentAmount
  });
}

// Emit stock price update
function emitStockPriceUpdate(io, eventId, symbol, price) {
  io.to(`event-${eventId}`).emit('stock-price-update', {
    symbol,
    price,
    timestamp: new Date()
  });
}

module.exports = { initializeSocket, emitContributionUpdate, emitStockPriceUpdate };