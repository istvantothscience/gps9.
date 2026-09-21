import React, { useState, useEffect, useRef } from 'react';
import { Radio, Satellite, Clock, Compass, CheckCircle2, AlertTriangle, RefreshCw, HelpCircle, Eye } from 'lucide-react';

export interface GpsSimProps {
  onStepComplete?: (step: number, answer: Record<string, unknown>, score: number) => void;
  savedAnswers?: Record<string, unknown>;
  readOnly?: boolean;
}

interface SatData {
  id: number;
  name: string;
  code: string;
  x: number;
  y: number;
  r: number;
  color: string;
  accent: string;
  active: boolean;
}

export const GpsSimulationCanvas: React.FC<GpsSimProps> = ({
  onStepComplete,
  savedAnswers = {},
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active step: 1 (2 satellites), 2 (3 satellites), 3 (4 satellites)
  const [activeStep, setActiveStep] = useState<number>(() => {
    if (savedAnswers['gps_sim_3sat']) return 3;
    if (savedAnswers['gps_sim_2sat']) return 2;
    return 1;
  });

  // Step 1 answers
  const [step1Choice, setStep1Choice] = useState<string>((savedAnswers['gps_sim_2sat_choice'] as string) || '');
  const [step1Feedback, setStep1Feedback] = useState<string>('');

  // Step 2 answers
  const [step2SelectedPoint, setStep2SelectedPoint] = useState<string>((savedAnswers['gps_sim_3sat_point'] as string) || '');
  const [step2Reason, setStep2Reason] = useState<string>((savedAnswers['gps_sim_3sat_reason'] as string) || '');
  const [step2Feedback, setStep2Feedback] = useState<string>('');

  // Step 3 answers
  const [step3Choice, setStep3Choice] = useState<string>((savedAnswers['gps_sim_4sat_choice'] as string) || '');
  const [step3Feedback, setStep3Feedback] = useState<string>('');
  const [clockError, setClockError] = useState<number>(12); // Simulated quartz clock offset in microseconds

  // Dragging state
  const [draggingSat, setDraggingSat] = useState<number | null>(null);

  // Satellite configuration
  const [satellites, setSatellites] = useState<SatData[]>([
    { id: 1, name: 'NAVSTAR-01', code: 'PRN-08', x: 0.22, y: 0.18, r: 0.53, color: '#38bdf8', accent: 'cyan', active: true },
    { id: 2, name: 'NAVSTAR-02', code: 'PRN-14', x: 0.78, y: 0.20, r: 0.51, color: '#34d399', accent: 'emerald', active: true },
    { id: 3, name: 'GALILEO-03', code: 'E-19', x: 0.48, y: 0.10, r: 0.56, color: '#fbbf24', accent: 'amber', active: false },
    { id: 4, name: 'GALILEO-04', code: 'E-24', x: 0.88, y: 0.42, r: 0.46, color: '#f43f5e', accent: 'rose', active: false },
  ]);

  // Target receiver position (ground station - e.g. Budapest)
  const targetPos = { x: 0.50, y: 0.65 };
  // Secondary intersection point (false mirror position)
  const falsePos = { x: 0.49, y: 0.28 };

  // Sync satellite active states based on current step
  useEffect(() => {
    setSatellites(prev => prev.map(s => {
      if (activeStep === 1) {
        return { ...s, active: s.id === 1 || s.id === 2 };
      } else if (activeStep === 2) {
        return { ...s, active: s.id === 1 || s.id === 2 || s.id === 3 };
      } else {
        return { ...s, active: true };
      }
    }));
  }, [activeStep]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let pulse = 0;

    const render = () => {
      pulse = (pulse + 0.03) % (Math.PI * 2);

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw Space background & grid
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#030712');
      bgGrad.addColorStop(0.6, '#081329');
      bgGrad.addColorStop(1, '#0c1e3d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Orbit guide arc (20 200 km)
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.2, w * 0.48, h * 0.15, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label orbit
      ctx.font = '11px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.fillText('MEO keringési pálya (~20 200 km)', w * 0.05, h * 0.08);

      // 2. Draw Earth Curve at bottom
      const earthRadius = w * 0.85;
      const earthCenter = { x: w * 0.5, y: h + earthRadius - (h * 0.35) };

      ctx.save();
      ctx.beginPath();
      ctx.arc(earthCenter.x, earthCenter.y, earthRadius, 0, Math.PI * 2);
      const earthGrad = ctx.createRadialGradient(
        earthCenter.x, earthCenter.y - earthRadius + 50, 20,
        earthCenter.x, earthCenter.y, earthRadius
      );
      earthGrad.addColorStop(0, '#1e3a5f');
      earthGrad.addColorStop(0.04, '#172554');
      earthGrad.addColorStop(0.15, '#0f172a');
      earthGrad.addColorStop(1, '#020617');
      ctx.fillStyle = earthGrad;
      ctx.fill();

      // Earth atmosphere glow
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Atmospheric haze
      ctx.save();
      ctx.beginPath();
      ctx.arc(earthCenter.x, earthCenter.y, earthRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();

      // Surface label
      ctx.fillStyle = '#93c5fd';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Föld felszíne (Légkör határa)', w * 0.5, h * 0.88);

      // 3. Draw Satellites & measurement wavefront circles
      const activeSats = satellites.filter(s => s.active);

      activeSats.forEach(sat => {
        const sx = sat.x * w;
        const sy = sat.y * h;

        // In step 3 with clock error, circles don't meet perfectly unless clock error is 0
        const radiusAdjustment = (activeStep === 3) ? (clockError * 0.003 * w) : 0;
        const sr = (sat.r * w) + radiusAdjustment;

        // Draw wavefront propagation
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.strokeStyle = sat.color;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Pulsing subtle ripple
        const rippleR = (sr + Math.sin(pulse) * 4);
        if (rippleR > 0) {
          ctx.beginPath();
          ctx.arc(sx, sy, rippleR, 0, Math.PI * 2);
          ctx.strokeStyle = sat.color;
          ctx.globalAlpha = 0.2;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();

        // Line to ground receiver (line-of-sight signal beam)
        const targetX = targetPos.x * w;
        const targetY = targetPos.y * h;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = sat.color;
        ctx.globalAlpha = 0.25;
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Draw Satellite Icon
        ctx.save();
        ctx.translate(sx, sy);

        // Halo
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fill();
        ctx.strokeStyle = sat.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Solar panels
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-15, -4, 7, 8);
        ctx.fillRect(8, -4, 7, 8);
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1;
        ctx.strokeRect(-15, -4, 7, 8);
        ctx.strokeRect(8, -4, 7, 8);

        // Body
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-4, -5, 8, 10);

        // Antenna
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(0, 9);
        ctx.strokeStyle = sat.color;
        ctx.stroke();

        ctx.restore();

        // Sat Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 11px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sat.code, sx, sy - 20);
        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${Math.round(sat.r * 20200 * 1.5)} km`, sx, sy + 26);
      });

      // 4. Highlight Intersections
      const trueX = targetPos.x * w;
      const trueY = targetPos.y * h;
      const falseX = falsePos.x * w;
      const falseY = falsePos.y * h;

      if (activeStep === 1) {
        // Step 1: 2 satellites -> 2 clear intersection points
        // Point A (Surface - Real)
        drawIntersectionBadge(ctx, trueX, trueY, 'Metszéspont 1 (A)', '#38bdf8', pulse);
        // Point B (Atmosphere / Orbit - False)
        drawIntersectionBadge(ctx, falseX, falseY, 'Metszéspont 2 (B)', '#f59e0b', pulse);

        // Ambiguity indicator
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Két lehetséges pozíció: nem dönthető el egyértelműen!', w * 0.5, h * 0.05);
      } else if (activeStep === 2) {
        // Step 2: 3 satellites -> true intersection + rejected phantom point
        drawIntersectionBadge(ctx, trueX, trueY, 'Pozíció [Felszíni]', '#10b981', pulse, step2SelectedPoint === 'surface');
        drawIntersectionBadge(ctx, falseX, falseY, 'Pozíció [Felső légkör]', '#ef4444', pulse, step2SelectedPoint === 'space');

        ctx.fillStyle = '#34d399';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('3 műhold: a harmadik kör kizárja a hamis pontot a térben!', w * 0.5, h * 0.05);
      } else if (activeStep === 3) {
        // Step 3: 4 satellites & clock sync
        if (Math.abs(clockError) > 2) {
          // Error triangle (pseudo-range mismatch)
          const offset = clockError * 0.8;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(trueX, trueY - offset);
          ctx.lineTo(trueX - offset * 1.2, trueY + offset * 0.8);
          ctx.lineTo(trueX + offset * 1.2, trueY + offset * 0.8);
          ctx.closePath();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#f87171';
          ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Órahiba: pontatlansági háromszög (~${Math.round(clockError * 300)} m hiba)`, trueX, trueY + 36);
          ctx.restore();
        } else {
          // Perfectly collapsed into 1 pinpoint
          drawTargetPinpoint(ctx, trueX, trueY, '100% Szinkronizált Helyzet!', '#34d399', pulse);
        }
      }

      // Always draw the ground receiver device icon at targetPos
      drawReceiverIcon(ctx, trueX, trueY);

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [satellites, activeStep, clockError, step2SelectedPoint]);

  // Helper: Draw intersection badge
  const drawIntersectionBadge = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    color: string,
    pulse: number,
    isSelected: boolean = false
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 9 + Math.sin(pulse) * 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 1.0;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Label
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 12);
    ctx.restore();
  };

  // Helper: Pinpoint
  const drawTargetPinpoint = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    color: string,
    pulse: number
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 16 + Math.sin(pulse) * 4, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '700 12px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 22);
    ctx.restore();
  };

  // Helper: Receiver icon (phone/GPS)
  const drawReceiverIcon = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    // base pin
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  };

  // Mouse / Touch handlers for dragging satellites or tuning radius
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    // Check if clicked near an active satellite
    for (const sat of satellites) {
      if (!sat.active) continue;
      const dx = sat.x - px;
      const dy = sat.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.08) {
        setDraggingSat(sat.id);
        break;
      }
    }

    // In step 2: Check if clicked near true or false point
    if (activeStep === 2) {
      const dTrue = Math.hypot(targetPos.x - px, targetPos.y - py);
      const dFalse = Math.hypot(falsePos.x - px, falsePos.y - py);
      if (dTrue < 0.1) {
        setStep2SelectedPoint('surface');
      } else if (dFalse < 0.1) {
        setStep2SelectedPoint('space');
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingSat === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width));
    const py = Math.max(0.08, Math.min(0.45, (e.clientY - rect.top) / rect.height));

    setSatellites(prev => prev.map(s => {
      if (s.id === draggingSat) {
        // Calculate new radius so it stays linked to receiver
        const dx = targetPos.x - px;
        const dy = targetPos.y - py;
        const newR = Math.sqrt(dx * dx + dy * dy);
        return { ...s, x: px, y: py, r: newR };
      }
      return s;
    }));
  };

  const handleCanvasPointerUp = () => {
    setDraggingSat(null);
  };

  // Step 1 submission
  const handleSubmitStep1 = () => {
    if (!step1Choice) return;
    const isCorrect = step1Choice === 'two_intersections';
    const score = isCorrect ? 1 : 0;
    const fb = isCorrect
      ? 'Helyes! 2 kör metszéspontja általában 2 pont a síkban, így a pozíció még nem egyértelmű.'
      : 'Két kör metszéspontja 2 pontot ad, a vevő nem tudja, melyiken tartózkodik.';
    setStep1Feedback(fb);
    onStepComplete?.(1, { selectedChoice: step1Choice }, score);
  };

  // Step 2 submission
  const handleSubmitStep2 = () => {
    if (!step2SelectedPoint) return;
    const isCorrect = step2SelectedPoint === 'surface';
    const score = isCorrect ? 1 : 0;
    const fb = isCorrect
      ? 'Pontos! A Föld felszínén lévő valós pontot választottad (a másik kizárható, mert lehetetlen helyen lenne).'
      : 'A felszíni pont a valós helyszín, a másik pont fizikailag kizárható.';
    setStep2Feedback(fb);
    onStepComplete?.(2, { selectedPoint: step2SelectedPoint, reason: step2Reason }, score);
  };

  // Step 3 submission
  const handleSubmitStep3 = () => {
    if (!step3Choice) return;
    const isCorrect = step3Choice === 'clock_sync';
    const score = isCorrect ? 1 : 0;
    const fb = isCorrect
      ? 'Tökéletes! A 4. műhold a vevő olcsóbb kvarcórájának és a műholdak atomóráinak szinkronizálására szolgál.'
      : 'A negyedik műhold az időszinkronizálásra szolgál.';
    setStep3Feedback(fb);
    onStepComplete?.(3, { selectedChoice: step3Choice, clockSynced: clockError === 0 }, score);
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Step Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-100 text-base">GPS Trilateráció 2D Szimuláció</span>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            type="button"
            id="tab-gps-step-1"
            onClick={() => setActiveStep(1)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeStep === 1
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Lépés (2 műhold)
          </button>
          <button
            type="button"
            id="tab-gps-step-2"
            onClick={() => setActiveStep(2)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeStep === 2
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Lépés (3 műhold)
          </button>
          <button
            type="button"
            id="tab-gps-step-3"
            onClick={() => setActiveStep(3)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeStep === 3
                ? 'bg-rose-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Lépés (4. műhold: Időszinkron)
          </button>
        </div>
      </div>

      {/* Main Canvas & Visualizer */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[480px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl touch-none" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          className="w-full h-full object-contain cursor-grab active:cursor-grabbing select-none"
        />

        {/* Floating Hint Overlay */}
        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2 pointer-events-none">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Húzd a műholdakat a pozíciójuk módosításához!</span>
        </div>

        {/* Step 3 clock slider in canvas overlay */}
        {activeStep === 3 && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-700 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
                <Clock className="w-4 h-4" /> Vevő kvarcórájának időeltérése (Δt):
              </span>
              <span className="text-amber-400 font-bold">
                {clockError === 0 ? '0 µs (Tökéletes szinkron!)' : `${clockError} µs (~${Math.round(clockError * 300)} méter térbeli hiba)`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Pontatlan</span>
              <input
                type="range"
                min="0"
                max="25"
                value={clockError}
                onChange={(e) => setClockError(Number(e.target.value))}
                className="flex-1 accent-rose-500 cursor-pointer"
              />
              <button
                type="button"
                id="btn-sync-clock"
                onClick={() => setClockError(0)}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Szinkronizálás (4. műholddal)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task & Interaction Panel */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        {activeStep === 1 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-300 font-bold">
                1
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">1. Feladat: 2 műhold bekapcsolva</h3>
                <p className="text-sm text-slate-300 mt-0.5">
                  Figyeld meg a két műhold távolságköreit a térképen! Miért <strong>nem elég</strong> 2 műhold a helyzeted egyértelmű meghatározásához?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
              <button
                type="button"
                id="opt-step1-two-intersections"
                disabled={readOnly}
                onClick={() => setStep1Choice('two_intersections')}
                className={`p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all ${
                  step1Choice === 'two_intersections'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="font-bold mr-1.5 text-cyan-400">A)</span> Két kör metszéspontja általában 2 lehetséges pontot ad, nem tudjuk melyiken vagyunk.
              </button>
              <button
                type="button"
                id="opt-step1-signal-weak"
                disabled={readOnly}
                onClick={() => setStep1Choice('signal_weak')}
                className={`p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all ${
                  step1Choice === 'signal_weak'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="font-bold mr-1.5 text-cyan-400">B)</span> A rádióhullámok kioltják egymást a két műhold között.
              </button>
            </div>

            {!readOnly && (
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-400">Értékelés: automatikus (1 pont)</span>
                <button
                  type="button"
                  id="btn-submit-step-1"
                  onClick={handleSubmitStep1}
                  disabled={!step1Choice}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
                >
                  Válasz rögzítése & Következő lépés
                </button>
              </div>
            )}

            {step1Feedback && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs text-cyan-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{step1Feedback}</span>
              </div>
            )}
          </div>
        )}

        {activeStep === 2 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-300 font-bold">
                2
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">2. Feladat: 3 műhold bekapcsolva</h3>
                <p className="text-sm text-slate-300 mt-0.5">
                  A harmadik műholddal két pont látszik a síkban: a <strong>Felszíni pont</strong> és egy <strong>Felső légköri / űrbéli pont</strong>. Válaszd ki a valódit és indokold!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                id="opt-step2-surface"
                disabled={readOnly}
                onClick={() => setStep2SelectedPoint('surface')}
                className={`p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                  step2SelectedPoint === 'surface'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/60 text-slate-300'
                }`}
              >
                <span>🌍 Felszíni pozíció (Föld felszíne)</span>
                {step2SelectedPoint === 'surface' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                id="opt-step2-space"
                disabled={readOnly}
                onClick={() => setStep2SelectedPoint('space')}
                className={`p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                  step2SelectedPoint === 'space'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/60 text-slate-300'
                }`}
              >
                <span>🚀 Felső légköri pont (~1000 km magasan)</span>
                {step2SelectedPoint === 'space' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-xs font-semibold text-slate-300">
                Rövid indoklás: Miért zárható ki a másik pont? (A tanár is átnézi)
              </label>
              <input
                type="text"
                id="input-step2-reason"
                disabled={readOnly}
                value={step2Reason}
                onChange={(e) => setStep2Reason(e.target.value)}
                placeholder="Pl. Mert a Föld felszínén vagyunk, a másik pont az űrben vagy a Föld belsejében lenne..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {!readOnly && (
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-400">Értékelés: pontválasztás (1 pont) + tanári megbeszélés</span>
                <button
                  type="button"
                  id="btn-submit-step-2"
                  onClick={handleSubmitStep2}
                  disabled={!step2SelectedPoint}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
                >
                  Rögzítés & Tovább a 4. műholdra
                </button>
              </div>
            )}

            {step2Feedback && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{step2Feedback}</span>
              </div>
            )}
          </div>
        )}

        {activeStep === 3 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-300 font-bold">
                3
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">3. Feladat: 4. műhold és az Atomórák Szinkronja</h3>
                <p className="text-sm text-slate-300 mt-0.5">
                  A műholdakon precíz atomórák ketyegnek, ám a telefonodban csak egy olcsó kvarcóra van. Mire szolgál a negyedik műhold?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mt-2">
              <button
                type="button"
                id="opt-step3-clock-sync"
                disabled={readOnly}
                onClick={() => setStep3Choice('clock_sync')}
                className={`p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all ${
                  step3Choice === 'clock_sync'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-200'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="font-bold mr-1.5 text-rose-400">A)</span> Az órák (idő) szinkronizálására, nem egy újabb távolság-körre.
              </button>

              <button
                type="button"
                id="opt-step3-speed-boost"
                disabled={readOnly}
                onClick={() => setStep3Choice('speed_boost')}
                className={`p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all ${
                  step3Choice === 'speed_boost'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-200'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="font-bold mr-1.5 text-rose-400">B)</span> Csak arra kell, hogy gyorsabb legyen az internet a telefonon.
              </button>

              <button
                type="button"
                id="opt-step3-spare"
                disabled={readOnly}
                onClick={() => setStep3Choice('spare')}
                className={`p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all ${
                  step3Choice === 'spare'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-200'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="font-bold mr-1.5 text-rose-400">C)</span> Csak egy tartalék műhold, ha az első három elromlik.
              </button>
            </div>

            {!readOnly && (
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-400">Értékelés: automatikus (1 pont)</span>
                <button
                  type="button"
                  id="btn-submit-step-3"
                  onClick={handleSubmitStep3}
                  disabled={!step3Choice}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
                >
                  Véglegesítés & Pont rögzítése
                </button>
              </div>
            )}

            {step3Feedback && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{step3Feedback}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
