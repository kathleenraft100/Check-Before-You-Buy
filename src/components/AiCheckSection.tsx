import React from 'react';
import { 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  ExternalLink,
  Info,
  Sparkles
} from 'lucide-react';

interface AiCheckSectionProps {
  inputReference?: string;
}

export const AiCheckSection: React.FC<AiCheckSectionProps> = ({ inputReference }) => {
  return (
    <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white border border-indigo-500/30 shadow-[0_8px_30px_rgba(30,27,75,0.25)] space-y-5">
      {/* Header with Exact Label as Specified in PROMPT 10 */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black tracking-wider uppercase border border-indigo-400/30">
            <span>🤖 AI CHECK</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white pt-1">
            AI Discovery Warning
          </h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 flex items-center justify-center shrink-0 text-xl font-bold">
          🤖
        </div>
      </div>

      {/* Mandatory Prominent Callout Text */}
      <div className="p-4 rounded-2xl bg-indigo-900/40 border border-indigo-400/25 space-y-1">
        <p className="text-sm font-bold text-indigo-100 leading-snug">
          “An AI recommendation is not proof that the seller or product is trustworthy.”
        </p>
        <p className="text-xs text-indigo-300/80 leading-relaxed pt-1">
          In 2026, AI chatbots and synthetic search assistants synthesize web answers that may cite affiliate-driven reviews, SEO-optimized dropshippers, or non-existent warranties.
        </p>
      </div>

      {/* Two-Column / Split Section: “What we can verify” vs “What still needs verification” */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* Column 1: “What we can verify” */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                What we can verify
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>
                  <strong>Disclosed Terms & Fine Print:</strong> Return windows, restocking charges, cancellation rules, and recurring billing clauses explicitly stated in the submitted offer.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>
                  <strong>Price Signal Consistency:</strong> Extreme markdown claims, artificial anchor prices, and hidden checkout add-ons apparent in the provided material.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>
                  <strong>High-Pressure Tactics:</strong> Countdown timers, fake stock urgency, and generic turnkey template patterns visible in the offer.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800/80">
            *Analysis is strictly based on the offer content you provide. We do not conduct external server or physical stock audits.
          </div>
        </div>

        {/* Column 2: “What still needs verification” */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                What still needs verification
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">!</span>
                <span>
                  <strong>AI Hallucination Risk:</strong> The AI tool may have invented product specifications, return ease, or customer service ratings.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">!</span>
                <span>
                  <strong>Affiliate / Paid Bias:</strong> Chatbots often cite articles ranked through heavy affiliate commissions rather than objective quality.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">!</span>
                <span>
                  <strong>True Physical Merchant:</strong> Whether the business actually has inventory in domestic warehouses or simply forwards orders overseas.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-2 text-[10px] text-amber-300/80 border-t border-slate-800/80">
            *Always perform a manual 60-second search of the company name + "scam" before paying.
          </div>
        </div>
      </div>

      {/* Safety Reminder Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-indigo-900/60">
        <span className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>2026 AI-Native Purchase Safeguard</span>
        </span>
        <span className="text-indigo-300">Check Before You Buy</span>
      </div>
    </section>
  );
};
