import { Mp3Encoder } from '@breezystack/lamejs';

export interface TrimOptions {
  startSec: number;
  endSec: number;
  fadeInSec?: number;
  fadeOutSec?: number;
}

function getOfflineAudioContext(): AudioContext {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctx();
}

export async function decodeMediaToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = getOfflineAudioContext();
  try {
    // Copy slice because decodeAudioData detaches the buffer
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    return decoded;
  } finally {
    if (ctx.state !== 'closed') {
      await ctx.close().catch(() => undefined);
    }
  }
}

export function extractWaveformPeaks(buffer: AudioBuffer, numBuckets = 120): number[] {
  const channelData = buffer.getChannelData(0);
  const totalSamples = channelData.length;
  if (totalSamples === 0) return new Array(numBuckets).fill(0.1);

  const blockSize = Math.max(1, Math.floor(totalSamples / numBuckets));
  const peaks: number[] = [];
  let maxPeak = 0.001;

  for (let i = 0; i < numBuckets; i++) {
    const start = i * blockSize;
    const end = Math.min(totalSamples, start + blockSize);
    let peak = 0;
    const step = Math.max(1, Math.floor((end - start) / 64));
    for (let j = start; j < end; j += step) {
      const abs = Math.abs(channelData[j]);
      if (abs > peak) peak = abs;
    }
    if (peak > maxPeak) maxPeak = peak;
    peaks.push(peak);
  }

  return peaks.map((p) => Math.max(0.08, p / maxPeak));
}

export function trimAudioBuffer(buffer: AudioBuffer, opts: TrimOptions): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, Math.floor(opts.startSec * sampleRate));
  const endSample = Math.min(buffer.length, Math.floor(opts.endSec * sampleRate));
  const frameCount = Math.max(1, endSample - startSample);
  const channels = buffer.numberOfChannels;

  const ctx = getOfflineAudioContext();
  const trimmed = ctx.createBuffer(channels, frameCount, sampleRate);
  void ctx.close().catch(() => undefined);

  const fadeInSamples = Math.min(
    Math.floor(frameCount / 2),
    Math.floor((opts.fadeInSec ?? 0) * sampleRate)
  );
  const fadeOutSamples = Math.min(
    Math.floor(frameCount / 2),
    Math.floor((opts.fadeOutSec ?? 0) * sampleRate)
  );

  for (let ch = 0; ch < channels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = trimmed.getChannelData(ch);
    for (let i = 0; i < frameCount; i++) {
      let sample = src[startSample + i] ?? 0;
      if (fadeInSamples > 0 && i < fadeInSamples) {
        sample *= i / fadeInSamples;
      }
      if (fadeOutSamples > 0 && i >= frameCount - fadeOutSamples) {
        const rem = frameCount - 1 - i;
        sample *= Math.max(0, rem / fadeOutSamples);
      }
      dst[i] = sample;
    }
  }

  return trimmed;
}

function floatTo16BitPCM(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return out;
}

export async function encodeAudioBufferToMp3(
  buffer: AudioBuffer,
  kbps = 192,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const channels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, kbps);

  const leftPCM = floatTo16BitPCM(buffer.getChannelData(0));
  const rightPCM =
    channels > 1 ? floatTo16BitPCM(buffer.getChannelData(1)) : undefined;

  const mp3Chunks: BlobPart[] = [];
  const blockSize = 1152 * 40; // ~46,080 samples per async slice (~1s audio)
  const total = leftPCM.length;

  for (let i = 0; i < total; i += blockSize) {
    const leftSlice = leftPCM.subarray(i, i + blockSize);
    const rightSlice = rightPCM ? rightPCM.subarray(i, i + blockSize) : undefined;
    const encoded = encoder.encodeBuffer(leftSlice, rightSlice);
    if (encoded.length > 0) {
      mp3Chunks.push(new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength).slice());
    }
    onProgress?.(Math.min(98, Math.round(((i + blockSize) / total) * 100)));
    // Yield to browser UI so animations stay smooth
    await new Promise((r) => setTimeout(r, 0));
  }

  const tail = encoder.flush();
  if (tail.length > 0) {
    mp3Chunks.push(new Uint8Array(tail.buffer, tail.byteOffset, tail.byteLength).slice());
  }
  onProgress?.(100);

  return new Blob(mp3Chunks, { type: 'audio/mpeg' });
}

export function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const dataBytes = length * numChannels * 2;
  const outBuf = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(outBuf);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  const ch0 = buffer.getChannelData(0);
  const ch1 = numChannels > 1 ? buffer.getChannelData(1) : ch0;
  let offset = 44;

  for (let i = 0; i < length; i++) {
    const s0 = Math.max(-1, Math.min(1, ch0[i]));
    view.setInt16(offset, s0 < 0 ? Math.round(s0 * 0x8000) : Math.round(s0 * 0x7fff), true);
    offset += 2;
    if (numChannels > 1) {
      const s1 = Math.max(-1, Math.min(1, ch1[i]));
      view.setInt16(offset, s1 < 0 ? Math.round(s1 * 0x8000) : Math.round(s1 * 0x7fff), true);
      offset += 2;
    }
  }

  return new Blob([outBuf], { type: 'audio/wav' });
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
