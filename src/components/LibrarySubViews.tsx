import React, { useMemo, useState } from 'react';
import {
  Clock,
  Disc,
  Film,
  FolderOpen,
  Heart,
  ListMusic,
  Mic2,
  Music,
  Play,
  Plus,
  Scissors,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { formatTime } from '../hooks/useAudioPlayer';
import { AudioTrack, LibrarySubCategory, PlayHistoryEntry, Playlist } from '../types/audio';
import { ArtworkImage } from './ArtworkImage';
import { AudioStudioTab } from './AudioToolsModal';

interface LibraryViewProps {
  tracks: AudioTrack[];
  playlists: Playlist[];
  favorites: string[];
  history: PlayHistoryEntry[];
  currentTrackId?: string;
  isPlaying: boolean;
  mode: 'library' | 'favorites' | 'history' | 'folders';
  onPlayTrack: (trackId: string, playlistId?: string | null) => void;
  onToggleFavorite: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onImportFiles: () => void;
  onChooseFolder: () => void;
  onClearHistory: () => void;
  onOpenPlaylistManager: () => void;
  onPlayPlaylist: (playlistId: string) => void;
  onOpenAudioTools?: (tab: AudioStudioTab, track?: AudioTrack) => void;
  accentTheme?: 'cyan' | 'purple';
}

export const LibrarySubViews: React.FC<LibraryViewProps> = ({
  tracks,
  playlists,
  favorites,
  history,
  currentTrackId,
  isPlaying,
  mode,
  onPlayTrack,
  onToggleFavorite,
  onDeleteTrack,
  onImportFiles,
  onChooseFolder,
  onClearHistory,
  onOpenPlaylistManager,
  onPlayPlaylist,
  onOpenAudioTools,
  accentTheme = 'cyan',
}) => {
  const [search, setSearch] = useState('');
  const [subCategory, setSubCategory] = useState<LibrarySubCategory>(
    mode === 'folders' ? 'folders' : 'all'
  );
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const isPurple = accentTheme === 'purple';
  const activeChip = isPurple
    ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_16px_rgba(168,85,247,0.45)]'
    : 'bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_14px_rgba(0,229,255,0.35)]';
  const activeRow = isPurple
    ? 'bg-purple-500/25 border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.35)]'
    : 'desktop-track-active';

  const trackMap = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks]);

  const filteredTracks = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = tracks;

    if (mode === 'favorites') {
      base = tracks.filter((t) => favorites.includes(t.id));
    } else if (mode === 'library' || mode === 'folders') {
      if (subCategory === 'recent') {
        base = [...tracks].sort((a, b) => b.addedAt - a.addedAt);
      } else if (subCategory === 'most_played') {
        base = [...tracks].sort((a, b) => b.playCount - a.playCount);
      } else if (selectedGroup) {
        if (subCategory === 'albums') base = tracks.filter((t) => t.album === selectedGroup);
        else if (subCategory === 'artists') base = tracks.filter((t) => t.artist === selectedGroup);
        else if (subCategory === 'folders') base = tracks.filter((t) => t.folder === selectedGroup);
      }
    }

    if (!q) return base;
    return base.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.folder.toLowerCase().includes(q)
    );
  }, [tracks, favorites, search, mode, subCategory, selectedGroup]);

  const groupedBuckets = useMemo(() => {
    const map = new Map<string, AudioTrack[]>();
    const keyFn =
      subCategory === 'albums'
        ? (t: AudioTrack) => t.album
        : subCategory === 'artists'
        ? (t: AudioTrack) => t.artist
        : (t: AudioTrack) => t.folder;

    for (const tr of tracks) {
      const k = keyFn(tr) || 'غير مصنف';
      const arr = map.get(k) ?? [];
      arr.push(tr);
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [tracks, subCategory]);

  if (mode === 'history') {
    const historyTracks = history
      .map((h) => ({ entry: h, track: trackMap.get(h.trackId) }))
      .filter((item): item is { entry: PlayHistoryEntry; track: AudioTrack } => Boolean(item.track));

    return (
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">سجل التشغيل</h2>
            <p className="text-xs text-white/60">آخر المقاطع الصوتية التي تم تشغيلها محلياً</p>
          </div>
          {historyTracks.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-200 text-xs font-semibold hover:bg-pink-500/30 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto neon-scroll space-y-2.5 pr-1">
          {historyTracks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/55">
              سجل التشغيل فارغ حالياً. قم بتشغيل أي أغنية ليتم حفظها هنا.
            </div>
          ) : (
            historyTracks.map(({ entry, track }) => (
              <div
                key={entry.id}
                onClick={() => onPlayTrack(track.id)}
                className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                  currentTrackId === track.id ? activeRow : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    <ArtworkImage track={track} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{track.title}</div>
                    <div className="text-xs text-white/60 truncate">
                      {track.artist} ·{' '}
                      <span className="font-mono-nums">
                        {new Date(entry.playedAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTrack(track.id);
                  }}
                  aria-label="إعادة تشغيل"
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-cyan-500/30 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3.5">
      {/* Top Action Bar: Search + Import */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/50 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الأغنية أو الفنان أو الألبوم..."
            className="w-full bg-white/8 border border-white/15 rounded-2xl ps-10 pe-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-cyan-400"
          />
        </div>
        <button
          type="button"
          onClick={onImportFiles}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 text-cyan-300" />
          <span>إضافة ملفات</span>
        </button>
        <button
          type="button"
          onClick={onChooseFolder}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
        >
          <FolderOpen className="w-4 h-4 text-purple-300" />
          <span>استعراض مجلد</span>
        </button>
        {onOpenAudioTools && (
          <>
            <button
              type="button"
              onClick={() => onOpenAudioTools('trim')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
            >
              <Scissors className="w-4 h-4 text-cyan-300" />
              <span>قص صوت</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAudioTools('video_to_mp3')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
            >
              <Film className="w-4 h-4 text-pink-300" />
              <span>فيديو ← MP3</span>
            </button>
          </>
        )}
      </div>

      {/* Category Chips for Library/Folders */}
      {(mode === 'library' || mode === 'folders') && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'جميع الأغاني', icon: Music },
            { id: 'playlists', label: 'قوائم التشغيل', icon: ListMusic },
            { id: 'albums', label: 'الألبومات', icon: Disc },
            { id: 'artists', label: 'الفنانين', icon: Mic2 },
            { id: 'folders', label: 'المجلدات', icon: FolderOpen },
            { id: 'recent', label: 'المضافة حديثاً', icon: Clock },
            { id: 'most_played', label: 'الأكثر استماعاً', icon: TrendingUp },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = subCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSubCategory(cat.id as LibrarySubCategory);
                  setSelectedGroup(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer whitespace-nowrap shrink-0 ${
                  active ? activeChip : 'bg-white/5 border-white/15 text-white/75 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main List / Grouped Grid */}
      <div className="flex-1 overflow-y-auto neon-scroll space-y-2.5 pr-1">
        {subCategory === 'playlists' && mode !== 'favorites' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/65">قوائم التشغيل المحفوظة ({playlists.length})</span>
              <button
                type="button"
                onClick={onOpenPlaylistManager}
                className="text-xs text-cyan-300 hover:underline cursor-pointer"
              >
                + إنشاء أو تعديل قائمة
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playlists.map((pl) => {
                const firstTrack = trackMap.get(pl.trackIds[0]);
                return (
                  <div
                    key={pl.id}
                    onClick={() => onPlayPlaylist(pl.id)}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/8 border border-white/15 hover:border-cyan-400/60 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <ArtworkImage track={firstTrack} preset="midnight_vibes" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{pl.name}</div>
                        <div className="text-xs text-white/60 font-mono-nums">
                          {pl.trackIds.length} أغنية
                        </div>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-cyan-500/25 border border-cyan-400/50 flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 fill-current text-cyan-200" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (subCategory === 'albums' || subCategory === 'artists' || subCategory === 'folders') &&
          !selectedGroup &&
          mode !== 'favorites' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupedBuckets.map(([groupName, items]) => (
              <button
                key={groupName}
                type="button"
                onClick={() => setSelectedGroup(groupName)}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/8 hover:bg-white/12 border border-white/15 text-start transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    <ArtworkImage track={items[0]} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{groupName}</div>
                    <div className="text-xs text-white/60 font-mono-nums">{items.length} أغنية</div>
                  </div>
                </div>
                <span className="text-xs text-cyan-300 shrink-0">عرض</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {selectedGroup && (
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-cyan-300">{selectedGroup}</span>
                <button
                  type="button"
                  onClick={() => setSelectedGroup(null)}
                  className="text-xs text-white/70 hover:text-white underline cursor-pointer"
                >
                  عرض الكل
                </button>
              </div>
            )}

            {filteredTracks.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/55">
                {mode === 'favorites'
                  ? 'قائمة المفضلة فارغة. اضغط على أيقونة القلب بجانب أي أغنية لإضافتها.'
                  : 'لا توجد مقاطع صوتية مطابقة لبحثك.'}
              </div>
            ) : (
              filteredTracks.map((tr) => {
                const isCurrent = currentTrackId === tr.id;
                const isFav = favorites.includes(tr.id);
                return (
                  <div
                    key={tr.id}
                    onClick={() => onPlayTrack(tr.id, null)}
                    className={`flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border transition cursor-pointer ${
                      isCurrent ? activeRow : 'bg-white/6 border-white/10 hover:bg-white/12'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative">
                        <ArtworkImage track={tr} />
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate text-white">{tr.title}</div>
                        <div className="text-xs text-white/60 truncate">
                          {tr.artist} · {tr.format}
                          {tr.sourceType === 'built-in' ? '' : ` · ${tr.folder}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs font-mono-nums text-white/70 hidden sm:inline">
                        {formatTime(tr.duration)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(tr.id)}
                        aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                          isFav
                            ? 'bg-pink-500/25 text-pink-400 border border-pink-400/50'
                            : 'bg-white/8 text-white/60 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                      {onOpenAudioTools && (
                        <button
                          type="button"
                          onClick={() => onOpenAudioTools('trim', tr)}
                          title="قص هذا المقطع"
                          aria-label={`قص ${tr.title}`}
                          className="w-9 h-9 rounded-full bg-white/8 hover:bg-cyan-500/25 text-white/60 hover:text-cyan-300 flex items-center justify-center transition cursor-pointer"
                        >
                          <Scissors className="w-4 h-4" />
                        </button>
                      )}
                      {tr.sourceType === 'local' && (
                        <button
                          type="button"
                          onClick={() => onDeleteTrack(tr.id)}
                          aria-label="حذف الملف"
                          className="w-9 h-9 rounded-full bg-white/8 hover:bg-red-500/25 text-white/60 hover:text-red-300 flex items-center justify-center transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onPlayTrack(tr.id, null)}
                        aria-label={`تشغيل ${tr.title}`}
                        className="w-10 h-10 rounded-full bg-white/15 hover:bg-cyan-500/35 border border-white/20 flex items-center justify-center text-white transition cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};
