import { AudioTrack } from '../types/audio';

/**
 * Generates real, musical stereo 16-bit PCM WAV audio blobs offline
 * so the player's Web Audio EQ, Bass/Treble/Balance DSP, and FFT
 * spectrum visualizers work with genuine audio signals on first launch.
 */

interface SynthTrackProfile {
  seed: number;
  bpm: number;
  chords: number[][];
  bassNotes: number[];
  waveform: 'warm' | 'bright' | 'ambient' | 'synthwave' | 'acoustic' | 'rock';
  durationSec: number;
}

const PROFILES: SynthTrackProfile[] = [
  {
    // 0: أغنية الأحلام (Dreamy golden sunset ambient synth)
    seed: 0,
    bpm: 92,
    chords: [
      [220.0, 261.63, 329.63, 392.0],
      [174.61, 220.0, 261.63, 349.23],
      [196.0, 246.94, 293.66, 392.0],
      [164.81, 196.0, 246.94, 329.63],
    ],
    bassNotes: [55.0, 43.65, 49.0, 41.2],
    waveform: 'warm',
    durationSec: 28,
  },
  {
    // 1: أغنية الصيف (Tropical upbeat marimba-like groove)
    seed: 1,
    bpm: 112,
    chords: [
      [261.63, 329.63, 392.0, 493.88],
      [293.66, 349.23, 440.0, 523.25],
      [220.0, 261.63, 329.63, 392.0],
      [196.0, 246.94, 293.66, 392.0],
    ],
    bassNotes: [65.41, 73.42, 55.0, 49.0],
    waveform: 'bright',
    durationSec: 26,
  },
  {
    // 2: موسيقى هادئة (Calm alpine harmonic pad)
    seed: 2,
    bpm: 74,
    chords: [
      [196.0, 246.94, 293.66, 369.99],
      [164.81, 196.0, 246.94, 329.63],
      [146.83, 185.0, 220.0, 293.66],
      [130.81, 164.81, 196.0, 246.94],
    ],
    bassNotes: [49.0, 41.2, 36.71, 32.7],
    waveform: 'ambient',
    durationSec: 32,
  },
  {
    // 3: أغنية الليل (Neon night city synthwave pulse)
    seed: 3,
    bpm: 118,
    chords: [
      [220.0, 261.63, 329.63, 440.0],
      [196.0, 246.94, 293.66, 392.0],
      [174.61, 220.0, 261.63, 349.23],
      [164.81, 207.65, 246.94, 329.63],
    ],
    bassNotes: [55.0, 49.0, 43.65, 41.2],
    waveform: 'synthwave',
    durationSec: 28,
  },
  {
    // 4: أغنية الطبيعة (Gentle acoustic morning arpeggio)
    seed: 4,
    bpm: 88,
    chords: [
      [261.63, 329.63, 392.0, 523.25],
      [220.0, 261.63, 329.63, 440.0],
      [174.61, 220.0, 261.63, 349.23],
      [196.0, 246.94, 293.66, 392.0],
    ],
    bassNotes: [65.41, 55.0, 43.65, 49.0],
    waveform: 'acoustic',
    durationSec: 26,
  },
  {
    // 5: Midnight Vibes (Energetic neon stage bass & lead)
    seed: 5,
    bpm: 124,
    chords: [
      [164.81, 196.0, 246.94, 329.63],
      [196.0, 246.94, 293.66, 392.0],
      [220.0, 261.63, 329.63, 440.0],
      [146.83, 174.61, 220.0, 293.66],
    ],
    bassNotes: [41.2, 49.0, 55.0, 36.71],
    waveform: 'rock',
    durationSec: 26,
  },
];

const wavCache = new Map<number, Blob>();

