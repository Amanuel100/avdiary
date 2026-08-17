import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, TrendingUp, Globe, FileText,
  Clock, AlertTriangle, Smile, Image
} from 'lucide-react';

const SESSION_OPTIONS = [
  'Asian (Tokyo)',
  'London',
  'New York',
  'Sydney',
  'Asian + London',
  'London + New York',
];

const INFLUENCE_OPTIONS = [
  'Technical Analysis',
  'Fundamental News',
  'Economic Calendar Event',
  'Support/Resistance Level',
  'Trend Continuation',
  'Reversal Pattern',
  'Price Action',
  'Other'
];

const EMOTION_OPTIONS = [
  'Confident',
  'Neutral',
  'Anxious',
  'Excited',
  'Frustrated',
  'Disciplined',
  'Revenge Trading'
];

const RR_OPTIONS = ['1:1', '1:2', '1:3', '1:4', '1:5', '2:1', '3:1', 'Other'];
const WICK_BODY_OPTIONS = ['Wick', 'Body'];

export default function NewTradePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const eatTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const defaultTime = eatTime.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"

  const [form, setForm] = useState({
    start_time: defaultTime,
    end_time: '',
    pair: '',
    position: 'BUY',
    pnl: '',
    session: '',
    tradingview_url: '',
    influence: '',
    customInfluence: '',
    emotion: '',
    risk_reward: '',
    customRR: '',
    tp_type: '',
    sl_type: '',
    breakeven: false,
    notes: '',
    screenshot_url: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const calcDuration = () => {
    if (!form.start_time || !form.end_time) return null;
    const start = new Date(form.start_time);
    const end = new Date(form.end_time);
    if (isNaN(start) || isNaN(end) || end <= start) return null;
    const diffMs = end - start;
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return '<1 min';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.pair.trim()) { toast.error('Currency pair is required'); return; }
    if (!form.start_time) { toast.error('Start time is required'); return; }
    if (!form.end_time) { toast.error('End time is required'); return; }
    if (new Date(form.end_time) <= new Date(form.start_time)) { toast.error('End must be after start'); return; }
    if (!form.session) { toast.error('Trading session is required'); return; }
    if (!form.tradingview_url.trim()) { toast.error('TradingView chart link is required'); return; }
    try { new URL(form.tradingview_url); } catch { toast.error('Invalid TradingView URL'); return; }
    if (!form.influence) { toast.error('Please select what influenced this trade'); return; }
    if (form.influence === 'Other' && !form.customInfluence.trim()) { toast.error('Please specify the influence'); return; }
    if (!form.emotion) { toast.error('Emotion is required'); return; }
    if (!form.risk_reward) { toast.error('Risk:Reward is required'); return; }
    if (form.risk_reward === 'Other' && !form.customRR.trim()) { toast.error('Specify custom R:R'); return; }
    if (!form.tp_type) { toast.error('TP type is required'); return; }
    if (!form.sl_type) { toast.error('SL type is required'); return; }

    setLoading(true);
    try {
      const body = {
        pair: form.pair.trim().toUpperCase(),
        position: form.position,
        pnl: parseFloat(form.pnl) || 0,
        session: form.session,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        tradingview_url: form.tradingview_url.trim(),
        influence: form.influence === 'Other' ? form.customInfluence.trim() : form.influence,
        emotion: form.emotion,
        risk_reward: form.risk_reward === 'Other' ? form.customRR.trim() : form.risk_reward,
        tp_type: form.tp_type,
        sl_type: form.sl_type,
        breakeven: form.breakeven,
        notes: form.notes.trim() || null,
        screenshot_url: form.screenshot_url.trim() || null,
      };

      const token = localStorage.getItem('avdiary-token');
      const res = await fetch('http://localhost:5000/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save trade');

      toast.success('Trade saved!');
      navigate('/journal');
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/journal" className="p-2 rounded-lg text-av-muted hover:text-av-text hover:bg-av-border/30">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-av-text">Log New Trade</h1>
          <p className="text-sm text-av-muted">All fields required unless marked optional</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-5 space-y-5">
        {/* Start/End time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-av-muted mb-1.5">
              <Clock size={16} className="inline mr-1.5" /> Start Time (EAT)
            </label>
            <input type="datetime-local" name="start_time" value={form.start_time} onChange={handleChange} className="input-av" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-av-muted mb-1.5">
              <Clock size={16} className="inline mr-1.5" /> End Time (EAT)
            </label>
            <input type="datetime-local" name="end_time" value={form.end_time} onChange={handleChange} className="input-av" required />
          </div>
        </div>
        {calcDuration() && (
          <p className="text-xs text-av-accent">
            <Clock size={14} /> Duration: {calcDuration()}
          </p>
        )}

        {/* Pair & Position */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-av-muted mb-1.5">
              <TrendingUp size={16} className="inline mr-1.5" /> Currency Pair *
            </label>
            <input type="text" name="pair" value={form.pair} onChange={handleChange} placeholder="EUR/USD" className="input-av" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-av-muted mb-1.5">Position *</label>
            <div className="flex gap-2">
              {['BUY', 'SELL'].map(pos => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, position: pos }))}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                    form.position === pos
                      ? pos === 'BUY' ? 'bg-av-accent text-white shadow-av-glow' : 'bg-av-danger text-white shadow-av-glow'
                      : 'bg-av-bg text-av-muted border border-av-border hover:border-av-primary/30'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* P&L */}
        <div>
          <label className="block text-sm font-medium text-av-muted mb-1.5">
            Profit / Loss ($)
          </label>
          <input type="number" step="0.01" name="pnl" value={form.pnl} onChange={handleChange} placeholder="e.g. 25.00 or -15.50" className="input-av" />
        </div>

        {/* Session */}
        <div>
          <label className="block text-sm font-medium text-av-muted mb-1.5">
            <Globe size={16} className="inline mr-1.5" /> Trading Session *
          </label>
          <select name="session" value={form.session} onChange={handleChange} className="input-av" required>
            <option value="">Select session</option>
            {SESSION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* TradingView URL */}
        <div>
          <label className="block text-sm font-medium text-av-muted mb-1.5">
            <Image size={16} className="inline mr-1.5" /> TradingView Chart Link *
          </label>
          <input type="url" name="tradingview_url" value={form.tradingview_url} onChange={handleChange} placeholder="https://www.tradingview.com/chart/..." className="input-av" required />
        </div>

        {/* R:R + TP Type + SL Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-av-muted mb-1.5">Risk:Reward *</label>
            <select name="risk_reward" value={form.risk_reward} onChange={handleChange} className="input-av" required>
              <option value="">Select R:R</option>
              {RR_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {form.risk_reward === 'Other' && (
              <input type="text" name="customRR" value={form.customRR} onChange={handleChange} placeholder="e.g. 1:2.5" className="input-av mt-2" required />
            )}
          </div>
        </div>

        {/* Break-even checkbox */}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="breakeven" name="breakeven" checked={form.breakeven} onChange={handleChange} className="w-4 h-4 rounded border-av-border" />
          <label htmlFor="breakeven" className="text-sm text-av-muted">Trade hit break‑even (no profit, no loss)</label>
        </div>

        {/* Influence factor */}
        <div>
          <label className="block text-sm font-medium text-av-muted mb-1.5">
            <AlertTriangle size={16} className="inline mr-1.5" /> What influenced this trade? *
          </label>
          <select name="influence" value={form.influence} onChange={handleChange} className="input-av" required>
            <option value="">Select factor</option>
            {INFLUENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {form.influence === 'Other' && (
            <input type="text" name="customInfluence" value={form.customInfluence} onChange={handleChange} placeholder="Describe the influence" className="input-av mt-2" required />
          )}
        </div>

        {/* Emotion */}
        <div>
          <label className="block text-sm font-medium text-av-muted mb-1.5">
            <Smile size={16} className="inline mr-1.5" /> How did you feel? *
          </label>
          <select name="emotion" value={form.emotion} onChange={handleChange} className="input-av" required>
            <option value="">Select emotion</option>
            {EMOTION_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-av-muted mb-1.5">
            <FileText size={16} className="inline mr-1.5" /> Additional Notes (optional)
          </label>
          <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} placeholder="Any extra thoughts?" className="input-av resize-none" />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-av-border">
          <Link to="/journal" className="btn-av-ghost">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-av-primary flex items-center gap-2">
            <Save size={18} />
            {loading ? 'Saving…' : 'Save Trade'}
          </button>
        </div>
      </form>
    </div>
  );
}