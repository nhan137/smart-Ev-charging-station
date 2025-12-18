// Confirmation Code Service - Quản lý mã xác nhận booking

// Tạo mã xác nhận 6 số ngẫu nhiên
export const generateConfirmationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Lưu mã xác nhận vào localStorage (mock database)
export const saveConfirmationCode = (bookingId: number, code: string): void => {
  const codes = JSON.parse(localStorage.getItem('booking_confirmation_codes') || '{}');
  codes[bookingId] = {
    code,
    created_at: new Date().toISOString(),
    used: false
  };
  localStorage.setItem('booking_confirmation_codes', JSON.stringify(codes));
};

// Kiểm tra mã xác nhận
export const verifyConfirmationCode = (bookingId: number, inputCode: string): boolean => {
  const codes = JSON.parse(localStorage.getItem('booking_confirmation_codes') || '{}');
  const savedCode = codes[bookingId];
  
  if (!savedCode) return false;
  if (savedCode.used) return false;
  
  return savedCode.code === inputCode;
};

// Đánh dấu mã đã sử dụng
export const markCodeAsUsed = (bookingId: number): void => {
  const codes = JSON.parse(localStorage.getItem('booking_confirmation_codes') || '{}');
  if (codes[bookingId]) {
    codes[bookingId].used = true;
    codes[bookingId].used_at = new Date().toISOString();
    localStorage.setItem('booking_confirmation_codes', JSON.stringify(codes));
  }
};

export default {
  generateConfirmationCode,
  saveConfirmationCode,
  verifyConfirmationCode,
  markCodeAsUsed
};
