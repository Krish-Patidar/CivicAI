import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/ui/PageTransition';
import { Button } from '../components/ui/Button';
import {
  Building2,
  Bot,
  Trophy,
  Activity,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  LogIn,
  Camera,
  Droplets,
  Trash2,
  Lightbulb,
  TreePine,
  Construction,
  ShieldAlert,
  ShieldCheck,
  Landmark,
  Ticket,
  Wrench,
  RefreshCw,
  Send,
  XCircle,
  ChevronDown
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const DASHBOARD_ROUTES = {
  citizen: '/dashboard',
  department_admin: '/department',
  worker: '/worker',
  cm_admin: '/cm'
};

// Wide city skyline behind the hero [x, width, height] (viewBox 1440 x 240)
const SKYLINE = [
  [0, 64, 96], [70, 44, 140], [120, 60, 110], [186, 40, 170], [232, 70, 120], [308, 52, 150],
  [366, 64, 100], [436, 46, 184], [488, 74, 128], [568, 50, 156], [624, 66, 108], [696, 42, 176],
  [744, 72, 132], [822, 56, 98], [884, 48, 162], [938, 70, 118], [1014, 44, 190], [1064, 64, 126],
  [1134, 56, 150], [1196, 72, 104], [1274, 46, 168], [1326, 60, 122], [1392, 48, 140]
];
const STREET_LAMPS = [90, 330, 570, 810, 1050, 1290];

const buildSkyline = () => {
  const windows = [];
  SKYLINE.forEach(([x, w, h], i) => {
    const cols = Math.floor((w - 12) / 14);
    const rows = Math.floor((h - 24) / 20);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const seed = (i * 7 + c * 3 + r * 5) % 7;
        if (seed < 2) {
          windows.push({ x: x + 8 + c * 14, y: 240 - h + 14 + r * 20, lit: seed === 0, delay: (i + c + r) % 6 });
        }
      }
    }
  });
  return windows;
};
const SKYLINE_WINDOWS = buildSkyline();

// Hero demo scene (viewBox 600 x 340)
const SCENE_LAMPS = [70, 185, 300, 415, 530];
const BROKEN_LAMP = 2;
const SCENE_STARS = [[40, 24], [96, 52], [150, 18], [220, 40], [290, 16], [350, 48], [410, 22], [470, 44], [530, 20], [575, 50], [120, 80], [260, 70], [500, 86], [330, 84]];
const SCENE_BUILDINGS = [[0, 50, 90], [56, 36, 130], [98, 60, 100], [164, 40, 150], [210, 56, 110], [272, 44, 140], [322, 64, 96], [392, 40, 126], [438, 58, 104], [502, 44, 148], [552, 48, 112]];

const buildSceneWindows = () => {
  const out = [];
  SCENE_BUILDINGS.forEach(([x, w, h], i) => {
    const cols = Math.floor((w - 10) / 12);
    const rows = Math.floor((h - 20) / 18);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if ((i * 5 + c * 3 + r * 7) % 6 === 0) {
          out.push({ x: x + 7 + c * 12, y: 282 - h + 12 + r * 18 });
        }
      }
    }
  });
  return out;
};
const SCENE_WINDOWS = buildSceneWindows();

const DEMO_STEPS = [
  { icon: Camera, label: 'Photo and location captured' },
  { icon: Bot, label: 'Routed to Electricity Board' },
  { icon: Wrench, label: 'Worker assigned' },
  { icon: Trophy, label: 'Fixed. 10 credits earned' }
];

const HIGHLIGHTS = [
  { icon: Camera, title: 'Photo and location', desc: 'Snap it once, we capture where it is' },
  { icon: Bot, title: 'AI finds the department', desc: 'Your photo and text decide where it goes' },
  { icon: ShieldCheck, title: 'Doubtful reports checked', desc: 'The Mayor\'s office reviews them first' },
  { icon: Ticket, title: 'Credits become vouchers', desc: 'Earn when your complaint is resolved' }
];

