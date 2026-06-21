const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  try {
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, full_name: admin.full_name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await db.query(
      `INSERT INTO audit_logs (user_type, user_id, action, details) VALUES ('admin', $1, 'LOGIN', 'Admin logged in')`,
      [admin.id]
    );

    res.json({ token, admin: { id: admin.id, username: admin.username, full_name: admin.full_name, email: admin.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;
