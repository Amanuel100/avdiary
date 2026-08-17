import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function PublicHeader({ isLoggedIn }) {
  return (
    <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-av-primary rounded-lg flex items-center justify-center">
          <BookOpen size={18} className="text-white" />
        </div>
        <span className="text-2xl font-bold text-av-text">
          Av<span className="text-av-primary">Diary</span>
        </span>
      </Link>
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <Link to="/dashboard" className="btn-av-primary text-sm">Dashboard</Link>
        ) : (
          <>
            <Link to="/login" className="btn-av-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-av-primary text-sm">Get Start</Link>
          </>
        )}
      </div>
    </nav>
  );
}