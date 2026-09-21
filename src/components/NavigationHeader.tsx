import React from 'react';
import { Satellite, Users, Monitor, ExternalLink, Activity } from 'lucide-react';

interface NavigationHeaderProps {
  currentView: 'tanar' | 'diak' | 'home';
  onSelectView: (view: 'tanar' | 'diak' | 'home') => void;
  sessionCode?: string;
  isSocketConnected?: boolean;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentView,
  onSelectView,
  sessionCode,
  isSocketConnected = true,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        {/* Brand */}
        <div
          onClick={() => onSelectView('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white font-display">
                Műhold-küldetés
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                5–6. Óra
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Tájékozódás égen-földön • Fizika
            </div>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            id="nav-btn-tanar"
            onClick={() => onSelectView('tanar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentView === 'tanar'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Tanári nézet (/tanar)</span>
          </button>

          <button
            type="button"
            id="nav-btn-diak"
            onClick={() => onSelectView('diak')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentView === 'diak'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Diák nézet (/diak)</span>
          </button>
        </div>

        {/* Right side: Session Code, Connection & Pontkövető Link */}
        <div className="flex items-center gap-3">
          {sessionCode && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-500">Szoba:</span>
              <span className="font-mono font-bold text-cyan-400">{sessionCode}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] hidden md:inline">
              {isSocketConnected ? 'Élő szinkron' : 'Kapcsolódás...'}
            </span>
          </div>

          <a
            href="https://fizika-pontkoveto.vercel.app/"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded hover:bg-slate-900"
          >
            <span>Fizika Pontkövető</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
};
