import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Tag,
  RotateCcw,
  ShieldAlert,
  Clock,
  CreditCard,
  RefreshCw,
  Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ExplanationTopic = 
  | 'pricing'
  | 'returns'
  | 'warranties'
  | 'subscriptions'
  | 'renewal'
  | 'payments'
  | 'urgency';

export interface TopicData {
  id: ExplanationTopic;
  title: string;
  categoryLabel: string;
  emoji: string;
  icon: React.ElementType;
  plainEnglishSummary: string;
  commonPhrases: Array<{
    term: string;
    translation: string;
  }>;
  missingContextWarning: string;
  smartAdvice: string;
}

export const EXPLANATION_TOPICS: Record<ExplanationTopic, TopicData> = {
  pricing: {
    id: 'pricing',
    title: 'Pricing Language',
    categoryLabel: 'Pricing & Markdowns',
    emoji: '💰',
    icon: Tag,
    plainEnglishSummary:
      'Stores often invent inflated "original" prices so you feel like you are getting a historic bargain. The discounted price is often just the standard normal price.',
    commonPhrases: [
      {
        term: 'MSRP / Was $299.00',
        translation:
          'Manufacturers Suggest Retail Price is not what anyone actually pays; it is a benchmark anchor.',
      },
      {
        term: 'Up to 70% Off Today',
        translation:
          'Only one unpopular variant might be 70% off; the item you actually want is likely at regular cost.',
      },
      {
        term: 'Price match guarantee',
        translation:
          'Requires you to jump through refund hoops with strict exclusions on promotional or marketplace deals.',
      },
    ],
    missingContextWarning:
      'Because historical price charts or manufacturer wholesale sheets were not provided, whether this price is truly discounted depends on price history that was omitted.',
    smartAdvice: 'Search the exact model number on Google Shopping to see what other stores charge right now.',
  },

  returns: {
    id: 'returns',
    title: 'Return Policies',
    categoryLabel: 'Returns & Refunds',
    emoji: '📜',
    icon: RotateCcw,
    plainEnglishSummary:
      'A return policy is only good if returning the item is actually feasible. Beware of stores that make returning more expensive than keeping the item.',
    commonPhrases: [
      {
        term: 'All sales final',
        translation:
          'Zero returns or refunds for any reason whatsoever, even if it breaks within 24 hours of arrival.',
      },
      {
        term: 'Customer pays return shipping',
        translation:
          'On overseas dropshipped goods, shipping back to China or an international hub often costs $45–$80.',
      },
      {
        term: '20% restocking fee',
        translation:
          'The merchant docks 20% of your refund simply to process and put the returned box back on a shelf.',
      },
      {
        term: 'Store credit only',
        translation:
          'You will not get your cash or credit card balance back; you are forced to spend with them again.',
      },
    ],
    missingContextWarning:
      'Because the seller’s specific return depot address and condition criteria were not provided, the actual cost to return depends on terms that were not disclosed.',
    smartAdvice: 'If the return address is not listed inside your domestic country, treat the purchase as non-returnable.',
  },

  warranties: {
    id: 'warranties',
    title: 'Warranties',
    categoryLabel: 'Coverage & Guarantees',
    emoji: '🛡️',
    icon: ShieldCheck,
    plainEnglishSummary:
      'Most warranties only cover rare internal manufacturing defects. They almost never cover accidental damage, normal wear, or water exposure.',
    commonPhrases: [
      {
        term: 'Limited 1-year warranty',
        translation:
          'Only covers factory parts if you mail it to an authorized center at your own cost.',
      },
      {
        term: 'Lifetime guarantee',
        translation:
          'Often means the expected commercial "product lifetime" (e.g. 2–3 years), not your human lifetime.',
      },
      {
        term: 'Sold as-is / No warranty',
        translation:
          'The moment you tap pay, you accept all defects, missing parts, and breakdowns.',
      },
    ],
    missingContextWarning:
      'Without an official warranty policy document or authorized dealer certificate, actual coverage eligibility depends on manufacturer clauses that were not provided.',
    smartAdvice: 'Buying with a major credit card frequently doubles eligible manufacturer warranty periods automatically.',
  },

  subscriptions: {
    id: 'subscriptions',
    title: 'Subscriptions',
    categoryLabel: 'Recurring Billing',
    emoji: '🔁',
    icon: Repeat,
    plainEnglishSummary:
      'You are not just buying an item once. You are authorizing the merchant to bill your card repeatedly on a recurring calendar schedule.',
    commonPhrases: [
      {
        term: 'Subscribe & Save 15%',
        translation:
          'You get a slight discount today, but agree to continuous monthly shipments and recurring charges.',
      },
      {
        term: 'Monthly replenishment plan',
        translation:
          'A new shipment will bill automatically unless you explicitly remember to pause or cancel.',
      },
      {
        term: 'Annual billing, billed monthly',
        translation:
          'A 12-month legal contract with hefty early cancellation penalties if you try to stop early.',
      },
    ],
    missingContextWarning:
      'If recurring cycle dates, renewal billing amounts, or account management portals were not provided, your recurring financial commitment depends on hidden terms.',
    smartAdvice: 'Always set a phone calendar reminder 3 days before any renewal or subscription billing cycle.',
  },

  renewal: {
    id: 'renewal',
    title: 'Automatic Renewal',
    categoryLabel: 'Auto-Renew & Trials',
    emoji: '🔄',
    icon: RefreshCw,
    plainEnglishSummary:
      'Low introductory prices or "free trials" require your credit card so they can silently roll you into a full-price recurring subscription.',
    commonPhrases: [
      {
        term: '7-day trial for $1.00',
        translation:
          'On day 8, your card will automatically be charged the full rate ($49.99–$99.99/mo) without notice.',
      },
      {
        term: 'Renews automatically at standard rate',
        translation:
          'The promotional discount evaporates on renewal, and charges continue indefinitely until canceled.',
      },
      {
        term: 'Negative option billing',
        translation:
          'You are assumed to want the ongoing service unless you proactively contact them to decline.',
      },
    ],
    missingContextWarning:
      'If the exact cancellation procedure or renewal charge date was not specified at checkout, the upcoming charge depends on information that was not provided.',
    smartAdvice: 'Cancel the trial immediately after signing up—legitimate services let you keep your trial period active.',
  },

  payments: {
    id: 'payments',
    title: 'Payment Instructions',
    categoryLabel: 'Payment Safety',
    emoji: '💳',
    icon: CreditCard,
    plainEnglishSummary:
      'How you pay determines whether you have fraud protection. Using peer-to-peer apps or wire transfers strips away all chargeback safety.',
    commonPhrases: [
      {
        term: 'Pay via Zelle, CashApp, or Venmo',
        translation:
          'Treated like cash in an envelope. If the seller vanishes, your bank will not refund your money.',
      },
      {
        term: 'Friends & Family transfer',
        translation:
          'Specifically disables buyer purchase protection so you cannot file a dispute or claim a refund.',
      },
      {
        term: 'Wire transfer discount',
        translation:
          'Irreversible bank-to-bank transfer. Common tactic used by counterfeiters and fraudulent sellers.',
      },
    ],
    missingContextWarning:
      'If the merchant redirects to an off-site payment link or unencrypted portal, transaction security depends on processor credentials that were not provided.',
    smartAdvice: 'Always use a standard credit card (or PayPal Goods & Services) with statutory dispute and chargeback rights.',
  },

  urgency: {
    id: 'urgency',
    title: 'Marketing & Urgency',
    categoryLabel: 'Artificial Pressure',
    emoji: '⚡',
    icon: Clock,
    plainEnglishSummary:
      'Scarcity banners and ticking countdown timers are psychological tricks designed to bypass your rational thinking so you checkout without inspecting the fine print.',
    commonPhrases: [
      {
        term: 'Only 3 left in stock!',
        translation:
          'Frequently generated by random JavaScript scripts that reset every time a new visitor loads the page.',
      },
      {
        term: 'Sale ends in 04:59',
        translation:
          'Refresh the page in an incognito window: if the timer jumps back to 05:00, the urgency is fake.',
      },
      {
        term: '43 people have this in their cart',
        translation:
          'A fabricated social-proof widget intended to trigger FOMO (Fear Of Missing Out).',
      },
    ],
    missingContextWarning:
      'Because real-time seller inventory management databases cannot be audited, whether this stock limit is genuine depends on internal data that was not provided.',
    smartAdvice: 'When you feel sudden urgency to buy, step away for 15 minutes. True deals rarely evaporate in minutes.',
  },
};

