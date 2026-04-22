// server.js  —  MyClassRoom.LK Express Server
'use strict';
require('dotenv').config();

const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const cors         = require('cors');

const authRoutes    = require('./routes/auth');
const courseRoutes  = require('./routes/courses');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ──────────────────────────────────────── */
app.use(cors({
  origin:      process.env.NODE_ENV === 'production' ? 'https://myclassroom.lk' : true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* ── API Routes ──────────────────────────────────────── */
app.use('/api/auth',    authRoutes);
app.use('/api/courses', courseRoutes);

/* ── Health Check ────────────────────────────────────── */
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

/* ── SPA Fallback — serve index.html for all page routes */
const pages = ['/', '/login', '/register', '/dashboard', '/courses', '/admin'];
pages.forEach(p => {
  app.get(p, (req, res) =>
    res.sendFile(path.join(__dirname, 'public', p === '/' ? 'index.html' : p.slice(1) + '.html'))
  );
});

/* ── 404 handler ─────────────────────────────────────── */
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

/* ── Global error handler ────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ── Start ───────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  MyClassRoom.LK running at http://localhost:${PORT}`);
  console.log(`📚  Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
