import React, { useState, useEffect } from 'react';
import { SessionData, Participant, LessonStage, TaskResponse } from '../types/index.ts';
import { realtimeClient } from '../services/socket.ts';
import { GpsSimulationCanvas } from './GpsSimulationCanvas.tsx';
import { BadgesModal } from './BadgesModal.tsx';
import { TihanyChart } from './TihanyChart.tsx';
import confetti from 'canvas-confetti';
import {
  Satellite,
  Compass,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MapPin,
  Layers,
  Clock,
  Radio,
  Share2
} from 'lucide-react';

interface StudentAppProps {
  session: SessionData;
  participant: Participant;
}

export const StudentApp: React.FC<StudentAppProps> = ({ session, participant }) => {
  // Local stage override if allowed or sync with session currentStage
  const activeStage = session.currentStage;
  const responses = session.responses[participant.id] || [];

  // Helper to get response for a task
  const getTaskResponse = (taskId: string) => responses.find((r) => r.taskId === taskId);

  // Trigger confetti on correct answer
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e'],
      });
    } catch {
      // ignore
    }
  };

  // State for forms
  const [predictionNum, setPredictionNum] = useState<number>(4);
  const [predictionSubmitted, setPredictionSubmitted] = useState<boolean>(
    !!getTaskResponse('prediction')
  );

  // Lecture slide
  const [lectureSlide, setLectureSlide] = useState<number>(0);

  // Quiz state
  const [quizQ1, setQuizQ1] = useState<string>('');
  const [quizQ2, setQuizQ2] = useState<string>('');
  const [quizFeedback, setQuizFeedback] = useState<string>('');

  // Missions state
  const [missionMargit, setMissionMargit] = useState<string>('');
  const [missionMargitFeedback, setMissionMargitFeedback] = useState<string>('');

  const [tihanyM1, setTihanyM1] = useState<string>('');
  const [tihanyM2, setTihanyM2] = useState<string>('');
  const [tihanyReason, setTihanyReason] = useState<string>('');
  const [tihanyFeedback, setTihanyFeedback] = useState<string>('');

  const [apolloLat, setApolloLat] = useState<string>('');
  const [apolloLng, setApolloLng] = useState<string>('');
  const [apolloFeedback, setApolloFeedback] = useState<string>('');

  const [olympusDiam, setOlympusDiam] = useState<string>('');
  const [olympusFeedback, setOlympusFeedback] = useState<string>('');

  // Exit ticket
  const [exitQ1, setExitQ1] = useState<string>('');
  const [exitQ2, setExitQ2] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(4);
  const [exitFeedback, setExitFeedback] = useState<string>('');

  // Badges modal
  const [isBadgesOpen, setIsBadgesOpen] = useState<boolean>(false);

  // Load existing answers on mount / update
  useEffect(() => {
    const margitResp = getTaskResponse('mission_margit');
    if (margitResp) {
      setMissionMargit(String(margitResp.rawAnswer.length || ''));
      setMissionMargitFeedback(margitResp.feedback);
    }
    const tihanyResp = getTaskResponse('mission_tihany');
    if (tihanyResp) {
      setTihanyM1(String(tihanyResp.rawAnswer.measure1 || ''));
      setTihanyM2(String(tihanyResp.rawAnswer.measure2 || ''));
      setTihanyReason(String(tihanyResp.rawAnswer.reason || ''));
      setTihanyFeedback(tihanyResp.feedback);
    }
    const apolloResp = getTaskResponse('mission_apollo');
    if (apolloResp) {
      setApolloLat(String(apolloResp.rawAnswer.latitude || ''));
      setApolloLng(String(apolloResp.rawAnswer.longitude || ''));
      setApolloFeedback(apolloResp.feedback);
    }
    const olympusResp = getTaskResponse('mission_olympus');
    if (olympusResp) {
      setOlympusDiam(String(olympusResp.rawAnswer.diameter || ''));
      setOlympusFeedback(olympusResp.feedback);
    }
    const exitResp = getTaskResponse('exit_ticket');
    if (exitResp) {
      setExitFeedback(exitResp.feedback);
    }
  }, [responses]);

  // Submission handlers
  const handlePredictionSubmit = async () => {
    const res = await realtimeClient.submitResponse(session.code, participant.id, 'prediction', {
      predictedSatellites: predictionNum,
    });
    if (res.success) {
      setPredictionSubmitted(true);
      triggerConfetti();
    }
  };

  const handleGpsSimStepComplete = async (step: number, answer: Record<string, unknown>, score: number) => {
    const taskId = `gps_sim_${step === 1 ? '2sat' : step === 2 ? '3sat' : '4sat'}`;
    const res = await realtimeClient.submitResponse(session.code, participant.id, taskId, answer);
    if (res.success && score > 0) {
      triggerConfetti();
    }
  };

  const handleQuizSubmit = async () => {
    if (!quizQ1 || !quizQ2) return;
    const res = await realtimeClient.submitResponse(session.code, participant.id, 'gps_quiz', {
      q1: quizQ1,
      q2: quizQ2,
    });
    if (res.success) {
      setQuizFeedback(res.response?.feedback || 'Kvíz rögzítve!');
      if ((res.response?.autoScore || 0) > 0) triggerConfetti();
    }
  };

  const handleMargitSubmit = async () => {
    const num = parseFloat(missionMargit);
    if (isNaN(num)) return;
    const res = await realtimeClient.submitResponse(session.code, participant.id, 'mission_margit', {
      length: num,
    });
    if (res.success) {
      setMissionMargitFeedback(res.response?.feedback || '');
      if (res.response?.isCorrect) triggerConfetti();
    }
  };

  const handleTihanySubmit = async () => {
    const m1 = parseFloat(tihanyM1);
    const m2 = parseFloat(tihanyM2);
    if (isNaN(m1) || isNaN(m2)) return;
    const res = await realtimeClient.submitResponse(session.code, participant.id, 'mission_tihany', {
      measure1: m1,
      measure2: m2,
      reason: tihanyReason,
    });
    if (res.success) {
      setTihanyFeedback(res.response?.feedback || '');
      if (res.response?.isCorrect) triggerConfetti();
    }
  };

  const handleApolloSubmit = async () => {
    const lat = parseFloat(apolloLat);
    const lng = parseFloat(apolloLng);
    if (isNaN(lat) || isNaN(lng)) return;
    const res = await realtimeClient.submitResponse(session.code, participant.id, 'mission_apollo', {
      latitude: lat,
      longitude: lng,
    });
    if (res.success) {
      setApolloFeedback(res.response?.feedback || '');
      if (res.response?.isCorrect) triggerConfetti();
    }
  };

  const handleOlympusSubmit = async () => {
    const diam = parseFloat(olympusDiam);
    if (isNaN(diam)) return;
    const res = await realtimeClient.submitResponse(session.code, participant.id, 'mission_olympus', {
      diameter: diam,
    });
    if (res.success) {
      setOlympusFeedback(res.response?.feedback || '');
      if (res.response?.isCorrect) triggerConfetti();
    }
  };

  const handleExitSubmit = async () => {
    if (!exitQ1 || !exitQ2) return;
    const res = await realtimeClient.submitResponse(session.code, participant.id, 'exit_ticket', {
      q1: exitQ1,
      q2: exitQ2,
      confidence,
    });
    if (res.success) {
      setExitFeedback(res.response?.feedback || '');
      triggerConfetti();
    }
  };

  // Lecture slides content (5.3 Mikroelőadás)
  const LECTURE_SLIDES = [
    {
      title: '1. Műhold: A Gömb (Síkban kör)',
      subtitle: 'Távolságmérés rádióhullámokkal',
      icon: Radio,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30',
      text: 'A műhold ismert pályán mozog, és pontos időkódot sugároz. A telefonod a jel beérkezési idejéből kiszámolja a távolságot (d = c · Δt). Egyetlen műholdtól mért távolság alapján a lehetséges helyeid egy gömböt (síkban kört) alkotnak a Föld körül.',
    },
    {
      title: '2. Műhold: A Két Metszéspont',
      subtitle: 'Szűkül a kör, de még nem elég',
      icon: Compass,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'Két műhold távolsággömbjeinek metszete a térben egy kör, a síkban pedig két diszkrét pont. A vevőd még nem tudja, melyik ponton tartózkodsz: két teljesen érvényes matematikai megoldás létezik!',
    },
    {
      title: '3. Műhold: Felszíni Kizárás',
      subtitle: 'A valódi és a lehetetlen pont',
      icon: Layers,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      text: 'A 3. műhold távolsággömbje tovább szűkíti a lehetséges helyeket. A két metszéspont közül az egyik a Föld felszínén van, a másik pedig általában a Föld mélyében vagy a világűrben (~1000 km magasan) lenne, így fizikai kizárással eldönthető.',
    },
    {
      title: '4. Műhold: Az Atomórák Szinkronja',
      subtitle: 'A legfontosabb felismerés: Időkorrekció!',
      icon: Clock,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/30',
      text: 'A műholdakon milliárdos rubídium/cézium atomórák ketyegnek. A telefonodban viszont csak egy olcsó kvarcóra van, ami naponta ezredmásodperceket késhet. Mivel a fénysebesség 300 000 km/s, 1 mikroszekundum órahiba 300 méter pozícióhibát okozna! A 4. műhold szükséges a vevő órájának nanoszekundumos szinkronizálásához.',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 pb-16">
      {/* Student Top Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">{participant.teamName}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Szoba: {session.code}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Diák azonosító: <strong className="text-slate-300">{participant.studentId}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badges Button */}
          <button
            type="button"
            onClick={() => setIsBadgesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
          >
            <Award className="w-4 h-4" />
            <span>Jelvények ({participant.badges.length})</span>
          </button>

          {/* Live XP / Points Counter */}
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/40 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Összpont</span>
              <span className="text-base font-black font-mono text-white leading-none">
                {participant.totalScore} / 20 pt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STAGE CONTAINER BASED ON TEACHER CURRENT STAGE */}

      {/* 1. LOBBY */}
      {activeStage === 'lobby' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse">
            <Satellite className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Sikeresen csatlakoztál a Műhold-küldetéshez!
          </h2>
          <p className="text-sm text-slate-300 max-w-md">
            Várakozás a tanárra... Amint a tanár elindítja az órát a kivetítőn, a feladatlap automatikusan átvált.
          </p>
          <div className="px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Élő szinkron aktív (Szoba: <strong className="text-white font-mono">{session.code}</strong>)
          </div>
        </div>
      )}

      {/* 2. BLOCK 1 HOOK */}
      {activeStage === 'block1_hook' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
            <Satellite className="w-8 h-8" />
          </div>

          <div className="max-w-xl space-y-3">
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
              Fizika 5-6. Összevont Óra • Indítás
            </span>
            <h2 className="text-2xl font-black text-slate-100 leading-tight">
              "Honnan tudja a telefonod, hol vagy — 20 200 km magasból nézve? És mennyire pontosan mérhetjük meg vele a Földet?"
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Egyetlen érintés a képernyőn, és kék pontként látod magad az utcasarkon. De a műholdak nem látnak és nem fényképeznek: pusztán rádióhullámokat küldenek le az űrből. Készülj fel a küldetésre!
            </p>
          </div>

          <button
            type="button"
            onClick={triggerConfetti}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <span>Küldetés Indítása</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. BLOCK 1 PREDICTION */}
      {activeStage === 'block1_prediction' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
                Előzetes Tudás & Jóslás
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-1">
                Szerinted hány műholdra van szükség ahhoz, hogy a helyzeted EGYÉRTELMŰEN, pontosan meghatározható legyen?
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                (Tippelj bátran 1 és 6 között! Nincs azonnali pontlevonás rossz válaszért — az óra végén látni fogod a pontos magyarázatot.)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                id={`btn-pred-${num}`}
                disabled={predictionSubmitted}
                onClick={() => setPredictionNum(num)}
                className={`w-14 h-14 rounded-2xl font-mono text-xl font-bold border transition-all flex items-center justify-center ${
                  predictionNum === num
                    ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                    : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="button"
              id="btn-submit-prediction"
              disabled={predictionSubmitted}
              onClick={handlePredictionSubmit}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
            >
              {predictionSubmitted ? '✓ Jóslat Rögzítve!' : 'Jóslatom Beküldése'}
            </button>

            {predictionSubmitted && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Tipp ({predictionNum} db) rögzítve a tanári rendszerben. Kövesd a kivetítőt!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. BLOCK 1 LECTURE CARDS */}
      {activeStage === 'block1_lecture' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">
                Mikroelőadás: A GPS és a Trilateráció Alapelvei
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {LECTURE_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLectureSlide(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    lectureSlide === i ? 'bg-cyan-400 w-6' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Active Slide Display */}
          <div className={`p-6 rounded-2xl border ${LECTURE_SLIDES[lectureSlide].bgColor} flex flex-col gap-4 shadow-xl transition-all duration-300`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {LECTURE_SLIDES[lectureSlide].subtitle}
                </span>
                <h3 className={`text-xl font-extrabold ${LECTURE_SLIDES[lectureSlide].color} mt-0.5`}>
                  {LECTURE_SLIDES[lectureSlide].title}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                {React.createElement(LECTURE_SLIDES[lectureSlide].icon, {
                  className: `w-6 h-6 ${LECTURE_SLIDES[lectureSlide].color}`,
                })}
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              {LECTURE_SLIDES[lectureSlide].text}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setLectureSlide((prev) => Math.max(0, prev - 1))}
              disabled={lectureSlide === 0}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Előző Kártya
            </button>

            <button
              type="button"
              onClick={() => setLectureSlide((prev) => Math.min(LECTURE_SLIDES.length - 1, prev + 1))}
              disabled={lectureSlide === LECTURE_SLIDES.length - 1}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-xs font-semibold text-slate-950 flex items-center gap-1"
            >
              Következő Kártya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. BLOCK 1 SIMULATION */}
      {activeStage === 'block1_simulation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <GpsSimulationCanvas
            onStepComplete={handleGpsSimStepComplete}
            savedAnswers={{
              gps_sim_2sat: getTaskResponse('gps_sim_2sat')?.rawAnswer,
              gps_sim_3sat: getTaskResponse('gps_sim_3sat')?.rawAnswer,
              gps_sim_4sat: getTaskResponse('gps_sim_4sat')?.rawAnswer,
            }}
          />
        </div>
      )}

      {/* 6. BLOCK 1 QUIZ & GALILEO */}
      {activeStage === 'block1_quiz' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-cyan-400">
              GPS-elv Kvíz & Galileo Összehasonlítás (max. 2 pont)
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Fizikai ellenőrző kérdések
            </h2>
          </div>

          {/* Question 1 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-200">
              1. Kérdés: Miért nem elég 3 műhold, ha a vevő órája nem tökéletes?
            </h3>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer text-xs text-slate-300">
                <input
                  type="radio"
                  name="quiz_q1"
                  value="speed_of_light_error"
                  checked={quizQ1 === 'speed_of_light_error'}
                  onChange={(e) => setQuizQ1(e.target.value)}
                  className="mt-0.5 accent-cyan-400"
                />
                <span>
                  Mert a fénysebességgel terjedő rádióhullámoknál már 1 mikroszekundumos (0,000001 s) óraeltérés is kb. 300 méteres pozícióhibát okozna.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer text-xs text-slate-300">
                <input
                  type="radio"
                  name="quiz_q1"
                  value="gravity_loss"
                  checked={quizQ1 === 'gravity_loss'}
                  onChange={(e) => setQuizQ1(e.target.value)}
                  className="mt-0.5 accent-cyan-400"
                />
                <span>
                  Mert a Föld gravitációja miatt a harmadik műhold jele lelassul a légkörben.
                </span>
              </label>
            </div>
          </div>

          {/* Question 2 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-200">
              2. Kérdés: Miben hasonlít és miben különbözik a GPS és a Galileo rendszer?
            </h3>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer text-xs text-slate-300">
                <input
                  type="radio"
                  name="quiz_q2"
                  value="same_principle_different_system"
                  checked={quizQ2 === 'same_principle_different_system'}
                  onChange={(e) => setQuizQ2(e.target.value)}
                  className="mt-0.5 accent-cyan-400"
                />
                <span>
                  Mindkettő ugyanazon (trilaterációs) geometriai elven és rádiós időmérésen alapul, de a GPS amerikai, a Galileo pedig az Európai Unió független polgári rendszere más műholdflottával.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer text-xs text-slate-300">
                <input
                  type="radio"
                  name="quiz_q2"
                  value="optical_laser"
                  checked={quizQ2 === 'optical_laser'}
                  onChange={(e) => setQuizQ2(e.target.value)}
                  className="mt-0.5 accent-cyan-400"
                />
                <span>
                  A Galileo lézerekkel pásztázza a telefonokat, míg a GPS sima optikai kamerákat használ.
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">Automatikus értékelés (max 2 pont)</span>
            <button
              type="button"
              id="btn-submit-quiz"
              onClick={handleQuizSubmit}
              disabled={!quizQ1 || !quizQ2}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
            >
              Kvíz Válaszok Beküldése
            </button>
          </div>

          {quizFeedback && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs text-cyan-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{quizFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* 7. TRANSITION MISSION BRIEFING */}
      {activeStage === 'transition' && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-blue-500/30 rounded-2xl p-8 text-center flex flex-col items-center gap-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>

          <div className="max-w-xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Átvezetés • Mission Briefing
            </span>
            <h2 className="text-2xl font-black text-slate-100">
              "Kilépünk az űrből — most a Föld felszínén mérünk!"
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Megértettük a műholdak geometriáját. Most a Google műholdas és planetáris térképei segítségével te magad végzel valós távolság- és partvonalméréseket.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-xl max-w-lg text-left text-xs text-slate-300 space-y-2">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" /> Hogyan dolgozz?
            </div>
            <p>
              A feladatoknál található <strong>"Megnyitás"</strong> gombok új böngészőfülön nyitják meg a Google Earth-öt / Google Maps-et. Használd a vonalzó eszközt a méréshez, majd <strong>térj vissza erre a fülre</strong>, és írd be az eredményt!
            </p>
          </div>
        </div>
      )}

      {/* 8. BLOCK 2 FIELD MISSIONS */}
      {activeStage === 'block2_missions' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Terepmisszió: Online Mérések (Google Earth, Maps, Sky, Moon, Mars)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              A csapatok saját tempójukban haladhatnak a 4 küldetéssel (A, B, C, D). A pontszámok beküldés után azonnal jóváíródnak.
            </p>
          </div>

          {/* MISSION A: Margit híd */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Küldetés A • Google Earth / Maps (1 pont)
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">
                  A budapesti Margit híd teljes hossza
                </h3>
              </div>
              <a
                href="https://earth.google.com/web/search/Margit+h%C3%ADd+Budapest"
                target="_blank"
                rel="noreferrer noopener"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Megnyitás: Google Earth</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Keresd meg a Google Earth vagy Google Maps vonalzójával a Margit híd teljes hosszát (parttól partig, a hidat magát mérve, méterben).
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-64">
                <label className="text-[11px] text-slate-400 block mb-1">Mért hossz (méter):</label>
                <input
                  type="number"
                  id="input-margit-length"
                  placeholder="Pl. 600"
                  value={missionMargit}
                  onChange={(e) => setMissionMargit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                id="btn-submit-margit"
                onClick={handleMargitSubmit}
                disabled={!missionMargit}
                className="w-full sm:w-auto mt-auto px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
              >
                Mérés Beküldése
              </button>
            </div>

            {missionMargitFeedback && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{missionMargitFeedback}</span>
              </div>
            )}
          </div>

          {/* MISSION B: Tihany partvonal */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  Küldetés B • Google Earth Kétszeri Mérés (1 pont)
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">
                  A Tihanyi-félsziget partvonala (Durva vs. Finom mérés)
                </h3>
              </div>
              <a
                href="https://earth.google.com/web/search/Tihanyi-f%C3%A9lsziget"
                target="_blank"
                rel="noreferrer noopener"
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Megnyitás: Google Earth (Tihany)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>1. mérés:</strong> Mérd meg a partvonal hosszát a vonalzóval kb. <strong>10 töréspontot</strong> használva.<br />
              <strong>2. mérés:</strong> Mérd meg újra, ezúttal <strong>20–50 törésponttal</strong>, minél pontosabban követve a part kanyarulatait!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">1. mérés (~10 pont, km):</label>
                <input
                  type="number"
                  step="0.1"
                  id="input-tihany-m1"
                  placeholder="Pl. 22.0"
                  value={tihanyM1}
                  onChange={(e) => setTihanyM1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-cyan-300 block mb-1">2. finom mérés (20–50 pont, km):</label>
                <input
                  type="number"
                  step="0.1"
                  id="input-tihany-m2"
                  placeholder="Pl. 26.5"
                  value={tihanyM2}
                  onChange={(e) => setTihanyM2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Önreflexió: Miért lett hosszabb (vagy miért nem lett) a 2. mérés?
              </label>
              <input
                type="text"
                id="input-tihany-reason"
                placeholder="Pl. A több töréspont jobban beveszi a part apró öbleit és kanyarulatait..."
                value={tihanyReason}
                onChange={(e) => setTihanyReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                id="btn-submit-tihany"
                onClick={handleTihanySubmit}
                disabled={!tihanyM1 || !tihanyM2}
                className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
              >
                Tihany Eredmények Rögzítése
              </button>
            </div>

            {tihanyFeedback && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-cyan-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>{tihanyFeedback}</span>
              </div>
            )}
          </div>

          {/* MISSION C: Apollo-11 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Küldetés C • Google Moon / Sky (1 pont)
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">
                  Apollo-11 Leszállóhely (Mare Tranquillitatis)
                </h3>
              </div>
              <a
                href="https://www.google.com/moon/"
                target="_blank"
                rel="noreferrer noopener"
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Megnyitás: Google Moon</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Nyisd meg a Google Moon nézetet, keresd meg az Apollo–11 leszállóhelyét a Nyugalom-tengeren, és add meg a szélességi és hosszúsági fokokat!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Északi szélesség (fok, É):</label>
                <input
                  type="number"
                  step="0.01"
                  id="input-apollo-lat"
                  placeholder="Elfogadási sáv: 0 – 1.5°"
                  value={apolloLat}
                  onChange={(e) => setApolloLat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Keleti hosszúság (fok, K):</label>
                <input
                  type="number"
                  step="0.01"
                  id="input-apollo-lng"
                  placeholder="Elfogadási sáv: 22.5 – 24.5°"
                  value={apolloLng}
                  onChange={(e) => setApolloLng(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                id="btn-submit-apollo"
                onClick={handleApolloSubmit}
                disabled={!apolloLat || !apolloLng}
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
              >
                Koordináták Beküldése
              </button>
            </div>

            {apolloFeedback && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-amber-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{apolloFeedback}</span>
              </div>
            )}
          </div>

          {/* MISSION D: Olympus Mons */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  Küldetés D • Google Mars (1 pont)
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">
                  Olympus Mons Pajzsvulkán Alapátmérője
                </h3>
              </div>
              <a
                href="https://www.google.com/mars/#lat=-18.646245&lon=-134.121093&q=Olympus%20Mons"
                target="_blank"
                rel="noreferrer noopener"
                className="px-3.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Megnyitás: Google Mars</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Nyisd meg a Google Mars nézetet, keresd meg a Naprendszer legnagyobb ismert vulkánját (Olympus Mons), és a vonalzóval becsüld meg a hegy alapátmérőjét kilométerben!
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-64">
                <label className="text-[11px] text-slate-400 block mb-1">Átmérő (km):</label>
                <input
                  type="number"
                  id="input-olympus-diam"
                  placeholder="Elfogadási sáv: 500 – 700 km"
                  value={olympusDiam}
                  onChange={(e) => setOlympusDiam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
              <button
                type="button"
                id="btn-submit-olympus"
                onClick={handleOlympusSubmit}
                disabled={!olympusDiam}
                className="w-full sm:w-auto mt-auto px-5 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
              >
                Átmérő Beküldése
              </button>
            </div>

            {olympusFeedback && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-rose-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{olympusFeedback}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. DISCUSSION (TIHANY CHART) */}
      {activeStage === 'discussion' && (
        <div className="space-y-6">
          <TihanyChart session={session} isTeacher={false} />
        </div>
      )}

      {/* 10. EXIT TICKET */}
      {activeStage === 'exit_ticket' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-cyan-400">
              Exit Ticket • Záró Felmérés (1 pont)
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Mit vittél el a mai dupla fizikaóráról?
            </h2>
          </div>

          {/* Q1 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-200">
              1. Miért szükséges legalább 4 műhold a pontos GPS navigációhoz?
            </h3>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="exit_q1"
                  value="clock_sync"
                  checked={exitQ1 === 'clock_sync'}
                  onChange={(e) => setExitQ1(e.target.value)}
                  className="accent-cyan-400"
                />
                <span>Mert a vevő pontatlan órájának idejét szinkronizálni kell az atomórákkal.</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="exit_q1"
                  value="backup_sat"
                  checked={exitQ1 === 'backup_sat'}
                  onChange={(e) => setExitQ1(e.target.value)}
                  className="accent-cyan-400"
                />
                <span>Csak azért, hogy legyen egy tartalék műhold felhős időben.</span>
              </label>
            </div>
          </div>

          {/* Q2 */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-200">
              2. Miért nő egy partvonal mért hossza, ha finomabban (több ponttal) mérjük?
            </h3>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="exit_q2"
                  value="fractal_coastline"
                  checked={exitQ2 === 'fractal_coastline'}
                  onChange={(e) => setExitQ2(e.target.value)}
                  className="accent-cyan-400"
                />
                <span>A fraktál-szerű kanyarulatok finomabb követése összeadódva megnöveli a megtett utat.</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="exit_q2"
                  value="earth_stretching"
                  checked={exitQ2 === 'earth_stretching'}
                  onChange={(e) => setExitQ2(e.target.value)}
                  className="accent-cyan-400"
                />
                <span>A kontinensvándorlás miatt a földfelszín megnyúlik mérés közben.</span>
              </label>
            </div>
          </div>

          {/* Confidence scale */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-200 flex justify-between">
              <span>Mennyire érzed magad magabiztosnak ebben a témában?</span>
              <span className="text-cyan-400 font-mono">{confidence} / 5</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 - Bizonytalan</span>
              <span>5 - Teljesen átlátom!</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              id="btn-submit-exit"
              onClick={handleExitSubmit}
              disabled={!exitQ1 || !exitQ2}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
            >
              Exit Ticket Beküldése
            </button>
          </div>

          {exitFeedback && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs text-cyan-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{exitFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* 11. FINAL LEADERBOARD & BADGES */}
      {activeStage === 'final' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Award className="w-8 h-8" />
          </div>

          <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-black text-slate-100">
              Küldetés Sikeresen Teljesítve!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Gratulálunk a(z) <strong className="text-cyan-300">{participant.teamName}</strong> csapatnak!
            </p>
          </div>

          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 w-full max-w-sm flex flex-col items-center gap-3">
            <span className="text-xs uppercase font-bold text-slate-400">Végső Eredményed</span>
            <span className="text-4xl font-black font-mono text-cyan-400">
              {participant.totalScore} <span className="text-lg text-slate-500">/ 20 pt</span>
            </span>
            <div className="text-[11px] text-emerald-400 font-medium">
              ✓ Pontok automatikusan rögzítve a Fizika Pontkövetőben
            </div>
          </div>

          {/* Earned badges pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {participant.badges.map((badge) => (
              <span
                key={badge}
                className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                {badge}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsBadgesOpen(true)}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Jelvények & Kitüntetések Megtekintése
          </button>
        </div>
      )}

      {/* Badges Modal */}
      <BadgesModal
        isOpen={isBadgesOpen}
        onClose={() => setIsBadgesOpen(false)}
        earnedBadges={participant.badges}
        teamName={participant.teamName}
      />
    </div>
  );
};
