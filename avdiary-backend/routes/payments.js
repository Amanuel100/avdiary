const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const multer = require('multer');
const path = require('path');

// Multer setup for screenshot upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `payment-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/payments – user's payment status (unchanged)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const [payments] = await pool.execute(
      'SELECT id, plan, amount, status, admin_message, created_at FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    const [users] = await pool.execute('SELECT subscription_tier, subscription_expiry FROM users WHERE id = ?', [userId]);
    const user = users[0];
    const active = user?.subscription_expiry && new Date(user.subscription_expiry) > new Date();

    return res.status(200).json({
      status: payments.length > 0 ? payments[0].status : null,
      active,
      plan: user?.subscription_tier || 'free',
      expiry: user?.subscription_expiry || null,
      adminMessage: payments.length > 0 ? payments[0].admin_message : null,
    });
  } catch (error) {
    console.error('Payments GET error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/payments – submit payment (unchanged)
router.post('/', upload.single('screenshot'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, amount, transactionId } = req.body;
    const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const id = uuidv4();
    await pool.execute(
      'INSERT INTO payments (id, user_id, plan, amount, transaction_id, screenshot_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, plan, amount, transactionId, screenshotUrl, 'pending']
    );
    return res.status(201).json({ message: 'Payment submitted' });
  } catch (error) {
    console.error('Payments POST error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Confirm / reject payment (admin only) – NOW awards points
router.put('/confirm', async (req, res) => {
  try {
    const { paymentId, action } = req.body; // action: 'confirm' or 'reject'
    if (!paymentId || !['confirm', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const [[payment]] = await pool.execute('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payment || payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update payment status
      await connection.execute(
        'UPDATE payments SET status = ? WHERE id = ?',
        [action === 'confirm' ? 'confirmed' : 'rejected', paymentId]
      );

      if (action === 'confirm') {
        // Set subscription duration
        const durations = { '1_month': 30, '4_months': 120, '1_year': 365 };
        const days = durations[payment.plan] || 30;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + days);

        // Update user subscription
        await connection.execute(
          'UPDATE users SET subscription_tier = ?, subscription_expiry = ? WHERE id = ?',
          [payment.plan, expiry, payment.user_id]
        );

        // Award points to the subscriber based on plan
        const pointsToAdd = { '1_month': 100, '4_months': 300, '1_year': 600 }[payment.plan] || 0;
        await connection.execute(
          'UPDATE users SET points = points + ? WHERE id = ?',
          [pointsToAdd, payment.user_id]
        );

        // Award points to the referrer (if this user was referred)
        const [[referredUser]] = await connection.execute(
          'SELECT referred_by FROM users WHERE id = ?',
          [payment.user_id]
        );
        if (referredUser && referredUser.referred_by) {
          await connection.execute(
            'UPDATE users SET points = points + 100 WHERE id = ?',
            [referredUser.referred_by]
          );
        }
      }

      await connection.commit();
      connection.release();
      return res.status(200).json({ message: `Payment ${action}ed` });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Admin payments PUT error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;