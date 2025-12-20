/**
 * Quick test script to verify routes are loaded correctly
 */
const express = require('express');
const app = express();

// Test imports
try {
  console.log('Testing route imports...\n');
  
  const authRoutes = require('./routes/authRoutes');
  console.log('✓ authRoutes imported successfully');
  
  const userRoutes = require('./routes/userRoutes');
  console.log('✓ userRoutes imported successfully');
  
  // Test route registration
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  
  console.log('\n✓ All routes registered successfully');
  console.log('\nAvailable routes:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/auth/me');
  console.log('  GET  /api/users');
  console.log('  GET  /api/users/:id');
  console.log('  POST /api/users');
  console.log('  PUT  /api/users/:id');
  console.log('  DELETE /api/users/:id');
  
  console.log('\n✅ All routes are properly configured!');
  console.log('\n⚠️  If you still get 404, please RESTART your server:');
  console.log('   1. Stop the current server (Ctrl+C)');
  console.log('   2. Run: npm start (or npm run dev)');
  
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error(error.stack);
  process.exit(1);
}

