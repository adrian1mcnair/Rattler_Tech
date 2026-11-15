// /api/tickets - the core of RattlerTech
// Create/list/view/update/delete tickets, assign technicians, and add comments.
const express = require('express');
const { pool } = require('../config/db');
const {
  PRIORITIES,
  STATUSES,
  HttpError,
  requireFields,
  checkEnum,
  parseId,
} = require('../utils/validation');

const router = express.Router();

// One query that JOINs all related tables so each ticket comes back with
// readable names (category, who submitted it, who it's assigned to).
const TICKET_SELECT = `
  SELECT t.ticket_id, t.title, t.description, t.priority, t.status,
         t.category_id, c.name AS category,
         t.created_by, CONCAT(cu.first_name, ' ', cu.last_name) AS created_by_name,
         a.technician_id AS assigned_to,
         CONCAT(tu.first_name, ' ', tu.last_name) AS assigned_to_name,
         a.assigned_at,
         t.created_at, t.updated_at
    FROM tickets t
    JOIN categories c       ON c.category_id = t.category_id
    JOIN users cu           ON cu.user_id    = t.created_by
    LEFT JOIN assignments a ON a.ticket_id   = t.ticket_id
    LEFT JOIN users tu      ON tu.user_id    = a.technician_id`;

async function getTicket(id) {
  const [rows] = await pool.query(`${TICKET_SELECT} WHERE t.ticket_id = ?`, [id]);
  if (!rows.length) throw new HttpError(404, 'Ticket not found');
  return rows[0];
}

