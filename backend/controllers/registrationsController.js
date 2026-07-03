const db = require('../config/db');

// ─── POST /register-event — Student registers for an event ────
exports.registerForEvent = async (req, res) => {
  const { event_id } = req.body;

  if (!event_id) {
    return res.json({ success: false, message: 'event_id is required.' });
  }

  try {
    // Make sure the event exists and is approved
    const [events] = await db.query(
      `SELECT id, title FROM events WHERE id = :1 AND status = 'approved'`,
      [event_id]
    );
    if (!events.length) {
      return res.json({ success: false, message: 'Event not found or not yet approved.' });
    }

    await db.query(
      'INSERT INTO registrations (user_id, event_id) VALUES (:1, :2)',
      [req.user.id, event_id]
    );

    res.json({ success: true, message: `Successfully registered for "${events[0].title}"!` });
  } catch (err) {
    if (err.errorNum === 1) {
      return res.json({ success: false, message: 'You are already registered for this event.' });
    }
    console.error('registerForEvent error:', err);
    res.json({ success: false, message: 'Failed to register for event.' });
  }
};

// ─── GET /my-registrations — Student: own registrations ───────
exports.getMyRegistrations = async (req, res) => {
  try {
    const [registrations] = await db.query(
      `SELECT r.id, r.registered_at,
              e.id          AS event_id,
              e.title       AS event_title,
              e.event_date,
              e.event_time,
              e.category,
              e.status      AS event_status
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = :1
       ORDER BY r.registered_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, registrations });
  } catch (err) {
    console.error('getMyRegistrations error:', err);
    res.json({ success: false, message: 'Failed to fetch registrations.' });
  }
};

// ─── GET /registrations/all — Admin: all registrations ────────
exports.getAllRegistrations = async (req, res) => {
  try {
    const [registrations] = await db.query(
      `SELECT r.id, r.registered_at,
              u.name AS student_name, u.username,
              e.title AS event_title, e.event_date, e.category
       FROM registrations r
       JOIN users  u ON r.user_id  = u.id
       JOIN events e ON r.event_id = e.id
       ORDER BY r.registered_at DESC`
    );
    res.json({ success: true, registrations });
  } catch (err) {
    console.error('getAllRegistrations error:', err);
    res.json({ success: false, message: 'Failed to fetch registrations.' });
  }
};

// ─── DELETE /registrations/:id — Cancel a registration ────────
exports.cancelRegistration = async (req, res) => {
  try {
    const [, result] = await db.query(
      'DELETE FROM registrations WHERE id = :1 AND user_id = :2',
      [req.params.id, req.user.id]
    );
    if (result.rowsAffected === 0) {
      return res.json({ success: false, message: 'Registration not found.' });
    }
    res.json({ success: true, message: 'Registration cancelled.' });
  } catch (err) {
    console.error('cancelRegistration error:', err);
    res.json({ success: false, message: 'Failed to cancel registration.' });
  }
};
