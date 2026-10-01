import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useBrandLogo } from '../context/LogoContext';

interface HeaderProps {
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { logoUrl, hasLogo } = useBrandLogo();
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const displaySrc = logoUrl || '/ai-creation-cmuoefa7204m00iu6p6skzg82-1790798010521.jpg';
  const showImg = (hasLogo || !logoLoadFailed);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100/90 px-4 py-3 sm:px-6 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showImg ? (
            <div className="w-11 h-11 rounded-xl bg-[#070e24] p-0.5 border border-slate-800/40 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={displaySrc}
                alt="CHECK Before You Buy"
                onError={() => {
                  const target = document.getElementById('app-official-logo') as HTMLImageElement;
                  if (target && !target.src.includes('check-logo.png') && !target.src.startsWith('data:')) {
                    target.src = '/check-logo.png';
                  } else {
                    setLogoLoadFailed(true);
                  }
                }}
                id="app-official-logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-[#070e24] border border-slate-800 flex items-center justify-center text-[#00e5a3] shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
          )}
          <div className="space-y-0.5">
            <span className="block font-black text-base tracking-tight text-[#070e24] leading-none">
              CHECK
            </span>
            <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">
              Before You Buy
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/[0.04] border border-slate-900/[0.06] text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a3] shadow-[0_0_6px_rgba(0,229,163,0.7)]" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-600">Active</span>
        </div>
      </div>
    </header>
  );
};



