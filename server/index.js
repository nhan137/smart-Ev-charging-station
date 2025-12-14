const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Load all models first
const Booking = require('./models/Booking');
const ChargingSession = require('./models/ChargingSession');
const Payment = require('./models/Payment');
const Station = require('./models/Station');
const User = require('./models/User');
const Promotion = require('./models/Promotion');

// Define associations after all models are loaded
Booking.hasOne(ChargingSession, { foreignKey: 'booking_id', as: 'chargingSession' });
ChargingSession.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Payment and User associations
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });

// Booking and User associations
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });

// Station and User (manager) associations
Station.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
User.hasMany(Station, { foreignKey: 'manager_id', as: 'managedStations' });

// Booking and Promotion associations
Booking.belongsTo(Promotion, { foreignKey: 'promo_id', as: 'promotion' });
Promotion.hasMany(Booking, { foreignKey: 'promo_id', as: 'bookings' });

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const stationRoutes = require('./routes/stationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Connect to database
connectDB();

// Middleware
// CORS configuration - support multiple origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Internal API Routes (for IoT simulator)
const chargingController = require('./controllers/chargingController');
app.post('/internal/charging-update/:booking_id', chargingController.receiveChargingUpdate);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Join booking room
  socket.on('join_booking_room', (bookingId) => {
    const room = `booking_${bookingId}`;
    socket.join(room);
    console.log(`[Socket.IO] Client ${socket.id} joined room: ${room}`);
    
    socket.emit('room_joined', {
      success: true,
      room: room,
      booking_id: bookingId
    });
  });

  // Leave booking room
  socket.on('leave_booking_room', (bookingId) => {
    const room = `booking_${bookingId}`;
    socket.leave(room);
    console.log(`[Socket.IO] Client ${socket.id} left room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server is ready`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };

