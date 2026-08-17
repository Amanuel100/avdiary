import { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

const faqs = [
  {
    category: 'General',
    icon: HelpCircle,
    questions: [
      { q: 'What is AvDiary?', a: 'AvDiary is a smart trading journal powered by AI. It helps traders log trades, analyze performance, and receive personalised coaching based on their own data.' },
      { q: 'Is AvDiary free to use?', a: 'You can register and access basic features like the dashboard and messages. Premium features such as the full journal, AI coach, and market tools require a subscription.' },
      { q: 'Can I use AvDiary on mobile?', a: 'Yes! AvDiary is fully responsive and works on any device – phone, tablet, or desktop.' },
    ],
  },
  {
    category: 'Trading Journal',
    icon: Sparkles,
    questions: [
      { q: 'What can I track in the journal?', a: 'You can log currency pair, position (BUY/SELL), profit/loss, trading session, start/end time, TradingView chart link, what influenced the trade, your emotion, and notes.' },
      { q: 'Can I edit or delete a trade?', a: 'Absolutely. Every trade has edit and delete options. You can also filter trades by date, pair, session, or position.' },
      { q: 'How do I add a TradingView chart?', a: 'When logging a trade, paste the TradingView share link. AvDiary automatically converts it to a snapshot image for your journal cards.' },
    ],
  },
  {
    category: 'AI Coach & Insights',
    icon: Sparkles,
    questions: [
      { q: 'How does the AI coach work?', a: 'Our AI analyzes your trade history and gives you personalised tips – for example, it might tell you that you lose more on Mondays or during the New York session.' },
      { q: 'Can I chat with the AI?', a: 'Yes! Use the dedicated Chat page or the floating chat button. The AI has access to your trade data and can answer specific questions about your performance.' },
      { q: 'Can the AI analyze chart images?', a: 'Yes, you can paste a TradingView link into the chat and the AI will read the chart, identify trends, support/resistance, and patterns.' },
    ],
  },
  {
    category: 'Market Overview',
    icon: Sparkles,
    questions: [
      { q: 'What does the Market page show?', a: 'It displays a live 24‑hour Forex session clock (in Ethiopian time), real‑time Cairo and Addis Ababa clocks, and an economic calendar with impact levels (high/medium/low).' },
      { q: 'Where does the economic calendar data come from?', a: 'We fetch real economic events from Finnhub, a leading financial data provider. Event times are displayed in Cairo time (EET/EEST).' },
      { q: 'Can I see next week’s events?', a: 'Yes, use the Previous / Next week buttons to navigate forward or backward through the calendar.' },
    ],
  },
  {
    category: 'Subscription & Payments',
    icon: Sparkles,
    questions: [
      { q: 'What plans do you offer?', a: 'We offer three plans: 1 Month (199 ETB), 4 Months (599 ETB, save 25%), and 1 Year (1499 ETB, save 37%).' },
      { q: 'How do I pay?', a: 'You can pay via Telebirr. Send the amount to our Telebirr number, enter the transaction ID, and optionally upload a screenshot. An admin will confirm your payment.' },
      { q: 'Can I subscribe using points?', a: 'Yes! If you have enough points (400 pts = 1m, 1500 pts = 4m, 5000 pts = 1y), you can redeem them directly – no admin approval needed.' },
    ],
  },
  {
    category: 'Referral & Points',
    icon: Sparkles,
    questions: [
      { q: 'How do I earn points?', a: 'You earn points when you subscribe (100/300/600 pts depending on the plan) and when friends you refer join AvDiary (100 pts per referral).' },
      { q: 'How does the referral program work?', a: 'Every user gets a unique 7‑digit referral code. Share it with friends – when they sign up with your code, you get 100 points.' },
      { q: 'What can I do with points?', a: 'Redeem points for free subscription months! Visit the Referral page to see your balance and choose a plan.' },
    ],
  },
  {
    category: 'Account & Profile',
    icon: Sparkles,
    questions: [
      { q: 'How do I change my profile picture?', a: 'Go to Profile Settings. Click on the avatar to upload a new image (max 15 MB). The picture will be compressed and updated instantly across all pages.' },
      { q: 'Can I change my password?', a: 'Yes, in the Profile Settings page. Enter your current password, then choose a new one (minimum 6 characters).' },
      { q: 'What if I forget my password?', a: 'Currently, you can create a new account or contact support. A password reset feature is in development.' },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in px-[5px] py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-av-text">Frequently Asked Questions</h1>
        <p className="text-av-muted text-sm max-w-xl mx-auto">
          Everything you need to know about AvDiary – the smart trading journal.
        </p>
      </div>

      {/* FAQ categories */}
      <div className="space-y-6">
        {faqs.map((category, catIndex) => {
          const Icon = category.icon;
          return (
            <div key={catIndex} className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-av-text flex items-center gap-2 mb-4">
                <Icon size={22} className="text-av-primary" />
                {category.category}
              </h2>
              <div className="space-y-2">
                {category.questions.map((item, qIndex) => {
                  const globalIndex = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === globalIndex;
                  return (
                    <div key={qIndex} className="border border-av-border/40 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggle(globalIndex)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left bg-av-surface/50 hover:bg-av-bg/50 transition-colors"
                      >
                        <span className="font-medium text-av-text pr-4">{item.q}</span>
                        <ChevronDown
                          size={20}
                          className={`text-av-muted transition-transform duration-300 flex-shrink-0 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-5 pb-4 pt-1 text-av-muted text-sm leading-relaxed">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Still have questions? */}
      <div className="text-center py-8">
       <p className="text-av-muted text-sm">
  Still have questions?{' '}
  <a
    href="https://t.me/YOUR_TELEGRAM_USERNAME"   // ← replace with your real Telegram link
    target="_blank"
    rel="noopener noreferrer"
    className="text-av-primary hover:underline"
  >
    Contact us on Telegram
  </a>
</p>
      </div>
    </div>
  );
}