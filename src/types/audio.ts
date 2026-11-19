export type AudioSourceType = 'built-in' | 'local';

export type BuiltInArtworkId =
  | 'sunset_dreams'
  | 'summer_breeze'
  | 'quiet_music'
  | 'night_city'
  | 'nature_bloom'
  | 'midnight_vibes';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  folder: string;
  duration: number; // seconds
  format: string; // MP3, WAV, FLAC, AAC, M4A, OGG
  fileName: string;
  fileSize: number;
  addedAt: number;
  playCount: number;
  lastPlayedAt?: number;
  sourceType: AudioSourceType;
  artworkPreset?: BuiltInArtworkId;
  artworkDataUrl?: string;
  isFeatured?: boolean;
  isCorrupted?: boolean;
  corruptedReason?: string;
  // Built-in generator seed index when sourceType === 'built-in'
  builtInSeed?: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
  isSystem?: boolean;
}

export interface PlayHistoryEntry {
  id: string;
  trackId: string;
  playedAt: number;
}

export type RepeatMode = 'off' | 'one' | 'all';

export type EqualizerPresetId =
  | 'flat'
  | 'bass_boost'
  | 'pop'
  | 'rock'
  | 'jazz'
  | 'classical'
  | 'vocal'
  | 'electronic'
  | 'custom';

export interface EqualizerSettings {
  enabled: boolean;
  preset: EqualizerPresetId;
  bass: number; // -12 to +12 dB
  treble: number; // -12 to +12 dB
  balance: number; // -1 (Left) to +1 (Right)
  bands: number[]; // 10 bands: 32, 64, 125, 250, 500, 1k, 2k, 4k, 8k, 16k (-12 to +12 dB)
}

export type AppLanguage = 'ar' | 'en';

export type DesktopTab = 'home' | 'library' | 'favorites' | 'history' | 'settings' | 'about';
export type MobileTab = 'now_playing' | 'queue' | 'library' | 'favorites' | 'history' | 'folders';
export type LibrarySubCategory = 'all' | 'albums' | 'artists' | 'folders' | 'recent' | 'most_played' | 'playlists';

export interface AppSettings {
  musicFolderName: string;
  language: AppLanguage;
  visualEffectsEnabled: boolean;
  visualizerStyle: 'bars' | 'wave' | 'hybrid';
  glowLevel: number; // 0.3 to 1.4
  autoPlay: boolean;
  nightMode: boolean;
  volume: number; // 0 to 1
  muted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  equalizer: EqualizerSettings;
  lastTrackId?: string;
  lastPosition?: number;
  layoutPreference: 'auto' | 'desktop' | 'mobile';
}

export interface PlayerError {
  id: string;
  message: string;
  detail?: string;
  timestamp: number;
}
