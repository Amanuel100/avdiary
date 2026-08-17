process.env.UV_THREADPOOL_SIZE = 64;

// … rest of your imports
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');                // MySQL connection
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors({
  origin: 'http://localhost:3000',           // your Vite frontend
  credentials: true,
}));
app.use('/api/calendar', require('./routes/calendar'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));                     // parse JSON bodies
app.use('/uploads', express.static('uploads')); // serve uploaded files

// ---------- Public routes ----------
app.use('/api/auth', require('./routes/auth'));

// ---------- Protected routes (JWT required) ----------
app.use('/api/trades',   authenticateToken, require('./routes/trades'));
app.use('/api/messages', authenticateToken, require('./routes/messages'));
app.use('/api/payments', authenticateToken, require('./routes/payments'));
app.use('/api/admin',    authenticateToken, require('./routes/admin'));
app.use('/api/referral', authenticateToken, require('./routes/referral'));
app.use('/api/ai', require('./routes/ai'));
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
  console.log(`✅ AvDiary backend running on http://localhost:${PORT}`);
});