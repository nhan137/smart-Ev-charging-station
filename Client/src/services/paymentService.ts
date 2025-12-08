import api from './api';
import type { PaymentMethod } from '../types';

export const paymentService = {
  createPayment: async (data: {
    booking_id: number;
    amount: number;
    method: PaymentMethod;
  }) => {
    const response = await api.post('/payments', data);
    return response.data;
  }
};
