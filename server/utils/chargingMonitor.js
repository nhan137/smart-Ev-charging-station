/**
 * Charging Monitor Utility
 * Tracks last update time for each booking to detect if IoT Simulator stopped
 */

const chargingLastUpdate = new Map(); // booking_id -> lastUpdateTimestamp
const TIMEOUT_THRESHOLD = 5000; // 5 seconds - if no update received, assume stopped (reduced for faster detection)

/**
 * Record that an update was received for a booking
 */
function recordUpdate(bookingId) {
  chargingLastUpdate.set(bookingId, Date.now());
}

/**
 * Check if a booking's simulator has stopped (no updates for TIMEOUT_THRESHOLD)
 */
function hasSimulatorStopped(bookingId) {
  const lastUpdate = chargingLastUpdate.get(bookingId);
  if (!lastUpdate) return false;
  
  const timeSinceLastUpdate = Date.now() - lastUpdate;
  return timeSinceLastUpdate > TIMEOUT_THRESHOLD;
}

/**
 * Remove tracking for a booking (when charging completes)
 */
function removeTracking(bookingId) {
  chargingLastUpdate.delete(bookingId);
}

/**
 * Get all bookings that may have stopped simulators
 */
function getStoppedBookings() {
  const stopped = [];
  for (const [bookingId, lastUpdate] of chargingLastUpdate.entries()) {
    if (hasSimulatorStopped(bookingId)) {
      stopped.push({
        booking_id: bookingId,
        last_update: lastUpdate,
        time_since_update: Date.now() - lastUpdate
      });
    }
  }
  return stopped;
}

module.exports = {
  recordUpdate,
  hasSimulatorStopped,
  removeTracking,
  getStoppedBookings
};

