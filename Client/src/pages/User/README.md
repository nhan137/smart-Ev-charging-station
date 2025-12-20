# User Pages

Thư mục này chứa các trang dành cho **User** (role_id = 1)

## Các trang hiện có:

### Main:
- `Home.tsx` - Trang chủ

### Stations:
- `Stations/StationMap.tsx` - Bản đồ trạm sạc
- `Stations/StationList.tsx` - Danh sách trạm sạc
- `Stations/StationDetail.tsx` - Chi tiết trạm sạc

### Bookings:
- `Bookings/CreateBooking.tsx` - Tạo booking
- `Bookings/ChargingStatus.tsx` - Trạng thái sạc
- `Bookings/Payment.tsx` - Thanh toán
- `Bookings/ChargingAndPayment.tsx` - Lịch sử sạc & thanh toán
- `Bookings/BookingHistory.tsx` - Lịch sử booking

### User Profile:
- `FeedbacksAndFavorites.tsx` - Quản lý đánh giá và trạm yêu thích

## Quyền truy cập:
- User có thể xem và đặt lịch tại các trạm sạc
- User có thể quản lý booking của mình
- User có thể đánh giá và lưu trạm yêu thích

## Layout:
- Sử dụng `PublicLayout.tsx` với header navigation
- Route prefix: `/`
