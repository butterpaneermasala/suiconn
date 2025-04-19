const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// Game state
const players = {};
const bullets = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Add new player
  players[socket.id] = {
    x: Math.random() * 20 - 10,
    y: 1.6,
    z: Math.random() * 20 - 10,
    rotation: 0,
    health: 100,
    color: Math.floor(Math.random() * 0xFFFFFF)
  };
  
  // Send current game state to new player
  socket.emit('init', { 
    playerId: socket.id, 
    players, 
    bullets 
  });
  
  // Notify other players
  socket.broadcast.emit('playerConnected', {
    id: socket.id,
    ...players[socket.id]
  });
  
  // Player movement
  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].z = data.z;
      players[socket.id].rotation = data.rotation;
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        ...data
      });
    }
  });
  
  // Player shooting
  socket.on('shoot', (bulletData) => {
    const bulletId = Date.now().toString();
    bullets[bulletId] = {
      ...bulletData,
      id: bulletId,
      playerId: socket.id
    };
    io.emit('bulletFired', bullets[bulletId]);
  });
  
  // Bullet hit
  socket.on('hit', (data) => {
    if (players[data.playerId] && players[data.playerId].health > 0) {
      players[data.playerId].health -= 25;
      
      // Update all clients about the hit
      io.emit('playerHit', {
        playerId: data.playerId,
        health: players[data.playerId].health
      });
      
      // Check for death
      if (players[data.playerId].health <= 0) {
        io.emit('playerDied', data.playerId);
        
        // Check if game over (only one player left)
        const remainingPlayers = Object.keys(players).filter(id => players[id].health > 0);
        if (remainingPlayers.length === 1) {
          io.emit('gameOver', remainingPlayers[0]);
        }
      }
    }
    
    // Remove bullet
    delete bullets[data.bulletId];
    io.emit('bulletRemoved', data.bulletId);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
    
    // Check if game over due to disconnect
    const remainingPlayers = Object.keys(players).filter(id => players[id].health > 0);
    if (remainingPlayers.length === 1) {
      io.emit('gameOver', remainingPlayers[0]);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});