const mysql = require('mysql2/promise');
require('dotenv').config();

const isProduction = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'avdiary',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 150,           // high enough for both dev and production
  queueLimit: 50,
  dateStrings: true,              // keep dates as strings, avoids timezone issues
  ssl: isProduction
    ? { rejectUnauthorized: true }  // required for Aiven / PlanetScale / cloud MySQL
    : false,                        // no SSL for local XAMPP
});

module.exports = pool;