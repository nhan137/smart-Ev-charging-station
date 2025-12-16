/**
 * Script to check .env configuration for VNPay
 * Run: node check_env_config.js
 */

require('dotenv').config();

console.log('=== Kiểm tra cấu hình VNPay trong .env ===\n');

// Expected values from VNPay email
const expectedTmnCode = '3MQ86LBJ';
const expectedSecretKey = 'QYMHUM1C6PQUUCVV7T6AYDS5X1DFED0Q';
const expectedUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

// Get values from .env
const actualTmnCode = process.env.VNPAY_TMN_CODE;
const actualSecretKey = process.env.VNPAY_SECRET_KEY;
const actualUrl = process.env.VNPAY_URL;
const actualReturnUrl = process.env.VNPAY_RETURN_URL;
const actualFrontendUrl = process.env.FRONTEND_URL;

console.log('1. VNPAY_TMN_CODE:');
console.log('   Expected:', expectedTmnCode);
console.log('   Actual:  ', actualTmnCode || 'NOT SET');
console.log('   Status:  ', actualTmnCode === expectedTmnCode ? '✅ ĐÚNG' : '❌ SAI');
console.log('');

console.log('2. VNPAY_SECRET_KEY:');
console.log('   Expected:', expectedSecretKey);
console.log('   Actual:  ', actualSecretKey ? `${actualSecretKey.substring(0, 10)}... (length: ${actualSecretKey.length})` : 'NOT SET');
console.log('   Status:  ', actualSecretKey === expectedSecretKey ? '✅ ĐÚNG' : '❌ SAI');
if (actualSecretKey) {
  console.log('   Full Key:', actualSecretKey);
  console.log('   Has whitespace:', /\s/.test(actualSecretKey) ? '⚠️  CÓ (cần xóa)' : '✅ KHÔNG');
  console.log('   Has newline:', /\n/.test(actualSecretKey) ? '⚠️  CÓ (cần xóa)' : '✅ KHÔNG');
}
console.log('');

console.log('3. VNPAY_URL:');
console.log('   Expected:', expectedUrl);
console.log('   Actual:  ', actualUrl || 'NOT SET');
console.log('   Status:  ', actualUrl === expectedUrl ? '✅ ĐÚNG' : '⚠️  CÓ THỂ KHÁC (nhưng vẫn OK nếu là sandbox URL)');
console.log('');

console.log('4. VNPAY_RETURN_URL:');
console.log('   Actual:  ', actualReturnUrl || 'NOT SET');
console.log('   Status:  ', actualReturnUrl ? '✅ SET' : '⚠️  CHƯA SET');
if (actualReturnUrl) {
  console.log('   Format:  ', actualReturnUrl.startsWith('http://') || actualReturnUrl.startsWith('https://') ? '✅ ĐÚNG' : '❌ SAI');
}
console.log('');

console.log('5. FRONTEND_URL:');
console.log('   Actual:  ', actualFrontendUrl || 'NOT SET');
console.log('   Status:  ', actualFrontendUrl ? '✅ SET' : '⚠️  CHƯA SET (không bắt buộc)');
console.log('');

// Summary
console.log('=== TÓM TẮT ===');
const allCorrect = 
  actualTmnCode === expectedTmnCode &&
  actualSecretKey === expectedSecretKey &&
  actualUrl === expectedUrl &&
  actualReturnUrl;

if (allCorrect) {
  console.log('✅ Tất cả cấu hình đã ĐÚNG!');
  console.log('');
  console.log('Bạn có thể:');
  console.log('1. Restart server để load lại environment variables');
  console.log('2. Test API thanh toán VNPay');
} else {
  console.log('❌ Cần kiểm tra lại cấu hình!');
  console.log('');
  console.log('File .env cần có format sau:');
  console.log('');
  console.log('# VNPay Configuration');
  console.log(`VNPAY_TMN_CODE=${expectedTmnCode}`);
  console.log(`VNPAY_SECRET_KEY=${expectedSecretKey}`);
  console.log(`VNPAY_URL=${expectedUrl}`);
  console.log('VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback');
  console.log('');
  console.log('# Frontend URL (optional)');
  console.log('FRONTEND_URL=http://localhost:5173');
  console.log('');
  console.log('⚠️  LƯU Ý:');
  console.log('- VNPAY_SECRET_KEY phải là một dòng duy nhất, không có khoảng trắng thừa');
  console.log('- Sau khi sửa, phải RESTART server');
}

console.log('');
console.log('=== Kết thúc ===');

