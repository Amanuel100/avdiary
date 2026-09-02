import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { User, Mail, Lock, Hash } from 'lucide-react'; // removed BookOpen
import { useUser } from '../context/UserContext';
import { authAPI } from '../api';

export default function Register({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRef = searchParams.get('ref') || '';
  const { updateUser } = useUser();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: defaultRef,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, referralCode } = form;

    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.register({ name, email, password, referralCode });
      localStorage.setItem('avdiary-token', data.token);
      updateUser(data.user);
      setIsLoggedIn(true);
      toast.success('Account created! Welcome to AvDiary.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
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
            <h1 className="text-xl font-semibold text-av-text text-center mb-6">Create your free account</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ... form fields unchanged ... */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
                <input type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} className="input-av pl-10" required />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
                <input type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} className="input-av pl-10" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
                <input type="password" name="password" placeholder="Password (min. 6 characters)" value={form.password} onChange={handleChange} className="input-av pl-10" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
                <input type="password" name="confirmPassword" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} className="input-av pl-10" required />
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-av-muted" />
                <input type="text" name="referralCode" placeholder="Referral Code (optional, 7 digits)" value={form.referralCode} onChange={handleChange} className="input-av pl-10" />
              </div>
              <button type="submit" disabled={loading} className="btn-av-primary w-full flex items-center justify-center gap-2">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-av-muted text-sm mt-6">
              Already have an account? <Link to="/login" className="text-av-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}