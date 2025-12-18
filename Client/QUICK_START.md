# Quick Start Guide

## Bước 1: Cài đặt

```bash
cd ev-charging-station
npm install
```

## Bước 2: Cấu hình

Tạo file `.env`:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

## Bước 3: Chạy Development

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:5173

## Bước 4: Build Production

```bash
npm run build
npm run preview
```

## Cấu trúc Routes

- `/auth/login` - Đăng nhập/Đăng ký
- `/stations/map` - Bản đồ trạm sạc
- `/stations/:id` - Chi tiết trạm
- `/bookings/create?station_id=:id` - Đặt lịch
- `/bookings/:id/charging` - Trạng thái sạc
- `/bookings/:id/payment` - Thanh toán
- `/bookings/history` - Lịch sử
- `/user/feedbacks-favorites` - Đánh giá & Yêu thích

## Tính năng chính

### 1. Authentication
- Đăng nhập với email/password
- Đăng ký tài khoản mới
- Token được lưu trong localStorage

### 2. Tìm trạm sạc
- Filter theo loại trạm, giá, khoảng cách
- Xem chi tiết trạm
- Lưu trạm yêu thích

### 3. Đặt lịch sạc
- Chọn loại xe (xe máy USB/CCS, ô tô CCS)
- Chọn thời gian
- Áp dụng mã giảm giá
- Tính giá tự động

### 4. Theo dõi sạc
- Realtime update mỗi 5 giây
- Hiển thị % pin, kWh, tiền
- Progress bar trực quan

### 5. Thanh toán
- Mô phỏng QR Code
- Chuyển khoản ngân hàng
- Chi tiết hóa đơn

### 6. Lịch sử & Đánh giá
- Xem lịch sử sạc
- Filter theo ngày, trạm, trạng thái
- Gửi đánh giá cho trạm
- Quản lý trạm yêu thích

## API Backend cần thiết

Backend cần implement các endpoints trong file `API_DOCUMENTATION.md`

Các endpoint chính:
- Auth: `/api/auth/login`, `/api/auth/register`
- Stations: `/api/stations`, `/api/stations/:id`
- Bookings: `/api/bookings`, `/api/bookings/:id`
- Payments: `/api/payments`
- Feedbacks: `/api/feedbacks`
- Favorites: `/api/favorites`

## Database Schema

Xem file `DATABASE_SCHEMA.md` để tạo database

## Lưu ý

1. **Mock Data**: Nếu chưa có backend, có thể dùng JSON Server hoặc mock API
2. **Google Maps**: Cần API key để tích hợp bản đồ thực
3. **Payment**: Hiện tại là mô phỏng, cần tích hợp gateway thực tế
4. **Realtime**: Sử dụng setInterval, có thể thay bằng WebSocket

## Troubleshooting

### Port đã được sử dụng
```bash
# Thay đổi port trong vite.config.ts
server: {
  port: 3001
}
```

### CORS Error
Backend cần enable CORS:
```javascript
app.use(cors({
  origin: 'http://localhost:5173'
}));
```

### Token expired
Xóa localStorage và đăng nhập lại:
```javascript
localStorage.clear();
```

## Tech Stack

- React 19
- TypeScript
- React Router DOM v6
- Axios
- Vite
- CSS-in-JS (inline styles)

## Next Steps

1. Tích hợp Google Maps API
2. Thêm WebSocket cho realtime updates
3. Tích hợp payment gateway thực tế
4. Thêm unit tests
5. Responsive design cho mobile
6. PWA support
7. Internationalization (i18n)
