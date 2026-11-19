import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { generateBuiltInWavBlob, getBuiltInSeedTracks } from '../src/core/sampleAudioGenerator.ts';
import { EQUALIZER_PRESETS, EQ_FREQUENCIES } from '../src/core/equalizerPresets.ts';
import { STRINGS } from '../src/core/i18n.ts';
import { parseAudioFile, SUPPORTED_EXTENSIONS } from '../src/core/metadataParser.ts';

async function run() {
  let passed = 0;
  const test = async (name, fn) => {
    await fn();
    passed += 1;
    console.log(`PASS: ${name}`);
  };

  await test('1. Built-in studio tracks & offline PCM WAV generation', async () => {
    const seeds = getBuiltInSeedTracks();
    assert.equal(seeds.length, 6);
    assert.equal(seeds[0].title, 'أغنية الأحلام');
    for (const s of seeds) {
      const blob = generateBuiltInWavBlob(s.builtInSeed ?? 0);
      assert.ok(blob.size > 100000, `Expected valid WAV blob for ${s.title}`);
      const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
      assert.equal(String.fromCharCode(...header.slice(0, 4)), 'RIFF');
      assert.equal(String.fromCharCode(...header.slice(8, 12)), 'WAVE');
    }
  });

  await test('2. Equalizer 10-band frequencies and presets integrity', async () => {
    assert.equal(EQ_FREQUENCIES.length, 10);
    assert.ok(EQUALIZER_PRESETS.length >= 8);
    for (const p of EQUALIZER_PRESETS) {
      assert.equal(p.bands.length, 10, `Preset ${p.id} must have 10 bands`);
      assert.ok(p.nameAr.length > 0 && p.nameEn.length > 0);
    }
  });

  await test('3. Arabic & English localization key parity', async () => {
    const arKeys = Object.keys(STRINGS.ar).sort();
    const enKeys = Object.keys(STRINGS.en).sort();
    assert.deepEqual(arKeys, enKeys);
  });

  await test('4. Supported audio formats coverage (MP3, WAV, FLAC, AAC, M4A, OGG)', async () => {
    for (const ext of ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg']) {
      assert.ok(SUPPORTED_EXTENSIONS.includes(ext), `Missing format ${ext}`);
    }
  });

  await test('5. Corrupted/empty 0-byte audio file handled safely without crash', async () => {
    const emptyFile = new File([], 'broken_song.mp3', { type: 'audio/mpeg' });
    const parsed = await parseAudioFile(emptyFile, 'TestFolder');
    assert.equal(parsed.isCorrupted, true);
    assert.equal(parsed.title, 'broken song');
    assert.equal(parsed.format, 'MP3');
  });

  await test('6. PWA icons & manifest build assets verification', async () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    for (const f of ['icon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'apple-touch-icon.png']) {
      const full = path.join(publicDir, f);
      assert.ok(fs.existsSync(full), `Missing icon asset ${f}`);
      assert.ok(fs.statSync(full).size > 200, `Asset ${f} looks empty`);
    }
  });

  await test('7. Real offline MP3 encoder produces valid MPEG frames', async () => {
    const { Mp3Encoder } = await import('@breezystack/lamejs');
    const encoder = new Mp3Encoder(2, 44100, 192);
    const left = new Int16Array(4410);
    const right = new Int16Array(4410);
    for (let i = 0; i < left.length; i++) {
      const val = Math.round(Math.sin((2 * Math.PI * 440 * i) / 44100) * 16000);
      left[i] = val;
      right[i] = val;
    }
    const frame = encoder.encodeBuffer(left, right);
    const tail = encoder.flush();
    assert.ok(frame.length + tail.length > 500, 'Expected valid encoded MP3 frame bytes');
    // Check MPEG frame sync (0xFF 0xFB or 0xFF 0xF3)
    const rawBytes = frame.length > 0 ? frame : tail;
    const firstBytes = new Uint8Array(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);
    assert.equal(firstBytes[0], 0xff);
    assert.ok((firstBytes[1] & 0xe0) === 0xe0, 'Expected MPEG audio frame sync header');
  });

  console.log(`\nAll ${passed} core verification tests passed.`);
}

run().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
