import React, { useState } from 'react';
import { SessionData, STAGES, LessonStage, Participant } from '../types/index.ts';
import { realtimeClient } from '../services/socket.ts';
import { submitScoreToPontkoveto } from '../services/pontkoveto.ts';
import { TihanyChart } from './TihanyChart.tsx';
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Award,
  RefreshCw,
  Send,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Edit3,
  BarChart2,
  Check,
  Globe2,
  Lock,
  Compass
} from 'lucide-react';

interface TeacherDashboardProps {
  session: SessionData;
  onRefresh?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ session, onRefresh }) => {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [overrideTaskId, setOverrideTaskId] = useState<string>('');
  const [overrideScoreVal, setOverrideScoreVal] = useState<number>(1);
  const [pontkovetoSyncing, setPontkovetoSyncing] = useState<boolean>(false);
  const [pontkovetoResult, setPontkovetoResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'discussion' | 'leaderboard'>('overview');

  const participantsList: Participant[] = Object.values(session.participants || {});
  const currentStageIndex = STAGES.findIndex((s) => s.id === session.currentStage);

  // Advance stage
  const handleStageChange = async (newStage: LessonStage) => {
    await realtimeClient.setStage(session.code, newStage);
  };

  const handleNextStage = () => {
    if (currentStageIndex < STAGES.length - 1) {
      handleStageChange(STAGES[currentStageIndex + 1].id);
    }
  };

  const handlePrevStage = () => {
    if (currentStageIndex > 0) {
      handleStageChange(STAGES[currentStageIndex - 1].id);
    }
  };

  // Award lesson work points (0-10)
  const handleLessonWorkChange = async (participantId: string, score: number) => {
    await realtimeClient.setLessonWorkScore(session.code, participantId, score);
  };

  // Manual score override
  const handleManualOverride = async (participantId: string, taskId: string, score: number) => {
    await realtimeClient.overrideScore(session.code, participantId, taskId, score);
    setOverrideTaskId('');
  };

  // Bulk sync to Pontkövető
  const handleSyncAllToPontkoveto = async () => {
    setPontkovetoSyncing(true);
    setPontkovetoResult(null);

    let successCount = 0;
    for (const p of participantsList) {
      const responses = session.responses[p.id] || [];

      // Calculate category points breakdown
      const gpsSimResponses = responses.filter(r => r.taskId.startsWith('gps_sim_'));
      const gpsSim = gpsSimResponses.reduce((sum, r) => sum + (r.teacherOverrideScore ?? r.autoScore), 0);
      
      const gpsQuizR = responses.find(r => r.taskId === 'gps_quiz');
      const gpsQuiz = (gpsQuizR?.teacherOverrideScore ?? gpsQuizR?.autoScore) || 0;

      const margitR = responses.find(r => r.taskId === 'mission_margit');
      const tihanyR = responses.find(r => r.taskId === 'mission_tihany');
      const googleEarth = ((margitR?.teacherOverrideScore ?? margitR?.autoScore) || 0) +
                          ((tihanyR?.teacherOverrideScore ?? tihanyR?.autoScore) || 0);

      const apolloR = responses.find(r => r.taskId === 'mission_apollo');
      const olympusR = responses.find(r => r.taskId === 'mission_olympus');
      const googleSky = ((apolloR?.teacherOverrideScore ?? apolloR?.autoScore) || 0) +
                        ((olympusR?.teacherOverrideScore ?? olympusR?.autoScore) || 0);

      const exitR = responses.find(r => r.taskId === 'exit_ticket');
      const exitTicket = (exitR?.teacherOverrideScore ?? exitR?.autoScore) || 0;

      const breakdown = {
        lessonWork: p.lessonWorkScore || 0,
        gpsSimulation: gpsSim,
        gpsQuiz,
        googleEarth,
        googleSky,
        exitTicket,
        total: p.totalScore,
      };

      const res = await submitScoreToPontkoveto(
        p.studentId || p.teamName,
        p.totalScore,
        'ora-05-06-muhold-kuldetes',
        breakdown,
        p.teamName
      );
      if (res.success) successCount++;
    }

    setPontkovetoSyncing(false);
    setPontkovetoResult(`${successCount}/${participantsList.length} csapat pontjai sikeresen szinkronizálva a Fizika Pontkövetőbe!`);
  };

  const selectedParticipant = participantsList.find((p) => p.id === selectedParticipantId);
  const selectedResponses = selectedParticipantId ? session.responses[selectedParticipantId] || [] : [];

  return (
    <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Top Projector Banner: PIN & Global Stage Control */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex flex-col items-center justify-center shrink-0">
            <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-400">Belépési Kód</span>
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white mt-0.5">
              {session.code}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                Tanári Vezérlőpult & Kivetítő
              </span>
              <span className="text-xs text-slate-400">
                {participantsList.length} bejelentkezett csapat
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
              {session.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Aktív szakasz: <strong className="text-cyan-300">{STAGES[currentStageIndex]?.title}</strong> ({STAGES[currentStageIndex]?.block})
            </p>
          </div>
        </div>

        {/* Global Progression Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            id="btn-prev-stage"
            onClick={handlePrevStage}
            disabled={currentStageIndex === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Előző szakasz
          </button>

          <button
            type="button"
            id="btn-next-stage"
            onClick={handleNextStage}
            disabled={currentStageIndex === STAGES.length - 1}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <span>Következő szakasz</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stage Flow Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-[840px]">
          {STAGES.map((s, idx) => {
            const isActive = s.id === session.currentStage;
            const isPast = idx < currentStageIndex;
            return (
              <button
                key={s.id}
                type="button"
                id={`stage-pill-${s.id}`}
                onClick={() => handleStageChange(s.id)}
                className={`flex-1 p-2.5 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/40 shadow-sm'
                    : isPast
                    ? 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    : 'border-slate-800/60 bg-slate-950/40 text-slate-500 hover:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span>{idx + 1}. szakasz</span>
                  {isPast && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className="text-xs font-bold truncate mt-0.5">{s.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Teacher Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" /> Óravázlat & Feladatok
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'teams' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Élő Csapatlista & Pontozás ({participantsList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('discussion')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'discussion' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Tihany Eredmények (Megbeszélés)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'leaderboard' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" /> Ranglista & Pontkövető Export
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STAGE DETAILS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Stage Card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide uppercase text-cyan-400">
                Jelenleg vetített szakasz ({currentStageIndex + 1}/{STAGES.length})
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {STAGES[currentStageIndex]?.block}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-100">
              {STAGES[currentStageIndex]?.title}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {STAGES[currentStageIndex]?.description}
            </p>

            {/* Context-specific teacher hints */}
            {session.currentStage === 'lobby' && (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-2 text-xs text-slate-300">
                <span className="font-bold text-cyan-300">Teendő a projektoron:</span>
                <p>
                  Vetítsd ki ezt a képernyőt! A diákok nyissák meg a <strong>/diak</strong> oldalt a saját eszközeiken (okostelefon, tablet, laptop),
                  és írják be a(z) <strong className="text-white font-mono text-base px-2 py-0.5 bg-slate-800 rounded">{session.code}</strong> kódot egy csapatnévvel.
                </p>
              </div>
            )}

            {session.currentStage === 'block1_hook' && (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-2 text-xs text-slate-300">
                <span className="font-bold text-cyan-300">Kérdésfelvetés az osztálynak:</span>
                <p className="text-base italic text-slate-200">
                  "Honnan tudja a telefonod, hol vagy — 20 200 km magasból nézve? És mennyire pontosan mérhetjük meg vele a Földet?"
                </p>
                <p className="text-slate-400">
                  Indítsd el a gondolkodást: a műholdak nem látnak téged, csak rádiójelet sugároznak a fénysebességével!
                </p>
              </div>
            )}

            {session.currentStage === 'block1_simulation' && (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-2 text-xs text-slate-300">
                <span className="font-bold text-cyan-300">Interaktív GPS szimuláció instrukció:</span>
                <p>
                  A diákok most saját eszközeiken kipróbálják a 2, 3 és 4 műholdas esetet.
                  A feladatok automatikusan max. 3 pontot adnak, a csapatok saját tempójukban haladhatnak.
                </p>
              </div>
            )}

            {session.currentStage === 'block2_missions' && (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-2 text-xs text-slate-300">
                <span className="font-bold text-cyan-300">Terepmisszió (Google Earth/Maps/Sky):</span>
                <p>
                  A diákok új lapon nyitják meg a Google Earth/Maps felületeit a vonalzóval való valós távolságméréshez:
                  Margit híd (550–670 m), Tihanyi-félsziget (10 vs. 20–50 töréspont), Apollo-11 és Olympus Mons.
                </p>
              </div>
            )}

            {session.currentStage === 'discussion' && (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-2 text-xs text-slate-300">
                <span className="font-bold text-cyan-300">Tihanyi Megbeszélés:</span>
                <p>
                  Válts a fenti "Tihany Eredmények" fülre, és mutasd meg a diákoknak az osztálydiagramot: szinte mindenkinek hosszabb lett a partvonal a több mérőponttal!
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Tanári haladás vezérlése:
              </span>
              <button
                type="button"
                id="btn-advance-stage"
                onClick={handleNextStage}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <span>Következő szakaszra ugrás</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 10. Pontrendszer Summary Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              Órai Pontrendszer (20 pont max)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Órai munka (aktív részvétel)</span>
                <span className="font-mono font-bold text-amber-400">10 pont</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">GPS-szimuláció (2/3/4 műhold)</span>
                <span className="font-mono font-bold text-cyan-400">3 pont</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">GPS kvíz & Galileo</span>
                <span className="font-mono font-bold text-cyan-400">2 pont</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Google Earth (Margit híd + Tihany)</span>
                <span className="font-mono font-bold text-cyan-400">2 pont</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Google Sky (Apollo-11 + Mars)</span>
                <span className="font-mono font-bold text-cyan-400">2 pont</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Exit ticket / záró kvíz</span>
                <span className="font-mono font-bold text-cyan-400">1 pont</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 font-bold">
                <span>ÖSSZESEN</span>
                <span className="font-mono">20 pont</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic mt-1">
              Az órai munka 0–10 pontját a "Csapatlista" fülön manuálisan állíthatod csapatonként.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS & SCORES */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams Table */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Csapatok Állapota ({participantsList.length})
              </h3>
              <button
                type="button"
                onClick={onRefresh}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Frissítés
              </button>
            </div>

            {participantsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
                Még nem csatlakozott csapat. A belépési kód: <strong className="text-cyan-300 font-mono text-sm">{session.code}</strong>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2.5 font-semibold">Csapat / Diák</th>
                      <th className="pb-2.5 font-semibold">Státusz</th>
                      <th className="pb-2.5 font-semibold">Feladat pont</th>
                      <th className="pb-2.5 font-semibold">Órai munka (0-10)</th>
                      <th className="pb-2.5 font-semibold">Összpont</th>
                      <th className="pb-2.5 font-semibold text-right">Részletek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {participantsList.map((p) => {
                      const taskPoints = p.totalScore - (p.lessonWorkScore || 0);
                      const isSelected = p.id === selectedParticipantId;

                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-cyan-500/10' : 'hover:bg-slate-850'
                          }`}
                        >
                          <td className="py-3 font-medium text-slate-100">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  p.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                                }`}
                              />
                              <div>
                                <div className="font-bold">{p.teamName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{p.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-300">
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {p.completedTasks.length} feladat kész
                            </span>
                          </td>
                          <td className="py-3 font-mono text-cyan-400 font-bold">
                            {taskPoints} / 10
                          </td>
                          <td className="py-3">
                            {/* Lesson Work Score Stepper */}
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={p.lessonWorkScore || 0}
                                onChange={(e) => handleLessonWorkChange(p.id, Number(e.target.value))}
                                className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-400"
                              />
                              <span className="text-[11px] text-slate-400">/ 10</span>
                            </div>
                          </td>
                          <td className="py-3 font-mono text-sm font-black text-white">
                            {p.totalScore} / 20
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedParticipantId(p.id)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold transition-colors"
                            >
                              Válaszok
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Response Inspector & Score Override Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              Csapat Válaszok & Kézi Felülbírálás
            </h3>

            {selectedParticipant ? (
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-200">{selectedParticipant.teamName}</div>
                    <div className="text-[11px] text-slate-400">{selectedParticipant.studentId}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-cyan-400 text-sm">
                    {selectedParticipant.totalScore} pont
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {selectedResponses.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4 text-center">
                      Ez a csapat még nem küldött be választ.
                    </div>
                  ) : (
                    selectedResponses.map((resp) => {
                      const effectiveScore = typeof resp.teacherOverrideScore === 'number'
                        ? resp.teacherOverrideScore
                        : resp.autoScore;

                      return (
                        <div
                          key={resp.id}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-300">{resp.taskId}</span>
                            <span
                              className={`font-mono px-2 py-0.5 rounded font-bold ${
                                effectiveScore > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {effectiveScore} / {resp.maxScore} pont
                              {typeof resp.teacherOverrideScore === 'number' && ' (felülbírálva)'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded truncate">
                            {JSON.stringify(resp.rawAnswer)}
                          </div>

                          <p className="text-[11px] text-slate-300">{resp.feedback}</p>

                          {/* Quick Manual Override Controls */}
                          <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">Pont módosítása:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleManualOverride(selectedParticipant.id, resp.taskId, 0)}
                                className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold"
                              >
                                0 pt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleManualOverride(selectedParticipant.id, resp.taskId, resp.maxScore)}
                                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold"
                              >
                                {resp.maxScore} pt
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                Válassz ki egy csapatot a táblázatból a beküldött válaszok megtekintéséhez és pontfelülbíráláshoz!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DISCUSSION (TIHANY CHART) */}
      {activeTab === 'discussion' && (
        <div className="space-y-6">
          <TihanyChart session={session} isTeacher={true} />
        </div>
      )}

      {/* TAB 4: LEADERBOARD & PONTKOVETO */}
      {activeTab === 'leaderboard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Végső Ranglista & Pontszinkronizálás
              </h2>
              <p className="text-xs text-slate-400">
                Az órai pontok egy kattintással átkerülnek a Fizika Pontkövetőbe (https://fizika-pontkoveto.vercel.app/)
              </p>
            </div>

            <button
              type="button"
              id="btn-sync-pontkoveto"
              onClick={handleSyncAllToPontkoveto}
              disabled={pontkovetoSyncing || participantsList.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {pontkovetoSyncing ? 'Szinkronizálás folyamatban...' : 'Minden Pont Mentése a Pontkövetőbe'}
            </button>
          </div>

          {pontkovetoResult && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{pontkovetoResult}</span>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Helyezés</th>
                  <th className="pb-3 font-semibold">Csapatnév</th>
                  <th className="pb-3 font-semibold">Jelvények</th>
                  <th className="pb-3 font-semibold">Feladat pont</th>
                  <th className="pb-3 font-semibold">Órai munka</th>
                  <th className="pb-3 font-semibold text-right">Összesen (max 20)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {participantsList
                  .slice()
                  .sort((a, b) => b.totalScore - a.totalScore)
                  .map((p, index) => {
                    const isTop1 = index === 0 && p.totalScore > 0;
                    return (
                      <tr key={p.id} className={isTop1 ? 'bg-amber-500/10' : ''}>
                        <td className="py-3.5 font-bold font-mono text-sm">
                          {index === 0 ? '🥇 1.' : index === 1 ? '🥈 2.' : index === 2 ? '🥉 3.' : `${index + 1}.`}
                        </td>
                        <td className="py-3.5 font-bold text-slate-100">
                          {p.teamName}
                          {isTop1 && (
                            <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Kozmikus Navigátor
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.badges.length === 0 ? (
                              <span className="text-slate-500 text-[11px]">-</span>
                            ) : (
                              p.badges.map((b) => (
                                <span
                                  key={b}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                >
                                  {b}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 font-mono text-cyan-400 font-semibold">
                          {p.totalScore - (p.lessonWorkScore || 0)} / 10
                        </td>
                        <td className="py-3.5 font-mono text-amber-400 font-semibold">
                          {p.lessonWorkScore || 0} / 10
                        </td>
                        <td className="py-3.5 text-right font-mono font-black text-base text-white">
                          {p.totalScore} pt
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
