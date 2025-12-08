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
  // Sort parameters by key
  const sortedParams = sortObject(params);
  
  // Create query string
  const queryString = querystring.stringify(sortedParams, null, null, {
    encodeURIComponent: (str) => {
      return querystring.escape(str);
    }
  });
  
  // Create hash
  const hmac = crypto.createHmac('sha512', secretKey);
  hmac.update(queryString, 'utf-8');
  const vnp_SecureHash = hmac.digest('hex');
  
  // Add hash to params
  sortedParams['vnp_SecureHash'] = vnp_SecureHash;
  
  // Create final query string
  const finalQueryString = querystring.stringify(sortedParams, null, null, {
    encodeURIComponent: (str) => {
      return querystring.escape(str);
    }
  });
  
  return `${vnpUrl}?${finalQueryString}`;
}

/**
 * Verify VNPay callback hash
 * @param {Object} params - VNPay callback parameters
 * @param {string} secretKey - VNPay secret key
 * @returns {boolean} - True if hash is valid
 */
function verifyHash(params, secretKey) {
  // Extract vnp_SecureHash from params
  const vnp_SecureHash = params['vnp_SecureHash'];
  if (!vnp_SecureHash) {
    return false;
  }
  
  // Remove vnp_SecureHash from params for hash calculation
  const paramsForHash = { ...params };
  delete paramsForHash['vnp_SecureHash'];
  
  // Sort parameters by key
  const sortedParams = sortObject(paramsForHash);
  
  // Create query string
  const queryString = querystring.stringify(sortedParams, null, null, {
    encodeURIComponent: (str) => {
      return querystring.escape(str);
    }
  });
  
  // Calculate hash
  const hmac = crypto.createHmac('sha512', secretKey);
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

