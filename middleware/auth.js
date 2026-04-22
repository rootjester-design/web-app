// middleware/auth.js  —  JWT + session guard
'use strict';
const jwt = require('jsonwebtoken');

/**
 * requireAuth  —  protect API routes.
 * Checks Authorization header (Bearer token) first, then cookie.
 */
function requireAuth(req, res, next) {
  let token = null;

  // 1. Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // 2. Fallback: cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { id, email, role, full_name }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * requireAdmin  —  additionally checks role === 'admin'
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
