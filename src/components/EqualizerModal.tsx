import React from 'react';
import { Sliders, X, RotateCcw, Power } from 'lucide-react';
import { EQUALIZER_PRESETS, EQ_FREQ_LABELS } from '../core/equalizerPresets';
import { EqualizerPresetId, EqualizerSettings } from '../types/audio';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equalizer: EqualizerSettings;
  onUpdate: (partial: Partial<EqualizerSettings>) => void;
  onSelectPreset: (presetId: EqualizerPresetId) => void;
  variant?: 'desktop' | 'mobile';
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  equalizer,
  onUpdate,
  onSelectPreset,
  variant = 'desktop',
}) => {
  if (!isOpen) return null;

  const isMobile = variant === 'mobile';
  const accentRing = isMobile
    ? 'border-purple-400/35 shadow-[0_0_50px_rgba(139,92,246,0.35)] bg-[#140D2E]/95'
    : 'border-cyan-400/35 shadow-[0_0_50px_rgba(0,229,255,0.28)] bg-[#060E2A]/95';

  const handleBandChange = (idx: number, val: number) => {
    const nextBands = [...equalizer.bands];
    nextBands[idx] = val;
    onUpdate({ preset: 'custom', bands: nextBands, enabled: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto neon-scroll rounded-3xl border backdrop-blur-2xl p-5 sm:p-7 text-white ${accentRing}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isMobile
                  ? 'bg-purple-500/25 border border-purple-400/40 text-purple-300'
                  : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
              }`}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">المعادل الصوتي الاحترافي</h2>
              <p className="text-xs text-white/60">معالجة صوتية فورية بتقنية Web Audio DSP</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdate({ enabled: !equalizer.enabled })}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                equalizer.enabled
                  ? isMobile
                    ? 'bg-purple-500/30 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,229,255,0.35)]'
                  : 'bg-white/5 border-white/15 text-white/50'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{equalizer.enabled ? 'مفعّل' : 'معطّل'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPreset('flat')}
              title="إعادة ضبط المعادل"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="mt-5">
          <div className="text-xs font-semibold text-white/70 mb-2.5">الإعدادات الجاهزة (Presets)</div>
          <div className="flex flex-wrap gap-2">
            {EQUALIZER_PRESETS.map((preset) => {
              const active = equalizer.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer whitespace-nowrap ${
                    active
                      ? isMobile
                        ? 'bg-purple-600 border-purple-300 text-white shadow-[0_0_16px_rgba(168,85,247,0.55)]'
                        : 'bg-cyan-500/30 border-cyan-400 text-cyan-100 shadow-[0_0_16px_rgba(0,229,255,0.4)]'
                      : 'bg-white/5 border-white/15 text-white/75 hover:bg-white/10'
                  }`}
                >
                  {preset.nameAr}
                </button>
              );
            })}
            {equalizer.preset === 'custom' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-pink-400/50 bg-pink-500/20 text-pink-200">
                مخصص
              </span>
            )}
          </div>
        </div>

        {/* Bass, Treble, Balance Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-cyan-300">الباس (Bass)</span>
              <span className="font-mono-nums text-white/80">
                {equalizer.bass > 0 ? `+${equalizer.bass}` : equalizer.bass} dB
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={equalizer.bass}
              onChange={(e) =>
                onUpdate({ preset: 'custom', bass: Number(e.target.value), enabled: true })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-purple-300">الحدة (Treble)</span>
              <span className="font-mono-nums text-white/80">
                {equalizer.treble > 0 ? `+${equalizer.treble}` : equalizer.treble} dB
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={equalizer.treble}
              onChange={(e) =>
                onUpdate({ preset: 'custom', treble: Number(e.target.value), enabled: true })
              }
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-pink-300">التوازن (Balance)</span>
              <span className="font-mono-nums text-white/80">
                {equalizer.balance === 0
                  ? 'وسط'
                  : equalizer.balance < 0
                  ? `يسار ${Math.round(Math.abs(equalizer.balance) * 100)}%`
                  : `يمين ${Math.round(equalizer.balance * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              dir="ltr"
              value={equalizer.balance}
              onChange={(e) => onUpdate({ balance: Number(e.target.value), enabled: true })}
              className="w-full accent-pink-400 cursor-pointer"
            />
          </div>
        </div>

        {/* 10-Band Frequency Sliders */}
        <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5">
          <div className="text-xs font-semibold text-white/75 mb-4">
            الترددات التفصيلية (10 نطاقات ترددية)
          </div>
          <div dir="ltr" className="grid grid-cols-5 sm:grid-cols-10 gap-3 items-end">
            {EQ_FREQ_LABELS.map((label, idx) => {
              const val = equalizer.bands[idx] ?? 0;
              return (
                <div key={label} className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-mono-nums text-cyan-300">
                    {val > 0 ? `+${val}` : val}
                  </span>
                  <div className="h-32 flex items-center justify-center">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={val}
                      onChange={(e) => handleBandChange(idx, Number(e.target.value))}
                      aria-label={`نطاق ${label}`}
                      className="w-28 -rotate-90 accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] font-mono-nums text-white/65">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
