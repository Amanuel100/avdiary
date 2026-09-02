process.env.UV_THREADPOOL_SIZE = 64;

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- CORS Configuration ----------
const allowedOrigins = [
  'https://avdiary.com.et',
  'https://www.avdiary.com.et',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://avdiary-3726.vercel.app',   // ← add your specific Vercel URL
  // Optionally allow all Vercel previews:
  // 'https://*.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ... rest of server.js unchanged

// ---------- Body parsing ----------
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// ---------- Static files (uploads) ----------
app.use('/uploads', express.static('uploads'));

// ---------- Public routes ----------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/ai', require('./routes/ai'));          // AI routes may need auth but they have their own

// ---------- Protected routes (JWT required) ----------
app.use('/api/trades',   authenticateToken, require('./routes/trades'));
app.use('/api/messages', authenticateToken, require('./routes/messages'));
app.use('/api/payments', authenticateToken, require('./routes/payments'));
app.use('/api/admin',    authenticateToken, require('./routes/admin'));
app.use('/api/referral', authenticateToken, require('./routes/referral'));

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AvDiary API is running' });
});

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`✅ AvDiary backend running on port ${PORT}`);
});