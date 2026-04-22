// routes/auth.js  —  Register / Login / Logout / Profile
'use strict';
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db       = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;

/* ── helpers ─────────────────────────────────────────── */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function cookieOpts() {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,   // 7 days
  };
}

/* ── POST /api/auth/register ─────────────────────────── */
router.post('/register', [
  body('full_name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password needs an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password needs a number.'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { full_name, email, password } = req.body;

  try {
    // Duplicate check
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [full_name, email, hashed]
    );

    const user = { id: result.insertId, email, role: 'student', full_name };
    const token = signToken(user);

    res.cookie('token', token, cookieOpts());
    return res.status(201).json({ success: true, message: 'Account created!', token, user });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/* ── POST /api/auth/login ────────────────────────────── */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password is required.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, password, remember_me } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT id, full_name, email, password, role, avatar FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    const opts  = cookieOpts();
    if (!remember_me) opts.maxAge = undefined;   // session cookie

    res.cookie('token', token, opts);
    delete user.password;
    return res.json({ success: true, message: 'Login successful!', token, user });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/* ── POST /api/auth/logout ───────────────────────────── */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out.' });
});

/* ── GET /api/auth/me ────────────────────────────────── */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, email, role, avatar, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── PATCH /api/auth/profile ─────────────────────────── */
router.patch('/profile', requireAuth, [
  body('full_name').optional().trim().isLength({ min: 2 }),
  body('bio').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  const { full_name, bio } = req.body;
  try {
    await db.query('UPDATE users SET full_name=?, bio=? WHERE id=?',
      [full_name, bio, req.user.id]);
    return res.json({ success: true, message: 'Profile updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── PATCH /api/auth/change-password ────────────────── */
router.patch('/change-password', requireAuth, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  const { current_password, new_password } = req.body;
  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id=?', [req.user.id]);
    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return res.status(401).json({ success: false, message: 'Current password incorrect.' });

    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    await db.query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
