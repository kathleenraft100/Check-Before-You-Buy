import React from 'react';
import { TabType } from '../types';
import { ShieldCheck, History, User } from 'lucide-react';
import { motion } from 'motion/react';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    {
      id: 'check' as TabType,
      label: 'CHECK',
      icon: ShieldCheck,
      caption: 'Evaluate',
    },
    {
      id: 'history' as TabType,
      label: 'HISTORY',
      icon: History,
      caption: 'Past Checks',
    },
    {
      id: 'you' as TabType,
      label: 'YOU',
      icon: User,
      caption: 'Guardrails',
    },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      role="tablist"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 h-[72px] px-3 items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-label={`${tab.label} — ${tab.caption}`}
              onClick={() => onSelectTab(tab.id)}
              className="relative flex flex-col items-center justify-center h-full min-h-[48px] py-1 select-none transition-transform active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070e24] focus-visible:ring-offset-2 rounded-2xl"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-x-2 inset-y-1.5 bg-[#070e24] rounded-2xl -z-10 shadow-xs border border-slate-800/60"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}

              <div
                className={`transition-colors duration-150 p-1 rounded-xl ${
                  isActive
                    ? 'text-[#00e5a3]'
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>

              <span
                className={`text-[11px] font-bold tracking-wider uppercase mt-0.5 transition-colors duration-150 ${
                  isActive ? 'text-white font-black' : 'text-slate-500 group-hover:text-slate-700'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
