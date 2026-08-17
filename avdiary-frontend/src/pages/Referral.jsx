import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Gift, Copy, CheckCircle, TrendingUp, CreditCard, Share2, UserPlus
} from 'lucide-react';
import { referralAPI } from '../api';
import { useUser } from '../context/UserContext';
import toast, { Toaster } from 'react-hot-toast';

export default function ReferralPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [points, setPoints] = useState(0);
  const [friends, setFriends] = useState([]);
  const [copied, setCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);

  useEffect(() => {
    const fetchReferralInfo = async () => {
      try {
        setLoading(true);
        const data = await referralAPI.getInfo();
        setReferralCode(data.referralCode || '');
        setReferralLink(`https://avdiary.com/register?ref=${data.referralCode}`);
        setPoints(data.points || 0);
        setFriends(data.friends || []);
        setLoading(false);
      } catch (err) {
        console.error('Referral fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchReferralInfo();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const redeemPlans = [
    { name: '1 Month Plan', cost: 400, icon: CreditCard, color: 'text-av-accent' },
    { name: '4 Month Plan', cost: 1500, icon: CreditCard, color: 'text-av-primary' },
    { name: '1 Year Plan', cost: 5000, icon: CreditCard, color: 'text-yellow-400' },
  ];

  const handleRedeem = (plan) => {
    setSelectedPlan(plan);
    setShowRedeemConfirm(true);
  };

  const confirmRedeem = () => {
    toast.success(`Redeemed ${selectedPlan.name} for ${selectedPlan.cost} points (simulated).`);
    setShowRedeemConfirm(false);
    setSelectedPlan(null);
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
        <p className="text-av-danger">Failed to load referral info</p>
        <p className="text-av-muted text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-av-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111827', color: '#f8fafc', border: '1px solid #1e293b' } }} />

      <div>
        <h1 className="text-2xl font-bold text-av-text">Invite Friends & Earn</h1>
        <p className="text-av-muted text-sm">Invite traders to AvDiary and get free subscription months!</p>
      </div>

      {/* Points balance */}
      <div className="glass-card p-6 flex items-center gap-6">
        <div className="p-4 rounded-xl bg-av-primary/10 text-av-primary">
          <Gift size={32} />
        </div>
        <div>
          <p className="text-sm text-av-muted">Your Points</p>
          <p className="text-3xl font-bold text-av-text">{points}</p>
        </div>
        <div className="ml-auto">
          <Link to="/subscription" className="btn-av-primary text-sm">Subscribe with Points</Link>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <UserPlus size={24} className="text-av-primary mb-2" />
          <h3 className="font-semibold text-av-text">1. Invite Friends</h3>
          <p className="text-sm text-av-muted">Share your referral link. You get 100 points for every friend who joins.</p>
        </div>
        <div className="glass-card p-4">
          <TrendingUp size={24} className="text-av-accent mb-2" />
          <h3 className="font-semibold text-av-text">2. Earn Points</h3>
          <p className="text-sm text-av-muted">You also earn points when you subscribe: 100 pts for 1m, 300 pts for 4m, 600 pts for 1y.</p>
        </div>
        <div className="glass-card p-4">
          <Gift size={24} className="text-yellow-400 mb-2" />
          <h3 className="font-semibold text-av-text">3. Redeem</h3>
          <p className="text-sm text-av-muted">Use points to get free subscription months: 400 pts = 1 month, 1500 pts = 4 months, 5000 pts = 1 year.</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold text-av-text mb-3 flex items-center gap-2">
          <Share2 size={20} className="text-av-primary" /> Your Referral Link
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="input-av flex-1"
          />
          <button onClick={handleCopyLink} className="btn-av-primary inline-flex items-center gap-2">
            {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <p className="text-xs text-av-muted mt-2">Or share code: <strong className="text-av-text text-lg">{referralCode}</strong></p>
      </div>

      {/* Friends list */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold text-av-text mb-4 flex items-center gap-2">
          <Users size={20} className="text-av-primary" /> Invited Friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="text-av-muted text-sm">No friends invited yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-av-muted border-b border-av-border">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Joined</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {friends.map((friend, idx) => (
                  <tr key={idx} className="border-b border-av-border/40">
                    <td className="py-2 pr-4 text-av-text font-medium">{friend.name}</td>
                    <td className="py-2 pr-4 text-av-muted">
                      {friend.created_at ? new Date(friend.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        friend.subscription_tier && friend.subscription_tier !== 'free'
                          ? 'bg-av-accent/20 text-av-accent'
                          : 'bg-av-warning/20 text-av-warning'
                      }`}>
                        {friend.subscription_tier && friend.subscription_tier !== 'free' ? 'subscribed' : 'registered'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Redeem points */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold text-av-text mb-4 flex items-center gap-2">
          <Gift size={20} className="text-av-primary" /> Redeem Points
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {redeemPlans.map((plan) => (
            <div key={plan.name} className="glass-card-interactive p-4 flex flex-col items-center text-center gap-3">
              <plan.icon size={24} className={plan.color} />
              <div>
                <p className="font-semibold text-av-text">{plan.name}</p>
                <p className="text-2xl font-bold text-av-text mt-1">{plan.cost} <span className="text-sm text-av-muted">pts</span></p>
              </div>
              <button
                onClick={() => handleRedeem(plan)}
                disabled={points < plan.cost}
                className={`btn-av-primary w-full text-sm ${points < plan.cost ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Redeem confirmation modal */}
      {showRedeemConfirm && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-md text-center animate-slide-up">
            <Gift size={40} className="text-av-primary mx-auto mb-3" />
            <h3 className="text-xl font-bold text-av-text mb-2">Confirm Redemption</h3>
            <p className="text-av-muted mb-4">
              Redeem <strong>{selectedPlan.cost} points</strong> for <strong>{selectedPlan.name}</strong>?
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowRedeemConfirm(false)} className="btn-av-ghost">Cancel</button>
              <button onClick={confirmRedeem} className="btn-av-primary">Yes, Redeem</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}