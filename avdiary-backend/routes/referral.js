const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/referral – user's referral info
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's own info
    const [[user]] = await pool.execute(
      'SELECT referral_code, points FROM users WHERE id = ?',
      [userId]
    );

    // Get list of friends who joined using this user's referral code
    const [friends] = await pool.execute(
      `SELECT u.name, u.email, u.created_at, u.subscription_tier
       FROM users u
       WHERE u.referred_by = ?
       ORDER BY u.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      referralCode: user.referral_code,
      points: user.points,
      friends,
    });
  } catch (error) {
    console.error('Referral GET error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;