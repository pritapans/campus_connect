const db = require('../config/db');

// ─── GET /events — All approved events (students see this) ────
exports.getApprovedEvents = async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.id, e.title, e.description, e.event_date, e.event_time,
              e.category, e.status, e.created_at,
              u.name AS creator_name
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.status = 'approved'
       ORDER BY e.event_date ASC`
    );
    res.json({ success: true, events });
  } catch (err) {
    console.error('getApprovedEvents error:', err);
    res.json({ success: false, message: 'Failed to fetch events.' });
  }
};

// ─── GET /events/pending — Admin: events awaiting approval ────
exports.getPendingEvents = async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.id, e.title, e.description, e.event_date, e.event_time,
              e.category, e.status, e.created_at,
              u.name AS creator_name, u.username AS creator_username
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.status = 'pending'
       ORDER BY e.created_at DESC`
    );
    res.json({ success: true, events });
  } catch (err) {
    console.error('getPendingEvents error:', err);
    res.json({ success: false, message: 'Failed to fetch pending events.' });
  }
};

// ─── GET /events/all — Admin: all events regardless of status ─
exports.getAllEvents = async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.id, e.title, e.description, e.event_date, e.event_time,
              e.category, e.status, e.created_at,
              u.name AS creator_name
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       ORDER BY e.created_at DESC`
    );
    res.json({ success: true, events });
  } catch (err) {
    console.error('getAllEvents error:', err);
    res.json({ success: false, message: 'Failed to fetch all events.' });
  }
};

// ─── POST /events — Create event (any logged-in user) ─────────
exports.createEvent = async (req, res) => {
  const { title, description = '', date, time, category = 'Other' } = req.body;

  if (!title || !date || !time) {
    return res.json({ success: false, message: 'Title, date and time are required.' });
  }

  const validCategories = ['Workshop','Hackathon','Seminar','Competition','Cultural','Other'];
  if (!validCategories.includes(category)) {
    return res.json({ success: false, message: 'Invalid category.' });
  }

  try {
    // Convert date string "YYYY-MM-DD" to Oracle DATE using TO_DATE
    await db.query(
      `INSERT INTO events (title, description, event_date, event_time, category, created_by)
       VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'), :4, :5, :6)`,
      [title.trim(), description.trim(), date, time, category, req.user.id]
    );

    // Auto-approve if created by admin
    const message = req.user.role === 'admin'
      ? 'Event created.'
      : 'Event submitted and pending admin approval.';

    if (req.user.role === 'admin') {
      // Approve the event that was just created
      const [rows] = await db.query(
        `SELECT id FROM events WHERE created_by = :1 ORDER BY created_at DESC FETCH FIRST 1 ROWS ONLY`,
        [req.user.id]
      );
      if (rows.length) {
        await db.query(
          `UPDATE events SET status = 'approved' WHERE id = :1`,
          [rows[0].id]
        );
      }
    }

    res.json({ success: true, message });
  } catch (err) {
    console.error('createEvent error:', err);
    res.json({ success: false, message: 'Failed to create event.' });
  }
};

// ─── PUT /events/:id — Admin: approve or reject an event ──────
exports.updateEventStatus = async (req, res) => {
  const { status } = req.body;
  const { id }     = req.params;

  if (!['approved','rejected'].includes(status)) {
    return res.json({ success: false, message: 'Status must be approved or rejected.' });
  }

  try {
    const [, result] = await db.query(
      'UPDATE events SET status = :1 WHERE id = :2',
      [status, id]
    );

    if (result.rowsAffected === 0) {
      return res.json({ success: false, message: 'Event not found.' });
    }

    res.json({ success: true, message: `Event ${status} successfully.` });
  } catch (err) {
    console.error('updateEventStatus error:', err);
    res.json({ success: false, message: 'Failed to update event status.' });
  }
};

// ─── DELETE /events/:id — Admin: delete an event ──────────────
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM registrations WHERE event_id = :1', [id]);
    await db.query('DELETE FROM certificates  WHERE event_id = :1', [id]);
    const [, result] = await db.query('DELETE FROM events WHERE id = :1', [id]);

    if (result.rowsAffected === 0) {
      return res.json({ success: false, message: 'Event not found.' });
    }
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.json({ success: false, message: 'Failed to delete event.' });
  }
};
