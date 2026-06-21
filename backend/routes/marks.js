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

const calcGrade = (score) => {
  if (score >= 91) return 'O';
  if (score >= 81) return 'A+';
  if (score >= 71) return 'A';
  if (score >= 61) return 'B+';
  if (score >= 50) return 'B';
  if (score >= 45) return 'RA';
  return 'U';
};

// ---- INTERNAL MARKS ----
// GET /api/admin/marks/internal
router.get('/internal', async (req, res) => {
  try {
    const { subject_id, semester_id, department_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (subject_id) { where += ` AND im.subject_id=$${idx}`; params.push(subject_id); idx++; }
    if (semester_id) { where += ` AND sem.id=$${idx}`; params.push(semester_id); idx++; }
    if (department_id) { where += ` AND d.id=$${idx}`; params.push(department_id); idx++; }

    const result = await db.query(
      `SELECT im.*, s.full_name AS student_name, s.register_number,
              sub.subject_code, sub.subject_name, sem.semester_number, d.name AS dept_name
       FROM internal_marks im
       LEFT JOIN students s ON im.student_id=s.id
       LEFT JOIN subjects sub ON im.subject_id=sub.id
       LEFT JOIN semesters sem ON sub.semester_id=sem.id
       LEFT JOIN departments d ON sem.department_id=d.id
       ${where} ORDER BY s.register_number`,
      params
    );
    res.json({ marks: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// POST /api/admin/marks/internal (upsert)
router.post('/internal', async (req, res) => {
  const { student_id, subject_id, model1_marks, model2_marks, practical_marks } = req.body;
  if (!student_id || !subject_id) return res.status(400).json({ error: 'student_id and subject_id required.' });
  try {
    const result = await db.query(
      `INSERT INTO internal_marks (student_id, subject_id, model1_marks, model2_marks, practical_marks)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (student_id, subject_id) DO UPDATE
       SET model1_marks=$3, model2_marks=$4, practical_marks=$5, updated_at=NOW()
       RETURNING *`,
      [student_id, subject_id, model1_marks || 0, model2_marks || 0, practical_marks || 0]
    );
    await logAudit(req.admin.id, 'ENTER_INTERNAL_MARKS', 'internal_marks', result.rows[0].id, `Internal marks for student ${student_id}, subject ${subject_id}`);
    res.json({ marks: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed.' });
  }
});

// ---- EXTERNAL MARKS ----
router.get('/external', async (req, res) => {
  try {
    const { subject_id, semester_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (subject_id) { where += ` AND em.subject_id=$${idx}`; params.push(subject_id); idx++; }
    if (semester_id) { where += ` AND sem.id=$${idx}`; params.push(semester_id); idx++; }

    const result = await db.query(
      `SELECT em.*, s.full_name AS student_name, s.register_number,
              sub.subject_code, sub.subject_name, sem.semester_number
       FROM external_marks em
       LEFT JOIN students s ON em.student_id=s.id
       LEFT JOIN subjects sub ON em.subject_id=sub.id
       LEFT JOIN semesters sem ON sub.semester_id=sem.id
       ${where} ORDER BY s.register_number`,
      params
    );
    res.json({ marks: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// POST /api/admin/marks/external (upsert)
router.post('/external', async (req, res) => {
  const { student_id, subject_id, marks_obtained } = req.body;
  if (!student_id || !subject_id) return res.status(400).json({ error: 'student_id and subject_id required.' });
  try {
    const result = await db.query(
      `INSERT INTO external_marks (student_id, subject_id, marks_obtained, entered_by)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (student_id, subject_id) DO UPDATE
       SET marks_obtained=$3, entered_by=$4, updated_at=NOW()
       RETURNING *`,
      [student_id, subject_id, marks_obtained || 0, req.admin.id]
    );
    await logAudit(req.admin.id, 'ENTER_EXTERNAL_MARKS', 'external_marks', result.rows[0].id, `External marks for student ${student_id}, subject ${subject_id}`);
    res.json({ marks: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// ---- COMPUTE RESULTS ----
// POST /api/admin/marks/compute-results
router.post('/compute-results', async (req, res) => {
  const { subject_id } = req.body;
  try {
    // Get all students for the subject with both marks
    const marksData = await db.query(
      `SELECT im.student_id, im.subject_id, im.internal_total, em.external_total
       FROM internal_marks im
       LEFT JOIN external_marks em ON em.student_id=im.student_id AND em.subject_id=im.subject_id
       WHERE im.subject_id=$1`,
      [subject_id]
    );

    let count = 0;
    for (const row of marksData.rows) {
      const internalTotal = parseFloat(row.internal_total) || 0;
      const externalTotal = parseFloat(row.external_total) || 0;
      const finalScore = internalTotal + externalTotal;
      const grade = calcGrade(finalScore);
      const passFail = externalTotal >= 30 && finalScore >= 50 ? 'Pass' : 'Fail';

      await db.query(
        `INSERT INTO results (student_id, subject_id, internal_total, external_total, grade, pass_fail)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (student_id, subject_id) DO UPDATE
         SET internal_total=$3, external_total=$4, grade=$5, pass_fail=$6, is_published=false`,
        [row.student_id, row.subject_id, internalTotal, externalTotal, grade, passFail]
      );
      count++;
    }

    await logAudit(req.admin.id, 'COMPUTE_RESULTS', 'results', null, `Computed results for subject ${subject_id}, ${count} records`);
    res.json({ message: `Results computed for ${count} students.`, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute results.' });
  }
});

module.exports = router;