const STATUS_GUIDE = [
  { label: 'Under review', icon: AlertTriangle, badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30', desc: 'The Mayor\'s office is checking it first.' },
  { label: 'Pending', icon: AlertCircle, badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', desc: 'With the right department, waiting for a worker.' },
  { label: 'In progress', icon: RefreshCw, badge: 'bg-primary-500/10 text-primary-400 border-primary-500/20', desc: 'A worker is assigned and on it.' },
  { label: 'Resolved', icon: CheckCircle, badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', desc: 'Fixed. You earn 10 credits.' }
];

const JOURNEY = [
  { icon: Camera, title: 'You report', desc: 'A photo, a few words and your location.' },
  { icon: Bot, title: 'AI reads it', desc: 'It checks the photo against your text and picks the department.' },
  { icon: Building2, title: 'Department fixes it', desc: 'A worker is assigned and the status updates as the work moves.' },
  { icon: Trophy, title: 'You get rewarded', desc: 'Every resolved complaint earns 10 credits you can redeem for vouchers.' }
];

const REVIEW_OUTCOMES = [
  { icon: CheckCircle, color: 'text-emerald-300', title: 'Approve', desc: 'It goes to the department the AI suggested.' },
  { icon: Send, color: 'text-primary-300', title: 'Divert', desc: 'The Mayor\'s office sends it to a different department.' },
  { icon: XCircle, color: 'text-rose-300', title: 'Reject', desc: 'You see the reason on your tracker.' }
];

const FAQS = [
  {
    q: 'What does "under review" mean?',
    a: 'The Mayor\'s office is checking your complaint before any department sees it. Afterwards it is forwarded to the right department, or rejected with a reason you can read on your tracker.'
  },
  {
    q: 'Can I report things that are not potholes or leaks?',
    a: 'Yes. Pending certificates, pension or ration problems, delays at municipal offices, broken signboards and general questions go to General Administration.'
  },
  {
    q: 'How do I earn credits?',
    a: 'You get 10 credits each time a complaint you filed is resolved. You can redeem your credits for vouchers.'
  },
  {
    q: 'Which photo works best?',
    a: 'One clear photo of the problem itself, in daylight if you can. The AI compares the photo with your description, so a photo of something else sends your complaint to review.'
  },
  {
    q: 'Can I lose credits?',
    a: 'Yes. Reports that our checks mark as fake lose 5 credits, so only report real problems.'
  }
];

/* ------------------------------------------------------------------ */
/* Illustrations for the issue tiles                                   */
/* ------------------------------------------------------------------ */

const ART_CLASS = 'w-full h-auto';

const RoadArt = () => (
  <svg viewBox="0 0 200 120" className={ART_CLASS} aria-hidden="true">
    <polygon points="70,8 130,8 192,120 8,120" fill="#ffffff" fillOpacity="0.08" />
    <line x1="100" y1="12" x2="100" y2="118" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="3" strokeDasharray="10 9" />
    <ellipse cx="130" cy="94" rx="24" ry="8" fill="#0b0f1e" />
    <path d="M110 87 l-9 -6 M148 89 l12 -5 M128 84 l2 -8" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const LightArt = () => (
  <svg viewBox="0 0 200 120" className={ART_CLASS} aria-hidden="true">
    <defs>
      <linearGradient id="tile-cone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
      </linearGradient>
    </defs>
    <polygon points="100,34 52,118 148,118" fill="url(#tile-cone)" />
    <line x1="100" y1="116" x2="100" y2="34" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
    <circle cx="100" cy="30" r="7" fill="#fde68a" />
  </svg>
);

const WaterArt = () => (
  <svg viewBox="0 0 200 120" className={ART_CLASS} aria-hidden="true">
    <rect x="14" y="30" width="130" height="14" rx="7" fill="#ffffff" fillOpacity="0.16" />
    <rect x="132" y="26" width="10" height="22" rx="3" fill="#ffffff" fillOpacity="0.25" />
    <path d="M96 50 q-6 10 0 14 q6 -4 0 -14z" fill="#38bdf8" fillOpacity="0.8" />
    <path d="M96 74 q-5 8 0 11 q5 -3 0 -11z" fill="#38bdf8" fillOpacity="0.55" />
    <ellipse cx="96" cy="108" rx="38" ry="6" fill="#38bdf8" fillOpacity="0.3" />
  </svg>
);

const GarbageArt = () => (
  <svg viewBox="0 0 200 120" className={ART_CLASS} aria-hidden="true">
    <path d="M72 44 h56 l-6 66 h-44z" fill="#ffffff" fillOpacity="0.12" stroke="#ffffff" strokeOpacity="0.3" />
    <rect x="66" y="34" width="68" height="9" rx="3" fill="#ffffff" fillOpacity="0.25" />
    <path d="M88 52 v52 M100 52 v52 M112 52 v52" stroke="#ffffff" strokeOpacity="0.15" />
    <rect x="30" y="100" width="12" height="9" rx="2" fill="#34d399" fillOpacity="0.6" transform="rotate(-14 36 104)" />
    <rect x="150" y="98" width="14" height="10" rx="2" fill="#ffffff" fillOpacity="0.3" transform="rotate(12 157 103)" />
    <rect x="164" y="108" width="9" height="7" rx="2" fill="#34d399" fillOpacity="0.5" />
  </svg>
);

const ParkArt = () => (
  <svg viewBox="0 0 200 120" className={ART_CLASS} aria-hidden="true">
    <rect x="56" y="68" width="9" height="44" rx="3" fill="#ffffff" fillOpacity="0.25" />
    <circle cx="60" cy="54" r="28" fill="#34d399" fillOpacity="0.4" />
    <rect x="140" y="82" width="7" height="30" rx="3" fill="#ffffff" fillOpacity="0.25" />
    <circle cx="143" cy="72" r="20" fill="#2dd4bf" fillOpacity="0.35" />
    <rect x="86" y="98" width="44" height="5" rx="2" fill="#ffffff" fillOpacity="0.3" />
    <path d="M92 103 v9 M124 103 v9" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const SafetyArt = () => (
  <svg viewBox="0 0 200 120" className={ART_CLASS} aria-hidden="true">
    <path d="M100 8 l42 14 v34 c0 28 -20 46 -42 56 c-22 -10 -42 -28 -42 -56 v-34z" fill="#fb7185" fillOpacity="0.18" stroke="#fda4af" strokeOpacity="0.6" strokeWidth="2" />
    <text x="100" y="74" textAnchor="middle" fontSize="40" fontWeight="800" fill="#fda4af">!</text>
  </svg>
);

const GeneralArt = () => (
  <svg viewBox="0 0 200 120" className={ART_CLASS} aria-hidden="true">
    <rect x="22" y="18" width="92" height="76" rx="8" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeOpacity="0.3" />
    <path d="M38 38 h60 M38 52 h60 M38 66 h36" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
    <circle cx="92" cy="76" r="14" fill="#a78bfa" fillOpacity="0.4" stroke="#c4b5fd" strokeOpacity="0.7" />
    <path d="M86 76 l5 5 l9 -10" stroke="#ede9fe" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="152" y="54" width="3" height="52" fill="#ffffff" fillOpacity="0.3" />
    <rect x="128" y="24" width="52" height="30" rx="5" fill="#ffffff" fillOpacity="0.14" stroke="#ffffff" strokeOpacity="0.3" />
    <path d="M136 36 h36 M136 44 h24" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const ISSUES = [
  {
    icon: Construction,
    title: 'Roads and footpaths',
    desc: 'Potholes, broken pavements, damaged bridges',
    photo: '/images/landing/road.jpg',
    art: <RoadArt />,
    tint: 'from-orange-500/35 to-orange-900/5',
    iconColor: 'text-orange-300',
    layout: 'col-span-1 md:row-span-2'
  },
  {
    icon: Lightbulb,
    title: 'Street lights and power',
    desc: 'Dark roads, dead lamps, fallen wires',
    photo: '/images/landing/electricity.jpg',
    art: <LightArt />,
    tint: 'from-amber-400/35 to-amber-900/5',
    iconColor: 'text-amber-300',
    layout: 'col-span-1'
  },
  {
    icon: Droplets,
    title: 'Water and drains',
    desc: 'Leaks, no supply, blocked drains',
    photo: '/images/landing/water.jpg',
    art: <WaterArt />,
    tint: 'from-sky-500/35 to-sky-900/5',
    iconColor: 'text-sky-300',
    layout: 'col-span-1'
  },
  {
    icon: Trash2,
    title: 'Garbage and sanitation',
    desc: 'Overflowing bins, dirty public toilets',
    photo: '/images/landing/garbage.jpg',
    art: <GarbageArt />,
    tint: 'from-emerald-500/35 to-emerald-900/5',
    iconColor: 'text-emerald-300',
    layout: 'col-span-1'
  },
  {
    icon: TreePine,
    title: 'Parks and trees',
    desc: 'Fallen trees, broken benches, unkept gardens',
    photo: '/images/landing/parks.jpg',
    art: <ParkArt />,
    tint: 'from-teal-500/35 to-teal-900/5',
    iconColor: 'text-teal-300',
    layout: 'col-span-1'
  },
  {
    icon: ShieldAlert,
    title: 'Public safety',
    desc: 'Encroachment, unsafe spots and other hazards in your area',
    photo: '/images/landing/safety.jpg',
    art: <SafetyArt />,
    tint: 'from-rose-500/35 to-rose-900/5',
    iconColor: 'text-rose-300',
    layout: 'col-span-1'
  },
  {
    icon: Landmark,
    title: 'General administration',
    desc: 'Income certificate stuck for months, a broken signboard, or where to apply for a trade licence. Anything municipal that fits nowhere else.',
    photo: '/images/landing/general.jpg',
    art: <GeneralArt />,
    tint: 'from-violet-500/35 to-violet-900/5',
    iconColor: 'text-violet-300',
    layout: 'col-span-2',
    clamp: 'line-clamp-3'
  }
];

/* ------------------------------------------------------------------ */
/* Hero demo: one broken street light, one tap                         */
/* ------------------------------------------------------------------ */

function useDemo() {
  const [stage, setStage] = useState(0); // 0 = idle, 1..4 = steps completed
  const [running, setRunning] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current.splice(0);

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setStage(4);
      setRunning(false);
      return;
    }

    setStage(0);
    setRunning(true);
    [700, 1700, 2800, 4000].forEach((ms, i) => {
      timers.current.push(
        setTimeout(() => {
          setStage(i + 1);
          if (i === 3) setRunning(false);
        }, ms)
      );
    });
  };

  return { stage, running, start, fixed: stage >= 4 };
}

function Skyline({ idPrefix = 'ls' }) {
  return (
    <svg
      viewBox="0 0 1440 240"
      preserveAspectRatio="xMidYMax slice"
      className="w-full h-full block"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${idPrefix}-lamp-glow`}>
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-ground-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {SKYLINE.map(([x, w, h], i) => (
        <rect key={i} x={x} y={240 - h} width={w} height={h} fill="#ffffff" fillOpacity="0.045" />
      ))}

      {SKYLINE_WINDOWS.map((win, i) => (
        <rect
          key={i}
          x={win.x}
          y={win.y}
          width="7"
          height="10"
          rx="1"
          fill={win.lit ? '#fbbf24' : '#ffffff'}
          fillOpacity={win.lit ? 0.7 : 0.08}
          className={win.lit ? 'ls-twinkle' : undefined}
          style={win.lit ? { animationDelay: `${win.delay}s` } : undefined}
        />
      ))}

      <rect x="0" y="222" width="1440" height="18" fill={`url(#${idPrefix}-ground-fade)`} />

      {STREET_LAMPS.map((x, i) => (
        <g key={x}>
          <line x1={x} y1="222" x2={x} y2="166" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="3" />
          <circle cx={x} cy="162" r="30" fill={`url(#${idPrefix}-lamp-glow)`} className="ls-glow" style={{ animationDelay: `${i * 0.5}s` }} />
          <circle cx={x} cy="162" r="4.5" fill="#fde68a" />
        </g>
      ))}
    </svg>
  );
}

function Lamp({ x, lit, broken, showMarker }) {
  const fade = { opacity: lit ? 1 : 0, transition: 'opacity 0.9s ease' };
  return (
    <g>
      <ellipse cx={x} cy="300" rx="80" ry="11" fill="url(#hd-pool)" style={fade} />
      <line x1={x} y1="296" x2={x} y2="132" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="4" strokeLinecap="round" />
      <circle cx={x} cy="124" r="64" fill="url(#hd-glow)" style={fade} />
      <circle cx={x} cy="124" r="7" fill={lit ? '#fde68a' : '#475569'} style={{ transition: 'fill 0.6s ease' }} />
      {broken && showMarker && (
        <g>
          <circle cx={x} cy="92" r="12" fill="none" stroke="#ef4444" strokeWidth="2" className="ls-ping" />
          <circle cx={x} cy="92" r="11" fill="#ef4444" />
          <text x={x} y="97" textAnchor="middle" fontSize="14" fontWeight="800" fill="#ffffff">!</text>
        </g>
      )}
    </g>
  );
}

// Desktop: a wide night street with five lamps, one of them broken
function StreetDemo() {
  const { stage, running, start, fixed } = useDemo();
  const chipState = (i) => (stage > i ? 'done' : running && stage === i ? 'active' : 'idle');
  const chipClass = {
    done: 'border-primary-500/30 bg-primary-500/10 text-primary-100',
    active: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
    idle: 'border-white/10 bg-white/[0.03] text-gray-500'
  };

  return (
    <div className="hidden lg:block w-full max-w-lg ml-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_rgba(99,102,241,0.18)]">
      <svg viewBox="0 0 600 340" className="w-full h-auto block" role="img" aria-label="A night street where one street light is broken. Tap the button to see it get reported and fixed.">
        <defs>
          <linearGradient id="hd-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0f22" />
            <stop offset="100%" stopColor="#1c1f45" />
          </linearGradient>
          <radialGradient id="hd-glow">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hd-pool">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="600" height="340" fill="url(#hd-sky)" />

        {SCENE_STARS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.3" fill="#ffffff" fillOpacity="0.5" />
        ))}

        {SCENE_BUILDINGS.map(([x, w, h], i) => (
          <rect key={i} x={x} y={282 - h} width={w} height={h} fill="#ffffff" fillOpacity="0.05" />
        ))}
        {SCENE_WINDOWS.map((win, i) => (
          <rect key={i} x={win.x} y={win.y} width="6" height="9" rx="1" fill="#fbbf24" fillOpacity="0.45" />
        ))}

        <rect x="0" y="282" width="600" height="14" fill="#ffffff" fillOpacity="0.06" />
        <rect x="0" y="296" width="600" height="44" fill="#070a14" />
        <line x1="0" y1="322" x2="600" y2="322" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="3" strokeDasharray="18 14" />

        {SCENE_LAMPS.map((x, i) => (
          <Lamp
            key={x}
            x={x}
            lit={i !== BROKEN_LAMP || fixed}
            broken={i === BROKEN_LAMP}
            showMarker={stage === 0 && !running}
          />
        ))}
      </svg>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2" aria-live="polite">
          {DEMO_STEPS.map((step, i) => {
            const state = chipState(i);
            const Icon = state === 'done' ? CheckCircle : step.icon;
            return (
              <div key={step.label} className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors duration-500 ${chipClass[state]}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="min-w-0 truncate">{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={start} isLoading={running} icon={fixed ? RefreshCw : Lightbulb} className="flex-shrink-0 whitespace-nowrap min-h-[48px] !px-5 !py-3 !text-sm">
            {fixed ? 'Replay the demo' : 'Report this broken light'}
          </Button>
          <p className="text-sm text-gray-400 whitespace-nowrap">
            {fixed ? 'Now report a real one.' : 'Watch it get fixed.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Phones and tablets: the same demo inside a phone, with the tracker look
function PhoneDemo() {
  const { stage, running, start, fixed } = useDemo();
  const steps = [
    { label: 'Pending', done: stage >= 1 },
    { label: 'In progress', done: stage >= 3 },
    { label: 'Resolved', done: stage >= 4 }
  ];
  const StatusIcon = stage === 0 ? Bot : DEMO_STEPS[stage - 1].icon;
  const statusText = stage === 0 ? 'Not reported yet' : DEMO_STEPS[stage - 1].label;

  return (
    <div className="lg:hidden relative mx-auto w-[280px] sm:w-[300px]">
      <div className="rounded-[2.5rem] border border-white/15 bg-background/80 backdrop-blur-xl p-3 shadow-[0_30px_80px_rgba(99,102,241,0.25)]">
        <div className="rounded-[2rem] bg-white/[0.03] border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">CivicAI</span>
            </div>
            <span className="text-xs text-gray-500">My tracker</span>
          </div>

          <div className="relative h-36 bg-gradient-to-b from-slate-800 to-background overflow-hidden flex justify-center">
            <div className={`absolute top-2 w-28 h-28 rounded-full bg-amber-400/30 blur-2xl transition-opacity duration-1000 ${fixed ? 'opacity-100' : 'opacity-0'}`} />
            <Lightbulb className={`absolute top-6 w-9 h-9 transition-colors duration-700 ${fixed ? 'text-amber-300' : 'text-slate-500'}`} />
            <div className="absolute bottom-0 w-1.5 h-20 bg-white/20 rounded-t" />

            {stage === 0 && !running && (
              <span className="absolute top-5 left-1/2 ml-8 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-extrabold flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-red-500/60 motion-safe:animate-ping" />
                <span className="relative">!</span>
              </span>
            )}

            <span className={`absolute top-2 left-2 flex items-center gap-1 rounded-full bg-background/80 border border-white/10 px-2 py-1 text-[10px] font-semibold text-white transition-opacity duration-500 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              <Camera className="w-3 h-3 text-primary-400" /> Photo added
            </span>
            <span className={`absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/80 border border-amber-400/30 px-2 py-1 text-[10px] font-semibold text-white transition-opacity duration-500 ${fixed ? 'opacity-100' : 'opacity-0'}`}>
              <Trophy className="w-3 h-3 text-amber-300" /> +10 credits
            </span>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <div className="text-sm font-bold text-white">Street light not working</div>
              <div className="text-xs text-gray-500 mt-0.5">Near the market gate</div>
            </div>

            <div className="flex items-center">
              {steps.map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div className={`flex-1 h-px transition-colors duration-500 ${s.done ? 'bg-primary-500' : 'bg-white/10'}`} />}
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500 ${s.done ? 'bg-primary-500' : 'bg-white/10'}`}>
                      {s.done && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{s.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div aria-live="polite" className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors duration-500 ${stage >= 2 ? 'bg-primary-500/10 border-primary-500/20 text-primary-200' : 'bg-white/[0.03] border-white/10 text-gray-500'}`}>
              <StatusIcon className={`w-4 h-4 flex-shrink-0 ${stage >= 2 ? 'text-primary-400' : 'text-gray-500'}`} />
              <span className="min-w-0 truncate">{statusText}</span>
            </div>

            <div className="space-y-2">
              <Button onClick={start} isLoading={running} icon={fixed ? RefreshCw : Lightbulb} className="w-full whitespace-nowrap min-h-[48px] !text-sm">
                {fixed ? 'Replay the demo' : 'Report this broken light'}
              </Button>
              <p className="text-center text-sm text-gray-400">
                {fixed ? 'Now report a real one.' : 'Tap to watch it get fixed.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Other components                                                    */
/* ------------------------------------------------------------------ */

function IssueTile({ issue }) {
  const Icon = issue.icon;
  const [photoOk, setPhotoOk] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 group ${issue.layout}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${issue.tint}`} />

      <div className={`hidden sm:block absolute right-3 bottom-3 w-[62%] max-w-[300px] transition-opacity duration-500 ${photoOk ? 'opacity-0' : 'opacity-90'}`}>
        {issue.art}
      </div>

      <img
        src={issue.photo}
        alt=""
        loading="lazy"
        onLoad={() => setPhotoOk(true)}
        onError={() => setPhotoOk(false)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 lg:group-hover:scale-105 ${photoOk ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className={`absolute inset-0 ${photoOk ? 'bg-gradient-to-t from-background/90 via-background/30 to-transparent' : 'bg-gradient-to-tr from-background/70 via-transparent to-transparent'}`} />

      <div className="relative h-full p-5 flex flex-col justify-between">
        <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center">
          <Icon className={`w-5 h-5 ${issue.iconColor}`} />
        </div>
        <div className="sm:max-w-[60%]">
          <h3 className="text-lg font-bold text-white leading-tight">{issue.title}</h3>
          <p className={`text-sm text-gray-300 mt-1 ${issue.clamp || 'line-clamp-2'}`}>{issue.desc}</p>
        </div>
      </div>
    </div>
  );
}

function VoucherTicket() {
  const bars = [3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1];

  return (
    <div className="ls-float-slow relative mx-auto w-full max-w-sm">
      <div className="relative rounded-3xl overflow-hidden border border-amber-400/30 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-primary-900/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(245,158,11,0.15)]">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Ticket className="w-5 h-5" /> CivicAI voucher
            </div>
            <Trophy className="w-5 h-5 text-amber-300/70" />
          </div>
          <div className="mt-6 text-3xl font-black text-white tracking-tight">Your reward</div>
          <p className="text-sm text-amber-100/70 mt-1">Earned by reporting issues that got fixed.</p>
        </div>

        <div className="relative">
          <div className="border-t-2 border-dashed border-white/15" />
          <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-background" />
          <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-background" />
        </div>

        <div className="p-6 flex items-end justify-between gap-4">
          <div className="flex items-end gap-[3px] h-10">
            {bars.map((b, i) => (
              <span key={i} className="bg-white/40 h-full" style={{ width: b * 2 }} />
            ))}
          </div>
          <span className="text-sm font-semibold text-amber-200 text-right">Redeem with your credits</span>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="border-b border-white/10">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-5 text-left min-h-[56px]"
      >
        <span className="text-lg font-semibold text-white">{item.q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-primary-400' : ''}`} />
      </button>
      {open && <p className="pb-5 pr-10 text-gray-400 leading-relaxed">{item.a}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);

  const goDashboard = () => navigate(DASHBOARD_ROUTES[user?.role] || '/dashboard');

  return (
    <PageTransition className="min-h-screen bg-background font-sans selection:bg-primary-500 selection:text-white">
      <style>{`
        @keyframes ls-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes ls-ping { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes ls-twinkle { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes ls-glow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .ls-twinkle { animation: ls-twinkle 4s ease-in-out infinite; }
        .ls-glow { animation: ls-glow 3s ease-in-out infinite; }
        .ls-float-slow { animation: ls-float 8s ease-in-out infinite; }
        .ls-ping { transform-box: fill-box; transform-origin: center; animation: ls-ping 1.6s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ls-float-slow, .ls-ping, .ls-twinkle, .ls-glow { animation: none; }
        }
      `}</style>

      {/* Navigation Bar */}
      <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-xl bg-background/50 border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-primary-500/50 transition-all duration-300">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">CivicAI</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-400 font-medium hover:text-white transition-colors">How it Works</a>
              <a href="#features" className="text-gray-400 font-medium hover:text-white transition-colors">Features</a>
              <a href="#rewards" className="text-gray-400 font-medium hover:text-white transition-colors">Rewards</a>
              <a href="#faq" className="text-gray-400 font-medium hover:text-white transition-colors">FAQ</a>
              {user ? (
                <Button onClick={goDashboard} icon={ArrowRight}>
                  Dashboard
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/login')} className="text-gray-300 font-semibold hover:text-white transition-colors flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Login
                  </button>
                  <Button onClick={() => navigate('/register')}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Phones: keep login reachable */}
            <div className="flex md:hidden items-center gap-3">
              {user ? (
                <Button onClick={goDashboard} className="!py-2 !px-4 !text-sm">
                  Dashboard
                </Button>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="text-gray-300 text-sm font-semibold hover:text-white transition-colors min-h-[44px] px-1">
                    Login
                  </button>
                  <Button onClick={() => navigate('/register')} className="!py-2 !px-4 !text-sm">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden pt-24 pb-12 sm:pb-14 lg:pt-28 lg:pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-20 pointer-events-none">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="absolute top-20 -right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-40 w-72 h-72 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 tracking-tight leading-[1.05]">
                Fix your city's problems{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
                  with a single tap.
                </span>
              </h1>

              <p className="text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                Report a local issue with a photo. AI sends it to the right department, you follow it to the fix, and you earn vouchers along the way.
              </p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4">
                <Button onClick={() => navigate('/submit-complaint')} className="w-full sm:w-auto px-8 py-4 text-lg" icon={FileText}>
                  File a Complaint
                </Button>
                <Button variant="secondary" onClick={() => navigate('/track')} className="w-full sm:w-auto px-8 py-4 text-lg" icon={Activity}>
                  Track Status
                </Button>
              </div>
            </div>

            <PhoneDemo />
            <StreetDemo />
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-0 lg:divide-x lg:divide-white/10">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 lg:px-6 first:lg:pl-0 last:lg:pr-0">
              <Icon className="w-6 h-6 text-primary-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white">{title}</div>
                <div className="text-sm text-gray-400 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What you can report */}
      <div className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-4xl font-black text-white mb-4">What you can report</h2>
            <p className="text-lg text-gray-400">From potholes to pending certificates, if it needs the municipality, it can go in. We send it to the team that handles it.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[170px] md:auto-rows-[190px]">
            {ISSUES.map((issue) => (
              <IssueTile key={issue.title} issue={issue} />
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="py-24 relative overflow-hidden scroll-mt-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">How it works</h2>
            <p className="text-xl text-gray-400">From your phone to a fixed street.</p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary-500/60 via-purple-500/60 to-primary-500/60"></div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6 text-center">
              {JOURNEY.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="relative">
                  <div className="w-16 h-16 mx-auto bg-background rounded-2xl border border-primary-500/50 flex items-center justify-center text-primary-400 mb-5 shadow-[0_0_30px_rgba(99,102,241,0.15)] relative z-10">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-[240px] mx-auto">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-transparent p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <ShieldCheck className="w-7 h-7 text-amber-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">When the AI is not sure</h3>
                <p className="text-gray-400 mt-1 max-w-3xl">
                  If the photo does not match the text, or the AI is not confident, your complaint is held back. No department sees it until the Mayor's office has looked at it. Then one of three things happens.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {REVIEW_OUTCOMES.map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl bg-background/60 border border-white/10 p-4">
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color}`} />
                  <div>
                    <div className="font-bold text-white">{title}</div>
                    <div className="text-sm text-gray-400 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="pb-24 relative scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Why use CivicAI?</h2>
            <p className="text-lg text-gray-400">A transparent, accountable and next-generation grievance redressal system.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="w-12 h-12 bg-primary-500/20 text-primary-400 rounded-2xl flex items-center justify-center mb-5 border border-primary-500/30">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">AI Support Assistant</h3>
              <p className="text-gray-400 leading-relaxed">Our Gemini-powered chatbot helps you file complaints and fetches real-time updates directly from our database.</p>

              <div className="mt-6 space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary-600 to-indigo-600 text-white text-sm px-4 py-2.5">
                    Where is my street light complaint?
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-400" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white/10 border border-white/10 text-gray-200 text-sm px-4 py-2.5">
                    It is in progress. The Electricity Board has assigned a worker.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-5 border border-emerald-500/30">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Live Tracking</h3>
              <p className="text-gray-400 leading-relaxed">No more waiting in the dark. Track the exact status of your complaint, right down to the assigned worker.</p>

              <ul className="mt-6 space-y-0">
                {[
                  { label: 'Complaint filed', done: true },
                  { label: 'Routed to Electricity Board', done: true },
                  { label: 'Worker assigned', done: true },
                  { label: 'Resolved', done: false }
                ].map((row, i, arr) => (
                  <li key={row.label} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${row.done ? 'bg-emerald-500' : 'bg-white/10 border border-white/15'}`}>
                        {row.done && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      {i < arr.length - 1 && <div className={`w-px h-7 ${row.done ? 'bg-emerald-500/60' : 'bg-white/10'}`} />}
                    </div>
                    <span className={`text-sm pt-0.5 ${row.done ? 'text-gray-200' : 'text-gray-500'}`}>{row.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* City strip after the first three sections, with a content box over it */}
      <div className="relative">
        <div className="h-[150px] sm:h-[190px] lg:h-[230px] pointer-events-none" aria-hidden="true">
          <Skyline idPrefix="ls2" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 -mt-14 sm:-mt-16">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6">
            <div className="text-sm font-semibold text-white mb-4">What each status on your tracker means</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-0 lg:divide-x lg:divide-white/10">
              {STATUS_GUIDE.map(({ label, icon: Icon, badge, desc }) => (
                <div key={label} className="lg:px-6 first:lg:pl-0 last:lg:pr-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                  <p className="text-sm text-gray-400 mt-2">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div id="rewards" className="py-24 relative overflow-hidden scroll-mt-24">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500 rounded-full mix-blend-screen filter blur-[140px] opacity-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="text-4xl font-black text-white mb-4">Report a problem. Earn a voucher.</h2>
              <p className="text-lg text-gray-400 mb-8 max-w-xl">
                Every complaint that gets resolved earns you 10 credits. Redeem your credits for vouchers.
              </p>

              <ol className="space-y-5">
                {[
                  'File a genuine complaint with a clear photo',
                  'Get 10 credits when the department resolves it',
                  'Redeem your credits for a voucher'
                ].map((text, i) => (
                  <li key={text} className="flex items-center gap-4">
                    <span className="w-9 h-9 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-200 font-medium">{text}</span>
                  </li>
                ))}
              </ol>

              <p className="text-sm text-gray-500 mt-8 max-w-md">Fake or repeated reports cost credits, so keep every report honest.</p>
            </div>

            <VoucherTicket />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="py-24 relative scroll-mt-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl font-black text-white mb-8">Questions people ask</h2>
          <div className="border-t border-white/10">
            {FAQS.map((item, i) => (
              <FaqItem key={item.q} item={item} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
            ))}
          </div>
        </div>
      </div>

      {/* Closing call to action */}
      <div className="pb-24 relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary-600/20 via-purple-600/10 to-transparent backdrop-blur-xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">See something broken on your street?</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">Report it now. It takes a photo and a few words.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              {user ? (
                <Button onClick={goDashboard} className="w-full sm:w-auto px-8 py-4 text-lg" icon={ArrowRight}>
                  Go to Dashboard
                </Button>
              ) : (
                <Button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 text-lg">
                  Create a free account
                </Button>
              )}
              <Button variant="secondary" onClick={() => navigate('/submit-complaint')} className="w-full sm:w-auto px-8 py-4 text-lg" icon={FileText}>
                File a Complaint
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold text-white">CivicAI</span>
          </div>
          <p className="text-gray-500 text-sm font-medium">© {new Date().getFullYear()} Smart Grievance Redressal System. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-semibold">
            <button onClick={() => navigate('/admin-login')} className="text-gray-500 hover:text-white transition-colors">Admin Portal</button>
            <button onClick={() => navigate('/login')} className="text-gray-500 hover:text-white transition-colors">Citizen Login</button>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
}
