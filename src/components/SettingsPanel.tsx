import React from 'react';
import {
  Download,
  Film,
  FolderOpen,
  Globe,
  HardDrive,
  ListMusic,
  MonitorSmartphone,
  RefreshCw,
  RotateCcw,
  Scissors,
  Sliders,
  Sparkles,
  Sun,
  Volume2,
} from 'lucide-react';
import { AppSettings } from '../types/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AudioStudioTab } from './AudioToolsModal';

interface SettingsPanelProps {
  settings: AppSettings;
  storageStats: { usedMB: string; trackCount: number };
  onUpdateSettings: (next: AppSettings) => void;
  onChooseMusicFolder: () => void;
  onRescanLibrary: () => void;
  onOpenEqualizer: () => void;
  onOpenPlaylists: () => void;
  onOpenAudioTools?: (tab: AudioStudioTab) => void;
  onResetSettings: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  storageStats,
  onUpdateSettings,
  onChooseMusicFolder,
  onRescanLibrary,
  onOpenEqualizer,
  onOpenPlaylists,
  onOpenAudioTools,
  onResetSettings,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const patch = (partial: Partial<AppSettings>) => {
    onUpdateSettings({ ...settings, ...partial });
  };

  return (
    <div className="h-full overflow-y-auto neon-scroll space-y-4 pr-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">الإعدادات</h2>
          <p className="text-xs text-white/60">تخصيص الصوت والمؤثرات البصرية والمكتبة المحلية</p>
        </div>

        <div className="flex items-center gap-2">
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={() => void install()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-[0_0_18px_rgba(0,229,255,0.4)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت كتطبيق مستقل</span>
            </button>
          )}
          <button
            type="button"
            onClick={onResetSettings}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-pink-500/25 border border-white/15 text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط الإعدادات</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Music Folder & Rescan */}
        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
            <FolderOpen className="w-4 h-4" />
            <span>مجلد الموسيقى والمكتبة</span>
          </div>
          <div className="text-xs text-white/70">
            المجلد الحالي: <span className="text-white font-semibold">{settings.musicFolderName}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onChooseMusicFolder}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/25 border border-cyan-400/60 text-xs font-semibold hover:bg-cyan-500/35 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>اختيار مجلد الموسيقى</span>
            </button>
            <button
              type="button"
              onClick={onRescanLibrary}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold hover:bg-white/15 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث مكتبة الأغاني</span>
            </button>
          </div>
        </div>

        {/* Audio & Autoplay Settings */}
        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
            <Volume2 className="w-4 h-4" />
            <span>إعدادات الصوت والتشغيل التلقائي</span>
          </div>
          <label className="flex items-center justify-between gap-3 text-xs cursor-pointer">
            <span>التشغيل التلقائي للأغنية التالية</span>
            <input
              type="checkbox"
              checked={settings.autoPlay}
              onChange={(e) => patch({ autoPlay: e.target.checked })}
              className="w-4 h-4 accent-cyan-400"
            />
          </label>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span>مستوى الصوت الافتراضي</span>
            <span className="font-mono-nums text-cyan-300">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.volume}
            onChange={(e) => patch({ volume: Number(e.target.value), muted: false })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Equalizer & Playlists */}
        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
            <Sliders className="w-4 h-4" />
            <span>المعادل وقوائم التشغيل</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenEqualizer}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-xs font-semibold hover:bg-cyan-500/30 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>إعدادات المعادل الصوتي</span>
            </button>
            <button
              type="button"
              onClick={onOpenPlaylists}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-400/50 text-xs font-semibold hover:bg-purple-500/30 cursor-pointer"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>إدارة قوائم التشغيل</span>
            </button>
            {onOpenAudioTools && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAudioTools('trim')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold hover:bg-white/15 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 text-cyan-300" />
                  <span>قص الصوتيات</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAudioTools('video_to_mp3')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold hover:bg-white/15 cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5 text-pink-300" />
                  <span>تحويل فيديو إلى MP3</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Visual Effects & Glow Level */}
        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-pink-300">
            <Sparkles className="w-4 h-4" />
            <span>المؤثرات البصرية ومستوى الإضاءة</span>
          </div>
          <label className="flex items-center justify-between gap-3 text-xs cursor-pointer">
            <span>تفعيل المؤثرات البصرية المتزامنة</span>
            <input
              type="checkbox"
              checked={settings.visualEffectsEnabled}
              onChange={(e) => patch({ visualEffectsEnabled: e.target.checked })}
              className="w-4 h-4 accent-cyan-400"
            />
          </label>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-cyan-300" />
              مستوى توهج النيون
            </span>
            <span className="font-mono-nums text-cyan-300">{Math.round(settings.glowLevel * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.3}
            max={1.4}
            step={0.05}
            value={settings.glowLevel}
            onChange={(e) => patch({ glowLevel: Number(e.target.value) })}
            className="w-full accent-pink-400 cursor-pointer"
          />
        </div>

        {/* Language & Display Layout */}
        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
            <Globe className="w-4 h-4" />
            <span>اللغة ونمط الواجهة</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => patch({ language: 'ar' })}
              className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                settings.language === 'ar'
                  ? 'bg-cyan-500/25 border-cyan-400 text-white'
                  : 'bg-white/5 border-white/10 text-white/65'
              }`}
            >
              العربية (RTL)
            </button>
            <button
              type="button"
              onClick={() => patch({ language: 'en' })}
              className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                settings.language === 'en'
                  ? 'bg-cyan-500/25 border-cyan-400 text-white'
                  : 'bg-white/5 border-white/10 text-white/65'
              }`}
            >
              English (LTR)
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70 pt-1">
            <MonitorSmartphone className="w-3.5 h-3.5 text-purple-300" />
            <span>تبديل نمط التصميم</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'auto', label: 'تلقائي' },
              { id: 'desktop', label: 'كمبيوتر' },
              { id: 'mobile', label: 'هاتف' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => patch({ layoutPreference: opt.id as AppSettings['layoutPreference'] })}
                className={`py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                  settings.layoutPreference === opt.id
                    ? 'bg-purple-500/30 border-purple-400 text-white'
                    : 'bg-white/5 border-white/10 text-white/65'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Local Storage */}
        <div className="rounded-2xl bg-white/6 border border-white/12 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
            <HardDrive className="w-4 h-4" />
            <span>إعدادات التخزين المحلي</span>
          </div>
          <div className="text-xs text-white/75 flex items-center justify-between">
            <span>عدد المقاطع المحفوظة:</span>
            <span className="font-mono-nums font-bold text-cyan-300">{storageStats.trackCount}</span>
          </div>
          <div className="text-xs text-white/75 flex items-center justify-between">
            <span>المساحة المستخدمة محلياً:</span>
            <span className="font-mono-nums font-bold text-cyan-300">{storageStats.usedMB} MB</span>
          </div>
          <p className="text-[11px] text-white/55 leading-relaxed">
            يتم حفظ جميع الملفات وقوائم التشغيل والمفضلة وسجل الاستماع في قاعدة بيانات IndexedDB المحلية
            دون اتصال بالإنترنت.
          </p>
        </div>
      </div>
    </div>
  );
};
