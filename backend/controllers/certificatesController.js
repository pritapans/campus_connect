const db = require('../config/db');

// ─── POST /request-certificate — Student requests a cert ──────
exports.requestCertificate = async (req, res) => {
  const { event_id } = req.body;

  if (!event_id) {
    return res.json({ success: false, message: 'event_id is required.' });
  }

  try {
    // Must be registered for the event
    const [reg] = await db.query(
      'SELECT id FROM registrations WHERE user_id = :1 AND event_id = :2',
      [req.user.id, event_id]
    );
    if (!reg.length) {
      return res.json({ success: false, message: 'You must be registered for this event first.' });
    }

    // Check event is approved
    const [events] = await db.query(
      `SELECT id, title FROM events WHERE id = :1 AND status = 'approved'`,
      [event_id]
    );
    if (!events.length) {
      return res.json({ success: false, message: 'Event is not approved.' });
    }

    await db.query(
      'INSERT INTO certificates (user_id, event_id) VALUES (:1, :2)',
      [req.user.id, event_id]
    );

    res.json({ success: true, message: `Certificate requested for "${events[0].title}". Pending admin approval.` });
  } catch (err) {
    if (err.errorNum === 1) {
      return res.json({ success: false, message: 'Certificate already requested for this event.' });
    }
    console.error('requestCertificate error:', err);
    res.json({ success: false, message: 'Failed to request certificate.' });
  }
};

// ─── GET /my-certificates — Student: own certificates ─────────
exports.getMyCertificates = async (req, res) => {
  try {
    const [certificates] = await db.query(
      `SELECT c.id, c.status, c.issued_at,
              e.id       AS event_id,
              e.title    AS event_title,
              e.event_date,
              e.category
       FROM certificates c
       JOIN events e ON c.event_id = e.id
       WHERE c.user_id = :1
       ORDER BY c.issued_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, certificates });
  } catch (err) {
    console.error('getMyCertificates error:', err);
    res.json({ success: false, message: 'Failed to fetch certificates.' });
  }
};

// ─── GET /certificates/all — Admin: all cert requests ─────────
exports.getAllCertificates = async (req, res) => {
  try {
    const [certificates] = await db.query(
      `SELECT c.id, c.status, c.issued_at,
              u.name     AS student_name,
              u.username,
              e.title    AS event_title,
              e.event_date,
              e.category
       FROM certificates c
       JOIN users  u ON c.user_id  = u.id
       JOIN events e ON c.event_id = e.id
       ORDER BY c.issued_at DESC`
    );
    res.json({ success: true, certificates });
  } catch (err) {
    console.error('getAllCertificates error:', err);
    res.json({ success: false, message: 'Failed to fetch certificates.' });
  }
};

// ─── POST /certificates/approve — Admin approves cert ─────────
exports.approveCertificate = async (req, res) => {
  const { cert_id } = req.body;

  if (!cert_id) {
    return res.json({ success: false, message: 'cert_id is required.' });
  }

  try {
    const [, result] = await db.query(
      `UPDATE certificates SET status = 'approved', issued_at = CURRENT_TIMESTAMP WHERE id = :1`,
      [cert_id]
    );
    if (result.rowsAffected === 0) {
      return res.json({ success: false, message: 'Certificate not found.' });
    }
    res.json({ success: true, message: 'Certificate approved and issued.' });
  } catch (err) {
    console.error('approveCertificate error:', err);
    res.json({ success: false, message: 'Failed to approve certificate.' });
  }
};

// ─── POST /certificates/reject — Admin rejects cert ───────────
exports.rejectCertificate = async (req, res) => {
  const { cert_id } = req.body;

  if (!cert_id) {
    return res.json({ success: false, message: 'cert_id is required.' });
  }

  try {
    const [, result] = await db.query(
      `UPDATE certificates SET status = 'rejected' WHERE id = :1`,
      [cert_id]
    );
    if (result.rowsAffected === 0) {
      return res.json({ success: false, message: 'Certificate not found.' });
    }
    res.json({ success: true, message: 'Certificate request rejected.' });
  } catch (err) {
    console.error('rejectCertificate error:', err);
    res.json({ success: false, message: 'Failed to reject certificate.' });
  }
};
