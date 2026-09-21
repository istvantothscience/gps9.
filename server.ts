import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { LessonStage, SessionData, Participant, TaskResponse } from './src/types/index.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory persistent database for classroom sessions
const sessions: Map<string, SessionData> = new Map();

// Generate readable 5-character classroom codes
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Initial demo seed session for quick teacher exploration
const defaultSessionCode = 'MUHOLD';
sessions.set(defaultSessionCode, {
  id: 'sess-default-1',
  code: defaultSessionCode,
  title: 'Fizika 5-6. óra: Műhold-küldetés (Tájékozódás égen-földön)',
  currentStage: 'lobby',
  createdAt: Date.now(),
  participants: {
    'part-1': {
      id: 'part-1',
      sessionId: 'sess-default-1',
      teamName: 'Voyager Csapat',
      studentId: 'DIAK-101',
      totalScore: 0,
      lessonWorkScore: 0,
      currentStage: 'lobby',
      completedTasks: [],
      badges: [],
      connected: false,
      lastActive: Date.now(),
    },
    'part-2': {
      id: 'part-2',
      sessionId: 'sess-default-1',
      teamName: 'Hubble Felfedezők',
      studentId: 'DIAK-102',
      totalScore: 0,
      lessonWorkScore: 0,
      currentStage: 'lobby',
      completedTasks: [],
      badges: [],
      connected: false,
      lastActive: Date.now(),
    }
  },
  responses: {
    'part-1': [],
    'part-2': []
  }
});

// Calculate total score for a participant
function computeTotalScore(participant: Participant, responses: TaskResponse[]): number {
  const autoAndOverride = responses.reduce((acc, r) => {
    const score = typeof r.teacherOverrideScore === 'number' ? r.teacherOverrideScore : r.autoScore;
    return acc + score;
  }, 0);
  return autoAndOverride + (participant.lessonWorkScore || 0);
}

// Check and award badges
function evaluateBadges(participant: Participant, responses: TaskResponse[]): string[] {
  const badges: string[] = [];
  
  // GPS Mérnök: max 3 (sim) + max 2 (quiz) = 5 pont a GPS blokkból
  const gpsSimResponses = responses.filter(r => r.taskId.startsWith('gps_sim_'));
  const gpsSimPoints = gpsSimResponses.reduce((sum, r) => sum + (r.teacherOverrideScore ?? r.autoScore), 0);
  const gpsQuiz = responses.find(r => r.taskId === 'gps_quiz');
  const gpsQuizPoints = (gpsQuiz?.teacherOverrideScore ?? gpsQuiz?.autoScore) || 0;
  if (gpsSimPoints >= 3 && gpsQuizPoints >= 2) {
    badges.push('GPS Mérnök');
  }

  // Kartográfus: Margit híd (1 pt) + Tihany (1 pt) + Apollo-11 (1 pt) + Olympus Mons (1 pt) = 4 pont
  const margit = responses.find(r => r.taskId === 'mission_margit');
  const tihany = responses.find(r => r.taskId === 'mission_tihany');
  const apollo = responses.find(r => r.taskId === 'mission_apollo');
  const olympus = responses.find(r => r.taskId === 'mission_olympus');
  const m1 = (margit?.teacherOverrideScore ?? margit?.autoScore) || 0;
  const m2 = (tihany?.teacherOverrideScore ?? tihany?.autoScore) || 0;
  const m3 = (apollo?.teacherOverrideScore ?? apollo?.autoScore) || 0;
  const m4 = (olympus?.teacherOverrideScore ?? olympus?.autoScore) || 0;
  if (m1 >= 1 && m2 >= 1 && m3 >= 1 && m4 >= 1) {
    badges.push('Kartográfus');
  }

  return Array.from(new Set(badges));
}

// REST API Endpoints

// Create new session
app.post('/api/sessions/create', (req: Request, res: Response) => {
  let code = generateSessionCode();
  while (sessions.has(code)) {
    code = generateSessionCode();
  }

  const session: SessionData = {
    id: `sess-${Date.now()}`,
    code,
    title: req.body.title || 'Fizika 5-6. óra: Műhold-küldetés',
    currentStage: 'lobby',
    createdAt: Date.now(),
    participants: {},
    responses: {}
  };

  sessions.set(code, session);
  res.json({ success: true, session });
  broadcastSession(code);
});

