const express = require('express');
const db = require('../db');
const { authenticateFaculty } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateFaculty);

// Helper for audit logs
const logAudit = async (facultyId, action, entityType, entityId, details) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_type, user_id, action, entity_type, entity_id, details) 
       VALUES ('faculty', $1, $2, $3, $4, $5)`,
      [facultyId, action, entityType, entityId, details]
    );
  } catch (e) {
    console.error('Audit log error:', e);
  }
};

// GET /api/faculty/subjects - View assigned subjects
router.get('/subjects', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, sem.semester_number, sem.academic_year, d.name AS department_name
       FROM subjects s
       JOIN faculty_subjects fs ON fs.subject_id = s.id
       JOIN semesters sem ON s.semester_id = sem.id
       JOIN departments d ON sem.department_id = d.id
       WHERE fs.faculty_id = $1`,
      [req.faculty.id]
    );
    res.json({ subjects: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assigned subjects.' });
  }
});

// GET /api/faculty/subjects/:subjectId/students - View students enrolled in a subject with their marks
router.get('/subjects/:subjectId/students', async (req, res) => {
  try {
    const subjectId = req.params.subjectId;
    
    // Verify subject is assigned to this faculty
    const assignmentCheck = await db.query(
      'SELECT id FROM faculty_subjects WHERE faculty_id = $1 AND subject_id = $2',
      [req.faculty.id, subjectId]
    );
    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You are not assigned to this subject.' });
    }

    const students = await db.query(
      `SELECT s.id AS student_id, s.register_number, s.full_name, s.email,
              im.model1_marks, im.model2_marks, im.practical_marks, im.internal_total
       FROM students s
       JOIN student_subjects ss ON ss.student_id = s.id
       LEFT JOIN internal_marks im ON im.student_id = s.id AND im.subject_id = $1
       WHERE ss.subject_id = $1
       ORDER BY s.register_number ASC`,
      [subjectId]
    );

    res.json({ students: students.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students for this subject.' });
  }
});

// POST /api/faculty/marks - Save/enter internal and practical marks
router.post('/marks', async (req, res) => {
  const { student_id, subject_id, model1_marks, model2_marks, practical_marks } = req.body;
  if (!student_id || !subject_id) {
    return res.status(400).json({ error: 'Student ID and Subject ID are required.' });
  }

  try {
    // Verify assignment
    const assignmentCheck = await db.query(
      'SELECT id FROM faculty_subjects WHERE faculty_id = $1 AND subject_id = $2',
      [req.faculty.id, subject_id]
    );
    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You are not assigned to this subject.' });
    }

    const result = await db.query(
      `INSERT INTO internal_marks (student_id, subject_id, model1_marks, model2_marks, practical_marks, entered_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (student_id, subject_id) 
       DO UPDATE SET 
         model1_marks = EXCLUDED.model1_marks,
         model2_marks = EXCLUDED.model2_marks,
         practical_marks = EXCLUDED.practical_marks,
         entered_by = EXCLUDED.entered_by,
         updated_at = NOW()
       RETURNING *`,
      [
        student_id, 
        subject_id, 
        model1_marks !== undefined ? model1_marks : 0, 
        model2_marks !== undefined ? model2_marks : 0, 
        practical_marks !== undefined ? practical_marks : 0,
        req.faculty.id
      ]
    );

    await logAudit(
      req.faculty.id, 
      'ENTER_MARKS', 
      'internal_marks', 
      result.rows[0].id, 
      `Entered marks for student ${student_id} in subject ${subject_id}`
    );

    res.json({ message: 'Marks saved successfully.', marks: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save marks.' });
  }
});

// GET /api/faculty/subjects/:subjectId/cos - View Course Outcomes
router.get('/subjects/:subjectId/cos', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const result = await db.query(
      'SELECT * FROM course_outcomes WHERE subject_id = $1 ORDER BY co_number ASC',
      [subjectId]
    );
    res.json({ cos: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Course Outcomes.' });
  }
});

// POST /api/faculty/cos - Define Course Outcomes
router.post('/cos', async (req, res) => {
  const { subject_id, co_number, description } = req.body;
  if (!subject_id || !co_number || !description) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO course_outcomes (subject_id, co_number, description, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (subject_id, co_number)
       DO UPDATE SET description = EXCLUDED.description, created_by = EXCLUDED.created_by
       RETURNING *`,
      [subject_id, co_number, description, req.faculty.id]
    );
    res.json({ message: 'Course outcome saved.', co: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save course outcome.' });
  }
});

// GET /api/faculty/subjects/:subjectId/co-po - View CO-PO mappings
router.get('/subjects/:subjectId/co-po', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const result = await db.query(
      `SELECT cpm.*, co.co_number, co.description AS co_description
       FROM co_po_mappings cpm
       JOIN course_outcomes co ON cpm.co_id = co.id
       WHERE co.subject_id = $1
       ORDER BY co.co_number ASC, cpm.po_number ASC`,
      [subjectId]
    );
    res.json({ mappings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch CO-PO mappings.' });
  }
});

// POST /api/faculty/co-po - Save CO-PO Mapping
router.post('/co-po', async (req, res) => {
  const { co_id, po_number, mapping_value } = req.body;
  if (!co_id || !po_number || mapping_value === undefined) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO co_po_mappings (co_id, po_number, mapping_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (co_id, po_number)
       DO UPDATE SET mapping_value = EXCLUDED.mapping_value
       RETURNING *`,
      [co_id, po_number, mapping_value]
    );
    res.json({ message: 'CO-PO mapping saved.', mapping: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save mapping.' });
  }
});

// GET /api/faculty/obe/attainment - OBE Reports
router.get('/obe/attainment', async (req, res) => {
  try {
    // Simply fetch general PO performance mapped via CO-PO for the subjects assigned to the teacher
    const result = await db.query(
      `SELECT sub.subject_code, sub.subject_name, co.co_number, cpm.po_number, cpm.mapping_value
       FROM co_po_mappings cpm
       JOIN course_outcomes co ON cpm.co_id = co.id
       JOIN subjects sub ON co.subject_id = sub.id
       JOIN faculty_subjects fs ON fs.subject_id = sub.id
       WHERE fs.faculty_id = $1
       ORDER BY sub.subject_code, co.co_number, cpm.po_number`,
      [req.faculty.id]
    );
    res.json({ attainment: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch OBE attainment report.' });
  }
});

module.exports = router;
