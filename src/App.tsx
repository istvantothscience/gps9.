/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SessionData, Participant } from './types/index.ts';
import { realtimeClient } from './services/socket.ts';
import { NavigationHeader } from './components/NavigationHeader.tsx';
import { TeacherDashboard } from './components/TeacherDashboard.tsx';
import { StudentApp } from './components/StudentApp.tsx';
import {
  Satellite,
  Monitor,
  Users,
  Compass,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  MapPin
} from 'lucide-react';

export default function App() {
  // Navigation: 'home' | 'tanar' | 'diak'
  const [currentView, setCurrentView] = useState<'home' | 'tanar' | 'diak'>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('tanar')) return 'tanar';
    if (path.includes('diak')) return 'diak';
    return 'home';
  });

  const [session, setSession] = useState<SessionData | null>(null);
  const [activeParticipant, setActiveParticipant] = useState<Participant | null>(null);
  const [sessionCodeInput, setSessionCodeInput] = useState<string>('MUHOLD');
  const [teamNameInput, setTeamNameInput] = useState<string>('');
  const [studentIdInput, setStudentIdInput] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync browser path with view
  const switchView = (view: 'home' | 'tanar' | 'diak') => {
    setCurrentView(view);
    const newPath = view === 'home' ? '/' : `/${view}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('tanar')) setCurrentView('tanar');
      else if (path.includes('diak')) setCurrentView('diak');
      else setCurrentView('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Subscribe to realtime session updates
  useEffect(() => {
    const targetCode = session?.code || 'MUHOLD';
    realtimeClient.subscribe(
      targetCode,
      activeParticipant?.id,
      currentView === 'tanar',
      (updatedSession) => {
        setSession(updatedSession);
        if (activeParticipant && updatedSession.participants[activeParticipant.id]) {
          setActiveParticipant(updatedSession.participants[activeParticipant.id]);
        }
      }
    );

    return () => {
      // Cleanup on code switch
    };
  }, [session?.code, activeParticipant?.id, currentView]);

  // Initial fetch for default MUHOLD session
  useEffect(() => {
    fetch('/api/sessions/MUHOLD')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.session) {
          setSession(data.session);
        }
      })
      .catch(() => {});
  }, []);

  // Teacher: Start a new session
  const handleCreateNewSession = async () => {
    setLoading(true);
    const res = await realtimeClient.createSession();
    if (res.success && res.session) {
      setSession(res.session);
      setSessionCodeInput(res.session.code);
      switchView('tanar');
    }
    setLoading(false);
  };

  // Student: Join session
  const handleJoinSession = async (customTeam?: string) => {
    const code = (sessionCodeInput || session?.code || 'MUHOLD').trim().toUpperCase();
    const team = (customTeam || teamNameInput).trim();

    if (!code) {
      setJoinError('Kérlek add meg a szobakódot!');
      return;
    }
    if (!team) {
      setJoinError('Kérlek adj meg egy csapatnevet!');
      return;
    }

    setLoading(true);
    setJoinError(null);

    const res = await realtimeClient.joinSession(
      code,
      team,
      studentIdInput.trim() || undefined
    );

    if (res.success && res.participant && res.session) {
      setSession(res.session);
      setActiveParticipant(res.participant);
      switchView('diak');
    } else {
      setJoinError(res.message || 'Nem sikerült csatlakozni a szobához.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <NavigationHeader
        currentView={currentView}
        onSelectView={switchView}
        sessionCode={session?.code}
        isSocketConnected={true}
      />

      <main className="flex-1 w-full p-4 sm:p-6 md:p-8">
        {/* VIEW 1: HOME / LANDING SELECTION */}
        {currentView === 'home' && (
          <div className="max-w-4xl mx-auto flex flex-col gap-10 py-6 sm:py-12">
            {/* Hero Header */}
            <div className="text-center flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                <Satellite className="w-3.5 h-3.5" />
                <span>90 perces dupla fizikaóra • Összevont 5–6. óra</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl leading-tight font-display">
                Műhold-küldetés: <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                  Tájékozódás égen-földön
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Interaktív digitális tanóra a GPS trilaterációs működési elvéről, atomórákról és valós Google Earth / Sky térképmérésekről, élő osztályszintű szinkronizációval és automatikus pontkövetéssel.
              </p>
            </div>

            {/* Launch Cards: Tanár vs Diák */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tanári Kártya */}
              <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 transition-all shadow-xl group">
                <div className="flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">
                    Tanári Nézet (/tanar)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Projektorra kivetíthető vezérlőpult: órai szakaszok léptetése, élő csapatlista és pontszámok, kézi pontfelülbírálás, 0–10 órai munka jegyzése és Pontkövető szinkron.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    id="btn-launch-teacher"
                    onClick={() => switchView('tanar')}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <span>Vezérlőpult Megnyitása</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    id="btn-create-session"
                    onClick={handleCreateNewSession}
                    disabled={loading}
                    className="text-xs text-slate-400 hover:text-cyan-300 transition-colors text-center py-1"
                  >
                    + Új tanórai szoba generálása
                  </button>
                </div>
              </div>

              {/* Diák Kártya */}
              <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 transition-all shadow-xl group">
                <div className="flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">
                    Diák / Csapat Nézet (/diak)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Saját eszközön (telefonon, tableten vagy laptopon): 2D GPS-trilaterációs szimuláció, Google Earth küldetések, kvízek és valós idejű XP pontgyűjtés.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    id="btn-launch-student"
                    onClick={() => switchView('diak')}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span>Belépés Diákként</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleJoinSession('Voyager Csapat')}
                    className="text-xs text-slate-400 hover:text-emerald-300 transition-colors text-center py-1"
                  >
                    ⚡ Gyors belépés tesztcsapattal (Voyager)
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Summary Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Blokk 1: Műhold-küldetés</h4>
                  <p className="text-slate-400 mt-0.5">
                    Trilateráció, 2-3-4 műhold geometriája és atomóra szinkronizáció canvas-szimuláción.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Blokk 2: Terepmisszió</h4>
                  <p className="text-slate-400 mt-0.5">
                    Margit híd, Tihanyi partvonal-paradoxon, Apollo-11 és Olympus Mons mérések.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Fizika Pontkövető</h4>
                  <p className="text-slate-400 mt-0.5">
                    Automatikus pontszámítás (max 20 pont) és integráció a Pontkövető webalkalmazással.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: TEACHER DASHBOARD */}
        {currentView === 'tanar' && session && (
          <TeacherDashboard
            session={session}
            onRefresh={async () => {
              const res = await fetch(`/api/sessions/${session.code}`);
              const data = await res.json();
              if (data.success && data.session) setSession(data.session);
            }}
          />
        )}

        {/* VIEW 3: STUDENT VIEW */}
        {currentView === 'diak' && (
          <>
            {!activeParticipant ? (
              // Student Join Form
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 my-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">Csatlakozás a Küldetéshez</h2>
                    <p className="text-xs text-slate-400">Add meg a kivetített kódot és csapatnevet</p>
                  </div>
                </div>

                {joinError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                    {joinError}
                  </div>
                )}

                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Szobakód (Kivetítőn látható):
                    </label>
                    <input
                      type="text"
                      id="input-session-code"
                      value={sessionCodeInput}
                      onChange={(e) => setSessionCodeInput(e.target.value.toUpperCase())}
                      placeholder="Pl. MUHOLD"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-cyan-400 tracking-wider focus:outline-none focus:border-cyan-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Csapatnév vagy Diák neve:
                    </label>
                    <input
                      type="text"
                      id="input-team-name"
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      placeholder="Pl. Hubble Felfedezők"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      Diák azonosító (opcionális):
                    </label>
                    <input
                      type="text"
                      id="input-student-id"
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value)}
                      placeholder="Pl. DIAK-103"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    id="btn-join-session"
                    disabled={loading}
                    onClick={() => handleJoinSession()}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <span>Csatlakozás a Küldetéshez</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleJoinSession('Voyager Csapat')}
                    className="text-xs text-slate-400 hover:text-cyan-300 py-1 transition-colors text-center"
                  >
                    ⚡ Gyors csatlakozás mintacsapattal (Voyager)
                  </button>
                </div>
              </div>
            ) : (
              // Connected Student App
              session && <StudentApp session={session} participant={activeParticipant} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
