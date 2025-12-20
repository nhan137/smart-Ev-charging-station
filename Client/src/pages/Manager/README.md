# Manager Pages

Thư mục này chứa các trang dành cho **Manager** (role_id = 2)

## Các trang hiện có:

- `Dashboard.tsx` - Dashboard tổng quan cho manager
- `StationList.tsx` - Danh sách trạm sạc quản lý
- `StationDetail.tsx` - Chi tiết trạm sạc
- `StationBookings.tsx` - Quản lý booking tại trạm
- `UpdateStationStatus.tsx` - Cập nhật trạng thái trạm
- `Reports.tsx` - Báo cáo

## Quyền truy cập:
- Manager quản lý các trạm sạc được phân công
- Manager xem và xử lý booking tại trạm của mình
- Manager cập nhật trạng thái trạm (active/maintenance/inactive)
- Manager xem báo cáo về trạm của mình

## Layout:
- Sử dụng `ManagerLayout.tsx` với sidebar navigation
- Route prefix: `/manager/*`
