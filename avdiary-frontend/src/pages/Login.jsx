import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, ArrowRight } from 'lucide-react'; // removed BookOpen
import { useUser } from '../context/UserContext';
import { authAPI } from '../api';

export default function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in both fields');
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.login({ email, password });
      localStorage.setItem('avdiary-token', data.token);
      updateUser(data.user);
      setIsLoggedIn(true);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-av-bg">
      <div className="flex-1 flex items-center justify-center px-4">
        <Toaster position="top-center" toastOptions={{ style: { background: '#111827', color: '#f8fafc', border: '1px solid #1e293b' } }} />
        <div className="glass-card w-full max-w-md p-8 animate-slide-up relative">
          <Link to="/" className="absolute top-4 left-4 flex items-center gap-2">
            <img src="/favicon.png" alt="AvDiary" className="h-7 w-auto" />
            <span className="text-lg font-bold text-av-text">
              Av<span className="text-av-primary">Diary</span>
            </span>
          </Link>

          <div className="mt-8">
            <h1 className="text-xl font-semibold text-av-text text-center mb-6">Sign in to your account</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="input-av pl-10" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-av pl-10" required />
              </div>
              <button type="submit" disabled={loading} className="btn-av-primary w-full flex items-center justify-center gap-2">
                {loading ? 'Signing in…' : <>Sign in <ArrowRight size={18} /></>}
              </button>
            </form>

            <p className="text-right mt-2">
              <Link to="/forgot-password" className="text-xs text-av-muted hover:text-av-primary">
                Forgot password?
              </Link>
            </p>

            <p className="text-center text-av-muted text-sm mt-6">
              Don't have an account? <Link to="/register" className="text-av-primary hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}