export function generateBuiltInWavBlob(seed: number): Blob {
  const cached = wavCache.get(seed);
  if (cached) return cached;

  const profile = PROFILES[seed % PROFILES.length];
  const sampleRate = 22050; // Crisp & fast stereo synthesis (<100ms generation)
  const numChannels = 2;
  const totalSamples = Math.floor(sampleRate * profile.durationSec);
  const dataBytes = totalSamples * numChannels * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // WAV Header
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  const beatSec = 60 / profile.bpm;
  const barSec = beatSec * 4;
  const twoPi = Math.PI * 2;

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const barIndex = Math.floor(t / barSec) % profile.chords.length;
    const chord = profile.chords[barIndex];
    const bassFreq = profile.bassNotes[barIndex];

    const beatPhase = (t % beatSec) / beatSec;
    const subStep = Math.floor((t / (beatSec / 2)) % 4);
    const barPhase = (t % barSec) / barSec;

    // Fade in/out envelope for smooth looping
    let masterEnv = 1;
    if (t < 0.4) masterEnv = t / 0.4;
    else if (t > profile.durationSec - 0.8) masterEnv = Math.max(0, (profile.durationSec - t) / 0.8);

    // Rich stereo chord pad
    let padL = 0;
    let padR = 0;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      const detune = c % 2 === 0 ? 1.002 : 0.998;
      const harmonic = profile.waveform === 'synthwave' || profile.waveform === 'rock'
        ? Math.sin(twoPi * f * t) + 0.35 * Math.sin(twoPi * f * 2 * t)
        : Math.sin(twoPi * f * t) + 0.18 * Math.sin(twoPi * f * 2 * t);
      padL += harmonic * (c % 2 === 0 ? 0.16 : 0.1);
      padR += Math.sin(twoPi * f * detune * t) * (c % 2 === 1 ? 0.16 : 0.1);
    }

    // Bass pulse (drives low-end EQ & Bass slider!)
    const bassEnv =
      profile.waveform === 'ambient'
        ? 0.55 + 0.25 * Math.sin(twoPi * 0.5 * t)
        : Math.exp(-beatPhase * 3.2);
    const bassSample =
      (Math.sin(twoPi * bassFreq * t) + 0.45 * Math.sin(twoPi * bassFreq * 2 * t)) *
      0.34 *
      bassEnv;

    // Arpeggio / Lead melody (drives mids & treble!)
    const arpFreq = chord[subStep % chord.length] * 2;
    const arpEnv = Math.exp(-((t % (beatSec / 2)) / (beatSec / 2)) * 4.5);
    const arpL = Math.sin(twoPi * arpFreq * t) * 0.22 * arpEnv;
    const arpR = Math.sin(twoPi * arpFreq * 1.0015 * t) * 0.22 * arpEnv;

    // Soft rhythmic kick & hi-hat shimmer (for crisp treble response)
    let perc = 0;
    if (profile.waveform !== 'ambient') {
      const kickEnv = Math.exp(-beatPhase * 18);
      const kickFreq = 48 + 90 * Math.exp(-beatPhase * 28);
      perc += Math.sin(twoPi * kickFreq * t) * 0.28 * kickEnv;

      // Crisp off-beat chime/hat
      const hatPhase = ((t + beatSec * 0.5) % beatSec) / beatSec;
      const hatEnv = Math.exp(-hatPhase * 28);
      const shimmer = Math.sin(twoPi * 6400 * t) * Math.sin(twoPi * 9100 * t);
      perc += shimmer * 0.11 * hatEnv;
    }

    // Gentle swell across bar
    const barSwell = 0.85 + 0.15 * Math.sin(Math.PI * barPhase);

    const mixL = Math.max(-0.95, Math.min(0.95, (padL * 0.65 + bassSample + arpL * 0.9 + perc) * barSwell * masterEnv));
    const mixR = Math.max(-0.95, Math.min(0.95, (padR * 0.65 + bassSample + arpR * 0.9 + perc) * barSwell * masterEnv));

    view.setInt16(offset, Math.round(mixL * 32767), true);
    view.setInt16(offset + 2, Math.round(mixR * 32767), true);
    offset += 4;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  wavCache.set(seed, blob);
  return blob;
}

export function getBuiltInSeedTracks(): AudioTrack[] {
  const now = Date.now();
  return [
    {
      id: 'builtin-dreams',
      title: 'أغنية الأحلام',
      artist: 'الفنان المفضل',
      album: 'ليالي النيون الذهبية',
      folder: 'Built-in Studio',
      duration: 28,
      format: 'WAV',
      fileName: 'dream-song.wav',
      fileSize: 2470000,
      addedAt: now - 600000,
      playCount: 18,
      sourceType: 'built-in',
      artworkPreset: 'sunset_dreams',
      isFeatured: true,
      builtInSeed: 0,
    },
    {
      id: 'builtin-summer',
      title: 'أغنية الصيف',
      artist: 'إيقاع الشاطئ',
      album: 'نسيم البحر',
      folder: 'Built-in Studio',
      duration: 26,
      format: 'WAV',
      fileName: 'summer-song.wav',
      fileSize: 2290000,
      addedAt: now - 500000,
      playCount: 14,
      sourceType: 'built-in',
      artworkPreset: 'summer_breeze',
      isFeatured: false,
      builtInSeed: 1,
    },
    {
      id: 'builtin-quiet',
      title: 'موسيقى هادئة',
      artist: 'أصداء الجبال',
      album: 'صفاء الطبيعة',
      folder: 'Built-in Studio',
      duration: 32,
      format: 'WAV',
      fileName: 'calm-music.wav',
      fileSize: 2820000,
      addedAt: now - 400000,
      playCount: 22,
      sourceType: 'built-in',
      artworkPreset: 'quiet_music',
      isFeatured: true,
      builtInSeed: 2,
    },
    {
      id: 'builtin-night',
      title: 'أغنية الليل',
      artist: 'أضواء المدينة',
      album: 'أفق السماء',
      folder: 'Built-in Studio',
      duration: 28,
      format: 'WAV',
      fileName: 'night-song.wav',
      fileSize: 2470000,
      addedAt: now - 300000,
      playCount: 11,
      sourceType: 'built-in',
      artworkPreset: 'night_city',
      isFeatured: false,
      builtInSeed: 3,
    },
    {
      id: 'builtin-nature',
      title: 'أغنية الطبيعة',
      artist: 'ربيع الصباح',
      album: 'زهور الفجر',
      folder: 'Built-in Studio',
      duration: 26,
      format: 'WAV',
      fileName: 'nature-song.wav',
      fileSize: 2290000,
      addedAt: now - 200000,
      playCount: 9,
      sourceType: 'built-in',
      artworkPreset: 'nature_bloom',
      isFeatured: false,
      builtInSeed: 4,
    },
    {
      id: 'builtin-midnight',
      title: 'Midnight Vibes',
      artist: 'Fire in Motion',
      album: 'Neon Pulse Sessions',
      folder: 'Built-in Studio',
      duration: 26,
      format: 'WAV',
      fileName: 'midnight-vibes.wav',
      fileSize: 2290000,
      addedAt: now - 100000,
      playCount: 27,
      sourceType: 'built-in',
      artworkPreset: 'midnight_vibes',
      isFeatured: true,
      builtInSeed: 5,
    },
  ];
}