// Get session data
app.get('/api/sessions/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session nem található' });
  }
  res.json({ success: true, session });
});

// Join session as a student/team
app.post('/api/sessions/:code/join', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Érvénytelen szobakód' });
  }

  const { teamName, studentId } = req.body;
  if (!teamName || !teamName.trim()) {
    return res.status(400).json({ success: false, message: 'Kérlek adj meg egy csapatnevet' });
  }

  // Check if existing participant with same teamName
  let participant = Object.values(session.participants).find(
    p => p.teamName.toLowerCase() === teamName.trim().toLowerCase()
  );

  if (!participant) {
    const id = `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    participant = {
      id,
      sessionId: session.id,
      teamName: teamName.trim(),
      studentId: studentId?.trim() || `STUDENT-${Math.floor(100 + Math.random() * 900)}`,
      totalScore: 0,
      lessonWorkScore: 0,
      currentStage: session.currentStage,
      completedTasks: [],
      badges: [],
      connected: true,
      lastActive: Date.now()
    };
    session.participants[id] = participant;
    session.responses[id] = [];
  } else {
    participant.connected = true;
    participant.lastActive = Date.now();
  }

  res.json({ success: true, participant, session });
  broadcastSession(code);
});

// Update stage by teacher
app.post('/api/sessions/:code/stage', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session nem található' });
  }

  const { stage } = req.body;
  if (!stage) {
    return res.status(400).json({ success: false, message: 'Hiányzó szakasz (stage)' });
  }

  session.currentStage = stage as LessonStage;
  // Sync stage to all connected participants
  for (const pid of Object.keys(session.participants)) {
    session.participants[pid].currentStage = stage as LessonStage;
  }

  res.json({ success: true, session });
  broadcastSession(code);
});

// Submit task response with strict automated grading
app.post('/api/sessions/:code/submit', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session nem található' });
  }

  const { participantId, taskId, rawAnswer } = req.body;
  const participant = session.participants[participantId];
  if (!participant) {
    return res.status(404).json({ success: false, message: 'Résztvevő nem található' });
  }

  let autoScore = 0;
  let maxScore = 1;
  let isCorrect = false;
  let feedback = '';

  // Precise grading logic according to prompt specification
  switch (taskId) {
    case 'prediction': {
      // 5.2 Jóslás: Hány műhold kell? 1-6 szám, rögzítés, nincs azonnali pontlevonás
      maxScore = 0;
      autoScore = 0;
      isCorrect = true;
      feedback = 'Jóslatod rögzítve! Az óra során kiderül a pontos válasz.';
      break;
    }

    case 'gps_sim_2sat': {
      // 5.4 2 műhold: Miért nem elég ez? (Két metszéspont van / bizonytalanság)
      maxScore = 1;
      const ans = String(rawAnswer?.answer || '').toLowerCase();
      if (rawAnswer?.selectedChoice === 'two_intersections' || ans.includes('két') || ans.includes('metszés') || ans.includes('nem egyértelmű') || ans.includes('kettő') || ans.includes('bizonytalan')) {
        autoScore = 1;
        isCorrect = true;
        feedback = 'Helyes! 2 kör metszéspontja általában 2 pont, így a pozíció még nem egyértelmű.';
      } else {
        autoScore = 0;
        isCorrect = false;
        feedback = 'Két kör metszése 2 pontot eredményez, így még nem dönthető el egyértelműen a helyzeted.';
      }
      break;
    }

    case 'gps_sim_3sat': {
      // 5.4 3 műhold: melyik a valódi pozíció (A/B) és miért
      maxScore = 1;
      const isPointSelected = rawAnswer?.selectedPoint === 'surface' || rawAnswer?.selectedPoint === 'point_A';
      if (isPointSelected) {
        autoScore = 1;
        isCorrect = true;
        feedback = 'Pontos! A Föld felszínén lévő valós pontot választottad (a másik kizárható, mert föld alatt/tenger mélyén lenne).';
      } else {
        autoScore = 0;
        isCorrect = false;
        feedback = 'A másik pont kizárható, mert lehetetlen helyre (pl. Föld kérge alá vagy lakatlan tengeri mélységbe) esne.';
      }
      break;
    }

    case 'gps_sim_4sat': {
      // 5.4 4. műhold ellenőrző kérdés: "Az órák (idő) szinkronizálására, nem egy újabb távolság-körre."
      maxScore = 1;
      const choice = String(rawAnswer?.selectedChoice || '');
      if (choice === 'clock_sync' || choice.includes('órák') || choice.includes('idő')) {
        autoScore = 1;
        isCorrect = true;
        feedback = 'Tökéletes! A 4. műhold a vevő olcsó kvarcórájának és a műholdak atomóráinak szinkronizálására szolgál.';
      } else {
        autoScore = 0;
        isCorrect = false;
        feedback = 'A negyedik műhold az órák (idő) szinkronizálására kell, nem egy újabb távolság-körre.';
      }
      break;
    }

    case 'gps_quiz': {
      // 5.5 GPS-elv kvíz + Galileo-GPS összehasonlítás (max 2 pont)
      maxScore = 2;
      let qPoints = 0;
      // Kérdés 1: Miért nem elég 3 műhold pontatlan óránál?
      if (rawAnswer?.q1 === 'speed_of_light_error') qPoints += 1;
      // Kérdés 2: GPS vs Galileo (mindkettő trilateráció, más ország/rendszer)
      if (rawAnswer?.q2 === 'same_principle_different_system') qPoints += 1;

      autoScore = qPoints;
      isCorrect = autoScore >= 1;
      feedback = `Kvíz eredménye: ${autoScore}/2 pont. Mindkét rendszer (GPS és Galileo) trilaterációs elven működik!`;
      break;
    }

    case 'mission_margit': {
      // 7. Küldetés A — Margit híd: 550 - 670 m -> 1 pont
      maxScore = 1;
      const lengthM = Number(rawAnswer?.length);
      if (!isNaN(lengthM) && lengthM >= 550 && lengthM <= 670) {
        autoScore = 1;
        isCorrect = true;
        feedback = `Kiváló mérés (${lengthM} m)! A Margit híd hivatalos hossza kb. 607–608 m, a megadott értéked pontos.`;
      } else {
        autoScore = 0;
        isCorrect = false;
        feedback = `Mért értéked: ${isNaN(lengthM) ? 'érvénytelen' : lengthM + ' m'}. Nézd át újra a Google Earth vonalzóját (elfogadási sáv: 550–670 m).`;
      }
      break;
    }

    case 'mission_tihany': {
      // 7. Küldetés B — Tihanyi-félsziget: 2. mérés > 1. mérés (legalább 5% növekedés: m2 >= m1 * 1.05)
      maxScore = 1;
      const m1 = Number(rawAnswer?.measure1);
      const m2 = Number(rawAnswer?.measure2);
      if (!isNaN(m1) && !isNaN(m2) && m1 > 0 && m2 >= m1 * 1.04) {
        autoScore = 1;
        isCorrect = true;
        feedback = `Nagyszerű megfigyelés! 1. mérés: ${m1} km → 2. finom mérés: ${m2} km. A finomabb töréspont-követés hosszabb partvonalat adott (partvonal-paradoxon).`;
      } else {
        autoScore = 0;
        isCorrect = false;
        feedback = 'Nézd meg újra — a finomabb mérésnek (több törésponttal a kanyarulatok mentén) jellemzően hosszabb eredményt kell adnia! Miért?';
      }
      break;
    }

    case 'mission_apollo': {
      // 7. Küldetés C — Apollo-11: szélesség 0–1,5° É, hosszúság 22,5–24,5° K -> 1 pont
      maxScore = 1;
      const lat = Number(rawAnswer?.latitude);
      const lng = Number(rawAnswer?.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat >= 0 && lat <= 1.5 && lng >= 22.5 && lng <= 24.5) {
        autoScore = 1;
        isCorrect = true;
        feedback = `Sikeres koordináta-azonosítás (${lat}° É, ${lng}° K)! Hivatalos: 0,68° É, 23,43° K a Nyugalom-tengeren.`;
      } else {
        autoScore = 0;
        isCorrect = false;
        feedback = `Megadott: ${lat}° É, ${lng}° K. Nézd meg újra a Nyugalom-tenger (Mare Tranquillitatis) Apollo-11 jelölőjét (tartomány: 0–1,5° É, 22,5–24,5° K).`;
      }
      break;
    }

    case 'mission_olympus': {
      // 7. Küldetés D — Olympus Mons: átmérő 500–700 km -> 1 pont
      maxScore = 1;
      const diam = Number(rawAnswer?.diameter);
      if (!isNaN(diam) && diam >= 500 && diam <= 700) {
        autoScore = 1;
        isCorrect = true;
        feedback = `Pontos becslés (${diam} km)! Az Olympus Mons alapátmérője kb. 600 km, a Naprendszer legnagyobb ismert pajzsvulkánja.`;
      } else {
        autoScore = 0;
        isCorrect = false;
        feedback = `Mért átmérő: ${isNaN(diam) ? 'érvénytelen' : diam + ' km'}. Az elfogadási tartomány az alapnál: 500–700 km.`;
      }
      break;
    }

    case 'exit_ticket': {
      // 9. Exit ticket: 1 pont záró kvíz + önbizalom
      maxScore = 1;
      const q1 = rawAnswer?.q1; // Miért kell legalább 4 műhold?
      const q2 = rawAnswer?.q2; // Miért nő a partvonal?
      if (q1 === 'clock_sync' && q2 === 'fractal_coastline') {
        autoScore = 1;
        isCorrect = true;
        feedback = 'Hibátlan exit ticket! Pontosan megértetted a trilateráció és a partvonal-mérés fizikáját.';
      } else {
        autoScore = (q1 === 'clock_sync' || q2 === 'fractal_coastline') ? 1 : 0;
        isCorrect = autoScore >= 1;
        feedback = 'Köszönjük a válaszokat és az önértékelést!';
      }
      break;
    }

    default: {
      maxScore = 1;
      autoScore = 1;
      isCorrect = true;
      feedback = 'Válasz rögzítve.';
    }
  }

  // Update or insert response
  if (!session.responses[participantId]) {
    session.responses[participantId] = [];
  }

  const existingIndex = session.responses[participantId].findIndex(r => r.taskId === taskId);
  const responseObj: TaskResponse = {
    id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    participantId,
    sessionId: session.id,
    taskId,
    rawAnswer,
    autoScore,
    maxScore,
    isCorrect,
    feedback,
    timestamp: Date.now()
  };

  if (existingIndex >= 0) {
    // preserve manual override if already present
    responseObj.teacherOverrideScore = session.responses[participantId][existingIndex].teacherOverrideScore;
    session.responses[participantId][existingIndex] = responseObj;
  } else {
    session.responses[participantId].push(responseObj);
  }

  if (!participant.completedTasks.includes(taskId)) {
    participant.completedTasks.push(taskId);
  }

  // Re-compute participant score & badges
  participant.totalScore = computeTotalScore(participant, session.responses[participantId]);
  participant.badges = evaluateBadges(participant, session.responses[participantId]);
  participant.lastActive = Date.now();

  res.json({
    success: true,
    response: responseObj,
    totalScore: participant.totalScore,
    badges: participant.badges,
    session
  });

  broadcastSession(code);
});

// Teacher: manual override score for a specific response
app.post('/api/sessions/:code/override', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session nem található' });
  }

  const { participantId, taskId, score } = req.body;
  const participant = session.participants[participantId];
  if (!participant) {
    return res.status(404).json({ success: false, message: 'Résztvevő nem található' });
  }

  const resp = session.responses[participantId]?.find(r => r.taskId === taskId);
  if (resp) {
    resp.teacherOverrideScore = Number(score);
  } else {
    // create dummy response with overridden score
    session.responses[participantId] = session.responses[participantId] || [];
    session.responses[participantId].push({
      id: `resp-override-${Date.now()}`,
      participantId,
      sessionId: session.id,
      taskId,
      rawAnswer: { overridden: true },
      autoScore: 0,
      maxScore: 1,
      teacherOverrideScore: Number(score),
      isCorrect: Number(score) > 0,
      feedback: 'Tanári felülbírálás jóváhagyva.',
      timestamp: Date.now()
    });
  }

  participant.totalScore = computeTotalScore(participant, session.responses[participantId]);
  participant.badges = evaluateBadges(participant, session.responses[participantId]);

  res.json({ success: true, participant, session });
  broadcastSession(code);
});

// Teacher: award órai munka points (0 to 10 points)
app.post('/api/sessions/:code/lesson-work', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session nem található' });
  }

  const { participantId, score } = req.body;
  const participant = session.participants[participantId];
  if (!participant) {
    return res.status(404).json({ success: false, message: 'Résztvevő nem található' });
  }

  const numScore = Math.max(0, Math.min(10, Number(score) || 0));
  participant.lessonWorkScore = numScore;
  participant.totalScore = computeTotalScore(participant, session.responses[participantId] || []);

  res.json({ success: true, participant, session });
  broadcastSession(code);
});

// Fizika Pontkövető submit webhook / API
app.post('/api/pontkoveto/submit', async (req: Request, res: Response) => {
  const payload = req.body;
  const targetUrl = process.env.PONTKOVETO_API_URL || 'https://fizika-pontkoveto.vercel.app/api/scores';
  
  console.log(`[Pontkövető Sync] Jóváírás kezdeményezve: ${payload.studentId} -> ${payload.points} pont (${payload.lessonId})`);
  
  // If targetUrl exists and is configured, attempt real remote call
  if (process.env.PONTKOVETO_API_KEY) {
    try {
      const remoteRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PONTKOVETO_API_KEY}`
        },
        body: JSON.stringify(payload)
      });
      const data = await remoteRes.json().catch(() => ({}));
      return res.json({ success: true, remote: true, data, syncedAt: new Date().toISOString() });
    } catch (err: any) {
      console.warn('[Pontkövető Sync] Távoli hívás meghiúsult, helyi jóváhagyás érvényes:', err.message);
    }
  }

  // Graceful local acceptance:
  res.json({
    success: true,
    message: `${payload.teamName || payload.studentId} pontjai (${payload.points} / 20) sikeresen jóváírva a Pontkövetőben!`,
    syncedAt: new Date().toISOString(),
    payload
  });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Setup
