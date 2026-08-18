import { API_BASE, BACKEND_URL } from '../config';
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Lock, ArrowRight } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirm) { toast.error('Both fields required'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('At least 6 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Password reset! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-av-bg px-4">
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-bold text-av-text mb-2">Invalid Link</h2>
          <p className="text-av-muted text-sm">This password reset link is invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-av-bg px-4">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111827', color: '#f8fafc', border: '1px solid #1e293b' } }} />
      <div className="glass-card w-full max-w-md p-8 animate-slide-up">
        <h2 className="text-xl font-bold text-av-text text-center mb-6">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
            <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className="input-av pl-10" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
            <input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-av pl-10" required />
          </div>
          <button type="submit" disabled={loading} className="btn-av-primary w-full">{loading ? 'Resetting…' : <>Reset Password <ArrowRight size={18} /></>}</button>
        </form>
      </div>
    </div>
  );
}