// /api/users - create, list, view, update and delete users
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { ROLES, HttpError, requireFields, checkEnum, parseId } = require('../utils/validation');

const router = express.Router();

// Columns safe to send to the client (never send password_hash)
const PUBLIC_COLUMNS = 'user_id, first_name, last_name, email, role, created_at';

// GET /api/users            -> all users
// GET /api/users?role=technician -> only technicians (useful for the "assign" dropdown)
router.get('/', async (req, res) => {
  const { role } = req.query;
  checkEnum(role, ROLES, 'role');

  let sql = `SELECT ${PUBLIC_COLUMNS} FROM users`;
  const params = [];
  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  sql += ' ORDER BY last_name, first_name';

  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// GET /api/users/:id -> one user plus how many tickets they've submitted
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const [rows] = await pool.query(
    `SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.created_at,
            COUNT(t.ticket_id) AS tickets_submitted
       FROM users u
       LEFT JOIN tickets t ON t.created_by = u.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id`,
    [id]
  );
  if (!rows.length) throw new HttpError(404, 'User not found');
  res.json(rows[0]);
});

// POST /api/users -> register a new user
// body: { first_name, last_name, email, password, role? }
router.post('/', async (req, res) => {
  const body = req.body || {};
  requireFields(body, ['first_name', 'last_name', 'email', 'password']);
  checkEnum(body.role, ROLES, 'role');
  if (!/^\S+@\S+\.\S+$/.test(body.email)) throw new HttpError(400, 'Invalid email address');
  if (String(body.password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');

  // Hash the password so the real password is never stored in the database
  const passwordHash = await bcrypt.hash(String(body.password), 10);

  const [result] = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`,
    [body.first_name.trim(), body.last_name.trim(), body.email.trim().toLowerCase(), passwordHash, body.role || 'student']
  );

  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE user_id = ?`, [result.insertId]);
  res.status(201).json(rows[0]);
});

// PATCH /api/users/:id -> update name, email or role
router.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body || {};
  checkEnum(body.role, ROLES, 'role');

  const allowed = ['first_name', 'last_name', 'email', 'role'];
  const fields = allowed.filter((f) => body[f] !== undefined);
  if (!fields.length) throw new HttpError(400, `Provide at least one of: ${allowed.join(', ')}`);

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => body[f]);

  const [result] = await pool.query(`UPDATE users SET ${setClause} WHERE user_id = ?`, [...values, id]);
  if (!result.affectedRows) throw new HttpError(404, 'User not found');

  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE user_id = ?`, [id]);
  res.json(rows[0]);
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
  if (!result.affectedRows) throw new HttpError(404, 'User not found');
  res.json({ message: `User ${id} deleted` });
});

module.exports = router;
