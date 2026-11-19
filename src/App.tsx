import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { AudioStudioTab, AudioToolsModal } from './components/AudioToolsModal';
import { DesktopPlayerLayout } from './components/desktop/DesktopPlayerLayout';
import { EqualizerModal } from './components/EqualizerModal';
import { MobilePlayerLayout } from './components/mobile/MobilePlayerLayout';
import { PlaylistManagerModal } from './components/PlaylistManagerModal';
import { errorHandler } from './core/errorHandler';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { AudioTrack, PlayerError } from './types/audio';

export default function App() {
  const player = useAudioPlayer();
  const isOnline = useOnlineStatus();

  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  );
  const [eqOpen, setEqOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [audioToolsOpen, setAudioToolsOpen] = useState(false);
  const [audioToolsTab, setAudioToolsTab] = useState<AudioStudioTab>('trim');
  const [trimTargetTrack, setTrimTargetTrack] = useState<AudioTrack | null>(null);
  const [activeError, setActiveError] = useState<PlayerError | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  const openAudioTools = (tab: AudioStudioTab, track?: AudioTrack) => {
    setAudioToolsTab(tab);
    setTrimTargetTrack(track ?? null);
    setAudioToolsOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onResize = () => {
      setIsMobileViewport(window.innerWidth < 900);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const unsub = errorHandler.subscribe((err) => {
      setActiveError(err);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!activeError) return;
    const timer = window.setTimeout(() => setActiveError(null), 5000);
    return () => window.clearTimeout(timer);
  }, [activeError]);

  const useMobileLayout =
    player.settings.layoutPreference === 'mobile'
      ? true
      : player.settings.layoutPreference === 'desktop'
      ? false
      : isMobileViewport;

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (e.dataTransfer.files?.length) {
      await player.importFiles(e.dataTransfer.files, 'ملفات مسحوبة');
    }
  };

  if (player.isLoading) {
    return (
      <div className="w-full h-screen bg-[#03081C] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-16 h-16 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin shadow-[0_0_24px_rgba(0,229,255,0.5)]" />
        <div className="text-sm font-semibold text-cyan-200">جاري تهيئة SALAH Neon Player...</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFiles(true);
      }}
      onDragLeave={() => setIsDraggingFiles(false)}
      onDrop={(e) => void handleDrop(e)}
    >
      {/* Hidden File & Folder Inputs for Universal Cross-Platform Import */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.flac,.aac,.m4a,.ogg,.opus"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void player.importFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is standard in Chromium/Android/Electron
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            const firstPath =
              (e.target.files[0] as File & { webkitRelativePath?: string }).webkitRelativePath || '';
            const folderName = firstPath.split('/')[0] || 'مجلد الموسيقى';
            player.persistSettings({ ...player.settings, musicFolderName: folderName });
            void player.importFiles(e.target.files, folderName);
            e.target.value = '';
          }
        }}
      />

      {useMobileLayout ? (
        <MobilePlayerLayout
          tracks={player.tracks}
          playlists={player.playlists}
          favorites={player.favorites}
          history={player.history}
          settings={player.settings}
          storageStats={player.storageStats}
          currentTrack={player.currentTrack}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          onUpdateSettings={player.persistSettings}
          onTogglePlayPause={() => void player.togglePlayPause()}
          onPlayTrack={(id, plId) => void player.playTrack(id, plId)}
          onNext={() => void player.playNext(true)}
          onPrev={() => void player.playPrev()}
          onSeek={player.seekTo}
          onVolumeChange={player.setVolume}
          onToggleMute={player.toggleMute}
          onToggleShuffle={player.toggleShuffle}
          onCycleRepeat={player.cycleRepeatMode}
          onToggleFavorite={player.toggleFavorite}
          onDeleteTrack={(id) => void player.deleteTrack(id)}
          onImportFiles={() => fileInputRef.current?.click()}
          onChooseMusicFolder={() => void player.chooseMusicFolder(folderInputRef.current)}
          onRescanLibrary={() => void player.rescanLibrary()}
          onResetSettings={() => void player.resetSettings()}
          onClearHistory={() => void player.clearHistory()}
          onPlayPlaylist={(id) => void player.playPlaylist(id)}
          onOpenEqualizer={() => setEqOpen(true)}
          onOpenPlaylistManager={() => setPlaylistModalOpen(true)}
          onOpenAudioTools={openAudioTools}
          getFrequencyData={player.getFrequencyData}
        />
      ) : (
        <DesktopPlayerLayout
          tracks={player.tracks}
          activeQueueTracks={player.activeQueueTracks}
          playlists={player.playlists}
          activePlaylistId={player.activePlaylistId}
          favorites={player.favorites}
          history={player.history}
          settings={player.settings}
          storageStats={player.storageStats}
          currentTrack={player.currentTrack}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          onUpdateSettings={player.persistSettings}
          onTogglePlayPause={() => void player.togglePlayPause()}
          onPlayTrack={(id, plId) => void player.playTrack(id, plId)}
          onNext={() => void player.playNext(true)}
          onPrev={() => void player.playPrev()}
          onSeek={player.seekTo}
          onVolumeChange={player.setVolume}
          onToggleMute={player.toggleMute}
          onToggleShuffle={player.toggleShuffle}
          onCycleRepeat={player.cycleRepeatMode}
          onToggleNightMode={player.toggleNightMode}
          onToggleFavorite={player.toggleFavorite}
          onDeleteTrack={(id) => void player.deleteTrack(id)}
          onImportFiles={() => fileInputRef.current?.click()}
          onChooseMusicFolder={() => void player.chooseMusicFolder(folderInputRef.current)}
          onRescanLibrary={() => void player.rescanLibrary()}
          onResetSettings={() => void player.resetSettings()}
          onClearHistory={() => void player.clearHistory()}
          onPlayPlaylist={(id) => void player.playPlaylist(id)}
          onOpenEqualizer={() => setEqOpen(true)}
          onOpenPlaylistManager={() => setPlaylistModalOpen(true)}
          onOpenAudioTools={openAudioTools}
          getFrequencyData={player.getFrequencyData}
        />
      )}

      {/* Audio Trimmer & Video-to-MP3 Studio Modal */}
      <AudioToolsModal
        isOpen={audioToolsOpen}
        initialTab={audioToolsTab}
        initialTrack={trimTargetTrack}
        onClose={() => setAudioToolsOpen(false)}
        tracks={player.tracks}
        getTrackBlob={player.getTrackBlob}
        onSaveToLibrary={player.addProcessedBlobToLibrary}
        onPlayTrack={(id) => void player.playTrack(id)}
        variant={useMobileLayout ? 'mobile' : 'desktop'}
      />

      {/* Equalizer Modal */}
      <EqualizerModal
        isOpen={eqOpen}
        onClose={() => setEqOpen(false)}
        equalizer={player.settings.equalizer}
        onUpdate={player.updateEqualizer}
        onSelectPreset={player.selectEqualizerPreset}
        variant={useMobileLayout ? 'mobile' : 'desktop'}
      />

      {/* Playlist Manager Modal */}
      <PlaylistManagerModal
        isOpen={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
        playlists={player.playlists}
        tracks={player.tracks}
        activePlaylistId={player.activePlaylistId}
        onCreatePlaylist={player.createPlaylist}
        onRenamePlaylist={player.renamePlaylist}
        onDeletePlaylist={player.deletePlaylist}
        onAddTrack={player.addTrackToPlaylist}
        onRemoveTrack={player.removeTrackFromPlaylist}
        onReorderTrack={player.reorderPlaylistTrack}
        onPlayPlaylist={player.playPlaylist}
      />

      {/* Drag & Drop Overlay */}
      {isDraggingFiles && (
        <div className="fixed inset-0 z-50 bg-cyan-950/75 backdrop-blur-md border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center gap-3 text-white pointer-events-none">
          <div className="text-xl font-bold">أفلت الملفات الصوتية هنا لإضافتها إلى المكتبة</div>
          <div className="text-xs text-cyan-200">MP3 · WAV · FLAC · AAC · M4A · OGG</div>
        </div>
      )}

      {/* Non-blocking Import Progress Toast */}
      {player.importProgress && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#071133]/95 border border-cyan-400/50 px-5 py-3 shadow-[0_0_25px_rgba(0,229,255,0.4)] text-xs text-white min-w-[260px]">
          <div className="flex items-center justify-between gap-4 font-semibold mb-1.5">
            <span>جاري فحص الملفات المحلية...</span>
            <span className="font-mono-nums text-cyan-300">
              {player.importProgress.processed}/{player.importProgress.total}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all"
              style={{
                width: `${
                  player.importProgress.total > 0
                    ? (player.importProgress.processed / player.importProgress.total) * 100
                    : 100
                }%`,
              }}
            />
          </div>
          <div className="mt-1 text-[11px] text-white/65 truncate">{player.importProgress.currentFile}</div>
        </div>
      )}

      {/* Offline Mode Indicator */}
      {!isOnline && (
        <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-xl bg-[#091538]/90 border border-cyan-400/40 px-3 py-1.5 text-[11px] text-cyan-200 shadow-lg">
          <WifiOff className="w-3.5 h-3.5 text-cyan-300" />
          <span>وضع عدم الاتصال — يعمل محلياً بالكامل</span>
        </div>
      )}

      {/* Non-crashing Error Toast */}
      {activeError && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl bg-[#2A0D2E]/95 border border-pink-400/60 px-4 py-3 shadow-[0_0_25px_rgba(236,72,153,0.45)] flex items-start gap-2.5 text-xs text-white">
          <AlertTriangle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{activeError.message}</div>
            {activeError.detail && <div className="text-white/70 mt-0.5">{activeError.detail}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
