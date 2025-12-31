# Smart EV Charging Station

Hệ thống quản lý trạm sạc xe điện với **ba vai trò chính**:

- **User** – Đặt lịch sạc, thanh toán, xem lịch sử sạc/thanh toán, đánh giá trạm, quản lý trạm yêu thích, nhận thông báo.
- **Manager** – Quản lý các trạm thuộc quyền quản lý (dashboard, danh sách trạm & booking), xử lý báo cáo sự cố/bảo trì từ user, gửi báo cáo/bảo trì lên Admin.
- **Admin** – Quản trị toàn hệ thống: user, trạm, booking, thanh toán, dashboard tổng quan, gửi thông báo hệ thống, xử lý báo cáo từ Manager.

## Yêu cầu hệ thống

- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **npm** >= 9.x hoặc **yarn**
- **Git**

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/nhan137/smart-Ev-charging-station.git
cd smart-Ev-charging-station
```

### 2. Cài đặt Backend (Server)

```bash
cd server
npm install
```

### 3. Cài đặt Frontend (Client)

```bash
cd ../Client
npm install
```

### 4. Cấu hình Database

1. Tạo database MySQL:
```sql
CREATE DATABASE smartchargingstation_mvp;
```

2. Import file SQL:
```bash
# Từ thư mục server/
mysql -u root -p smartchargingstation_mvp < smartchargingstation_mvp.sql
```

### 5. Cấu hình môi trường

#### Backend (.env trong thư mục `server/`)

Tạo file `.env` trong thư mục `server/` với nội dung:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smartchargingstation_mvp

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# VNPay (nếu sử dụng thanh toán thực)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-return

# Email (nếu sử dụng gửi email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

#### Frontend (.env trong thư mục `Client/`)

Tạo file `.env` trong thư mục `Client/` với nội dung:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Chạy ứng dụng

### 1. Chạy Backend Server

```bash
cd server
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

### 2. Chạy Frontend Client

Mở terminal mới:

```bash
cd Client
npm run dev
```

Client sẽ chạy tại: `http://localhost:5173`

### 3. Chạy IoT Simulator (Tùy chọn)

Để mô phỏng quá trình sạc realtime:

```bash
cd server
npm run iot-simulator
# Hoặc với tham số:
# node iot_simulator.js <BOOKING_ID> <START_BATTERY_PERCENT>
```

## Tech Stack & Tools

### Backend (Server)

**Core:**
- **Node.js** - Runtime environment
- **Express.js** (^4.18.2) - Web framework
- **MySQL** - Database
- **Sequelize** (^6.35.2) - ORM cho MySQL

**Authentication & Security:**
- **jsonwebtoken** (^9.0.2) - JWT authentication
- **bcryptjs** (^2.4.3) - Password hashing
- **cors** (^2.8.5) - Cross-origin resource sharing

**Real-time:**
- **socket.io** (^4.7.2) - WebSocket cho realtime charging updates
- **socket.io-client** (^4.7.2) - Client cho testing

**Validation & File Upload:**
- **express-validator** (^7.0.1) - Request validation
- **multer** (^2.0.2) - File upload handling

**Payment:**
- **qs** (^6.14.0) - Query string parsing cho VNPay

**Utilities:**
- **dotenv** (^16.3.1) - Environment variables
- **axios** (^1.6.2) - HTTP client
- **nodemailer** (^7.0.11) - Email service

**Development:**
- **nodemon** (^3.0.2) - Auto-restart server khi code thay đổi

### Frontend (Client)

**Core:**
- **React** (^19.1.1) - UI framework
- **TypeScript** (~5.9.3) - Type safety
- **Vite** (^7.1.7) - Build tool & dev server

**Routing:**
- **react-router-dom** (^7.9.5) - Client-side routing

**HTTP & Real-time:**
- **axios** (^1.13.2) - API calls
- **socket.io-client** (^4.8.1) - WebSocket client

**UI & Visualization:**
- **lucide-react** (^0.553.0) - Icons
- **recharts** (^3.4.1) - Charts & graphs
- **@react-google-maps/api** (^2.20.7) - Google Maps integration

**Development:**
- **eslint** (^9.36.0) - Code linting
- **typescript-eslint** (^8.45.0) - TypeScript ESLint
- **@vitejs/plugin-react** (^5.0.4) - Vite React plugin

## Cấu trúc thư mục

### Backend (`server/`)

