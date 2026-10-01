import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  RotateCcw, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Info,
  MessageSquareQuote,
  Share2,
  Copy,
  Check,
  X,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SourceType, SOURCES } from './tabs/CheckTab';
import { ExplainSimplyModal, ExplanationTopic } from './ExplainSimplyModal';
import { WhatToDoNextSection } from './WhatToDoNextSection';
import { AiCheckSection } from './AiCheckSection';

export type ResultVerdict = 'reasonable' | 'pause' | 'dont_pay';
export type ConfidenceLevel = 'High' | 'Moderate' | 'Limited';

export interface SectionDetail {
  title: string;
  statusText: string;
  isPositive: boolean;
  isWarning?: boolean;
  notes: string[];
}

export interface ResultModel {
  verdict: ResultVerdict;
  verdictTitle: string;
  emoji: string;
  confidence: ConfidenceLevel;
  explanation: string;
  price: SectionDetail;
  seller: SectionDetail;
  terms: SectionDetail;
  redFlags: SectionDetail;
  couldNotVerify: string[];
}

export interface VerificationChecklistItem {
  id: string;
  label: string;
  description: string;
  priority?: 'urgent' | 'recommended' | 'standard' | string;
}

export interface StructuredAnalysisData {
  status: 'LOOKS_REASONABLE' | 'PAUSE_AND_CHECK' | 'DONT_PAY_YET';
  confidence: 'HIGH' | 'MODERATE' | 'LIMITED';
  summary: string;
  price_findings: SectionDetail;
  seller_findings: SectionDetail;
  terms_findings: SectionDetail;
  red_flags: SectionDetail;
  unverified_items: string[];
  next_steps?: {
    action: string;
    detail: string;
    tag: string;
  };
  verification_checklist?: VerificationChecklistItem[];
  seller_question?: string;
  simple_explanations?: Record<string, string>;
  isFallback?: boolean;
}

