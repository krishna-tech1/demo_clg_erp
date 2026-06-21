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

// GET /api/admin/results
router.get('/', async (req, res) => {
  try {
    const { subject_id, semester_id, is_published } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (subject_id) { where += ` AND r.subject_id=$${idx}`; params.push(subject_id); idx++; }
    if (semester_id) { where += ` AND sem.id=$${idx}`; params.push(semester_id); idx++; }
    if (is_published !== undefined) { where += ` AND r.is_published=$${idx}`; params.push(is_published === 'true'); idx++; }

    const result = await db.query(
      `SELECT r.*, s.full_name AS student_name, s.register_number,
              sub.subject_code, sub.subject_name, sem.semester_number, d.name AS dept_name
       FROM results r
       LEFT JOIN students s ON r.student_id=s.id
       LEFT JOIN subjects sub ON r.subject_id=sub.id
       LEFT JOIN semesters sem ON sub.semester_id=sem.id
       LEFT JOIN departments d ON sem.department_id=d.id
       ${where} ORDER BY s.register_number`,
      params
    );
    res.json({ results: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// PUT /api/admin/results/publish
router.put('/publish', async (req, res) => {
  const { subject_id, semester_id } = req.body;
  try {
    let where = 'WHERE is_published=false';
    const params = [req.admin.id];
    let idx = 2;
    if (subject_id) { where += ` AND subject_id=$${idx}`; params.push(subject_id); idx++; }
    if (semester_id) {
      where += ` AND subject_id IN (SELECT id FROM subjects WHERE semester_id=$${idx})`;
      params.push(semester_id); idx++;
    }

    const result = await db.query(
      `UPDATE results SET is_published=true, published_at=NOW(), published_by=$1 ${where} RETURNING id`,
      params
    );
    await logAudit(req.admin.id, 'PUBLISH_RESULTS', 'results', null, `Published ${result.rows.length} results`);
    res.json({ message: `${result.rows.length} results published.`, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish results.' });
  }
});

// GET /api/admin/results/summary
router.get('/summary', async (req, res) => {
  try {
    const { semester_id } = req.query;
    const params = semester_id ? [semester_id] : [];
    const semFilter = semester_id ? 'AND sem.id=$1' : '';

    const result = await db.query(
      `SELECT sub.subject_code, sub.subject_name,
              COUNT(*) AS total,
              SUM(CASE WHEN r.pass_fail='Pass' THEN 1 ELSE 0 END) AS passed,
              SUM(CASE WHEN r.pass_fail='Fail' THEN 1 ELSE 0 END) AS failed,
              ROUND(AVG(r.final_score),2) AS avg_score,
              ROUND(100.0*SUM(CASE WHEN r.pass_fail='Pass' THEN 1 ELSE 0 END)/NULLIF(COUNT(*),0),1) AS pass_percent
       FROM results r
       LEFT JOIN subjects sub ON r.subject_id=sub.id
       LEFT JOIN semesters sem ON sub.semester_id=sem.id
       WHERE r.is_published=true ${semFilter}
       GROUP BY sub.id, sub.subject_code, sub.subject_name
       ORDER BY sub.subject_code`,
      params
    );
    res.json({ summary: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// GET /api/admin/hall-tickets/:student_id
router.get('/hall-ticket/:student_id', async (req, res) => {
  try {
    const student = await db.query(
      `SELECT s.*, d.name AS department_name, d.code AS dept_code, sem.semester_number, sem.academic_year
       FROM students s
       LEFT JOIN departments d ON s.department_id=d.id
       LEFT JOIN semesters sem ON s.semester_id=sem.id
       WHERE s.id=$1`, [req.params.student_id]
    );
    if (student.rows.length === 0) return res.status(404).json({ error: 'Student not found.' });

    const schedules = await db.query(
      `SELECT es.*, sub.subject_code, sub.subject_name
       FROM exam_schedules es
       LEFT JOIN subjects sub ON es.subject_id=sub.id
       JOIN student_subjects ss ON ss.subject_id=es.subject_id
       WHERE ss.student_id=$1 AND es.is_published=true
       ORDER BY es.exam_date, es.session`, [req.params.student_id]
    );

    res.json({ student: student.rows[0], schedules: schedules.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

module.exports = router;
