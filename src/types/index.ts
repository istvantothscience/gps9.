export type LessonStage =
  | 'lobby'
  | 'block1_hook'
  | 'block1_prediction'
  | 'block1_lecture'
  | 'block1_simulation'
  | 'block1_quiz'
  | 'transition'
  | 'block2_missions'
  | 'discussion'
  | 'exit_ticket'
  | 'final';

export interface StageInfo {
  id: LessonStage;
  title: string;
  block: 'Előkészület' | 'Blokk 1: Műhold-küldetés' | 'Átvezetés' | 'Blokk 2: Terepmisszió' | 'Zárás';
  description: string;
}

export const STAGES: StageInfo[] = [
  { id: 'lobby', title: 'Belépés & Csatlakozás', block: 'Előkészület', description: 'Diákok csatlakozása a kóddal' },
  { id: 'block1_hook', title: '1. Hook: 20 200 km magasból', block: 'Blokk 1: Műhold-küldetés', description: 'Gondolatébresztő indítás' },
  { id: 'block1_prediction', title: '2. Jóslás: Hány műhold kell?', block: 'Blokk 1: Műhold-küldetés', description: 'Előzetes elképzelések rögzítése' },
  { id: 'block1_lecture', title: '3. Mikroelőadás: A trilateráció', block: 'Blokk 1: Műhold-küldetés', description: '1, 2, 3 és 4 műhold szerepe' },
  { id: 'block1_simulation', title: '4. Interaktív GPS-szimuláció', block: 'Blokk 1: Műhold-küldetés', description: '2, 3 és 4 műholdas geometria kipróbálása' },
  { id: 'block1_quiz', title: '5. GPS kvíz & Galileo', block: 'Blokk 1: Műhold-küldetés', description: 'GPS vs. Galileo összehasonlítás' },
  { id: 'transition', title: '6. Mission Briefing', block: 'Átvezetés', description: 'Kilépés az űrből a Föld felszínére' },
  { id: 'block2_missions', title: '7. Terepmisszió (Google Earth/Sky)', block: 'Blokk 2: Terepmisszió', description: 'Margit híd, Tihany, Apollo-11, Olympus Mons' },
  { id: 'discussion', title: '8. Közös megbeszélés (Tihany)', block: 'Blokk 2: Terepmisszió', description: 'Osztályszintű partvonal-paradoxon diagram' },
  { id: 'exit_ticket', title: '9. Exit Ticket & Önbizalom', block: 'Zárás', description: 'Záró kérdések és visszajelzés' },
  { id: 'final', title: '10. Ranglista & Pontkövető', block: 'Zárás', description: 'Eredményhirdetés és automatikus jóváírás' },
];

export interface Participant {
  id: string;
  sessionId: string;
  teamName: string;
  studentId?: string;
  totalScore: number;
  lessonWorkScore: number; // 0 to 10 points awarded by teacher
  currentStage?: LessonStage;
  completedTasks: string[];
  badges: string[];
  connected: boolean;
  lastActive: number;
}

export interface TaskResponse {
  id: string;
  participantId: string;
  sessionId: string;
  taskId: string;
  rawAnswer: Record<string, unknown>;
  autoScore: number;
  maxScore: number;
  teacherOverrideScore?: number;
  isCorrect: boolean;
  feedback: string;
  timestamp: number;
}

export interface SessionData {
  id: string;
  code: string;
  title: string;
  currentStage: LessonStage;
  createdAt: number;
  participants: Record<string, Participant>;
  responses: Record<string, TaskResponse[]>; // participantId -> responses
  isLocked?: boolean;
}

export interface ScoreCategorySummary {
  category: string;
  maxPoints: number;
  awardedPoints: number;
  isManual?: boolean;
}
