import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  LayoutGrid, List, ExternalLink, BookOpen, X, PieChart as PieChartIcon, BarChart3,
  Pencil, Trash2, Save, TrendingUp, Globe, Clock, AlertTriangle, Smile, ImageIcon, FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { tradesAPI } from '../api';
import toast from 'react-hot-toast';

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

// ---------- Session colors ----------
const sessionColors = {
  'London': '#38bdf8',
  'New York': '#b91c1c',
  'Sydney': '#f97316',
  'Asian (Tokyo)': '#eab308',
  'Asian + London': '#84cc16',
  'London + New York': '#facc15',
};

const SESSION_OPTIONS = ['Asian (Tokyo)', 'London', 'New York', 'Sydney', 'Asian + London', 'London + New York'];
const INFLUENCE_OPTIONS = ['Technical Analysis', 'Fundamental News', 'Economic Calendar Event', 'Support/Resistance Level', 'Trend Continuation', 'Reversal Pattern', 'Price Action', 'Other'];
const EMOTION_OPTIONS = ['Confident', 'Neutral', 'Anxious', 'Excited', 'Frustrated', 'Disciplined', 'Revenge Trading'];

export default function Journal() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [searchPair, setSearchPair] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentMonth, setCurrentMonth] = useState(6);
  const [currentYear, setCurrentYear] = useState(2026);
  const [showCalendar, setShowCalendar] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [showCharts, setShowCharts] = useState(true);

  const [editingTrade, setEditingTrade] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteTradeId, setDeleteTradeId] = useState(null);

  // ---------- Fetch trades ----------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await tradesAPI.getAll({ limit: 100 });
        setTrades(data.trades || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---------- Derived data ----------
  const filteredTrades = useMemo(() => {
    let result = trades;
    if (selectedDate) result = result.filter(t => t.date?.slice(0,10) === selectedDate);
    if (searchPair.trim()) result = result.filter(t => t.pair.toUpperCase().includes(searchPair.trim().toUpperCase()));
    if (filterSession) result = result.filter(t => t.session === filterSession);
    if (filterPosition) result = result.filter(t => t.position === filterPosition);
    return result;
  }, [trades, selectedDate, searchPair, filterSession, filterPosition]);

  const chartData = useMemo(() => {
    const win = filteredTrades.filter(t => t.pnl > 0).length;
    const loss = filteredTrades.filter(t => t.pnl < 0).length;
    const be = filteredTrades.filter(t => t.pnl === 0).length;
    const pieData = [
      { name: 'Win', value: win, color: '#14b8a6' },
      { name: 'Loss', value: loss, color: '#ef4444' },
      { name: 'BE', value: be, color: '#6b7280' },
    ].filter(d => d.value > 0);

    const sessionMap = {};
    filteredTrades.forEach(t => {
      if (!sessionMap[t.session]) sessionMap[t.session] = 0;
      sessionMap[t.session] += Number(t.pnl);
    });
    const barData = Object.entries(sessionMap).map(([name, value]) => ({ name, value: value.toFixed(2) }));
    return { pieData, barData };
  }, [filteredTrades]);

  const paginatedTrades = filteredTrades.slice(0, page * perPage);
  const hasMore = page * perPage < filteredTrades.length;

  const grouped = trades.reduce((map, t) => {
    const d = t.date?.slice(0,10) || '';
    if (!map[d]) map[d] = [];
    map[d].push(t);
    return map;
  }, {});
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const isWinDay = (dayTrades) => dayTrades.reduce((sum, t) => sum + Number(t.pnl), 0) > 0;

  // ---------- Handlers ----------
  const handleDayClick = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSelectedDate(null);
    setSearchPair('');
    setFilterSession('');
    setFilterPosition('');
    setPage(1);
  };

  const handleDelete = (id) => { setDeleteTradeId(id); };

  const confirmDelete = async () => {
    if (deleteTradeId) {
      try {
        await tradesAPI.delete(deleteTradeId);
        setTrades(prev => prev.filter(t => t.id !== deleteTradeId));
        toast.success('Trade deleted');
      } catch (err) {
        toast.error(err.message);
      }
      setDeleteTradeId(null);
    }
  };

  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setEditForm({
      ...trade,
      startTime: trade.start_time || '',
      endTime: trade.end_time || '',
      tradingview_url: trade.tradingview_url || '',
      influence: trade.influence || '',
      customInfluence: trade.customInfluence || '',
      emotion: trade.emotion || '',
      session: trade.session || '',
      pair: trade.pair,
      position: trade.position,
      pnl: trade.pnl,
      rr: trade.rr || '',
      wick_tp: trade.wick_tp || '',
      wick_ls: trade.wick_ls || '',
      body_tp: trade.body_tp || '',
      wick_be: trade.wick_be || '',
      body_ls: trade.body_ls || '',
      body_be: trade.body_be || '',
      notes: trade.notes || '',
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm) return;
    if (!editForm.pair || !editForm.startTime || !editForm.endTime || !editForm.session || !editForm.tradingview_url || !editForm.influence || !editForm.emotion) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await tradesAPI.update(editForm.id, editForm);
      setTrades(prev => prev.map(t => t.id === editForm.id ? { ...editForm, date: editForm.startTime.slice(0,10) } : t));
      toast.success('Trade updated');
    } catch (err) {
      toast.error(err.message);
    }
    setEditingTrade(null);
    setEditForm(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-av-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-av-danger">Failed to load trades</p>
        <p className="text-av-muted text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-av-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-av-text">Trade Journal</h1>
          <p className="text-av-muted text-sm">Analyze, edit, and delete your trades</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCharts(!showCharts)} className="btn-av-ghost text-sm flex items-center gap-1">
            {showCharts ? <BarChart3 size={16} /> : <PieChartIcon size={16} />}
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
          <Link to="/journal/new" className="btn-av-primary inline-flex items-center gap-2">
            <PlusCircle size={18} /> Log New Trade
          </Link>
        </div>
      </div>

      {/* Charts (collapsible) */}
      {showCharts && filteredTrades.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-av-text mb-2">Win / Loss / BE</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30} paddingAngle={5}>
                  {chartData.pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-av-text mb-2">P&L by Session (USD)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.barData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {chartData.barData.map((entry, index) => (
                    <Cell key={index} fill={sessionColors[entry.name] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowCalendar(!showCalendar)} className={`btn-av-ghost text-sm ${selectedDate ? 'border-av-primary text-av-primary' : ''}`}>
          <SlidersHorizontal size={16} /> {selectedDate ? selectedDate : 'Date'}
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-av-muted" />
          <input type="text" placeholder="Pair..." value={searchPair} onChange={e => { setSearchPair(e.target.value); setPage(1); }} className="input-av pl-9 py-2 text-sm w-28" />
          {searchPair && <button onClick={() => setSearchPair('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={14} /></button>}
        </div>
        <select value={filterSession} onChange={e => { setFilterSession(e.target.value); setPage(1); }} className="input-av py-2 text-sm w-36">
          <option value="">All Sessions</option>
          {SESSION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPosition} onChange={e => { setFilterPosition(e.target.value); setPage(1); }} className="input-av py-2 text-sm w-24">
          <option value="">All</option>
          {['BUY','SELL'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(selectedDate || searchPair || filterSession || filterPosition) && (
          <button onClick={clearAllFilters} className="text-xs text-av-primary hover:underline">Clear all</button>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode==='grid' ? 'bg-av-primary/20 text-av-primary' : 'text-av-muted'}`}><LayoutGrid size={18} /></button>
          <button onClick={() => setViewMode('table')} className={`p-2 rounded ${viewMode==='table' ? 'bg-av-primary/20 text-av-primary' : 'text-av-muted'}`}><List size={18} /></button>
        </div>
      </div>

      {/* Calendar (collapsible) */}
      {showCalendar && (
        <div className="glass-card p-3 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setCurrentMonth(m => m === 0 ? 11 : m - 1)} className="p-1"><ChevronLeft size={16} /></button>
            <h3 className="text-sm font-semibold">{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => setCurrentMonth(m => m === 11 ? 0 : m + 1)} className="p-1"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-av-muted mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-center">{d}</div>)}
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
                  className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] font-medium border ${
                    isSelected ? 'border-av-primary bg-av-primary/10 text-av-primary' :
                    has ? (win ? 'border-av-accent bg-av-accent/10 text-av-accent' : 'border-av-danger bg-av-danger/10 text-av-danger') :
                    'border-transparent hover:border-av-border text-av-text'
                  }`}>{day}{has && <span className="text-[8px]">{dayTrades.length}t</span>}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* Trades display */}
      {filteredTrades.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-av-muted">No trades found.</p>
          {clearAllFilters && <button onClick={clearAllFilters} className="text-av-primary text-sm mt-2 hover:underline">Clear filters</button>}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedTrades.map(trade => <TradeCard key={trade.id} trade={trade} onEdit={handleEdit} onDelete={handleDelete} />)}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-av-muted border-b border-av-border">
              <th className="pb-2 pr-3">Date</th><th className="pb-2 pr-3">Pair</th><th className="pb-2 pr-3">Pos</th><th className="pb-2 pr-3">P&L</th><th className="pb-2 pr-3">R:R</th><th className="pb-2 pr-3">Session</th><th className="pb-2 pr-3">Chart</th><th className="pb-2">Actions</th>
            </tr></thead>
            <tbody>
              {paginatedTrades.map(trade => (
                <tr key={trade.id} className="border-b border-av-border/50 hover:bg-av-bg/30">
                  <td className="py-2 pr-3 text-av-muted">{trade.date?.slice(0,10)}</td>
                  <td className="py-2 pr-3 font-medium">{trade.pair}</td>
                  <td className="py-2 pr-3"><span className={`px-2 py-0.5 rounded-full text-xs ${trade.position==='BUY'?'bg-av-accent/20 text-av-accent':'bg-av-danger/20 text-av-danger'}`}>{trade.position}</span></td>
                  <td className={`py-2 pr-3 font-medium ${Number(trade.pnl)>0?'text-av-accent':Number(trade.pnl)<0?'text-av-danger':'text-gray-400'}`}>${Number(trade.pnl).toFixed(2)}</td>
                  <td className="py-2 pr-3 text-av-text font-mono">{trade.rr ? `1:${trade.rr}` : '—'}</td>
                  <td className="py-2 pr-3 text-av-muted">{trade.session}</td>
                  <td className="py-2 pr-3"><a href={trade.tradingview_url} target="_blank" className="text-av-primary flex items-center gap-1"><ExternalLink size={14}/>View</a></td>
                  <td className="py-2 flex gap-2">
                    <button onClick={() => handleEdit(trade)} className="text-av-muted hover:text-av-primary"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(trade.id)} className="text-av-muted hover:text-av-danger"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button onClick={() => setPage(p => p + 1)} className="btn-av-ghost text-sm">
            Load More ({filteredTrades.length - paginatedTrades.length} remaining)
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingTrade && editForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-av-text">Edit Trade</h2>
              <button onClick={() => { setEditingTrade(null); setEditForm(null); }} className="text-av-muted hover:text-av-text"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4">
              {/* Start/End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5"><Clock size={16} className="inline mr-1.5" /> Start Time (EAT)</label>
                  <input type="datetime-local" value={editForm.startTime} onChange={e => setEditForm({...editForm, startTime: e.target.value})} className="input-av" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5"><Clock size={16} className="inline mr-1.5" /> End Time (EAT)</label>
                  <input type="datetime-local" value={editForm.endTime} onChange={e => setEditForm({...editForm, endTime: e.target.value})} className="input-av" required />
                </div>
              </div>
              {/* Pair & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5"><TrendingUp size={16} className="inline mr-1.5" /> Pair</label>
                  <input type="text" value={editForm.pair} onChange={e => setEditForm({...editForm, pair: e.target.value.toUpperCase()})} className="input-av" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5">Position</label>
                  <div className="flex gap-2">
                    {['BUY','SELL'].map(pos => (
                      <button key={pos} type="button" onClick={() => setEditForm({...editForm, position: pos})}
                        className={`flex-1 py-2 rounded-xl font-medium text-sm ${editForm.position === pos ? (pos==='BUY'?'bg-av-accent text-white':'bg-av-danger text-white') : 'bg-av-bg text-av-muted border border-av-border'}`}>{pos}</button>
                    ))}
                  </div>
                </div>
              </div>
              {/* P&L */}
              <div>
                <label className="block text-sm font-medium text-av-muted mb-1.5">P&L ($)</label>
                <input type="number" step="0.01" value={editForm.pnl} onChange={e => setEditForm({...editForm, pnl: e.target.value})} className="input-av" />
              </div>
              {/* R:R */}
              <div>
                <label className="block text-sm font-medium text-av-muted mb-1.5">
                  Risk-Reward Ratio (1:<span className="text-av-primary">R</span>)
                </label>
                <select value={editForm.rr || ''} onChange={e => setEditForm({...editForm, rr: e.target.value})} className="input-av">
                  <option value="">Select R value</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(r => <option key={r} value={r}>1:{r}</option>)}
                </select>
              </div>
              {/* Candlestick details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5">Wick TP</label>
                  <input type="text" value={editForm.wick_tp || ''} onChange={e => setEditForm({...editForm, wick_tp: e.target.value})} className="input-av" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5">Wick LS</label>
                  <input type="text" value={editForm.wick_ls || ''} onChange={e => setEditForm({...editForm, wick_ls: e.target.value})} className="input-av" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5">Body TP</label>
                  <input type="text" value={editForm.body_tp || ''} onChange={e => setEditForm({...editForm, body_tp: e.target.value})} className="input-av" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5">Wick BE</label>
                  <input type="text" value={editForm.wick_be || ''} onChange={e => setEditForm({...editForm, wick_be: e.target.value})} className="input-av" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5">Body LS</label>
                  <input type="text" value={editForm.body_ls || ''} onChange={e => setEditForm({...editForm, body_ls: e.target.value})} className="input-av" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-av-muted mb-1.5">Body BE</label>
                  <input type="text" value={editForm.body_be || ''} onChange={e => setEditForm({...editForm, body_be: e.target.value})} className="input-av" />
                </div>
              </div>
              {/* Session */}
              <div>
                <label className="block text-sm font-medium text-av-muted mb-1.5"><Globe size={16} className="inline mr-1.5" /> Session</label>
                <select value={editForm.session} onChange={e => setEditForm({...editForm, session: e.target.value})} className="input-av" required>
                  {SESSION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* TradingView URL */}
              <div>
                <label className="block text-sm font-medium text-av-muted mb-1.5"><ImageIcon size={16} className="inline mr-1.5" /> TradingView Link</label>
                <input type="url" value={editForm.tradingview_url} onChange={e => setEditForm({...editForm, tradingview_url: e.target.value})} className="input-av" required />
              </div>
              {/* Influence */}
              <div>
                <label className="block text-sm font-medium text-av-muted mb-1.5"><AlertTriangle size={16} className="inline mr-1.5" /> Influence</label>
                <select value={editForm.influence} onChange={e => setEditForm({...editForm, influence: e.target.value})} className="input-av" required>
                  {INFLUENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {editForm.influence === 'Other' && (
                  <input type="text" placeholder="Describe" value={editForm.customInfluence} onChange={e => setEditForm({...editForm, customInfluence: e.target.value})} className="input-av mt-2" />
                )}
              </div>
              {/* Emotion */}
              <div>
                <label className="block text-sm font-medium text-av-muted mb-1.5"><Smile size={16} className="inline mr-1.5" /> Emotion</label>
                <select value={editForm.emotion} onChange={e => setEditForm({...editForm, emotion: e.target.value})} className="input-av" required>
                  {EMOTION_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-av-muted mb-1.5"><FileText size={16} className="inline mr-1.5" /> Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="input-av resize-none" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-av-border">
                <button type="button" onClick={() => { setEditingTrade(null); setEditForm(null); }} className="btn-av-ghost">Cancel</button>
                <button type="submit" className="btn-av-primary flex items-center gap-2"><Save size={18} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTradeId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-sm w-full text-center animate-slide-up">
            <div className="p-3 rounded-full bg-av-danger/10 w-fit mx-auto mb-4">
              <Trash2 size={32} className="text-av-danger" />
            </div>
            <h3 className="text-xl font-bold text-av-text mb-2">Delete Trade?</h3>
            <p className="text-av-muted mb-6">This action cannot be undone. Are you sure you want to permanently delete this trade?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTradeId(null)} className="btn-av-ghost">Cancel</button>
              <button onClick={confirmDelete} className="btn-av-primary bg-av-danger hover:bg-red-700">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- TradeCard component ----------
function TradeCard({ trade, onEdit, onDelete }) {
  const isWin = Number(trade.pnl) > 0, isLoss = Number(trade.pnl) < 0;
  const borderColor = isWin ? 'border-l-av-accent' : isLoss ? 'border-l-av-danger' : 'border-l-gray-500';
  const pnlColor = isWin ? 'text-av-accent' : isLoss ? 'text-av-danger' : 'text-gray-400';
  const posBadge = trade.position === 'BUY' ? 'bg-av-accent/20 text-av-accent' : 'bg-av-danger/20 text-av-danger';
  const imageSrc = trade.screenshot_url || getSnapshotUrl(trade.tradingview_url) || chartPlaceholder(trade.pair);

  return (
    <article className={`glass-card overflow-hidden flex flex-col card-glow border-l-2 ${borderColor}`}>
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
          <span className="text-xs text-av-muted">{trade.session}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${posBadge}`}>{trade.position==='BUY'?'LONG':'SHORT'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-av-text">{trade.pair}</span>
          <span className={`text-lg font-bold font-mono ${pnlColor}`}>{Number(trade.pnl)>=0?'+':''}{Number(trade.pnl).toFixed(2)} USD</span>
        </div>
        {/* R:R badge */}
        {trade.rr && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-av-muted">R:R</span>
            <span className="text-xs font-mono font-bold text-av-primary bg-av-primary/10 px-2 py-0.5 rounded">1:{trade.rr}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-1">
          <a href={trade.tradingview_url} target="_blank" className="text-xs text-av-primary hover:underline flex items-center gap-1"><ExternalLink size={12}/>View Chart</a>
          <div className="flex gap-2">
            <button onClick={() => onEdit(trade)} className="text-av-muted hover:text-av-primary"><Pencil size={14} /></button>
            <button onClick={() => onDelete(trade.id)} className="text-av-muted hover:text-av-danger"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}