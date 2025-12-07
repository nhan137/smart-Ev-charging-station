-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th12 07, 2025 lúc 10:00 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `smartchargingstation_mvp`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int(11) NOT NULL COMMENT 'ID đặt lịch',
  `user_id` int(11) NOT NULL COMMENT 'ID user đặt lịch',
  `station_id` int(11) NOT NULL COMMENT 'ID trạm sạc',
  `promo_id` int(11) DEFAULT NULL COMMENT 'ID mã giảm giá đã áp dụng (NULL nếu không áp dụng)',
  `vehicle_type` varchar(50) NOT NULL COMMENT 'Loại xe được chọn (VD: xe_may_usb, oto_ccs) - KHÔNG CÓ vehicle_id',
  `start_time` datetime NOT NULL COMMENT 'Giờ dự kiến bắt đầu',
  `end_time` datetime DEFAULT NULL COMMENT 'Giờ dự kiến kết thúc',
  `actual_start` datetime DEFAULT NULL COMMENT 'Giờ thực tế bắt đầu (NULL nếu chưa)',
  `actual_end` datetime DEFAULT NULL COMMENT 'Giờ thực tế kết thúc (NULL nếu chưa)',
  `status` enum('pending','confirmed','charging','completed','cancelled') DEFAULT 'pending' COMMENT 'Trạng thái: pending/confirmed/charging/completed/cancelled',
  `total_cost` decimal(10,2) DEFAULT NULL COMMENT 'Tổng chi phí (đã tính giảm giá)',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Ngày đặt lịch'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `charging_sessions`
--