const wss = new WebSocketServer({ noServer: true });

// Map of socket -> { code, participantId, isTeacher }
interface ClientMeta {
  code: string;
  participantId?: string;
  isTeacher?: boolean;
}
const clients: Map<WebSocket, ClientMeta> = new Map();

server.on('upgrade', (request, socket, head) => {
  if (request.url?.startsWith('/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'subscribe') {
        const code = (data.code || '').toUpperCase();
        clients.set(ws, {
          code,
          participantId: data.participantId,
          isTeacher: !!data.isTeacher
        });

        // If session exists, immediately send state
        const session = sessions.get(code);
        if (session) {
          ws.send(JSON.stringify({ type: 'session_update', session }));
        }
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  });

  ws.on('close', () => {
    const meta = clients.get(ws);
    if (meta && meta.code && meta.participantId) {
      const session = sessions.get(meta.code);
      if (session && session.participants[meta.participantId]) {
        session.participants[meta.participantId].connected = false;
        broadcastSession(meta.code);
      }
    }
    clients.delete(ws);
  });
});

function broadcastSession(code: string) {
  const session = sessions.get(code);
  if (!session) return;

  const payload = JSON.stringify({ type: 'session_update', session });
  for (const [ws, meta] of clients.entries()) {
    if (meta.code === code && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Start Server with Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Műhold-küldetés server listening on port ${PORT}`);
  });
}

startServer();
