const db = require('../db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function initDb() {
  console.log('🗄️  Initializing database schema...');
  
  // Read and run schema
  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await db.query(schema);
  console.log('✅ Schema created successfully.');

  // Seed admin user
  const adminHash = await bcrypt.hash('12341234', 10);
  await db.query(
    `INSERT INTO admins (username, password_hash, full_name, email) 
     VALUES ('admin', $1, 'System Administrator', 'admin@examination.edu')
     ON CONFLICT (username) DO NOTHING`,
    [adminHash]
  );
  console.log('✅ Admin user seeded (username: admin, password: 12341234)');

  // Seed a sample department
  await db.query(
    `INSERT INTO departments (name, code) VALUES 
     ('Computer Science and Engineering', 'CSE'),
     ('Electronics and Communication Engineering', 'ECE'),
     ('Mechanical Engineering', 'MECH')
     ON CONFLICT (code) DO NOTHING`
  );
  console.log('✅ Sample departments seeded.');

  // Seed semesters for CSE
  const cseResult = await db.query("SELECT id FROM departments WHERE code='CSE'");
  if (cseResult.rows.length > 0) {
    const cseId = cseResult.rows[0].id;
    for (let i = 1; i <= 8; i++) {
      await db.query(
        `INSERT INTO semesters (department_id, semester_number, academic_year, regulation)
         VALUES ($1, $2, '2025-2026', '2025') ON CONFLICT (department_id, semester_number, academic_year) DO NOTHING`,
        [cseId, i]
      );
    }
    console.log('✅ Semesters seeded for CSE (1-8).');

    // Seed sample Semester 3 subjects (Anna University 2025)
    const sem3 = await db.query(
      "SELECT id FROM semesters WHERE department_id=$1 AND semester_number=3", [cseId]
    );
    if (sem3.rows.length > 0) {
      const sem3Id = sem3.rows[0].id;
      const subjects = [
        ['CS3351', 'Data Structures', 4, 'theory'],
        ['MA3354', 'Probability and Statistics', 4, 'theory'],
        ['EC3352', 'Digital Systems', 3, 'theory'],
        ['CS3352', 'Fundamentals of Data Science', 3, 'theory'],
        ['CS3391', 'Object Oriented Programming', 3, 'theory'],
        ['CS3381', 'Data Structures Laboratory', 2, 'practical'],
        ['CS3382', 'Digital Systems Laboratory', 2, 'practical'],
      ];
      for (const [code, name, credits, type] of subjects) {
        await db.query(
          `INSERT INTO subjects (semester_id, subject_code, subject_name, credits, subject_type)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT (subject_code) DO NOTHING`,
          [sem3Id, code, name, credits, type]
        );
      }
      console.log('✅ Sample CSE Semester 3 subjects seeded.');
    }
  }

  console.log('\n🎉 Database initialized successfully!');
  console.log('   Admin Login: username=admin, password=12341234\n');
  process.exit(0);
}

initDb().catch(err => {
  console.error('❌ Error initializing database:', err.message);
  process.exit(1);
});
