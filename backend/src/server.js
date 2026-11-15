// RattlerTech backend entry point
require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());          // lets the React app (different port) call this API in Milestone 4
app.use(express.json());  // parses JSON request bodies into req.body

// Health check - confirms the server AND the database are up
app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/stats', require('./routes/stats'));

// 404 + error handling (must come after the routes)
app.use(notFound);
app.use(errorHandler);

// Start only after the database connection works
testConnection()
  .then(() => {
    console.log('Connected to MySQL database:', process.env.DB_NAME || 'rattlertech');
    app.listen(PORT, () => console.log(`RattlerTech API running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Could not connect to MySQL:', err.message);
    console.error('Check your .env settings and that MySQL is running (then run: npm run db:init).');
    process.exit(1);
  });