// ---------------------------------------------------------------------
// GET /api/tickets
// Optional filters: ?status=Open&priority=High&category_id=1&created_by=1&assigned_to=4&search=wifi
// ---------------------------------------------------------------------
router.get('/', async (req, res) => {
  const { status, priority, category_id, created_by, assigned_to, search } = req.query;
  checkEnum(status, STATUSES, 'status');
  checkEnum(priority, PRIORITIES, 'priority');

  const conditions = [];
  const params = [];

  if (status)      { conditions.push('t.status = ?');        params.push(status); }
  if (priority)    { conditions.push('t.priority = ?');      params.push(priority); }
  if (category_id) { conditions.push('t.category_id = ?');   params.push(parseId(category_id, 'category_id')); }
  if (created_by)  { conditions.push('t.created_by = ?');    params.push(parseId(created_by, 'created_by')); }
  if (assigned_to === 'none') {
    conditions.push('a.technician_id IS NULL');               // unassigned tickets
  } else if (assigned_to) {
    conditions.push('a.technician_id = ?');                   params.push(parseId(assigned_to, 'assigned_to'));
  }
  if (search) {
    conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  let sql = TICKET_SELECT;
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  // Most urgent first, then newest
  sql += ` ORDER BY FIELD(t.priority, 'Critical', 'High', 'Medium', 'Low'), t.created_at DESC`;

  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// ---------------------------------------------------------------------
// GET /api/tickets/:id -> one ticket with its comments
// ---------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const ticket = await getTicket(id);
  const [comments] = await pool.query(
    `SELECT cm.comment_id, cm.user_id, CONCAT(u.first_name, ' ', u.last_name) AS author,
            u.role AS author_role, cm.message, cm.created_at
       FROM ticket_comments cm
       JOIN users u ON u.user_id = cm.user_id
      WHERE cm.ticket_id = ?
      ORDER BY cm.created_at, cm.comment_id`,
    [id]
  );
  res.json({ ...ticket, comments });
});

// ---------------------------------------------------------------------
// POST /api/tickets -> submit a new ticket
// body: { title, description, category_id, created_by, priority? }
// ---------------------------------------------------------------------
router.post('/', async (req, res) => {
  const body = req.body || {};
  requireFields(body, ['title', 'description', 'category_id', 'created_by']);
  checkEnum(body.priority, PRIORITIES, 'priority');

  const [result] = await pool.query(
    `INSERT INTO tickets (title, description, priority, category_id, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      body.title.trim(),
      body.description.trim(),
      body.priority || 'Medium',
      parseId(body.category_id, 'category_id'),
      parseId(body.created_by, 'created_by'),
    ]
  );
  res.status(201).json(await getTicket(result.insertId));
});

// ---------------------------------------------------------------------
// PATCH /api/tickets/:id -> update status, priority, title, description or category
// body: any of { status, priority, title, description, category_id }
// ---------------------------------------------------------------------
router.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body || {};
  checkEnum(body.status, STATUSES, 'status');
  checkEnum(body.priority, PRIORITIES, 'priority');
  if (body.category_id !== undefined) body.category_id = parseId(body.category_id, 'category_id');

  const allowed = ['title', 'description', 'priority', 'status', 'category_id'];
  const fields = allowed.filter((f) => body[f] !== undefined);
  if (!fields.length) throw new HttpError(400, `Provide at least one of: ${allowed.join(', ')}`);

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const [result] = await pool.query(`UPDATE tickets SET ${setClause} WHERE ticket_id = ?`, [
    ...fields.map((f) => body[f]),
    id,
  ]);
  if (!result.affectedRows) throw new HttpError(404, 'Ticket not found');

  res.json(await getTicket(id));
});

// ---------------------------------------------------------------------
// DELETE /api/tickets/:id (its assignment and comments are removed by ON DELETE CASCADE)
// ---------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const [result] = await pool.query('DELETE FROM tickets WHERE ticket_id = ?', [id]);
  if (!result.affectedRows) throw new HttpError(404, 'Ticket not found');
  res.json({ message: `Ticket ${id} deleted` });
});

// ---------------------------------------------------------------------
// POST /api/tickets/:id/assign -> assign (or reassign) a technician
// body: { technician_id, assigned_by? }
// An Open ticket automatically moves to "In Progress" when assigned.
// ---------------------------------------------------------------------
router.post('/:id/assign', async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body || {};
  requireFields(body, ['technician_id']);
  const technicianId = parseId(body.technician_id, 'technician_id');
  const assignedBy = body.assigned_by ? parseId(body.assigned_by, 'assigned_by') : null;

  await getTicket(id); // 404 if the ticket doesn't exist

  const [techRows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [technicianId]);
  if (!techRows.length) throw new HttpError(404, 'Technician not found');
  if (!['technician', 'admin'].includes(techRows[0].role)) {
    throw new HttpError(400, 'Tickets can only be assigned to a technician or admin');
  }

  // A transaction makes the assignment + status change succeed or fail together
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO assignments (ticket_id, technician_id, assigned_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE technician_id = VALUES(technician_id),
                               assigned_by   = VALUES(assigned_by),
                               assigned_at   = CURRENT_TIMESTAMP`,
      [id, technicianId, assignedBy]
    );
    await conn.query(
      `UPDATE tickets SET status = 'In Progress' WHERE ticket_id = ? AND status = 'Open'`,
      [id]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  res.json(await getTicket(id));
});

// DELETE /api/tickets/:id/assign -> unassign the technician
router.delete('/:id/assign', async (req, res) => {
  const id = parseId(req.params.id);
  const [result] = await pool.query('DELETE FROM assignments WHERE ticket_id = ?', [id]);
  if (!result.affectedRows) throw new HttpError(404, 'This ticket has no assignment');
  res.json(await getTicket(id));
});

// ---------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------

// GET /api/tickets/:id/comments
router.get('/:id/comments', async (req, res) => {
  const id = parseId(req.params.id);
  await getTicket(id);
  const [rows] = await pool.query(
    `SELECT cm.comment_id, cm.user_id, CONCAT(u.first_name, ' ', u.last_name) AS author,
            u.role AS author_role, cm.message, cm.created_at
       FROM ticket_comments cm
       JOIN users u ON u.user_id = cm.user_id
      WHERE cm.ticket_id = ?
      ORDER BY cm.created_at, cm.comment_id`,
    [id]
  );
  res.json(rows);
});

// POST /api/tickets/:id/comments  body: { user_id, message }
router.post('/:id/comments', async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body || {};
  requireFields(body, ['user_id', 'message']);
  await getTicket(id);

  const [result] = await pool.query(
    'INSERT INTO ticket_comments (ticket_id, user_id, message) VALUES (?, ?, ?)',
    [id, parseId(body.user_id, 'user_id'), body.message.trim()]
  );
  const [rows] = await pool.query(
    `SELECT cm.comment_id, cm.ticket_id, cm.user_id, CONCAT(u.first_name, ' ', u.last_name) AS author,
            u.role AS author_role, cm.message, cm.created_at
       FROM ticket_comments cm JOIN users u ON u.user_id = cm.user_id
      WHERE cm.comment_id = ?`,
    [result.insertId]
  );
  res.status(201).json(rows[0]);
});

module.exports = router;
