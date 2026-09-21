import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Compass,
  Clock,
  Radio,
  Layers,
  Globe2,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  CheckCircle2,
  Info,
  Zap,
  ArrowRight
} from 'lucide-react';

interface PresentationDeckProps {
  onGoToGame?: (gameId?: string) => void;
}

interface Slide {
  id: number;
  title: string;
  badge: string;
  category: string;
  summary: string;
  bullets: { title: string; desc: string; icon?: string }[];
  highlightBox?: {
    type: 'formula' | 'fact' | 'quote' | 'question';
    title: string;
    text: string;
  };
  visualType: 'sat1' | 'sat2' | 'sat3' | 'atomclock' | 'galileo' | 'coastline' | 'globe' | 'missions' | 'intro' | 'timeerror';
  suggestedAction?: {
    label: string;
    gameId: string;
  };
}

export const PresentationDeck: React.FC<PresentationDeckProps> = ({ onGoToGame }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);

  const slides: Slide[] = [
    {
      id: 1,
      badge: '5–6. Összevont Fizikaóra',
      category: 'Bevezetés & Indítás',
      title: 'Tájékozódás égen-földön: A műholdak szeme és a kozmikus navigáció',
      summary: 'Hogyan tudja a telefonod a másodperc törtrésze alatt, hogy pontosan a Margit híd melyik padján ülsz — egy 20 200 km magasban keringő fémdoboz segítségével?',
      bullets: [
        {
          title: 'Lát vagy fényképez minket a GPS?',
          desc: 'Gyakori tévhit! A GPS műholdak nem néznek ránk kamerákkal, és nem látják a telefonodat. Csupán vak rádiójeleket sugároznak a Föld felé folyamatosan.',
        },
        {
          title: '24–32 műhold kozmikus hálózata',
          desc: 'A Föld körül 6 pályasíkon, 55 fokos dőlésszögben keringő műholdflotta biztosítja, hogy a Föld szinte bármely pontjáról egyszerre legalább 4–8 műhold „látható” legyen az égbolton.',
        },
        {
          title: 'A mai óra küldetése',
          desc: 'Megértjük a GPS trilaterációs geometriáját, az atomórák szerepét, és Google Earth / Sky segítségével valós mérési küldetéseket hajtunk végre!',
        },
      ],
      highlightBox: {
        type: 'question',
        title: 'Gondolatébresztő kérdés',
        text: 'Ha a műhold nem lát téged, és nem is küldesz neki vissza semmilyen jelet, honnan tudja a telefonod mégis centiméteres pontossággal a helyzeted?',
      },
      visualType: 'intro',
      suggestedAction: {
        label: 'Tippelj a műholdak számára! (Jóslás)',
        gameId: 'quiz',
      },
    },
    {
      id: 2,
      badge: 'Fizikai Alapelv',
      category: 'A Mérés Fizikája',
      title: 'A távolságmérés titka: Rádióhullámok & Fénysebesség',
      summary: 'A GPS helymeghatározás nem szögmérésen, hanem pusztán rendkívül precíz időmérésen és a fénysebességen alapul.',
      bullets: [
        {
          title: 'Fénysebesség vákuumban és légkörben',
          desc: 'A rádióhullámok elektromágneses hullámok, amelyek vákuumban pontosan c = 299 792 458 m/s (~300 000 km/s) sebességgel terjednek.',
        },
        {
          title: 'A futásidő kiszámítása',
          desc: 'A műhold 20 200 km magasan van. Egy rádiójel a zsebedbe átlagosan t = d / c ≈ 20 200 000 m / 300 000 000 m/s ≈ 0,067 másodperc (kb. 67-70 milliszekundum) alatt ér le!',
        },
        {
          title: 'A távolság meghatározása',
          desc: 'A műhold elküldi az adás pontos pillanatát: t_adás. A telefon megméri az érkezés pillanatát: t_vétel. A távolság: d = c · (t_vétel - t_adás).',
        },
      ],
      highlightBox: {
        type: 'formula',
        title: 'Alapvető fizikai összefüggés',
        text: 'd = c · Δt  |  ahol c = 3·10⁸ m/s, Δt = futási időkülönbség',
      },
      visualType: 'globe',
      suggestedAction: {
        label: 'Próbáld ki a GPS Szimulátort!',
        gameId: 'sim',
      },
    },
    {
      id: 3,
      badge: '1. Geometriai Lépés',
      category: 'Trilateráció: 1 Műhold',
      title: 'Egyetlen Műhold: A gömbfelület a térben (2D-ben egy kör)',
      summary: 'Ha pontosan ismered a távolságodat egyetlen műholdtól, vajon megtaláltad-e a tartózkodási helyedet?',
      bullets: [
        {
          title: 'A térbeli mértani hely',
          desc: 'Egyetlen ponttól (a műholdtól) adott d₁ távolságra lévő pontok összessége a 3 dimenziós térben egy d₁ sugarú GÖM詳細はfelszín.',
        },
        {
          title: 'Síkban leegyszerűsítve (2D)',
          desc: 'A térképen vagy metszetben ez egy kör. A Föld bármely pontján lehetsz, ahol ez a gömb metszi a felszínt — ez több ezer kilométer hosszú körív!',
        },
        {
          title: 'Mi hiányzik?',
          desc: 'Egyetlen adatból végtelen sok lehetséges tartózkodási pont létezik. További műholdakra van szükség!',
        },
      ],
      highlightBox: {
        type: 'fact',
        title: 'Geometriai definíció',
        text: '1 műhold = 1 gömb. A felhasználó a gömb felületének tetszőleges pontján lehet.',
      },
      visualType: 'sat1',
      suggestedAction: {
        label: 'Nézd meg a szimulátorban 1 műholddal!',
        gameId: 'sim',
      },
    },
    {
      id: 4,
      badge: '2. Geometriai Lépés',
      category: 'Trilateráció: 2 Műhold',
      title: 'Két Műhold: Két kör metszése és a két pont dilemmája',
      summary: 'Bekapcsolódik a második műhold! A lehetőségek száma drasztikusan lecsökken, de még nem egyértelmű.',
      bullets: [
        {
          title: 'Két gömb metszete a 3D térben',
          desc: 'Két egymást metsző gömb közös része egy körvonal (egy karika a térben).',
        },
        {
          title: '2D-s vetület (vászon)',
          desc: 'Síkban két kör legfeljebb KÉT pontban (A és B) metszi egymást. Ebből a két pontból az egyik az igazi helyzeted!',
        },
        {
          title: 'Kizárható-e azonnal az egyik pont?',
          desc: 'Gyakran az egyik metszéspont a világűr mélyén vagy a Föld mélyében lenne, de a Föld felszínén lévő két reális pont közül 2 műholddal még nem tudunk dönteni.',
        },
      ],
      highlightBox: {
        type: 'fact',
        title: 'Geometriai állapot',
        text: '2 műhold = 2 lehetséges metszéspont (A és B). A határozatlanság 2 pontra szűkült!',
      },
      visualType: 'sat2',
      suggestedAction: {
        label: 'Mozgasd a 2 műholdat a szimulációban!',
        gameId: 'sim',
      },
    },
    {
      id: 5,
      badge: '3. Geometriai Lépés',
      category: 'Trilateráció: 3 Műhold',
      title: 'Három Műhold: A Föld felszíne mint szűrő & A síkbeli metszés',
      summary: 'Három kör egy síkban pontosan egyetlen pontban metszi egymást. Miért mondják a fizikusok, hogy mégis kell egy 4. műhold?',
      bullets: [
        {
          title: 'Síkban a tökéletes megoldás',
          desc: 'Három ismert sugarú körnek általános helyzetben pontosan EGYETLEN közös metszéspontja van. Ez meghatározza a helyet a térképen.',
        },
        {
          title: 'A Föld felszíne mint 3. gömb',
          desc: 'Mivel tudjuk, hogy a Föld felszínén vagyunk (~6371 km-re a Föld középpontjától), a Föld maga is egy ismert gömbként viselkedik.',
        },
        {
          title: 'De akkor mi a bökkenő a valóságban?',
          desc: 'Ez a tiszta matematika és geometria világában működne — HA a telefonodnak tökéletes atomórája lenne! De nincs!',
        },
      ],
      highlightBox: {
        type: 'question',
        title: 'A fizikai rejtély',
        text: 'Ha tisztán geometriailag 3 gömb elég a térben, miért állítja le a GPS-t a telefon, ha csak 3 műholdat lát?',
      },
      visualType: 'sat3',
      suggestedAction: {
        label: 'Teszteld a 3 műholdas állapotot!',
        gameId: 'sim',
      },
    },
    {
      id: 6,
      badge: 'Kulcsfogalom',
      category: 'Az Atomórák Szerepe',
      title: 'A 4. Műhold Rejtélye: A telefon olcsó kvarcórájának csapdája',
      summary: 'A műholdakon milliárdos rubídium és cézium atomórák ketyegnek. A zsebedben lévő telefonban viszont egy párszáz forintos kvarckristály van.',
      bullets: [
        {
          title: 'Műholdas atomórák',
          desc: 'A GPS műholdak atomórái 1 másodpercet legfeljebb 100 millió év alatt tévednek! Félelmetes precizitás.',
        },
        {
          title: 'A telefon kvarcórája',
          desc: 'Egy telefon kvarcórája naponta ezredmásodperceket késhet vagy siethet a hőmérséklet és akkumulátor ingadozása miatt.',
        },
        {
          title: 'Miért végzetes ez a késés?',
          desc: 'Mivel a jel fénysebességgel (300 000 km/s) száguld, a legapróbb időmérési hiba is elképesztő távolsági hibává robban!',
        },
      ],
      highlightBox: {
        type: 'quote',
        title: 'A kvarcóra paradoxon',
        text: 'Nem várhatjuk el a felhasználóktól, hogy egy 20 kilós atomórát hordjanak a zsebükben a telefonjuk mellett!',
      },
      visualType: 'atomclock',
      suggestedAction: {
        label: 'Nézd meg a szimulátorban az óraeltolódást!',
        gameId: 'sim',
      },
    },
    {
      id: 7,
      badge: 'Fizikai Számítás',
      category: 'Időhiba & Távolság',
      title: 'A Nanoszekundumos Katasztrófa: 1 µs hiba = 300 méter!',
      summary: 'Számoljuk ki pontosan a fénysebesség képletével, mekkora pozícióhibát okoz a telefon pontatlan órája!',
      bullets: [
        {
          title: '1 mikroszekundum (0,000001 s) hiba',
          desc: 'Δd = c · Δt = 300 000 000 m/s · 0,000001 s = 300 MÉTER! A térkép a szomszéd kerületbe vagy a Dunába tenne!',
        },
        {
          title: '1 nanoszekundum (0,000000001 s) hiba',
          desc: 'Δd = 300 000 000 m/s · 10⁻⁹ s = 0,3 méter = 30 CENTIMÉTER!',
        },
        {
          title: 'A 4. Műhold csodája',
          desc: 'A 4. műhold nem helyzetet mér, hanem a 4 ismeretlenes egyenletrendszerrel (x, y, z koordináták + Δt órahiba) NANOSZEKUNDUMOSRA ÁLLÍTJA a telefonod óráját!',
        },
      ],
      highlightBox: {
        type: 'formula',
        title: '4 ismeretlenes egyenletrendszer',
        text: 'Négy egyenlet: (x-xᵢ)² + (y-yᵢ)² + (z-zᵢ)² = [c · (tᵢ - t_vevő + Δt)]²  (i = 1..4)',
      },
      visualType: 'timeerror',
      suggestedAction: {
        label: 'Állítsd be az órakorrekciót a szimulátorban!',
        gameId: 'sim',
      },
    },
    {
      id: 8,
      badge: 'Geopolitika & Technológia',
      category: 'GPS vs. Galileo',
      title: 'Miért épített Európa saját műholdrendszert? (Galileo)',
      summary: 'Az amerikai GPS mellett Európának ma saját, szuverén, polgári irányítású konstellációja van: a Galileo.',
      bullets: [
        {
          title: 'GPS (Amerikai Egyesült Államok)',
          desc: 'Katonai (U.S. Space Force) irányítás alatt áll. Válság vagy háború idején az amerikai hadsereg bármikor szelektíven ronthatja vagy lekapcsolhatja a polgári jelet (Selective Availability).',
        },
        {
          title: 'Galileo (Európai Unió & ESA)',
          desc: 'Tisztán polgári vezetésű rendszer, amelyet nem lehet katonai döntéssel kikapcsolni. Prágai központú.',
        },
        {
          title: 'Milliméteres pontosság és Életmentés (SAR)',
          desc: 'A Galileo még a GPS-nél is precízebb, és beépített Search and Rescue (SAR) funkcióval rendelkezik: a bajba jutott hegymászók vagy hajótöröttek jelzésére a műholdak VISSZAIGAZOLÁST tudnak küldeni!',
        },
      ],
      highlightBox: {
        type: 'fact',
        title: 'Érdekesség',
        text: 'Minden mai okostelefon egyszerre használja a GPS, a Galileo és az európai EGNOS korrekciós műholdakat a leggyorsabb pozicionálásért.',
      },
      visualType: 'galileo',
      suggestedAction: {
        label: 'Töltsd ki a Galileo kvízkérdéseket!',
        gameId: 'quiz',
      },
    },
    {
      id: 9,
      badge: '2. Blokk: Terepmisszió',
      category: 'Google Earth & Térképezés',
      title: 'A Partvonal-paradoxon: Minél pontosabban mérsz, annál hosszabb?',
      summary: 'Hogyan kapcsolódik a műholdas mérés a fraktálokhoz és a Tihanyi-félszigethez? Lewis Fry Richardson és Mandelbrot felfedezése.',
      bullets: [
        {
          title: 'Milyen hosszú egy tenger- vagy tópart?',
          desc: 'Ha egy 100 kilométeres egyenes vonalzóval méred Nagy-Britannia vagy Tihany partvonalát, átugrod a kis öblöket. Rövid eredményt kapsz.',
        },
        {
          title: 'Ha 1 méteres léccel méred...',
          desc: 'Körbemész minden egyes szikla, faág és kanyarulat mentén. A partvonal hossza megugrik!',
        },
        {
          title: 'A mai Tihany-kísérletünk',
          desc: 'A Google Earth vonalzójával először 10 durva törésponttal mérjük meg a Tihanyi-félszigetet, majd 20–50 finom ponttal. Látni fogod, ahogy a mért kilométer látványosan megnő!',
        },
      ],
      highlightBox: {
        type: 'quote',
        title: 'Mandelbrot fraktál elve',
        text: 'A természetes partvonalak hossza a mérőeszköz léptékétől függ: minél finomabb a felbontás, a mért hossz annál inkább a végtelenbe tart.',
      },
      visualType: 'coastline',
      suggestedAction: {
        label: 'Nézd meg az interaktív Tihany diagramot!',
        gameId: 'tihany',
      },
    },
    {
      id: 10,
      badge: 'Küldetések Áttekintése',
      category: 'Gyakorlati Mérések',
      title: 'A 4 Terepmisszió: Föld, Hold és Mars meghódítása!',
      summary: 'Készülj fel a valós eszközök használatára! A Google Earth és Sky segítségével valódi csillagászati és térképészeti méréseket végzel.',
      bullets: [
        {
          title: 'Küldetés A: A Margit híd hossza',
          desc: 'Megmérjük a budapesti Margit híd valós fesztávolságát a Google Earth vonalzójával parttól partig (elfogadási sáv: 550–670 m).',
        },
        {
          title: 'Küldetés B: Tihanyi partvonal kétszeres mérése',
          desc: '10 pont (~22 km) vs. 20–50 pont (~26-28 km) partvonal összehasonlítása és az önreflexió rögzítése.',
        },
        {
          title: 'Küldetés C: Apollo-11 a Google Moon-on',
          desc: 'A Nyugalom Tengerén (Mare Tranquillitatis) beazonosítjuk Neil Armstrongék 1969-es leszállóhelyének pontos koordinátáit!',
        },
        {
          title: 'Küldetés D: Olympus Mons a Google Mars-on',
          desc: 'A Naprendszer legnagyobb, 22 km magas szupervulkánjának alapátmérőjét mérjük meg kilométerben (500–700 km).',
        },
      ],
      highlightBox: {
        type: 'fact',
        title: 'Pontszám és Jelvények',
        text: 'Minden helyes mérésért XP és egyedi kitüntetés jár! Gyűjtsd össze mind a 4 jelvényt a maximális 20 ponthoz!',
      },
      visualType: 'missions',
      suggestedAction: {
        label: 'Indítsd a Google Earth küldetéseket!',
        gameId: 'missions',
      },
    },
  ];

  const current = slides[currentSlide];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  return (
    <div
      className={`w-full flex flex-col gap-4 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 overflow-y-auto' : ''
      }`}
    >
      {/* Top Slide Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-3 shadow-md backdrop-blur-md">
        {/* Left: Presentation title & slide counter */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">
                Műhold-küldetés Prezentáció
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Dia {currentSlide + 1} / {slides.length}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {current.category} • {current.badge}
            </div>
          </div>
        </div>

        {/* Right: Controls & Jumper */}
        <div className="flex items-center gap-2">
          {/* Quick jump to game if available */}
          {current.suggestedAction && onGoToGame && (
            <button
              type="button"
              onClick={() => onGoToGame(current.suggestedAction?.gameId)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{current.suggestedAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              disabled={currentSlide === 0}
              onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Előző dia (Balra nyíl)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-400 select-none">
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              type="button"
              disabled={currentSlide === slides.length - 1}
              onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Következő dia (Jobbra nyíl / Space)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Kilépés a teljes képernyőből (F)' : 'Teljes képernyő (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Slide Visual Presentation Card */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col gap-8 relative overflow-hidden min-h-[500px]">
        {/* Subtle background ambient orb */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Slide Header */}
        <div className="flex flex-col gap-3 relative z-10 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {current.badge}
            </span>
            <span className="text-xs text-slate-400">
              • {current.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug font-display">
            {current.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            {current.summary}
          </p>
        </div>

        {/* Main Content Layout: Bullets on Left + Visual / Callout on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-stretch">
          {/* Left Column: 3 Core Bullets */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              {current.bullets.map((b, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-start gap-3.5 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    0{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-100">
                      {b.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1">
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile / Direct action to game */}
            {current.suggestedAction && onGoToGame && (
              <button
                type="button"
                onClick={() => onGoToGame(current.suggestedAction?.gameId)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer mt-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{current.suggestedAction.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Column: Dynamic Visual Diagram & Highlight Box */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-5">
            {/* Visual Box based on visualType */}
            <div className="flex-1 min-h-[220px] rounded-2xl bg-slate-950 border border-slate-800 p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              {/* Type 1: INTRO OR GLOBE */}
              {(current.visualType === 'intro' || current.visualType === 'globe') && (
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-cyan-500/10 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-300 animate-pulse">
                      <Globe2 className="w-12 h-12" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-600/40 border border-blue-400/50 flex items-center justify-center text-cyan-200">
                      <Satellite className="w-4 h-4 animate-spin-slow" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-mono font-bold text-cyan-400">20 200 km keringési magasság</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Fénysebességű rádióhullámok (c ≈ 300 000 km/s)</p>
                  </div>
                </div>
              )}

              {/* Type 2: 1 SATELLITE (1 SPHERE / CIRCLE) */}
              {current.visualType === 'sat1' && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    {/* Circle 1 */}
                    <div className="absolute w-36 h-36 rounded-full border-2 border-dashed border-cyan-400/60 bg-cyan-500/5 flex items-center justify-center animate-pulse">
                      <span className="text-[10px] text-cyan-300 font-mono">r₁ távolság</span>
                    </div>
                    {/* Satellite icon */}
                    <div className="absolute top-1 right-8 p-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold">
                      <Satellite className="w-4 h-4" />
                    </div>
                    {/* User dot */}
                    <div className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-400/30" />
                  </div>
                  <span className="text-[11px] text-slate-400 text-center">
                    1 műhold = Végtelen sok lehetséges tartózkodási pont a körön
                  </span>
                </div>
              )}

              {/* Type 3: 2 SATELLITES (2 CIRCLES, 2 INTERSECTIONS) */}
              {current.visualType === 'sat2' && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="relative w-48 h-40 flex items-center justify-center">
                    {/* Circle 1 */}
                    <div className="absolute left-4 w-28 h-28 rounded-full border-2 border-cyan-500/70 bg-cyan-500/10" />
                    {/* Circle 2 */}
                    <div className="absolute right-4 w-28 h-28 rounded-full border-2 border-emerald-500/70 bg-emerald-500/10" />
                    {/* Intersections */}
                    <div className="absolute top-8 w-3 h-3 rounded-full bg-rose-400 ring-2 ring-rose-400/50 flex items-center justify-center">
                      <span className="absolute -top-4 text-[9px] font-bold text-rose-300">Pont A</span>
                    </div>
                    <div className="absolute bottom-8 w-3 h-3 rounded-full bg-rose-400 ring-2 ring-rose-400/50 flex items-center justify-center">
                      <span className="absolute -bottom-4 text-[9px] font-bold text-rose-300">Pont B</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-amber-300 font-bold text-center">
                    2 műhold = 2 lehetséges metszéspont (A és B)
                  </span>
                </div>
              )}

              {/* Type 4: 3 SATELLITES (EXACT 1 INTERSECTION) */}
              {current.visualType === 'sat3' && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="relative w-48 h-44 flex items-center justify-center">
                    <div className="absolute top-2 w-28 h-28 rounded-full border-2 border-cyan-500/60 bg-cyan-500/5" />
                    <div className="absolute bottom-2 left-3 w-28 h-28 rounded-full border-2 border-emerald-500/60 bg-emerald-500/5" />
                    <div className="absolute bottom-2 right-3 w-28 h-28 rounded-full border-2 border-amber-500/60 bg-amber-500/5" />
                    {/* Single center intersection */}
                    <div className="w-4 h-4 rounded-full bg-cyan-300 ring-4 ring-cyan-400/50 z-10" />
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold text-center">
                    3 műhold = Síkban EGYETLEN egyértelmű metszéspont!
                  </span>
                </div>
              )}

              {/* Type 5: ATOMCLOCK & QUARTZ */}
              {current.visualType === 'atomclock' && (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-center">
                      <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                      <div className="text-[10px] uppercase font-bold text-slate-400">Műhold</div>
                      <div className="text-xs font-bold text-cyan-300">Atomóra</div>
                      <div className="text-[10px] text-slate-400 mt-1">10⁻¹⁴ s precizitás</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/30 text-center">
                      <Radio className="w-6 h-6 text-rose-400 mx-auto mb-1" />
                      <div className="text-[10px] uppercase font-bold text-slate-400">Telefon</div>
                      <div className="text-xs font-bold text-rose-300">Kvarcóra</div>
                      <div className="text-[10px] text-rose-400/80 mt-1">10⁻⁶ s eltérés</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-300 text-center px-2">
                    A 4. műhold a telefon kvarcóráját szinkronizálja nanoszekundumos atomi pontosságúra!
                  </div>
                </div>
              )}

              {/* Type 6: TIME ERROR SCALE */}
              {current.visualType === 'timeerror' && (
                <div className="flex flex-col gap-2.5 w-full">
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs">
                    <span className="text-rose-300 font-bold">1 mikroszekundum (1 µs)</span>
                    <span className="font-mono font-black text-rose-400">300 MÉTER hiba!</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-bold">100 nanoszekundum (100 ns)</span>
                    <span className="font-mono font-black text-amber-400">30 MÉTER hiba</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-bold">1 nanoszekundum (1 ns)</span>
                    <span className="font-mono font-black text-emerald-400">30 CENTIMÉTER</span>
                  </div>
                </div>
              )}

              {/* Type 7: GALILEO VS GPS */}
              {current.visualType === 'galileo' && (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex flex-col gap-1 text-center">
                    <span className="text-xs font-black text-slate-200">GPS (USA)</span>
                    <span className="text-[10px] text-slate-400">Katonai háttér (DOD)</span>
                    <span className="text-[10px] text-amber-400 font-mono mt-1">L1 / L2 sávok</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 flex flex-col gap-1 text-center">
                    <span className="text-xs font-black text-cyan-300">Galileo (EU)</span>
                    <span className="text-[10px] text-cyan-400">100% polgári irányítás</span>
                    <span className="text-[10px] text-emerald-400 font-mono mt-1">SAR visszajelzés</span>
                  </div>
                </div>
              )}

              {/* Type 8: COASTLINE / TIHANY */}
              {current.visualType === 'coastline' && (
                <div className="flex flex-col items-center gap-2 text-center w-full">
                  <div className="w-full flex items-center justify-around py-3">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-mono font-bold text-slate-300">10 mérőpont</span>
                      <span className="text-lg font-black text-cyan-400">~22 km</span>
                      <span className="text-[10px] text-slate-400">Durva egyenesek</span>
                    </div>
                    <div className="text-slate-600 font-bold">➔</div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-mono font-bold text-emerald-300">20–50 mérőpont</span>
                      <span className="text-lg font-black text-emerald-400">~26–28 km</span>
                      <span className="text-[10px] text-slate-400">Finom öblökkel</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-cyan-300">
                    A fraktál partvonalak hossza a mérőskála finomításával nő!
                  </span>
                </div>
              )}

              {/* Type 9: MISSIONS */}
              {current.visualType === 'missions' && (
                <div className="grid grid-cols-2 gap-2.5 w-full text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300">
                    <span className="block font-bold">1. Margit híd</span>
                    <span className="text-[10px] text-slate-400">Google Earth</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300">
                    <span className="block font-bold">2. Tihany</span>
                    <span className="text-[10px] text-slate-400">Partvonal mérés</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300">
                    <span className="block font-bold">3. Apollo-11</span>
                    <span className="text-[10px] text-slate-400">Google Moon</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-300">
                    <span className="block font-bold">4. Olympus Mons</span>
                    <span className="text-[10px] text-slate-400">Google Mars</span>
                  </div>
                </div>
              )}
            </div>

            {/* Highlight Box below visual */}
            {current.highlightBox && (
              <div
                className={`p-4 rounded-2xl border ${
                  current.highlightBox.type === 'formula'
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                    : current.highlightBox.type === 'question'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : current.highlightBox.type === 'quote'
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                } flex flex-col gap-1.5 shadow-sm`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" />
                  <span>{current.highlightBox.title}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  {current.highlightBox.text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Slide Navigation Bar & Miniatures */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-4 relative z-10">
          {/* Thumbnails indicator */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx
                    ? 'w-8 bg-cyan-400'
                    : 'w-2.5 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`${idx + 1}. dia: ${s.title}`}
              />
            ))}
          </div>

          {/* Previous / Next buttons on bottom */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={currentSlide === 0}
              onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-bold border border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Előző</span>
            </button>

            <button
              type="button"
              disabled={currentSlide === slides.length - 1}
              onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-extrabold shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Következő</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
