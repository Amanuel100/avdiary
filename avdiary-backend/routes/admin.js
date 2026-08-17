const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.execute('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ activeSubscribers }]] = await pool.execute(
      'SELECT COUNT(*) AS activeSubscribers FROM users WHERE subscription_tier != "free" AND subscription_expiry > NOW()'
    );
    const [[{ pendingPayments }]] = await pool.execute(
      "SELECT COUNT(*) AS pendingPayments FROM payments WHERE status = 'pending'"
    );
    const [[{ totalRevenue }]] = await pool.execute(
      "SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM payments WHERE status = 'confirmed'"
    );
    return res.status(200).json({ totalUsers, activeSubscribers, pendingPayments, totalRevenue });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, subscription_tier, subscription_expiry, points FROM users ORDER BY created_at DESC'
    );
    return res.status(200).json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/payments
router.get('/payments', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.user_id, p.plan, p.amount, p.transaction_id, p.screenshot_url, p.status,
              u.name AS user_name, u.email AS user_email
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at ASC`
    );
    return res.status(200).json({ payments: rows });
  } catch (error) {
    console.error('Admin payments GET error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/admin/payments – confirm or reject a payment, AWARD POINTS
router.put('/payments', requireAdmin, async (req, res) => {
  try {
    const { paymentId, action } = req.body;
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

        // Award points to the subscriber
        const pointsToAdd = { '1_month': 100, '4_months': 300, '1_year': 600 }[payment.plan] || 0;
        await connection.execute(
          'UPDATE users SET points = points + ? WHERE id = ?',
          [pointsToAdd, payment.user_id]
        );

        // Award 100 pts to the referrer (if this user was referred)
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

// POST /api/admin/message-all – send a message to every user
router.post('/message-all', requireAdmin, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Get all user IDs
    const [users] = await pool.execute('SELECT id FROM users');
    const ids = users.map(u => u.id);

    // Insert a message for each user in a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const userId of ids) {
        const id = uuidv4();
        await connection.execute(
          'INSERT INTO messages (id, user_id, type, content) VALUES (?, ?, ?, ?)',
          [id, userId, 'admin', content]
        );
      }
      await connection.commit();
      connection.release();
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }

    return res.status(200).json({ message: `Message sent to ${ids.length} users` });
  } catch (error) {
    console.error('Admin message-all error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
// PUT /api/admin/users/:id/points – update points
router.put('/users/:id/points', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;

    if (points === undefined || points === null || isNaN(points) || points < 0) {
      return res.status(400).json({ message: 'Valid points value is required' });
    }

    const [result] = await pool.execute(
      'UPDATE users SET points = ? WHERE id = ?',
      [parseInt(points, 10), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Points updated' });
  } catch (error) {
    console.error('Admin update points error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
module.exports = router;