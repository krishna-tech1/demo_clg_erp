const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password, role = 'admin' } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  try {
    let user = null;
    let payload = {};
    let auditUserType = 'admin';

    if (role === 'admin') {
      const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
      if (result.rows.length === 0)
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      
      user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ error: 'Invalid admin credentials.' });

      payload = { id: user.id, username: user.username, full_name: user.full_name, role: 'admin' };
      auditUserType = 'admin';
    } 
    else if (role === 'faculty') {
      const result = await db.query(
        'SELECT * FROM faculty WHERE faculty_id = $1 OR email = $2', 
        [username, username]
      );
      if (result.rows.length === 0)
        return res.status(401).json({ error: 'Invalid faculty credentials.' });

      user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ error: 'Invalid faculty credentials.' });

      payload = { 
        id: user.id, 
        faculty_id: user.faculty_id, 
        full_name: user.full_name, 
        email: user.email,
        department_id: user.department_id,
        role: 'faculty' 
      };
      auditUserType = 'faculty';
    } 
    else if (role === 'student') {
      const result = await db.query(
        'SELECT * FROM students WHERE register_number = $1 OR email = $2', 
        [username, username]
      );
      if (result.rows.length === 0)
        return res.status(401).json({ error: 'Invalid student credentials.' });

      user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ error: 'Invalid student credentials.' });

      payload = { 
        id: user.id, 
        register_number: user.register_number, 
        full_name: user.full_name, 
        email: user.email,
        department_id: user.department_id,
        semester_id: user.semester_id,
        role: 'student' 
      };
      auditUserType = 'student';
    } 
    else {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    // Save login to audit logs
    await db.query(
      `INSERT INTO audit_logs (user_type, user_id, action, details) VALUES ($1, $2, 'LOGIN', $3)`,
      [auditUserType, user.id, `${role} logged in: ${user.full_name}`]
    );

    // Return structured user data
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: role === 'admin' ? user.username : (role === 'faculty' ? user.faculty_id : user.register_number), 
        full_name: user.full_name, 
        email: user.email,
        role 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;

