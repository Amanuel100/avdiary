import { API_BASE, BACKEND_URL } from '../config';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Email is required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-av-bg px-4">
        <div className="glass-card p-8 max-w-md w-full text-center animate-slide-up">
          <Mail size={40} className="text-av-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-av-text mb-2">Check your email</h2>
          <p className="text-av-muted text-sm">If an account exists for {email}, we've sent a password reset link.</p>
          <Link to="/login" className="btn-av-primary mt-6 inline-flex items-center gap-2"><ArrowLeft size={16} /> Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-av-bg px-4">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111827', color: '#f8fafc', border: '1px solid #1e293b' } }} />
      <div className="glass-card w-full max-w-md p-8 animate-slide-up">
        <h2 className="text-xl font-bold text-av-text text-center mb-6">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
            <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} className="input-av pl-10" required />
          </div>
          <button type="submit" disabled={loading} className="btn-av-primary w-full">{loading ? 'Sending…' : 'Send Reset Link'}</button>
        </form>
        <Link to="/login" className="text-av-muted text-sm text-center mt-4 block hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}