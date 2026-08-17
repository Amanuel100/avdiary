const { Resend } = require('resend');

async function sendPasswordResetEmail(to, token) {
  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
  console.log(`[Email] Sending reset email to ${to} …`);

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // ✅ Use Resend's default testing sender – works without domain verification
      const data = await resend.emails.send({
        from: 'onboarding@resend.dev',          // ← Resend's free testing sender
        to: [to],
        subject: 'Password Reset – AvDiary',
        html: `
          <div style="max-width:500px;margin:auto;font-family:Arial,sans-serif;padding:20px;background:#0f172a;color:#f8fafc;border-radius:12px">
            <h2>AvDiary Password Reset</h2>
            <p>You requested a password reset. Click the button below to choose a new password:</p>
            <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px">Reset Password</a>
            <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
        `,
      });

      if (data?.id) {
        console.log('[Email] ✅ Resend – email sent. ID:', data.id);
        return;
      }
      console.error('[Email] ❌ Resend – unexpected response:', data);
    } catch (err) {
      console.error('[Email] ❌ Resend failed:', err.message);
    }
  }

  // Fallback: always print the reset link to the terminal
  console.log(`🔗 Reset link for ${to}: ${resetUrl}`);
}

module.exports = { sendPasswordResetEmail };