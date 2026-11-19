import { EqualizerPresetId } from '../types/audio';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

export const EQ_FREQ_LABELS = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'] as const;

export interface EqualizerPresetDefinition {
  id: EqualizerPresetId;
  nameAr: string;
  nameEn: string;
  bass: number;
  treble: number;
  bands: number[];
}

export const EQUALIZER_PRESETS: EqualizerPresetDefinition[] = [
  {
    id: 'flat',
    nameAr: 'متوازن (Flat)',
    nameEn: 'Flat',
    bass: 0,
    treble: 0,
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 'bass_boost',
    nameAr: 'تعزيز الباس (Bass)',
    nameEn: 'Bass Boost',
    bass: 7,
    treble: 1,
    bands: [7, 6, 5, 3, 1, 0, 0, 0, 1, 2],
  },
  {
    id: 'electronic',
    nameAr: 'نيون إلكتروني',
    nameEn: 'Neon Electronic',
    bass: 5,
    treble: 5,
    bands: [5, 4, 2, 0, -2, 1, 3, 4, 5, 6],
  },
  {
    id: 'pop',
    nameAr: 'بوب',
    nameEn: 'Pop',
    bass: 2,
    treble: 3,
    bands: [-1, 2, 4, 5, 3, 0, -1, 1, 3, 4],
  },
  {
    id: 'rock',
    nameAr: 'روك',
    nameEn: 'Rock',
    bass: 4,
    treble: 4,
    bands: [5, 4, 2, 0, -1, 0, 2, 4, 5, 5],
  },
  {
    id: 'jazz',
    nameAr: 'جاز',
    nameEn: 'Jazz',
    bass: 3,
    treble: 2,
    bands: [3, 2, 1, 2, -1, -1, 0, 2, 3, 4],
  },
  {
    id: 'classical',
    nameAr: 'كلاسيكي',
    nameEn: 'Classical',
    bass: 1,
    treble: 3,
    bands: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
  },
  {
    id: 'vocal',
    nameAr: 'صوت واضح',
    nameEn: 'Vocal Clarity',
    bass: -2,
    treble: 2,
    bands: [-3, -2, -1, 2, 4, 5, 4, 2, 1, 0],
  },
];
