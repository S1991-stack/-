import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WebAudioPlayerEngine } from '../core/audioEngine';
import { DEFAULT_SETTINGS, localDb } from '../core/database';
import { EQUALIZER_PRESETS } from '../core/equalizerPresets';
import { errorHandler } from '../core/errorHandler';
import { importAudioFiles, ImportProgress, pickFolderViaDirectoryPicker } from '../core/fileManager';
import { generateBuiltInWavBlob } from '../core/sampleAudioGenerator';
import {
  AppSettings,
  AudioTrack,
  EqualizerPresetId,
  EqualizerSettings,
  PlayHistoryEntry,
  Playlist,
  RepeatMode,
} from '../types/audio';

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function useAudioPlayer() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<PlayHistoryEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [storageStats, setStorageStats] = useState<{ usedMB: string; trackCount: number }>({
    usedMB: '0.00',
    trackCount: 0,
  });

  const engineRef = useRef<WebAudioPlayerEngine | null>(null);
  const tracksRef = useRef<AudioTrack[]>([]);
  const currentTrackIdRef = useRef<string | null>(null);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);
  const activeQueueIdsRef = useRef<string[]>([]);
  const lastSavedPosRef = useRef<number>(0);

  tracksRef.current = tracks;
  currentTrackIdRef.current = currentTrackId;
  settingsRef.current = settings;

  const activeQueueTracks = useMemo(() => {
    if (activePlaylistId) {
      const pl = playlists.find((p) => p.id === activePlaylistId);
      if (pl) {
        const map = new Map(tracks.map((t) => [t.id, t]));
        return pl.trackIds.map((id) => map.get(id)).filter((t): t is AudioTrack => Boolean(t));
      }
    }
    return tracks;
  }, [tracks, playlists, activePlaylistId]);

  activeQueueIdsRef.current = activeQueueTracks.map((t) => t.id);

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrackId) ?? tracks[0] ?? null,
    [tracks, currentTrackId]
  );

  const persistSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    settingsRef.current = next;
    void localDb.saveSettings(next);
  }, []);

  const refreshStorageStats = useCallback(async () => {
    try {
      const stats = await localDb.estimateStorageUsage();
      setStorageStats(stats);
    } catch {
      // ignore
    }
  }, []);

  const loadTrackIntoEngine = useCallback(
    async (track: AudioTrack, autoPlay: boolean, resumePos = 0): Promise<boolean> => {
      const engine = engineRef.current;
      if (!engine) return false;

      if (track.isCorrupted) {
        errorHandler.report(`لا يمكن تشغيل "${track.title}" لأنه ملف تالف`, track.corruptedReason);
        return false;
      }

      try {
        let blob: Blob | undefined;
        if (track.sourceType === 'built-in') {
          blob = generateBuiltInWavBlob(track.builtInSeed ?? 0);
        } else {
          blob = await localDb.getAudioBlob(track.id);
        }

        if (!blob) {
          errorHandler.report(`الملف الصوتي غير موجود محلياً: ${track.title}`);
          return false;
        }

        setCurrentTrackId(track.id);
        currentTrackIdRef.current = track.id;
        setDuration(track.duration);
        setCurrentTime(resumePos);

        await engine.loadBlob(blob, autoPlay, resumePos);

        // Update history & play count only when actually starting playback
        if (autoPlay) {
          const now = Date.now();
          const updatedTrack: AudioTrack = {
            ...track,
            playCount: track.playCount + 1,
            lastPlayedAt: now,
          };
          setTracks((prev) => prev.map((t) => (t.id === track.id ? updatedTrack : t)));
          void localDb.saveTrack(updatedTrack);

          const entry: PlayHistoryEntry = {
            id: `hist-${now}-${Math.random().toString(36).slice(2, 6)}`,
            trackId: track.id,
            playedAt: now,
          };
          setHistory((prev) => [entry, ...prev].slice(0, 200));
          void localDb.addHistoryEntry(entry);
        }

        persistSettings({
          ...settingsRef.current,
          lastTrackId: track.id,
          lastPosition: resumePos,
        });

        return true;
      } catch (err) {
        errorHandler.report(`فشل تشغيل المقطع: ${track.title}`, err);
        return false;
      }
    },
    [persistSettings]
  );

  const playNext = useCallback(
    async (manual = false) => {
      const queue = activeQueueIdsRef.current;
      if (queue.length === 0) return;

      const curId = currentTrackIdRef.current;
      const curIdx = curId ? queue.indexOf(curId) : -1;
      const s = settingsRef.current;

      if (!manual && s.repeatMode === 'one' && curId) {
        const curTrack = tracksRef.current.find((t) => t.id === curId);
        if (curTrack) {
          await loadTrackIntoEngine(curTrack, true, 0);
          return;
        }
      }

      let nextIdx = 0;
      if (s.shuffle && queue.length > 1) {
        do {
          nextIdx = Math.floor(Math.random() * queue.length);
        } while (nextIdx === curIdx);
      } else {
        nextIdx = curIdx + 1;
        if (nextIdx >= queue.length) {
          if (!manual && s.repeatMode === 'off' && !s.autoPlay) {
            setIsPlaying(false);
            return;
          }
          nextIdx = 0;
        }
      }

      const nextTrack = tracksRef.current.find((t) => t.id === queue[nextIdx]);
      if (nextTrack) {
        await loadTrackIntoEngine(nextTrack, true, 0);
      }
    },
    [loadTrackIntoEngine]
  );

  const playPrev = useCallback(async () => {
    const engine = engineRef.current;
    if (engine && currentTime > 3) {
      engine.seek(0);
      setCurrentTime(0);
      return;
    }

    const queue = activeQueueIdsRef.current;
    if (queue.length === 0) return;

    const curId = currentTrackIdRef.current;
    const curIdx = curId ? queue.indexOf(curId) : 0;
    const prevIdx = (curIdx - 1 + queue.length) % queue.length;
    const prevTrack = tracksRef.current.find((t) => t.id === queue[prevIdx]);
    if (prevTrack) {
      await loadTrackIntoEngine(prevTrack, true, 0);
    }
  }, [currentTime, loadTrackIntoEngine]);

  // Initialize Audio Engine + IndexedDB
  useEffect(() => {
    let mounted = true;

    const engine = new WebAudioPlayerEngine({
      onTimeUpdate: (time, dur) => {
        if (!mounted) return;
        setCurrentTime(time);
        if (dur > 0) setDuration(dur);
        // Save position every ~4 seconds
        if (Math.abs(time - lastSavedPosRef.current) >= 4) {
          lastSavedPosRef.current = time;
          void localDb.saveSettings({
            ...settingsRef.current,
            lastTrackId: currentTrackIdRef.current ?? undefined,
            lastPosition: time,
          });
        }
      },
      onPlayStateChange: (playing) => {
        if (mounted) setIsPlaying(playing);
      },
      onEnded: () => {
        if (mounted) void playNext(false);
      },
      onError: () => {
        // Auto-skip corrupted/unplayable tracks cleanly
        if (mounted && tracksRef.current.length > 1) {
          setTimeout(() => void playNext(true), 350);
        }
      },
    });
    engineRef.current = engine;

    (async () => {
      try {
        await localDb.initializeIfNeeded();
        const [loadedTracks, loadedPlaylists, loadedFavs, loadedHistory, loadedSettings] =
          await Promise.all([
            localDb.getAllTracks(),
            localDb.getPlaylists(),
            localDb.getFavorites(),
            localDb.getHistory(),
            localDb.getSettings(),
          ]);

        if (!mounted) return;

        setTracks(loadedTracks);
        setPlaylists(loadedPlaylists);
        setFavorites(loadedFavs);
        setHistory(loadedHistory);
        setSettings(loadedSettings);
        settingsRef.current = loadedSettings;

        engine.setVolume(loadedSettings.volume, loadedSettings.muted);
        engine.applyEqualizer(loadedSettings.equalizer);

        const initialTrack =
          loadedTracks.find((t) => t.id === loadedSettings.lastTrackId) ?? loadedTracks[0];
        if (initialTrack) {
          await loadTrackIntoEngine(initialTrack, false, loadedSettings.lastPosition ?? 0);
        }
        await refreshStorageStats();
      } catch (err) {
        errorHandler.report('حدث خطأ أثناء تحميل قاعدة البيانات المحلية', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      engine.dispose();
    };
  }, [loadTrackIntoEngine, playNext, refreshStorageStats]);

  // Keep CSS glow intensity synced with settings
  useEffect(() => {
    document.documentElement.style.setProperty('--glow-intensity', String(settings.glowLevel));
  }, [settings.glowLevel]);

  // Keep HTML dir & lang synced with language setting
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [settings.language]);

  const togglePlayPause = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (!currentTrackIdRef.current && tracksRef.current[0]) {
      await loadTrackIntoEngine(tracksRef.current[0], true, 0);
      return;
    }
    if (engine.isPlaying()) {
      engine.pause();
    } else {
      try {
        await engine.play();
      } catch (err) {
        errorHandler.report('اضغط مجدداً لتفعيل محرك الصوت في المتصفح', err);
      }
    }
  }, [loadTrackIntoEngine]);

  const playTrack = useCallback(
    async (trackId: string, playlistId?: string | null) => {
      if (playlistId !== undefined) {
        setActivePlaylistId(playlistId);
      }
      const target = tracksRef.current.find((t) => t.id === trackId);
      if (!target) {
        errorHandler.report('تمت إزالة هذا الملف من المكتبة');
        return;
      }
      await loadTrackIntoEngine(target, true, 0);
    },
    [loadTrackIntoEngine]
  );

  const seekTo = useCallback((seconds: number) => {
    engineRef.current?.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback(
    (vol: number) => {
      const clamped = Math.max(0, Math.min(1, vol));
      const nextMuted = clamped === 0 ? true : false;
      engineRef.current?.setVolume(clamped, nextMuted);
      persistSettings({ ...settingsRef.current, volume: clamped, muted: nextMuted });
    },
    [persistSettings]
  );

  const toggleMute = useCallback(() => {
    const nextMuted = !settingsRef.current.muted;
    engineRef.current?.setVolume(settingsRef.current.volume, nextMuted);
    persistSettings({ ...settingsRef.current, muted: nextMuted });
  }, [persistSettings]);

  const toggleShuffle = useCallback(() => {
    persistSettings({ ...settingsRef.current, shuffle: !settingsRef.current.shuffle });
  }, [persistSettings]);

  const cycleRepeatMode = useCallback(() => {
    const order: RepeatMode[] = ['off', 'all', 'one'];
    const idx = order.indexOf(settingsRef.current.repeatMode);
    const next = order[(idx + 1) % order.length];
    persistSettings({ ...settingsRef.current, repeatMode: next });
  }, [persistSettings]);

  const toggleNightMode = useCallback(() => {
    persistSettings({ ...settingsRef.current, nightMode: !settingsRef.current.nightMode });
  }, [persistSettings]);

  const toggleFavorite = useCallback((trackId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(trackId);
      const next = exists ? prev.filter((id) => id !== trackId) : [trackId, ...prev];
      void localDb.setFavorites(next);
      return next;
    });
  }, []);

  const updateEqualizer = useCallback(
    (partial: Partial<EqualizerSettings>) => {
      const nextEq: EqualizerSettings = {
        ...settingsRef.current.equalizer,
        ...partial,
      };
      engineRef.current?.applyEqualizer(nextEq);
      persistSettings({ ...settingsRef.current, equalizer: nextEq });
    },
    [persistSettings]
  );

  const selectEqualizerPreset = useCallback(
    (presetId: EqualizerPresetId) => {
      const found = EQUALIZER_PRESETS.find((p) => p.id === presetId);
      if (!found) {
        updateEqualizer({ preset: presetId });
        return;
      }
      updateEqualizer({
        enabled: true,
        preset: found.id,
        bass: found.bass,
        treble: found.treble,
        bands: [...found.bands],
      });
    },
    [updateEqualizer]
  );

  const importFiles = useCallback(
    async (files: FileList | File[], folderLabel?: string) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;
      const { addedTracks, progress } = await importAudioFiles(
        fileArray,
        folderLabel || settingsRef.current.musicFolderName,
        setImportProgress
      );
      if (addedTracks.length > 0) {
        const updated = await localDb.getAllTracks();
        setTracks(updated);
        await refreshStorageStats();
      }
      setTimeout(() => setImportProgress(null), 1800);
      return progress;
    },
    [refreshStorageStats]
  );

  const chooseMusicFolder = useCallback(
    async (fallbackInputEl?: HTMLInputElement | null) => {
      try {
        const picked = await pickFolderViaDirectoryPicker();
        if (picked.supported && picked.files) {
          if (picked.folderName) {
            persistSettings({ ...settingsRef.current, musicFolderName: picked.folderName });
          }
          await importFiles(picked.files, picked.folderName);
          return true;
        }
      } catch (err) {
        // User cancelled or picker blocked inside iframe
        if ((err as Error)?.name === 'AbortError') return false;
      }
      // Fallback to directory file input (supported everywhere including Android & iframes)
      fallbackInputEl?.click();
      return false;
    },
    [importFiles, persistSettings]
  );

  const deleteTrack = useCallback(
    async (trackId: string) => {
      await localDb.deleteTrack(trackId);
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      setFavorites((prev) => {
        const next = prev.filter((id) => id !== trackId);
        void localDb.setFavorites(next);
        return next;
      });
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (!pl.trackIds.includes(trackId)) return pl;
          const updated = { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId), updatedAt: Date.now() };
          void localDb.savePlaylist(updated);
          return updated;
        })
      );
      if (currentTrackIdRef.current === trackId) {
        await playNext(true);
      }
      await refreshStorageStats();
    },
    [playNext, refreshStorageStats]
  );

  // Playlist Management
  const createPlaylist = useCallback(async (name: string, initialTrackIds: string[] = []) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const pl: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      trackIds: initialTrackIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await localDb.savePlaylist(pl);
    setPlaylists((prev) => [...prev, pl]);
    return pl;
  }, []);

  const renamePlaylist = useCallback(async (playlistId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const updated = { ...pl, name: trimmed, updatedAt: Date.now() };
        void localDb.savePlaylist(updated);
        return updated;
      })
    );
  }, []);

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      await localDb.deletePlaylist(playlistId);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      if (activePlaylistId === playlistId) {
        setActivePlaylistId(null);
      }
    },
    [activePlaylistId]
  );

  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId || pl.trackIds.includes(trackId)) return pl;
        const updated = { ...pl, trackIds: [...pl.trackIds, trackId], updatedAt: Date.now() };
        void localDb.savePlaylist(updated);
        return updated;
      })
    );
  }, []);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const updated = { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId), updatedAt: Date.now() };
        void localDb.savePlaylist(updated);
        return updated;
      })
    );
  }, []);

  const reorderPlaylistTrack = useCallback(
    async (playlistId: string, fromIdx: number, toIdx: number) => {
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          const nextIds = [...pl.trackIds];
          if (fromIdx < 0 || fromIdx >= nextIds.length || toIdx < 0 || toIdx >= nextIds.length) {
            return pl;
          }
          const [moved] = nextIds.splice(fromIdx, 1);
          nextIds.splice(toIdx, 0, moved);
          const updated = { ...pl, trackIds: nextIds, updatedAt: Date.now() };
          void localDb.savePlaylist(updated);
          return updated;
        })
      );
    },
    []
  );

  const playPlaylist = useCallback(
    async (playlistId: string) => {
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl || pl.trackIds.length === 0) return;
      setActivePlaylistId(playlistId);
      await playTrack(pl.trackIds[0], playlistId);
    },
    [playlists, playTrack]
  );

  const clearHistory = useCallback(async () => {
    await localDb.clearHistory();
    setHistory([]);
  }, []);

  const rescanLibrary = useCallback(async () => {
    const all = await localDb.getAllTracks();
    setTracks(all);
    await refreshStorageStats();
  }, [refreshStorageStats]);

  const resetSettings = useCallback(async () => {
    const reset = await localDb.resetAllSettings();
    setSettings(reset);
    settingsRef.current = reset;
    engineRef.current?.setVolume(reset.volume, reset.muted);
    engineRef.current?.applyEqualizer(reset.equalizer);
  }, []);

  const getTrackBlob = useCallback(async (track: AudioTrack): Promise<Blob | undefined> => {
    if (track.sourceType === 'built-in') {
      return generateBuiltInWavBlob(track.builtInSeed ?? 0);
    }
    return localDb.getAudioBlob(track.id);
  }, []);

  const addProcessedBlobToLibrary = useCallback(
    async (
      blob: Blob,
      meta: {
        title: string;
        artist: string;
        album?: string;
        format: 'MP3' | 'WAV';
        fileName: string;
        duration: number;
        folder?: string;
      }
    ): Promise<AudioTrack> => {
      const track: AudioTrack = {
        id: `studio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: meta.title,
        artist: meta.artist,
        album: meta.album || 'استوديو المعالجة الصوتية',
        folder: meta.folder || 'ملفات مقصوصة ومحولة',
        duration: meta.duration,
        format: meta.format,
        fileName: meta.fileName,
        fileSize: blob.size,
        addedAt: Date.now(),
        playCount: 0,
        sourceType: 'local',
      };
      await localDb.saveTrack(track, blob);
      const updated = await localDb.getAllTracks();
      setTracks(updated);
      await refreshStorageStats();
      return track;
    },
    [refreshStorageStats]
  );

  const getFrequencyData = useCallback(() => {
    return engineRef.current?.getFrequencyData() ?? new Uint8Array(new ArrayBuffer(128));
  }, []);

  const getTimeDomainData = useCallback(() => {
    return engineRef.current?.getTimeDomainData() ?? new Uint8Array(new ArrayBuffer(128));
  }, []);

  return {
    tracks,
    activeQueueTracks,
    playlists,
    activePlaylistId,
    setActivePlaylistId,
    favorites,
    history,
    settings,
    persistSettings,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    importProgress,
    storageStats,
    togglePlayPause,
    playTrack,
    playNext,
    playPrev,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    toggleNightMode,
    toggleFavorite,
    updateEqualizer,
    selectEqualizerPreset,
    importFiles,
    chooseMusicFolder,
    deleteTrack,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTrack,
    playPlaylist,
    clearHistory,
    rescanLibrary,
    resetSettings,
    getTrackBlob,
    addProcessedBlobToLibrary,
    getFrequencyData,
    getTimeDomainData,
  };
}
