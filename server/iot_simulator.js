const axios = require('axios');

/**
 * IoT Simulator for Charging Station
 * Simulates a charging station device sending periodic updates
 */

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
// Read BOOKING_ID from environment variable or command line argument
// CRITICAL: Parse as integer to ensure it's a number
// Try multiple sources: env var, command line arg, or check if it's set differently
let BOOKING_ID_RAW = process.env.BOOKING_ID || process.argv[2] || null;

// Debug: Log what we received
console.log('[IoT Simulator] Environment check:');
console.log(`  - process.env.BOOKING_ID: ${process.env.BOOKING_ID || 'undefined'}`);
console.log(`  - process.argv[2]: ${process.argv[2] || 'undefined'}`);
console.log(`  - BOOKING_ID_RAW: ${BOOKING_ID_RAW || 'null'}`);

const BOOKING_ID = BOOKING_ID_RAW ? parseInt(BOOKING_ID_RAW) : null;
const UPDATE_INTERVAL = 3000; // 3 seconds

// Validate BOOKING_ID
if (!BOOKING_ID || isNaN(BOOKING_ID) || BOOKING_ID <= 0) {
  console.error('');
  console.error('❌ ERROR: Invalid or missing BOOKING_ID!');
  console.error(`   Received: ${BOOKING_ID_RAW} (parsed: ${BOOKING_ID})`);
  console.error('');
  console.error('📝 Please set BOOKING_ID using one of these methods:');
  console.error('');
  console.error('   Windows PowerShell:');
  console.error('      $env:BOOKING_ID=24; npm run iot-simulator');
  console.error('');
  console.error('   Windows CMD:');
  console.error('      set BOOKING_ID=24 && npm run iot-simulator');
  console.error('');
  console.error('   Linux/Mac:');
  console.error('      BOOKING_ID=24 npm run iot-simulator');
  console.error('');
  console.error('   Or pass as argument:');
  console.error('      npm run iot-simulator 24');
  console.error('');
  console.error('⚠️  IMPORTANT: Ensure the booking exists in database with status "confirmed" or "charging"');
  console.error('');
  process.exit(1);
}

// Initial simulation state
// CRITICAL: Start at 50% to simulate realistic charging progress
let currentBatteryPercent = 50; // Start at 50% (not 95% - that was too high!)
let energyConsumed = 0.0; // Start at 0 kWh

/**
 * Send charging update to the server
 */
async function sendChargingUpdate() {
  try {
    // Check if battery is already at 100% BEFORE incrementing
    if (currentBatteryPercent >= 100) {
      console.log('Battery fully charged (100%)! Stopping simulation...');
      isRunning = false;
      
      // Send final update with 100% to ensure backend marks as completed
      const finalUpdateData = {
        energy_consumed: energyConsumed,
        current_battery_percent: 100
      };
      
      try {
        const finalResponse = await axios.post(
          `${API_BASE_URL}/internal/charging-update/${BOOKING_ID}`,
          finalUpdateData,
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (finalResponse.data.success) {
          console.log('  ✓ Final update sent (100%)');
        }
      } catch (finalError) {
        console.error('  ✗ Error sending final update:', finalError.message);
      }
      
      return;
    }

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
    console.log(`  - Booking ID: ${BOOKING_ID} (ensure this booking exists in database)`);

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

    // Double-check: Stop simulation when battery reaches 100% (after increment)
    if (currentBatteryPercent >= 100) {
      console.log('Battery fully charged! Stopping simulation...');
      isRunning = false;
      return; // Exit the function, loop will handle cleanup
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

// Promise-based delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main simulation loop with proper async/await
let isRunning = true;
let intervalId = null;

async function runSimulation() {
  console.log('');
  console.log('========================================');
  console.log('IoT Charging Station Simulator');
  console.log('========================================');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Booking ID: ${BOOKING_ID} ✅`);
  console.log(`Update Interval: ${UPDATE_INTERVAL}ms (${UPDATE_INTERVAL / 1000} seconds)`);
  console.log(`Initial Battery: ${currentBatteryPercent}%`);
  console.log(`Initial Energy: ${energyConsumed} kWh`);
  console.log('========================================');
  console.log(`⚠️  IMPORTANT: Ensure booking ${BOOKING_ID} exists in database`);
  console.log(`   - Status must be 'confirmed' or 'charging'`);
  console.log(`   - Check: SELECT * FROM bookings WHERE booking_id = ${BOOKING_ID};`);
  console.log('========================================');
  console.log('Starting simulation...\n');

  // Send first update immediately
  await sendChargingUpdate();

  // Then send updates every 3 seconds using async loop
  while (isRunning && currentBatteryPercent < 100) {
    // Wait for the specified interval before next update
    await delay(UPDATE_INTERVAL);
    
    // Check if still running (might have been stopped by Ctrl+C)
    if (!isRunning) {
      break;
    }
    
    // Send next update
    await sendChargingUpdate();
  }

  // If we reached 100%, send final stop signal
  if (currentBatteryPercent >= 100) {
    await sendStopSignal();
  }
}

/**
 * Send stop signal to backend before exiting
 */
async function sendStopSignal() {
  try {
    console.log('\n\nSending stop signal to backend...');
    const stopUrl = `${API_BASE_URL}/internal/charging-stop/${BOOKING_ID}`;
    
    const response = await axios.post(stopUrl, {
      reason: 'simulator_stopped',
      final_battery_percent: currentBatteryPercent,
      final_energy_consumed: energyConsumed
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000 // 5 second timeout
    });
    
    if (response.data && response.data.success) {
      console.log('  ✓ Stop signal sent successfully');
    } else {
      console.log('  ⚠ Stop signal sent but response indicates failure');
    }
  } catch (error) {
    // Log error but don't block exit
    if (error.response) {
      console.error(`  ✗ Error: ${error.response.status} - ${error.response.data?.message || error.message}`);
    } else if (error.request) {
      console.log('  ⚠ Could not send stop signal (server may be down)');
    } else {
      console.error(`  ✗ Error: ${error.message}`);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nStopping simulator (Ctrl+C detected)...');
  isRunning = false;
  
  // Send stop signal to backend before exiting
  await sendStopSignal();
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nStopping simulator...');
  isRunning = false;
  
  // Send stop signal to backend before exiting
  await sendStopSignal();
  
  process.exit(0);
});

// Start the simulation
runSimulation().catch((error) => {
  console.error('Fatal error in simulation:', error);
  process.exit(1);
});

