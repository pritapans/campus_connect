const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// ─── POST /auth/login ─────────────────────────────────────────
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = :1',
      [username.trim()]
    );

    if (!rows.length) {
      return res.json({ success: false, message: 'User not found.' });
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, message: 'Incorrect password.' });
    }

    const token = jwt.sign(
      {
        id:       user.id,
        username: user.username,
        role:     user.role,
        name:     user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id:       user.id,
        name:     user.name,
        username: user.username,
        email:    user.email,
        role:     user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.json({ success: false, message: 'Server error during login.' });
  }
};

// ─── POST /auth/register ──────────────────────────────────────
exports.register = async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.json({ success: false, message: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (name, username, email, password, role)
       VALUES (:1, :2, :3, :4, 'student')`,
      [name.trim(), username.trim().toLowerCase(), email.trim().toLowerCase(), hashed]
    );

    res.json({ success: true, message: 'Account created successfully. Please log in.' });
  } catch (err) {
    // ORA-00001: unique constraint violated
    if (err.errorNum === 1) {
      return res.json({ success: false, message: 'Username or email is already taken.' });
    }
    console.error('Register error:', err);
    res.json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── GET /auth/me ─────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, username, email, role, created_at FROM users WHERE id = :1',
      [req.user.id]
    );
    if (!rows.length) return res.json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('GetMe error:', err);
    res.json({ success: false, message: 'Server error.' });
  }
};
