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
  } catch (e) { console.error('Audit log error:', e); }
};

// GET /api/admin/students
router.get('/', async (req, res) => {
  try {
    const { search, department_id, semester_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (search) { where += ` AND (s.full_name ILIKE $${idx} OR s.register_number ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (department_id) { where += ` AND s.department_id = $${idx}`; params.push(department_id); idx++; }
    if (semester_id) { where += ` AND s.semester_id = $${idx}`; params.push(semester_id); idx++; }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM students s ${where}`, params
    );
    params.push(limit, offset);
    const result = await db.query(
      `SELECT s.*, d.name AS department_name, d.code AS dept_code,
              sem.semester_number, sem.academic_year
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN semesters sem ON s.semester_id = sem.id
       ${where} ORDER BY s.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      params
    );
    res.json({ students: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// GET /api/admin/students/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, d.name AS department_name, sem.semester_number, sem.academic_year
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN semesters sem ON s.semester_id = sem.id
       WHERE s.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found.' });
    const subjects = await db.query(
      `SELECT sub.* FROM subjects sub
       JOIN student_subjects ss ON ss.subject_id = sub.id
       WHERE ss.student_id = $1`, [req.params.id]
    );
    res.json({ student: result.rows[0], subjects: subjects.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student.' });
  }
});

// POST /api/admin/students
router.post('/', async (req, res) => {
  const { register_number, full_name, email, password, department_id, semester_id, date_of_birth, phone } = req.body;
  if (!register_number || !full_name || !email || !password)
    return res.status(400).json({ error: 'Required fields missing.' });
  try {
    const hash = await bcrypt.hash(password || register_number, 10);
    const result = await db.query(
      `INSERT INTO students (register_number, full_name, email, password_hash, department_id, semester_id, date_of_birth, phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [register_number, full_name, email, hash, department_id, semester_id, date_of_birth || null, phone || null]
    );
    const student = result.rows[0];

    // Auto-enroll in semester subjects
    if (semester_id) {
      const subjects = await db.query('SELECT id FROM subjects WHERE semester_id = $1', [semester_id]);
      for (const sub of subjects.rows) {
        await db.query(
          'INSERT INTO student_subjects (student_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [student.id, sub.id]
        );
      }
    }

    await logAudit(req.admin.id, 'CREATE_STUDENT', 'student', student.id, `Created student ${full_name} (${register_number})`);
    res.status(201).json({ student });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Register number or email already exists.' });
    res.status(500).json({ error: 'Failed to create student.' });
  }
});

// PUT /api/admin/students/:id
router.put('/:id', async (req, res) => {
  const { full_name, email, department_id, semester_id, date_of_birth, phone } = req.body;
  try {
    const result = await db.query(
      `UPDATE students SET full_name=$1, email=$2, department_id=$3, semester_id=$4, date_of_birth=$5, phone=$6
       WHERE id=$7 RETURNING *`,
      [full_name, email, department_id, semester_id, date_of_birth || null, phone || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found.' });
    await logAudit(req.admin.id, 'UPDATE_STUDENT', 'student', req.params.id, `Updated student ${full_name}`);
    res.json({ student: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student.' });
  }
});

// DELETE /api/admin/students/:id
router.delete('/:id', async (req, res) => {
  try {
    const s = await db.query('SELECT full_name FROM students WHERE id=$1', [req.params.id]);
    await db.query('DELETE FROM students WHERE id=$1', [req.params.id]);
    await logAudit(req.admin.id, 'DELETE_STUDENT', 'student', req.params.id, `Deleted student ${s.rows[0]?.full_name}`);
    res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student.' });
  }
});

module.exports = router;
