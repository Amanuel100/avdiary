import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Newspaper, BookOpen, MessageSquare,
  CreditCard, Bell, Menu, X, LogOut, User, Sun, Moon,
  Settings, ChevronDown, MessageCircle, Gift, HelpCircle, Send, Mic
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Footer from './Footer';
import { useUser } from '../context/UserContext';
import { messagesAPI, referralAPI, authAPI } from '../api';

// ---------- Chat Panel (same as before) ----------
function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Ask me anything about your trading performance.', time: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text, time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('avdiary-token');
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI failed');
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, time: new Date().toISOString() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding.', time: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setInput(spokenText);
      sendMessage(spokenText);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[450px] glass-card border border-av-primary/30 shadow-2xl rounded-2xl flex flex-col animate-slide-up overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-av-border">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-av-primary" />
          <span className="font-semibold text-av-text">AvDiary AI</span>
        </div>
        <button onClick={onClose} className="text-av-muted hover:text-av-text"><X size={18} /></button>
      </div>
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-sm">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-2.5 rounded-xl ${
              msg.role === 'user' ? 'bg-av-primary text-white rounded-tr-none' : 'bg-av-surface border border-av-border text-av-text rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-av-surface border border-av-border p-2.5 rounded-xl rounded-tl-none text-av-muted text-xs flex items-center gap-2">
              <MessageCircle size={14} className="animate-pulse" /> Thinking…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-av-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about your trades…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            className="input-av text-sm flex-1"
            disabled={loading}
          />
          <button
            onClick={startListening}
            disabled={listening}
            className={`p-2 rounded-xl transition-colors ${
              listening ? 'bg-av-danger text-white animate-pulse' : 'bg-av-surface text-av-muted hover:text-av-primary border border-av-border'
            }`}
            title="Voice input"
          >
            <Mic size={18} />
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="btn-av-primary p-2 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Layout ----------
export default function Layout({ children, isLoggedIn, setIsLoggedIn }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const profileRef = useRef(null);
  const { user, updateUser } = useUser();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await messagesAPI.getAll({ limit: 1 });
        setUnreadCount(data.unread || 0);
      } catch (error) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncProfile = async () => {
      if (!localStorage.getItem('avdiary-token')) return;
      try {
        const data = await authAPI.getProfile();
        if (data.user) {
          updateUser(data.user);
        }
      } catch (err) {}
    };
    syncProfile();
    const interval = setInterval(syncProfile, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncProfile = async () => {
      if (!localStorage.getItem('avdiary-token')) return;
      try {
        const data = await authAPI.getProfile();
        if (data.user) {
          updateUser({
            name: data.user.name,
            image: data.user.image,
          });
        }
      } catch (err) {
        console.error('Failed to sync profile on mount', err);
      }
    };
    syncProfile();
  }, []);

  useEffect(() => {
    const handleMessagesUpdated = () => {
      messagesAPI.getAll({ limit: 1 }).then(data => {
        setUnreadCount(data.unread || 0);
      }).catch(() => {});
    };
    window.addEventListener('messages-updated', handleMessagesUpdated);
    return () => window.removeEventListener('messages-updated', handleMessagesUpdated);
  }, []);

  const [friendCount, setFriendCount] = useState(0);
  useEffect(() => {
    const fetchFriendCount = async () => {
      if (!localStorage.getItem('avdiary-token')) return;
      try {
        const refData = await referralAPI.getInfo();
        setFriendCount(refData.friends ? refData.friends.length : 0);
      } catch (err) {}
    };
    fetchFriendCount();
  }, []);

  useEffect(() => {
    document.title = unreadCount > 0
      ? `(${unreadCount}) AvDiary – Smart Trading Journal`
      : 'AvDiary – Smart Trading Journal';
  }, [unreadCount]);

  const navItems = [
    { href: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/market',      label: 'Market',       icon: Newspaper },
    { href: '/journal',     label: 'Journal',      icon: BookOpen },
    { href: '/messages',    label: 'Messages',     icon: MessageSquare },
    { href: '/faq',         label: 'FAQ',          icon: HelpCircle },
    { href: '/subscription', label: 'Subscription', icon: CreditCard },
  ];

  const isActive = (path) => location.pathname === path;

  const handleSignOut = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('avdiary-token');
    navigate('/');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sidebarWidth = desktopCollapsed ? 'w-16' : 'w-64';

  return (
    <div className="min-h-screen flex flex-col bg-av-bg">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex flex-col ${sidebarWidth} bg-av-surface border-r border-av-border p-2 transition-all duration-300`}>
          {/* Logo */}
          <div className={`flex items-center ${desktopCollapsed ? 'justify-center' : 'justify-start'} mb-8 mt-2 px-2`}>
            {!desktopCollapsed ? (
              <Link to="/" className="flex items-center gap-2">
                <img src="/favicon.png" alt="AvDiary" className="h-8 w-auto" />
                <span className="text-xl font-bold text-av-text">
                  Av<span className="text-av-primary">Diary</span>
                </span>
              </Link>
            ) : (
              <Link to="/" className="flex items-center justify-center">
                <img src="/favicon.png" alt="AvDiary" className="h-8 w-auto" />
              </Link>
            )}
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(href)
                    ? 'bg-av-primary/10 text-av-primary border border-av-primary/20'
                    : 'text-av-muted hover:bg-av-bg hover:text-av-text'
                } ${desktopCollapsed ? 'justify-center' : ''}`}
                title={desktopCollapsed ? label : ''}
              >
                <Icon size={18} />
                {!desktopCollapsed && (
                  <span className="flex items-center gap-2">
                    {label}
                    {label === 'Messages' && unreadCount > 0 && (
                      <span className="ml-auto bg-av-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                )}
                {desktopCollapsed && label === 'Messages' && unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-av-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center translate-x-1 -translate-y-1">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {!desktopCollapsed && (
            <Link to="/referral" className="glass-card p-3 mb-4 hover:border-av-primary/30 transition-all">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-av-primary" />
                <span className="text-xs font-medium text-av-text">Invite Friends</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-av-accent">{user?.points || 0} pts</span>
                <span className="text-[10px] text-av-muted">{friendCount} friend{friendCount !== 1 ? 's' : ''}</span>
              </div>
            </Link>
          )}
          {desktopCollapsed && (
            <Link to="/referral" className="flex justify-center p-2 mb-4 text-av-muted hover:text-av-primary" title="Invite Friends">
              <Gift size={20} />
            </Link>
          )}

          <div className="border-t border-av-border pt-4 mt-4">
            <div className={`flex items-center gap-3 px-2 ${desktopCollapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-av-primary/20 flex items-center justify-center overflow-hidden">
                {user.image ? (
                  <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-av-primary" />
                )}
              </div>
              {!desktopCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-av-text truncate">{user.name || 'Trader'}</p>
                  <p className="text-xs text-av-muted truncate">{user.subscription_tier === 'free' ? 'Free Plan' : user.subscription_tier}</p>
                </div>
              )}
            </div>
            {!desktopCollapsed && (
              <button
                onClick={handleSignOut}
                className="mt-2 flex items-center gap-2 px-3 py-2 w-full text-xs text-av-muted hover:text-av-danger rounded-lg hover:bg-av-danger/10 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            )}
            {desktopCollapsed && (
              <button
                onClick={handleSignOut}
                className="mt-2 flex items-center justify-center p-2 w-full text-av-muted hover:text-av-danger rounded-lg hover:bg-av-danger/10 transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-av-surface border-b border-av-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <button
                className="lg:hidden p-2 text-av-muted hover:text-av-text"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <button
                className="hidden lg:block p-2 text-av-muted hover:text-av-text"
                onClick={() => setDesktopCollapsed(!desktopCollapsed)}
                title={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-av-text hidden sm:block">
                {navItems.find(item => isActive(item.href))?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button onClick={toggleTheme} className="p-2 text-av-muted hover:text-av-text rounded-lg transition-colors">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/messages" className="relative p-2 text-av-muted hover:text-av-text">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-av-danger text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg text-av-muted hover:text-av-text transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-av-primary/20 flex items-center justify-center overflow-hidden">
                    {user.image ? (
                      <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-av-primary" />
                    )}
                  </div>
                  <ChevronDown size={14} className="hidden sm:block" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-card border border-av-border rounded-xl shadow-lg py-1 z-50 animate-fade-in">
                    <button
                      onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-av-text hover:bg-av-bg w-full"
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                    <button
                      onClick={() => { handleSignOut(); setProfileOpen(false); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-av-danger hover:bg-av-danger/10 w-full"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-[5px] overflow-x-hidden">
            {children}
          </main>
          <Footer />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-av-surface border-r border-av-border p-4 flex flex-col animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                <img src="/favicon.png" alt="AvDiary" className="h-8 w-auto" />
                <span className="text-lg font-bold text-av-text">
                  Av<span className="text-av-primary">Diary</span>
                </span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-av-muted hover:text-av-text">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive(href)
                      ? 'bg-av-primary/10 text-av-primary border border-av-primary/20'
                      : 'text-av-muted hover:bg-av-bg hover:text-av-text'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                  {label === 'Messages' && unreadCount > 0 && (
                    <span className="ml-auto bg-av-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <Link to="/referral" className="glass-card p-3 my-3 hover:border-av-primary/30 transition-all" onClick={() => setSidebarOpen(false)}>
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-av-primary" />
                <span className="text-xs font-medium text-av-text">Invite Friends</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-av-accent">{user?.points || 0} pts</span>
                <span className="text-[10px] text-av-muted">{friendCount} friend{friendCount !== 1 ? 's' : ''}</span>
              </div>
            </Link>
            <div className="border-t border-av-border pt-4 mt-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-av-primary/20 flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-av-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-av-text truncate">{user.name || 'Trader'}</p>
                  <p className="text-xs text-av-muted truncate">{user.subscription_tier === 'free' ? 'Free Plan' : user.subscription_tier}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-2 flex items-center gap-2 px-3 py-2 w-full text-xs text-av-muted hover:text-av-danger rounded-lg hover:bg-av-danger/10 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-av-primary text-white shadow-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center border-2 border-av-primary/50 hover:border-av-primary animate-pulse-slow group"
      >
        <MessageCircle size={24} />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-av-surface text-av-text text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-av-border">
          Chat here
        </span>
      </button>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  );
}