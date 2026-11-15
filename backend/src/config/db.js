// MySQL connection pool.
// A pool keeps several connections open and reuses them, which is faster
// and safer than opening a new connection for every request.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'rattlertech',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // return DATETIME/TIMESTAMP as strings, e.g. "2026-11-15 10:30:00"
});

async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

module.exports = { pool, testConnection };
