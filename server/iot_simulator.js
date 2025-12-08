const axios = require('axios');

/**
 * IoT Simulator for Charging Station
 * Simulates a charging station device sending periodic updates
 */

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const BOOKING_ID = process.env.BOOKING_ID || 123; // Default booking ID for simulation
const UPDATE_INTERVAL = 3000; // 3 seconds

// Initial simulation state
let currentBatteryPercent = 50; // Start at 50%
let energyConsumed = 0.0; // Start at 0 kWh

/**
 * Send charging update to the server
 */
async function sendChargingUpdate() {
  try {
    // Increment values
    currentBatteryPercent = Math.min(currentBatteryPercent + 1, 100); // Increase by 1%, max 100%
    energyConsumed = parseFloat((energyConsumed + 0.1).toFixed(3)); // Increase by 0.1 kWh

    const updateData = {
      energy_consumed: energyConsumed,
      current_battery_percent: currentBatteryPercent
    };

    const url = `${API_BASE_URL}/internal/charging-update/${BOOKING_ID}`;

    console.log(`[${new Date().toLocaleTimeString()}] Sending update to booking ${BOOKING_ID}:`);
    console.log(`  - Battery: ${currentBatteryPercent}%`);
    console.log(`  - Energy: ${energyConsumed} kWh`);
    console.log(`  - URL: ${url}`);

    const response = await axios.post(url, updateData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log(`  ✓ Update sent successfully`);
      console.log(`  - Estimated Cost: ${response.data.data.estimated_cost}₫`);
      console.log(`  - Time Remaining: ${response.data.data.time_remaining || 'N/A'}`);
    } else {
      console.log(`  ✗ Update failed: ${response.data.message}`);
    }

    console.log(''); // Empty line for readability

    // Stop simulation when battery reaches 100%
    if (currentBatteryPercent >= 100) {
      console.log('Battery fully charged! Stopping simulation...');
      clearInterval(intervalId);
      process.exit(0);
    }
  } catch (error) {
    if (error.response) {
      console.error(`  ✗ Error: ${error.response.status} - ${error.response.data.message || error.message}`);
    } else if (error.request) {
      console.error(`  ✗ Error: No response from server. Is the server running?`);
    } else {
      console.error(`  ✗ Error: ${error.message}`);
    }
  }
}

// Start simulation
console.log('========================================');
console.log('IoT Charging Station Simulator');
console.log('========================================');
console.log(`API URL: ${API_BASE_URL}`);
console.log(`Booking ID: ${BOOKING_ID}`);
console.log(`Update Interval: ${UPDATE_INTERVAL}ms (${UPDATE_INTERVAL / 1000} seconds)`);
console.log(`Initial Battery: ${currentBatteryPercent}%`);
console.log(`Initial Energy: ${energyConsumed} kWh`);
console.log('========================================');
console.log('Starting simulation...\n');

// Send first update immediately
sendChargingUpdate();

// Then send updates every 3 seconds
const intervalId = setInterval(sendChargingUpdate, UPDATE_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nStopping simulator...');
  clearInterval(intervalId);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nStopping simulator...');
  clearInterval(intervalId);
  process.exit(0);
});

