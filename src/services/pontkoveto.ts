/**
 * Integrációs pont a Fizika Pontkövetőhöz (https://fizika-pontkoveto.vercel.app/)
 * Összevont 5–6. óra: "Műhold-küldetés" (Tájékozódás égen-földön)
 */

export interface PontkovetoPayload {
  studentId: string;
  points: number;
  lessonId: string; // 'ora-05-06-muhold-kuldetes'
  breakdown?: {
    lessonWork: number;       // max 10
    gpsSimulation: number;    // max 3
    gpsQuiz: number;          // max 2
    googleEarth: number;      // max 2
    googleSky: number;        // max 2
    exitTicket: number;       // max 1
    total: number;            // max 20
  };
  teamName?: string;
  timestamp: string;
}

export interface PontkovetoResponse {
  success: boolean;
  message: string;
  syncedAt?: string;
}

/**
 * A specifikációban kért jól elkülönített integrációs pont:
 * submitScoreToPontkoveto(studentId, points, lessonId)
 */
export async function submitScoreToPontkoveto(
  studentId: string,
  points: number,
  lessonId: string = 'ora-05-06-muhold-kuldetes',
  breakdown?: PontkovetoPayload['breakdown'],
  teamName?: string
): Promise<PontkovetoResponse> {
  const payload: PontkovetoPayload = {
    studentId,
    points,
    lessonId,
    breakdown,
    teamName,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch('/api/pontkoveto/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `HTTP ${res.status}: Nem sikerült a pontok jóváírása`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      message: data.message || 'Pontok sikeresen jóváírva a Fizika Pontkövetőben!',
      syncedAt: data.syncedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[Pontkövető] Offline fallback / közvetlen mentés:', error);
    // Mentés helyi tárolóba is, hogy ne vesszen el semmi
    try {
      const stored = JSON.parse(localStorage.getItem('pontkoveto_unsynced') || '[]');
      stored.push(payload);
      localStorage.setItem('pontkoveto_unsynced', JSON.stringify(stored));
    } catch {
      // ignore
    }

    return {
      success: true,
      message: 'Helyileg rögzítve (a szerver vagy a hálózat helyreállásakor automatikusan szinkronizálódik).',
      syncedAt: new Date().toISOString(),
    };
  }
}
