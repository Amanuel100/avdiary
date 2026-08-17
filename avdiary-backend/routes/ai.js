const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { getChatReply, getCoachingInsight } = require('../utils/groq');


// ---------- AI Chat ----------
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Gather trader's context (last 50 trades)
    const [trades] = await pool.execute(
      `SELECT pair, position, pnl, session, date FROM trades WHERE user_id = ? ORDER BY date DESC LIMIT 50`,
      [userId]
    );

    const context = {
      totalTrades: trades.length,
      recentTrades: trades.slice(0, 10).map(t => ({
        pair: t.pair,
        position: t.position,
        pnl: t.pnl,
        session: t.session,
        date: t.date,
      })),
    };

    const reply = await getChatReply(message, context);
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- AI Coaching Insight (cached per user, once per day) ----------
router.post('/coaching', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Check daily cache
    const [recentInsights] = await pool.execute(
      `SELECT content, created_at FROM messages WHERE user_id = ? AND type = 'ai' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (recentInsights.length > 0) {
      const last = new Date(recentInsights[0].created_at);
      const now = new Date();
      const isSameDay =
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();

      if (isSameDay) {
        return res.status(200).json({ insight: recentInsights[0].content });
      }
    }

    // 2. Fetch ALL trades with the new fields
    const [trades] = await pool.execute(
      `SELECT pair, position, pnl, session, date, influence, emotion, notes,
              risk_reward, tp_type, sl_type, breakeven
       FROM trades WHERE user_id = ? ORDER BY date DESC`,
      [userId]
    );

    if (trades.length === 0) {
      return res.status(200).json({ insight: 'No trades yet. Start logging your trades to get AI coaching.' });
    }

    const tradesJson = JSON.stringify(trades);
    const insight = await getCoachingInsight(tradesJson);

    // 3. Save the insight as a message
    await pool.execute(
      'INSERT INTO messages (id, user_id, type, content) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, 'ai', insight]
    );

    return res.status(200).json({ insight });
  } catch (error) {
    console.error('AI coaching error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;