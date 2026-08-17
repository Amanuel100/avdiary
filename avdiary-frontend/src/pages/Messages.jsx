import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Shield, MessageSquare, ExternalLink, Mail, Trash2, CheckCheck } from 'lucide-react';
import Loader from '../components/Loader';
import toast, { Toaster } from 'react-hot-toast';
import { messagesAPI } from '../api';

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMessages() {
    try {
      setLoading(true);
      const data = await messagesAPI.getAll();
      setMessages(data.messages || []);
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const markAsRead = async (id) => {
    try {
      await messagesAPI.markRead(id);
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, read: true } : m))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Notify Layout to refresh its unread count
      window.dispatchEvent(new CustomEvent('messages-updated'));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = messages.filter(m => !m.read).map(m => m.id);
    if (unreadIds.length === 0) {
      toast('All messages are already read');
      return;
    }

    try {
      await messagesAPI.markAllRead();
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('messages-updated'));
      toast.success('All messages marked as read');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <Loader count={3} />;

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-av-danger">Failed to load messages</p>
        <p className="text-av-muted text-sm">{error}</p>
        <button onClick={fetchMessages} className="btn-av-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111827', color: '#f8fafc', border: '1px solid #1e293b' } }} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-av-text">Messages</h1>
          <p className="text-sm text-av-muted">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-av-ghost text-sm flex items-center gap-1"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
          <div className="relative">
            <Mail size={24} className="text-av-muted" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-av-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages list */}
      {messages.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30 text-av-muted" />
          <p className="text-av-muted mb-2">No messages yet.</p>
          <p className="text-sm text-av-muted/70">
            AI coaching tips will appear here after you've logged some trades.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => !msg.read && markAsRead(msg.id)}
              className={`glass-card p-5 flex items-start gap-4 transition-all hover:border-av-primary/20 cursor-pointer ${
                msg.read ? 'opacity-70' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.type === 'ai' ? 'bg-av-accent/20 text-av-accent' : 'bg-av-primary/20 text-av-primary'
                }`}
              >
                {msg.type === 'ai' ? <Bot size={20} /> : <Shield size={20} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-av-text">
                    {msg.type === 'ai' ? 'AI Coach' : 'Admin'}
                  </span>
                  <span className="text-xs text-av-muted">{formatDate(msg.created_at)}</span>
                  {!msg.read && <span className="w-2 h-2 rounded-full bg-av-primary" />}
                </div>
                <p className="text-av-text text-sm whitespace-pre-wrap">{msg.content}</p>

                {msg.type === 'ai' && (
                  <Link to="/chat" className="inline-flex items-center gap-1 mt-2 text-xs text-av-primary hover:underline">
                    <ExternalLink size={12} />
                    Chat with AvDiary
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}