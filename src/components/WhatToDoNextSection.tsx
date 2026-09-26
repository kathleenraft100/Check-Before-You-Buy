import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  MessageSquare, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Send,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResultVerdict } from './CheckResultsView';

interface WhatToDoNextSectionProps {
  verdict: ResultVerdict;
  sourceCategory: string | null;
  inputContent?: string;
  customNextStep?: {
    action: string;
    detail: string;
    tag: string;
  };
  customSellerQuestion?: string;
}

export const WhatToDoNextSection: React.FC<WhatToDoNextSectionProps> = ({
  verdict,
  sourceCategory,
  inputContent,
  customNextStep,
  customSellerQuestion,
}) => {
  // Checklist state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    seller: false,
    price: false,
    returns: false,
    payment: false,
    claims: false,
  });

  // "Ask the Seller" question drawer state
  const [askSellerOpen, setAskSellerOpen] = useState(false);
  const [hasCopiedQuestion, setHasCopiedQuestion] = useState(false);

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  // Concrete verification action tailored to the current evaluation state
  const getNextBestStep = () => {
    switch (verdict) {
      case 'reasonable':
        return {
          action: 'Confirm the seller’s prepaid return label process',
          detail:
            'Even with reputable sellers, return policies vary by product category. Confirm whether a prepaid drop-off label is provided or if you must arrange your own shipping.',
          tag: 'Verification Step',
        };
      case 'pause':
        return {
          action: 'Ask the seller for their domestic return warehouse address',
          detail:
            'Before entering payment details, message customer support to confirm that returns are received at a local address rather than an overseas facility with expensive return postage.',
          tag: 'Recommended Action',
        };
      case 'dont_pay':
        return {
          action: 'Search the merchant name + "complaints" on an independent forum',
          detail:
            'Look up the storefront name on Reddit, Trustpilot, or the Better Business Bureau. Independent buyer threads quickly reveal if orders fail to arrive or arrive damaged.',
          tag: 'Safety Precaution',
        };
    }
  };

  const nextStep = customNextStep || getNextBestStep();

  // Neutral verification question template
  const defaultSellerQuestionText = `Hello,

I am considering ordering from your store and would appreciate clarification on a few details before completing my order:

1. Return Policy: Could you confirm your physical return address location, and whether returns include a prepaid shipping label?
2. Condition & Fees: Are there any restocking or handling deductions if the item packaging is opened for inspection?
3. Delivery & Billing: Does the final checkout price include all applicable taxes and shipping, with no recurring or automatic subscription enrollments?

Thank you for your assistance.`;

  const sellerQuestionText = customSellerQuestion || defaultSellerQuestionText;

  const handleCopyQuestion = () => {
    navigator.clipboard.writeText(sellerQuestionText);
    setHasCopiedQuestion(true);
    setTimeout(() => setHasCopiedQuestion(false), 2400);
  };

  const checklist = [
    {
      id: 'seller',
      label: 'Verify seller independently',
      description: 'Check how long the company has existed and look for a real phone number or address.',
    },
    {
      id: 'price',
      label: 'Confirm final price',
      description: 'Check taxes, shipping charges, and make sure no monthly auto-ship box is checked.',
    },
    {
      id: 'returns',
      label: 'Read return policy',
      description: 'Verify the return window (e.g. 14–30 days) and whether you or the seller pay return postage.',
    },
    {
      id: 'payment',
      label: 'Check payment protection',
      description: 'Use a standard credit card with dispute rights; avoid wire transfers or peer-to-peer cash apps.',
    },
    {
      id: 'claims',
      label: 'Verify important claims',
      description: 'Confirm that warranties, certifications, and product claims are stated in written documentation.',
    },
  ];

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
      {/* Section Header */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            What should I do before paying?
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {completedCount} of 5 verified
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          The decision to buy is always yours. Take a moment to verify these critical points independently.
        </p>
      </div>

      {/* ---------------------------------------------------------------------
          NEXT BEST STEP CARD
          One concrete verification action
         --------------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
            NEXT BEST STEP
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {nextStep.tag}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white leading-snug pt-0.5">
          {nextStep.action}
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {nextStep.detail}
        </p>
      </div>

      {/* ---------------------------------------------------------------------
          CHECKLIST:
          ☐ Verify seller independently
          ☐ Confirm final price
          ☐ Read return policy
          ☐ Check payment protection
          ☐ Verify important claims
         --------------------------------------------------------------------- */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Pre-Payment Verification Checklist
        </span>

        <div className="space-y-2">
          {checklist.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleCheck(item.id)}
                className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all flex items-start gap-3 active:scale-[0.99] ${
                  isChecked
                    ? 'bg-emerald-50/50 border-emerald-200/90 text-slate-900'
                    : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/80 text-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-emerald-600 text-white'
                      : 'border-2 border-slate-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`text-xs font-bold block leading-snug ${
                      isChecked ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-normal">
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          “ASK THE SELLER” BUTTON
          Generates a neutral placeholder verification question
         --------------------------------------------------------------------- */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setAskSellerOpen(true)}
          className="w-full min-h-[48px] rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/90 hover:border-slate-300 shadow-2xs active:scale-[0.985] transition-all"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>ASK THE SELLER</span>
          <span className="text-slate-400 font-normal">· Generate verification question</span>
        </button>
      </div>

      {/* Neutral informative note */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed text-center">
        <span>Check Before You Buy is designed to inform your thinking. We never push or direct you to buy.</span>
      </div>

      {/* ---------------------------------------------------------------------
          ASK THE SELLER MODAL / BOTTOM SHEET
         --------------------------------------------------------------------- */}
      <AnimatePresence>
        {askSellerOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 28 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Mobile grab handle */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto sm:hidden mb-1" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center text-lg font-bold">
                    💬
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Neutral Buyer Inquiry
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                      Question to Ask the Seller
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAskSellerOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Copy and send this polite, neutral verification message to the merchant’s chat, contact form, or direct support email:
              </p>

              {/* Message Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-sans text-xs text-slate-800 whitespace-pre-line leading-relaxed selection:bg-emerald-200">
                {sellerQuestionText}
              </div>

              {/* Copy CTA */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handleCopyQuestion}
                  className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.985] transition-all shadow-xs"
                >
                  {hasCopiedQuestion ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Question to Clipboard</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAskSellerOpen(false)}
                  className="w-full h-10 rounded-xl text-slate-500 hover:text-slate-900 text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
