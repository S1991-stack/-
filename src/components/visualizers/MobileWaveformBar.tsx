import React, { useEffect, useRef } from 'react';

interface MobileWaveformBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  getFrequencyData: () => Uint8Array<ArrayBuffer>;
  isPlaying: boolean;
  visualEffectsEnabled: boolean;
}

const BAR_COUNT = 44;

// Base symmetrical envelope resembling Reference Image 1
const BASE_SHAPE = Array.from({ length: BAR_COUNT }, (_, i) => {
  const n = i / (BAR_COUNT - 1);
  const env = Math.sin(Math.PI * n);
  const mod = 0.45 + 0.55 * Math.abs(Math.sin(i * 0.85) * Math.cos(i * 0.42));
  return Math.max(0.14, env * mod);
});

// Bright Neon gradient colors across the spectrum: Cyan -> Electric Blue -> Purple -> Neon Pink
function getNeonBarColor(index: number): { r: number; g: number; b: number } {
  const t = index / (BAR_COUNT - 1);
  if (t < 0.35) {
    const k = t / 0.35;
    return {
      r: Math.round(0 + k * 59),
      g: Math.round(229 - k * 99),
      b: Math.round(255 - k * 9),
    };
  }
  if (t < 0.7) {
    const k = (t - 0.35) / 0.35;
    return {
      r: Math.round(59 + k * 109),
      g: Math.round(130 - k * 45),
      b: Math.round(246 + k * 1),
    };
  }
  const k = (t - 0.7) / 0.3;
  return {
    r: Math.round(168 + k * 68),
    g: Math.round(85 - k * 13),
    b: Math.round(247 - k * 94),
  };
}

const NEON_PALETTE = Array.from({ length: BAR_COUNT }, (_, i) => getNeonBarColor(i));

export const MobileWaveformBar: React.FC<MobileWaveformBarProps> = ({
  currentTime,
  duration,
  onSeek,
  getFrequencyData,
  isPlaying,
  visualEffectsEnabled,
}) => {
  const barsRef = useRef<HTMLDivElement | null>(null);
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const container = barsRef.current;
      if (container) {
        const freq = getFrequencyData();
        const children = container.children;
        for (let i = 0; i < children.length; i++) {
          const base = BASE_SHAPE[i];
          const bin = freq[(i * 2) % 64] ?? 0;
          const boost = visualEffectsEnabled && isPlaying ? (bin / 255) * 0.58 : 0;
          const hPct = Math.max(14, Math.min(100, Math.round((base * 0.72 + boost) * 100)));
          (children[i] as HTMLElement).style.height = `${hPct}%`;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [getFrequencyData, isPlaying, visualEffectsEnabled]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div
      dir="ltr"
      role="slider"
      aria-label="شريط تقدم الأغنية"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration || 100)}
      aria-valuenow={Math.round(currentTime)}
      tabIndex={0}
      onClick={handleClick}
      className="w-full h-14 flex items-center justify-between gap-[2.5px] cursor-pointer select-none px-1"
    >
      <div ref={barsRef} className="w-full h-full flex items-center justify-between gap-[2.5px]">
        {BASE_SHAPE.map((v, i) => {
          const barRatio = i / (BAR_COUNT - 1);
          const isPlayed = barRatio <= progress;
          const { r, g, b } = NEON_PALETTE[i];
          const background = isPlayed
            ? `linear-gradient(to top, rgb(${r}, ${g}, ${b}), rgba(255, 255, 255, 0.92))`
            : `rgba(${r}, ${g}, ${b}, 0.36)`;
          const boxShadow = isPlayed
            ? `0 0 10px rgba(${r}, ${g}, ${b}, 0.9), 0 0 18px rgba(${r}, ${g}, ${b}, 0.45)`
            : `0 0 6px rgba(${r}, ${g}, ${b}, 0.2)`;

          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-[background,box-shadow] duration-150"
              style={{
                height: `${Math.round(v * 78)}%`,
                minWidth: '2.5px',
                background,
                boxShadow,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
