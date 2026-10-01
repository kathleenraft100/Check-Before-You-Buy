import React, { useState, useMemo } from 'react';
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
import { ResultVerdict, SectionDetail, VerificationChecklistItem } from './CheckResultsView';

interface WhatToDoNextSectionProps {
  verdict: ResultVerdict;
  sourceCategory: string | null;
  inputContent?: string;
  customNextStep?: {
    action: string;
    detail: string;
    tag: string;
  };
  customChecklist?: VerificationChecklistItem[];
  customSellerQuestion?: string;
  priceFindings?: SectionDetail;
  sellerFindings?: SectionDetail;
  termsFindings?: SectionDetail;
  couldNotVerifyItems?: string[];
}

export const WhatToDoNextSection: React.FC<WhatToDoNextSectionProps> = ({
  verdict,
  sourceCategory,
  inputContent,
  customNextStep,
  customChecklist,
  customSellerQuestion,
  priceFindings,
  sellerFindings,
  termsFindings,
  couldNotVerifyItems,
}) => {
  // Build dynamic, prioritized verification checklist
  const dynamicChecklist: Array<{
    id: string;
    label: string;
    description: string;
    priorityBadge?: string;
  }> = useMemo(() => {
    if (customChecklist && customChecklist.length > 0) {
      return customChecklist.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        priorityBadge:
          item.priority === 'urgent'
            ? 'High Priority'
            : item.priority === 'recommended'
            ? 'Recommended'
            : undefined,
      }));
    }

    // Dynamic derivation based on actual analysis findings & what was missing
    const items: Array<{
      id: string;
      label: string;
      description: string;
      priorityBadge?: string;
    }> = [];

    // 1. Seller Identity Check
    if (sellerFindings && (!sellerFindings.isPositive || sellerFindings.isWarning)) {
      items.push({
        id: 'seller_verify',
        label: 'Verify seller identity & registration',
        description:
          'Seller credentials could not be verified from the offer. Search corporate registry, domain WHOIS age, and verify an active customer service phone number.',
        priorityBadge: 'High Priority',
      });
    }

    // 2. Terms & Return Policy Check
    if (termsFindings && (!termsFindings.isPositive || termsFindings.isWarning)) {
      items.push({
        id: 'return_policy',
        label: 'Inspect return policy & domestic return warehouse',
        description:
          'Return terms were not transparently provided. Confirm return deadlines, restocking fees, and whether buyer pays overseas return postage.',
        priorityBadge: 'High Priority',
      });
    }

    // 3. Price & Hidden Fees Check
    if (priceFindings && (!priceFindings.isPositive || priceFindings.isWarning)) {
      items.push({
        id: 'final_price',
        label: 'Verify final checkout total & recurring charges',
        description:
          'Check that the price is not an inflated markdown anchor, and inspect the order summary for hidden handling fees or auto-ship subscription checkboxes.',
        priorityBadge: 'Recommended',
      });
    }

    // 4. Missing Information Items from couldNotVerify
    if (couldNotVerifyItems && couldNotVerifyItems.length > 0) {
      const topMissing = couldNotVerifyItems[0];
      items.push({
        id: 'missing_info',
        label: `Obtain missing details: ${topMissing.slice(0, 36)}${topMissing.length > 36 ? '...' : ''}`,
        description: `Crucial details could not be verified from the submission: ${topMissing}`,
        priorityBadge: 'Recommended',
      });
    }

    // 5. Payment Protection Check
    items.push({
      id: 'payment_protection',
      label: 'Ensure purchase protection on payment method',
      description:
        'Pay exclusively using a standard credit card with dispute rights. Avoid debit transfers, wire payments, or peer-to-peer apps that offer zero fraud recourse.',
      priorityBadge: 'Standard Safety',
    });

    // Ensure at least 3 items if offer looks reasonable
    if (items.length < 3) {
      items.push({
        id: 'order_receipt',
        label: 'Save order confirmation & item listing snapshot',
        description:
          'Take a screenshot of the product specifications, pricing, and return terms at checkout for your records in case of order discrepancies.',
      });
    }

    return items;
  }, [customChecklist, priceFindings, sellerFindings, termsFindings, couldNotVerifyItems]);

  // Checklist state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

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

  // Neutral verification question fallback tailored to issues found
  const getContextualSellerQuestion = () => {
    if (termsFindings && (!termsFindings.isPositive || termsFindings.isWarning)) {
      return `Hello,

I am considering ordering from your store and would appreciate clarification on your return policy before placing my order:

1. Return Address: What is the physical location/country of your returns warehouse?
2. Return Shipping: Do you provide a prepaid return shipping label, or does the customer pay postage?
3. Restocking Fees: Are there any deductions or restocking charges if the package is opened?

Thank you for your assistance.`;
    }

    if (sellerFindings && (!sellerFindings.isPositive || sellerFindings.isWarning)) {
      return `Hello,

I am reviewing this product listing and would like to confirm your store's business details before ordering:

1. Business Details: What is the registered business name and customer support phone number for your store?
2. Shipping Origin: From which facility or warehouse will this item be fulfilled and dispatched?
3. Delivery Guarantee: What is the estimated transit window and carrier service used?

Thank you for your assistance.`;
    }

    return `Hello,

I am interested in this item and would like to confirm a few product details before completing checkout:

1. Condition & Authenticity: Can you confirm the exact condition, model number, and manufacturer warranty coverage included with this item?
2. Checkout Total: Does the advertised price include all taxes and shipping, with no automatic recurring subscriptions?
3. Return Window: How many days does the buyer have to inspect the product upon delivery?

Thank you for your assistance.`;
  };

  const sellerQuestionText = customSellerQuestion || getContextualSellerQuestion();

  const handleCopyQuestion = () => {
    navigator.clipboard.writeText(sellerQuestionText);
    setHasCopiedQuestion(true);
    setTimeout(() => setHasCopiedQuestion(false), 2400);
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
      {/* Section Header */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            What should I do before paying?
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {completedCount} of {dynamicChecklist.length} verified
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          The decision to buy is always yours. Verify these analysis-specific points before entering payment details.
        </p>
      </div>

      {/* ---------------------------------------------------------------------
          NEXT BEST STEP CARD
          One concrete verification action
         --------------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#070e24] text-white shadow-sm border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest uppercase text-[#00e5a3] bg-teal-950/80 px-2.5 py-0.5 rounded-md border border-[#00e5a3]/30">
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
          DYNAMIC VERIFICATION CHECKLIST
         --------------------------------------------------------------------- */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Pre-Payment Verification Checklist
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Tailored to this check
          </span>
        </div>

        <div className="space-y-2">
          {dynamicChecklist.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleCheck(item.id)}
                className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all flex items-start gap-3 active:scale-[0.99] ${
                  isChecked
                    ? 'bg-teal-50/60 border-teal-200/90 text-slate-900'
                    : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/80 text-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-[#00e5a3] text-[#070e24]'
                      : 'border-2 border-slate-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold block leading-snug ${
                        isChecked ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.priorityBadge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        item.priorityBadge.includes('High')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200/80'
                          : 'bg-amber-100 text-amber-800 border border-amber-200/80'
                      }`}>
                        {item.priorityBadge}
                      </span>
                    )}
                  </div>
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
          Generates a neutral seller verification question
         --------------------------------------------------------------------- */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setAskSellerOpen(true)}
          className="w-full min-h-[50px] rounded-2xl bg-white hover:bg-slate-50 text-[#070e24] font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-2 border-[#070e24] shadow-xs active:scale-[0.985] transition-all group"
        >
          <MessageSquare className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          <span className="tracking-wide">ASK THE SELLER</span>
          <span className="text-slate-400 font-medium text-xs">· Inquiry script</span>
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
                  <div className="w-10 h-10 rounded-2xl bg-[#070e24] text-[#00e5a3] border border-slate-800 flex items-center justify-center text-lg font-bold shadow-xs">
                    💬
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80 uppercase tracking-wider block">
                      Neutral Buyer Inquiry
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
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
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-sans text-xs text-slate-800 whitespace-pre-line leading-relaxed selection:bg-teal-200">
                {sellerQuestionText}
              </div>

              {/* Copy CTA */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handleCopyQuestion}
                  className="w-full h-12 rounded-2xl bg-[#070e24] hover:bg-[#0c183a] text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.985] transition-all shadow-xs border border-slate-800"
                >
                  {hasCopiedQuestion ? (
                    <>
                      <Check className="w-4 h-4 text-[#00e5a3] stroke-[2.5]" />
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