```
server/
├── config/              # Cấu hình database
│   └── database.js
├── controllers/         # Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── stationController.js
│   ├── bookingController.js
│   ├── paymentController.js
│   ├── chargingController.js
│   ├── feedbackController.js
│   ├── favoriteController.js
│   ├── userNotificationController.js
│   ├── managerStationController.js
│   ├── managerBookingController.js
│   ├── managerDashboardController.js
│   ├── adminUserController.js
│   ├── adminStationController.js
│   ├── adminBookingController.js
│   ├── adminPaymentController.js
│   ├── adminDashboardController.js
│   ├── adminNotificationController.js
│   └── reportController.js
├── middleware/          # Middleware
│   ├── auth.js         # JWT authentication & authorization
│   ├── validation.js   # Request validation
│   └── errorHandler.js # Error handling
├── models/             # Sequelize models
│   ├── User.js
│   ├── Station.js
│   ├── Booking.js
│   ├── ChargingSession.js
│   ├── Payment.js
│   ├── Promotion.js
│   ├── Feedback.js
│   ├── Favorite.js
│   ├── Notification.js
│   └── Role.js
├── routes/             # API routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── stationRoutes.js
│   ├── bookingRoutes.js
│   ├── paymentRoutes.js
│   ├── favoriteRoutes.js
│   ├── feedbackRoutes.js
│   ├── notificationRoutes.js
│   ├── reportRoutes.js
│   ├── managerRoutes.js
│   └── adminRoutes.js
├── utils/              # Utilities
│   ├── vnpay.js        # VNPay integration
│   ├── emailService.js # Email service
│   ├── helpers.js      # Helper functions
│   └── chargingMonitor.js
├── uploads/            # Uploaded files
│   ├── stations/       # Station images
│   └── reports/        # Report images
├── iot_simulator.js    # IoT simulator cho realtime charging
├── index.js            # Server entry point
├── smartchargingstation_mvp.sql  # Database schema
└── package.json
```

### Frontend (`Client/`)

```
Client/
├── src/
│   ├── pages/          # Page components
│   │   ├── Auth/       # Login, Register
│   │   ├── User/       # User pages
│   │   │   ├── Stations/
│   │   │   ├── Bookings/
│   │   │   ├── FeedbacksAndFavorites.tsx
│   │   │   └── Reports/
│   │   ├── Manager/    # Manager panel
│   │   └── Admin/      # Admin panel
│   ├── components/     # Shared components
│   │   └── shared/
│   ├── services/       # API services
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── stationService.ts
│   │   ├── bookingService.ts
│   │   ├── paymentService.ts
│   │   ├── feedbackService.ts
│   │   ├── favoriteService.ts
│   │   ├── managerService.ts
│   │   ├── adminService.ts
│   │   └── socketService.ts
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities
│   ├── App.tsx         # Main app
│   └── main.tsx        # Entry point
├── public/             # Static files
└── package.json
```

## Luồng chính

### User

1. Đăng nhập (`POST /api/auth/login`)
2. Xem danh sách trạm, lọc theo loại/trạng thái (`GET /api/stations`)
3. Đặt lịch sạc (`POST /api/bookings`), theo dõi trạng thái sạc realtime qua Socket.IO
4. Thanh toán (VNPay) qua `/api/payments/*`, lịch sử sạc & thanh toán gộp trong `GET /api/bookings/my`
5. Quản lý trạm yêu thích (`/api/favorites/*`), gửi feedback (`/api/feedbacks`), nhận & đọc thông báo (`/api/notifications/*`)
6. Gửi báo cáo sự cố/bảo trì cho **Manager trạm** qua `POST /api/reports`

### Manager

1. Dashboard tổng quan (`GET /api/manager/dashboard`)
2. Quản lý trạm (`/api/manager/stations/*`) và booking (`/api/manager/stations/:id/bookings`, confirm/cancel booking)
3. Nhận báo cáo từ User (qua notification + `reports`), xử lý được thì `resolve`, không được thì `escalate` lên Admin:
   - `PUT /api/reports/:report_id/manager/resolve`
   - `PUT /api/reports/:report_id/manager/escalate`
4. Gửi báo cáo/bảo trì trực tiếp lên Admin qua `POST /api/reports` (role Manager)

### Admin

1. Quản lý User & Station (`/api/admin/users`, `/api/admin/stations`)
2. Quản lý Booking (`/api/admin/bookings/*`) và Payment (`/api/admin/payments/*`, export CSV)
3. Dashboard tổng quan (`/api/admin/dashboard/*`) – overview, highlights, charts, recent activities
4. Gửi thông báo hệ thống cho user/manager (`/api/admin/notifications/*`)
5. Nhận & xử lý báo cáo từ Manager:
   - Xem danh sách: `GET /api/reports/admin`
   - Cập nhật trạng thái: `PUT /api/reports/:report_id/status`

## Scripts

### Backend

```bash
npm start          # Chạy production server
npm run dev        # Chạy development server với nodemon
npm run iot-simulator  # Chạy IoT simulator
npm run test-socket    # Test Socket.IO connection
```

### Frontend

```bash
npm run dev        # Chạy development server
npm run build      # Build production
npm run preview    # Preview production build
npm run lint       # Lint code
```

## API Documentation

Chi tiết API endpoints xem trong:
- `server/API_DOCUMENTATION.md`
- `server/API_ENDPOINTS_BY_FEATURE.md`
- `server/API_ENDPOINTS_FOR_REACT_FE.md`

## Test Guides

Trong thư mục `server/` có các file hướng dẫn test:
- `TEST_MANAGER_DASHBOARD_OVERVIEW.md`
- `REALTIME_CHARGING_GUIDE.md`
- `VERIFY_REALTIME_SYSTEM.md`
- `AUTH_EXPLANATION.md`

## Lưu ý

- Đảm bảo MySQL đang chạy trước khi start server
- File `.env` phải được cấu hình đúng với thông tin database của bạn
- Port 3000 (backend) và 5173 (frontend) phải không bị chiếm dụng
- IoT Simulator cần booking_id hợp lệ trong database với status "confirmed" hoặc "charging"
- VNPay integration cần cấu hình đúng thông tin merchant (nếu sử dụng thanh toán thực)
