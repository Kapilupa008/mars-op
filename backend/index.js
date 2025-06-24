require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'your_mongodb_connection_string_here';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Room Schema & Model
const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const Room = mongoose.model('Room', roomSchema);

// Track users and canvas state
const usersInRooms = {};          // { roomId: [ { socketId, username } ] }
const canvasStateInRooms = {};    // { roomId: latestCanvasPathData }

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  // Join Room
  socket.on('join-room', async ({ roomId, password, username }, callback) => {
    try {
      let room = await Room.findOne({ roomId });

      if (room) {
        if (room.password !== password) {
          return callback({ success: false, message: 'Incorrect password' });
        }
      } else {
        room = new Room({ roomId, password });
        await room.save();
      }

      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username || 'Anonymous';

      if (!usersInRooms[roomId]) usersInRooms[roomId] = [];
      usersInRooms[roomId].push({ socketId: socket.id, username: socket.username });

      callback({ success: true, isEditable: true });

      const userList = usersInRooms[roomId].map(u => u.username);
      io.to(roomId).emit('room-users', userList);

    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Server error' });
    }
  });

  // Drawing update
  socket.on('drawing', ({ roomId, pathData }) => {
    canvasStateInRooms[roomId] = pathData;  // ✅ Store latest canvas
    socket.to(roomId).emit('drawing', { pathData });
  });

  // Clear canvas
  socket.on('clear-canvas', ({ roomId }) => {
    delete canvasStateInRooms[roomId];      // ✅ Clear stored canvas
    socket.to(roomId).emit('clear-canvas');
  });

  // Chat
  socket.on('chat-message', ({ roomId, sender, message }) => {
    socket.to(roomId).emit('chat-message', { sender, message });
  });

  // ✅ New: Handle canvas sync request
  socket.on('request-canvas', ({ roomId }) => {
    const canvasData = canvasStateInRooms[roomId];
    if (canvasData) {
      socket.emit('initial-canvas', { pathData: canvasData });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && usersInRooms[roomId]) {
      usersInRooms[roomId] = usersInRooms[roomId].filter(u => u.socketId !== socket.id);
      const updatedUserList = usersInRooms[roomId].map(u => u.username);
      io.to(roomId).emit('room-users', updatedUserList);
      if (usersInRooms[roomId].length === 0) {
        delete usersInRooms[roomId];
        delete canvasStateInRooms[roomId]; // ✅ Clean canvas memory
      }
    }
    console.log('🔴 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
