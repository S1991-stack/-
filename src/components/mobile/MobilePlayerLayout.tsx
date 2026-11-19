import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  Clock,
  Disc3,
  Film,
  FolderOpen,
  Heart,
  Library,
  ListMusic,
  Menu,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Scissors,
  Search,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatTime } from '../../hooks/useAudioPlayer';
import { AppSettings, AudioTrack, MobileTab, PlayHistoryEntry, Playlist } from '../../types/audio';
import { ArtworkImage } from '../ArtworkImage';
import { AudioStudioTab } from '../AudioToolsModal';
import { LibrarySubViews } from '../LibrarySubViews';
import { SettingsPanel } from '../SettingsPanel';
import { MobileWaveformBar } from '../visualizers/MobileWaveformBar';

interface MobilePlayerLayoutProps {
  tracks: AudioTrack[];
  playlists: Playlist[];
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

export const MobilePlayerLayout: React.FC<MobilePlayerLayoutProps> = ({
  tracks,
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
  const [activeTab, setActiveTab] = useState<MobileTab>('now_playing');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'featured' | 'recent' | 'most_played'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

  const isCurrentFav = currentTrack ? favorites.includes(currentTrack.id) : false;

  const filteredLibraryTracks = useMemo(() => {
    let list = [...tracks];
    if (libraryFilter === 'featured') list = list.filter((t) => t.isFeatured || favorites.includes(t.id));
    else if (libraryFilter === 'recent') list.sort((a, b) => b.addedAt - a.addedAt);
    else if (libraryFilter === 'most_played') list.sort((a, b) => b.playCount - a.playCount);

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [tracks, favorites, libraryFilter, searchQuery]);

  const handleTrackPlay = (trackId: string, playlistId?: string | null) => {
    onPlayTrack(trackId, playlistId);
    setActiveTab('now_playing');
  };

  return (
    <div
      dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
      className="relative w-full h-[100dvh] flex flex-col overflow-hidden text-white select-none"
      style={{
        background: settings.nightMode
          ? 'radial-gradient(circle at 35% 12%, #431B82 0%, #1C0F47 38%, #070A22 82%, #040615 100%)'
          : 'radial-gradient(circle at 35% 10%, #863EE0 0%, #5B25A8 28%, #1C1347 62%, #070B2A 100%)',
      }}
    >
      {/* Top Safe Status / Header Area */}
      <header className="relative z-20 px-4 pt-3 pb-2 flex items-center justify-between gap-2 shrink-0">
        {activeTab === 'now_playing' ? (
          <>
            <button
              type="button"
              onClick={() => setShowMenuSheet(true)}
              aria-label="القائمة"
              className="w-11 h-11 rounded-full bg-white/12 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-center min-w-0">
              <h1 className="text-base font-bold tracking-tight truncate">مشغل الصوت</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => currentTrack && onToggleFavorite(currentTrack.id)}
                aria-label="المفضلة"
                className="w-11 h-11 rounded-full bg-white/12 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
              >
                <Heart
                  className={`w-5 h-5 ${isCurrentFav ? 'fill-pink-400 text-pink-400' : 'text-white'}`}
                />
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(true)}
                aria-label="الإعدادات"
                className="w-11 h-11 rounded-full bg-white/12 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('now_playing')}
              aria-label="العودة للمشغل"
              className="w-11 h-11 rounded-full bg-white/12 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <h1 className="text-base font-bold truncate">
              {activeTab === 'queue'
                ? 'قائمة الأغاني'
                : activeTab === 'library'
                ? 'مكتبة الموسيقى'
                : activeTab === 'favorites'
                ? 'المفضلة'
                : activeTab === 'history'
                ? 'سجل التشغيل'
                : 'المجلدات'}
            </h1>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSearchBar((v) => !v)}
                aria-label="بحث"
                className="w-11 h-11 rounded-full bg-white/12 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(true)}
                aria-label="الإعدادات"
                className="w-11 h-11 rounded-full bg-white/12 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 min-h-0 px-4 pb-24 overflow-y-auto mobile-scroll flex flex-col">
        {activeTab === 'now_playing' ? (
          <div className="flex-1 flex flex-col justify-between py-2 max-w-md mx-auto w-full">
            {/* Center Neon Circular Album Artwork (Reference Image 1 Screen 3) */}
            <div className="flex-1 flex items-center justify-center py-2">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full p-[3px] bg-gradient-to-tr from-purple-400 via-fuchsia-400 to-cyan-300 mobile-album-ring">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#130D32]">
                  <ArtworkImage
                    track={currentTrack}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Song Title & Artist */}
            <div className="text-center space-y-1 px-2 mb-3">
              <h2 className="text-2xl font-extrabold text-white tracking-tight truncate">
                {currentTrack?.title || 'SALAH Neon Player'}
              </h2>
              <p className="text-sm text-white/70 truncate">
                {currentTrack?.artist || 'اختر أغنية من المكتبة'}
              </p>
            </div>

            {/* Symmetrical Audio-Reactive Waveform Scrubber + Timestamps */}
            <div className="space-y-1.5 mb-3">
              <MobileWaveformBar
                currentTime={currentTime}
                duration={duration}
                onSeek={onSeek}
                getFrequencyData={getFrequencyData}
                isPlaying={isPlaying}
                visualEffectsEnabled={settings.visualEffectsEnabled}
              />
              <div dir="ltr" className="flex items-center justify-between text-xs font-mono-nums text-white/75 px-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 5 Playback Control Buttons (Shuffle, Prev, Large Glass Play/Pause, Next, Repeat) */}
            <div dir="ltr" className="flex items-center justify-between px-2 mb-3">
              <button
                type="button"
                onClick={onToggleShuffle}
                aria-label="التشغيل العشوائي"
                className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer ${
                  settings.shuffle ? 'text-purple-300 bg-purple-500/25' : 'text-white/80 hover:text-white'
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onPrev}
                aria-label="السابق"
                className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition cursor-pointer"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              <button
                type="button"
                onClick={onTogglePlayPause}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/35 shadow-[0_0_28px_rgba(168,85,247,0.55)] flex items-center justify-center text-white active:scale-95 transition cursor-pointer"
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
                aria-label="التالي"
                className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition cursor-pointer"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button
                type="button"
                onClick={onCycleRepeat}
                aria-label="تكرار"
                className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer ${
                  settings.repeatMode !== 'off'
                    ? 'text-purple-300 bg-purple-500/25'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {settings.repeatMode === 'one' ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ) : activeTab === 'queue' ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">قائمة الأغاني</h2>
                <p className="text-xs text-white/65 font-mono-nums">{tracks.length} مقطع صوتي</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAudioTools('trim', currentTrack ?? undefined)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 text-cyan-300" />
                  <span>قص</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAudioTools('video_to_mp3')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5 text-pink-300" />
                  <span>MP3</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenPlaylistManager}
                  className="px-3 py-1.5 rounded-full bg-purple-600/80 border border-purple-300/40 text-[11px] font-semibold cursor-pointer"
                >
                  القوائم
                </button>
              </div>
            </div>

            {showSearchBar && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الأغنية أو الفنان..."
                className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400"
              />
            )}

            <div className="space-y-2.5">
              {filteredLibraryTracks.map((tr) => {
                const active = currentTrack?.id === tr.id;
                const isFav = favorites.includes(tr.id);
                return (
                  <div
                    key={tr.id}
                    onClick={() => handleTrackPlay(tr.id)}
                    className={`flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border transition cursor-pointer ${
                      active
                        ? 'bg-purple-600/35 border-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.4)]'
                        : 'bg-white/6 border-white/10 hover:bg-white/12'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <ArtworkImage track={tr} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{tr.title}</div>
                        <div className="text-xs text-white/65 truncate">
                          {tr.artist} · <span className="font-mono-nums">{formatTime(tr.duration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(tr.id)}
                        aria-label="المفضلة"
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                          isFav ? 'text-pink-400 bg-pink-500/20' : 'text-white/60 bg-white/8'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAudioTools('trim', tr)}
                        aria-label={`قص ${tr.title}`}
                        className="w-8 h-8 rounded-full bg-white/8 text-cyan-300 flex items-center justify-center cursor-pointer"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTrackPlay(tr.id)}
                        aria-label={`تشغيل ${tr.title}`}
                        className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'library' ? (
          <div className="space-y-4">
            {/* Greeting + Filter Pills (Reference Image 1 Screen 1 & 2) */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">SALAH Neon Player</h2>
                <p className="text-xs text-white/65">مكتبة الموسيقى المحلية</p>
              </div>
              <button
                type="button"
                onClick={onImportFiles}
                className="px-3.5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-xs font-bold shadow-[0_0_18px_rgba(139,61,255,0.55)] cursor-pointer whitespace-nowrap"
              >
                + إضافة ملفات
              </button>
            </div>

            {showSearchBar && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الأغنية أو الفنان أو الألبوم..."
                className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400"
              />
            )}

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'featured', label: 'المميزة' },
                { id: 'recent', label: 'المضافة حديثاً' },
                { id: 'most_played', label: 'الأكثر استماعاً' },
              ].map((tab) => {
                const active = libraryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLibraryFilter(tab.id as typeof libraryFilter)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#8B3DFF] border-purple-300 text-white shadow-[0_0_18px_rgba(139,61,255,0.65)]'
                        : 'bg-white/8 border-white/20 text-white/80 hover:bg-white/15'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 2-Column Featured Album/Playlist Cards (Reference Image 1 Screen 1) */}
            {libraryFilter === 'all' && !searchQuery && (
              <div className="grid grid-cols-2 gap-3">
                {tracks.slice(0, 4).map((tr, i) => (
                  <div
                    key={tr.id}
                    onClick={() => handleTrackPlay(tr.id)}
                    className="relative h-36 rounded-2xl overflow-hidden border border-white/15 cursor-pointer group"
                  >
                    <ArtworkImage
                      track={tr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    {i === 0 && (
                      <span className="absolute top-2.5 start-2.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold">
                        ألبوم مميز
                      </span>
                    )}
                    <div className="absolute bottom-2.5 inset-x-3">
                      <div className="text-sm font-bold truncate">{tr.title}</div>
                      <div className="text-[11px] text-white/75 truncate">{tr.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vertical Track List matching Reference Image 1 Screen 2 */}
            <div className="space-y-2.5">
              {filteredLibraryTracks.map((tr) => {
                const active = currentTrack?.id === tr.id;
                return (
                  <div
                    key={tr.id}
                    onClick={() => handleTrackPlay(tr.id)}
                    className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border transition cursor-pointer ${
                      active
                        ? 'bg-purple-600/35 border-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.4)]'
                        : 'bg-white/6 border-white/10 hover:bg-white/12'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <ArtworkImage track={tr} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{tr.title}</div>
                        <div className="text-xs text-white/65 truncate">{tr.artist}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-mono-nums text-white/70">
                        {formatTime(tr.duration)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackPlay(tr.id);
                        }}
                        aria-label={`تشغيل ${tr.title}`}
                        className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <LibrarySubViews
            mode={activeTab === 'favorites' ? 'favorites' : activeTab === 'history' ? 'history' : 'folders'}
            tracks={tracks}
            playlists={playlists}
            favorites={favorites}
            history={history}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            onPlayTrack={handleTrackPlay}
            onToggleFavorite={onToggleFavorite}
            onDeleteTrack={onDeleteTrack}
            onImportFiles={onImportFiles}
            onChooseFolder={onChooseMusicFolder}
            onClearHistory={onClearHistory}
            onOpenPlaylistManager={onOpenPlaylistManager}
            onPlayPlaylist={onPlayPlaylist}
            onOpenAudioTools={onOpenAudioTools}
            accentTheme="purple"
          />
        )}
      </main>

      {/* Floating Glass Bottom Navigation Bar with dedicated Song Queue button + 4 sections */}
      <nav
        aria-label="شريط التنقل السفلي"
        className="fixed bottom-3 inset-x-2.5 z-30 max-w-md mx-auto h-16 rounded-full bg-[#171236]/88 backdrop-blur-2xl border border-white/18 shadow-[0_10px_32px_rgba(0,0,0,0.6)] px-1.5 grid grid-cols-6 items-center"
      >
        {[
          { id: 'now_playing', label: 'المشغل', icon: Disc3 },
          { id: 'queue', label: 'الأغاني', icon: ListMusic },
          { id: 'library', label: 'المكتبة', icon: Library },
          { id: 'favorites', label: 'المفضلة', icon: Heart },
          { id: 'history', label: 'التاريخ', icon: Clock },
          { id: 'folders', label: 'المجلدات', icon: FolderOpen },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id as MobileTab)}
              className="flex flex-col items-center justify-center gap-0.5 h-12 rounded-full transition cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                  active
                    ? 'bg-[#8B3DFF] text-white shadow-[0_0_18px_rgba(139,61,255,0.75)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[9.5px] font-medium whitespace-nowrap ${active ? 'text-white' : 'text-white/65'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Menu Sheet (Equalizer, Playlists, Import, Volume) */}
      {showMenuSheet && (
        <div
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setShowMenuSheet(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-[#161036]/95 border-t border-white/20 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-white/30 mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">قائمة الخيارات السريعة</h3>
              <button
                type="button"
                onClick={() => setShowMenuSheet(false)}
                className="text-xs text-white/70 cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            {/* Volume Control */}
            <div className="rounded-2xl bg-white/8 border border-white/12 p-3 flex items-center gap-3">
              <button type="button" onClick={onToggleMute} className="cursor-pointer">
                {settings.muted ? (
                  <VolumeX className="w-5 h-5 text-pink-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-purple-300" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.muted ? 0 : settings.volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="flex-1 accent-purple-400"
              />
              <span className="text-xs font-mono-nums w-9 text-end">
                {settings.muted ? 0 : Math.round(settings.volume * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowMenuSheet(false);
                  onOpenAudioTools('trim', currentTrack ?? undefined);
                }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white/8 border border-white/12 text-xs font-semibold cursor-pointer"
              >
                <Scissors className="w-4 h-4 text-cyan-300" />
                <span>قص الصوتيات</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenuSheet(false);
                  onOpenAudioTools('video_to_mp3');
                }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white/8 border border-white/12 text-xs font-semibold cursor-pointer"
              >
                <Film className="w-4 h-4 text-pink-300" />
                <span>تحويل فيديو إلى MP3</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenuSheet(false);
                  onOpenEqualizer();
                }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white/8 border border-white/12 text-xs font-semibold cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-purple-300" />
                <span>المعادل الصوتي</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenuSheet(false);
                  onOpenPlaylistManager();
                }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white/8 border border-white/12 text-xs font-semibold cursor-pointer"
              >
                <ListMusic className="w-4 h-4 text-cyan-300" />
                <span>قوائم التشغيل</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenuSheet(false);
                  onImportFiles();
                }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white/8 border border-white/12 text-xs font-semibold cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-pink-300" />
                <span>استيراد ملفات</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenuSheet(false);
                  setShowSettingsDrawer(true);
                }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white/8 border border-white/12 text-xs font-semibold cursor-pointer"
              >
                <Settings className="w-4 h-4 text-white/85" />
                <span>الإعدادات الكاملة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Mobile Settings Overlay */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-40 bg-[#0D0A26]/98 backdrop-blur-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/12 mb-3">
            <h3 className="text-base font-bold">إعدادات SALAH Neon Player</h3>
            <button
              type="button"
              onClick={() => setShowSettingsDrawer(false)}
              className="px-3 py-1.5 rounded-xl bg-white/12 text-xs font-semibold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <SettingsPanel
              settings={settings}
              storageStats={storageStats}
              onUpdateSettings={onUpdateSettings}
              onChooseMusicFolder={onChooseMusicFolder}
              onRescanLibrary={onRescanLibrary}
              onOpenEqualizer={onOpenEqualizer}
              onOpenPlaylists={onOpenPlaylistManager}
              onOpenAudioTools={(tab) => {
                setShowSettingsDrawer(false);
                onOpenAudioTools(tab);
              }}
              onResetSettings={onResetSettings}
            />
          </div>
        </div>
      )}
    </div>
  );
};
