import { useState, useEffect } from 'react';
import {
  Users, CreditCard, Clock, DollarSign,
  CheckCircle, XCircle, Search,
  MessageSquare, Send, Pencil, Save, X, Shield, Calendar, Plus, Trash2
} from 'lucide-react';
import { adminAPI, messagesAPI, BACKEND_URL } from '../api';
import { useUser } from '../context/UserContext';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [users, setUsers] = useState([]);

  // Filters for users
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterPointsMin, setFilterPointsMin] = useState('');
  const [filterPointsMax, setFilterPointsMax] = useState('');

  // Inline editing of points
  const [editingUserId, setEditingUserId] = useState(null);
  const [editPointsValue, setEditPointsValue] = useState('');

  // Message modal
  const [messageModal, setMessageModal] = useState(null);
  const [messageText, setMessageText] = useState('');

  // ---------- Calendar management states ----------
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calLoading, setCalLoading] = useState(false);
  const [editingCalId, setEditingCalId] = useState(null);
  const [calForm, setCalForm] = useState({
    event_date: '',
    event_time: '',
    currency: '',
    event: '',
    impact: 'low',
    actual: '',
    forecast: '',
    previous: '',
    is_all_day: false,
  });

  // Delete calendar event modal
  const [deleteCalId, setDeleteCalId] = useState(null);

  // ---------- Access check ----------
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-av-bg">
        <div className="glass-card p-10 text-center max-w-md animate-slide-up">
          <div className="p-4 rounded-full bg-av-danger/10 w-fit mx-auto mb-4">
            <Shield size={40} className="text-av-danger" />
          </div>
          <h2 className="text-2xl font-bold text-av-text mb-2">Access Denied</h2>
          <p className="text-av-muted text-sm mb-4">You must be an admin to view this page.</p>
          <p className="text-av-muted text-xs mb-6">Please sign in with your admin credentials.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('avdiary-token');
                window.location.href = '/admin-login';
              }}
              className="btn-av-primary w-full"
            >
              Sign in as Admin
            </button>
            <button onClick={() => window.history.back()} className="btn-av-ghost w-full">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Fetch admin data ----------
  useEffect(() => {
    if (!user || user.role !== 'admin') { setLoading(false); return; }
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, paymentsData, usersData] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getPendingPayments(),
          adminAPI.getUsers(),
        ]);
        setStats(statsData);
        setPendingPayments(paymentsData.payments || []);
        setUsers(usersData.users || []);
      } catch (err) {
        console.error('Admin fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  // ---------- Fetch calendar events for admin management ----------
  const fetchCalendarAdmin = async () => {
    setCalLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/calendar?from=2020-01-01&to=2030-01-01`);
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.events || []);
      }
    } catch (err) { console.error(err); }
    setCalLoading(false);
  };

  useEffect(() => { fetchCalendarAdmin(); }, []);

  // ---------- Payment actions ----------
  const handlePaymentAction = async (paymentId, action) => {
    try {
      await adminAPI.handlePayment({ paymentId, action });
      setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
      toast.success(`Payment ${action}ed`);
      const statsData = await adminAPI.getStats();
      setStats(statsData);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ---------- Points editing ----------
  const startEditingPoints = (u) => {
    setEditingUserId(u.id);
    setEditPointsValue(u.points?.toString() || '0');
  };

  const savePoints = async (userId) => {
    const newPoints = parseInt(editPointsValue, 10);
    if (isNaN(newPoints) || newPoints < 0) {
      toast.error('Invalid points value');
      return;
    }

    try {
      const token = localStorage.getItem('avdiary-token');
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ points: newPoints }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update points');

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, points: newPoints } : u));
      setEditingUserId(null);
      toast.success('Points updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const cancelEditing = () => setEditingUserId(null);

  // ---------- Messaging ----------
  const openMessageModal = (userId, userName) => {
    setMessageModal({ userId, userName });
    setMessageText('');
  };

  const openMessageAllModal = () => {
    setMessageModal('all');
    setMessageText('');
  };

  const sendMessage = async () => {
    if (!messageText.trim()) { toast.error('Message cannot be empty'); return; }
    try {
      if (messageModal === 'all') {
        await adminAPI.messageAll({ content: messageText.trim() });
        toast.success(`Message sent to all users!`);
      } else {
        await messagesAPI.sendAdmin({ userId: messageModal.userId, content: messageText.trim() });
        toast.success(`Message sent to ${messageModal.userName}`);
      }
      setMessageModal(null);
      setMessageText('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ---------- Calendar event CRUD ----------
  const handleCalSubmit = async (e) => {
    e.preventDefault();
    const { event_date, event_time, currency, event, impact, is_all_day } = calForm;
    if (!event_date || !currency || !event) {
      toast.error('Missing required fields');
      return;
    }
    // If all-day, we don't require a time; otherwise time is required
    if (!is_all_day && !event_time) {
      toast.error('Time is required for non-all-day events');
      return;
    }
    try {
      const token = localStorage.getItem('avdiary-token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const body = JSON.stringify({
        ...calForm,
        event_time: is_all_day ? '00:00' : event_time,
        is_all_day: is_all_day ? 1 : 0,
      });

      const url = editingCalId
        ? `${BACKEND_URL}/api/calendar/admin/calendar/${editingCalId}`
        : `${BACKEND_URL}/api/calendar/admin/calendar`;

      const res = await fetch(url, {
        method: editingCalId ? 'PUT' : 'POST',
        headers,
        body
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.message || 'Request failed');
      }

      toast.success(editingCalId ? 'Event updated' : 'Event added');
      setEditingCalId(null);
      setCalForm({
        event_date: '',
        event_time: '',
        currency: '',
        event: '',
        impact: 'low',
        actual: '',
        forecast: '',
        previous: '',
        is_all_day: false,
      });
      fetchCalendarAdmin();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleCalDelete = (id) => {
    setDeleteCalId(id);
  };

  const confirmCalDelete = async () => {
    if (!deleteCalId) return;
    try {
      const token = localStorage.getItem('avdiary-token');
      if (!token) {
        toast.error('Not authenticated. Please log in again.');
        setDeleteCalId(null);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/calendar/admin/calendar/${deleteCalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.details || 'Delete failed');
      }

      toast.success('Event deleted');
      setDeleteCalId(null);
      fetchCalendarAdmin();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message);
      setDeleteCalId(null);
    }
  };

  const startEditCal = (ev) => {
    setEditingCalId(ev.id);
    setCalForm({
      event_date: ev.date?.slice(0,10) || '',
      event_time: ev.time || '',
      currency: ev.currency,
      event: ev.event,
      impact: ev.impact,
      actual: ev.actual || '',
      forecast: ev.forecast || '',
      previous: ev.previous || '',
      is_all_day: ev.is_all_day === 1,
    });
  };

  // ---------- Filtered users ----------
  const filteredUsers = users.filter(u => {
    const nameMatch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const tierMatch = filterTier ? u.subscription_tier === filterTier : true;
    const pointsMinMatch = filterPointsMin ? (u.points || 0) >= parseInt(filterPointsMin, 10) : true;
    const pointsMaxMatch = filterPointsMax ? (u.points || 0) <= parseInt(filterPointsMax, 10) : true;
    return nameMatch && tierMatch && pointsMinMatch && pointsMaxMatch;
  });

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
        <p className="text-av-danger">Failed to load admin data</p>
        <p className="text-av-muted text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-av-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111827', color: '#f8fafc', border: '1px solid #1e293b' } }} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-av-text">Admin Panel</h1>
          <p className="text-av-muted text-sm">Manage users, payments, and economic calendar</p>
        </div>
        <button onClick={openMessageAllModal} className="btn-av-primary flex items-center gap-2">
          <Send size={16} /> Message All Users
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="text-av-primary" />
        <StatCard icon={CreditCard} label="Active Subscribers" value={stats?.activeSubscribers || 0} color="text-av-accent" />
        <StatCard icon={Clock} label="Pending Payments" value={stats?.pendingPayments || 0} color="text-yellow-400" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`${stats?.totalRevenue || 0} ETB`} color="text-av-accent" />
      </div>

      {/* Pending payments */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-av-text mb-4 flex items-center gap-2">
          <Clock size={20} className="text-yellow-400" /> Pending Payments
        </h2>
        {pendingPayments.length === 0 ? (
          <p className="text-av-muted text-sm">No pending payments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-av-muted border-b border-av-border">
                <tr>
                  <th className="pb-2 pr-3 text-left">User</th>
                  <th className="pb-2 pr-3 text-left">Plan</th>
                  <th className="pb-2 pr-3 text-left">Amount</th>
                  <th className="pb-2 pr-3 text-left">Transaction ID</th>
                  <th className="pb-2 pr-3 text-left">Screenshot</th>
                  <th className="pb-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map(pay => (
                  <tr key={pay.id} className="border-b border-av-border/40 hover:bg-av-bg/30">
                    <td className="py-3 pr-3 font-medium text-av-text">{pay.user_name}</td>
                    <td className="py-3 pr-3 text-av-muted">{pay.plan?.replace('_', ' ')}</td>
                    <td className="py-3 pr-3 text-av-text">{pay.amount} ETB</td>
                    <td className="py-3 pr-3 text-av-muted font-mono">{pay.transaction_id}</td>
                    <td className="py-3 pr-3">
                      {pay.screenshot_url ? (
                        <a href={`${BACKEND_URL}${pay.screenshot_url}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={`${BACKEND_URL}${pay.screenshot_url}`}
                            alt="Screenshot"
                            className="w-12 h-8 object-cover rounded border border-av-border hover:opacity-80"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </a>
                      ) : '--'}
                    </td>
                    <td className="py-3 flex gap-2">
                      <button onClick={() => handlePaymentAction(pay.id, 'confirm')} className="px-3 py-1 rounded-lg bg-av-accent/20 text-av-accent hover:bg-av-accent hover:text-white transition-colors flex items-center gap-1 text-xs">
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button onClick={() => handlePaymentAction(pay.id, 'reject')} className="px-3 py-1 rounded-lg bg-av-danger/20 text-av-danger hover:bg-av-danger hover:text-white transition-colors flex items-center gap-1 text-xs">
                        <XCircle size={14} /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* User management */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-av-text mb-4 flex items-center gap-2">
          <Users size={20} className="text-av-primary" /> Users
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-av-muted" />
            <input type="text" placeholder="Name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-av pl-9 py-2 text-sm w-48" />
          </div>
          <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="input-av py-2 text-sm w-36">
            <option value="">All Tiers</option>
            <option value="free">Free</option>
            <option value="1_month">1 Month</option>
            <option value="4_months">4 Months</option>
            <option value="1_year">1 Year</option>
            <option value="admin">Admin</option>
          </select>
          <input type="number" placeholder="Min points" value={filterPointsMin} onChange={e => setFilterPointsMin(e.target.value)} className="input-av py-2 text-sm w-24" />
          <input type="number" placeholder="Max points" value={filterPointsMax} onChange={e => setFilterPointsMax(e.target.value)} className="input-av py-2 text-sm w-24" />
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-av-muted text-sm">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-av-muted border-b border-av-border">
                <tr>
                  <th className="pb-2 pr-3 text-left">Name</th>
                  <th className="pb-2 pr-3 text-left">Email</th>
                  <th className="pb-2 pr-3 text-left">Subscription</th>
                  <th className="pb-2 pr-3 text-left">Role</th>
                  <th className="pb-2 pr-3 text-left">Points</th>
                  <th className="pb-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-av-border/40 hover:bg-av-bg/30">
                    <td className="py-3 pr-3 text-av-text font-medium">{u.name}</td>
                    <td className="py-3 pr-3 text-av-muted">{u.email}</td>
                    <td className="py-3 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.subscription_tier === 'free' ? 'bg-av-border text-av-muted' : 'bg-av-accent/20 text-av-accent'}`}>{u.subscription_tier || 'free'}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-av-primary/20 text-av-primary' : 'text-av-muted'}`}>{u.role}</span>
                    </td>
                    <td className="py-3 pr-3">
                      {editingUserId === u.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" value={editPointsValue} onChange={e => setEditPointsValue(e.target.value)} className="input-av py-1 text-sm w-20" min="0" />
                          <button onClick={() => savePoints(u.id)} className="text-av-accent hover:text-av-text"><Save size={16} /></button>
                          <button onClick={cancelEditing} className="text-av-danger hover:text-av-text"><X size={16} /></button>
                        </div>
                      ) : (
                        <span className="font-mono text-av-text">{u.points || 0}</span>
                      )}
                    </td>
                    <td className="py-3 flex gap-2">
                      {editingUserId !== u.id && <button onClick={() => startEditingPoints(u)} className="text-av-muted hover:text-av-primary" title="Edit points"><Pencil size={14} /></button>}
                      <button onClick={() => openMessageModal(u.id, u.name)} className="text-av-muted hover:text-av-accent" title="Send message"><MessageSquare size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Calendar Management */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-av-text mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-av-primary" /> Economic Calendar Management
        </h2>
        <p className="text-xs text-av-muted mb-3">
          ⚠️ All times must be in <strong>Cairo time (EET/EEST)</strong>. The market page will display them exactly as entered.
        </p>
        <form onSubmit={handleCalSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <input type="date" value={calForm.event_date} onChange={e => setCalForm({...calForm, event_date: e.target.value})} className="input-av text-sm" required />
          <input type="time" value={calForm.event_time} onChange={e => setCalForm({...calForm, event_time: e.target.value})} className="input-av text-sm" disabled={calForm.is_all_day} />
          <input type="text" placeholder="Currency (e.g. USD)" value={calForm.currency} onChange={e => setCalForm({...calForm, currency: e.target.value})} className="input-av text-sm" required />
          <input type="text" placeholder="Event name" value={calForm.event} onChange={e => setCalForm({...calForm, event: e.target.value})} className="input-av text-sm" required />
          
          {/* Impact dropdown – now includes "Holiday" */}
          <select value={calForm.impact} onChange={e => setCalForm({...calForm, impact: e.target.value})} className="input-av text-sm">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="holiday">Holiday</option>
          </select>
          
          <input type="text" placeholder="Actual" value={calForm.actual} onChange={e => setCalForm({...calForm, actual: e.target.value})} className="input-av text-sm" />
          <input type="text" placeholder="Forecast" value={calForm.forecast} onChange={e => setCalForm({...calForm, forecast: e.target.value})} className="input-av text-sm" />
          <input type="text" placeholder="Previous" value={calForm.previous} onChange={e => setCalForm({...calForm, previous: e.target.value})} className="input-av text-sm" />
          
          <div className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              id="is_all_day"
              checked={calForm.is_all_day}
              onChange={(e) => {
                const checked = e.target.checked;
                setCalForm(prev => ({
                  ...prev,
                  is_all_day: checked,
                  event_time: checked ? '00:00' : prev.event_time,
                }));
              }}
              className="w-4 h-4 rounded border-av-border"
            />
            <label htmlFor="is_all_day" className="text-sm text-av-muted">All Day (24h event)</label>
          </div>
          
          <button type="submit" className="btn-av-primary text-sm">{editingCalId ? 'Update' : 'Add'} Event</button>
          {editingCalId && <button type="button" onClick={() => { setEditingCalId(null); setCalForm({ event_date: '', event_time: '', currency: '', event: '', impact: 'low', actual: '', forecast: '', previous: '', is_all_day: false }); }} className="btn-av-ghost text-sm">Cancel</button>}
        </form>

        {/* Events table – displays impact with correct styling */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-av-muted border-b border-av-border"><th className="pb-2 pr-3">Date</th><th className="pb-2 pr-3">Time (EAT)</th><th className="pb-2 pr-3">Currency</th><th className="pb-2 pr-3">Event</th><th className="pb-2 pr-3">Impact</th><th className="pb-2">Actions</th></tr></thead>
            <tbody>
              {calendarEvents.map(ev => (
                <tr key={ev.id} className="border-b border-av-border/40 hover:bg-av-bg/30">
                  <td className="py-2 pr-3">{ev.date?.slice(0,10)}</td>
                  <td className="py-2 pr-3">{ev.is_all_day ? 'All Day' : ev.time}</td>
                  <td className="py-2 pr-3">{ev.currency}</td>
                  <td className="py-2 pr-3">{ev.event}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      ev.impact === 'high' ? 'bg-av-danger/20 text-av-danger' :
                      ev.impact === 'medium' ? 'bg-av-warning/20 text-av-warning' :
                      ev.impact === 'low' ? 'bg-yellow-400/20 text-yellow-400' :
                      ev.impact === 'holiday' ? 'bg-gray-400/20 text-gray-400' :
                      'bg-gray-400/20 text-gray-400'
                    }`}>
                      {ev.impact === 'holiday' ? 'Holiday' : ev.impact}
                    </span>
                  </td>
                  <td className="py-2 flex gap-2">
                    <button onClick={() => startEditCal(ev)} className="text-av-muted hover:text-av-primary" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => handleCalDelete(ev.id)} className="text-av-muted hover:text-av-danger" title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Message Modal */}
      {messageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-md w-full animate-slide-up">
            <h3 className="text-xl font-bold text-av-text mb-4">
              {messageModal === 'all' ? 'Message All Users' : `Message to ${messageModal.userName}`}
            </h3>
            <textarea rows={4} placeholder="Write your message..." value={messageText} onChange={e => setMessageText(e.target.value)} className="input-av resize-none mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setMessageModal(null)} className="btn-av-ghost">Cancel</button>
              <button onClick={sendMessage} className="btn-av-primary flex items-center gap-2"><Send size={16} /> Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Calendar Event Confirmation Modal */}
      {deleteCalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-sm w-full text-center animate-slide-up">
            <div className="p-3 rounded-full bg-av-danger/10 w-fit mx-auto mb-4">
              <Trash2 size={32} className="text-av-danger" />
            </div>
            <h3 className="text-xl font-bold text-av-text mb-2">Delete Event?</h3>
            <p className="text-av-muted mb-6">Are you sure you want to permanently delete this event?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteCalId(null)} className="btn-av-ghost">Cancel</button>
              <button onClick={confirmCalDelete} className="btn-av-primary bg-av-danger hover:bg-red-700">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card-interactive p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-av-bg ${color}`}><Icon size={22} /></div>
      <div>
        <p className="text-sm text-av-muted">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}