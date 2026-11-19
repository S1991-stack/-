import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  ListMusic,
  Play,
  Plus,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { AudioTrack, Playlist } from '../types/audio';
import { ArtworkImage } from './ArtworkImage';
import { formatTime } from '../hooks/useAudioPlayer';

interface PlaylistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  tracks: AudioTrack[];
  activePlaylistId: string | null;
  onCreatePlaylist: (name: string) => Promise<Playlist | undefined>;
  onRenamePlaylist: (id: string, name: string) => Promise<void>;
  onDeletePlaylist: (id: string) => Promise<void>;
  onAddTrack: (playlistId: string, trackId: string) => Promise<void>;
  onRemoveTrack: (playlistId: string, trackId: string) => Promise<void>;
  onReorderTrack: (playlistId: string, fromIdx: number, toIdx: number) => Promise<void>;
  onPlayPlaylist: (playlistId: string) => Promise<void>;
}

export const PlaylistManagerModal: React.FC<PlaylistManagerModalProps> = ({
  isOpen,
  onClose,
  playlists,
  tracks,
  activePlaylistId,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onAddTrack,
  onRemoveTrack,
  onReorderTrack,
  onPlayPlaylist,
}) => {
  const [newName, setNewName] = useState('');
  const [selectedId, setSelectedId] = useState<string>(playlists[0]?.id || '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (!isOpen) return null;

  const selectedPlaylist = playlists.find((p) => p.id === selectedId) ?? playlists[0];
  const trackMap = new Map(tracks.map((t) => [t.id, t]));
  const playlistTracks = (selectedPlaylist?.trackIds ?? [])
    .map((id) => trackMap.get(id))
    .filter((t): t is AudioTrack => Boolean(t));

  const availableToAdd = tracks.filter(
    (t) => !(selectedPlaylist?.trackIds ?? []).includes(t.id)
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = await onCreatePlaylist(newName);
    setNewName('');
    if (created) setSelectedId(created.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl border border-cyan-400/35 bg-[#060E2B]/95 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,229,255,0.28)] text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ListMusic className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">إدارة قوائم التشغيل المحلية</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create New Playlist */}
        <form onSubmit={handleCreate} className="px-6 py-3 border-b border-white/10 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="اسم قائمة التشغيل الجديدة..."
            className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-semibold hover:brightness-110 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء</span>
          </button>
        </form>

        {/* Body Split */}
        <div className="flex-1 overflow-y-auto neon-scroll grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/10">
          {/* Playlists List */}
          <div className="md:col-span-4 p-4 space-y-2">
            <div className="text-xs text-white/55 font-semibold mb-2">القوائم المحفوظة</div>
            {playlists.map((pl) => {
              const active = selectedPlaylist?.id === pl.id;
              const isPlayingList = activePlaylistId === pl.id;
              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedId(pl.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                    active
                      ? 'desktop-track-active'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {editingId === pl.id ? (
                    <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 bg-black/40 border border-cyan-400 rounded-lg px-2 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          void onRenamePlaylist(pl.id, editText);
                          setEditingId(null);
                        }}
                        className="p-1 text-cyan-300 hover:text-white cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{pl.name}</div>
                        <div className="text-[11px] text-white/55 font-mono-nums">
                          {pl.trackIds.length} أغنية {isPlayingList ? '· قيد التشغيل' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            void onPlayPlaylist(pl.id);
                            onClose();
                          }}
                          title="تشغيل القائمة"
                          className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/35 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(pl.id);
                            setEditText(pl.name);
                          }}
                          title="إعادة تسمية"
                          className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {playlists.length > 1 && (
                          <button
                            type="button"
                            onClick={() => void onDeletePlaylist(pl.id)}
                            title="حذف القائمة"
                            className="p-1.5 rounded-lg bg-pink-500/15 text-pink-300 hover:bg-pink-500/30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Playlist Tracks + Add Tracks */}
          <div className="md:col-span-8 p-4 space-y-5">
            {selectedPlaylist ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-cyan-200">{selectedPlaylist.name}</h3>
                    <p className="text-xs text-white/55">أعد ترتيب المقاطع أو أضف مقاطع من مكتبتك</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void onPlayPlaylist(selectedPlaylist.id);
                      onClose();
                    }}
                    disabled={playlistTracks.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/25 border border-cyan-400 text-cyan-100 text-xs font-semibold hover:bg-cyan-500/35 disabled:opacity-40 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تشغيل القائمة بالكامل</span>
                  </button>
                </div>

                {/* Current Tracks in Playlist */}
                <div className="space-y-2">
                  {playlistTracks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
                      لا توجد مقاطع داخل هذه القائمة بعد. أضف مقاطع من الأسفل.
                    </div>
                  ) : (
                    playlistTracks.map((tr, idx) => (
                      <div
                        key={tr.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                            <ArtworkImage track={tr} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{tr.title}</div>
                            <div className="text-xs text-white/55 truncate">
                              {tr.artist} · <span className="font-mono-nums">{formatTime(tr.duration)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => void onReorderTrack(selectedPlaylist.id, idx, idx - 1)}
                            title="تحريك للأعلى"
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === playlistTracks.length - 1}
                            onClick={() => void onReorderTrack(selectedPlaylist.id, idx, idx + 1)}
                            title="تحريك للأسفل"
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void onRemoveTrack(selectedPlaylist.id, tr.id)}
                            title="إزالة من القائمة"
                            className="p-1.5 rounded-lg bg-pink-500/15 text-pink-300 hover:bg-pink-500/30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Available Tracks */}
                {availableToAdd.length > 0 && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-xs font-semibold text-white/65 mb-2">
                      إضافة مقاطع من المكتبة
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto neon-scroll">
                      {availableToAdd.map((tr) => (
                        <button
                          key={tr.id}
                          type="button"
                          onClick={() => void onAddTrack(selectedPlaylist.id, tr.id)}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/50 text-start transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                              <ArtworkImage track={tr} />
                            </div>
                            <span className="text-xs truncate">{tr.title}</span>
                          </div>
                          <Plus className="w-4 h-4 text-cyan-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
