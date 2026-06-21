const express = require('express');
const db = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

// GET /api/admin/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [students, faculty, subjects, departments, pendingResults, publishedResults, examSchedules] = await Promise.all([
      db.query('SELECT COUNT(*) FROM students'),
      db.query('SELECT COUNT(*) FROM faculty'),
      db.query('SELECT COUNT(*) FROM subjects'),
      db.query('SELECT COUNT(*) FROM departments'),
      db.query('SELECT COUNT(*) FROM results WHERE is_published = false'),
      db.query('SELECT COUNT(*) FROM results WHERE is_published = true'),
      db.query('SELECT COUNT(*) FROM exam_schedules WHERE is_published = true AND exam_date >= CURRENT_DATE'),
    ]);

    const passCount = await db.query("SELECT COUNT(*) FROM results WHERE pass_fail = 'Pass' AND is_published = true");
    const failCount = await db.query("SELECT COUNT(*) FROM results WHERE pass_fail = 'Fail' AND is_published = true");

    // Recent audit logs
    const recentAudit = await db.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      stats: {
        students: parseInt(students.rows[0].count),
        faculty: parseInt(faculty.rows[0].count),
        subjects: parseInt(subjects.rows[0].count),
        departments: parseInt(departments.rows[0].count),
        pendingResults: parseInt(pendingResults.rows[0].count),
        publishedResults: parseInt(publishedResults.rows[0].count),
        upcomingExams: parseInt(examSchedules.rows[0].count),
        passCount: parseInt(passCount.rows[0].count),
        failCount: parseInt(failCount.rows[0].count),
      },
      recentActivity: recentAudit.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard stats.' });
  }
});

module.exports = router;
