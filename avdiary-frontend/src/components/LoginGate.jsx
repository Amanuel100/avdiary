import { useNavigate } from 'react-router-dom';
import { LogIn, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginGate({ isLoggedIn, children }) {
  const navigate = useNavigate();

  if (isLoggedIn) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-av-bg relative overflow-hidden">
      {/* Animated glowing background orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-av-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-av-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Login card */}
      <div className="relative z-10 glass-card p-10 max-w-md w-full text-center animate-slide-up shadow-av-glow border border-av-primary/30">
        <div className="p-4 rounded-full bg-av-primary/10 w-fit mx-auto mb-6 ring-2 ring-av-primary/30 ring-offset-4 ring-offset-av-bg">
          <LogIn size={40} className="text-av-primary" />
        </div>
        <h2 className="text-2xl font-bold text-av-text mb-3">Welcome to AvDiary</h2>
        <p className="text-av-muted mb-8 text-sm leading-relaxed">
          Please log in or create an account to access this page.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/login')}
            className="btn-av-primary w-full flex items-center justify-center gap-2 py-3"
          >
            Sign In <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-av-ghost w-full py-3 flex items-center justify-center gap-2"
          >
            Create Account <Sparkles size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}