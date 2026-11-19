import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileAudio,
  Film,
  Loader2,
  Pause,
  Play,
  PlusCircle,
  Scissors,
  Upload,
  X,
} from 'lucide-react';
import {
  decodeMediaToAudioBuffer,
  encodeAudioBufferToMp3,
  encodeAudioBufferToWav,
  extractWaveformPeaks,
  trimAudioBuffer,
  triggerBlobDownload,
} from '../core/audioProcessor';
import { formatTime } from '../hooks/useAudioPlayer';
import { AudioTrack } from '../types/audio';

export type AudioStudioTab = 'trim' | 'video_to_mp3';

interface AudioToolsModalProps {
  isOpen: boolean;
  initialTab: AudioStudioTab;
  initialTrack?: AudioTrack | null;
  onClose: () => void;
  tracks: AudioTrack[];
  getTrackBlob: (track: AudioTrack) => Promise<Blob | undefined>;
  onSaveToLibrary: (
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
  ) => Promise<AudioTrack>;
  onPlayTrack: (trackId: string) => void;
  variant?: 'desktop' | 'mobile';
}

export const AudioToolsModal: React.FC<AudioToolsModalProps> = ({
  isOpen,
  initialTab,
  initialTrack,
  onClose,
  tracks,
  getTrackBlob,
  onSaveToLibrary,
  onPlayTrack,
  variant = 'desktop',
}) => {
  const [activeTab, setActiveTab] = useState<AudioStudioTab>(initialTab);

  // Audio Trimmer State
  const [trimSourceName, setTrimSourceName] = useState('');
  const [trimTitle, setTrimTitle] = useState('');
  const [trimArtist, setTrimArtist] = useState('SALAH Studio');
  const [trimBuffer, setTrimBuffer] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [fadeEnabled, setFadeEnabled] = useState(true);
  const [trimFormat, setTrimFormat] = useState<'MP3' | 'WAV'>('MP3');
  const [trimLoading, setTrimLoading] = useState(false);
  const [trimProgress, setTrimProgress] = useState<number | null>(null);
  const [trimStatus, setTrimStatus] = useState<string | null>(null);
  const [trimError, setTrimError] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Video-to-MP3 State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoArtist, setVideoArtist] = useState('مستخرج من فيديو');
  const [mp3Bitrate, setMp3Bitrate] = useState<128 | 192 | 320>(192);
  const [convertProgress, setConvertProgress] = useState<number | null>(null);
  const [convertPhase, setConvertPhase] = useState<string | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedDuration, setConvertedDuration] = useState(0);
  const [convertedError, setConvertedError] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const trimFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  const isMobile = variant === 'mobile';
  const modalTheme = isMobile
    ? 'border-purple-400/35 bg-[#140D2E]/96 shadow-[0_0_50px_rgba(168,85,247,0.35)]'
    : 'border-cyan-400/35 bg-[#060E2B]/96 shadow-[0_0_50px_rgba(0,229,255,0.28)]';

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    } else {
      stopPreview();
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !initialTrack) return;
    void loadLibraryTrackForTrim(initialTrack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTrack?.id]);

  useEffect(() => {
    return () => stopPreview();
  }, []);

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = '';
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setIsPreviewPlaying(false);
  };

  const loadBufferForTrim = async (blob: Blob, title: string, artist: string) => {
    stopPreview();
    setTrimLoading(true);
    setTrimError(null);
    setTrimStatus(null);
    try {
      const decoded = await decodeMediaToAudioBuffer(blob);
      setTrimBuffer(decoded);
      setPeaks(extractWaveformPeaks(decoded, 96));
      setStartSec(0);
      setEndSec(Number(decoded.duration.toFixed(2)));
      setTrimSourceName(title);
      setTrimTitle(`${title} (مقصوص)`);
      setTrimArtist(artist);
    } catch (err) {
      setTrimError(
        err instanceof Error
          ? `تعذر قراءة الملف الصوتي: ${err.message}`
          : 'تعذر فك ترميز الملف الصوتي للقص'
      );
    } finally {
      setTrimLoading(false);
    }
  };

  const loadLibraryTrackForTrim = async (track: AudioTrack) => {
    const blob = await getTrackBlob(track);
    if (!blob) {
      setTrimError('تعذر الوصول إلى بيانات المقطع الصوتي محلياً');
      return;
    }
    await loadBufferForTrim(blob, track.title, track.artist);
  };

  const handleTrimFilePick = async (file: File) => {
    const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
    await loadBufferForTrim(file, cleanName, 'ملف محلي');
  };

  const togglePreviewSlice = async () => {
    if (!trimBuffer) return;
    if (isPreviewPlaying) {
      stopPreview();
      return;
    }
    const safeStart = Math.max(0, Math.min(startSec, trimBuffer.duration - 0.1));
    const safeEnd = Math.max(safeStart + 0.1, Math.min(endSec, trimBuffer.duration));
    const sliced = trimAudioBuffer(trimBuffer, {
      startSec: safeStart,
      endSec: safeEnd,
      fadeInSec: fadeEnabled ? 0.15 : 0,
      fadeOutSec: fadeEnabled ? 0.25 : 0,
    });
    const wavBlob = encodeAudioBufferToWav(sliced);
    const url = URL.createObjectURL(wavBlob);
    previewUrlRef.current = url;

    const audio = new Audio(url);
    previewAudioRef.current = audio;
    audio.onended = () => stopPreview();
    setIsPreviewPlaying(true);
    await audio.play();
  };

  const handleExportTrim = async (destination: 'library' | 'download') => {
    if (!trimBuffer) return;
    stopPreview();
    setTrimError(null);
    setTrimStatus(null);
    setTrimProgress(0);

    try {
      const safeStart = Math.max(0, Math.min(startSec, trimBuffer.duration - 0.1));
      const safeEnd = Math.max(safeStart + 0.1, Math.min(endSec, trimBuffer.duration));
      const sliced = trimAudioBuffer(trimBuffer, {
        startSec: safeStart,
        endSec: safeEnd,
        fadeInSec: fadeEnabled ? 0.25 : 0,
        fadeOutSec: fadeEnabled ? 0.35 : 0,
      });

      let outBlob: Blob;
      if (trimFormat === 'MP3') {
        outBlob = await encodeAudioBufferToMp3(sliced, 192, (pct) => setTrimProgress(pct));
      } else {
        outBlob = encodeAudioBufferToWav(sliced);
        setTrimProgress(100);
      }

      const safeFileBase = (trimTitle.trim() || 'trimmed_audio').replace(/[\\/:*?"<>|]/g, '_');
      const ext = trimFormat.toLowerCase();
      const fileName = `${safeFileBase}.${ext}`;

      if (destination === 'download') {
        triggerBlobDownload(outBlob, fileName);
        setTrimStatus(`تم تنزيل المقطع المقصوص (${fileName}) بنجاح!`);
      } else {
        const added = await onSaveToLibrary(outBlob, {
          title: trimTitle.trim() || 'مقطع مقصوص',
          artist: trimArtist.trim() || 'SALAH Studio',
          format: trimFormat,
          fileName,
          duration: sliced.duration,
          folder: 'الصوتيات المقصوصة',
        });
        setTrimStatus(`تم حفظ "${added.title}" في مكتبتك المحلية ويمكنك تشغيله الآن!`);
        onPlayTrack(added.id);
      }
    } catch (err) {
      setTrimError(err instanceof Error ? err.message : 'فشل تصدير المقطع المقصوص');
    } finally {
      setTimeout(() => setTrimProgress(null), 900);
    }
  };

  const handleSelectVideo = (file: File) => {
    setVideoFile(file);
    setConvertedBlob(null);
    setConvertedError(null);
    setSavedSuccessMsg(null);
    setConvertProgress(null);
    setConvertPhase(null);
    setVideoTitle(file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '));
  };

  const handleConvertVideoToMp3 = async () => {
    if (!videoFile) return;
    setConvertedError(null);
    setSavedSuccessMsg(null);
    setConvertedBlob(null);
    setConvertProgress(5);
    setConvertPhase('جاري استخراج المسار الصوتي من الفيديو...');

    try {
      const audioBuffer = await decodeMediaToAudioBuffer(videoFile);
      setConvertedDuration(audioBuffer.duration);
      setConvertPhase(`جاري التحويل والضغط بصيغة MP3 (${mp3Bitrate} kbps)...`);

      const mp3Blob = await encodeAudioBufferToMp3(audioBuffer, mp3Bitrate, (pct) => {
        setConvertProgress(Math.max(10, pct));
      });

      setConvertedBlob(mp3Blob);
      setConvertPhase('اكتمل التحويل إلى MP3 بنجاح!');
    } catch (err) {
      setConvertedError(
        err instanceof Error
          ? `تعذر فك ترميز مسار الصوت في هذا الفيديو (${err.message}). جرب فيديو بصيغة MP4 أو WebM أو MOV.`
          : 'تعذر تحويل ملف الفيديو إلى MP3'
      );
      setConvertProgress(null);
      setConvertPhase(null);
    }
  };

  const handleSaveConvertedToLibrary = async () => {
    if (!convertedBlob) return;
    const base = (videoTitle.trim() || 'converted_video').replace(/[\\/:*?"<>|]/g, '_');
    const added = await onSaveToLibrary(convertedBlob, {
      title: videoTitle.trim() || 'صوت محول من فيديو',
      artist: videoArtist.trim() || 'محول الفيديو',
      format: 'MP3',
      fileName: `${base}.mp3`,
      duration: convertedDuration,
      folder: 'فيديوهات محولة إلى MP3',
    });
    setSavedSuccessMsg(`تمت إضافة "${added.title}" إلى مكتبتك!`);
    onPlayTrack(added.id);
  };

  const handleDownloadConvertedMp3 = () => {
    if (!convertedBlob) return;
    const base = (videoTitle.trim() || 'converted_video').replace(/[\\/:*?"<>|]/g, '_');
    triggerBlobDownload(convertedBlob, `${base}.mp3`);
  };

  if (!isOpen) return null;

  const selectedDuration = trimBuffer ? Math.max(0, endSec - startSec) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border backdrop-blur-2xl text-white overflow-hidden ${modalTheme}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('trim')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                activeTab === 'trim'
                  ? isMobile
                    ? 'bg-purple-600 border-purple-300 text-white shadow-[0_0_18px_rgba(168,85,247,0.5)]'
                    : 'bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_18px_rgba(0,229,255,0.4)]'
                  : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>قص الصوتيات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video_to_mp3')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                activeTab === 'video_to_mp3'
                  ? isMobile
                    ? 'bg-purple-600 border-purple-300 text-white shadow-[0_0_18px_rgba(168,85,247,0.5)]'
                    : 'bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_18px_rgba(0,229,255,0.4)]'
                  : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>تحويل الفيديو إلى MP3</span>
            </button>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto neon-scroll p-5 space-y-5">
          {activeTab === 'trim' ? (
            <>
              {/* Source Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/6 border border-white/12 p-3.5 space-y-2">
                  <label className="text-xs font-bold text-cyan-300 block">
                    اختر مقطعاً من مكتبتك للقص
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const found = tracks.find((t) => t.id === e.target.value);
                      if (found) void loadLibraryTrackForTrim(found);
                    }}
                    className="w-full rounded-xl bg-[#0B1438] border border-white/20 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="" disabled>
                      -- اختر أغنية من المكتبة --
                    </option>
                    {tracks.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.title} ({formatTime(tr.duration)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl bg-white/6 border border-white/12 p-3.5 flex flex-col justify-between gap-2">
                  <div className="text-xs font-bold text-purple-300">
                    أو استورد ملفاً صوتياً من جهازك
                  </div>
                  <input
                    ref={trimFileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.flac,.aac,.m4a,.ogg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleTrimFilePick(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => trimFileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-cyan-300" />
                    <span>اختيار ملف صوتي (MP3, WAV, FLAC, M4A, OGG)</span>
                  </button>
                </div>
              </div>

              {trimLoading && (
                <div className="rounded-2xl bg-white/6 border border-white/12 p-8 flex items-center justify-center gap-3 text-sm text-cyan-200">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري قراءة الموجة الصوتية...</span>
                </div>
              )}

              {trimError && (
                <div className="rounded-2xl bg-pink-500/20 border border-pink-400/50 p-4 text-xs text-pink-100">
                  {trimError}
                </div>
              )}

              {trimBuffer && !trimLoading && (
                <div className="space-y-4">
                  {/* Waveform Visual Timeline */}
                  <div className="rounded-2xl bg-black/35 border border-white/15 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-white truncate">
                        الملف المحمّل: <span className="text-cyan-300">{trimSourceName}</span>
                      </span>
                      <span className="font-mono-nums text-white/75">
                        المدة المحددة: {formatTime(selectedDuration)} / {formatTime(trimBuffer.duration)}
                      </span>
                    </div>

                    <div
                      dir="ltr"
                      className="relative h-24 w-full rounded-xl bg-white/5 overflow-hidden flex items-center gap-[2px] px-2"
                    >
                      {/* Highlighted selection overlay */}
                      <div
                        className="absolute inset-y-0 bg-cyan-400/18 border-x-2 border-cyan-400 pointer-events-none"
                        style={{
                          left: `${(startSec / trimBuffer.duration) * 100}%`,
                          width: `${Math.max(1, ((endSec - startSec) / trimBuffer.duration) * 100)}%`,
                        }}
                      />
                      {peaks.map((pk, idx) => {
                        const posSec = (idx / peaks.length) * trimBuffer.duration;
                        const inside = posSec >= startSec && posSec <= endSec;
                        return (
                          <div
                            key={idx}
                            className={`flex-1 rounded-full transition-colors ${
                              inside
                                ? 'bg-gradient-to-t from-cyan-400 to-purple-400'
                                : 'bg-white/25'
                            }`}
                            style={{ height: `${Math.round(pk * 88)}%` }}
                          />
                        );
                      })}
                    </div>

                    {/* Start / End Range Sliders */}
                    <div dir="ltr" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-cyan-300 font-semibold">نقطة البداية</span>
                          <span className="font-mono-nums">{startSec.toFixed(1)}s ({formatTime(startSec)})</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0.1, endSec - 0.5)}
                          step={0.1}
                          value={startSec}
                          onChange={(e) => setStartSec(Number(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-pink-300 font-semibold">نقطة النهاية</span>
                          <span className="font-mono-nums">{endSec.toFixed(1)}s ({formatTime(endSec)})</span>
                        </div>
                        <input
                          type="range"
                          min={Math.min(trimBuffer.duration, startSec + 0.5)}
                          max={trimBuffer.duration}
                          step={0.1}
                          value={endSec}
                          onChange={(e) => setEndSec(Number(e.target.value))}
                          className="w-full accent-pink-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Output Metadata & Format Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-white/65 block mb-1">اسم المقطع الناتج</label>
                      <input
                        type="text"
                        value={trimTitle}
                        onChange={(e) => setTrimTitle(e.target.value)}
                        className="w-full rounded-xl bg-white/8 border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/65 block mb-1">صيغة التصدير</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['MP3', 'WAV'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setTrimFormat(fmt)}
                            className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                              trimFormat === fmt
                                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                                : 'bg-white/5 border-white/15 text-white/65'
                            }`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <label className="w-full flex items-center justify-between gap-2 rounded-xl bg-white/6 border border-white/15 px-3 py-2 text-xs cursor-pointer">
                        <span>تلاشي ناعم (Fade)</span>
                        <input
                          type="checkbox"
                          checked={fadeEnabled}
                          onChange={(e) => setFadeEnabled(e.target.checked)}
                          className="w-4 h-4 accent-cyan-400"
                        />
                      </label>
                    </div>
                  </div>

                  {trimProgress !== null && (
                    <div className="rounded-xl bg-white/8 border border-cyan-400/40 p-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span>جاري معالجة وتصدير المقطع...</span>
                        <span className="font-mono-nums text-cyan-300">{trimProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
                          style={{ width: `${trimProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {trimStatus && (
                    <div className="rounded-xl bg-cyan-500/15 border border-cyan-400/45 p-3 flex items-center gap-2 text-xs text-cyan-100">
                      <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
                      <span>{trimStatus}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => void togglePreviewSlice()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-xs font-bold cursor-pointer"
                    >
                      {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPreviewPlaying ? 'إيقاف المعاينة' : 'معاينة الجزء المحدد'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={trimProgress !== null}
                      onClick={() => void handleExportTrim('library')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-[0_0_18px_rgba(0,229,255,0.4)] hover:brightness-110 disabled:opacity-50 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>قص وحفظ في مكتبة المشغل</span>
                    </button>

                    <button
                      type="button"
                      disabled={trimProgress !== null}
                      onClick={() => void handleExportTrim('download')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 border border-purple-300/40 text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل الملف ({trimFormat})</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* TAB 2: VIDEO TO MP3 CONVERTER */
            <div className="space-y-4">
              <div
                onClick={() => videoFileInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-cyan-400/40 bg-white/5 hover:bg-white/8 p-6 text-center space-y-2.5 cursor-pointer transition"
              >
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*,.mp4,.webm,.mov,.mkv,.m4v,.avi"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectVideo(f);
                    e.target.value = '';
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-300">
                  <Film className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold">
                  {videoFile ? videoFile.name : 'اضغط لاختيار ملف فيديو لتحويله إلى MP3'}
                </div>
                <p className="text-xs text-white/60">
                  يعمل محلياً 100% دون إنترنت · يدعم MP4, WebM, MOV, M4V
                  {videoFile ? ` · ${(videoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                </p>
              </div>

              {videoFile && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-white/65 block mb-1">اسم المقطع الصوتي</label>
                      <input
                        type="text"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="w-full rounded-xl bg-white/8 border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/65 block mb-1">اسم الفنان / المصدر</label>
                      <input
                        type="text"
                        value={videoArtist}
                        onChange={(e) => setVideoArtist(e.target.value)}
                        className="w-full rounded-xl bg-white/8 border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/65 block mb-1">جودة ملف MP3</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([128, 192, 320] as const).map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setMp3Bitrate(rate)}
                            className={`py-2 rounded-xl text-xs font-mono-nums font-bold border cursor-pointer ${
                              mp3Bitrate === rate
                                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                                : 'bg-white/5 border-white/15 text-white/65'
                            }`}
                          >
                            {rate}k
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={convertProgress !== null && convertProgress < 100 && !convertedBlob}
                    onClick={() => void handleConvertVideoToMp3()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white text-sm font-bold shadow-[0_0_24px_rgba(0,229,255,0.4)] hover:brightness-110 disabled:opacity-50 cursor-pointer"
                  >
                    <FileAudio className="w-4 h-4" />
                    <span>بدء التحويل إلى MP3</span>
                  </button>

                  {convertProgress !== null && (
                    <div className="rounded-2xl bg-white/6 border border-cyan-400/35 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-cyan-200">{convertPhase}</span>
                        <span className="font-mono-nums font-bold text-cyan-300">{convertProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 transition-all"
                          style={{ width: `${convertProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {convertedError && (
                    <div className="rounded-2xl bg-pink-500/20 border border-pink-400/50 p-4 text-xs text-pink-100">
                      {convertedError}
                    </div>
                  )}

                  {convertedBlob && (
                    <div className="rounded-2xl bg-cyan-500/12 border border-cyan-400/45 p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-cyan-200">
                          ملف MP3 جاهز ({(convertedBlob.size / (1024 * 1024)).toFixed(2)} MB · {formatTime(convertedDuration)})
                        </div>
                        {savedSuccessMsg && <div className="text-emerald-300">{savedSuccessMsg}</div>}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSaveConvertedToLibrary()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/25 border border-cyan-400 text-cyan-100 text-xs font-bold hover:bg-cyan-500/35 cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>حفظ في المكتبة وتشغيل</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadConvertedMp3}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>تنزيل ملف MP3</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
