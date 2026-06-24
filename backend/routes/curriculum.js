const express = require('express');
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

// ---- DEPARTMENTS ----
router.get('/departments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM departments ORDER BY name');
    res.json({ departments: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

router.post('/departments', async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and code required.' });
  try {
    const result = await db.query(
      'INSERT INTO departments (name, code) VALUES ($1,$2) RETURNING *', [name, code.toUpperCase()]
    );
    await logAudit(req.admin.id, 'CREATE_DEPARTMENT', 'department', result.rows[0].id, `Created dept ${name}`);
    res.status(201).json({ department: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Department code already exists.' });
    res.status(500).json({ error: 'Failed to create department.' });
  }
});

router.put('/departments/:id', async (req, res) => {
  const { name, code } = req.body;
  try {
    const result = await db.query(
      'UPDATE departments SET name=$1, code=$2 WHERE id=$3 RETURNING *', [name, code, req.params.id]
    );
    res.json({ department: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM departments WHERE id=$1', [req.params.id]);
    res.json({ message: 'Department deleted.' });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// ---- SEMESTERS ----
router.get('/semesters', async (req, res) => {
  try {
    const { department_id } = req.query;
    const params = department_id ? [department_id] : [];
    const where = department_id ? 'WHERE s.department_id=$1' : '';
    const result = await db.query(
      `SELECT s.*, d.name AS department_name FROM semesters s LEFT JOIN departments d ON s.department_id=d.id ${where} ORDER BY s.semester_number`,
      params
    );
    res.json({ semesters: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

router.post('/semesters', async (req, res) => {
  const { department_id, semester_number, academic_year, regulation } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO semesters (department_id, semester_number, academic_year, regulation) VALUES ($1,$2,$3,$4) RETURNING *',
      [department_id, semester_number, academic_year || '2025-2026', regulation || '2025']
    );
    await logAudit(req.admin.id, 'CREATE_SEMESTER', 'semester', result.rows[0].id, `Semester ${semester_number}`);
    res.status(201).json({ semester: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Semester already exists for this department/year.' });
    res.status(500).json({ error: 'Failed.' });
  }
});

router.delete('/semesters/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM semesters WHERE id=$1', [req.params.id]);
    res.json({ message: 'Semester deleted.' });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// ---- SUBJECTS ----
router.get('/subjects', async (req, res) => {
  try {
    const { semester_id, department_id, sort_by, sort_order } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (semester_id) { where += ` AND sub.semester_id=$${idx}`; params.push(semester_id); idx++; }
    if (department_id) { where += ` AND sem.department_id=$${idx}`; params.push(department_id); idx++; }

    const validSortColumns = {
      'subject_code': 'sub.subject_code',
      'subject_name': 'sub.subject_name',
      'credits': 'sub.credits',
      'subject_type': 'sub.subject_type'
    };
    const sortColumn = validSortColumns[sort_by] || 'sub.subject_code';
    const sortOrder = (sort_order || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const result = await db.query(
      `SELECT sub.*, sem.semester_number, sem.academic_year, d.name AS department_name,
              (fs.id IS NOT NULL) AS is_assigned, f.full_name AS assigned_faculty_name
       FROM subjects sub
       LEFT JOIN semesters sem ON sub.semester_id=sem.id
       LEFT JOIN departments d ON sem.department_id=d.id
       LEFT JOIN faculty_subjects fs ON fs.subject_id = sub.id
       LEFT JOIN faculty f ON fs.faculty_id = f.id
       ${where} ORDER BY ${sortColumn} ${sortOrder}`,
      params
    );
    res.json({ subjects: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

router.post('/subjects', async (req, res) => {
  const { semester_id, subject_code, subject_name, credits, subject_type } = req.body;
  if (!semester_id || !subject_code || !subject_name) return res.status(400).json({ error: 'Required fields missing.' });
  try {
    const result = await db.query(
      'INSERT INTO subjects (semester_id, subject_code, subject_name, credits, subject_type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [semester_id, subject_code.toUpperCase(), subject_name, credits || 3, subject_type || 'theory']
    );
    const subject = result.rows[0];

    // Auto-enroll existing students in this semester into this new subject
    const students = await db.query('SELECT id FROM students WHERE semester_id = $1', [semester_id]);
    for (const stud of students.rows) {
      await db.query(
        'INSERT INTO student_subjects (student_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [stud.id, subject.id]
      );
    }

    await logAudit(req.admin.id, 'CREATE_SUBJECT', 'subject', subject.id, `${subject_code} - ${subject_name}`);
    res.status(201).json({ subject });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Subject code already exists.' });
    res.status(500).json({ error: 'Failed.' });
  }
});

router.put('/subjects/:id', async (req, res) => {
  const { subject_code, subject_name, credits, subject_type } = req.body;
  try {
    const result = await db.query(
      'UPDATE subjects SET subject_code=$1, subject_name=$2, credits=$3, subject_type=$4 WHERE id=$5 RETURNING *',
      [subject_code, subject_name, credits, subject_type, req.params.id]
    );
    res.json({ subject: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

router.delete('/subjects/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM subjects WHERE id=$1', [req.params.id]);
    res.json({ message: 'Subject deleted.' });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

module.exports = router;
