import React from 'react';
import { Award, Compass, Sparkles, X, ShieldCheck } from 'lucide-react';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedBadges: string[];
  teamName: string;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  earnedBadges,
  teamName,
}) => {
  if (!isOpen) return null;

  const BADGE_DEFINITIONS = [
    {
      id: 'GPS Mérnök',
      title: 'GPS Mérnök',
      icon: Compass,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      description: 'A 2, 3 és 4 műholdas trilaterációs szimuláció és a GPS kvíz hibátlan megoldásáért.',
    },
    {
      id: 'Kartográfus',
      title: 'Kartográfus',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      description: 'A Google Earth, Maps és Sky terepmissziók (Margit híd, Tihany, Apollo-11, Olympus Mons) sikeres teljesítéséért.',
    },
    {
      id: 'Kozmikus Navigátor',
      title: 'Kozmikus Navigátor',
      icon: Sparkles,
      color: 'from-amber-400 to-orange-600',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      description: 'Bónusz rang: Az óra legmagasabb összpontszámát elérő elit felfedező csapat.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative flex flex-col gap-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Jelvények & Elismerések</h2>
            <p className="text-xs text-slate-400">{teamName} csapat kitüntetései</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {BADGE_DEFINITIONS.map((b) => {
            const hasBadge = earnedBadges.includes(b.id);
            const IconComponent = b.icon;
            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                  hasBadge
                    ? `${b.borderColor} bg-slate-800/80 shadow-md`
                    : 'border-slate-800/60 bg-slate-950/40 opacity-40 grayscale'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                    hasBadge ? `bg-gradient-to-br ${b.color}` : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold ${hasBadge ? b.textColor : 'text-slate-400'}`}>
                      {b.title}
                    </h4>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        hasBadge
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {hasBadge ? 'Megszerezve ✓' : 'Zárolva'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
