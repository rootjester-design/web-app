// routes/courses.js  —  Courses & Enrollments API
'use strict';
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/* ── GET /api/courses  (public) ──────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { category, level, search } = req.query;
    let sql = 'SELECT * FROM courses WHERE is_published = 1';
    const params = [];

    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (level)    { sql += ' AND level = ?';    params.push(level); }
    if (search)   { sql += ' AND title LIKE ?'; params.push(`%${search}%`); }

    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    return res.json({ success: true, courses: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── GET /api/courses/:id  (public) ─────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM courses WHERE id = ? AND is_published = 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Course not found.' });
    return res.json({ success: true, course: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── POST /api/courses  (admin) ──────────────────────── */
router.post('/', requireAdmin, [
  body('title').trim().isLength({ min: 3 }),
  body('instructor').trim().isLength({ min: 2 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  const { title, description, instructor, category, level, duration, video_url, price } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO courses (title,description,instructor,category,level,duration,video_url,price) VALUES (?,?,?,?,?,?,?,?)',
      [title, description, instructor, category||'General', level||'Beginner', duration, video_url, price||0]
    );
    return res.status(201).json({ success: true, course_id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── PUT /api/courses/:id  (admin) ───────────────────── */
router.put('/:id', requireAdmin, async (req, res) => {
  const { title, description, instructor, category, level, duration, video_url, price, is_published } = req.body;
  try {
    await db.query(
      'UPDATE courses SET title=?,description=?,instructor=?,category=?,level=?,duration=?,video_url=?,price=?,is_published=? WHERE id=?',
      [title, description, instructor, category, level, duration, video_url, price, is_published, req.params.id]
    );
    return res.json({ success: true, message: 'Course updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── DELETE /api/courses/:id  (admin) ────────────────── */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM courses WHERE id=?', [req.params.id]);
    return res.json({ success: true, message: 'Course deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── POST /api/courses/:id/enroll  (student) ─────────── */
router.post('/:id/enroll', requireAuth, async (req, res) => {
  try {
    const [course] = await db.query('SELECT id FROM courses WHERE id=? AND is_published=1', [req.params.id]);
    if (!course.length) return res.status(404).json({ success: false, message: 'Course not found.' });

    await db.query(
      'INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?,?)',
      [req.user.id, req.params.id]
    );
    return res.json({ success: true, message: 'Enrolled successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── GET /api/courses/enrolled/me  (student) ─────────── */
router.get('/enrolled/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, e.progress, e.status, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `, [req.user.id]);
    return res.json({ success: true, enrollments: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── PATCH /api/courses/:id/progress  (student) ──────── */
router.patch('/:id/progress', requireAuth, [
  body('progress').isInt({ min: 0, max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

  const { progress } = req.body;
  try {
    const status = progress >= 100 ? 'completed' : 'active';
    await db.query(
      'UPDATE enrollments SET progress=?, status=? WHERE user_id=? AND course_id=?',
      [progress, status, req.user.id, req.params.id]
    );
    return res.json({ success: true, message: 'Progress updated.', progress, status });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ── GET /api/courses/admin/stats  (admin) ───────────── */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [[users]]       = await db.query('SELECT COUNT(*) AS count FROM users WHERE role="student"');
    const [[courses]]     = await db.query('SELECT COUNT(*) AS count FROM courses');
    const [[enrollments]] = await db.query('SELECT COUNT(*) AS count FROM enrollments');
    const [[completed]]   = await db.query('SELECT COUNT(*) AS count FROM enrollments WHERE status="completed"');
    return res.json({ success: true, stats: {
      students: users.count, courses: courses.count,
      enrollments: enrollments.count, completed: completed.count
    }});
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
