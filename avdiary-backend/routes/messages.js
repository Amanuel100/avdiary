const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');

// GET /api/messages – get messages for the logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || 'all';
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, type, content, `read`, created_at FROM messages WHERE user_id = ?';
    const params = [userId];

    if (type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit.toString(), offset.toString());

    const [messages] = await pool.execute(query, params);

    const [[{ unread }]] = await pool.execute(
      'SELECT COUNT(*) AS unread FROM messages WHERE user_id = ? AND `read` = 0',
      [userId]
    );

    return res.status(200).json({ messages, unread });
  } catch (error) {
    console.error('Messages GET error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/messages – create a message
// If the sender is admin and provides targetUserId, the message goes to that user.
// Otherwise, it goes to the sender.
router.post('/', async (req, res) => {
  try {
    const { content, type, targetUserId } = req.body;

    if (!content || !type) {
      return res.status(400).json({ message: 'Content and type are required' });
    }

    // Determine recipient
    let recipientId = req.user.id;
    if (req.user.role === 'admin' && targetUserId) {
      recipientId = targetUserId;
    }

    const id = uuidv4();
    await pool.execute(
      'INSERT INTO messages (id, user_id, type, content) VALUES (?, ?, ?, ?)',
      [id, recipientId, type, content]
    );
    return res.status(201).json({ message: 'Message sent' });
  } catch (error) {
    console.error('Messages POST error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/messages/:id/read – mark a single message as read
router.put('/:id/read', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE messages SET `read` = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Messages read error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/messages/read-all – mark all messages as read
router.put('/read-all', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE messages SET `read` = 1 WHERE user_id = ? AND `read` = 0',
      [req.user.id]
    );
    return res.status(200).json({ message: 'All messages marked as read' });
  } catch (error) {
    console.error('Messages read-all error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;