import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SubscriptionGate({ children }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [dummy, setDummy] = useState(0);   // small trick to force re‑render

  const isSubscribed = user?.subscription_tier && user.subscription_tier !== 'free';

  // Whenever the subscription tier changes, force the component to fully re‑render
  useEffect(() => {
    console.log('SubscriptionGate – user.subscription_tier:', user?.subscription_tier);
    setDummy(prev => prev + 1);
  }, [user?.subscription_tier]);

  if (isSubscribed) {
    // Key change forces React to recreate the entire children tree
    return <div key={dummy}>{children}</div>;
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Blurred page content */}
      <div className="blur-sm pointer-events-none opacity-30 select-none h-full overflow-hidden">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-[50px] z-10">
        <div className="absolute top-[50px] left-1/2 -translate-x-1/2 w-64 h-64 bg-av-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-[50px] left-1/2 -translate-x-1/2 w-48 h-48 bg-av-accent/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '0.5s' }} />

        <div className="relative glass-card p-8 text-center max-w-sm w-full animate-slide-up shadow-av-glow border border-av-primary/40">
          <div className="p-4 rounded-full bg-av-primary/10 w-fit mx-auto mb-5 ring-2 ring-av-primary/30 ring-offset-4 ring-offset-av-bg">
            <Lock size={36} className="text-av-primary" />
          </div>
          <h2 className="text-2xl font-bold text-av-text mb-3">Premium Feature</h2>
          <p className="text-av-muted text-sm mb-6 leading-relaxed">
            Subscribe to unlock the full journal, AI coach, market tools, and more.
          </p>
          <button
            onClick={() => navigate('/subscription')}
            className="btn-av-primary w-full flex items-center justify-center gap-2 py-3"
          >
            Subscribe Now <Sparkles size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}