// controllers/reportController.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartchargingstation_mvp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// POST /api/reports
// User -> gửi báo cáo cho Manager trạm
// Manager -> gửi báo cáo (bảo trì / escalate) cho Admin + (optional) broadcast tới Users
exports.createReport = async (req, res, next) => {
  const { station_id, title, description, summary } = req.body;
  let { user_ids } = req.body; // danh sách user muốn gửi (optional)
  const reporterId = req.user?.user_id;
  const reporterRoleId = req.user?.role_id;

  // parse user_ids nếu FE gửi dạng JSON string
  if (typeof user_ids === 'string') {
    try {
      user_ids = JSON.parse(user_ids);
    } catch (e) {
      user_ids = [];
    }
  }
  if (!Array.isArray(user_ids)) user_ids = [];

  if (!station_id || !title || !description) {
    return res.status(400).json({
      success: false,
      message: 'station_id, title và description là bắt buộc'
    });
  }
  if (!reporterId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Gộp tóm tắt + mô tả chi tiết (nếu FE gửi 2 trường riêng)
  const finalDescription =
    summary && summary.trim()
      ? `${summary.trim()}\n\n${description.trim()}`
      : description.trim();

  // Xử lý multiple images (tối đa 5 ảnh)
  let imageUrl = null;
  if (req.files && req.files.length > 0) {
    const imagePaths = req.files.map(file => `/uploads/reports/${file.filename}`);
    // Lưu dưới dạng JSON array string
    imageUrl = JSON.stringify(imagePaths);
  } else if (req.file) {
    // Fallback: nếu FE vẫn gửi single file
    imageUrl = `/uploads/reports/${req.file.filename}`;
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Lấy thông tin trạm + reporter
    const [[station]] = await conn.query(
      'SELECT station_name, manager_id FROM stations WHERE station_id = ?',
      [station_id]
    );
    if (!station) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Station not found' });
    }
    const [[reporter]] = await conn.query(
      'SELECT full_name, role_id FROM users WHERE user_id = ?',
      [reporterId]
    );
    const reporterName = reporter ? reporter.full_name : 'Người dùng';
    const stationName = station.station_name;

    // Insert report
    await conn.query(
      `INSERT INTO reports
       (station_id, reporter_id, title, description, image_url, status, reported_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [station_id, reporterId, title, finalDescription, imageUrl]
    );

    const notifValues = [];

    // FLOW 1: USER -> MANAGER TRẠM
    if (reporterRoleId === 1) {
      const managerId = station.manager_id;
      if (managerId) {
        const notifTitle = 'Báo cáo sự cố mới từ khách hàng';
        const notifMessage = `Khách hàng ${reporterName} vừa báo cáo sự cố tại trạm ${stationName}.`;

        notifValues.push([
          managerId,
          notifTitle,
          notifMessage,
          'system',
          'unread',
          new Date()
        ]);
      }
    }

    // FLOW 2: MANAGER -> ADMIN (+ optional broadcast cho Users)
    if (reporterRoleId === 2) {
      const notifTitle = 'Báo cáo sự cố mới từ Quản lý trạm';
      const adminMessage = `Quản lý ${reporterName} vừa báo cáo/bảo trì tại trạm ${stationName}.`;

      // 2.1 Gửi cho tất cả Admin (role_id = 3)
      const [admins] = await conn.query(
        `SELECT user_id
         FROM users
         WHERE role_id = 3 AND status = 'active'`
      );

      admins.forEach((admin) => {
        notifValues.push([
          admin.user_id,
          notifTitle,
          adminMessage,
          'system',
          'unread',
          new Date()
        ]);
      });

      // 2.2 Gửi cho các User (role 1) đã từng đặt lịch / sạc tại trạm này và được chọn (broadcast bảo trì)
      if (user_ids.length > 0) {
        const [eligibleUsers] = await conn.query(
          `SELECT DISTINCT u.user_id
           FROM users u
           JOIN bookings b ON u.user_id = b.user_id
           WHERE u.role_id = 1
             AND b.station_id = ?
             AND u.user_id IN (?)`,
          [station_id, user_ids]
        );

        const userMessage =
          `Trạm ${stationName} đang có báo cáo sự cố / bảo trì. ` +
          `Vui lòng kiểm tra trước khi đặt lịch sạc.`;

        eligibleUsers.forEach((u) => {
          notifValues.push([
            u.user_id,
            notifTitle,
            userMessage,
            'system',
            'unread',
            new Date()
          ]);
        });
      }
    }

    // Insert tất cả notification (Manager / Admin / Users đủ điều kiện)
    if (notifValues.length > 0) {
      await conn.query(
        `INSERT INTO notifications
         (user_id, title, message, type, status, created_at)
         VALUES ?`,
        [notifValues]
      );
      // Mỗi phần tử trong notifValues = 1 hàng => mỗi manager/admin/user nhận 1 notification riêng
    }

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: 'Report sent successfully'
    });
  } catch (err) {
    if (conn) await conn.rollback();
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};

// PUT /api/reports/:report_id/manager/resolve
// Manager xử lý xong báo cáo của User -> đổi status + notify User
exports.managerResolveReport = async (req, res, next) => {
  const { report_id } = req.params;
  const managerId = req.user?.user_id;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Lấy report + kiểm tra:
    // - Report do USER tạo (role_id = 1)
    // - Thuộc trạm mà manager hiện tại quản lý
    const [rows] = await conn.query(
      `SELECT r.report_id,
              r.station_id,
              r.reporter_id,
              r.status,
              s.station_name,
              s.manager_id,
              u.full_name AS reporter_name,
              u.role_id   AS reporter_role_id
       FROM reports r
       JOIN stations s ON r.station_id = s.station_id
       JOIN users u ON r.reporter_id = u.user_id
       WHERE r.report_id = ?`,
      [report_id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const report = rows[0];

    if (report.manager_id !== managerId) {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xử lý báo cáo của trạm này'
      });
    }

    if (report.reporter_role_id !== 1) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ xử lý báo cáo từ User bằng API này'
      });
    }

    if (report.status === 'resolved') {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Báo cáo đã được đánh dấu xử lý trước đó'
      });
    }

    await conn.query('UPDATE reports SET status = ? WHERE report_id = ?', [
      'resolved',
      report_id
    ]);

    // Notify User
    const notifTitle = 'Báo cáo sự cố đã được Quản lý xử lý';
    const notifMessage = `Báo cáo của bạn tại trạm ${report.station_name} đã được Quản lý xử lý.`;

    await conn.query(
      `INSERT INTO notifications
       (user_id, title, message, type, status, created_at)
       VALUES (?, ?, ?, 'system', 'unread', NOW())`,
      [report.reporter_id, notifTitle, notifMessage]
    );

    await conn.commit();

    return res.json({
      success: true,
      message: 'Đã đánh dấu báo cáo là đã xử lý và gửi thông báo cho User'
    });
  } catch (err) {
    if (conn) await conn.rollback();
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};

// PUT /api/reports/:report_id/manager/escalate
// Manager không xử lý được -> chuyển báo cáo User lên Admin
exports.managerEscalateReport = async (req, res, next) => {
  const { report_id } = req.params;
  const managerId = req.user?.user_id;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT r.report_id,
              r.station_id,
              r.reporter_id,
              r.title,
              r.description,
              r.image_url,
              r.status,
              s.station_name,
              s.manager_id,
              u.full_name AS reporter_name,
              u.role_id   AS reporter_role_id
       FROM reports r
       JOIN stations s ON r.station_id = s.station_id
       JOIN users u ON r.reporter_id = u.user_id
       WHERE r.report_id = ?`,
      [report_id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const report = rows[0];

    if (report.manager_id !== managerId) {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xử lý báo cáo của trạm này'
      });
    }

    if (report.reporter_role_id !== 1) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Chỉ chuyển tiếp báo cáo từ User bằng API này'
      });
    }

    // 1) Cập nhật trạng thái hiện tại (optional: vẫn để pending, nên chỉ đổi nếu bạn muốn)
    // await conn.query('UPDATE reports SET status = ? WHERE report_id = ?', [
    //   'pending',
    //   report_id
    // ]);

    // 2) Notify User: báo cáo đã được chuyển cho Admin
    const notifTitleUser = 'Báo cáo đã được chuyển cho Admin';
    const notifMessageUser = `Báo cáo của bạn tại trạm ${report.station_name} đã được Quản lý trạm chuyển cho Admin để xử lý thêm.`;

    await conn.query(
      `INSERT INTO notifications
       (user_id, title, message, type, status, created_at)
       VALUES (?, ?, ?, 'system', 'unread', NOW())`,
      [report.reporter_id, notifTitleUser, notifMessageUser]
    );

    // 3) Tạo report mới do Manager gửi lên Admin
    const [insertResult] = await conn.query(
      `INSERT INTO reports
       (station_id, reporter_id, title, description, image_url, status, reported_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        report.station_id,
        managerId,
        report.title,
        report.description,
        report.image_url
      ]
    );

    const newReportId = insertResult.insertId;

    // 4) Notify tất cả Admin về báo cáo mới (giống logic createReport của Manager)
    const [admins] = await conn.query(
      `SELECT user_id
       FROM users
       WHERE role_id = 3 AND status = 'active'`
    );

    const notifTitleAdmin = 'Báo cáo sự cố mới từ Quản lý trạm';
    const notifMessageAdmin = `Quản lý trạm đã chuyển tiếp báo cáo từ khách hàng tại trạm ${report.station_name}.`;

    const notifValues = admins.map((admin) => [
      admin.user_id,
      notifTitleAdmin,
      notifMessageAdmin,
      'system',
      'unread',
      new Date()
    ]);

    if (notifValues.length > 0) {
      await conn.query(
        `INSERT INTO notifications
         (user_id, title, message, type, status, created_at)
         VALUES ?`,
        [notifValues]
      );
    }

    await conn.commit();

    return res.json({
      success: true,
      message: 'Đã chuyển tiếp báo cáo lên Admin',
      new_report_id: newReportId
    });
  } catch (err) {
    if (conn) await conn.rollback();
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};

// GET /api/reports/admin
// Admin xem danh sách báo cáo do Manager gửi lên (role_id = 2), sắp xếp mới nhất trước
exports.getReportsForAdmin = async (req, res, next) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      `SELECT r.report_id,
              r.station_id,
              s.station_name,
              r.reporter_id,
              u.full_name AS reporter_name,
              u.role_id    AS reporter_role_id,
              r.title,
              r.description,
              r.image_url,
              r.status,
              r.reported_at
       FROM reports r
       JOIN stations s ON r.station_id = s.station_id
       JOIN users u ON r.reporter_id = u.user_id
       WHERE u.role_id = 2
       ORDER BY r.reported_at DESC`
    );

    return res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};

// PUT /api/reports/:report_id/status
// Admin phê duyệt / đánh dấu đã xử lý báo cáo (do Manager gửi lên)
exports.updateReportStatus = async (req, res, next) => {
  const { report_id } = req.params;
  const { status } = req.body; // 'pending' | 'resolved'

  if (!status || !['pending', 'resolved'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "status phải là 'pending' hoặc 'resolved'"
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Lấy thông tin report + reporter + station
    const [rows] = await conn.query(
      `SELECT r.report_id,
              r.status    AS old_status,
              r.station_id,
              r.reporter_id,
              s.station_name,
              u.full_name AS reporter_name
       FROM reports r
       JOIN stations s ON r.station_id = s.station_id
       JOIN users u ON r.reporter_id = u.user_id
       WHERE r.report_id = ?
         AND u.role_id = 2`,
      [report_id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = rows[0];

    if (report.old_status === status) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Report đã ở trạng thái này rồi'
      });
    }

    await conn.query('UPDATE reports SET status = ? WHERE report_id = ?', [
      status,
      report_id
    ]);

    // Nếu admin đánh dấu 'resolved' -> gửi thông báo cho người báo cáo
    if (status === 'resolved') {
      const notifTitle = 'Báo cáo sự cố đã được xử lý';
      const notifMessage = `Báo cáo của bạn về trạm ${report.station_name} đã được admin xử lý.`;

      await conn.query(
        `INSERT INTO notifications
         (user_id, title, message, type, status, created_at)
         VALUES (?, ?, ?, 'system', 'unread', NOW())`,
        [report.reporter_id, notifTitle, notifMessage]
      );
    }

    await conn.commit();

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái báo cáo thành công'
    });
  } catch (err) {
    if (conn) await conn.rollback();
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};

// GET /api/reports/my
// User xem lịch sử báo cáo sự cố của chính mình
exports.getMyReports = async (req, res, next) => {
  const userId = req.user?.user_id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      `SELECT
         r.report_id,
         CONCAT('REP-', LPAD(r.report_id, 4, '0')) AS report_code,
         r.station_id,
         s.station_name,
         r.title,
         r.description,
         r.status,
         r.reported_at,
         r.reported_at AS updated_at
       FROM reports r
       JOIN stations s ON r.station_id = s.station_id
       WHERE r.reporter_id = ?
       ORDER BY r.reported_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};

