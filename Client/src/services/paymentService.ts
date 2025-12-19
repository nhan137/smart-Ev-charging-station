import api from './api';
import type { PaymentMethod } from '../types';

export const paymentService = {
  /**
   * Initialize VNPay payment
   * POST /api/payments/vnpay-init
   * Body: { booking_id: number }
   * Response: { success: boolean, data: { payment_id, booking_id, amount, redirect_url, vnp_txn_ref } }
   */
  vnpayInit: async (bookingId: number) => {
    try {
      const response = await api.post('/payments/vnpay-init', {
        booking_id: bookingId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể khởi tạo thanh toán VNPay');
    }
  },

  /**
   * Create payment (legacy - not used for VNPay)
   * POST /api/payments
   */
  createPayment: async (data: {
    booking_id: number;
    amount: number;
    method: PaymentMethod;
  }) => {
    const response = await api.post('/payments', data);
    return response.data;
  }
};
