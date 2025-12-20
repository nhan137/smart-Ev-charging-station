const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const ChargingSession = require('../models/ChargingSession');
const Notification = require('../models/Notification');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { createPaymentUrl, verifyHash, formatAmount, generateTxnRef } = require('../utils/vnpay');

/**
 * Initialize VNPay payment
 * POST /api/payments/vnpay-init
 */
exports.vnpayInit = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Debug: Log VNPay config (tạm thời để test)
    console.log('VNPay Config:', {
      tmnCode: process.env.VNPAY_TMN_CODE,
      hasSecret: !!process.env.VNPAY_SECRET_KEY,
      secretLength: process.env.VNPAY_SECRET_KEY?.length
    });
    
    const { booking_id } = req.body;
    const user_id = req.user.user_id;

    // Validate input
    if (!booking_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // 1. Verify user owns booking and booking is completed
    const booking = await Booking.findOne({
      where: {
        booking_id: booking_id,
        user_id: user_id,
        status: { [Op.in]: ['completed', 'charging'] } // Allow payment for completed or charging bookings
      },
      include: [
        {
          model: Station,
          as: 'station',
          attributes: ['station_name', 'station_id']
        },
        {
          model: ChargingSession,
          as: 'chargingSession',
          required: false,
          attributes: ['actual_cost', 'energy_consumed', 'start_battery_percent', 'end_battery_percent']
        }
      ],
      transaction
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Booking not found, not owned by user, or not eligible for payment'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      where: { booking_id: booking_id },
      transaction
    });

    if (existingPayment && existingPayment.status === 'success') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    // 2. Calculate total amount - CRITICAL: Use actual_cost from ChargingSession (tiền thực tế khi sạc)
    // If ChargingSession exists and has actual_cost, use it; otherwise fallback to booking.total_cost
    let total_amount = 0;
    const chargingSession = booking.chargingSession;
    
    if (chargingSession && chargingSession.actual_cost) {
      // Use actual cost from charging session (tiền thực tế)
      total_amount = parseFloat(chargingSession.actual_cost);
      console.log(`[Payment] Using actual_cost from ChargingSession: ${total_amount}`);
    } else if (booking.total_cost) {
      // Fallback to booking total_cost if no charging session yet
      total_amount = parseFloat(booking.total_cost);
      console.log(`[Payment] Using total_cost from Booking (fallback): ${total_amount}`);
    }
    
    // VNPay sandbox - Different banks have different minimum amounts
    // NCB Bank typically requires minimum 5,000 VND
    // Some banks may require 10,000 VND
    // We'll use 5,000 VND as a safe minimum
    const MIN_AMOUNT = 5000;
    
    if (total_amount <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid booking amount. Please ensure charging is completed.'
      });
    }
    
    // Check minimum amount for VNPay (bank-specific limits)
    if (total_amount < MIN_AMOUNT) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Số tiền thanh toán tối thiểu là ${MIN_AMOUNT.toLocaleString('vi-VN')}đ (theo quy định của ngân hàng). Số tiền hiện tại: ${total_amount.toLocaleString('vi-VN')}đ. Vui lòng đảm bảo số tiền >= ${MIN_AMOUNT.toLocaleString('vi-VN')}đ.`
      });
    }

    // 3. Create or update payment record
    let payment;
    if (existingPayment) {
      // Update existing payment
      await existingPayment.update({
        amount: total_amount,
        status: 'pending',
        payment_date: new Date()
      }, { transaction });
      payment = existingPayment;
    } else {
      // Create new payment
      payment = await Payment.create({
        booking_id: booking_id,
        user_id: user_id,
        amount: total_amount,
        method: 'bank', // VNPay is bank transfer method
        status: 'pending'
      }, { transaction });
    }

    // 4. VNPay Integration
    const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
    const vnp_HashSecret = process.env.VNPAY_SECRET_KEY;
    const vnp_Url = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnp_ReturnUrl = process.env.VNPAY_RETURN_URL || `http://localhost:3000/api/payments/vnpay-callback`;

    if (!vnp_TmnCode || !vnp_HashSecret) {
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: 'VNPay configuration missing. Please check environment variables.'
      });
    }

    // Generate transaction reference
    const vnp_TxnRef = generateTxnRef(booking_id);

    // Helper function to remove Vietnamese accents and convert to ASCII
    const removeVietnameseAccents = (str) => {
      if (!str) return '';
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^\x00-\x7F]/g, ''); // Remove any remaining non-ASCII
    };

    // Format station name: remove accents and limit length (VNPay max 255 chars for OrderInfo)
    const stationName = booking.station?.station_name || 'EV Charging Station';
    const cleanStationName = removeVietnameseAccents(stationName).substring(0, 100);
    const orderInfo = `Thanh toan don hang ${booking_id} - ${cleanStationName}`.substring(0, 255);

    // Get IP address - ensure it's IPv4 (VNPay may not accept IPv6)
    let clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
    // If IPv6 (::1), convert to IPv4
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1';
    }
    // Extract first IP if x-forwarded-for contains multiple IPs
    if (clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    // CRITICAL: Format amount for VNPay (must multiply by 100)
    // VNPay expects amount in smallest currency unit (VND * 100)
    // Example: 2,700 VND → must send 270,000 to VNPay
    // VNPay will then display it as 2,700VND (divides by 100 for display)
    const vnp_Amount = formatAmount(total_amount);
    
    console.log('========================================');
    console.log('[Payment] ✅ Amount formatting for VNPay:');
    console.log(`  Original amount (from DB): ${total_amount.toLocaleString('vi-VN')} VND`);
    console.log(`  Formatted amount (× 100):  ${parseInt(vnp_Amount).toLocaleString('vi-VN')} (sent to VNPay)`);
    console.log(`  VNPay will display:        ${(parseInt(vnp_Amount) / 100).toLocaleString('vi-VN')} VND`);
    console.log(`  Calculation: ${total_amount} × 100 = ${vnp_Amount}`);
    console.log('========================================');

    // Create VNPay parameters
    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnp_TmnCode,
      vnp_Amount: vnp_Amount, // Already multiplied by 100 via formatAmount
      vnp_CurrCode: 'VND',
      vnp_TxnRef: vnp_TxnRef,
      vnp_OrderInfo: orderInfo, // ASCII only, max 255 chars
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: clientIp, // IPv4 only
      vnp_CreateDate: new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14) // YYYYMMDDHHmmss
    };

    // Debug: Log all VNPay parameters before creating URL
    console.log('[Payment] VNPay Parameters:', {
      vnp_Amount: vnp_Params.vnp_Amount,
      vnp_TxnRef: vnp_Params.vnp_TxnRef,
      vnp_OrderInfo: vnp_Params.vnp_OrderInfo,
      vnp_ReturnUrl: vnp_Params.vnp_ReturnUrl,
      vnp_TmnCode: vnp_Params.vnp_TmnCode,
      vnp_Command: vnp_Params.vnp_Command,
      vnp_Version: vnp_Params.vnp_Version
    });

    // Create payment URL with hash
    const redirect_url = createPaymentUrl(vnp_Params, vnp_HashSecret, vnp_Url);
    
    console.log('[Payment] ✅ VNPay Payment URL created:', redirect_url.substring(0, 100) + '...');

    // Store transaction reference in payment (optional, can use payment_id)
    // You might want to add a vnp_txn_ref field to payments table
    // For now, we'll use payment_id as reference

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Payment URL generated successfully',
      data: {
        payment_id: payment.payment_id,
        booking_id: booking_id,
        amount: total_amount,
        redirect_url: redirect_url,
        vnp_txn_ref: vnp_TxnRef
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Handle VNPay callback
 * GET /api/payments/vnpay-callback
 */
exports.vnpayCallback = async (req, res, next) => {
  try {
    // 1. Receive parameters from VNPay
    const vnp_Params = req.query;
    
    // Extract important fields
    const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
    const vnp_TxnRef = vnp_Params['vnp_TxnRef'];
    const vnp_Amount = vnp_Params['vnp_Amount'];
    const vnp_SecureHash = vnp_Params['vnp_SecureHash'];

    // Get secret key
    const vnp_HashSecret = process.env.VNPAY_SECRET_KEY;

    if (!vnp_HashSecret) {
      return res.status(500).json({
        RspCode: '99',
        Message: 'VNPay configuration missing'
      });
    }

    // 2. Verify hash (MUST be first check)
    const isValidHash = verifyHash(vnp_Params, vnp_HashSecret);

    if (!isValidHash) {
      console.error('[VNPay] Invalid hash in callback:', vnp_Params);
      return res.status(400).json({
        RspCode: '97',
        Message: 'Invalid hash'
      });
    }

    // Extract booking_id from vnp_TxnRef (format: YYYYMMDDHHmmss_booking_id_random)
    const bookingIdMatch = vnp_TxnRef.match(/_(\d+)_/);
    if (!bookingIdMatch) {
      return res.status(400).json({
        RspCode: '01',
        Message: 'Invalid transaction reference'
      });
    }
    const booking_id = parseInt(bookingIdMatch[1]);

    // Find payment by booking_id
    const payment = await Payment.findOne({
      where: { booking_id: booking_id },
      include: [{
        model: Booking,
        as: 'booking',
        attributes: ['user_id', 'station_id']
      }]
    });

    if (!payment) {
      return res.status(404).json({
        RspCode: '01',
        Message: 'Payment not found'
      });
    }

    // Verify amount (VNPay sends amount * 100)
    const expectedAmount = formatAmount(parseFloat(payment.amount));
    if (vnp_Amount !== expectedAmount) {
      console.error('[VNPay] Amount mismatch:', { received: vnp_Amount, expected: expectedAmount });
      return res.status(400).json({
        RspCode: '04',
        Message: 'Amount mismatch'
      });
    }

    // 3. Update payment status
    if (vnp_ResponseCode === '00' && isValidHash) {
      // Payment successful
      await payment.update({
        status: 'success',
        payment_date: new Date()
      });

      // Send notification to user
      if (payment.booking && payment.booking.user_id) {
        await Notification.create({
          user_id: payment.booking.user_id,
          title: 'Thanh toán thành công',
          message: `Thanh toán cho booking #${booking_id} đã thành công. Số tiền: ${payment.amount.toLocaleString('vi-VN')}₫`,
          type: 'payment',
          status: 'unread'
        });
      }

      // Redirect to Frontend Payment page with success status
      // User will see success modal on Payment page, then click OK to go to Home
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/bookings/${booking_id}/payment?payment_status=success&payment_id=${payment.payment_id}`;
      return res.redirect(redirectUrl);
    } else {
      // Payment failed
      await payment.update({
        status: 'failed',
        payment_date: new Date()
      });

      // Send notification to user
      if (payment.booking && payment.booking.user_id) {
        await Notification.create({
          user_id: payment.booking.user_id,
          title: 'Thanh toán thất bại',
          message: `Thanh toán cho booking #${booking_id} thất bại. Vui lòng thử lại.`,
          type: 'payment',
          status: 'unread'
        });
      }

      // Error messages mapping
      const errorMessages = {
        '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
        '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
        '10': 'Xác thực không thành công do: Nhập sai quá 3 lần thông tin thẻ/tài khoản',
        '11': 'Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.',
        '12': 'Thẻ/Tài khoản bị khóa.',
        '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP).',
        '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
        '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
        '75': 'Ngân hàng thanh toán đang bảo trì.',
        '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.'
      };

      const errorMessage = errorMessages[vnp_ResponseCode] || `Lỗi thanh toán. Mã lỗi: ${vnp_ResponseCode}`;

      // Redirect to Frontend Payment page with failed status
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/bookings/${booking_id}/payment?payment_status=failed&error_code=${vnp_ResponseCode}&message=${encodeURIComponent(errorMessage)}`;
      return res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('[VNPay] Callback error:', error);
    next(error);
  }
};
