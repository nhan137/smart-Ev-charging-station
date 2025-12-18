# Database Schema

## Tables Overview

1. users - Người dùng
2. roles - Vai trò
3. stations - Trạm sạc
4. bookings - Đặt lịch sạc
5. charging_sessions - Phiên sạc
6. payments - Thanh toán
7. feedbacks - Đánh giá
8. promotions - Mã giảm giá
9. favorites - Trạm yêu thích

---

## 1. users
```sql
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- bcrypt hashed
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(255),
  role_id INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);
```

## 2. roles
```sql
CREATE TABLE roles (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL,
  description TEXT
);

-- Data
INSERT INTO roles (role_id, role_name, description) VALUES 
(1, 'User', 'Người dùng thông thường'),
(2, 'Manager', 'Quản lý trạm sạc'),
(3, 'Admin', 'Quản trị viên hệ thống');
```

## 3. stations
```sql
CREATE TABLE stations (
  station_id INT PRIMARY KEY AUTO_INCREMENT,
  station_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  station_type ENUM('xe_may', 'oto', 'ca_hai') NOT NULL,
  price_per_kwh DECIMAL(10, 2) NOT NULL,
  charging_power DECIMAL(10, 2) NOT NULL, -- kW
  connector_types VARCHAR(255) NOT NULL, -- USB-C, CCS, etc.
  opening_hours VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  available_slots INT NOT NULL,
  total_slots INT NOT NULL,
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 4. bookings
```sql
CREATE TABLE bookings (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  station_id INT NOT NULL,
  vehicle_type ENUM('xe_may_usb', 'xe_may_ccs', 'oto_ccs') NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  actual_start DATETIME,
  actual_end DATETIME,
  total_cost DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'charging', 'completed', 'cancelled') DEFAULT 'pending',
  promotion_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (station_id) REFERENCES stations(station_id)
);
```

## 5. charging_sessions
```sql
CREATE TABLE charging_sessions (
  session_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  start_battery_percent INT NOT NULL,
  end_battery_percent INT NOT NULL,
  energy_consumed DECIMAL(10, 2) NOT NULL, -- kWh
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);
```

## 6. payments
```sql
CREATE TABLE payments (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  method ENUM('QR', 'Bank') NOT NULL,
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);
```

## 7. feedbacks
```sql
CREATE TABLE feedbacks (
  feedback_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  station_id INT NOT NULL,
  booking_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (station_id) REFERENCES stations(station_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);
```

## 8. promotions
```sql
CREATE TABLE promotions (
  promotion_id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent INT NOT NULL,
  max_discount DECIMAL(10, 2) NOT NULL,
  min_amount DECIMAL(10, 2) NOT NULL,
  valid_from DATETIME NOT NULL,
  valid_to DATETIME NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 9. favorites
```sql
CREATE TABLE favorites (
  favorite_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  station_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (station_id) REFERENCES stations(station_id),
  UNIQUE KEY unique_favorite (user_id, station_id)
);
```

---

## Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);

-- Stations
CREATE INDEX idx_stations_type ON stations(station_type);
CREATE INDEX idx_stations_status ON stations(status);
CREATE INDEX idx_stations_location ON stations(latitude, longitude);

-- Bookings
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_station ON bookings(station_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);

-- Feedbacks
CREATE INDEX idx_feedbacks_station ON feedbacks(station_id);
CREATE INDEX idx_feedbacks_user ON feedbacks(user_id);

-- Favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
```

---

## Sample Data

### Stations
```sql
INSERT INTO stations (station_name, address, latitude, longitude, station_type, price_per_kwh, charging_power, connector_types, opening_hours, contact_phone, available_slots, total_slots, status, avatar_url) VALUES
('Trạm sạc Quận 1', '123 Nguyễn Huệ, Q1, TP.HCM', 10.762622, 106.660172, 'ca_hai', 5000, 50, 'USB-C, CCS', '24/7', '0901234567', 5, 10, 'active', 'https://example.com/station1.jpg'),
('Trạm sạc Quận 3', '456 Võ Văn Tần, Q3, TP.HCM', 10.782622, 106.690172, 'xe_may', 4000, 20, 'USB-C', '06:00-22:00', '0901234568', 8, 10, 'active', 'https://example.com/station2.jpg');
```

### Promotions
```sql
INSERT INTO promotions (code, discount_percent, max_discount, min_amount, valid_from, valid_to, status) VALUES
('SUMMER10', 10, 5000, 10000, '2025-11-01', '2025-12-31', 'active'),
('NEWUSER20', 20, 10000, 20000, '2025-11-01', '2025-12-31', 'active');
```

---

## Relationships

```
users (1) ----< (N) bookings
users (1) ----< (N) feedbacks
users (1) ----< (N) favorites

stations (1) ----< (N) bookings
stations (1) ----< (N) feedbacks
stations (1) ----< (N) favorites

bookings (1) ----< (1) charging_sessions
bookings (1) ----< (1) payments
bookings (1) ----< (N) feedbacks

roles (1) ----< (N) users
```
