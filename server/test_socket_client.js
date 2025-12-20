/**
 * Socket.IO Client Test Script
 * Test real-time charging updates
 * 
 * Usage: node test_socket_client.js <booking_id>
 * Example: node test_socket_client.js 2
 */

const io = require('socket.io-client');

// Get booking_id from command line argument
const bookingId = process.argv[2] || 2;
const socketUrl = process.env.SOCKET_URL || 'http://localhost:3000';

console.log('========================================');
console.log('Socket.IO Client Test');
console.log('========================================');
console.log(`Socket URL: ${socketUrl}`);
console.log(`Booking ID: ${bookingId}`);
console.log(`Room: booking_${bookingId}`);
console.log('========================================\n');

// Connect to Socket.IO server
const socket = io(socketUrl, {
  transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
  console.log(`✓ Connected to server (Socket ID: ${socket.id})\n`);
  
  // Join booking room
  console.log(`Joining room: booking_${bookingId}...`);
  socket.emit('join_booking_room', bookingId);
});

socket.on('room_joined', (data) => {
  console.log(`✓ Joined room: ${data.room}`);
  console.log(`  Booking ID: ${data.booking_id}\n`);
  console.log('Waiting for charging updates...\n');
});

socket.on('charging_update', (data) => {
  console.log('════════════════════════════════════════');
  console.log('📡 REAL-TIME UPDATE RECEIVED');
  console.log('════════════════════════════════════════');
  console.log(`Booking ID: ${data.booking_id}`);
  console.log(`Station: ${data.station_name}`);
  console.log(`Status: ${data.status}`);
  console.log(`Battery: ${data.current_battery_percent}%`);
  console.log(`Energy: ${data.energy_consumed} kWh`);
  console.log(`Cost: ${data.estimated_cost}₫`);
  console.log(`Time Remaining: ${data.time_remaining || 'N/A'}`);
  console.log(`Timestamp: ${new Date().toLocaleTimeString()}`);
  console.log('════════════════════════════════════════\n');
});

socket.on('disconnect', () => {
  console.log('✗ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('✗ Connection error:', error.message);
  console.log('\nMake sure the server is running on', socketUrl);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nDisconnecting...');
  socket.disconnect();
  process.exit(0);
});

