// Creates the rattlertech database, its tables, and sample data.
// Usage: npm run db:init
// (Same result as running db/schema.sql then db/seed.sql in MySQL Workbench.)
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  // Connect WITHOUT a database selected, because schema.sql creates it.
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  for (const file of ['schema.sql', 'seed.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'db', file), 'utf8');
    await connection.query(sql);
    console.log(`Ran db/${file}`);
  }

  await connection.end();
  console.log('Database "rattlertech" is ready.');
}

main().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
