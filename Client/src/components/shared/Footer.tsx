import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>EV Charging</h3>
          <p>Hệ thống trạm sạc xe điện hàng đầu Việt Nam</p>
          <div className="social-links">
            <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Liên kết nhanh</h4>
          <ul>
            <li><a href="/">Trang chủ</a></li>
            <li><a href="/stations/map">Tìm trạm sạc</a></li>
            <li><a href="/bookings/history">Lịch sử</a></li>
            <li><a href="/user/feedbacks-favorites">Yêu thích</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Hỗ trợ</h4>
          <ul>
            <li><a href="#">Hướng dẫn sử dụng</a></li>
            <li><a href="#">Câu hỏi thường gặp</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
            <li><a href="#">Điều khoản sử dụng</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Liên hệ</h4>
          <ul className="contact-info">
            <li>
              <Phone size={16} />
              <span>1900 xxxx</span>
            </li>
            <li>
              <Mail size={16} />
              <span>support@evcharging.vn</span>
            </li>
            <li>
              <MapPin size={16} />
              <span>TP. Hồ Chí Minh, Việt Nam</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 EV Charging. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
