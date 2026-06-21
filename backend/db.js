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

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
