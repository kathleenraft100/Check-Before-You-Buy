/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TabType } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CheckTab } from './components/tabs/CheckTab';
import { HistoryTab } from './components/tabs/HistoryTab';
import { YouTab } from './components/tabs/YouTab';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('check');

  return (
    <div className="min-h-screen bg-[#f8fafc] sm:bg-gradient-to-b sm:from-slate-100/80 sm:via-[#f8fafc] sm:to-slate-200/40 sm:py-8 flex flex-col items-center justify-start antialiased text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Mobile-first app container */}
      <main className="w-full max-w-md bg-white min-h-screen sm:min-h-[840px] sm:rounded-[36px] sm:shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:border sm:border-slate-200/80 flex flex-col relative overflow-hidden pb-24">
        {/* Top Header */}
        <Header activeTab={activeTab} />

        {/* Tab Viewport with smooth crossfade */}
        <div className="flex-1 px-4 sm:px-6 pt-2 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'check' && <CheckTab />}
              {activeTab === 'history' && <HistoryTab onNavigateToCheck={() => setActiveTab('check')} />}
              {activeTab === 'you' && <YouTab />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3-Tab Navigation Bar */}
        <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />
      </main>
    </div>
  );
}
