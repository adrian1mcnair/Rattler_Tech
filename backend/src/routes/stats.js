// /api/stats - summary numbers for an IT staff dashboard
const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// GET /api/stats
router.get('/', async (req, res) => {
  const [[totals]] = await pool.query(
    `SELECT COUNT(*) AS total_tickets,
            SUM(a.ticket_id IS NULL AND t.status IN ('Open', 'In Progress')) AS unassigned_active
       FROM tickets t LEFT JOIN assignments a ON a.ticket_id = t.ticket_id`
  );
  const [byStatus] = await pool.query(
    'SELECT status, COUNT(*) AS count FROM tickets GROUP BY status'
  );
  const [byPriority] = await pool.query(
    'SELECT priority, COUNT(*) AS count FROM tickets GROUP BY priority'
  );
  const [byTechnician] = await pool.query(
    `SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS technician,
            COUNT(t.ticket_id) AS active_tickets
       FROM users u
       LEFT JOIN assignments a ON a.technician_id = u.user_id
       LEFT JOIN tickets t     ON t.ticket_id = a.ticket_id AND t.status IN ('Open', 'In Progress')
      WHERE u.role = 'technician'
      GROUP BY u.user_id
      ORDER BY active_tickets DESC`
  );

  res.json({
    total_tickets: Number(totals.total_tickets),
    unassigned_active: Number(totals.unassigned_active || 0),
    by_status: Object.fromEntries(byStatus.map((r) => [r.status, Number(r.count)])),
    by_priority: Object.fromEntries(byPriority.map((r) => [r.priority, Number(r.count)])),
    by_technician: byTechnician.map((r) => ({ ...r, active_tickets: Number(r.active_tickets) })),
  });
});

module.exports = router;
