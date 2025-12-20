const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

// Create transporter
const createTransporter = () => {
  // For Gmail, you need to:
  // 1. Enable "Less secure app access" OR
  // 2. Use App Password (recommended)
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD // Your app password
    }
  });
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetUrl - Password reset URL with token
 * @param {string} userName - User's full name
 */
exports.sendPasswordResetEmail = async (to, resetUrl, userName = 'bạn') => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️  Email not configured. Skipping email send.');
      console.log('📧 Password Reset Email (would be sent to):', to);
      console.log('🔗 Reset Link:', resetUrl);
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Smart EV Charging Station" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Đặt lại mật khẩu - Smart EV Charging Station',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${userName}</strong>,</p>
              
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Smart EV Charging Station</strong>.</p>
              
              <p>Nhấn vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
              </div>
              
              <p>Hoặc copy link sau vào trình duyệt:</p>
              <p style="background: #fff; padding: 15px; border-radius: 5px; word-break: break-all; border: 1px solid #ddd;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>⚠️ Lưu ý:</strong>
                <ul>
                  <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                  <li>Không chia sẻ link này với bất kỳ ai</li>
                </ul>
              </div>
              
              <p>Trân trọng,<br><strong>Đội ngũ Smart EV Charging Station</strong></p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
              <p>&copy; 2025 Smart EV Charging Station. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return false;
  }
};

/**
 * Send booking confirmation email
 * @param {string} to - Recipient email
 * @param {object} bookingData - Booking details
 */
exports.sendBookingConfirmationEmail = async (to, bookingData) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️  Email not configured. Skipping email send.');
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Smart EV Charging Station" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Xác nhận đặt lịch - Smart EV Charging Station',
      html: `
        <h2>Đặt lịch thành công!</h2>
        <p>Mã đặt lịch: <strong>${bookingData.booking_code}</strong></p>
        <p>Trạm sạc: ${bookingData.station_name}</p>
        <p>Thời gian: ${bookingData.start_time}</p>
        <p>Trân trọng,<br>Smart EV Charging Station</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return false;
  }
};

// Test email configuration
exports.testEmailConfig = async () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️  Email not configured');
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

