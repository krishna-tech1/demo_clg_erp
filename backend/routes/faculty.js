const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

const logAudit = async (adminId, action, entityType, entityId, details) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) VALUES ('admin', $1, $2, $3, $4, $5)`,
      [adminId, action, entityType, entityId, details]
    );
  } catch (e) {}
};

// GET /api/admin/faculty
router.get('/', async (req, res) => {
  try {
    const { search, department_id, sort_by, sort_order } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (search) { where += ` AND (f.full_name ILIKE $${idx} OR f.faculty_id ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (department_id) { where += ` AND f.department_id = $${idx}`; params.push(department_id); idx++; }

    const validSortColumns = {
      'full_name': 'f.full_name',
      'faculty_id': 'f.faculty_id',
      'created_at': 'f.created_at',
      'department_name': 'd.name',
      'designation': 'f.designation'
    };
    const sortColumn = validSortColumns[sort_by] || 'f.created_at';
    const sortOrder = (sort_order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await db.query(
      `SELECT f.*, d.name AS department_name
       FROM faculty f
       LEFT JOIN departments d ON f.department_id = d.id
       ${where} ORDER BY ${sortColumn} ${sortOrder}`,
      params
    );
    res.json({ faculty: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch faculty.' });
  }
});

// POST /api/admin/faculty
router.post('/', async (req, res) => {
  const { faculty_id, full_name, email, password, department_id, designation } = req.body;
  if (!faculty_id || !full_name || !email) return res.status(400).json({ error: 'Required fields missing.' });
  try {
    const hash = await bcrypt.hash(password || faculty_id, 10);
    const result = await db.query(
      `INSERT INTO faculty (faculty_id, full_name, email, password_hash, department_id, designation)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [faculty_id, full_name, email, hash, department_id || null, designation || null]
    );
    await logAudit(req.admin.id, 'CREATE_FACULTY', 'faculty', result.rows[0].id, `Created faculty ${full_name}`);
    res.status(201).json({ faculty: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Faculty ID or email already exists.' });
    res.status(500).json({ error: 'Failed to create faculty.' });
  }
});

// PUT /api/admin/faculty/:id
router.put('/:id', async (req, res) => {
  const { full_name, email, department_id, designation } = req.body;
  try {
    const result = await db.query(
      `UPDATE faculty SET full_name=$1, email=$2, department_id=$3, designation=$4 WHERE id=$5 RETURNING *`,
      [full_name, email, department_id || null, designation || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Faculty not found.' });
    await logAudit(req.admin.id, 'UPDATE_FACULTY', 'faculty', req.params.id, `Updated faculty ${full_name}`);
    res.json({ faculty: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update faculty.' });
  }
});

// DELETE /api/admin/faculty/:id
router.delete('/:id', async (req, res) => {
  try {
    const f = await db.query('SELECT full_name FROM faculty WHERE id=$1', [req.params.id]);
    await db.query('DELETE FROM faculty WHERE id=$1', [req.params.id]);
    await logAudit(req.admin.id, 'DELETE_FACULTY', 'faculty', req.params.id, `Deleted faculty ${f.rows[0]?.full_name}`);
    res.json({ message: 'Faculty deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete faculty.' });
  }
});

// GET /api/admin/faculty/:id/subjects
router.get('/:id/subjects', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT sub.* FROM subjects sub
       JOIN faculty_subjects fs ON fs.subject_id = sub.id
       WHERE fs.faculty_id = $1`, [req.params.id]
    );
    res.json({ subjects: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch faculty subjects.' });
  }
});

// POST /api/admin/faculty/:id/subjects
router.post('/:id/subjects', async (req, res) => {
  const { subject_id } = req.body;
  try {
    await db.query(
      'INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, subject_id]
    );
    res.json({ message: 'Subject assigned to faculty.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign subject.' });
  }
});

module.exports = router;
