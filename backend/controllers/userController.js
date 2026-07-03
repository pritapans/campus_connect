const db = require('../config/db');

// ─── GET /admin/stats — Dashboard summary numbers ─────────────
exports.getStats = async (req, res) => {
  try {
    const [[s1]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM users WHERE role = 'student'`
    );
    const [[s2]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM events WHERE status = 'approved'`
    );
    const [[s3]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM certificates WHERE status = 'approved'`
    );
    const [[s4]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM registrations`
    );
    const [[s5]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM events WHERE status = 'pending'`
    );

    res.json({
      success: true,
      stats: {
        total_students:      s1.cnt,
        active_events:       s2.cnt,
        certificates_issued: s3.cnt,
        total_registrations: s4.cnt,
        pending_events:      s5.cnt
      }
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.json({ success: false, message: 'Failed to fetch stats.' });
  }
};

// ─── GET /admin/students — Leaderboard ────────────────────────
exports.getStudents = async (req, res) => {
  try {
    const [students] = await db.query(
      `SELECT u.id, u.name, u.username, u.email, u.created_at,
              COUNT(DISTINCT r.id)                           AS total_registrations,
              COUNT(DISTINCT c.id)                          AS total_certificates,
              (COUNT(DISTINCT r.id) * 10
               + COUNT(DISTINCT c.id) * 25)                 AS engagement_points
       FROM users u
       LEFT JOIN registrations r ON u.id = r.user_id
       LEFT JOIN certificates  c ON u.id = c.user_id AND c.status = 'approved'
       WHERE u.role = 'student'
       GROUP BY u.id, u.name, u.username, u.email, u.created_at
       ORDER BY engagement_points DESC`
    );
    res.json({ success: true, students });
  } catch (err) {
    console.error('getStudents error:', err);
    res.json({ success: false, message: 'Failed to fetch students.' });
  }
};

// ─── GET /admin/profile — Logged-in user's profile ────────────
exports.getMyProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, username, email, role, created_at
       FROM users WHERE id = :1`,
      [req.user.id]
    );
    if (!rows.length) return res.json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('getMyProfile error:', err);
    res.json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// ─── GET /admin/dashboard — Full admin dashboard data ─────────
exports.getDashboard = async (req, res) => {
  try {
    // Stats
    const [[s1]] = await db.query(`SELECT COUNT(*) AS cnt FROM users WHERE role = 'student'`);
    const [[s2]] = await db.query(`SELECT COUNT(*) AS cnt FROM events WHERE status = 'approved'`);
    const [[s3]] = await db.query(`SELECT COUNT(*) AS cnt FROM certificates WHERE status = 'approved'`);
    const [[s4]] = await db.query(`SELECT COUNT(*) AS cnt FROM events WHERE status = 'pending'`);

    // Recent pending events
    const [pendingEvents] = await db.query(
      `SELECT e.id, e.title, e.category, e.event_date, e.event_time, u.name AS creator_name
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.status = 'pending'
       ORDER BY e.created_at DESC
       FETCH FIRST 5 ROWS ONLY`
    );

    // Recent certificate requests
    const [pendingCerts] = await db.query(
      `SELECT c.id, u.name AS student_name, e.title AS event_title, c.issued_at
       FROM certificates c
       JOIN users  u ON c.user_id  = u.id
       JOIN events e ON c.event_id = e.id
       WHERE c.status = 'pending'
       ORDER BY c.issued_at DESC
       FETCH FIRST 5 ROWS ONLY`
    );

    res.json({
      success: true,
      stats: {
        total_students:      s1.cnt,
        active_events:       s2.cnt,
        certificates_issued: s3.cnt,
        pending_events:      s4.cnt
      },
      pendingEvents,
      pendingCerts
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    res.json({ success: false, message: 'Failed to fetch dashboard data.' });
  }
};
