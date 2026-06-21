const express = require('express');
const cors = require('cors');
const db = require('./db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Examination ERP Backend is running.' });
});

// Test DB connection
app.get('/api/db-check', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: 'success', message: 'Connected to Neon PostgreSQL!', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'DB connection failed.', error: error.message });
  }
});

// Admin routes
app.use('/api/admin/auth', require('./routes/auth'));
app.use('/api/admin/dashboard', require('./routes/dashboard'));
app.use('/api/admin/students', require('./routes/students'));
app.use('/api/admin/faculty', require('./routes/faculty'));
app.use('/api/admin/curriculum', require('./routes/curriculum'));
app.use('/api/admin/exam-schedules', require('./routes/examSchedules'));
app.use('/api/admin/marks', require('./routes/marks'));
app.use('/api/admin/results', require('./routes/results'));
app.use('/api/admin/obe', require('./routes/obe'));
app.use('/api/admin/audit', require('./routes/audit'));

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Examination ERP Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   DB Check: http://localhost:${PORT}/api/db-check`);
});
