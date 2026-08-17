import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Shield, User, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { authAPI } from '../api';
import { useUser } from '../context/UserContext';   // ← new import

export default function AdminLogin({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const { updateUser } = useUser();   // ← new line
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.login({ email, password });

      // Check if the logged‑in user is actually an admin
      if (data.user.role !== 'admin') {
        toast.error('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }

      localStorage.setItem('avdiary-token', data.token);
      updateUser(data.user);            // ← store full user object in context
      setIsLoggedIn(true);
      toast.success('Welcome, Admin');
      navigate('/aman');
    } catch (error) {
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-av-bg px-4">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111827', color: '#f8fafc', border: '1px solid #1e293b' } }} />

      <div className="glass-card w-full max-w-md p-8 animate-slide-up relative">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 bg-av-primary rounded-lg flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-av-text">
            Av<span className="text-av-primary">Diary</span>
          </span>
        </div>

        {/* Shield icon */}
        <div className="p-4 rounded-full bg-av-primary/10 w-fit mx-auto mb-4 ring-2 ring-av-primary/30 ring-offset-4 ring-offset-av-bg">
          <Shield size={28} className="text-av-primary" />
        </div>

        <h1 className="text-xl font-semibold text-av-text text-center mb-6">
          Admin Sign In
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
            <input
              type="text"
              placeholder="Admin username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-av pl-10"
              autoComplete="username"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-av pl-10"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-av-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying…' : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}