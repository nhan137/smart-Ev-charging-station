const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'reports');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .toLowerCase();
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({ storage });

// POST /api/reports - User/Manager gửi báo cáo sự cố (hỗ trợ tối đa 5 ảnh)
router.post('/', authenticate, upload.array('images', 5), reportController.createReport);

// GET /api/reports/my - User xem lịch sử báo cáo sự cố của mình
router.get('/my', authenticate, authorize('user'), reportController.getMyReports);

// GET /api/reports/admin - Admin xem danh sách báo cáo do Manager gửi (PHẢI ĐẶT TRƯỚC /:report_id)
router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  reportController.getReportsForAdmin
);

// GET /api/reports/:report_id - User xem chi tiết 1 báo cáo của mình
router.get('/:report_id', authenticate, authorize('user'), reportController.getUserReportDetail);

// PUT /api/reports/:report_id/manager/resolve - Manager xử lý xong báo cáo từ User
router.put(
  '/:report_id/manager/resolve',
  authenticate,
  authorize('manager'),
  reportController.managerResolveReport
);

// PUT /api/reports/:report_id/manager/escalate - Manager chuyển báo cáo User lên Admin
router.put(
  '/:report_id/manager/escalate',
  authenticate,
  authorize('manager'),
  reportController.managerEscalateReport
);

// GET /api/reports/manager/inbox - Manager xem hộp thư báo cáo từ User
router.get(
  '/manager/inbox',
  authenticate,
  authorize('manager'),
  reportController.getManagerInbox
);

// GET /api/reports/manager/history - Manager xem lịch sử báo cáo đã gửi lên Admin
router.get(
  '/manager/history',
  authenticate,
  authorize('manager'),
  reportController.getManagerHistory
);

// PUT /api/reports/:report_id/status - Admin phê duyệt / đánh dấu đã xử lý báo cáo của Manager
router.put(
  '/:report_id/status',
  authenticate,
  authorize('admin'),
  reportController.updateReportStatus
);

module.exports = router;