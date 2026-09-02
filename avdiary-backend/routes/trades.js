const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');

// ---------- GET /api/trades ----------
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const [trades] = await pool.execute(
      `SELECT id, pair, position, pnl, session, date, start_time, end_time,
              tradingview_url, influence, emotion, notes, screenshot_url,
              risk_reward AS rr, tp_type, sl_type, breakeven,
              exit_type, exit_method
       FROM trades
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT ? OFFSET ?`,
      [userId, limit.toString(), offset.toString()]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM trades WHERE user_id = ?',
      [userId]
    );

    return res.status(200).json({
      trades,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Trades GET error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- POST /api/trades ----------
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      pair, position, pnl, session,
      start_time, end_time, tradingview_url,
      influence, emotion, notes, screenshot_url,
      risk_reward, tp_type, sl_type, breakeven,
      exit_type, exit_method
    } = req.body;

    if (!pair || !position) {
      return res.status(400).json({ message: 'Pair and position are required.' });
    }

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO trades (id, user_id, pair, position, pnl, session, date, start_time, end_time,
        tradingview_url, influence, emotion, notes, screenshot_url,
        risk_reward, tp_type, sl_type, breakeven,
        exit_type, exit_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, pair.toUpperCase(), position.toUpperCase(), pnl || 0, session || null,
        start_time || null, start_time || null, end_time || null,
        tradingview_url || null, influence || null, emotion || null, notes || null, screenshot_url || null,
        risk_reward || null, tp_type || null, sl_type || null, breakeven ? 1 : 0,
        exit_type || null, exit_method || null
      ]
    );

    return res.status(201).json({ message: 'Trade added', tradeId: id });
  } catch (error) {
    console.error('Trades POST error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- PUT /api/trades/:id ----------
router.put('/:id', async (req, res) => {
  try {
    const tradeId = req.params.id;
    const userId = req.user.id;

    const [existing] = await pool.execute('SELECT * FROM trades WHERE id = ? AND user_id = ?', [tradeId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    const {
      pair, position, pnl, session,
      start_time, end_time, tradingview_url,
      influence, emotion, notes, screenshot_url,
      risk_reward, tp_type, sl_type, breakeven,
      exit_type, exit_method
    } = req.body;

    await pool.execute(
      `UPDATE trades SET pair=?, position=?, pnl=?, session=?, start_time=?, end_time=?,
       tradingview_url=?, influence=?, emotion=?, notes=?, screenshot_url=?,
       risk_reward=?, tp_type=?, sl_type=?, breakeven=?,
       exit_type=?, exit_method=?
       WHERE id=? AND user_id=?`,
      [
        pair.toUpperCase(), position.toUpperCase(), pnl, session,
        start_time, end_time, tradingview_url, influence, emotion, notes, screenshot_url,
        risk_reward || null, tp_type || null, sl_type || null, breakeven ? 1 : 0,
        exit_type || null, exit_method || null,
        tradeId, userId
      ]
    );

    return res.status(200).json({ message: 'Trade updated' });
  } catch (error) {
    console.error('Trades PUT error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- DELETE /api/trades/:id ----------
router.delete('/:id', async (req, res) => {
  try {
    const tradeId = req.params.id;
    const userId = req.user.id;

    const [existing] = await pool.execute('SELECT * FROM trades WHERE id = ? AND user_id = ?', [tradeId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    await pool.execute('DELETE FROM trades WHERE id = ? AND user_id = ?', [tradeId, userId]);
    return res.status(200).json({ message: 'Trade deleted' });
  } catch (error) {
    console.error('Trades DELETE error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;