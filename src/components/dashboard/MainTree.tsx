'use client';

export default function MainTree({ witherCount }: { witherCount: number }) {
  const health = Math.max(0, 100 - (witherCount * 10));
  const isWithered = health < 50;
  
  return (
    <div className="relative w-72 h-72 flex flex-col items-center justify-end">
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="ink-bleed">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
          </filter>
        </defs>
      </svg>

      <svg viewBox="0 0 200 300" className="w-full h-full z-10" style={{ filter: 'url(#ink-bleed)' }}>
        <path d="M95,300 C95,250 85,200 100,150 C115,100 100,50 100,50" stroke="#1c1917" strokeWidth="6" fill="none" strokeLinecap="square" />
        {health > 20 && <path d="M100,150 C80,130 60,140 50,120" stroke="#1c1917" strokeWidth="3" fill="none" />}
        {health > 40 && <path d="M100,120 C120,100 140,110 150,90" stroke="#1c1917" strokeWidth="3" fill="none" />}
        
        {health > 0 && (
          <g className="transition-colors duration-1000" fill={isWithered ? "#9a3412" : "#14532d"}>
            <circle cx="100" cy="50" r={health > 80 ? "25" : "10"} opacity="0.9" />
            {health > 40 && <circle cx="50" cy="120" r="15" opacity="0.8" />}
            {health > 60 && <circle cx="150" cy="90" r="20" opacity="0.8" />}
            {health > 90 && <circle cx="80" cy="80" r="18" opacity="0.7" />}
          </g>
        )}
      </svg>
      
      <div className="mt-4 border-y-2 border-stone-900 py-1 px-4">
        <span className="font-mono text-xs font-black uppercase tracking-widest text-stone-900">
          Vitality: {health}%
        </span>
      </div>
    </div>
  );
}