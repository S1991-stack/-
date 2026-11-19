import React, { useEffect, useRef } from 'react';

interface CenterMiniVisualizerProps {
  getFrequencyData: () => Uint8Array<ArrayBuffer>;
  isPlaying: boolean;
  visualEffectsEnabled: boolean;
  variant: 'flank' | 'under-artist';
}

export const CenterMiniVisualizer: React.FC<CenterMiniVisualizerProps> = ({
  getFrequencyData,
  isPlaying,
  visualEffectsEnabled,
  variant,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const count = variant === 'flank' ? 6 : 14;

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const el = containerRef.current;
      if (el) {
        const freq = getFrequencyData();
        const children = el.children;
        for (let i = 0; i < children.length; i++) {
          const bin = freq[i * 3 + 4] ?? 0;
          const level =
            visualEffectsEnabled && isPlaying
              ? Math.max(18, Math.min(100, Math.round((bin / 255) * 100)))
              : 24 + ((i * 23) % 52);
          (children[i] as HTMLElement).style.height = `${level}%`;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [getFrequencyData, isPlaying, visualEffectsEnabled]);

  if (variant === 'under-artist') {
    return (
      <div className="flex flex-col items-center w-44 mt-3">
        <div ref={containerRef} className="w-full h-8 flex items-end justify-center gap-1">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 rounded-t-[2px] transition-[height] duration-75"
              style={{
                height: `${30 + ((i * 19) % 60)}%`,
                background:
                  'repeating-linear-gradient(to top, #00E5FF 0px, #00E5FF 3px, transparent 3px, transparent 5px)',
                boxShadow: '0 0 8px rgba(0,229,255,0.55)',
              }}
            />
          ))}
        </div>
        <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#00E5FF]" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-36 flex items-end gap-1 opacity-75 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-2 rounded-t-[2px] transition-[height] duration-75"
          style={{
            height: `${35 + ((i * 21) % 60)}%`,
            background:
              i % 2 === 0
                ? 'repeating-linear-gradient(to top, rgba(0,229,255,0.9) 0px, rgba(0,229,255,0.9) 4px, transparent 4px, transparent 6px)'
                : 'repeating-linear-gradient(to top, rgba(139,92,246,0.85) 0px, rgba(139,92,246,0.85) 4px, transparent 4px, transparent 6px)',
          }}
        />
      ))}
    </div>
  );
};
