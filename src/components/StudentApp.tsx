import React, { useState, useEffect } from 'react';
import { SessionData, Participant } from '../types/index.ts';
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
  HelpCircle,
  Award,
  Sparkles,
  MapPin,
  Clock,
  Radio,
  Gamepad2,
  ChevronRight,
  TrendingUp,
  Edit2,
  Check
} from 'lucide-react';

interface StudentAppProps {
  session: SessionData;
  participant: Participant;
  activeGameTab?: string;
  onSelectGameTab?: (tab: string) => void;
  onOpenPresentation?: () => void;
  onUpdateParticipantName?: (newName: string) => void;
}

export const StudentApp: React.FC<StudentAppProps> = ({
  session,
  participant,
  activeGameTab = 'sim',
  onSelectGameTab,
  onOpenPresentation,
  onUpdateParticipantName,
}) => {
  const [currentTab, setCurrentTab] = useState<string>(activeGameTab || 'sim');

  useEffect(() => {
    if (activeGameTab) {
      setCurrentTab(activeGameTab);
    }
  }, [activeGameTab]);

  const setTab = (tab: string) => {
    setCurrentTab(tab);
    if (onSelectGameTab) {
      onSelectGameTab(tab);
    }
  };

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

  // Inline team name edit state
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(participant.teamName);

  const handleSaveName = () => {
    if (tempName.trim()) {
      if (onUpdateParticipantName) {
        onUpdateParticipantName(tempName.trim());
      }
      setIsEditingName(false);
    }
  };

  // State for forms
  const [predictionNum, setPredictionNum] = useState<number>(4);
  const [predictionSubmitted, setPredictionSubmitted] = useState<boolean>(
    !!getTaskResponse('prediction')
  );

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
    const d = parseFloat(olympusDiam);
    if (isNaN(d)) return;
    const res = await realtimeClient.submitResponse(session.code, participant.id, 'mission_olympus', {
      diameter: d,
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
      setExitFeedback(res.response?.feedback || 'Válaszok rögzítve!');
      if (res.response?.isCorrect) triggerConfetti();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-16">
      {/* Student Top Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-slate-950 border border-cyan-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="p-1 rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-100">{participant.teamName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempName(participant.teamName);
                      setIsEditingName(true);
                    }}
                    className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                    title="Név szerkesztése"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Aktivitás szinkronizálva
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              5–6. Összevont Fizikaóra • Műhold-küldetés
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* PPT Button */}
          {onOpenPresentation && (
            <button
              type="button"
              onClick={onOpenPresentation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Prezentáció (PPT)</span>
            </button>
          )}

          {/* Badges Button */}
          <button
            type="button"
            onClick={() => setIsBadgesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
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

      {/* GAME SELECTOR TABS - UNLOCKED FOR IMMEDIATE PLAY */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto shadow-md">
        <button
          type="button"
          id="tab-btn-sim"
          onClick={() => setTab('sim')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            currentTab === 'sim'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Satellite className="w-4 h-4" />
          <span>1. GPS Szimulátor</span>
        </button>

        <button
          type="button"
          id="tab-btn-quiz"
          onClick={() => setTab('quiz')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            currentTab === 'quiz'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>2. Jóslás & Kvíz</span>
        </button>

        <button
          type="button"
          id="tab-btn-missions"
          onClick={() => setTab('missions')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            currentTab === 'missions'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>3. Google Earth Mérések</span>
        </button>

        <button
          type="button"
          id="tab-btn-tihany"
          onClick={() => setTab('tihany')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            currentTab === 'tihany'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>4. Tihany Paradoxon</span>
        </button>

        <button
          type="button"
          id="tab-btn-exit"
          onClick={() => setTab('exit')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            currentTab === 'exit'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>5. Záróteszt & Jelvények</span>
        </button>
      </div>

      {/* GAME CONTENT AREAS */}

      {/* GAME 1: GPS SIMULATOR */}
      {currentTab === 'sim' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                1. Játék & Szimuláció (max. 3 pont)
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                GPS Trilateráció & Atomóra Korrekció Szimulátor
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Mozgasd a műholdakat, figyeld a metszéspontokat és korrigáld az órahibát!
            </span>
          </div>

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

      {/* GAME 2: PREDICTION & QUIZ */}
      {currentTab === 'quiz' && (
        <div className="space-y-6">
          {/* Sub-game A: Prediction */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
                  Előzetes Jóslat Játék (1 pont)
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-1">
                  Szerinted hány műholdra van szükség ahhoz, hogy a helyzeted EGYÉRTELMŰEN meghatározható legyen a Földön?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Válassz egy számot 1 és 6 között!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 py-2">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  id={`btn-pred-${num}`}
                  onClick={() => setPredictionNum(num)}
                  className={`w-14 h-14 rounded-2xl font-mono text-xl font-bold border transition-all flex items-center justify-center cursor-pointer ${
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
                onClick={handlePredictionSubmit}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/20"
              >
                {predictionSubmitted ? '✓ Jóslat Rögzítve (Módosítás mentése)' : 'Jóslatom Beküldése'}
              </button>

              {predictionSubmitted && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Jóslat ({predictionNum} db műhold) rögzítve!</span>
                </div>
              )}
            </div>
          </div>

          {/* Sub-game B: Galileo & Physics Quiz */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-cyan-400">
                Fizikai Kvíz & Galileo Verseny (max. 2 pont)
              </span>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                Tedd próbára a tudásodat!
              </h2>
            </div>

            {/* Question 1 */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-200">
                1. Miért nem elég 3 műhold, ha a vevő órája nem tökéletes?
              </h3>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer text-xs text-slate-300 transition-colors">
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

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer text-xs text-slate-300 transition-colors">
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
                2. Miben hasonlít és miben különbözik a GPS és a Galileo rendszer?
              </h3>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer text-xs text-slate-300 transition-colors">
                  <input
                    type="radio"
                    name="quiz_q2"
                    value="same_principle_different_system"
                    checked={quizQ2 === 'same_principle_different_system'}
                    onChange={(e) => setQuizQ2(e.target.value)}
                    className="mt-0.5 accent-cyan-400"
                  />
                  <span>
                    Mindkettő ugyanazon (trilaterációs) geometriai elven és rádiós időmérésen alapul, de a GPS amerikai, a Galileo pedig az Európai Unió független polgári rendszere.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer text-xs text-slate-300 transition-colors">
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
              <span className="text-xs text-slate-400">Azonnali visszajelzés és pontozás</span>
              <button
                type="button"
                id="btn-submit-quiz"
                onClick={handleQuizSubmit}
                disabled={!quizQ1 || !quizQ2}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
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
        </div>
      )}

      {/* GAME 3: GOOGLE EARTH MISSIONS */}
      {currentTab === 'missions' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Terepmisszió: Online Mérések (Google Earth, Maps, Sky, Moon, Mars)
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Nyisd meg a küldetések gombjait új lapon, használd a térképi vonalzót, majd írd be a mért adatokat a pontjaidért!
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
              Keresd meg a Google Earth vagy Google Maps vonalzójával a Margit híd teljes hosszát (parttól partig, méterben mérve).
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-64">
                <label className="text-[11px] text-slate-400 block mb-1">Mért hossz (méter):</label>
                <input
                  type="number"
                  id="input-margit-length"
                  placeholder="Pl. 607"
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
                className="w-full sm:w-auto mt-auto px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
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
                  Küldetés B • Kétszeri Mérés (1 pont)
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
              <strong>2. mérés:</strong> Mérd meg újra, ezúttal <strong>20–50 törésponttal</strong>, pontosabban követve a kanyarulatokat!
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
                Önreflexió: Miért lett hosszabb a 2. mérés?
              </label>
              <input
                type="text"
                id="input-tihany-reason"
                placeholder="Pl. A több töréspont jobban beveszi a part apró öbleit..."
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
                className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
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
              Keresd meg az Apollo–11 leszállóhelyét a Nyugalom-tengeren, és add meg a szélességi és hosszúsági fokokat!
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
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
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
              Keresd meg a Naprendszer legnagyobb vulkánját a Google Mars-on, és a vonalzóval becsüld meg az alapátmérőjét kilométerben!
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
                className="w-full sm:w-auto mt-auto px-5 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
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

      {/* GAME 4: TIHANY PARADOX */}
      {currentTab === 'tihany' && (
        <div className="space-y-6">
          <TihanyChart session={session} isTeacher={false} />
        </div>
      )}

      {/* GAME 5: EXIT TICKET & FINAL BADGES */}
      {currentTab === 'exit' && (
        <div className="space-y-6">
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
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
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

          {/* Final Badges and Achievements summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-6 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-1">
              <h2 className="text-xl font-bold text-slate-100">
                Jelvényeid & Pontszámod
              </h2>
              <p className="text-xs text-slate-400">
                Gratulálunk a(z) <strong className="text-cyan-300">{participant.teamName}</strong> csapatnak!
              </p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 w-full max-w-xs flex flex-col items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-slate-400">Elért Pontszámod</span>
              <span className="text-3xl font-black font-mono text-cyan-400">
                {participant.totalScore} <span className="text-base text-slate-500">/ 20 pt</span>
              </span>
            </div>

            {/* Badges pills */}
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
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Részletes Jelvénytár Megnyitása
            </button>
          </div>
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
