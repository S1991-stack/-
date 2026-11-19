import React, { useEffect, useRef } from 'react';

interface DesktopSpectrumBarsProps {
  getFrequencyData: () => Uint8Array<ArrayBuffer>;
  isPlaying: boolean;
  visualEffectsEnabled: boolean;
}

const BAR_COUNT = 26;

export const DesktopSpectrumBars: React.FC<DesktopSpectrumBarsProps> = ({
  getFrequencyData,
  isPlaying,
  visualEffectsEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothedRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));

  useEffect(() => {
    let rafId = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(200, Math.floor(rect.width * dpr));
      const height = Math.max(60, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const freq = getFrequencyData();
      const baselineY = height * 0.76;
      const maxBarH = height * 0.7;
      const gap = width * 0.011;
      const barW = (width - gap * (BAR_COUNT - 1)) / BAR_COUNT;
      const segH = Math.max(3 * dpr, Math.floor(maxBarH / 14));
      const segGap = Math.max(2 * dpr, segH * 0.32);

      for (let i = 0; i < BAR_COUNT; i++) {
        const binIdx = Math.min(freq.length - 1, Math.floor((i / BAR_COUNT) * 68) + 1);
        const raw = visualEffectsEnabled
          ? isPlaying
            ? freq[binIdx] / 255
            : 0.14 + 0.08 * Math.sin(i * 0.65)
          : 0.12;

        // Smooth attack / gentle release
        const prev = smoothedRef.current[i];
        const next = raw > prev ? prev + (raw - prev) * 0.45 : prev + (raw - prev) * 0.18;
        smoothedRef.current[i] = next;

        const targetH = Math.max(segH * 2, next * maxBarH);
        const segCount = Math.max(1, Math.floor(targetH / (segH + segGap)));
        const x = i * (barW + gap);

        // Smooth neon color transition from Cyan (#00E5FF) -> Blue (#3B82F6) -> Purple (#8B5CF6) -> Magenta (#EC4899)
        const t = i / (BAR_COUNT - 1);
        let r = 0;
        let g = 229;
        let b = 255;
        if (t < 0.35) {
          const k = t / 0.35;
          r = Math.round(0 + k * 59);
          g = Math.round(229 - k * 99);
          b = Math.round(255 - k * 9);
        } else if (t < 0.7) {
          const k = (t - 0.35) / 0.35;
          r = Math.round(59 + k * 90);
          g = Math.round(130 - k * 48);
          b = Math.round(246 - k * 4);
        } else {
          const k = (t - 0.7) / 0.3;
          r = Math.round(149 + k * 87);
          g = Math.round(82 - k * 10);
          b = Math.round(242 - k * 89);
        }

        const color = `rgb(${r}, ${g}, ${b})`;
        ctx.fillStyle = color;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.65)`;
        ctx.shadowBlur = 8 * dpr;

        // Main upward segmented blocks
        for (let s = 0; s < segCount; s++) {
          const y = baselineY - (s + 1) * (segH + segGap);
          ctx.beginPath();
          ctx.roundRect(x, y, barW, segH, 2 * dpr);
          ctx.fill();
        }

        // Mirror reflection underneath
        ctx.shadowBlur = 0;
        const reflCount = Math.min(4, Math.ceil(segCount * 0.4));
        for (let s = 0; s < reflCount; s++) {
          const y = baselineY + 3 * dpr + s * (segH + segGap);
          const alpha = Math.max(0.04, 0.28 - s * 0.07);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, segH * 0.85, 2 * dpr);
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [getFrequencyData, isPlaying, visualEffectsEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 md:h-28 pointer-events-none"
      aria-label="المعادل البصري المتزامن"
    />
  );
};
