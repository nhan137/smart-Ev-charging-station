// Notification Service - Gửi thông báo cho user

import  api  from './api';

interface CreateNotificationRequest {
  user_id: number;
  title: string;
  message: string;
  type: 'system' | 'booking' | 'payment' | 'promotion';
  booking_id?: number;
  confirmation_code?: string;
}

interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  booking_id?: number;
  confirmation_code?: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Tạo thông báo mới
 * Backend sẽ lưu thông báo vào database
 */
export const createNotification = async (data: CreateNotificationRequest): Promise<Notification> => {
  try {
    const response = await api.post('/api/notifications', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi tạo thông báo');
  }
};

/**
 * Lấy danh sách thông báo của user
 */
export const getMyNotifications = async () => {
  try {
    const response = await api.get('/api/notifications/my-notifications');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi lấy thông báo');
  }
};

/**
 * Đánh dấu thông báo đã đọc
 */
export const markAsRead = async (notificationId: number) => {
  try {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi cập nhật thông báo');
  }
};

/**
 * Xóa thông báo
 */
export const deleteNotification = async (notificationId: number) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lỗi xóa thông báo');
  }
};

/**
 * Gửi thông báo xác nhận booking với mã 6 số
 */
export const sendBookingConfirmationNotification = async (
  userId: number,
  bookingId: number,
  confirmationCode: string,
  userName: string,
  stationName: string
): Promise<Notification> => {
  return createNotification({
    user_id: userId,
    title: 'Booking được xác nhận',
    message: `Booking #${bookingId} tại ${stationName} đã được xác nhận. Mã xác nhận: ${confirmationCode}`,
    type: 'booking',
    booking_id: bookingId,
    confirmation_code: confirmationCode
  });
};

export default {
  createNotification,
  getMyNotifications,
  markAsRead,
  deleteNotification,
  sendBookingConfirmationNotification
};
