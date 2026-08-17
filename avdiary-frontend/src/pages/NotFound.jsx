import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-av-bg px-4">
      <div className="glass-card p-10 max-w-md text-center animate-slide-up space-y-6">
        {/* 404 illustration */}
        <div className="text-8xl font-extrabold text-av-primary opacity-20 select-none">
          404
        </div>
        <h1 className="text-2xl font-bold text-av-text">Page not found</h1>
        <p className="text-av-muted text-sm">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link to="/" className="btn-av-primary inline-flex items-center gap-2">
          <Home size={18} /> Go Home
        </Link>
      </div>
    </div>
  );
}