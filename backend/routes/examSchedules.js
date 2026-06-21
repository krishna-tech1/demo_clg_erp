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

// GET /api/admin/exam-schedules
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT es.*, sub.subject_code, sub.subject_name, sub.subject_type,
              sem.semester_number, d.name AS department_name
       FROM exam_schedules es
       LEFT JOIN subjects sub ON es.subject_id = sub.id
       LEFT JOIN semesters sem ON sub.semester_id = sem.id
       LEFT JOIN departments d ON sem.department_id = d.id
       ORDER BY es.exam_date, es.session`
    );
    res.json({ schedules: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// POST /api/admin/exam-schedules
router.post('/', async (req, res) => {
  const { subject_id, exam_date, session, start_time, end_time, venue } = req.body;
  if (!subject_id || !exam_date) return res.status(400).json({ error: 'Subject and date required.' });
  try {
    const result = await db.query(
      `INSERT INTO exam_schedules (subject_id, exam_date, session, start_time, end_time, venue)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [subject_id, exam_date, session || 'FN', start_time || null, end_time || null, venue || null]
    );
    await logAudit(req.admin.id, 'CREATE_EXAM_SCHEDULE', 'exam_schedule', result.rows[0].id, `Exam for subject ${subject_id} on ${exam_date}`);
    res.status(201).json({ schedule: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// PUT /api/admin/exam-schedules/:id
router.put('/:id', async (req, res) => {
  const { subject_id, exam_date, session, start_time, end_time, venue } = req.body;
  try {
    const result = await db.query(
      `UPDATE exam_schedules SET subject_id=$1, exam_date=$2, session=$3, start_time=$4, end_time=$5, venue=$6
       WHERE id=$7 RETURNING *`,
      [subject_id, exam_date, session, start_time || null, end_time || null, venue || null, req.params.id]
    );
    res.json({ schedule: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// DELETE /api/admin/exam-schedules/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM exam_schedules WHERE id=$1', [req.params.id]);
    res.json({ message: 'Schedule deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// PUT /api/admin/exam-schedules/:id/publish
router.put('/:id/publish', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE exam_schedules SET is_published=true WHERE id=$1 RETURNING *', [req.params.id]
    );
    await logAudit(req.admin.id, 'PUBLISH_EXAM_SCHEDULE', 'exam_schedule', req.params.id, `Published exam schedule`);
    res.json({ schedule: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// PUT /api/admin/exam-schedules/publish-all
router.put('/publish-all', async (req, res) => {
  try {
    await db.query('UPDATE exam_schedules SET is_published=true WHERE is_published=false');
    await logAudit(req.admin.id, 'PUBLISH_ALL_SCHEDULES', 'exam_schedule', null, 'Published all exam schedules');
    res.json({ message: 'All schedules published.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

module.exports = router;
