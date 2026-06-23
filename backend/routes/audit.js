const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

// GET /api/admin/audit-logs
router.get('/', async (req, res) => {
  try {
    const { action, user_type, sort_by, sort_order, page = 1, limit = 50, from, to } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (action) { where += ` AND action ILIKE $${idx}`; params.push(`%${action}%`); idx++; }
    if (user_type) { where += ` AND user_type=$${idx}`; params.push(user_type); idx++; }
    if (from) { where += ` AND created_at >= $${idx}`; params.push(from); idx++; }
    if (to) { where += ` AND created_at <= $${idx}`; params.push(to); idx++; }

    const validSortColumns = {
      'created_at': 'created_at',
      'action': 'action'
    };
    const sortColumn = validSortColumns[sort_by] || 'created_at';
    const sortOrder = (sort_order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;
    const countResult = await db.query(`SELECT COUNT(*) FROM audit_logs ${where}`, params);
    params.push(limit, offset);
    const result = await db.query(
      `SELECT * FROM audit_logs ${where} ORDER BY ${sortColumn} ${sortOrder} LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );
    res.json({ logs: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

module.exports = router;
