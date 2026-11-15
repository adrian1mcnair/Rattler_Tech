// /api/auth - simple login check
// Verifies email + password against the stored bcrypt hash and returns the user.
// (Session tokens / JWT can be added in Milestone 4 when the frontend is connected.)
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { HttpError, requireFields } = require('../utils/validation');

const router = express.Router();

// POST /api/auth/login  body: { email, password }
router.post('/login', async (req, res) => {
  const body = req.body || {};
  requireFields(body, ['email', 'password']);

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [body.email.trim().toLowerCase()]);
  const user = rows[0];

  // Same message for "no such email" and "wrong password" so we don't reveal which emails exist
  if (!user || !(await bcrypt.compare(String(body.password), user.password_hash))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const { password_hash, ...publicUser } = user;
  res.json({ message: 'Login successful', user: publicUser });
});

module.exports = router;
