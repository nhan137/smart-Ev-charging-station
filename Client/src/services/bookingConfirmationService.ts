// Booking Confirmation Service - Xử lý xác nhận booking và mã xác nhận

import { api } from './api';

interface ConfirmBookingRequest {
  booking_id: number;
}

interface VerifyCodeRequest {
  booking_id: number;
  confirmation_code: string;
}

interface ConfirmBookingResponse {
  success: boolean;
  message: string;
  confirmation_code?: string;
  email?: string;
}

interface VerifyCodeResponse {
  success: boolean;
  message: string;
  can_start_charging?: boolean;
}

/**
 * Manager xác nhận booking
 * Backend sẽ:
 * 1. Tạo mã xác nhận 6 số
 * 2. Lưu mã vào database
 * 3. Gửi email cho user
 * 4. Trả về mã xác nhận (chỉ cho manager xem)
 */
export const confirmBooking = async (data: ConfirmBookingRequest): Promise<ConfirmBookingResponse> => {
  try {
    const response = await api.post('/api/bookings/confirm', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi xác nhận booking');
  }
};

/**
 * User xác thực mã để bắt đầu sạc
 * Backend sẽ:
 * 1. Kiểm tra mã xác nhận có đúng không
 * 2. Kiểm tra mã có hết hạn không (thường 24 giờ)
 * 3. Kiểm tra mã chưa được sử dụng
 * 4. Nếu đúng: Cập nhật trạng thái booking thành "charging"
 * 5. Đánh dấu mã đã sử dụng
 */
export const verifyConfirmationCode = async (data: VerifyCodeRequest): Promise<VerifyCodeResponse> => {
  try {
    const response = await api.post('/api/bookings/verify-code', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Mã xác nhận không đúng');
  }
};

/**
 * Lấy thông tin mã xác nhận (cho manager xem)
 */
export const getConfirmationCodeInfo = async (bookingId: number) => {
  try {
    const response = await api.get(`/api/bookings/${bookingId}/confirmation-code`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi lấy thông tin mã xác nhận');
  }
};

/**
 * Gửi lại mã xác nhận (nếu user không nhận được email)
 */
export const resendConfirmationCode = async (bookingId: number) => {
  try {
    const response = await api.post(`/api/bookings/${bookingId}/resend-code`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi gửi lại mã xác nhận');
  }
};

export default {
  confirmBooking,
  verifyConfirmationCode,
  getConfirmationCodeInfo,
  resendConfirmationCode
};
