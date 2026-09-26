import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Trash2, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckResultsView, ResultVerdict } from '../CheckResultsView';
import { SourceType } from './CheckTab';

export interface HistoryItem {
  id: string;
  name: string;
  date: string;
  verdict: ResultVerdict;
  source: SourceType | null;
  inputContent?: string;
  previewUrl?: string;
}

const STORAGE_KEY = 'cb_check_history_v1';

const DEFAULT_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    name: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    date: 'Today, 2:40 PM',
    verdict: 'reasonable',
    source: 'Google',
    inputContent: 'https://store.sony.com/headphones/wh1000xm5',
  },
  {
    id: 'hist-2',
    name: 'Viral Ultrasonic Sonic-Clean Jewelry Machine (65% off)',
    date: 'Yesterday, 6:15 PM',
    verdict: 'pause',
    source: 'TikTok',
    inputContent: 'Flash Deal: Ultrasonic cleaner $24.99 with free shipping. Return policy: Buyer pays return shipping to international warehouse.',
  },
  {
    id: 'hist-3',
    name: 'Flash Deal: Designer Leather Travel Tote & Wallet Set',
    date: 'Sep 23, 2026',
    verdict: 'dont_pay',
    source: 'Instagram',
    inputContent: 'Exclusive 85% OFF Closing Sale! $39.99 today only. Note: "All sales strictly final."',
  },
  {
    id: 'hist-4',
    name: 'Smart Titanium Fitness Ring Pro (AI Recommended)',
    date: 'Sep 20, 2026',
    verdict: 'pause',
    source: 'AI',
    inputContent: 'Recommended by conversational AI shopping assistant.',
  },
];

interface HistoryTabProps {
  onNavigateToCheck?: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onNavigateToCheck }) => {
  // Load persistent history from localStorage or fallback to default
  const [items, setItems] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // Storage unavailable or disabled
    }
    return DEFAULT_HISTORY;
  });

  // Active selected item for reopening result
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);

  // Accidental data loss prevention modal (PROMPT 16)
  const [confirmClearModalOpen, setConfirmClearModalOpen] = useState(false);

  // Synchronize with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // Ignore write errors
    }
  }, [items]);

  // Remove individual history item
  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Safe clear all items with confirmation
  const handleClearAllConfirm = () => {
    setItems([]);
    setConfirmClearModalOpen(false);
  };

  // Restore sample items for convenience
  const handleRestoreSamples = () => {
    setItems(DEFAULT_HISTORY);
  };

  // Helper for result state presentation
  const getVerdictPresentation = (v: ResultVerdict) => {
    switch (v) {
      case 'reasonable':
        return {
          emoji: '🟢',
          title: 'LOOKS REASONABLE',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dotClass: 'bg-emerald-500',
        };
      case 'pause':
        return {
          emoji: '🟡',
          title: 'PAUSE & CHECK',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dotClass: 'bg-amber-500',
        };
      case 'dont_pay':
        return {
          emoji: '🔴',
          title: 'DON’T PAY YET',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
          dotClass: 'bg-rose-500',
        };
    }
  };

  // If viewing a reopened item result, display the full CheckResultsView
  if (activeItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setActiveItem(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to History</span>
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Saved on {activeItem.date}
          </span>
        </div>

        <CheckResultsView
          initialVerdict={activeItem.verdict}
          sourceCategory={activeItem.source}
          inputContent={activeItem.inputContent || activeItem.name}
          previewUrl={activeItem.previewUrl}
          onStartNewCheck={() => {
            setActiveItem(null);
            if (onNavigateToCheck) onNavigateToCheck();
          }}
          onBackToInput={() => setActiveItem(null)}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN HISTORY LIST VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <section className="pt-2 px-1 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            History
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Revisit your previous checks, red flag assessments, and verified findings.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClearModalOpen(true)}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50/50 transition-colors shrink-0 min-h-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            Clear all
          </button>
        )}
      </section>

      {/* List of Previous Checks */}
      {items.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Recent Evaluations ({items.length})
            </span>
            <span className="text-xs text-slate-500">Tap card to reopen</span>
          </div>

          <div className="space-y-2.5">
            {items.map((item) => {
              const pres = getVerdictPresentation(item.verdict);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveItem(item);
                    }
                  }}
                  className="w-full text-left bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all flex items-start justify-between gap-3.5 group cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Top Row: Result State Badge + Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${pres.badgeClass}`}
                      >
                        <span>{pres.emoji}</span>
                        <span>{pres.title}</span>
                      </div>

                      <span className="text-[11px] text-slate-500 font-medium shrink-0">
                        {item.date}
                      </span>
                    </div>

                    {/* Middle Row: Item Name or Short Description */}
                    <h2 className="text-sm font-bold text-slate-900 group-hover:text-emerald-950 transition-colors line-clamp-2 leading-snug">
                      {item.name}
                    </h2>

                    {/* Bottom Row: Source Discovery Badge */}
                    <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-600">
                      <span className="text-slate-500 text-[11px]">Found on:</span>
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px]">
                        {item.source || 'Website'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column: Remove item button & Right Arrow */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-1">
                    <button
                      type="button"
                      onClick={(e) => handleRemoveItem(item.id, e)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Remove from history"
                      aria-label={`Remove ${item.name} from history`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-slate-900 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-500">
              Checks are saved locally on this device · Zero external account tracking
            </span>
          </div>
        </section>
      ) : (
        /* ---------------------------------------------------------------------
           EMPTY STATE (Exact specified copy from PROMPT 11)
           “No checks yet. Your next purchase can start here.”
           --------------------------------------------------------------------- */
        <section className="py-12 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-5 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 mx-auto flex items-center justify-center text-2xl shadow-xs">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>

          <div className="space-y-1.5 max-w-xs mx-auto">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
              No checks yet. Your next purchase can start here.
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Before paying for an unfamiliar online offer, paste a link or upload a screenshot to evaluate return traps and seller safety.
            </p>
          </div>

          <div className="pt-2 max-w-xs mx-auto space-y-2">
            <button
              type="button"
              onClick={onNavigateToCheck}
              className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.985] transition-all shadow-md shadow-slate-900/10"
            >
              <span>Start Your First Check</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRestoreSamples}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors"
            >
              Restore sample history
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
