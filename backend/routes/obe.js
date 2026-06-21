const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

// GET /api/admin/obe/cos
router.get('/cos', async (req, res) => {
  try {
    const { subject_id } = req.query;
    const params = subject_id ? [subject_id] : [];
    const where = subject_id ? 'WHERE co.subject_id=$1' : '';
    const result = await db.query(
      `SELECT co.*, sub.subject_code, sub.subject_name, f.full_name AS faculty_name
       FROM course_outcomes co
       LEFT JOIN subjects sub ON co.subject_id=sub.id
       LEFT JOIN faculty f ON co.created_by=f.id
       ${where} ORDER BY co.subject_id, co.co_number`,
      params
    );
    res.json({ course_outcomes: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// POST /api/admin/obe/cos
router.post('/cos', async (req, res) => {
  const { subject_id, co_number, description } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO course_outcomes (subject_id, co_number, description) VALUES ($1,$2,$3)
       ON CONFLICT (subject_id, co_number) DO UPDATE SET description=$3 RETURNING *`,
      [subject_id, co_number, description]
    );
    res.status(201).json({ co: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// GET /api/admin/obe/co-po
router.get('/co-po', async (req, res) => {
  try {
    const { subject_id } = req.query;
    const params = subject_id ? [subject_id] : [];
    const where = subject_id ? 'WHERE co.subject_id=$1' : '';
    const result = await db.query(
      `SELECT cpm.*, co.co_number, co.description AS co_description, co.subject_id,
              sub.subject_code
       FROM co_po_mappings cpm
       LEFT JOIN course_outcomes co ON cpm.co_id=co.id
       LEFT JOIN subjects sub ON co.subject_id=sub.id
       ${where} ORDER BY co.co_number, cpm.po_number`,
      params
    );
    res.json({ mappings: result.rows });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// POST /api/admin/obe/co-po
router.post('/co-po', async (req, res) => {
  const { co_id, po_number, mapping_value } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO co_po_mappings (co_id, po_number, mapping_value) VALUES ($1,$2,$3)
       ON CONFLICT (co_id, po_number) DO UPDATE SET mapping_value=$3 RETURNING *`,
      [co_id, po_number, mapping_value]
    );
    res.json({ mapping: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// GET /api/admin/obe/attainment
router.get('/attainment', async (req, res) => {
  try {
    const { subject_id } = req.query;
    if (!subject_id) return res.status(400).json({ error: 'subject_id required.' });

    const cos = await db.query(
      'SELECT * FROM course_outcomes WHERE subject_id=$1 ORDER BY co_number', [subject_id]
    );
    const mappings = await db.query(
      `SELECT cpm.*, co.co_number FROM co_po_mappings cpm
       JOIN course_outcomes co ON cpm.co_id=co.id
       WHERE co.subject_id=$1 ORDER BY co.co_number, cpm.po_number`, [subject_id]
    );

    // Simple attainment: % of students who passed the subject (scored >= 50)
    const studentPerf = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN final_score>=50 THEN 1 ELSE 0 END) AS above_target
       FROM results WHERE subject_id=$1 AND is_published=true`, [subject_id]
    );
    const perf = studentPerf.rows[0];
    const attainmentLevel = perf.total > 0
      ? Math.min(3, Math.round((perf.above_target / perf.total) * 3))
      : 0;

    res.json({
      course_outcomes: cos.rows,
      co_po_mappings: mappings.rows,
      attainment_level: attainmentLevel,
      student_performance: perf
    });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

module.exports = router;
