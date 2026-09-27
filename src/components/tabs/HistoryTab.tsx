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
import { CheckResultsView, ResultVerdict, StructuredAnalysisData } from '../CheckResultsView';
import { SourceType } from './CheckTab';

export interface HistoryItem {
  id: string;
  name: string;
  date: string;
  verdict: ResultVerdict;
  source: SourceType | null;
  summary?: string;
  inputContent?: string;
  previewUrl?: string;
  analysisData?: StructuredAnalysisData;
}

const STORAGE_KEY = 'cb_check_history_v1';

interface HistoryTabProps {
  onNavigateToCheck?: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onNavigateToCheck }) => {
  // Load persistent history from localStorage with robust corruption and error handling
  const [items, setItems] = useState<HistoryItem[]>(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Gracefully sanitize and filter valid items
          return parsed.filter(
            (item): item is HistoryItem =>
              item &&
              typeof item === 'object' &&
              typeof item.id === 'string' &&
              (item.verdict === 'reasonable' || item.verdict === 'pause' || item.verdict === 'dont_pay')
          );
        }
      }
    } catch (e) {
      // Storage unavailable, disabled, or corrupted JSON
      console.warn('Could not read check history from storage:', e);
    }
    return [];
  });

  // Active selected item for reopening result
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);

  // Accidental data loss prevention modal (PROMPT 16)
  const [confirmClearModalOpen, setConfirmClearModalOpen] = useState(false);

  // Synchronize with localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } catch (e) {
      // Storage quota exceeded or storage disabled
      console.warn('Could not persist check history:', e);
    }
  }, [items]);

  // Remove individual history item
  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Could not update localStorage after item deletion:', err);
      }
      return updated;
    });
  };

  // Safe clear all items with confirmation
  const handleClearAllConfirm = () => {
    setItems([]);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Could not clear localStorage:', err);
    }
    setConfirmClearModalOpen(false);
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
          analysisData={activeItem.analysisData}
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
            Revisit your previous checks, red flag assessments, and evaluation findings.
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
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 group-hover:text-emerald-950 transition-colors line-clamp-2 leading-snug">
                        {item.name}
                      </h2>
                      {item.summary && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.summary}
                        </p>
                      )}
                    </div>

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

          <div className="pt-2 max-w-xs mx-auto">
            <button
              type="button"
              onClick={onNavigateToCheck}
              className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.985] transition-all shadow-md shadow-slate-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <span>Start Your First Check</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Confirmation Modal to Prevent Accidental Data Loss */}
      {confirmClearModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 id="clear-dialog-title" className="text-base font-bold text-slate-900">
                Clear all saved evaluations?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This removes all saved checks from this device. This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearModalOpen(false)}
                className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                Keep History
              </button>
              <button
                type="button"
                onClick={handleClearAllConfirm}
                className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
