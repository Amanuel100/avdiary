import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Bot, BookOpen, Globe, BarChart3, CheckCircle, TrendingUp, Zap, Play
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

export default function Home({ isLoggedIn, setIsLoggedIn }) {
  return (
    <div className="min-h-screen bg-av-bg text-av-text overflow-x-hidden relative">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5 animate-fade-in">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/favicon.png" alt="AvDiary" className="h-8 w-auto group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold">
              Av<span className="text-av-primary">Diary</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn-av-primary flex items-center gap-2">
                Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-av-ghost text-sm">Sign in</Link>
                <Link to="/register" className="btn-av-primary text-sm">Get Start</Link>
              </>
            )}
          </div>
        </nav>

        {/* ---------- Hero Section ---------- */}
        <section className="max-w-7xl mx-auto px-6 pt-20 lg:pt-32 flex flex-col lg:flex-row items-center gap-12">
          {/* Left content */}
          <div className="flex-1 space-y-6">
            {/* Badge with bounce animation */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-av-primary/10 border border-av-primary/30 text-av-primary text-sm animate-fade-in">
              <Sparkles size={16} className="animate-pulse" /> AI‑Powered Trading Journal
            </div>

            {/* Hero headline – refined, smaller, beautiful gradient */}
            <h1 className="text-3xl lg:text-5xl font-bold leading-tight tracking-tight">
              <span className="animate-slide-up inline-block" style={{ animationDelay: '0.1s' }}>
                Every trade tells a story,
              </span>
              <br />
              <span
                className="animate-slide-up inline-block bg-gradient-to-r from-av-primary via-av-accent to-av-primary bg-clip-text text-transparent"
                style={{ animationDelay: '0.3s', backgroundSize: '200% auto' }}
              >
                and every reflection fuels progress.
              </span>
            </h1>

            <p className="text-base lg:text-lg text-av-muted max-w-xl animate-fade-in" style={{ animationDelay: '0.5s' }}>
              AvDiary is the only journal that learns from your trades, pinpoints your mistakes,
              and coaches you like a pro — all in one beautiful dashboard.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
              {isLoggedIn ? (
                <Link to="/dashboard" className="btn-av-primary px-6 py-3 text-base flex items-center gap-2">
                  Go to Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-av-primary px-6 py-3 text-base flex items-center gap-2">
                    Get Start <ArrowRight size={20} />
                  </Link>
                  <Link to="/login" className="btn-av-ghost px-6 py-3 text-base">I have an account</Link>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4 text-sm text-av-muted animate-fade-in" style={{ animationDelay: '0.9s' }}>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-av-accent" /> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-av-accent" /> AI coach included</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-av-accent" /> Cancel anytime</span>
            </div>
          </div>

          {/* Right side – floating cards */}
          <div className="flex-1 relative flex justify-center">
            {/* Central card */}
            <div className="glass-card p-5 w-72 rotate-3 animate-float border border-av-primary/20 shadow-av-glow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-av-primary/20 flex items-center justify-center">
                  <Bot size={20} className="text-av-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI Coach</p>
                  <p className="text-xs text-av-muted">Your win rate improved 12%</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-av-muted">Today's P&L</span>
                  <span className="text-av-accent font-bold">+$42.75</span>
                </div>
                <div className="h-2 bg-av-border rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-av-accent rounded-full" />
                </div>
                <div className="flex justify-between text-xs text-av-muted">
                  <span>Win rate 68%</span>
                  <span>3 trades</span>
                </div>
              </div>
            </div>

            {/* Floating top-left */}
            <div className="absolute -top-8 -left-8 glass-card p-3 w-40 animate-float border border-av-accent/30" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-xs font-mono text-yellow-400">New York open</span>
              </div>
              <p className="text-base font-bold mt-1 text-av-text">+127 Pips</p>
              <p className="text-[10px] text-av-muted">this week</p>
            </div>

            {/* Floating bottom-right */}
            <div className="absolute -bottom-6 -right-6 glass-card p-3 w-40 animate-float border border-av-warning/30" style={{ animationDelay: '4s' }}>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-av-warning" />
                <span className="text-xs font-mono text-av-warning">Equity curve</span>
              </div>
              <p className="text-base font-bold mt-1 text-av-text">+$127.50</p>
              <p className="text-[10px] text-av-muted">monthly</p>
            </div>
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-16">
            Everything a <span className="text-av-primary">trader</span> needs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard icon={BookOpen} title="Smart Journal" description="Log trades in seconds. Attach TradingView charts, choose session, and track every detail." delay="0.1s" />
            <FeatureCard icon={Bot} title="AI Trading Coach" description="Our AI analyses your win rate, best sessions, and worst days. It tells you exactly what to change." delay="0.2s" />
            <FeatureCard icon={BarChart3} title="Powerful Insights" description="Visual equity curves, session heatmaps, and weekly reports. Spot patterns you never knew existed." delay="0.3s" />
            <FeatureCard icon={Globe} title="Ethiopian‑Time Sessions" description="A 24‑hour coloured timeline shows Asian, London, and New York overlaps in real‑time EAT." delay="0.4s" />
            <FeatureCard icon={Sparkles} title="Economic Calendar" description="Red, orange, yellow impact folders. See exactly which news events will move your pairs." delay="0.5s" />
            <FeatureCard icon={Bot} title="Chart Image Analysis" description="Paste a TradingView link and the AI reads the chart for you. Trends, support/resistance explained instantly." delay="0.6s" />
          </div>
        </section>

        {/* ---------- Video Section ---------- */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-av-text mb-4">
              See AvDiary in <span className="text-av-primary">Action</span>
            </h2>
            <p className="text-av-muted text-sm max-w-xl mx-auto">
              Watch how easy it is to log trades, get AI insights, and track your performance.
            </p>
          </div>
          <div className="relative max-w-4xl mx-auto">
            <div className="glass-card p-3 rounded-2xl overflow-hidden shadow-av-glow">
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-xl"
                  src="https://www.youtube-nocookie.com/embed/BhUpuLmI6SY?modestbranding=1&rel=0&showinfo=0&controls=1"
                  title="AvDiary Trading Journal Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Testimonial ---------- */}
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="glass-card p-10 max-w-2xl mx-auto">
            <p className="text-lg lg:text-xl italic text-av-muted">
              "AvDiary told me I lose 70% of trades during New York session. I shifted to London and my win rate doubled."
            </p>
            <p className="mt-4 font-semibold text-av-text">— Trader from Addis Ababa</p>
          </div>
        </section>

        {/* ---------- Footer CTA ---------- */}
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">Ready to stop guessing?</h2>
          <p className="text-base text-av-muted mb-8">Join hundreds of traders who finally understand their performance.</p>
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn-av-primary px-8 py-4 text-base inline-flex items-center gap-2">
              Go to Dashboard <ArrowRight size={20} />
            </Link>
          ) : (
            <Link to="/register" className="btn-av-primary px-8 py-4 text-base inline-flex items-center gap-2">
              Start Your Journal <ArrowRight size={20} />
            </Link>
          )}
        </section>

        {/* ---------- Footer with social links ---------- */}
        <footer className="border-t border-av-border py-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-av-muted">© {new Date().getFullYear()} AvDiary. Ethiopian‑made trading journal.</p>
            <div className="flex items-center gap-4">
              <a
  href="https://t.me/yourusername"
  target="_blank"
  rel="noopener noreferrer"
  className="text-av-muted hover:text-av-primary transition-colors"
  title="Telegram"
>
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M21.05 3.46L2.72 10.53c-1.25.5-1.24 1.2-.23 1.51l4.7 1.47 1.8 5.51c.22.61.11.86.75.86.49 0 .71-.22.98-.49l2.3-2.24 4.78 3.52c.88.49 1.51.23 1.73-.82l3.1-14.62c.32-1.29-.49-1.87-1.58-1.27zM8.02 13.18l10.96-6.92c.55-.34 1.05-.15.64.21l-8.96 8.09-.35 3.76-2.29-5.14z"/>
  </svg>
</a>
          <a href="https://www.instagram.com/avdiary.et/" target="_blank" className="text-av-muted hover:text-av-primary transition-colors" title="Instagram">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="https://www.youtube.com/@avdiary-et" target="_blank" className="text-av-muted hover:text-av-primary transition-colors" title="YouTube">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
          <a href="#" target="_blank" className="text-av-muted hover:text-av-primary transition-colors" title="TikTok">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
          <a  href="https://www.facebook.com/profile.php?id=61593612401842" target="_blank" className="text-av-muted hover:text-av-primary transition-colors" title="Facebook">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.192 5 15.115 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/>
            </svg>
          </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Feature card with staggered animation */
function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <div
      className="glass-card-interactive p-6 flex flex-col items-start gap-4 animate-slide-up opacity-0"
      style={{ animationDelay: delay, animationFillMode: 'forwards' }}
    >
      <div className="p-3 rounded-xl bg-av-primary/10 text-av-primary">
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-av-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}