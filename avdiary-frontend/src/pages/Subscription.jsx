import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  ShieldCheck, Clock, AlertCircle, CheckCircle, Gift, X, Send, Camera, Loader
} from 'lucide-react';
import { paymentsAPI, authAPI } from '../api';
import { useUser } from '../context/UserContext';

const POINTS_COST = { '1_month': 400, '4_months': 1500, '1_year': 5000 };

const plans = [
  { name: '1_month', label: '1 Month', price: 199, originalPrice: null, discount: null, features: ['Full journal access', 'AI coaching', 'Market calendar'] },
  { name: '4_months', label: '4 Months', price: 599, originalPrice: 796, discount: '25', features: ['Everything in 1 Month', 'Priority support'] },
  { name: '1_year', label: '1 Year', price: 1499, originalPrice: 2388, discount: '37', features: ['Everything in 4 Months', 'Exclusive AI reports', 'Early access to features'] },
];

export default function SubscriptionPage() {
  const { user, updateUser } = useUser();
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState(null);

  // Telebirr modal state
  const [telebirrModal, setTelebirrModal] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Points modals
  const [insufficientModal, setInsufficientModal] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  // ---------- Refresh user profile ----------
  const refreshUser = async () => {
    try {
      const data = await authAPI.getProfile();
      if (data.user) {
        updateUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile', err);
    }
  };

  // ---------- Fetch subscription status ----------
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoadingStatus(true);
        const data = await paymentsAPI.getStatus();
        if (data.active) {
          setActiveSubscription({ plan: data.plan, expiry: data.expiry });
          setPaymentStatus('confirmed');
        } else {
          setActiveSubscription(null);
          setPaymentStatus(data.status || null);
        }
      } catch (err) {
        console.error('Failed to fetch subscription status:', err);
        toast.error('Could not load subscription status');
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();
  }, []);

  // ---------- Countdown timer ----------
  useEffect(() => {
    if (!activeSubscription || !activeSubscription.expiry) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(activeSubscription.expiry);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft({ expired: true });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, expired: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSubscription]);

  // ---------- Telebirr flow ----------
  const openTelebirrModal = (plan) => {
    setTelebirrModal({ plan });
    setTransactionId('');
    setScreenshot(null);
    setSubmitting(false);
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('Screenshot must be smaller than 5MB');
      e.target.value = '';
      return;
    }
    setScreenshot(file);
  };

  const handleTelebirrSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      toast.error('Transaction ID is required');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('plan', telebirrModal.plan.name);
      formData.append('amount', telebirrModal.plan.price);
      formData.append('transactionId', transactionId.trim());
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      await paymentsAPI.submit(formData);
      setPaymentStatus('pending');
      setTelebirrModal(null);
      toast.success('Payment submitted! Awaiting admin confirmation.');
      refreshUser();
    } catch (err) {
      toast.error(err.message || 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Points flow ----------
  const handlePointsSubscription = (plan) => {
    const required = POINTS_COST[plan.name];
    const userPoints = user?.points || 0;
    if (userPoints >= required) {
      setSuccessModal({ plan: plan.label, cost: required });
    } else {
      setInsufficientModal({ plan: plan.label, needed: required, have: userPoints });
    }
  };

  const confirmPointsSubscription = async () => {
    const newTier = POINTS_COST[successModal.plan] === 400 ? '1_month' :
                    POINTS_COST[successModal.plan] === 1500 ? '4_months' : '1_year';

    updateUser({
      ...user,
      subscription_tier: newTier,
      points: user.points - successModal.cost,
    });

    setActiveSubscription({ plan: successModal.plan, expiry: null });
    setPaymentStatus('confirmed');
    setSuccessModal(null);
    toast.success(`Subscribed to ${successModal.plan} using points!`);
    refreshUser();
  };

  // ---------- Render ----------
  if (loadingStatus) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-av-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111827', color: '#f8fafc', border: '1px solid #1e293b' } }} />

      <div>
        <h1 className="text-2xl font-bold text-av-text">Subscription</h1>
        <p className="text-av-muted mt-1">Choose a plan or use your points</p>
      </div>

      {/* Points balance */}
      <div className="glass-card p-5 flex items-center gap-4 bg-av-primary/5 border border-av-primary/20">
        <div className="p-3 rounded-xl bg-av-primary/10 text-av-primary"><Gift size={24} /></div>
        <div className="flex-1">
          <p className="text-sm text-av-muted">Your Points</p>
          <p className="text-2xl font-bold text-av-text">{user?.points || 0}</p>
        </div>
        <div className="text-xs text-av-muted">Redeemable for free months</div>
      </div>

      {/* Active subscription banner with countdown */}
      {activeSubscription && (
        <div className={`glass-card p-5 flex items-center gap-3 border ${
          timeLeft?.expired ? 'bg-av-danger/5 border-av-danger/40' : 'bg-av-accent/5 border-av-accent/30'
        }`}>
          <ShieldCheck className={timeLeft?.expired ? 'text-av-danger' : 'text-av-accent'} size={24} />
          <div className="flex-1">
            <p className="font-semibold text-av-text">
              Active: {activeSubscription.plan}
              {timeLeft?.expired && (
                <span className="ml-2 text-sm font-bold text-av-danger">(Expired)</span>
              )}
            </p>
            {activeSubscription.expiry && !timeLeft?.expired && (
              <p className="text-sm text-av-muted">
                Expires in:{' '}
                <span className="font-mono font-bold text-av-text">
                  {timeLeft?.days}d {String(timeLeft?.hours).padStart(2,'0')}h {String(timeLeft?.minutes).padStart(2,'0')}m {String(timeLeft?.seconds).padStart(2,'0')}s
                </span>
              </p>
            )}
            {timeLeft?.expired && (
              <p className="text-sm text-av-danger font-medium">
                Your subscription has expired. Renew now to keep access.
              </p>
            )}
          </div>
          {timeLeft?.expired && (
            <button
              onClick={() => window.location.reload()}
              className="btn-av-primary text-sm"
            >
              Renew
            </button>
          )}
        </div>
      )}

      {/* Pricing cards – unchanged */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className="glass-card p-6 flex flex-col transition-all duration-300 hover:border-av-primary/30 hover:scale-[1.02]">
            {plan.discount && (
              <div className="self-start mb-3 px-3 py-1 rounded-full text-xs font-bold bg-av-accent/20 text-av-accent border border-av-accent/30">
                Save {plan.discount}%
              </div>
            )}
            <h3 className="text-lg font-semibold text-av-text mb-1">{plan.label}</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-av-text">{plan.price.toLocaleString()}</span>
              <span className="text-av-muted text-sm">ETB</span>
            </div>
            {plan.originalPrice && (
              <p className="text-sm text-av-muted line-through mb-4">{plan.originalPrice.toLocaleString()} ETB</p>
            )}
            {!plan.originalPrice && <div className="mb-4" />}
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-av-muted">
                  <CheckCircle size={16} className="text-av-accent flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="space-y-2 mt-auto">
              <button
                onClick={() => openTelebirrModal(plan)}
                disabled={paymentStatus === 'pending'}
                className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                  paymentStatus === 'pending'
                    ? 'bg-av-bg text-av-muted border border-av-border cursor-not-allowed'
                    : 'bg-av-primary text-white hover:bg-blue-600'
                }`}
              >
                {paymentStatus === 'pending' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader size={16} className="animate-spin" /> Waiting for confirmation
                  </span>
                ) : (
                  `Pay with Telebirr – ${plan.price} ETB`
                )}
              </button>

              <button
                onClick={() => handlePointsSubscription(plan)}
                disabled={(user?.points || 0) < POINTS_COST[plan.name]}
                className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                  (user?.points || 0) >= POINTS_COST[plan.name]
                    ? 'bg-av-accent text-white hover:bg-teal-600'
                    : 'bg-av-bg text-av-muted border border-av-border cursor-not-allowed'
                }`}
              >
                {(user?.points || 0) >= POINTS_COST[plan.name]
                  ? `Subscribe with Points (${POINTS_COST[plan.name]} pts)`
                  : `Need ${POINTS_COST[plan.name]} pts`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Payment status messages – unchanged */}
      {paymentStatus === 'pending' && !activeSubscription && (
        <div className="glass-card p-6 flex items-center gap-3 text-yellow-400">
          <Clock size={24} />
          <div>
            <p className="font-semibold">Payment under review</p>
            <p className="text-sm text-av-muted">Admin will confirm soon. You'll receive a message.</p>
          </div>
        </div>
      )}
      {paymentStatus === 'rejected' && !activeSubscription && (
        <div className="glass-card p-6 flex items-center gap-3 text-av-danger">
          <AlertCircle size={24} />
          <div>
            <p className="font-semibold">Payment rejected</p>
            <p className="text-sm text-av-muted">Check admin message and re‑upload.</p>
          </div>
        </div>
      )}

      {/* Telebirr Modal */}
      {telebirrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-av-text">Pay with Telebirr</h3>
              <button onClick={() => setTelebirrModal(null)} className="text-av-muted hover:text-av-text"><X size={20} /></button>
            </div>

            <div className="bg-av-bg rounded-xl p-4 text-av-muted space-y-2 text-sm mb-4">
              <p>1. Send <strong className="text-av-text">{telebirrModal.plan.price} ETB</strong> to:</p>
              <p className="font-mono text-lg text-av-text">📞 09XX-XXXX-XXXX</p>
              <p className="text-av-text font-medium">Account: AvDiary Trading Journal</p>
              <p>2. Write your AvDiary email in the reference.</p>
              <p>3. Enter the transaction ID below. Upload screenshot if available (optional).</p>
            </div>

            <form onSubmit={handleTelebirrSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-av-muted mb-1.5">Transaction ID *</label>
                <input type="text" placeholder="Enter Telebirr transaction ID" value={transactionId} onChange={e => setTransactionId(e.target.value)} className="input-av" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-av-muted mb-1.5">Screenshot (optional, max 5MB)</label>
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleScreenshotChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="input-av flex items-center gap-2 cursor-pointer">
                    <Camera size={18} className="text-av-muted" />
                    <span className="text-av-muted">{screenshot ? screenshot.name : 'Click to upload screenshot'}</span>
                  </div>
                </div>
                {screenshot && <p className="text-xs text-av-accent mt-1">{screenshot.name} ({(screenshot.size / 1024).toFixed(1)} KB)</p>}
              </div>
              <button type="submit" disabled={submitting} className="btn-av-primary w-full flex items-center justify-center gap-2">
                {submitting ? <><Loader size={18} className="animate-spin" /> Submitting…</> : <><Send size={18} /> Submit Payment</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Insufficient Points Modal */}
      {insufficientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-sm w-full text-center animate-slide-up">
            <div className="p-3 rounded-full bg-av-danger/10 w-fit mx-auto mb-4">
              <AlertCircle size={32} className="text-av-danger" />
            </div>
            <h3 className="text-xl font-bold text-av-text mb-2">Not Enough Points</h3>
            <p className="text-av-muted mb-4">
              You need <strong className="text-av-text">{insufficientModal.needed} points</strong> for the {insufficientModal.plan}, but you only have <strong className="text-av-text">{insufficientModal.have} points</strong>.
            </p>
            <button onClick={() => setInsufficientModal(null)} className="btn-av-primary w-full">Got it</button>
          </div>
        </div>
      )}

      {/* Success Modal (points) */}
      {successModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-sm w-full text-center animate-slide-up">
            <div className="p-3 rounded-full bg-av-accent/10 w-fit mx-auto mb-4">
              <CheckCircle size={32} className="text-av-accent" />
            </div>
            <h3 className="text-xl font-bold text-av-text mb-2">Subscription Activated!</h3>
            <p className="text-av-muted mb-1">
              You redeemed <strong className="text-av-text">{successModal.cost} points</strong> for
            </p>
            <p className="text-lg font-bold text-av-accent mb-6">{successModal.plan}</p>
            <button onClick={confirmPointsSubscription} className="btn-av-primary w-full">Confirm & Activate</button>
          </div>
        </div>
      )}
    </div>
  );
}