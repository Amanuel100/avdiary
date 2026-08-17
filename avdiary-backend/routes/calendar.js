const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ---------- Helpers ----------

function dateToStr(d) {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d);
}

function cairoToISO(eventDate, eventTime) {
  const dateStr = dateToStr(eventDate);
  // Interpret as Cairo local time (UTC+3) and convert to UTC ISO
  return new Date(dateStr + 'T' + eventTime + '+03:00').toISOString();
}

function formatTime12(eventTime) {
  const parts = String(eventTime).split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 || 12;
  return `${hours12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getDayInfo(dateStr) {
  // Build a Date object at midnight Cairo time (UTC+3)
  const d = new Date(dateStr + 'T00:00:00+03:00');
  const day = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Africa/Cairo' });
  const dayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Africa/Cairo' });
  return { day, dayDate };
}

// ---------- Public: GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD ----------
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'from and to parameters are required (YYYY-MM-DD)' });
    }

    const [rows] = await pool.execute(
      `SELECT id, event_date, event_time, currency, event, impact, actual, forecast, previous
       FROM calendar_events
       WHERE event_date >= ? AND event_date <= ?
       ORDER BY event_date, event_time`,
      [from, to]
    );

    const events = rows.map(row => {
      const cairoDate = dateToStr(row.event_date);   // e.g. "2026-08-02"
      const iso = cairoToISO(row.event_date, row.event_time);
      const { day, dayDate } = getDayInfo(cairoDate);
      return {
        id: row.id,
        date: iso,                    // UTC ISO for relative‑time calculation
        time: formatTime12(row.event_time),
        day,
        dayDate,
        adjustedISO: cairoDate,      // ← use the original Cairo date for grouping
        currency: row.currency,
        event: row.event,
        impact: row.impact,
        actual: row.actual || '',
        forecast: row.forecast || '',
        previous: row.previous || '',
      };
    });

    return res.status(200).json({ events });
  } catch (error) {
    console.error('Calendar GET error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- Admin routes (unchanged) ----------
const adminRouter = express.Router();
adminRouter.use(express.json());
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

adminRouter.post('/', async (req, res) => {
  try {
    const { event_date, event_time, currency, event, impact, actual, forecast, previous } = req.body;
    if (!event_date || !event_time || !currency || !event) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    await pool.execute(
      `INSERT INTO calendar_events (event_date, event_time, currency, event, impact, actual, forecast, previous)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [event_date, event_time, currency, event, impact, actual || null, forecast || null, previous || null]
    );
    return res.status(201).json({ message: 'Event created' });
  } catch (error) {
    console.error('[Admin] POST error:', error);
    return res.status(500).json({ message: 'Internal server error', details: error.message });
  }
});

adminRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { event_date, event_time, currency, event, impact, actual, forecast, previous } = req.body;
    await pool.execute(
      `UPDATE calendar_events SET event_date=?, event_time=?, currency=?, event=?, impact=?,
        actual=?, forecast=?, previous=? WHERE id=?`,
      [event_date, event_time, currency, event, impact, actual || null, forecast || null, previous || null, id]
    );
    return res.status(200).json({ message: 'Event updated' });
  } catch (error) {
    console.error('[Admin] PUT error:', error);
    return res.status(500).json({ message: 'Internal server error', details: error.message });
  }
});

adminRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM calendar_events WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ message: 'Event deleted' });
  } catch (error) {
    console.error('[Admin] DELETE error:', error);
    return res.status(500).json({ message: 'Internal server error', details: error.message });
  }
});

router.use('/admin/calendar', adminRouter);

module.exports = router;