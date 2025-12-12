const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Station = require('../models/Station');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get payment statistics
 * GET /api/admin/payments/stats
 */
exports.getPaymentStats = async (req, res, next) => {
  try {
    // Total Revenue: SUM(amount) WHERE status = 'success'
    const totalRevenueResult = await Payment.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue']
      ],
      where: { status: 'success' },
      raw: true
    });
    const total_revenue = parseFloat(totalRevenueResult[0]?.total_revenue || 0);

    // Pending Amount: SUM(amount) WHERE status = 'pending'
    const pendingResult = await Payment.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'pending_amount'],
        [sequelize.fn('COUNT', sequelize.col('payment_id')), 'pending_count']
      ],
      where: { status: 'pending' },
      raw: true
    });
    const pending_amount = parseFloat(pendingResult[0]?.pending_amount || 0);
    const pending_count = parseInt(pendingResult[0]?.pending_count || 0);

    // Success Rate: (Count(status='success') / Count(*)) * 100
    const totalCount = await Payment.count();
    const successCount = await Payment.count({ where: { status: 'success' } });
    const success_rate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '0.0';

    res.status(200).json({
      success: true,
      data: {
        total_revenue,
        pending_amount,
        pending_count,
        success_rate: parseFloat(success_rate)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payments with filters
 * GET /api/admin/payments
 */
exports.getPayments = async (req, res, next) => {
  try {
    const { station_id, status, start_date, end_date, search, page = 1, limit = 10 } = req.query;

    // Build WHERE clause for payments
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    // Date range filter
    if (start_date || end_date) {
      where.payment_date = {};
      if (start_date) {
        where.payment_date[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
        where.payment_date[Op.lte] = endDate;
      }
    }

    // Build include conditions
    const bookingInclude = {
      model: Booking,
      as: 'booking',
      attributes: ['booking_id', 'station_id', 'vehicle_type'],
      required: true,
      include: [{
        model: Station,
        as: 'station',
        attributes: ['station_id', 'station_name'],
        required: true
      }]
    };

    // Filter by station_id
    if (station_id && station_id !== 'all') {
      bookingInclude.include[0].where = {
        station_id: parseInt(station_id)
      };
    }

    // Search filter (by booking_id or user full_name)
    const userInclude = {
      model: User,
      as: 'user',
      attributes: ['user_id', 'full_name'],
      required: true
    };

    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum) && searchNum.toString() === search.trim()) {
        // Search by booking_id
        bookingInclude.where = {
          booking_id: searchNum
        };
      } else {
        // Search by user full_name
        userInclude.where = {
          full_name: { [Op.like]: `%${search}%` }
        };
      }
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get payments with relations
    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        userInclude,
        bookingInclude
      ],
      order: [['payment_date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Format response
    const formattedPayments = payments.map(payment => {
      const paymentData = payment.toJSON();
      return {
        payment_id: paymentData.payment_id,
        payment_code: `#${paymentData.payment_id}`, // Mã TT
        booking_id: paymentData.booking_id,
        booking_code: `#${paymentData.booking_id}`, // Mã Booking
        user_id: paymentData.user_id,
        user_name: paymentData.user?.full_name || null,
        station_id: paymentData.booking?.station_id || null,
        station_name: paymentData.booking?.station?.station_name || null,
        vehicle_type: paymentData.booking?.vehicle_type || null,
        amount: paymentData.amount,
        method: paymentData.method,
        status: paymentData.status,
        payment_date: paymentData.payment_date
      };
    });

    res.status(200).json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment by ID with full details
 * GET /api/admin/payments/:payment_id
 */
exports.getPaymentById = async (req, res, next) => {
  try {
    const { payment_id } = req.params;

    const payment = await Payment.findByPk(payment_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'full_name', 'email', 'phone'],
          required: true
        },
        {
          model: Booking,
          as: 'booking',
          attributes: ['booking_id', 'station_id', 'vehicle_type', 'status', 'total_cost', 'start_time', 'end_time'],
          required: true,
          include: [{
            model: Station,
            as: 'station',
            attributes: ['station_id', 'station_name', 'address'],
            required: true
          }]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const paymentData = payment.toJSON();

    // Format response to match UI modal
    const statusMap = {
      'pending': 'Chờ xử lý',
      'success': 'Thành công',
      'failed': 'Thất bại'
    };
    const methodMap = {
      'qr': 'QR Code',
      'bank': 'Chuyển khoản'
    };

    const formattedResponse = {
      payment_info: {
        payment_id: paymentData.payment_id,
        payment_code: `#${paymentData.payment_id}`,
        transaction_id: `TXN${String(paymentData.payment_id).padStart(9, '0')}`, // Generate transaction ID
        amount: paymentData.amount,
        method: paymentData.method,
        method_display: methodMap[paymentData.method] || paymentData.method,
        status: paymentData.status,
        status_display: statusMap[paymentData.status] || paymentData.status,
        payment_date: paymentData.payment_date
      },
      booking_info: {
        booking_id: paymentData.booking_id,
        booking_code: `#${paymentData.booking_id}`,
        vehicle_type: paymentData.booking?.vehicle_type || null,
        booking_status: paymentData.booking?.status || null,
        total_cost: paymentData.booking?.total_cost || null,
        start_time: paymentData.booking?.start_time || null,
        end_time: paymentData.booking?.end_time || null
      },
      customer_info: {
        user_id: paymentData.user_id,
        full_name: paymentData.user?.full_name || null,
        email: paymentData.user?.email || null,
        phone: paymentData.user?.phone || null
      },
      station_info: {
        station_id: paymentData.booking?.station_id || null,
        station_name: paymentData.booking?.station?.station_name || null,
        address: paymentData.booking?.station?.address || null
      }
    };

    res.status(200).json({
      success: true,
      data: formattedResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export payments to Excel/CSV
 * GET /api/admin/payments/export
 */
exports.exportPayments = async (req, res, next) => {
  try {
    const { station_id, status, start_date, end_date, search } = req.query;

    // Re-use the same query logic from getPayments
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (start_date || end_date) {
      where.payment_date = {};
      if (start_date) {
        where.payment_date[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
        where.payment_date[Op.lte] = endDate;
      }
    }

    const bookingInclude = {
      model: Booking,
      as: 'booking',
      attributes: ['booking_id', 'station_id', 'vehicle_type'],
      required: true,
      include: [{
        model: Station,
        as: 'station',
        attributes: ['station_id', 'station_name'],
        required: true
      }]
    };

    if (station_id && station_id !== 'all') {
      bookingInclude.include[0].where = {
        station_id: parseInt(station_id)
      };
    }

    const userInclude = {
      model: User,
      as: 'user',
      attributes: ['user_id', 'full_name'],
      required: true
    };

    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum) && searchNum.toString() === search.trim()) {
        bookingInclude.where = { booking_id: searchNum };
      } else {
        userInclude.where = { full_name: { [Op.like]: `%${search}%` } };
      }
    }

    const payments = await Payment.findAll({
      where,
      include: [userInclude, bookingInclude],
      order: [['payment_date', 'DESC']]
    });

    // Format data for CSV/Excel
    const csvData = [];
    csvData.push(['Mã TT', 'Mã Booking', 'Người TT', 'Trạm', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ngày TT']);

    payments.forEach(payment => {
      const paymentData = payment.toJSON();
      const statusMap = {
        'pending': 'Chờ xử lý',
        'success': 'Thành công',
        'failed': 'Thất bại'
      };
      const methodMap = {
        'qr': 'QR Code',
        'bank': 'Chuyển khoản'
      };

      csvData.push([
        paymentData.payment_id,
        paymentData.booking_id,
        paymentData.user?.full_name || '',
        paymentData.booking?.station?.station_name || '',
        `${parseFloat(paymentData.amount).toLocaleString('vi-VN')}₫`,
        methodMap[paymentData.method] || paymentData.method,
        statusMap[paymentData.status] || paymentData.status,
        new Date(paymentData.payment_date).toLocaleString('vi-VN')
      ]);
    });

    // Convert to CSV format
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const csvBuffer = Buffer.from('\uFEFF' + csvContent, 'utf8'); // BOM for Excel UTF-8

    // Set headers for file download
    const filename = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).send(csvBuffer);
  } catch (error) {
    next(error);
  }
};