const PRESET_RESULTS: Record<ResultVerdict, ResultModel> = {
  reasonable: {
    verdict: 'reasonable',
    verdictTitle: 'LOOKS REASONABLE',
    emoji: '🟢',
    confidence: 'High',
    explanation:
      'Based on the information provided, this offer appears consistent with standard retail listings, with transparent return disclosures and no obvious recurring billing traps.',
    price: {
      title: 'PRICE',
      statusText: 'Appears Consistent',
      isPositive: true,
      notes: [
        'Stated pricing aligns with typical market retail expectations.',
        'No deceptive added-on fees identified in the submitted checkout screens.',
        'Promotional discount representation does not display obvious artificial inflation in the provided material.',
      ],
    },
    seller: {
      title: 'SELLER',
      statusText: 'Disclosed Merchant Details',
      isPositive: true,
      notes: [
        'Seller discloses direct customer support contact channels.',
        'Storefront information provided includes clear merchant identification.',
        'No immediate impersonation or high-risk seller indicators observed in submitted material.',
      ],
    },
    terms: {
      title: 'TERMS',
      statusText: 'Disclosed Return Terms',
      isPositive: true,
      notes: [
        'A stated 30-day return window is described in the provided terms.',
        'Terms do not indicate excessive restocking deductions in the submitted material.',
        'Standard warranty coverage is mentioned in the offer details.',
      ],
    },
    redFlags: {
      title: 'RED FLAGS',
      statusText: 'No High-Pressure Signals Observed',
      isPositive: true,
      notes: [
        'No artificial urgency countdown timers or fabricated popups detected in the submitted input.',
        'No undisclosed automatic subscription or auto-ship clauses found in the provided text.',
        'Imagery appears standard without obvious counterfeit or stolen indicator patterns.',
      ],
    },
    couldNotVerify: [
      'Physical item authenticity and manufacturing quality (cannot be confirmed from screenshots or links).',
      'Actual seller fulfillment transit times and warehouse dispatch reliability.',
      'How customer support handles refund disputes in practice.',
    ],
  },

  pause: {
    verdict: 'pause',
    verdictTitle: 'PAUSE & CHECK',
    emoji: '🟡',
    confidence: 'Moderate',
    explanation:
      'Take a quick pause before paying. While the item appears legitimate, the seller uses an inflated discount markup and charges steep customer-paid return fees.',
    price: {
      title: 'PRICE',
      statusText: 'Manufactured Urgency',
      isPositive: false,
      isWarning: true,
      notes: [
        'The advertised "75% off" is based on an artificially inflated original MSRP.',
        'Product is regularly offered at or below this exact price throughout the year.',
        'Shipping is free only if order total crosses a secondary threshold.',
      ],
    },
    seller: {
      title: 'SELLER',
      statusText: 'Young Merchant Account',
      isPositive: false,
      isWarning: true,
      notes: [
        'Storefront created 7 months ago; limited historical ratings.',
        'Fulfillment relies on external dropship routing with variable lead times.',
        'Customer support is ticket-only with reported 48-72h response times.',
      ],
    },
    terms: {
      title: 'TERMS',
      statusText: 'Friction on Returns',
      isPositive: false,
      isWarning: true,
      notes: [
        'Buyer is responsible for return postage to an overseas distribution hub.',
        '15% restocking fee applied if original packaging is opened.',
        'Store credit offered by default instead of original payment method refund.',
      ],
    },
    redFlags: {
      title: 'RED FLAGS',
      statusText: 'Urgency Prompts Detected',
      isPositive: false,
      isWarning: true,
      notes: [
        'Countdown timer resets automatically on page reload.',
        'Customer reviews on page appear curated with 100% 5-star distribution.',
        'Warranty details are vague regarding coverage for water/drop damage.',
      ],
    },
    couldNotVerify: [
      'True shipping transit times from international fulfillment facilities.',
      'Quality of internal components compared to brand-name alternatives.',
      'Whether the seller reliably honors store credit without expiration.',
    ],
  },

  dont_pay: {
    verdict: 'dont_pay',
    verdictTitle: 'DON’T PAY YET',
    emoji: '🔴',
    confidence: 'High',
    explanation:
      'We recommend holding your payment. The offer shows multiple red flags typical of copycat storefronts, including all-sales-final terms and recycled imagery.',
    price: {
      title: 'PRICE',
      statusText: 'Deceptive Price Signals',
      isPositive: false,
      notes: [
        'Unrealistic 85% discount on high-demand premium electronics.',
        'Hidden mandatory handling fee added at checkout page.',
        'Same unbranded generic model sold on wholesale sites for one-fifth the price.',
      ],
    },
    seller: {
      title: 'SELLER',
      statusText: 'High Risk / Unverified',
      isPositive: false,
      notes: [
        'Domain registered only 14 days ago using hidden proxy contact information.',
        'Physical address listed resolves to a shared commercial mailbox.',
        'Support email uses a disposable, free domain provider.',
      ],
    },
    terms: {
      title: 'TERMS',
      statusText: 'No Refund Protections',
      isPositive: false,
      notes: [
        'Buried in fine print: "All promotional sales are final with zero refunds."',
        'No replacement policy for items damaged during transit.',
        'Disclaimers waive all liability for non-delivery after carrier pickup.',
      ],
    },
    redFlags: {
      title: 'RED FLAGS',
      statusText: 'Multiple Severe Warnings',
      isPositive: false,
      notes: [
        'Stolen product photos copied from an established Kickstarter campaign.',
        'Fabricated buyer notification popups ("David from Austin just bought 2").',
        'Social ad comments disabled to suppress buyer complaint reports.',
      ],
    },
    couldNotVerify: [
      'Whether physical inventory actually exists in any domestic warehouse.',
      'True identity or operational jurisdiction of site owners.',
      'Whether submitted credit card information is processed securely.',
    ],
  },
};

interface CheckResultsViewProps {
  initialVerdict?: ResultVerdict;
  sourceCategory: SourceType | null;
  inputContent?: string;
  previewUrl?: string;
  analysisData?: StructuredAnalysisData | null;
  onStartNewCheck: () => void;
  onBackToInput: () => void;
}

