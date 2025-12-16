const crypto = require('crypto');
const querystring = require('querystring');

/**
 * VNPay Integration Utilities
 * Handles VNPay payment URL generation and hash verification
 */

/**
 * Sort object by key (for VNPay hash calculation)
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
}

/**
 * Create VNPay payment URL
 * @param {Object} params - VNPay parameters
 * @param {string} secretKey - VNPay secret key
 * @param {string} vnpUrl - VNPay payment URL (sandbox or production)
 * @returns {string} - Complete payment URL with hash
 */
function createPaymentUrl(params, secretKey, vnpUrl) {
  // Trim secret key to remove any whitespace
  const trimmedSecretKey = secretKey.trim();
  
  // Remove empty values and sort parameters by key
  const cleanParams = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      cleanParams[key] = String(params[key]);
    }
  });
  const sortedParams = sortObject(cleanParams);
  
  // Create query string for hash calculation using querystring.stringify
  // VNPay requires: Use querystring.stringify which uses + for spaces (not %20)
  const hashQueryString = querystring.stringify(sortedParams);
  
  // Create hash (HMAC SHA512) - VNPay standard
  // Hash is calculated on query string from querystring.stringify
  const hmac = crypto.createHmac('sha512', trimmedSecretKey);
  hmac.update(hashQueryString, 'utf-8');
  const vnp_SecureHash = hmac.digest('hex');
  
  // Add hash to params
  sortedParams['vnp_SecureHash'] = vnp_SecureHash;
  
  // Create final query string with hash using querystring.stringify
  // This ensures consistent encoding format
  const finalQueryString = querystring.stringify(sortedParams);
  
  return `${vnpUrl}?${finalQueryString}`;
}

/**
 * Verify VNPay callback hash
 * @param {Object} params - VNPay callback parameters
 * @param {string} secretKey - VNPay secret key
 * @returns {boolean} - True if hash is valid
 */
function verifyHash(params, secretKey) {
  // Trim secret key to remove any whitespace
  const trimmedSecretKey = secretKey.trim();
  
  // Extract vnp_SecureHash from params
  const vnp_SecureHash = params['vnp_SecureHash'];
  if (!vnp_SecureHash) {
    return false;
  }
  
  // Remove vnp_SecureHash from params for hash calculation
  const paramsForHash = { ...params };
  delete paramsForHash['vnp_SecureHash'];
  
  // Remove empty values and convert to strings
  const cleanParams = {};
  Object.keys(paramsForHash).forEach(key => {
    if (paramsForHash[key] !== null && paramsForHash[key] !== undefined && paramsForHash[key] !== '') {
      cleanParams[key] = String(paramsForHash[key]);
    }
  });
  
  // Sort parameters by key
  const sortedParams = sortObject(cleanParams);
  
  // Create query string using querystring.stringify (same format as createPaymentUrl)
  const queryString = querystring.stringify(sortedParams);
  
  // Calculate hash
  const hmac = crypto.createHmac('sha512', trimmedSecretKey);
  hmac.update(queryString, 'utf-8');
  const calculatedHash = hmac.digest('hex');
  
  // Compare hashes
  return calculatedHash === vnp_SecureHash;
}

/**
 * Format amount for VNPay (multiply by 100, remove decimals)
 * VNPay expects amount in smallest currency unit (VND * 100)
 * @param {number} amount - Amount in VND
 * @returns {string} - Formatted amount
 */
function formatAmount(amount) {
  return Math.round(amount * 100).toString();
}

/**
 * Generate unique transaction reference
 * Format: YYYYMMDDHHmmss_booking_id_random
 * @param {number} bookingId - Booking ID
 * @returns {string} - Transaction reference
 */
function generateTxnRef(bookingId) {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 14); // YYYYMMDDHHmmss
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${dateStr}_${bookingId}_${random}`;
}

module.exports = {
  createPaymentUrl,
  verifyHash,
  formatAmount,
  generateTxnRef
};