// GET /api/reports/:report_id (User)
// User xem chi tiết 1 báo cáo của mình
exports.getUserReportDetail = async (req, res, next) => {
  const userId = req.user?.user_id;
  const { report_id } = req.params;

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.query(
      `SELECT
         r.report_id,
         CONCAT('REP-', LPAD(r.report_id, 4, '0')) AS report_code,
         r.station_id,
         s.station_name,
         r.title,
         r.description,
         r.image_url,
         r.status,
         r.reported_at,
         COALESCE(r.updated_at, r.reported_at) AS updated_at
       FROM reports r
       JOIN stations s ON r.station_id = s.station_id
       WHERE r.report_id = ?
         AND r.reporter_id = ?`,
      [report_id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = rows[0];

    // Parse image_url: có thể là JSON array string hoặc single URL
    let images = [];
    if (report.image_url) {
      try {
        // Thử parse JSON array
        const parsed = JSON.parse(report.image_url);
        images = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // Nếu không phải JSON, coi như single URL hoặc comma-separated
        if (report.image_url.includes(',')) {
          images = report.image_url.split(',').map(url => url.trim()).filter(url => url);
        } else {
          images = [report.image_url];
        }
      }
    }

    // Tạo status_history (timeline)
    const statusHistory = [
      {
        status: 'pending',
        label: report.status === 'pending' ? 'Đang chờ' : 'Đã xử lý',
        timestamp: report.reported_at,
        description: 'Báo cáo đã được tạo'
      }
    ];

    // Nếu đã resolved, thêm mốc "Đã xử lý"
    if (report.status === 'resolved') {
      statusHistory.push({
        status: 'resolved',
        label: 'Đã xử lý',
        timestamp: report.updated_at,
        description: 'Báo cáo đã được Quản lý xử lý'
      });
    }

    // Format response
    const response = {
      report_id: report.report_id,
      report_code: report.report_code,
      station_id: report.station_id,
      station_name: report.station_name,
      title: report.title,
      description: report.description,
      images: images, // Array of image URLs
      status: report.status,
      status_label: report.status === 'pending' ? 'Đang chờ' : 'Đã xử lý',
      reported_at: report.reported_at,
      updated_at: report.updated_at,
      status_history: statusHistory
    };

    return res.json({
      success: true,
      data: response
    });
  } catch (err) {
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};

// GET /api/reports/manager/inbox
// Manager xem danh sách báo cáo từ User tại các trạm mình quản lý
exports.getManagerInbox = async (req, res, next) => {
  const managerId = req.user?.user_id;
  const { station_id, status } = req.query;

  let conn;
  try {
    conn = await pool.getConnection();

    const whereClauses = [
      's.manager_id = ?',
      'u.role_id = 1' // chỉ lấy báo cáo do User gửi
    ];
    const params = [managerId];

    if (station_id) {
      whereClauses.push('r.station_id = ?');
      params.push(station_id);
    }

    if (status && ['pending', 'resolved'].includes(status)) {
      whereClauses.push('r.status = ?');
      params.push(status);
    }

    const [rows] = await conn.query(
      `SELECT
         r.report_id,
         CONCAT('REP-', LPAD(r.report_id, 4, '0')) AS report_code,
         u.full_name AS reporter_name,
         r.station_id,
         s.station_name,
         r.title,
         r.description,
         r.status,
         r.reported_at,
         r.reported_at AS updated_at
       FROM reports r
       JOIN stations s ON r.station_id = s.station_id
       JOIN users u ON r.reporter_id = u.user_id
       WHERE ${whereClauses.join(' AND ')}
       ORDER BY r.reported_at DESC`,
      params
    );

    return res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    return next(err);
  } finally {
    if (conn) conn.release();
  }
};