import React, { useState } from 'react';
import { 
  BarChart3, 
  Bookmark, 
  Palette, 
  Info, 
  Shield, 
  HelpCircle, 
  Sparkles, 
  ChevronRight, 
  Trash2, 
  Check, 
  Sun, 
  Moon, 
  Monitor, 
  MessageSquare, 
  Lock, 
  AlertCircle,
  X,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckResultsView, ResultVerdict } from '../CheckResultsView';
import { SourceType } from './CheckTab';
import { getMonthlyUsage } from '../../lib/usage';

const HISTORY_STORAGE_KEY = 'cb_check_history_v1';
const LEGACY_SAMPLE_IDS = new Set(['hist-1', 'hist-2', 'hist-3', 'hist-4']);

export const YouTab: React.FC = () => {
  const [usageCount] = useState<number>(getMonthlyUsage);

  // Appearance state (Light, Dark, System)
  const [appearanceTheme, setAppearanceTheme] = useState<'light' | 'dark' | 'system'>('light');

  // Active sub-view or modal: null | 'usage' | 'saved' | 'appearance' | 'about' | 'privacy' | 'help' | 'premium'
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Help Feedback form state
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // Local storage clear status
  const [dataCleared, setDataCleared] = useState(false);

  // Saved checks are the completed checks persisted by the Check flow (same store as History).
  const [savedChecks, setSavedChecks] = useState<Array<{
    id: string;
    title: string;
    date: string;
    verdict: ResultVerdict;
    source: SourceType | null;
  }>>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item: any) => item && typeof item.id === 'string' && !LEGACY_SAMPLE_IDS.has(item.id))
        .map((item: any) => ({
          id: item.id,
          title: item.name,
          date: item.date,
          verdict: item.verdict,
          source: item.source ?? null,
        }));
    } catch {
      return [];
    }
  });

  const handleRemoveSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedChecks((prev) => prev.filter((item) => item.id !== id));
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        localStorage.setItem(
          HISTORY_STORAGE_KEY,
          JSON.stringify(parsed.filter((item: any) => item?.id !== id)),
        );
      }
    } catch {
      // Storage unavailable
    }
  };

  const handleClearAllData = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
    setSavedChecks([]);
    setDataCleared(true);
    setTimeout(() => setDataCleared(false), 3000);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackText('');
      setActiveModal(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ---------------------------------------------------------------------
          HEADER (No unnecessary personal data collection)
         --------------------------------------------------------------------- */}
      <section className="pt-2 px-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
          You
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Manage your usage, saved checks, appearance, and privacy preferences.
        </p>
      </section>

      {/* On-Device Privacy Summary Badge */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">
              Private & Account-Free
            </span>
            <span className="text-[11px] text-slate-500">
              No login, email, or identity tracking required
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
          On-Device
        </span>
      </div>

      {/* ---------------------------------------------------------------------
          THE 6 REQUIRED SECTIONS:
          1. Usage this month
          2. Saved checks
          3. Appearance
          4. About
          5. Privacy
          6. Help / feedback
         --------------------------------------------------------------------- */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] divide-y divide-slate-100 overflow-hidden">
        {/* 1. Usage this month */}
        <button
          type="button"
          onClick={() => setActiveModal('usage')}
          className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group active:bg-slate-100/60"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/70 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors block">
                Usage this month
              </span>
              <span className="text-xs text-slate-500 block truncate">
                {usageCount} {usageCount === 1 ? 'evaluation' : 'evaluations'} completed
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-400">{usageCount} / 50</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* 2. Saved checks */}
        <button
          type="button"
          onClick={() => setActiveModal('saved')}
          className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group active:bg-slate-100/60"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 group-hover:text-amber-900 transition-colors block">
                Saved checks
              </span>
              <span className="text-xs text-slate-500 block truncate">
                Completed checks saved on this device
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-400">{savedChecks.length} saved</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* 3. Appearance */}
        <button
          type="button"
          onClick={() => setActiveModal('appearance')}
          className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group active:bg-slate-100/60"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/70 flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 group-hover:text-purple-900 transition-colors block">
                Appearance
              </span>
              <span className="text-xs text-slate-500 block truncate capitalize">
                Theme: {appearanceTheme} mode
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* 4. About */}
        <button
          type="button"
          onClick={() => setActiveModal('about')}
          className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group active:bg-slate-100/60"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors block">
                About
              </span>
              <span className="text-xs text-slate-500 block truncate">
                Version 1.4 · Mission & verification principles
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* 5. Privacy */}
        <button
          type="button"
          onClick={() => setActiveModal('privacy')}
          className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group active:bg-slate-100/60"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-950 transition-colors block">
                Privacy
              </span>
              <span className="text-xs text-slate-500 block truncate">
                On-device data promise & clear local storage
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>

        {/* 6. Help / feedback */}
        <button
          type="button"
          onClick={() => setActiveModal('help')}
          className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group active:bg-slate-100/60"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/70 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 group-hover:text-rose-950 transition-colors block">
                Help / feedback
              </span>
              <span className="text-xs text-slate-500 block truncate">
                Common questions & report deceptive sellers
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </section>

      {/* ---------------------------------------------------------------------
          POLISHED PLACEHOLDER FOR FUTURE PREMIUM FEATURES
          (Clearly labeled as coming later — no payment or subscription code)
         --------------------------------------------------------------------- */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-widest uppercase border border-emerald-500/30">
              <span>✨ COMING LATER</span>
            </div>
            <h2 className="text-base font-bold text-white pt-1">
              Future Premium Features
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
            No Subscriptions Yet
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Check Before You Buy is currently 100% free with all core features unlocked. In the future, optional advanced tools will be available for heavy power shoppers:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>Unlimited monthly deep checks</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>Batch screenshot receipt verification</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>Cross-device encrypted history sync</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>Live domain WHOIS & fraud database hook</span>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
          <span>Planned for late 2026</span>
          <span className="text-emerald-400 font-medium">Free during preview</span>
        </div>
      </section>

      {/* Footer Reassurance */}
      <div className="text-center text-[11px] text-slate-400 pt-2 space-y-1">
        <p className="font-semibold text-slate-500">Check Before You Buy · v1.4</p>
        <p>Built for deliberate, confident purchases</p>
      </div>

      {/* =====================================================================
          MODALS / EXPANDED DRAWERS FOR THE 6 SECTIONS
         ===================================================================== */}
      <AnimatePresence>
        {activeModal && (
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
              className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-slate-200/90 space-y-5 max-h-[88vh] overflow-y-auto"
            >
              {/* Mobile grab handle */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto sm:hidden mb-1" />

              {/* Modal Top Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight capitalize">
                  {activeModal === 'usage' && 'Usage this month'}
                  {activeModal === 'saved' && 'Saved checks'}
                  {activeModal === 'appearance' && 'Appearance'}
                  {activeModal === 'about' && 'About Check Before You Buy'}
                  {activeModal === 'privacy' && 'Privacy & On-Device Data'}
                  {activeModal === 'help' && 'Help & Consumer Feedback'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ---------------- MODAL CONTENT: USAGE ---------------- */}
              {activeModal === 'usage' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                      <span>Monthly Free Quota</span>
                      <span>{usageCount} of 50 checks used</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-blue-200/70 overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, Math.round((usageCount / 50) * 100))}%` }} 
                      />
                    </div>
                    <p className="text-[11px] text-blue-800">
                      Quota resets on the 1st of every month. All checks are 100% free.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Checks Completed
                    </span>
                    <span className="text-2xl font-black text-slate-900 block mt-1">{usageCount}</span>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                      On this device
                    </span>
                  </div>
                </div>
              )}

              {/* ---------------- MODAL CONTENT: SAVED CHECKS ---------------- */}
              {activeModal === 'saved' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Saved items are stored on your device so you can re-read return policies before your 24-hour cooling off window expires.
                  </p>

                  {savedChecks.length > 0 ? (
                    <div className="space-y-2">
                      {savedChecks.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.date} · Found on {item.source || 'Not specified'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSaved(item.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                            title="Remove saved check"
                            aria-label={`Remove ${item.title} from saved checks`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      No checks saved yet.
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- MODAL CONTENT: APPEARANCE ---------------- */}
              {activeModal === 'appearance' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Choose how Check Before You Buy looks on your device:
                  </p>

                  <div className="space-y-2">
                    {[
                      { id: 'light', label: 'Light Theme', icon: Sun, desc: 'Clean high-contrast daytime interface' },
                      { id: 'dark', label: 'Dark Theme', icon: Moon, desc: 'Gentle on eyes for late-night deal shopping' },
                      { id: 'system', label: 'System Default', icon: Monitor, desc: 'Matches your device operating system setting' },
                    ].map((theme) => {
                      const Icon = theme.icon;
                      const isSelected = appearanceTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setAppearanceTheme(theme.id as any)}
                          className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <div>
                              <span className="text-xs font-bold block">{theme.label}</span>
                              <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                {theme.desc}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ---------------- MODAL CONTENT: ABOUT ---------------- */}
              {activeModal === 'about' && (
                <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="font-bold text-slate-900 block text-sm">
                      Our Consumer Mission
                    </span>
                    <p>
                      Check Before You Buy was created to restore balance between online shoppers and high-pressure digital commerce tactics. Modern storefronts use artificial countdown timers, fake social notifications, and confusing return policies to induce fast checkout.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 block">Core Guiding Principles:</span>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>Inform, Never Force:</strong> We evaluate facts and provide clear verification steps. You make the final decision.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>Zero Dark Patterns:</strong> No checkout affiliate links, no sponsored merchant rankings, and no hidden subscriptions.</span>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
                    <span>Release: Build v1.4 (2026)</span>
                    <span>MIT Open Architecture</span>
                  </div>
                </div>
              )}

              {/* ---------------- MODAL CONTENT: PRIVACY ---------------- */}
              {activeModal === 'privacy' && (
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold">
                      <Lock className="w-4 h-4 text-emerald-700" />
                      <span>Zero Personal Data Collected</span>
                    </div>
                    <p className="text-slate-700">
                      We do not ask for your real name, email, credit card, or telephone number. Check Before You Buy runs entirely inside your browser sandbox and saves records to device localStorage only.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 block">Device Storage Control:</span>
                    <p className="text-slate-500">
                      You can instantly purge all cached evaluation history and saved bookmarks with one tap.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearAllData}
                      className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 border border-rose-200/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{dataCleared ? 'Data Cleared!' : 'Clear All Local Data'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- MODAL CONTENT: HELP / FEEDBACK ---------------- */}
              {activeModal === 'help' && (
                <div className="space-y-4 text-xs text-slate-600">
                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 block text-sm">
                      Frequently Asked Questions
                    </span>
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                        <span className="font-bold text-slate-800 block">How are verdicts evaluated?</span>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          We parse advertised pricing against market baselines, examine domain registration records, analyze return policies for customer-paid international freight, and flag artificial urgency widgets.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                        <span className="font-bold text-slate-800 block">Can I report a deceptive store?</span>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          Yes! Use the feedback form below to submit URLs or screenshots of stores utilizing fake countdown timers or hidden recurring billing.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSendFeedback} className="space-y-2.5 pt-1">
                    <span className="font-bold text-slate-900 block">Send Feedback or Report a Store</span>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tell us what you noticed about an offer, or suggest a verification feature..."
                      className="w-full h-24 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!feedbackText.trim() || feedbackSent}
                      className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
                    >
                      {feedbackSent ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Thank you for your feedback!</span>
                        </>
                      ) : (
                        <span>Submit Feedback</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Bottom Close Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
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
