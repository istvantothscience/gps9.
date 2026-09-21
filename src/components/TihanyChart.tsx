import React from 'react';
import { SessionData } from '../types/index.ts';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

interface TihanyChartProps {
  session: SessionData;
  isTeacher?: boolean;
}

export const TihanyChart: React.FC<TihanyChartProps> = ({ session }) => {
  // Extract all team measurements for 'mission_tihany'
  const dataPoints = Object.values(session.participants).map(p => {
    const responses = session.responses[p.id] || [];
    const tihanyResp = responses.find(r => r.taskId === 'mission_tihany');
    const m1 = Number(tihanyResp?.rawAnswer?.measure1) || 0;
    const m2 = Number(tihanyResp?.rawAnswer?.measure2) || 0;
    const diff = m2 - m1;
    const percentage = m1 > 0 ? Math.round(((m2 - m1) / m1) * 100) : 0;
    return {
      teamName: p.teamName,
      m1,
      m2,
      diff,
      percentage,
      hasData: m1 > 0 && m2 > 0
    };
  }).filter(d => d.hasData);

  // If no submissions yet, show realistic sample illustration data alongside notice
  const displayData = dataPoints.length > 0 ? dataPoints : [
    { teamName: 'Voyager Csapat', m1: 22.4, m2: 26.8, diff: 4.4, percentage: 20, hasData: true },
    { teamName: 'Hubble Felfedezők', m1: 21.0, m2: 25.3, diff: 4.3, percentage: 20, hasData: true },
    { teamName: 'Curiosity Egység', m1: 23.5, m2: 28.1, diff: 4.6, percentage: 20, hasData: true },
    { teamName: 'Pioneer Párducok', m1: 20.8, m2: 24.9, diff: 4.1, percentage: 20, hasData: true },
  ];

  const maxVal = Math.max(35, ...displayData.map(d => Math.max(d.m1, d.m2)));

  const avgM1 = displayData.reduce((acc, d) => acc + d.m1, 0) / (displayData.length || 1);
  const avgM2 = displayData.reduce((acc, d) => acc + d.m2, 0) / (displayData.length || 1);
  const avgIncrease = avgM1 > 0 ? Math.round(((avgM2 - avgM1) / avgM1) * 100) : 0;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Tihanyi-félsziget Partvonal Mérések — Osztályszintű Eredmények
            </h3>
            <p className="text-xs text-slate-400">
              1. mérés (kb. 10 töréspont) vs. 2. mérés (20–50 töréspont)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-500 inline-block" />
            <span className="text-slate-300">1. mérés (Durva, ~10 pont)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-400 inline-block" />
            <span className="text-cyan-300 font-semibold">2. mérés (Finom, 20–50 pont)</span>
          </div>
        </div>
      </div>

      {dataPoints.length === 0 && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>A csapatok még nem küldték be a méréseiket; alább a minta adatsor látható demonstrációként.</span>
        </div>
      )}

      {/* Bar Chart Visualizer */}
      <div className="relative pt-6 pb-2">
        <div className="space-y-4">
          {displayData.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{item.teamName}</span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +{item.percentage}% ({item.diff.toFixed(1)} km növekmény)
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {/* Bar 1 */}
                <div className="flex items-center gap-2">
                  <div className="w-full bg-slate-950 rounded-md h-5 overflow-hidden flex border border-slate-800">
                    <div
                      className="bg-slate-500 h-full transition-all duration-700 flex items-center justify-end pr-2 text-[10px] font-mono text-white font-bold"
                      style={{ width: `${Math.min(100, (item.m1 / maxVal) * 100)}%` }}
                    >
                      {item.m1} km
                    </div>
                  </div>
                </div>
                {/* Bar 2 */}
                <div className="flex items-center gap-2">
                  <div className="w-full bg-slate-950 rounded-md h-5 overflow-hidden flex border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full transition-all duration-700 flex items-center justify-end pr-2 text-[10px] font-mono text-slate-950 font-bold shadow-sm"
                      style={{ width: `${Math.min(100, (item.m2 / maxVal) * 100)}%` }}
                    >
                      {item.m2} km
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistical Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-center">
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400">1. Mérés Osztályátlag</div>
          <div className="text-lg font-bold text-slate-200 font-mono">{avgM1.toFixed(1)} km</div>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
          <div className="text-xs text-cyan-400">2. Mérés Osztályátlag</div>
          <div className="text-lg font-bold text-cyan-300 font-mono">{avgM2.toFixed(1)} km</div>
        </div>
        <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/30">
          <div className="text-xs text-emerald-400">Átlagos Növekmény</div>
          <div className="text-lg font-bold text-emerald-300 font-mono">+{avgIncrease}%</div>
        </div>
      </div>

      {/* Physics Concept Note */}
      <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-xs text-slate-300 space-y-1.5">
        <div className="font-bold text-cyan-300 flex items-center gap-1.5">
          <Info className="w-4 h-4" /> A Partvonal-paradoxon (Lewis Fry Richardson & Benoît Mandelbrot)
        </div>
        <p>
          Minél kisebb mérőléccel (több törésponttal) követjük a természetes partvonal apró kanyarulatait,
          annál nagyobb mért hosszat kapunk! Elméletben végtelen pontossággal a partvonal hossza a végtelenbe tart —
          ezért a földrajzi határok hosszát mindig a mérés léptékével (felbontásával) együtt kell megadni.
        </p>
      </div>
    </div>
  );
};
