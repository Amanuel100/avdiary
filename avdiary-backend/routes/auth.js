const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

// ----- Ensure password_resets table exists (run once at server start) -----
(async () => {
  try {
    await pool.execute(`CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    console.log('✅ password_resets table ready');
  } catch (err) {
    console.error('❌ Failed to create password_resets table:', err.message);
  }
})();

// ---------- Register ----------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const referCode = Math.floor(1000000 + Math.random() * 9000000).toString();

    await pool.execute(
      'INSERT INTO users (name, email, password, role, subscription_tier, referral_code, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'user', 'free', referCode, 0]
    );

    if (referralCode) {
      const [referrer] = await pool.execute(
        'SELECT id FROM users WHERE referral_code = ?',
        [referralCode]
      );
      if (referrer.length > 0) {
        await pool.execute(
          'UPDATE users SET referred_by = ? WHERE email = ?',
          [referrer[0].id, email]
        );
        await pool.execute(
          'UPDATE users SET points = points + 100 WHERE id = ?',
          [referrer[0].id]
        );
      }
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, role, subscription_tier, points, referral_code FROM users WHERE email = ?',
      [email]
    );
    const user = users[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, subscription_tier: user.subscription_tier },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({ message: 'Account created', token, user });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- Login ----------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, subscription_tier: user.subscription_tier },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        subscription_tier: user.subscription_tier,
        subscription_expiry: user.subscription_expiry,
        points: user.points,
        referral_code: user.referral_code,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- Get Profile ----------
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, image, role, subscription_tier, subscription_expiry, points, referral_code FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('Profile GET error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- Update Profile ----------
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, image } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    await pool.execute('UPDATE users SET name = ?, image = ? WHERE id = ?', [name, image || null, req.user.id]);
    return res.status(200).json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- Change Password ----------
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, users[0].password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- Forgot Password ----------
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[ForgotPassword] Request received for email: ${email}`);  // ← always log

    if (!email) {
      console.log('[ForgotPassword] ❌ No email provided');
      return res.status(400).json({ message: 'Email is required' });
    }

    const [users] = await pool.execute('SELECT id, email FROM users WHERE email = ?', [email]);

    // Always return the same response (prevents email enumeration)
    if (users.length === 0) {
      console.log(`[ForgotPassword] ❌ No user found for ${email} – still returning success`);
      // Still print a fake reset link for testing (no token, just for demo)
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
console.log(`🔗 (DEMO) Reset link: ${frontendURL}/reset-password?token=no-user-found`);
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = users[0];
    console.log(`[ForgotPassword] ✅ User found: id=${user.id}`);

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    console.log(`[ForgotPassword] Token generated: ${token.substring(0, 8)}...`);

    // Insert into password_resets table
    try {
      await pool.execute(
        'INSERT INTO password_resets (user_id, token, expires) VALUES (?, ?, ?)',
        [user.id, token, expires]
      );
      console.log('[ForgotPassword] ✅ Token stored in database');
    } catch (dbError) {
      console.error('[ForgotPassword] ❌ Database insert failed:', dbError.message);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Try to send email
    try {
      console.log('[ForgotPassword] Sending email...');
      await sendPasswordResetEmail(email, token);
      console.log('[ForgotPassword] ✅ Email sent successfully');
    } catch (emailError) {
      console.error('[ForgotPassword] ❌ Email failed:', emailError.message);
    }

    // ALWAYS print the reset link to the terminal
    console.log(`🔗 Reset link for ${email}: ${frontendURL}/reset-password?token=${token}`);

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('[ForgotPassword] ❌ Unexpected error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- Reset Password ----------
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [rows] = await pool.execute(
      'SELECT user_id FROM password_resets WHERE token = ? AND expires > NOW()',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, rows[0].user_id]);

    await pool.execute('DELETE FROM password_resets WHERE token = ?', [token]);

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------- Google OAuth Login / Register ----------
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify the Google token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account has no email' });
    }

    // Check if user exists
    const [existing] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

    let user;
    if (existing.length === 0) {
      // New user – create account
      const referCode = Math.floor(1000000 + Math.random() * 9000000).toString();
      await pool.execute(
        'INSERT INTO users (name, email, image, role, subscription_tier, referral_code, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, picture, 'user', 'free', referCode, 0]
      );
      const [newUser] = await pool.execute(
        'SELECT id, name, email, role, subscription_tier, points, referral_code, image FROM users WHERE email = ?',
        [email]
      );
      user = newUser[0];
    } else {
      user = existing[0];
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, subscription_tier: user.subscription_tier },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        subscription_tier: user.subscription_tier,
        subscription_expiry: user.subscription_expiry,
        points: user.points,
        referral_code: user.referral_code,
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
module.exports = router;