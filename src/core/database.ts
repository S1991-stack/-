import { AppSettings, AudioTrack, PlayHistoryEntry, Playlist } from '../types/audio';
import { EQUALIZER_PRESETS } from './equalizerPresets';
import { getBuiltInSeedTracks } from './sampleAudioGenerator';

const DB_NAME = 'salah_neon_player_db';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  musicFolderName: 'مجلد الموسيقى المحلي',
  language: 'ar',
  visualEffectsEnabled: true,
  visualizerStyle: 'bars',
  glowLevel: 1.0,
  autoPlay: true,
  nightMode: false,
  volume: 0.7,
  muted: false,
  shuffle: false,
  repeatMode: 'off',
  equalizer: {
    enabled: true,
    preset: 'flat',
    bass: 0,
    treble: 0,
    balance: 0,
    bands: [...EQUALIZER_PRESETS[0].bands],
  },
  layoutPreference: 'auto',
};

interface KVRecord<T = unknown> {
  key: string;
  value: T;
}

interface AudioBlobRecord {
  trackId: string;
  blob: Blob;
}

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is unavailable in this environment.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        // Safe versioned schema migration
        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('audioBlobs')) {
          db.createObjectStore('audioBlobs', { keyPath: 'trackId' });
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  private async withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    op: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = op(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async initializeIfNeeded(): Promise<void> {
    const initialized = await this.getKV<boolean>('db_initialized');
    if (!initialized) {
      const seeds = getBuiltInSeedTracks();
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['tracks', 'playlists', 'kv'], 'readwrite');
        const trackStore = tx.objectStore('tracks');
        for (const t of seeds) {
          trackStore.put(t);
        }
        const defaultPlaylist: Playlist = {
          id: 'pl-featured-neon',
          name: 'مختارات النيون',
          trackIds: seeds.map((s) => s.id),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        tx.objectStore('playlists').put(defaultPlaylist);
        tx.objectStore('kv').put({ key: 'favorites', value: ['builtin-dreams', 'builtin-midnight'] });
        tx.objectStore('kv').put({ key: 'settings', value: DEFAULT_SETTINGS });
        tx.objectStore('kv').put({ key: 'db_initialized', value: true });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  async getAllTracks(): Promise<AudioTrack[]> {
    const items = await this.withStore<AudioTrack[]>('tracks', 'readonly', (s) => s.getAll());
    return items.sort((a, b) => a.addedAt - b.addedAt);
  }

  async saveTrack(track: AudioTrack, audioBlob?: Blob): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const stores = audioBlob ? ['tracks', 'audioBlobs'] : ['tracks'];
      const tx = db.transaction(stores, 'readwrite');
      tx.objectStore('tracks').put(track);
      if (audioBlob) {
        tx.objectStore('audioBlobs').put({ trackId: track.id, blob: audioBlob } satisfies AudioBlobRecord);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteTrack(trackId: string): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['tracks', 'audioBlobs'], 'readwrite');
      tx.objectStore('tracks').delete(trackId);
      tx.objectStore('audioBlobs').delete(trackId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAudioBlob(trackId: string): Promise<Blob | undefined> {
    const record = await this.withStore<AudioBlobRecord | undefined>('audioBlobs', 'readonly', (s) => s.get(trackId));
    return record?.blob;
  }

  async getPlaylists(): Promise<Playlist[]> {
    const items = await this.withStore<Playlist[]>('playlists', 'readonly', (s) => s.getAll());
    return items.sort((a, b) => a.createdAt - b.createdAt);
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    await this.withStore('playlists', 'readwrite', (s) => s.put(playlist));
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.withStore('playlists', 'readwrite', (s) => s.delete(playlistId));
  }

  async getHistory(): Promise<PlayHistoryEntry[]> {
    const items = await this.withStore<PlayHistoryEntry[]>('history', 'readonly', (s) => s.getAll());
    return items.sort((a, b) => b.playedAt - a.playedAt);
  }

  async addHistoryEntry(entry: PlayHistoryEntry): Promise<void> {
    await this.withStore('history', 'readwrite', (s) => s.put(entry));
  }

  async clearHistory(): Promise<void> {
    await this.withStore('history', 'readwrite', (s) => s.clear());
  }

  async getKV<T>(key: string): Promise<T | undefined> {
    const rec = await this.withStore<KVRecord<T> | undefined>('kv', 'readonly', (s) => s.get(key));
    return rec?.value;
  }

  async setKV<T>(key: string, value: T): Promise<void> {
    await this.withStore('kv', 'readwrite', (s) => s.put({ key, value }));
  }

  async getFavorites(): Promise<string[]> {
    return (await this.getKV<string[]>('favorites')) ?? [];
  }

  async setFavorites(ids: string[]): Promise<void> {
    await this.setKV('favorites', ids);
  }

  async getSettings(): Promise<AppSettings> {
    const saved = await this.getKV<Partial<AppSettings>>('settings');
    if (!saved) return DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      equalizer: {
        ...DEFAULT_SETTINGS.equalizer,
        ...(saved.equalizer ?? {}),
      },
    };
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.setKV('settings', settings);
  }

  async resetAllSettings(): Promise<AppSettings> {
    await this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  async estimateStorageUsage(): Promise<{ usedMB: string; trackCount: number }> {
    const tracks = await this.getAllTracks();
    let bytes = 0;
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      try {
        const est = await navigator.storage.estimate();
        bytes = est.usage ?? 0;
      } catch {
        bytes = tracks.reduce((sum, t) => sum + (t.fileSize || 0), 0);
      }
    } else {
      bytes = tracks.reduce((sum, t) => sum + (t.fileSize || 0), 0);
    }
    return {
      usedMB: (bytes / (1024 * 1024)).toFixed(2),
      trackCount: tracks.length,
    };
  }
}

export const localDb = new LocalDatabase();
