import { Link } from 'react-router-dom';

export default function PublicHeader({ isLoggedIn }) {
  return (
    <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
      <Link to="/" className="flex items-center gap-2">
        <img src="/favicon.png" alt="AvDiary" className="h-8 w-auto" />
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