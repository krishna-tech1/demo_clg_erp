const { Pool } = require('pg');
require('dotenv').config();

// Standard connection string from Neon database
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL is not set in environment variables. Database connections will fail.");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Neon secure serverless postgres connection
  }
});

// Database migrations
pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS is_hall_ticket_released BOOLEAN DEFAULT FALSE;')
  .then(() => console.log('Database migrated successfully: Checked is_hall_ticket_released column.'))
  .catch(err => console.error('Database migration failed:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
