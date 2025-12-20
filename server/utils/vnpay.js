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
  
  // CRITICAL: Ensure vnp_Amount is a string (not number) and properly formatted
  if (cleanParams.vnp_Amount) {
    // Convert to integer first, then to string to remove any decimals
    cleanParams.vnp_Amount = String(Math.round(parseFloat(cleanParams.vnp_Amount)));
    console.log('[VNPay] vnp_Amount formatted:', {
      original: params.vnp_Amount,
      formatted: cleanParams.vnp_Amount,
      type: typeof cleanParams.vnp_Amount
    });
  }
  
  // Sort parameters using VNPay official sortObject function
  const sortedParams = sortObject(cleanParams);
  
  // Build hash data using qs.stringify with encode: false (VNPay official method)
  const signData = qs.stringify(sortedParams, { encode: false });
  
  console.log('[VNPay] Hash data (before signing):', signData.substring(0, 200) + '...');
  
  // Create hash (HMAC SHA512) - VNPay standard
  const hmac = crypto.createHmac('sha512', trimmedSecretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  console.log('[VNPay] SecureHash generated:', signed.substring(0, 20) + '...');
  
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
/**
 * Format amount for VNPay (multiply by 100, remove decimals)
 * CRITICAL: VNPay requires amount to be multiplied by 100
 * Example: 5,700 VND → returns "570000" (not "5700")
 * @param {number} amount - Amount in VND (e.g., 5700)
 * @returns {string} - Formatted amount multiplied by 100 (e.g., "570000")
 */
function formatAmount(amount) {
  // Ensure amount is a number
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  
  // Multiply by 100 and round to ensure integer
  // Example: 5700 → 570000
  const formatted = Math.round(numAmount * 100);
  
  return formatted.toString();
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

