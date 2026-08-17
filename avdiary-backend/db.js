const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'avdiary',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 150,
  queueLimit: 50,
  dateStrings: true,            // ← ADD THIS LINE
});

module.exports = pool;