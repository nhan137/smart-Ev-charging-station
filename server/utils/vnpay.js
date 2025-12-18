const crypto = require('crypto');
const qs = require('qs');

/**
 * VNPay Integration Utilities
 * Handles VNPay payment URL generation and hash verification
 * Based on official VNPay NodeJS example code
 */

/**
 * Sort object by key (VNPay official format)
 * Encode both keys and values, replace %20 with + for values
 */
function sortObject(obj) {
  const sorted = {};
  const str = [];
  let key;
  
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  
  str.sort();
  
  for (key = 0; key < str.length; key++) {
    const decodedKey = decodeURIComponent(str[key]);
    sorted[str[key]] = encodeURIComponent(obj[decodedKey]).replace(/%20/g, '+');
  }
  
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
  
  // Remove empty values and convert to strings
  const cleanParams = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      cleanParams[key] = String(params[key]);
    }
  });
  
  // Sort parameters using VNPay official sortObject function
  const sortedParams = sortObject(cleanParams);
  
  // Build hash data using qs.stringify with encode: false (VNPay official method)
  const signData = qs.stringify(sortedParams, { encode: false });
  
  // Create hash (HMAC SHA512) - VNPay standard
  const hmac = crypto.createHmac('sha512', trimmedSecretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  // Add hash to params
  sortedParams['vnp_SecureHash'] = signed;
  
  // Create final query string with hash using qs.stringify with encode: false
  const finalQueryString = qs.stringify(sortedParams, { encode: false });
  
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
  
  // Sort parameters using VNPay official sortObject function
  const sortedParams = sortObject(cleanParams);
  
  // Build hash data using qs.stringify with encode: false (same as createPaymentUrl)
  const signData = qs.stringify(sortedParams, { encode: false });
  
  // Calculate hash
  const hmac = crypto.createHmac('sha512', trimmedSecretKey);
  const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
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

