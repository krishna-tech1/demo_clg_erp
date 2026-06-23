const express = require('express');
const db = require('../db');
const { authenticateStudent } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateStudent);

// GET /api/student/profile - Get profile & enrolled subjects
router.get('/profile', async (req, res) => {
  try {
    const student = await db.query(
      `SELECT s.id, s.register_number, s.full_name, s.email, s.date_of_birth, s.phone,
              d.name AS department_name, d.code AS dept_code,
              sem.semester_number, sem.academic_year
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN semesters sem ON s.semester_id = sem.id
       WHERE s.id = $1`,
      [req.student.id]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const subjects = await db.query(
      `SELECT sub.*, f.full_name AS teacher_name, f.email AS teacher_email
       FROM subjects sub
       JOIN students s ON s.semester_id = sub.semester_id
       LEFT JOIN faculty_subjects fs ON fs.subject_id = sub.id
       LEFT JOIN faculty f ON fs.faculty_id = f.id
       WHERE s.id = $1`,
      [req.student.id]
    );

    res.json({ student: student.rows[0], subjects: subjects.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student profile.' });
  }
});

// GET /api/student/hall-ticket - View hall ticket details (only if exam schedules exist)
router.get('/hall-ticket', async (req, res) => {
  try {
    const studentInfo = await db.query(
      `SELECT s.id, s.register_number, s.full_name, d.name AS department_name
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE s.id = $1`,
      [req.student.id]
    );

    if (studentInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const schedules = await db.query(
      `SELECT sub.subject_code, sub.subject_name, sub.credits,
              es.exam_date, es.session, es.start_time, es.end_time, es.venue, es.is_published
       FROM student_subjects ss
       JOIN subjects sub ON ss.subject_id = sub.id
       LEFT JOIN exam_schedules es ON es.subject_id = sub.id
       WHERE ss.student_id = $1 AND (es.is_published = TRUE OR es.is_published IS NULL)`,
      [req.student.id]
    );

    res.json({ student: studentInfo.rows[0], schedules: schedules.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate hall ticket.' });
  }
});

// GET /api/student/results - View published results
router.get('/results', async (req, res) => {
  try {
    const results = await db.query(
      `SELECT sub.subject_code, sub.subject_name, sub.credits,
              r.internal_total, r.external_total, r.final_score, r.grade, r.pass_fail, r.is_published
       FROM results r
       JOIN subjects sub ON r.subject_id = sub.id
       WHERE r.student_id = $1 AND r.is_published = TRUE`,
      [req.student.id]
    );

    res.json({ results: results.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch results.' });
  }
});

module.exports = router;
