-- =============================================
-- SEED DATA FOR EV CHARGING STATION
-- =============================================

-- 1. ROLES
INSERT INTO roles (role_id, role_name, description) VALUES 
(1, 'User', 'Người dùng thông thường'),
(2, 'Manager', 'Quản lý trạm sạc'),
(3, 'Admin', 'Quản trị viên hệ thống');

-- 2. TEST ACCOUNTS
-- Password cho tất cả: 123456
-- (Trong thực tế cần hash bằng bcrypt)
INSERT INTO users (email, password, full_name, phone, role_id) VALUES 
('user@test.com', '$2b$10$rKvVLZ5fHKlQxJ5L5L5L5eK5L5L5L5L5L5L5L5L5L5L5L5L5L5L5L', 'Nguyễn Văn User', '0901111111', 1),
('manager@test.com', '$2b$10$rKvVLZ5fHKlQxJ5L5L5L5eK5L5L5L5L5L5L5L5L5L5L5L5L5L5L5L', 'Trần Thị Manager', '0902222222', 2),
('admin@test.com', '$2b$10$rKvVLZ5fHKlQxJ5L5L5L5eK5L5L5L5L5L5L5L5L5L5L5L5L5L5L5L', 'Lê Văn Admin', '0903333333', 3);

-- 3. STATIONS
INSERT INTO stations (station_name, address, latitude, longitude, station_type, price_per_kwh, charging_power, connector_types, opening_hours, contact_phone, available_slots, total_slots, status, avatar_url) VALUES
('Trạm Sạc Quận 1', '123 Nguyễn Huệ, Quận 1, TP.HCM', 10.762622, 106.660172, 'ca_hai', 5000, 50, 'USB-C, CCS', '24/7', '0901234567', 8, 10, 'active', 'https://picsum.photos/400/300?random=1'),
('Trạm Sạc Quận 3', '456 Võ Văn Tần, Quận 3, TP.HCM', 10.782622, 106.690172, 'xe_may', 4000, 20, 'USB-C', '06:00-22:00', '0901234568', 5, 8, 'active', 'https://picsum.photos/400/300?random=2'),
('Trạm Sạc Bình Thạnh', '789 Điện Biên Phủ, Bình Thạnh, TP.HCM', 10.802622, 106.710172, 'oto', 6000, 100, 'CCS, CHAdeMO', '24/7', '0901234569', 3, 5, 'active', 'https://picsum.photos/400/300?random=3'),
('Trạm Sạc Phú Nhuận', '321 Phan Đăng Lưu, Phú Nhuận, TP.HCM', 10.792622, 106.680172, 'ca_hai', 4500, 60, 'USB-C, CCS', '07:00-23:00', '0901234570', 6, 10, 'active', 'https://picsum.photos/400/300?random=4'),
('Trạm Sạc Tân Bình', '555 Cộng Hòa, Tân Bình, TP.HCM', 10.812622, 106.650172, 'xe_may', 3500, 15, 'USB-C', '24/7', '0901234571', 10, 12, 'active', 'https://picsum.photos/400/300?random=5');

-- 4. PROMOTIONS
INSERT INTO promotions (code, discount_percent, max_discount, min_amount, valid_from, valid_to, status) VALUES
('SUMMER10', 10, 50000, 100000, '2025-11-01 00:00:00', '2025-12-31 23:59:59', 'active'),
('NEWUSER20', 20, 100000, 200000, '2025-11-01 00:00:00', '2025-12-31 23:59:59', 'active'),
('FLASH50', 50, 200000, 300000, '2025-11-01 00:00:00', '2025-11-15 23:59:59', 'active');

-- 5. SAMPLE BOOKINGS (cho user@test.com)
INSERT INTO bookings (user_id, station_id, vehicle_type, start_time, end_time, actual_start, actual_end, total_cost, status, promotion_code) VALUES
(1, 1, 'xe_may_usb', '2025-11-10 08:00:00', '2025-11-10 10:00:00', '2025-11-10 08:05:00', '2025-11-10 09:45:00', 180000, 'completed', 'SUMMER10'),
(1, 2, 'xe_may_ccs', '2025-11-09 14:00:00', '2025-11-09 16:00:00', '2025-11-09 14:10:00', '2025-11-09 15:50:00', 160000, 'completed', NULL),
(1, 3, 'oto_ccs', '2025-11-08 10:00:00', '2025-11-08 12:00:00', '2025-11-08 10:15:00', '2025-11-08 11:45:00', 540000, 'completed', NULL);

-- 6. CHARGING SESSIONS
INSERT INTO charging_sessions (booking_id, start_battery_percent, end_battery_percent, energy_consumed) VALUES
(1, 20, 85, 3.6),
(2, 15, 80, 3.2),
(3, 10, 90, 9.0);

-- 7. PAYMENTS
INSERT INTO payments (booking_id, amount, method, status, transaction_id) VALUES
(1, 180000, 'QR', 'success', 'TXN20251110001'),
(2, 160000, 'Bank', 'success', 'TXN20251109001'),
(3, 540000, 'QR', 'success', 'TXN20251108001');

-- 8. FEEDBACKS
INSERT INTO feedbacks (user_id, station_id, booking_id, rating, comment) VALUES
(1, 1, 1, 5, 'Trạm sạc rất tốt, nhân viên nhiệt tình, sạc nhanh!'),
(1, 2, 2, 4, 'Trạm ok, nhưng hơi đông người vào giờ cao điểm'),
(1, 3, 3, 5, 'Trạm hiện đại, sạch sẽ, giá hợp lý');

-- 9. FAVORITES
INSERT INTO favorites (user_id, station_id) VALUES
(1, 1),
(1, 3);
