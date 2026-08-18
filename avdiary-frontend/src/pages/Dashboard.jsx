import { useState, useEffect } from 'react';
import { API_BASE, BACKEND_URL } from '../config';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Target, CalendarCheck, BarChart3,
  BookOpen, Lightbulb, ArrowRight,
  ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Loader from '../components/Loader';
import { tradesAPI } from '../api';
import { useUser } from '../context/UserContext';

// ---------- TradingView snapshot helper ----------
const getSnapshotUrl = (tradingviewUrl) => {
  if (!tradingviewUrl) return null;
  const match = tradingviewUrl.match(/\/x\/([a-zA-Z0-9]+)/);
  if (match) {
    const code = match[1];
    const firstLetter = code.charAt(0).toLowerCase();
    return `https://s3.tradingview.com/snapshots/${firstLetter}/${code}.png`;
  }
  return null;
};

// ---------- Professional mini‑chart placeholder ----------
const chartPlaceholder = (pair) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#0a0f1c"/>
      </linearGradient>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <rect width="400" height="200" fill="url(#bgGrad)"/>
    <g stroke="#1e293b" stroke-width="0.5">
      <line x1="40" y1="50" x2="360" y2="50"/>
      <line x1="40" y1="100" x2="360" y2="100"/>
      <line x1="40" y1="150" x2="360" y2="150"/>
    </g>
    <g>
      ${Array.from({ length: 12 }).map((_, i) => {
        const x = 50 + i * 25;
        const top = 60 + Math.sin(i * 0.8) * 30 + (Math.random() - 0.5) * 20;
        const bottom = top + 20 + Math.random() * 20;
        const isGreen = bottom > top;
        const color = isGreen ? '#14b8a6' : '#ef4444';
        const high = top - 5 - Math.random() * 8;
        const low = bottom + 5 + Math.random() * 8;
        return `
          <line x1="${x}" y1="${high}" x2="${x}" y2="${low}" stroke="${color}" stroke-width="1"/>
          <rect x="${x - 4}" y="${top}" width="8" height="${bottom - top}" fill="${color}" rx="1"/>
        `;
      }).join('')}
    </g>
    <path d="M40,140 Q100,80 160,110 T280,70 T360,95 L360,170 L40,170 Z" fill="url(#areaGrad)" opacity="0.6"/>
    <polyline points="40,140 100,90 160,115 220,82 280,70 320,88 360,95" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="200" y="25" text-anchor="middle" fill="#f8fafc" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="0.5">${pair}</text>
    <text x="200" y="42" text-anchor="middle" fill="#94a3b8" font-family="Arial,sans-serif" font-size="9" font-weight="400">CHART PREVIEW</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export default function Dashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [aiInsight, setAiInsight] = useState('');

  // Calendar state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  );
  const [selectedDayTrades, setSelectedDayTrades] = useState([]);
  const [allTrades, setAllTrades] = useState([]);

  // ---------- Fetch data from backend ----------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch trades
        const tradesData = await tradesAPI.getAll({ limit: 200 });
        const tradesList = tradesData.trades || [];
        setAllTrades(tradesList);
        setRecentTrades(tradesList.slice(0, 5));

        // Calculate stats
        const totalPnL = tradesList.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
        const wins = tradesList.filter(t => Number(t.pnl) > 0).length;
        const total = tradesList.length;
        const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';

        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const todayTrades = tradesList.filter(t => {
          const tDate = t.date ? new Date(t.date).toISOString().slice(0,10) : null;
          return tDate === todayStr;
        }).length;

        const uniqueDays = new Set(
          tradesList.map(t => t.date ? new Date(t.date).toISOString().slice(0,10) : '')
        ).size;

        setStats({ totalPnL, winRate, todayTrades, activeDays: uniqueDays });

        // ---------- Fetch real AI coaching insight ----------
        try {
          const token = localStorage.getItem('avdiary-token');
          const coachingRes = await fetch(`${API_BASE}/ai/chat`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (coachingRes.ok) {
            const coachingData = await coachingRes.json();
            setAiInsight(coachingData.insight);
          } else {
            setAiInsight(''); // fallback if endpoint returns error
          }
        } catch (aiErr) {
          console.error('AI coaching fetch error:', aiErr);
          setAiInsight('');
        }

        setLoading(false);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update selected day trades
  useEffect(() => {
    const filtered = allTrades.filter(t => {
      const tDate = t.date ? new Date(t.date).toISOString().slice(0,10) : null;
      return tDate === selectedDate;
    });
    setSelectedDayTrades(filtered);
  }, [selectedDate, allTrades]);

  // Calendar helpers
  const grouped = allTrades.reduce((map, t) => {
    const d = t.date ? new Date(t.date).toISOString().slice(0,10) : '';
    if (!map[d]) map[d] = [];
    map[d].push(t);
    return map;
  }, {});

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const isWinDay = (trades) => trades.reduce((sum, t) => sum + Number(t.pnl), 0) > 0;

  const handleDayClick = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-av-danger mb-2">Failed to load dashboard</p>
        <p className="text-av-muted text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-av-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-av-text">
          Welcome back, {user?.name || 'Trader'}
        </h1>
        <p className="text-av-muted mt-1">Here’s your trading summary</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total P&L" value={`$${stats.totalPnL.toFixed(2)}`} icon={TrendingUp} color={stats.totalPnL >= 0 ? 'text-av-accent' : 'text-av-danger'} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} icon={Target} color="text-av-primary" />
        <StatCard label="Today" value={`${stats.todayTrades} trades`} icon={CalendarCheck} color="text-av-accent" />
        <StatCard label="Active Days" value={stats.activeDays} icon={BarChart3} color="text-av-primary" />
      </div>

      {/* Equity Curve + AI Coach – side‑by‑side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Equity Curve */}
        <div className="glass-card p-4">
          <h3 className="text-lg font-semibold text-av-text mb-4">Equity Curve</h3>
          {allTrades.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-av-muted border border-dashed border-av-border rounded-xl">
              <BarChart3 size={40} className="mr-2 opacity-30" />
              <span>Chart will appear once you log real trades</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart
                data={(() => {
                  const sorted = [...allTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
                  let cumulative = 0;
                  return sorted.map((t, idx) => ({
                    index: idx + 1,
                    pnl: (cumulative += Number(t.pnl || 0)),
                    label: t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
                  }));
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="index" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="pnl" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

{/* AI Coach */}
<div className="glass-card-interactive p-5">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2.5 rounded-xl bg-av-primary/10 text-av-primary">
      <Lightbulb size={24} />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-av-text">AI Coach</h3>
      <p className="text-xs text-av-muted">Powered by AvDiary AI</p>
    </div>
  </div>

  {aiInsight ? (
    <div className="space-y-3">
      <div className="bg-av-bg/50 rounded-xl p-3 border border-av-border/30">
        <p className="text-sm text-av-text font-medium mb-1">📊 This Week</p>
        <p className="text-av-muted text-sm leading-relaxed whitespace-pre-wrap">{aiInsight}</p>
      </div>
      <Link to="/chat" className="inline-flex items-center gap-1 text-av-primary text-sm hover:underline">
        Ask AI for next week's advice <ArrowRight size={14} />
      </Link>
    </div>
  ) : (
    <div className="text-av-muted text-sm">
      <p>Trade for a few days and your AI coach will give you personalised advice.</p>
    </div>
  )}
</div>
      </div>

      {/* Recent Trades */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-av-text">Recent Trades</h3>
          <Link to="/journal" className="text-av-primary text-sm hover:underline">View all</Link>
        </div>
        {recentTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-av-muted border-b border-av-border">
                  <th className="pb-2 pr-3">Date</th><th className="pb-2 pr-3">Pair</th><th className="pb-2 pr-3">Position</th><th className="pb-2 pr-3">P&L</th><th className="pb-2">Session</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map(t => (
                  <tr key={t.id} className="border-b border-av-border/50">
                    <td className="py-2 pr-3 text-av-muted">{t.date ? new Date(t.date).toLocaleDateString() : '--'}</td>
                    <td className="py-2 pr-3 text-av-text font-medium">{t.pair}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${t.position === 'BUY' ? 'bg-av-accent/20 text-av-accent' : 'bg-av-danger/20 text-av-danger'}`}>{t.position}</span>
                    </td>
                    <td className={`py-2 pr-3 font-medium ${Number(t.pnl) >= 0 ? 'text-av-accent' : 'text-av-danger'}`}>${Number(t.pnl).toFixed(2)}</td>
                    <td className="py-2 text-av-muted">{t.session}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-av-muted">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p>No trades yet.</p>
            <Link to="/journal/new" className="btn-av-primary mt-3 inline-flex items-center gap-2">
              Log your first trade
            </Link>
          </div>
        )}
      </div>

      {/* Calendar + Day Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar panel */}
        <div className="glass-card p-3 h-fit">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setCurrentMonth(m => m === 0 ? 11 : m - 1)} className="p-1 text-av-muted hover:text-av-text"><ChevronLeft size={16} /></button>
            <h3 className="text-sm font-semibold text-av-text">
              {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setCurrentMonth(m => m === 11 ? 0 : m + 1)} className="p-1 text-av-muted hover:text-av-text"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-av-muted mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-center font-medium">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayTrades = grouped[dateStr] || [];
              const has = dayTrades.length > 0;
              const win = has && isWinDay(dayTrades);
              const loss = has && !win;
              const isSelected = selectedDate === dateStr;
              return (
                <button key={day} onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] font-medium transition border ${
                    isSelected ? 'border-av-primary bg-av-primary/10 text-av-primary' :
                    has ? (win ? 'border-av-accent bg-av-accent/10 text-av-accent' : 'border-av-danger bg-av-danger/10 text-av-danger') :
                    'border-transparent hover:border-av-border text-av-text'
                  }`}>
                  {day}
                  {has && <span className="text-[8px] leading-tight">{dayTrades.length}t</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day trades panel */}
        <div className="glass-card p-4 flex flex-col">
          <h3 className="text-lg font-semibold text-av-text mb-3">
            Trades on {selectedDate}
          </h3>
          <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 space-y-3">
            {selectedDayTrades.length === 0 ? (
              <div className="text-center py-10 text-av-muted">
                <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No trades on this day.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedDayTrades.map(trade => {
                  const imageSrc = trade.screenshot_url || getSnapshotUrl(trade.tradingview_url) || chartPlaceholder(trade.pair);
                  return (
                    <article key={trade.id} className={`glass-card overflow-hidden flex flex-col card-glow border-l-2 ${Number(trade.pnl) > 0 ? 'border-l-av-accent' : Number(trade.pnl) < 0 ? 'border-l-av-danger' : 'border-l-gray-500'}`}>
                      <a href={trade.tradingview_url} target="_blank" rel="noopener noreferrer" className="block p-2 pb-0">
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border border-av-border/60 ring-1 ring-av-primary/10 shadow-inner">
                          <img
                            src={imageSrc}
                            alt={`${trade.pair} chart`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.currentTarget.src = chartPlaceholder(trade.pair); }}
                          />
                        </div>
                      </a>
                      <div className="p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-av-muted font-medium">{trade.session}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${trade.position === 'BUY' ? 'bg-av-accent/20 text-av-accent' : 'bg-av-danger/20 text-av-danger'}`}>
                            {trade.position === 'BUY' ? 'LONG' : 'SHORT'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold text-av-text">{trade.pair}</span>
                          <span className={`text-lg font-bold font-mono ${Number(trade.pnl) >= 0 ? 'text-av-accent' : 'text-av-danger'}`}>
                            {Number(trade.pnl) >= 0 ? '+' : ''}{Number(trade.pnl).toFixed(2)} USD
                          </span>
                        </div>
                        <a href={trade.tradingview_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-av-primary hover:underline mt-1 self-start">
                          <ExternalLink size={12} /> View on TradingView
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="glass-card-interactive p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-av-bg ${color}`}><Icon size={22} /></div>
      <div>
        <p className="text-sm text-av-muted">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}