require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Phase 7: Rate Limiting Security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use(limiter);
app.use(cors());
app.use(express.json());

// Attach io to req for routes to use
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const incidentRoutes = require('./routes/incidents');
const assignmentRoutes = require('./routes/assignments');
const timelineRoutes = require('./routes/timeline');
const contactRoutes = require('./routes/contacts');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/contacts', contactRoutes);

// Socket.io Real-time events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_event', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`Socket ${socket.id} joined event_${eventId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
