// /api/categories - problem types (Wi-Fi, Software, Account Access, ...)
const express = require('express');
const { pool } = require('../config/db');
const { HttpError, requireFields, parseId } = require('../utils/validation');

const router = express.Router();

// GET /api/categories -> all categories with how many tickets each has
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.category_id, c.name, c.description, COUNT(t.ticket_id) AS ticket_count
       FROM categories c
       LEFT JOIN tickets t ON t.category_id = c.category_id
      GROUP BY c.category_id
      ORDER BY c.name`
  );
  res.json(rows);
});

// POST /api/categories  body: { name, description? }
router.post('/', async (req, res) => {
  const body = req.body || {};
  requireFields(body, ['name']);
  const [result] = await pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [
    body.name.trim(),
    body.description || null,
  ]);
  const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// DELETE /api/categories/:id (fails with 409 if tickets still use it)
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const [result] = await pool.query('DELETE FROM categories WHERE category_id = ?', [id]);
  if (!result.affectedRows) throw new HttpError(404, 'Category not found');
  res.json({ message: `Category ${id} deleted` });
});

module.exports = router;
