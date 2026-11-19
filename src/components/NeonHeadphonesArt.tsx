import React, { useEffect, useRef } from 'react';

interface NeonHeadphonesArtProps {
  getFrequencyData: () => Uint8Array<ArrayBuffer>;
  isPlaying: boolean;
  visualEffectsEnabled: boolean;
}

export const NeonHeadphonesArt: React.FC<NeonHeadphonesArtProps> = ({
  getFrequencyData,
  isPlaying,
  visualEffectsEnabled,
}) => {
  const barsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    const render = () => {
      const container = barsRef.current;
      if (container) {
        const freq = getFrequencyData();
        const cols = container.children;
        for (let i = 0; i < cols.length; i++) {
          const val = visualEffectsEnabled && isPlaying ? freq[i * 3 + 2] ?? 0 : 35 + ((i * 19) % 45);
          const pct = Math.max(16, Math.min(96, Math.round((val / 255) * 100)));
          (cols[i] as HTMLElement).style.height = `${pct}%`;
        }
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [getFrequencyData, isPlaying, visualEffectsEnabled]);

  return (
    <div className="relative w-full h-36 flex items-end justify-center overflow-hidden select-none">
      {/* Background cyan vertical segmented bars matching Image 2 bottom-left */}
      <div
        ref={barsRef}
        className="absolute inset-x-2 bottom-3 h-24 flex items-end justify-between gap-1 opacity-70 pointer-events-none"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-t-sm transition-[height] duration-75"
            style={{
              height: `${28 + ((i * 17) % 55)}%`,
              background:
                'repeating-linear-gradient(to top, rgba(0,229,255,0.95) 0px, rgba(0,229,255,0.95) 3px, transparent 3px, transparent 5px)',
              boxShadow: '0 0 8px rgba(0, 229, 255, 0.45)',
            }}
          />
        ))}
      </div>

      {/* Glowing Floor Ellipse */}
      <div
        className="absolute bottom-2 w-32 h-5 rounded-full blur-md pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,229,255,0.75) 0%, rgba(139,92,246,0.35) 60%, transparent 100%)',
        }}
      />

      {/* Sleek 3D Neon Headphones SVG */}
      <svg
        viewBox="0 0 180 150"
        className="relative z-10 w-32 h-32 drop-shadow-[0_0_16px_rgba(0,229,255,0.55)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hp-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="hp-cup-l" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="hp-cup-r" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
        </defs>
        {/* Headband */}
        <path
          d="M36 92 C36 30, 144 30, 144 92"
          fill="none"
          stroke="url(#hp-band)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M44 92 C44 40, 136 40, 136 92"
          fill="none"
          stroke="#0A1230"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Left Ear Cup */}
        <rect x="22" y="76" width="28" height="48" rx="14" fill="url(#hp-cup-l)" stroke="#00E5FF" strokeWidth="2.5" />
        <rect x="44" y="82" width="10" height="36" rx="5" fill="#06122E" stroke="#38BDF8" strokeWidth="1.5" />
        {/* Right Ear Cup */}
        <rect x="130" y="76" width="28" height="48" rx="14" fill="url(#hp-cup-r)" stroke="#EC4899" strokeWidth="2.5" />
        <rect x="126" y="82" width="10" height="36" rx="5" fill="#160B2E" stroke="#C084FC" strokeWidth="1.5" />
        {/* Inner glowing highlights */}
        <circle cx="36" cy="100" r="6" fill="#00E5FF" opacity="0.6" />
        <circle cx="144" cy="100" r="6" fill="#EC4899" opacity="0.6" />
      </svg>
    </div>
  );
};
