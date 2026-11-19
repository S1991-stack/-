import React, { useState } from 'react';
import {
  Clock,
  Film,
  FolderPlus,
  Heart,
  Home,
  Info,
  ListMusic,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Scissors,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Square,
  Star,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { formatTime } from '../../hooks/useAudioPlayer';
import { AppSettings, AudioTrack, DesktopTab, PlayHistoryEntry, Playlist } from '../../types/audio';
import { AboutPanel } from '../AboutPanel';
import { ArtworkImage } from '../ArtworkImage';
import { AudioStudioTab } from '../AudioToolsModal';
import { LibrarySubViews } from '../LibrarySubViews';
import { NeonHeadphonesArt } from '../NeonHeadphonesArt';
import { SettingsPanel } from '../SettingsPanel';
import { CenterMiniVisualizer } from '../visualizers/CenterMiniVisualizer';
import { DesktopSpectrumBars } from '../visualizers/DesktopSpectrumBars';

interface DesktopPlayerLayoutProps {
  tracks: AudioTrack[];
  activeQueueTracks: AudioTrack[];
  playlists: Playlist[];
  activePlaylistId: string | null;
  favorites: string[];
  history: PlayHistoryEntry[];
  settings: AppSettings;
  storageStats: { usedMB: string; trackCount: number };
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onUpdateSettings: (next: AppSettings) => void;
  onTogglePlayPause: () => void;
  onPlayTrack: (trackId: string, playlistId?: string | null) => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleNightMode: () => void;
  onToggleFavorite: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onImportFiles: () => void;
  onChooseMusicFolder: () => void;
  onRescanLibrary: () => void;
  onResetSettings: () => void;
  onClearHistory: () => void;
  onPlayPlaylist: (playlistId: string) => void;
  onOpenEqualizer: () => void;
  onOpenPlaylistManager: () => void;
  onOpenAudioTools: (tab: AudioStudioTab, track?: AudioTrack) => void;
  getFrequencyData: () => Uint8Array<ArrayBuffer>;
}

export const DesktopPlayerLayout: React.FC<DesktopPlayerLayoutProps> = ({
  tracks,
  activeQueueTracks,
  playlists,
  favorites,
  history,
  settings,
  storageStats,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onUpdateSettings,
  onTogglePlayPause,
  onPlayTrack,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onToggleNightMode,
  onToggleFavorite,
  onDeleteTrack,
  onImportFiles,
  onChooseMusicFolder,
  onRescanLibrary,
  onResetSettings,
  onClearHistory,
  onPlayPlaylist,
  onOpenEqualizer,
  onOpenPlaylistManager,
  onOpenAudioTools,
  getFrequencyData,
}) => {
  const [activeTab, setActiveTab] = useState<DesktopTab>('home');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);

  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const volumePct = settings.muted ? 0 : Math.round(settings.volume * 100);
  const isCurrentFav = currentTrack ? favorites.includes(currentTrack.id) : false;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((v) => !v);
    }
  };

  const navItems: Array<{
    id: DesktopTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
  }> = [
    { id: 'home', label: 'الرئيسية', icon: Home, iconColor: 'text-white' },
    { id: 'library', label: 'مكتبة الموسيقى', icon: Music, iconColor: 'text-white' },
    { id: 'favorites', label: 'المفضلة', icon: Star, iconColor: 'text-amber-400 fill-amber-400' },
    { id: 'history', label: 'سجل التشغيل', icon: Clock, iconColor: 'text-cyan-300' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, iconColor: 'text-cyan-300' },
    { id: 'about', label: 'حول البرنامج', icon: Info, iconColor: 'text-white' },
  ];

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div
      dir="ltr"
      className="relative w-full h-screen min-h-[620px] overflow-hidden flex flex-col select-none bg-[#03081C] text-white"
    >
      {/* Flowing Neon Ribbon Background matching Reference Image 2 */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          settings.nightMode ? 'opacity-35' : 'opacity-95'
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 25% 18%, rgba(0,229,255,0.22) 0%, transparent 48%), radial-gradient(ellipse at 72% 72%, rgba(236,72,153,0.22) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(29,78,216,0.25) 0%, #03081C 78%)',
          }}
        />
        <svg
          viewBox="0 0 1440 820"
          preserveAspectRatio="none"
          className="w-full h-full opacity-85"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="wave-top-cyan" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="wave-bot-pink" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#6366F1" stopOpacity="0.45" />
              <stop offset="78%" stopColor="#EC4899" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.4" />
            </linearGradient>
            <filter id="neon-blur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          {/* Top flowing ribbons */}
          <path
            d="M0,120 C300,20 520,210 860,90 C1120,0 1300,140 1440,80"
            fill="none"
            stroke="url(#wave-top-cyan)"
            strokeWidth="22"
            filter="url(#neon-blur)"
          />
          <path
            d="M0,130 C300,30 520,220 860,100 C1120,10 1300,150 1440,90"
            fill="none"
            stroke="url(#wave-top-cyan)"
            strokeWidth="2.5"
          />
          {/* Bottom flowing ribbons */}
          <path
            d="M0,690 C280,770 500,590 840,670 C1140,740 1280,580 1440,650"
            fill="none"
            stroke="url(#wave-bot-pink)"
            strokeWidth="34"
            filter="url(#neon-blur)"
          />
          <path
            d="M0,685 C280,765 500,585 840,665 C1140,735 1280,575 1440,645"
            fill="none"
            stroke="url(#wave-bot-pink)"
            strokeWidth="3"
          />
          <path
            d="M0,730 C340,640 620,760 980,680 C1200,630 1340,720 1440,690"
            fill="none"
            stroke="#00E5FF"
            strokeOpacity="0.4"
            strokeWidth="1.8"
          />
        </svg>
      </div>

      {/* Top Window Bar (matching Image 2 exactly: Left = Icon + Title, Right = Window Controls) */}
      <header className="relative z-20 flex items-center justify-between px-5 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/15 border border-cyan-400/50 shadow-[0_0_16px_rgba(0,229,255,0.45)]">
            <Music className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="flex items-baseline gap-2.5" dir="rtl">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(0,229,255,0.35)]">
              مشغل الصوت المتطور
            </h1>
            <span className="text-[11px] font-medium text-cyan-300/80 hidden sm:inline">
              SALAH Neon Player
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCompactMode((v) => !v)}
            title="وضع مضغوط"
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            title="ملء الشاشة"
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            title="العودة للرئيسية"
            className="w-8 h-8 rounded-lg hover:bg-pink-500/25 flex items-center justify-center text-white/80 hover:text-pink-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3-Column Body (Physical Left = Sidebar, Center = Stage, Physical Right = Playlist) */}
      <div className="relative z-10 flex-1 min-h-0 px-4 pb-2 grid grid-cols-12 gap-4 items-stretch">
        {/* PHYSICAL LEFT SIDEBAR */}
        <aside className="col-span-3 lg:col-span-2 flex flex-col justify-between rounded-2xl bg-[#050C26]/70 backdrop-blur-xl border border-blue-400/25 p-2.5 shadow-[0_0_30px_rgba(0,0,0,0.45)] min-h-0">
          <nav className="space-y-1.5 overflow-y-auto neon-scroll">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    active
                      ? 'desktop-sidebar-active text-white'
                      : 'text-white/85 hover:bg-white/8 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${item.iconColor}`} />
                  <span dir="rtl" className="truncate flex-1 text-end">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom-Left Neon Headphones + Equalizer Bars matching Image 2 */}
          {!isCompactMode && (
            <div className="pt-2 border-t border-white/10 mt-2">
              <NeonHeadphonesArt
                getFrequencyData={getFrequencyData}
                isPlaying={isPlaying}
                visualEffectsEnabled={settings.visualEffectsEnabled}
              />
            </div>
          )}
        </aside>

        {/* PHYSICAL CENTER SECTION */}
        <main className="col-span-6 lg:col-span-7 flex flex-col justify-between rounded-2xl bg-[#050B24]/45 backdrop-blur-md border border-blue-400/20 px-5 py-4 min-h-0 overflow-hidden">
          {activeTab === 'home' ? (
            <>
              {/* Hero Row: Large Circular Album Art + Song Title / Artist / Mini Spectrum */}
              <div className="flex-1 min-h-0 flex flex-col justify-center gap-4">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-10">
                  {/* Circular Album Art with Flanking Bars & Overlapping Music Badge */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="hidden xl:block -mr-3">
                      <CenterMiniVisualizer
                        variant="flank"
                        getFrequencyData={getFrequencyData}
                        isPlaying={isPlaying}
                        visualEffectsEnabled={settings.visualEffectsEnabled}
                      />
                    </div>

                    <div className="relative w-44 h-44 lg:w-52 lg:h-52 rounded-full p-[3px] bg-gradient-to-tr from-cyan-400 via-blue-400 to-purple-500 desktop-album-ring">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#060E2B]">
                        <ArtworkImage
                          track={currentTrack}
                          className={`w-full h-full object-cover transition-transform duration-700 ${
                            isPlaying ? 'scale-105' : 'scale-100'
                          }`}
                        />
                      </div>

                      {/* Overlapping Neon Music Note Badge */}
                      <button
                        type="button"
                        onClick={() => currentTrack && onToggleFavorite(currentTrack.id)}
                        title={isCurrentFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                        className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-[#09153D] border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.65)] flex items-center justify-center text-cyan-300 hover:scale-105 transition cursor-pointer"
                      >
                        {isCurrentFav ? (
                          <Heart className="w-5 h-5 fill-pink-400 text-pink-400" />
                        ) : (
                          <Music className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="hidden xl:block -ml-3">
                      <CenterMiniVisualizer
                        variant="flank"
                        getFrequencyData={getFrequencyData}
                        isPlaying={isPlaying}
                        visualEffectsEnabled={settings.visualEffectsEnabled}
                      />
                    </div>
                  </div>

                  {/* Song Title + Artist Name + Mini Spectrum */}
                  <div dir="rtl" className="flex flex-col items-center text-center min-w-0 max-w-xs">
                    <h2 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight truncate max-w-full drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                      {currentTrack?.title || 'اختر مقطعا للتشغيل'}
                    </h2>
                    <p className="mt-1.5 text-base lg:text-lg font-semibold text-cyan-300 truncate max-w-full drop-shadow-[0_0_12px_rgba(0,229,255,0.45)]">
                      {currentTrack?.artist || 'SALAH Neon Player'}
                    </p>
                    <CenterMiniVisualizer
                      variant="under-artist"
                      getFrequencyData={getFrequencyData}
                      isPlaying={isPlaying}
                      visualEffectsEnabled={settings.visualEffectsEnabled}
                    />
                  </div>
                </div>

                {/* Progress Bar Row (01:32 ----o---- 04:20) */}
                <div className="w-full max-w-2xl mx-auto flex items-center gap-3.5 px-2">
                  <span className="text-xs sm:text-sm font-mono-nums text-white/90 w-12 text-center">
                    {formatTime(currentTime)}
                  </span>
                  <div
                    role="slider"
                    aria-label="تقدم الأغنية"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration || 100)}
                    aria-valuenow={Math.round(currentTime)}
                    tabIndex={0}
                    onClick={handleProgressClick}
                    className="relative flex-1 h-2 rounded-full bg-white/18 cursor-pointer group"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 shadow-[0_0_12px_rgba(0,229,255,0.75)] transition-[width] duration-100"
                      style={{ width: `${progressPct}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-cyan-300 shadow-[0_0_14px_#00E5FF] transition-transform group-hover:scale-125"
                      style={{ left: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-mono-nums text-white/90 w-12 text-center">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* 5 Playback Controls Row */}
                <div className="flex items-center justify-center gap-4 sm:gap-5">
                  <button
                    type="button"
                    onClick={onToggleShuffle}
                    title="تشغيل عشوائي"
                    aria-label="تشغيل عشوائي"
                    className={`w-11 h-11 rounded-full border flex items-center justify-center transition cursor-pointer ${
                      settings.shuffle
                        ? 'bg-cyan-500/30 border-cyan-300 text-cyan-200 shadow-[0_0_16px_rgba(0,229,255,0.5)]'
                        : 'bg-blue-950/60 border-blue-400/50 text-white/90 hover:border-cyan-300 hover:text-cyan-200'
                    }`}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onPrev}
                    title="الأغنية السابقة"
                    aria-label="الأغنية السابقة"
                    className="w-12 h-12 rounded-full bg-blue-950/65 border border-blue-400/55 hover:border-cyan-300 flex items-center justify-center text-white shadow-[0_0_16px_rgba(59,130,246,0.35)] hover:scale-105 transition cursor-pointer"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlayPause}
                    title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                    aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                    className="w-16 h-16 rounded-full border-2 border-cyan-300 desktop-play-ring flex items-center justify-center text-white hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 fill-current" />
                    ) : (
                      <Play className="w-7 h-7 fill-current translate-x-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onNext}
                    title="الأغنية التالية"
                    aria-label="الأغنية التالية"
                    className="w-12 h-12 rounded-full bg-blue-950/65 border border-blue-400/55 hover:border-cyan-300 flex items-center justify-center text-white shadow-[0_0_16px_rgba(59,130,246,0.35)] hover:scale-105 transition cursor-pointer"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={onCycleRepeat}
                    title={`تكرار: ${
                      settings.repeatMode === 'one'
                        ? 'الأغنية الحالية'
                        : settings.repeatMode === 'all'
                        ? 'القائمة'
                        : 'إيقاف'
                    }`}
                    aria-label="تكرار"
                    className={`w-11 h-11 rounded-full border flex items-center justify-center transition cursor-pointer ${
                      settings.repeatMode !== 'off'
                        ? 'bg-cyan-500/30 border-cyan-300 text-cyan-200 shadow-[0_0_16px_rgba(0,229,255,0.5)]'
                        : 'bg-blue-950/60 border-blue-400/50 text-white/90 hover:border-cyan-300 hover:text-cyan-200'
                    }`}
                  >
                    {settings.repeatMode === 'one' ? (
                      <Repeat1 className="w-4 h-4" />
                    ) : (
                      <Repeat className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Full-Width Segmented Neon Equalizer Spectrum */}
              <div className="pt-1 shrink-0">
                <DesktopSpectrumBars
                  getFrequencyData={getFrequencyData}
                  isPlaying={isPlaying}
                  visualEffectsEnabled={settings.visualEffectsEnabled}
                />
              </div>
            </>
          ) : (
            <div dir={settings.language === 'ar' ? 'rtl' : 'ltr'} className="h-full min-h-0 flex flex-col">
              {activeTab === 'library' && (
                <LibrarySubViews
                  mode="library"
                  tracks={tracks}
                  playlists={playlists}
                  favorites={favorites}
                  history={history}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onPlayTrack={onPlayTrack}
                  onToggleFavorite={onToggleFavorite}
                  onDeleteTrack={onDeleteTrack}
                  onImportFiles={onImportFiles}
                  onChooseFolder={onChooseMusicFolder}
                  onClearHistory={onClearHistory}
                  onOpenPlaylistManager={onOpenPlaylistManager}
                  onPlayPlaylist={onPlayPlaylist}
                  onOpenAudioTools={onOpenAudioTools}
                  accentTheme="cyan"
                />
              )}
              {activeTab === 'favorites' && (
                <LibrarySubViews
                  mode="favorites"
                  tracks={tracks}
                  playlists={playlists}
                  favorites={favorites}
                  history={history}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onPlayTrack={onPlayTrack}
                  onToggleFavorite={onToggleFavorite}
                  onDeleteTrack={onDeleteTrack}
                  onImportFiles={onImportFiles}
                  onChooseFolder={onChooseMusicFolder}
                  onClearHistory={onClearHistory}
                  onOpenPlaylistManager={onOpenPlaylistManager}
                  onPlayPlaylist={onPlayPlaylist}
                  onOpenAudioTools={onOpenAudioTools}
                  accentTheme="cyan"
                />
              )}
              {activeTab === 'history' && (
                <LibrarySubViews
                  mode="history"
                  tracks={tracks}
                  playlists={playlists}
                  favorites={favorites}
                  history={history}
                  currentTrackId={currentTrack?.id}
                  isPlaying={isPlaying}
                  onPlayTrack={onPlayTrack}
                  onToggleFavorite={onToggleFavorite}
                  onDeleteTrack={onDeleteTrack}
                  onImportFiles={onImportFiles}
                  onChooseFolder={onChooseMusicFolder}
                  onClearHistory={onClearHistory}
                  onOpenPlaylistManager={onOpenPlaylistManager}
                  onPlayPlaylist={onPlayPlaylist}
                  onOpenAudioTools={onOpenAudioTools}
                  accentTheme="cyan"
                />
              )}
              {activeTab === 'settings' && (
                <SettingsPanel
                  settings={settings}
                  storageStats={storageStats}
                  onUpdateSettings={onUpdateSettings}
                  onChooseMusicFolder={onChooseMusicFolder}
                  onRescanLibrary={onRescanLibrary}
                  onOpenEqualizer={onOpenEqualizer}
                  onOpenPlaylists={onOpenPlaylistManager}
                  onOpenAudioTools={(tab) => onOpenAudioTools(tab)}
                  onResetSettings={onResetSettings}
                />
              )}
              {activeTab === 'about' && <AboutPanel />}
            </div>
          )}
        </main>

        {/* PHYSICAL RIGHT PLAYLIST PANEL */}
        <aside className="col-span-3 flex flex-col rounded-2xl bg-[#050C26]/75 backdrop-blur-xl border border-blue-400/25 p-3 shadow-[0_0_30px_rgba(0,0,0,0.45)] min-h-0">
          {/* Playlist Header */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-cyan-400" />
              <h2 dir="rtl" className="text-base font-bold text-white">
                قائمة التشغيل
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenAudioTools('trim', currentTrack ?? undefined)}
                title="قص الصوتيات"
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-cyan-300 cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onOpenAudioTools('video_to_mp3')}
                title="تحويل الفيديو إلى MP3"
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-pink-300 cursor-pointer"
              >
                <Film className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onImportFiles}
                title="إضافة ملفات صوتية"
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-cyan-300 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenPlaylistManager}
                title="إدارة قوائم التشغيل"
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/85 hover:text-cyan-300 cursor-pointer"
              >
                <ListMusic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Playlist Track Rows */}
          <div className="flex-1 overflow-y-auto neon-scroll space-y-2.5 pt-3 pr-1">
            {activeQueueTracks.map((tr) => {
              const active = currentTrack?.id === tr.id;
              return (
                <div
                  key={tr.id}
                  onClick={() => onPlayTrack(tr.id)}
                  className={`flex items-center justify-between gap-2.5 p-2 rounded-2xl border transition cursor-pointer ${
                    active
                      ? 'desktop-track-active'
                      : 'bg-[#09143A]/55 border-white/8 hover:bg-[#0D1C4D]/75 hover:border-blue-400/35'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/15">
                      <ArtworkImage track={tr} />
                    </div>
                    <div dir="rtl" className="min-w-0 flex-1 text-end">
                      <div className="text-sm font-bold text-white truncate">{tr.title}</div>
                      <div className="text-xs font-mono-nums text-white/75 mt-0.5">
                        {formatTime(tr.duration)}
                      </div>
                    </div>
                  </div>

                  {active ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-cyan-300 shrink-0">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* BOTTOM CONTROL BAR (Bottom-Left Volume Capsule + Bottom-Right Night/Fullscreen/EQ Capsule) */}
      <footer className="relative z-20 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
        {/* Bottom-Left Volume Capsule */}
        <div className="flex items-center gap-3 rounded-2xl bg-[#050C26]/80 backdrop-blur-xl border border-blue-400/30 px-4 py-2 shadow-[0_0_24px_rgba(0,0,0,0.45)] min-w-[230px] sm:min-w-[270px]">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={settings.muted ? 'إلغاء الكتم' : 'كتم الصوت'}
            className="text-white/90 hover:text-cyan-300 transition cursor-pointer"
          >
            {settings.muted || volumePct === 0 ? (
              <VolumeX className="w-5 h-5 text-pink-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.muted ? 0 : settings.volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="مستوى الصوت"
            className="flex-1 h-1.5 accent-cyan-400 cursor-pointer"
          />

          <span className="text-xs font-mono-nums font-semibold text-white/90 w-9 text-end">
            {volumePct}%
          </span>
        </div>

        {/* Bottom-Right Quick Utilities Capsule */}
        <div className="flex items-center gap-2 rounded-2xl bg-[#050C26]/80 backdrop-blur-xl border border-blue-400/30 px-3 py-1.5 shadow-[0_0_24px_rgba(0,0,0,0.45)]">
          <button
            type="button"
            onClick={onToggleNightMode}
            title="الوضع الليلي"
            aria-label="الوضع الليلي"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer ${
              settings.nightMode
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60'
                : 'text-white/90 hover:bg-white/10'
            }`}
          >
            <Moon className="w-4 h-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            title="ملء الشاشة"
            aria-label="ملء الشاشة"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/90 hover:bg-white/10 hover:text-cyan-300 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenEqualizer}
            title="إعدادات المعادل الصوتي"
            aria-label="إعدادات المعادل الصوتي"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/90 hover:bg-cyan-500/20 hover:text-cyan-300 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
