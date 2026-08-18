const mysql = require('mysql2/promise');
require('dotenv').config();

const isProduction = process.env.DB_SSL === 'true';

// Option 1 (simple, but less secure): skip certificate validation
const sslOptions = isProduction
  ? { rejectUnauthorized: false }   // works immediately with Aiven
  : false;

// Option 2 (more secure): use the CA certificate from Aiven
// If you choose Option 2, download the CA and uncomment the lines below.
// const fs = require('fs');
// const sslOptions = isProduction
//   ? { ca: fs.readFileSync('path/to/aiven-ca.pem') }
//   : false;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'avdiary',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 150,
  queueLimit: 50,
  dateStrings: true,
  ssl: sslOptions,
});

module.exports = pool;