interface ExplainSimplyModalProps {
  initialTopic?: ExplanationTopic;
  isOpen: boolean;
  onClose: () => void;
  customExplanations?: Record<string, string>;
}

export const ExplainSimplyModal: React.FC<ExplainSimplyModalProps> = ({
  initialTopic = 'pricing',
  isOpen,
  onClose,
  customExplanations,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<ExplanationTopic>(initialTopic);

  if (!isOpen) return null;

  const topicData = EXPLANATION_TOPICS[selectedTopic];
  const TopicIcon = topicData.icon;

  const topicKeys: ExplanationTopic[] = [
    'pricing',
    'returns',
    'warranties',
    'subscriptions',
    'renewal',
    'payments',
    'urgency',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-200/90 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Top Handle for mobile */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto sm:hidden mb-1" />

        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center text-lg font-bold shadow-2xs">
              💬
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Plain-English Translation
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                What does this really mean?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topic Selector Tabs (7 Supported Topics) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {topicKeys.map((key) => {
            const topic = EXPLANATION_TOPICS[key];
            const isSelected = selectedTopic === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTopic(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{topic.emoji}</span>
                <span>{topic.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Explanation Content Card */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{topicData.emoji}</span>
              <h3 className="text-base font-bold text-slate-900">
                {topicData.title}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {topicData.categoryLabel}
            </span>
          </div>

          {/* Plain English Core Meaning */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              The Plain Truth:
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
              {customExplanations?.[selectedTopic] || topicData.plainEnglishSummary}
            </p>
          </div>

          {/* Common Fine-Print Phrases Breakdown */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Common terms translated:
            </span>
            <div className="space-y-2">
              {topicData.commonPhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white border border-slate-200/80 text-xs space-y-1"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="text-emerald-600 font-extrabold">“</span>
                    <span>{phrase.term}</span>
                    <span className="text-emerald-600 font-extrabold">”</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    👉 {phrase.translation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* MANDATORY REQUIREMENT: Missing Context Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Missing Context Notice:</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              {topicData.missingContextWarning}
            </p>
          </div>

          {/* Actionable Advice */}
          <div className="flex items-start gap-2.5 pt-1 text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-200/60">
            <span className="font-bold text-emerald-700 shrink-0">💡 Tip:</span>
            <span className="leading-relaxed">{topicData.smartAdvice}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-[0.985] transition-all shadow-xs"
          >
            Got it, back to results
          </button>
        </div>
      </motion.div>
    </div>
  );
};