export const CheckResultsView: React.FC<CheckResultsViewProps> = ({
  initialVerdict = 'reasonable',
  sourceCategory,
  inputContent,
  previewUrl,
  analysisData,
  onStartNewCheck,
  onBackToInput,
}) => {
  const mappedAnalysisVerdict: ResultVerdict | undefined = analysisData
    ? analysisData.status === 'LOOKS_REASONABLE'
      ? 'reasonable'
      : analysisData.status === 'DONT_PAY_YET'
      ? 'dont_pay'
      : 'pause'
    : undefined;

  // Active verdict state with interactive switcher to preview all 3 required states
  const [activeVerdict, setActiveVerdict] = useState<ResultVerdict>(
    mappedAnalysisVerdict || initialVerdict
  );

  // Active source category (Only 'AI' if explicitly selected or default preset)
  const [currentSource, setCurrentSource] = useState<SourceType | null>(sourceCategory !== undefined ? sourceCategory : null);

  // Synchronize state when incoming props update (e.g. reopening from History)
  useEffect(() => {
    if (mappedAnalysisVerdict) {
      setActiveVerdict(mappedAnalysisVerdict);
    } else if (initialVerdict) {
      setActiveVerdict(initialVerdict);
    }
  }, [mappedAnalysisVerdict, initialVerdict]);

  useEffect(() => {
    setCurrentSource(sourceCategory !== undefined ? sourceCategory : null);
  }, [sourceCategory]);

  // Saved Checks bookmarking state (synced with cb_saved_checks_v1)
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('cb_saved_checks_v1');
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      const identifier = inputContent || 'Saved Check';
      return parsed.some((item: any) => item.title === identifier || item.id === identifier);
    } catch {
      return false;
    }
  });

  const handleToggleSave = () => {
    try {
      const stored = localStorage.getItem('cb_saved_checks_v1');
      const existing = stored ? JSON.parse(stored) : [];
      const identifier = inputContent || currentData.verdictTitle;

      if (isSaved) {
        const filtered = existing.filter((item: any) => item.title !== identifier && item.id !== identifier);
        localStorage.setItem('cb_saved_checks_v1', JSON.stringify(filtered));
        setIsSaved(false);
      } else {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
        const newItem = {
          id: `saved-${Date.now()}`,
          title: identifier,
          date: formattedDate,
          verdict: activeVerdict,
          source: currentSource || 'Website',
          analysisData: analysisData || undefined,
        };
        localStorage.setItem('cb_saved_checks_v1', JSON.stringify([newItem, ...existing]));
        setIsSaved(true);
      }
    } catch (e) {
      console.warn('Could not update saved checks:', e);
    }
  };

  // Signature Explain Feature modal state
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainTopic, setExplainTopic] = useState<ExplanationTopic>('pricing');

  const handleOpenExplain = (topic: ExplanationTopic) => {
    setExplainTopic(topic);
    setExplainModalOpen(true);
  };

  // Expanded cards state (PRICE, SELLER, TERMS, RED FLAGS)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    price: true,
    seller: true,
    terms: false,
    redFlags: false,
  });

  const toggleCard = (cardKey: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  const isUsingRealAnalysis = !!analysisData;

  const currentData: ResultModel = analysisData
    ? {
        verdict: activeVerdict,
        verdictTitle:
          activeVerdict === 'reasonable'
            ? 'LOOKS REASONABLE'
            : activeVerdict === 'dont_pay'
            ? 'DON’T PAY YET'
            : 'PAUSE & CHECK',
        emoji: activeVerdict === 'reasonable' ? '🟢' : activeVerdict === 'dont_pay' ? '🔴' : '🟡',
        confidence:
          analysisData.confidence === 'HIGH'
            ? 'High'
            : analysisData.confidence === 'LIMITED'
            ? 'Limited'
            : 'Moderate',
        explanation: analysisData.summary,
        price: analysisData.price_findings,
        seller: analysisData.seller_findings,
        terms: analysisData.terms_findings,
        redFlags: analysisData.red_flags,
        couldNotVerify:
          analysisData.unverified_items && analysisData.unverified_items.length > 0
            ? analysisData.unverified_items
            : PRESET_RESULTS[activeVerdict].couldNotVerify,
      }
    : PRESET_RESULTS[activeVerdict];

  // Share Check state (PROMPT 15)
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [hasCopiedSummary, setHasCopiedSummary] = useState(false);

  // Generate concise, privacy-safe summary containing the 5 required elements
  const generateConciseSummary = (): string => {
    const topItems: string[] = [];
    if (currentData.price?.notes?.[0]) topItems.push(`• Price: ${currentData.price.notes[0]}`);
    if (currentData.seller?.notes?.[0]) topItems.push(`• Seller: ${currentData.seller.notes[0]}`);
    if (currentData.terms?.notes?.[0]) topItems.push(`• Terms: ${currentData.terms.notes[0]}`);
    if (currentData.redFlags?.notes?.[0]) topItems.push(`• Warning Signal: ${currentData.redFlags.notes[0]}`);

    const nextStepAction = analysisData?.next_steps?.action ||
      (activeVerdict === 'reasonable'
        ? 'Confirm whether the seller provides prepaid return drop-off labels or if customer pays freight.'
        : activeVerdict === 'pause'
        ? 'Ask the seller for their domestic return warehouse address before paying.'
        : 'Search independent buyer complaints to verify whether orders actually arrive intact.');

    return `Check Before You Buy
Result: ${currentData.emoji} ${currentData.verdictTitle} (${currentData.confidence} Confidence)

Short Explanation:
${currentData.explanation}

Top Warning & Verification Items:
${topItems.join('\n')}

Recommended Next Step:
👉 ${nextStepAction}

Based on the information provided · Pre-purchase safety evaluation with Check Before You Buy`;
  };

  const handleCopySummary = () => {
    const text = generateConciseSummary();
    navigator.clipboard.writeText(text);
    setHasCopiedSummary(true);
    setTimeout(() => setHasCopiedSummary(false), 2500);
  };

  const handleNativeShare = async () => {
    const text = generateConciseSummary();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Check Before You Buy — Purchase Verification',
          text,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback to clipboard if share is unsupported or fails
    handleCopySummary();
  };

  // Keyboard navigation: Escape key closes active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (shareModalOpen) setShareModalOpen(false);
        if (explainModalOpen) setExplainModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shareModalOpen, explainModalOpen]);

  // Helper for status colors
  const getVerdictTheme = (v: ResultVerdict) => {
    switch (v) {
      case 'reasonable':
        return {
          bg: 'bg-teal-50/60',
          border: 'border-teal-200',
          textColor: 'text-slate-950',
          badgeBg: 'bg-teal-100/90 text-teal-950 border-teal-300/80',
          confidenceBadge: 'bg-teal-100 text-teal-900',
          icon: CheckCircle2,
          iconColor: 'text-teal-600',
        };
      case 'pause':
        return {
          bg: 'bg-amber-50/70',
          border: 'border-amber-200',
          textColor: 'text-amber-950',
          badgeBg: 'bg-amber-100/80 text-amber-900 border-amber-300/80',
          confidenceBadge: 'bg-amber-100 text-amber-800',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
        };
      case 'dont_pay':
        return {
          bg: 'bg-rose-50/70',
          border: 'border-rose-200',
          textColor: 'text-rose-950',
          badgeBg: 'bg-rose-100/80 text-rose-900 border-rose-300/80',
          confidenceBadge: 'bg-rose-100 text-rose-800',
          icon: AlertOctagon,
          iconColor: 'text-rose-600',
        };
    }
  };

  const theme = getVerdictTheme(activeVerdict);
  const VerdictIcon = theme.icon;

  const cardSections = [
    { key: 'price', icon: '💰', data: currentData.price },
    { key: 'seller', icon: '🏪', data: currentData.seller },
    { key: 'terms', icon: '📜', data: currentData.terms },
    { key: 'redFlags', icon: '🚩', data: currentData.redFlags },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header bar with Back action */}
      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={onBackToInput}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New check</span>
        </button>

        {/* Source Badge with Quick AI Check Toggle, Save, & Share Actions */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap justify-end">
          <button
            type="button"
            onClick={handleToggleSave}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-2xs transition-all active:scale-95 ${
              isSaved
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
            }`}
            title={isSaved ? 'Remove from Saved Checks' : 'Save Check for Later'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : 'text-slate-500'}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-full shadow-2xs transition-all active:scale-95"
            title="Share Check Summary"
          >
            <Share2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Share</span>
          </button>

          <div className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-slate-100/90 text-slate-700 border-slate-200/90 flex items-center gap-1.5">
            <span className="text-slate-500 font-normal">Source:</span>
            <strong className="text-slate-900 flex items-center gap-1">
              {currentSource === 'AI' ? (
                <>
                  <span>🤖</span>
                  <span className="text-[#070e24] font-bold">AI Recommendation</span>
                </>
              ) : (
                <span>{currentSource || 'Unspecified'}</span>
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          MAIN RESULT CARD
          Top:
          🟢 LOOKS REASONABLE | 🟡 PAUSE & CHECK | 🔴 DON’T PAY YET
          Supporting confidence label: High, Moderate, or Limited (NO NUMERICAL SCORE)
          Short plain-English explanation
         --------------------------------------------------------------------- */}
      <section
        className={`rounded-3xl border p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-4 transition-colors ${theme.bg} ${theme.border}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pre-Purchase Verdict
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentData.emoji}</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#070e24]">
                {currentData.verdictTitle}
              </h1>
            </div>
          </div>

          {/* Supporting Confidence Label (No numerical score) */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${theme.badgeBg}`}
          >
            <span>Confidence: {currentData.confidence}</span>
          </div>
        </div>

        {/* Short Plain-English Explanation */}
        <p className="text-sm text-slate-800 leading-relaxed font-medium bg-white/90 p-4 rounded-2xl border border-white/60 shadow-2xs">
          {currentData.explanation}
        </p>

        {/* Context badge */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Pre-checkout evaluation report</span>
          </span>
          <span className="text-[11px] text-slate-400">No numerical scores used</span>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          SPECIAL “🤖 AI CHECK” MODE (PROMPT 10)
          Triggered when discovery source is AI:
          - Label: “🤖 AI CHECK”
          - Text: “An AI recommendation is not proof that the seller or product is trustworthy.”
          - Split into: “What we can verify” vs “What still needs verification”
         --------------------------------------------------------------------- */}
      {currentSource === 'AI' && (
        <AiCheckSection inputReference={inputContent} />
      )}

      {/* Signature Feature Banner: 💬 What does this really mean? */}
      <button
        type="button"
        onClick={() => handleOpenExplain('pricing')}
        className="w-full p-4 rounded-3xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-[#00e5a3]/70 hover:shadow-xs transition-all flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#070e24] text-[#00e5a3] border border-slate-800 flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs">
            💬
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-slate-900 group-hover:text-[#070e24] transition-colors block truncate">
              What does this really mean?
            </span>
            <span className="text-xs text-slate-500 block truncate">
              Plain-English translations of fine print, return traps, and renewal terms
            </span>
          </div>
        </div>
        <div className="shrink-0 pl-2">
          <span className="text-xs font-bold text-[#070e24] bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200/70 flex items-center gap-1">
            <span>Translate</span>
            <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-[#070e24]" />
          </span>
        </div>
      </button>

      {/* ---------------------------------------------------------------------
          FOUR EXPANDABLE CARDS:
          💰 PRICE
          🏪 SELLER
          📜 TERMS
          🚩 RED FLAGS
         --------------------------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Detailed Decision Factors
          </h2>
          <span className="text-xs text-slate-400">Tap cards to expand</span>
        </div>

        {cardSections.map((sec) => {
          const isExpanded = !!expandedCards[sec.key];
          return (
            <div
              key={sec.key}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Expandable Header */}
              <button
                type="button"
                onClick={() => toggleCard(sec.key)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 active:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-lg flex items-center justify-center shrink-0">
                    {sec.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>{sec.data.title}</span>
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          sec.data.isPositive
                            ? 'bg-[#00e5a3]'
                            : sec.data.isWarning
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span
                        className={`text-xs font-bold truncate ${
                          sec.data.isPositive
                            ? 'text-teal-900'
                            : sec.data.isWarning
                            ? 'text-amber-900'
                            : 'text-rose-900'
                        }`}
                      >
                        {sec.data.statusText}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/70 text-slate-400 flex items-center justify-center shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-700" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Collapsible Content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="p-4 sm:p-5 pt-3 space-y-2.5 bg-slate-50/50">
                      {sec.data.notes.map((note, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                              sec.data.isPositive
                                ? 'bg-emerald-500'
                                : sec.data.isWarning
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>{note}</span>
                        </div>
                      ))}

                      {/* Signature Feature: 💬 What does this really mean? attached to relevant card */}
                      {sec.key === 'price' && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenExplain('pricing')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95"
                          >
                            <span>💬 What does this really mean?</span>
                            <span className="text-slate-400 font-normal">· Pricing Language</span>
                          </button>
                        </div>
                      )}

                      {sec.key === 'seller' && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenExplain('payments')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95"
                          >
                            <span>💬 What does this really mean?</span>
                            <span className="text-slate-400 font-normal">· Payment Instructions</span>
                          </button>
                        </div>
                      )}

                      {sec.key === 'terms' && (
                        <div className="pt-2.5 border-t border-slate-200/60 space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            💬 What does this really mean?
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenExplain('returns')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-xl transition-all active:scale-95"
                            >
                              <span>📜 Return Policies</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenExplain('shipping')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-xl transition-all active:scale-95"
                            >
                              <span>🚚 Shipping Terms</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenExplain('cancellation')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-xl transition-all active:scale-95"
                            >
                              <span>🚫 Cancellation</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenExplain('warranties')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-xl transition-all active:scale-95"
                            >
                              <span>🛡️ Warranties</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenExplain('subscriptions')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-xl transition-all active:scale-95"
                            >
                              <span>🔁 Subscriptions</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenExplain('renewal')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-xl transition-all active:scale-95"
                            >
                              <span>🔄 Auto-Renewal</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {sec.key === 'redFlags' && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenExplain('urgency')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95"
                          >
                            <span>💬 What does this really mean?</span>
                            <span className="text-slate-400 font-normal">· Marketing & Urgency</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </section>

      {/* ---------------------------------------------------------------------
          “WHAT WE COULD NOT VERIFY” SECTION
         --------------------------------------------------------------------- */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              What we could not verify
            </h3>
            <p className="text-xs text-slate-400">
              Important boundaries of automated pre-purchase analysis
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {currentData.couldNotVerify.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-start gap-2.5"
            >
              <span className="text-slate-400 font-bold shrink-0">•</span>
              <span className="leading-relaxed">{item}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>
              {isUsingRealAnalysis
                ? 'Grounded analysis via Gemini 3.8 Flash · Evaluates provided offer without fabricated claims'
                : 'Automated decision model baseline · Simulated findings are not guaranteed endorsements'}
            </span>
          </span>
          {isUsingRealAnalysis && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live AI Check
            </span>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------------
          “WHAT SHOULD I DO BEFORE PAYING?” SECTION (PROMPT 9, 23, 24)
          - Dynamic Pre-payment Verification Checklist prioritized by issues found
          - NEXT BEST STEP card (Concrete verification action)
          - ASK THE SELLER button (Context-specific neutral inquiry generator)
         --------------------------------------------------------------------- */}
      <WhatToDoNextSection
        verdict={activeVerdict}
        sourceCategory={sourceCategory}
        inputContent={inputContent}
        customNextStep={isUsingRealAnalysis ? analysisData?.next_steps : undefined}
        customChecklist={isUsingRealAnalysis ? analysisData?.verification_checklist : undefined}
        customSellerQuestion={isUsingRealAnalysis ? analysisData?.seller_question : undefined}
        priceFindings={currentData.price}
        sellerFindings={currentData.seller}
        termsFindings={currentData.terms}
        couldNotVerifyItems={currentData.couldNotVerify}
      />

      {/* ---------------------------------------------------------------------
          ACTIONS FOOTER
         --------------------------------------------------------------------- */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={() => setShareModalOpen(true)}
          className="w-full h-12 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200/90 shadow-2xs transition-all active:scale-[0.985]"
        >
          <Share2 className="w-4 h-4 text-teal-600" />
          <span>Share Check Summary</span>
        </button>

        <button
          type="button"
          onClick={onStartNewCheck}
          className="w-full h-14 rounded-2xl bg-[#070e24] hover:bg-[#0c183a] text-white font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[0.985] transition-all shadow-md shadow-[#070e24]/15 border border-slate-800"
        >
          <RotateCcw className="w-4 h-4 text-[#00e5a3]" />
          <span>Check Another Item</span>
        </button>

        <p className="text-center text-[11px] text-slate-400">
          Check Before You Buy · Informs your thinking, never makes the decision for you
        </p>
      </div>

      {/* Signature Plain-English Explanation Modal */}
      <ExplainSimplyModal
        isOpen={explainModalOpen}
        initialTopic={explainTopic}
        onClose={() => setExplainModalOpen(false)}
        customExplanations={isUsingRealAnalysis ? analysisData?.simple_explanations : undefined}
      />

      {/* ---------------------------------------------------------------------
          SHARE SUMMARY MODAL (PROMPT 15)
          - Concise summary containing:
            1. Check Before You Buy
            2. Result state
            3. Short explanation
            4. Top warning/verification items
            5. Recommended next step
          - Native sharing with fallback to copy-to-clipboard
          - No private data included
         --------------------------------------------------------------------- */}
      <AnimatePresence>
        {shareModalOpen && (
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
              {/* Mobile grab handle */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto sm:hidden mb-1" />

              {/* Modal Top Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center text-lg shadow-2xs">
                    <Share2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Shareable Summary
                    </span>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                      Share Check Summary
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Privacy Reassurance Note */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero personal data included. Safe to paste in family group chats or purchase notes.</span>
              </div>

              {/* Formatted Text Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Summary Preview:
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {generateConciseSummary()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* Primary Action: Copy to Clipboard */}
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className={`w-full h-12 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                    hasCopiedSummary
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.985]'
                  }`}
                >
                  {hasCopiedSummary ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Summary to Clipboard</span>
                    </>
                  )}
                </button>

                {/* Secondary Action: Native OS Share (if supported) */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share via Device (Messages, AirDrop, etc.)</span>
                  </button>
                )}
              </div>

              {/* Done button */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