CREATE TABLE `charging_sessions` (
  `session_id` int(11) NOT NULL COMMENT 'ID phiên sạc',
  `booking_id` int(11) NOT NULL COMMENT 'ID booking (1 booking = 1 session)',
  `start_battery_percent` int(11) DEFAULT NULL COMMENT '% pin lúc bắt đầu (0-100)',
  `end_battery_percent` int(11) DEFAULT NULL COMMENT '% pin lúc kết thúc (0-100)',
  `energy_consumed` decimal(10,3) DEFAULT NULL COMMENT 'Điện tiêu thụ (kWh)',
  `actual_cost` decimal(10,2) DEFAULT NULL COMMENT 'Chi phí thực tế',
  `started_at` datetime DEFAULT current_timestamp() COMMENT 'Thời gian bắt đầu sạc',
  `ended_at` datetime DEFAULT NULL COMMENT 'Thời gian kết thúc sạc (NULL nếu chưa)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `favorites`
--

CREATE TABLE `favorites` (
  `user_id` int(11) NOT NULL COMMENT 'ID user',
  `station_id` int(11) NOT NULL COMMENT 'ID trạm',
  `added_at` datetime DEFAULT current_timestamp() COMMENT 'Ngày lưu'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `feedbacks`
--

CREATE TABLE `feedbacks` (
  `feedback_id` int(11) NOT NULL COMMENT 'ID đánh giá',
  `user_id` int(11) NOT NULL COMMENT 'ID user đánh giá',
  `station_id` int(11) NOT NULL COMMENT 'ID trạm được đánh giá',
  `booking_id` int(11) DEFAULT NULL COMMENT 'ID booking liên kết (Optional)',
  `rating` int(11) NOT NULL COMMENT 'Số sao (1-5)',
  `comment` text DEFAULT NULL COMMENT 'Bình luận chi tiết',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Ngày đánh giá'
) ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL COMMENT 'ID thông báo',
  `user_id` int(11) DEFAULT NULL COMMENT 'ID user nhận (NULL = tất cả user)',
  `title` varchar(100) NOT NULL COMMENT 'Tiêu đề thông báo',
  `message` text NOT NULL COMMENT 'Nội dung thông báo',
  `type` enum('system','payment','promotion','booking') DEFAULT 'system' COMMENT 'Loại thông báo',
  `status` enum('unread','read') DEFAULT 'unread' COMMENT 'Trạng thái đã đọc',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Ngày gửi'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL COMMENT 'ID thanh toán',
  `booking_id` int(11) NOT NULL COMMENT 'ID booking (1 booking = 1 payment)',
  `user_id` int(11) NOT NULL COMMENT 'ID user thanh toán',
  `amount` decimal(10,2) NOT NULL COMMENT 'Số tiền thanh toán',
  `method` enum('qr','bank') NOT NULL COMMENT 'Phương thức: QR hoặc Bank',
  `status` enum('pending','success','failed') DEFAULT 'pending' COMMENT 'Trạng thái thanh toán',
  `payment_date` datetime DEFAULT current_timestamp() COMMENT 'Ngày thanh toán'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `promotions`
--

CREATE TABLE `promotions` (
  `promo_id` int(11) NOT NULL COMMENT 'ID mã giảm giá',
  `code` varchar(50) NOT NULL COMMENT 'Mã duy nhất (VD: SUMMER50)',
  `title` varchar(100) NOT NULL COMMENT 'Tên mã (VD: Hè khuyến mãi)',
  `discount_percent` int(11) NOT NULL COMMENT '% giảm (VD: 10)',
  `min_amount` decimal(10,2) DEFAULT NULL COMMENT 'Đơn tối thiểu',
  `max_discount` decimal(10,2) DEFAULT NULL COMMENT 'Giảm tối đa',
  `valid_from` datetime NOT NULL COMMENT 'Ngày bắt đầu',
  `valid_to` datetime NOT NULL COMMENT 'Ngày hết hạn',
  `status` enum('active','expired') DEFAULT 'active' COMMENT 'Hiệu lực hay hết hạn',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Ngày tạo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reports`
--

CREATE TABLE `reports` (
  `report_id` int(11) NOT NULL COMMENT 'ID báo cáo',
  `station_id` int(11) NOT NULL COMMENT 'ID trạm gặp sự cố',
  `reporter_id` int(11) NOT NULL COMMENT 'ID user/manager báo cáo',
  `title` varchar(200) NOT NULL COMMENT 'Tiêu đề sự cố',
  `description` text NOT NULL COMMENT 'Mô tả chi tiết',
  `status` enum('pending','resolved') DEFAULT 'pending' COMMENT 'Trạng thái xử lý',
  `reported_at` datetime DEFAULT current_timestamp() COMMENT 'Ngày báo cáo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL COMMENT 'Tên vai trò: User, Manager, Admin',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Ngày tạo vai trò'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stations`
--

CREATE TABLE `stations` (
  `station_id` int(11) NOT NULL COMMENT 'ID trạm',
  `station_name` varchar(100) NOT NULL COMMENT 'Tên trạm (VD: Trạm Hàng Xanh)',
  `address` varchar(255) NOT NULL COMMENT 'Địa chỉ đầy đủ',
  `latitude` decimal(10,6) DEFAULT NULL COMMENT 'Vĩ độ (Google Maps)',
  `longitude` decimal(10,6) DEFAULT NULL COMMENT 'Kinh độ (Google Maps)',
  `price_per_kwh` decimal(10,2) NOT NULL COMMENT 'Giá điện (đ/kWh) - KHÔNG PHẢI price_per_hour',
  `station_type` enum('xe_may','oto','ca_hai') NOT NULL COMMENT 'Loại trạm',
  `total_slots` int(11) NOT NULL DEFAULT 1 COMMENT 'Tổng số chỗ sạc',
  `available_slots` int(11) NOT NULL DEFAULT 1 COMMENT 'Số chỗ trống hiện tại',
  `charging_power` decimal(5,2) DEFAULT NULL COMMENT 'Công suất sạc (kW)',
  `connector_types` varchar(100) DEFAULT NULL COMMENT 'Loại đầu sạc (USB-C, CCS, Lightning...)',
  `opening_hours` varchar(100) DEFAULT NULL COMMENT 'Giờ mở cửa (VD: 06:00-22:00)',
  `avatar_url` varchar(255) DEFAULT NULL COMMENT 'Link ảnh đại diện trạm (1 ảnh duy nhất)',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT 'SĐT liên hệ trạm',
  `status` enum('active','maintenance','inactive') DEFAULT 'active' COMMENT 'Trạng thái trạm',
  `manager_id` int(11) DEFAULT NULL COMMENT 'ID manager quản lý trạm',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Ngày tạo trạm'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- --------------------------------------------------------
--
-- Dữ liệu mẫu cho bảng `stations` - 5 trạm sạc ở Đà Nẵng
--

INSERT INTO `stations` (`station_name`, `address`, `latitude`, `longitude`, `price_per_kwh`, `station_type`, `total_slots`, `available_slots`, `charging_power`, `connector_types`, `opening_hours`, `avatar_url`, `contact_phone`, `status`, `manager_id`, `created_at`) VALUES
('Trạm Sạc Cầu Rồng', '123 Trần Phú, Hải Châu, Đà Nẵng - Gần Cầu Rồng và Bãi biển Mỹ Khê', 16.061400, 108.226700, 3500.00, 'ca_hai', 6, 3, 50.00, 'Type 2, CCS2, CHAdeMO', '24/7', 'https://picsum.photos/400/300?random=1', '0901234567', 'active', NULL, NOW()),
('Trạm Sạc Sơn Trà Premium', '456 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng - Khu vực Bán đảo Sơn Trà', 16.100000, 108.250000, 3200.00, 'oto', 8, 5, 100.00, 'Type 2, CCS2', '24/7', 'https://picsum.photos/400/300?random=2', '0901234568', 'active', NULL, NOW()),
('Trạm Sạc Ngũ Hành Sơn', '789 Nguyễn Tất Thành, Ngũ Hành Sơn, Đà Nẵng - Gần Chùa Linh Ứng', 16.000000, 108.250000, 3000.00, 'ca_hai', 10, 7, 60.00, 'Type 2, CCS2, CHAdeMO, GB/T', '06:00-22:00', 'https://picsum.photos/400/300?random=3', '0901234569', 'active', NULL, NOW()),
('Trạm Sạc Thanh Khê Express', '321 Điện Biên Phủ, Thanh Khê, Đà Nẵng - Trung tâm thương mại', 16.054400, 108.202200, 3300.00, 'xe_may', 5, 2, 20.00, 'Type 2, Schuko', '24/7', 'https://picsum.photos/400/300?random=4', '0901234570', 'active', NULL, NOW()),
('Trạm Sạc Hải Châu Center', '555 Lê Duẩn, Hải Châu, Đà Nẵng - Trung tâm thành phố', 16.054400, 108.202200, 3800.00, 'ca_hai', 12, 8, 75.00, 'Type 2, CCS2, CHAdeMO, USB-C', '07:00-23:00', 'https://picsum.photos/400/300?random=5', '0901234571', 'active', NULL, NOW());

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL COMMENT 'ID người dùng',
  `full_name` varchar(100) NOT NULL COMMENT 'Họ và tên đầy đủ',
  `email` varchar(100) NOT NULL COMMENT 'Email duy nhất, dùng để đăng nhập',
  `password` varchar(255) NOT NULL COMMENT 'Mật khẩu (phải mã hóa bcrypt)',
  `phone` varchar(20) DEFAULT NULL COMMENT 'Số điện thoại',
  `role_id` int(11) NOT NULL COMMENT 'ID vai trò (1=User, 2=Manager, 3=Admin)',
  `status` enum('active','locked') DEFAULT 'active' COMMENT 'Trạng thái tài khoản',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Ngày tạo tài khoản'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_station_id` (`station_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `promo_id` (`promo_id`);

--
-- Chỉ mục cho bảng `charging_sessions`
--
ALTER TABLE `charging_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD UNIQUE KEY `booking_id` (`booking_id`),
  ADD KEY `idx_booking_id` (`booking_id`);

--
-- Chỉ mục cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`user_id`,`station_id`),
  ADD KEY `station_id` (`station_id`);

--
-- Chỉ mục cho bảng `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `idx_station_id` (`station_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `booking_id` (`booking_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- Chỉ mục cho bảng `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`promo_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_status` (`status`);

--
-- Chỉ mục cho bảng `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `idx_station_id` (`station_id`),
  ADD KEY `idx_reporter_id` (`reporter_id`),
  ADD KEY `idx_status` (`status`);

--
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Chỉ mục cho bảng `stations`
--
ALTER TABLE `stations`
  ADD PRIMARY KEY (`station_id`),
  ADD KEY `idx_manager_id` (`manager_id`),
  ADD KEY `idx_station_type` (`station_type`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role_id` (`role_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID đặt lịch';

--
-- AUTO_INCREMENT cho bảng `charging_sessions`
--
ALTER TABLE `charging_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID phiên sạc';

--
-- AUTO_INCREMENT cho bảng `feedbacks`
--
ALTER TABLE `feedbacks`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID đánh giá';

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID thông báo';

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID thanh toán';

--
-- AUTO_INCREMENT cho bảng `promotions`
--
ALTER TABLE `promotions`
  MODIFY `promo_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID mã giảm giá';

--
-- AUTO_INCREMENT cho bảng `reports`
--
ALTER TABLE `reports`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID báo cáo';

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `stations`
--
ALTER TABLE `stations`
  MODIFY `station_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID trạm';

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID người dùng';

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`),
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`promo_id`) REFERENCES `promotions` (`promo_id`);

--
-- Các ràng buộc cho bảng `charging_sessions`
--
ALTER TABLE `charging_sessions`
  ADD CONSTRAINT `charging_sessions_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `feedbacks_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`),
  ADD CONSTRAINT `feedbacks_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`);

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`),
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `stations`
--
ALTER TABLE `stations`
  ADD CONSTRAINT `stations_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
