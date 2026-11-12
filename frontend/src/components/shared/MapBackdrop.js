import React from 'react';

// A faint city street map with pulsing complaint pins and a dashed route.
// Used behind the login, register and admin pages instead of the skyline.
const H_STREETS = [120, 260, 400, 540, 680];
const V_STREETS = [160, 340, 520, 700, 880, 1060];
const PINS = [[340, 260], [880, 400], [520, 540], [1060, 260], [160, 680], [700, 120]];

export default function MapBackdrop({ color = '#818cf8' }) {
  const fade = 'radial-gradient(ellipse at center, #000 40%, transparent 95%)';

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
      style={{ WebkitMaskImage: fade, maskImage: fade }}
    >
      <style>{`
        @keyframes mb-ping { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(3); opacity: 0; } }
        @keyframes mb-dash { to { stroke-dashoffset: -72; } }
        .mb-ping { transform-box: fill-box; transform-origin: center; animation: mb-ping 3s ease-out infinite; }
        .mb-dash { animation: mb-dash 6s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .mb-ping, .mb-dash { animation: none; }
        }
      `}</style>

      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full block">
        {/* parks and open ground */}
        <rect x="190" y="145" width="130" height="95" rx="14" fill="#ffffff" fillOpacity="0.03" />
        <rect x="720" y="425" width="140" height="95" rx="14" fill="#ffffff" fillOpacity="0.03" />
        <rect x="540" y="570" width="140" height="90" rx="14" fill="#ffffff" fillOpacity="0.03" />

        {/* streets */}
        {H_STREETS.map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="1200" y2={y} stroke="#ffffff" strokeOpacity={y === 400 ? 0.11 : 0.06} strokeWidth={y === 400 ? 4 : 2} />
        ))}
        {V_STREETS.map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="800" stroke="#ffffff" strokeOpacity={x === 700 ? 0.11 : 0.06} strokeWidth={x === 700 ? 4 : 2} />
        ))}
        <line x1="0" y1="640" x2="1200" y2="180" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="3" />
        <ellipse cx="600" cy="400" rx="430" ry="260" fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="2" strokeDasharray="6 10" />

        {/* route a complaint takes */}
        <path d="M340 260 H520 V400 H880" fill="none" stroke={color} strokeOpacity="0.55" strokeWidth="3" strokeDasharray="8 10" strokeLinecap="round" className="mb-dash" />

        {/* complaint pins */}
        {PINS.map(([x, y], i) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="9" fill="none" stroke={color} strokeWidth="2" className="mb-ping" style={{ animationDelay: `${i * 0.7}s` }} />
            <circle cx={x} cy={y} r="5" fill={color} />
          </g>
        ))}
      </svg>
    </div>
  );
}
