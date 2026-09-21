/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SessionData, Participant } from './types/index.ts';
import { realtimeClient } from './services/socket.ts';
import { NavigationHeader, MainViewType } from './components/NavigationHeader.tsx';
import { PresentationDeck } from './components/PresentationDeck.tsx';
import { StudentApp } from './components/StudentApp.tsx';
import { TeacherDashboard } from './components/TeacherDashboard.tsx';

// Helper to get or create stored participant
function getStoredParticipant(): Participant {
  try {
    const saved = localStorage.getItem('muhold_active_participant');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }

  // Create default participant without login prompt
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const defaultParticipant: Participant = {
    id: `student_${Date.now()}_${randomSuffix}`,
    sessionId: 'MUHOLD',
    teamName: `Voyager Csapat #${randomSuffix}`,
    studentId: `DIAK-${randomSuffix}`,
    totalScore: 0,
    lessonWorkScore: 0,
    completedTasks: [],
    badges: [],
    connected: true,
    lastActive: Date.now(),
  };

  try {
    localStorage.setItem('muhold_active_participant', JSON.stringify(defaultParticipant));
  } catch {
    // ignore
  }

  return defaultParticipant;
}

export default function App() {
  // Navigation: 'ppt' | 'jatek' | 'tanar' - default directly to PPT or Játékok (zero login!)
  const [currentView, setCurrentView] = useState<MainViewType>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('tanar')) return 'tanar';
    if (path.includes('jatek') || path.includes('diak')) return 'jatek';
    return 'ppt';
  });

  const [activeGameTab, setActiveGameTab] = useState<string>('sim');
  const [session, setSession] = useState<SessionData | null>(null);
  const [activeParticipant, setActiveParticipant] = useState<Participant>(getStoredParticipant);

  // Sync browser path with view
  const switchView = (view: MainViewType) => {
    setCurrentView(view);
    const newPath = view === 'ppt' ? '/' : `/${view}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('tanar')) setCurrentView('tanar');
      else if (path.includes('jatek') || path.includes('diak')) setCurrentView('jatek');
      else setCurrentView('ppt');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-connect and join default MUHOLD session in the background silently
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await fetch('/api/sessions/MUHOLD');
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);

          // If participant not yet registered on server, register silently
          if (!data.session.participants[activeParticipant.id]) {
            const joinRes = await realtimeClient.joinSession(
              'MUHOLD',
              activeParticipant.teamName,
              activeParticipant.studentId
            );
            if (joinRes.success && joinRes.participant) {
              setActiveParticipant(joinRes.participant);
              localStorage.setItem('muhold_active_participant', JSON.stringify(joinRes.participant));
            }
          } else {
            setActiveParticipant(data.session.participants[activeParticipant.id]);
          }
        }
      } catch (err) {
        console.warn('Initial session sync failed, will retry via socket', err);
      }
    };

    initSession();
  }, [activeParticipant.id, activeParticipant.studentId, activeParticipant.teamName]);

  // Subscribe to realtime session updates
  useEffect(() => {
    const targetCode = session?.code || 'MUHOLD';
    realtimeClient.subscribe(
      targetCode,
      activeParticipant.id,
      currentView === 'tanar',
      (updatedSession) => {
        setSession(updatedSession);
        if (updatedSession.participants[activeParticipant.id]) {
          setActiveParticipant(updatedSession.participants[activeParticipant.id]);
          try {
            localStorage.setItem(
              'muhold_active_participant',
              JSON.stringify(updatedSession.participants[activeParticipant.id])
            );
          } catch {
            // ignore
          }
        }
      }
    );
  }, [session?.code, activeParticipant.id, currentView]);

  // Handle participant name update from inline edit
  const handleUpdateParticipantName = async (newName: string) => {
    const updated = { ...activeParticipant, teamName: newName };
    setActiveParticipant(updated);
    try {
      localStorage.setItem('muhold_active_participant', JSON.stringify(updated));
    } catch {
      // ignore
    }
    // Update on server
    await realtimeClient.joinSession('MUHOLD', newName, activeParticipant.studentId);
  };

  // Fallback dummy session if server is loading
  const effectiveSession: SessionData = session || {
    id: 'muhold_default',
    code: 'MUHOLD',
    title: 'Műhold-küldetés: 5–6. Összevont Fizikaóra',
    currentStage: 'block1_simulation',
    createdAt: Date.now(),
    participants: { [activeParticipant.id]: activeParticipant },
    responses: {},
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <NavigationHeader
        currentView={currentView}
        onSelectView={switchView}
        sessionCode={effectiveSession.code}
        isSocketConnected={true}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {/* VIEW 1: PREZENTÁCIÓ (PPT) */}
        {currentView === 'ppt' && (
          <PresentationDeck
            onGoToGame={(gameId) => {
              if (gameId) setActiveGameTab(gameId);
              switchView('jatek');
            }}
          />
        )}

        {/* VIEW 2: JÁTÉKOK & SZIMULÁCIÓK */}
        {currentView === 'jatek' && (
          <StudentApp
            session={effectiveSession}
            participant={activeParticipant}
            activeGameTab={activeGameTab}
            onSelectGameTab={setActiveGameTab}
            onOpenPresentation={() => switchView('ppt')}
            onUpdateParticipantName={handleUpdateParticipantName}
          />
        )}

        {/* VIEW 3: TANÁRI KIVETÍTŐ & VEZÉRLŐPULT */}
        {currentView === 'tanar' && (
          <TeacherDashboard
            session={effectiveSession}
            onRefresh={async () => {
              const res = await fetch(`/api/sessions/${effectiveSession.code}`);
              const data = await res.json();
              if (data.success && data.session) setSession(data.session);
            }}
          />
        )}
      </main>
    </div>
  );
}
