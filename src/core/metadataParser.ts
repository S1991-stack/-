import { AudioTrack } from '../types/audio';

export const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus', 'webm', 'mp4'] as const;

export interface ParsedAudioMetadata {
  title: string;
  artist: string;
  album: string;
  artworkDataUrl?: string;
  duration: number;
  format: string;
  isCorrupted: boolean;
  corruptedReason?: string;
}

function decodeText(bytes: Uint8Array, encodingByte?: number): string {
  try {
    if (encodingByte === 1 || encodingByte === 2) {
      // UTF-16
      const isLE = bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe;
      const isBE = bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff;
      const start = isLE || isBE ? 2 : 0;
      const decoder = new TextDecoder(isBE ? 'utf-16be' : 'utf-16le');
      return decoder.decode(bytes.subarray(start)).replace(/\0+$/, '').trim();
    }
    if (encodingByte === 3) {
      return new TextDecoder('utf-8').decode(bytes).replace(/\0+$/, '').trim();
    }
    // Try UTF-8 first, fallback latin1
    const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/\0+$/, '').trim();
    return utf8;
  } catch {
    return '';
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function parseID3v2(buf: Uint8Array): { title?: string; artist?: string; album?: string; artworkDataUrl?: string } {
  const result: { title?: string; artist?: string; album?: string; artworkDataUrl?: string } = {};
  if (buf.length < 10 || buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) {
    return result;
  }
  const versionMajor = buf[3];
  const size =
    ((buf[6] & 0x7f) << 21) |
    ((buf[7] & 0x7f) << 14) |
    ((buf[8] & 0x7f) << 7) |
    (buf[9] & 0x7f);

  const end = Math.min(buf.length, 10 + size);
  let pos = 10;

  while (pos + 10 <= end) {
    const frameId = String.fromCharCode(buf[pos], buf[pos + 1], buf[pos + 2], buf[pos + 3]);
    if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

    const frameSize =
      versionMajor >= 4
        ? ((buf[pos + 4] & 0x7f) << 21) |
          ((buf[pos + 5] & 0x7f) << 14) |
          ((buf[pos + 6] & 0x7f) << 7) |
          (buf[pos + 7] & 0x7f)
        : (buf[pos + 4] << 24) | (buf[pos + 5] << 16) | (buf[pos + 6] << 8) | buf[pos + 7];

    pos += 10;
    if (frameSize <= 0 || pos + frameSize > end) break;

    const payload = buf.subarray(pos, pos + frameSize);
    if (frameId === 'TIT2') {
      result.title = decodeText(payload.subarray(1), payload[0]);
    } else if (frameId === 'TPE1') {
      result.artist = decodeText(payload.subarray(1), payload[0]);
    } else if (frameId === 'TALB') {
      result.album = decodeText(payload.subarray(1), payload[0]);
    } else if (frameId === 'APIC' && !result.artworkDataUrl && payload.length > 10) {
      const encoding = payload[0];
      let cursor = 1;
      while (cursor < payload.length && payload[cursor] !== 0) cursor++;
      const mime = decodeText(payload.subarray(1, cursor)) || 'image/jpeg';
      cursor += 2; // skip null + picture type
      // skip description
      if (encoding === 1 || encoding === 2) {
        while (cursor + 1 < payload.length && !(payload[cursor] === 0 && payload[cursor + 1] === 0)) {
          cursor += 2;
        }
        cursor += 2;
      } else {
        while (cursor < payload.length && payload[cursor] !== 0) cursor++;
        cursor += 1;
      }
      if (cursor < payload.length) {
        const imgBytes = payload.subarray(cursor);
        if (imgBytes.length > 64) {
          const safeMime = mime.startsWith('image/') ? mime : 'image/jpeg';
          result.artworkDataUrl = `data:${safeMime};base64,${uint8ToBase64(imgBytes)}`;
        }
      }
    }

    pos += frameSize;
  }

  return result;
}

function parseFlac(buf: Uint8Array): { title?: string; artist?: string; album?: string; artworkDataUrl?: string } {
  const result: { title?: string; artist?: string; album?: string; artworkDataUrl?: string } = {};
  if (buf.length < 8 || buf[0] !== 0x66 || buf[1] !== 0x4c || buf[2] !== 0x61 || buf[3] !== 0x43) {
    return result;
  }
  let pos = 4;
  let isLast = false;

  while (!isLast && pos + 4 <= buf.length) {
    const header = buf[pos];
    isLast = (header & 0x80) !== 0;
    const blockType = header & 0x7f;
    const len = (buf[pos + 1] << 16) | (buf[pos + 2] << 8) | buf[pos + 3];
    pos += 4;
    if (pos + len > buf.length) break;

    const block = buf.subarray(pos, pos + len);
    if (blockType === 4 && block.length >= 8) {
      // VORBIS_COMMENT (little endian)
      const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
      let c = 0;
      const vendorLen = view.getUint32(c, true);
      c += 4 + vendorLen;
      if (c + 4 <= block.length) {
        const count = view.getUint32(c, true);
        c += 4;
        for (let i = 0; i < count && c + 4 <= block.length; i++) {
          const itemLen = view.getUint32(c, true);
          c += 4;
          if (c + itemLen > block.length) break;
          const entry = new TextDecoder('utf-8').decode(block.subarray(c, c + itemLen));
          c += itemLen;
          const eq = entry.indexOf('=');
          if (eq > 0) {
            const key = entry.slice(0, eq).toUpperCase();
            const val = entry.slice(eq + 1).trim();
            if (key === 'TITLE') result.title = val;
            else if (key === 'ARTIST') result.artist = val;
            else if (key === 'ALBUM') result.album = val;
          }
        }
      }
    } else if (blockType === 6 && !result.artworkDataUrl && block.length > 32) {
      // PICTURE
      const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
      let c = 4; // picture type
      const mimeLen = view.getUint32(c, true);
      c += 4;
      const mime = new TextDecoder('ascii').decode(block.subarray(c, c + mimeLen)) || 'image/jpeg';
      c += mimeLen;
      const descLen = view.getUint32(c, true);
      c += 4 + descLen + 16; // skip width, height, depth, colors
      if (c + 4 <= block.length) {
        const imgLen = view.getUint32(c, true);
        c += 4;
        if (c + imgLen <= block.length) {
          const imgBytes = block.subarray(c, c + imgLen);
          result.artworkDataUrl = `data:${mime};base64,${uint8ToBase64(imgBytes)}`;
        }
      }
    }
    pos += len;
  }

  return result;
}

function cleanFileNameTitle(fileName: string): { title: string; artist: string } {
  const withoutExt = fileName.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
  const dashSplit = withoutExt.split(' - ');
  if (dashSplit.length >= 2) {
    return {
      artist: dashSplit[0].trim(),
      title: dashSplit.slice(1).join(' - ').trim(),
    };
  }
  return {
    title: withoutExt || 'مقطع صوتي بدون عنوان',
    artist: 'فنان غير معروف',
  };
}

async function probeMediaDuration(file: Blob): Promise<{ duration: number; playable: boolean }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let settled = false;

    const finish = (duration: number, playable: boolean) => {
      if (settled) return;
      settled = true;
      audio.src = '';
      URL.revokeObjectURL(url);
      resolve({ duration: Number.isFinite(duration) && duration > 0 ? duration : 0, playable });
    };

    const timer = window.setTimeout(() => finish(0, false), 4500);

    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      window.clearTimeout(timer);
      finish(audio.duration, true);
    };
    audio.onerror = () => {
      window.clearTimeout(timer);
      finish(0, false);
    };
    audio.src = url;
  });
}

export async function parseAudioFile(file: File, folderName = 'المجلد المحلي'): Promise<Omit<AudioTrack, 'id' | 'addedAt' | 'playCount'>> {
  const ext = (file.name.split('.').pop() || 'AUDIO').toUpperCase();
  const fallback = cleanFileNameTitle(file.name);

  let title = fallback.title;
  let artist = fallback.artist;
  let album = folderName || 'مكتبة محلية';
  let artworkDataUrl: string | undefined;

  if (file.size === 0) {
    return {
      title,
      artist,
      album,
      folder: folderName,
      duration: 0,
      format: ext,
      fileName: file.name,
      fileSize: file.size,
      sourceType: 'local',
      isCorrupted: true,
      corruptedReason: 'الملف فارغ (0 بايت)',
    };
  }

  try {
    const headSlice = await file.slice(0, Math.min(file.size, 1024 * 1024)).arrayBuffer();
    const bytes = new Uint8Array(headSlice);

    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const id3 = parseID3v2(bytes);
      if (id3.title) title = id3.title;
      if (id3.artist) artist = id3.artist;
      if (id3.album) album = id3.album;
      if (id3.artworkDataUrl) artworkDataUrl = id3.artworkDataUrl;
    } else if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
      const flac = parseFlac(bytes);
      if (flac.title) title = flac.title;
      if (flac.artist) artist = flac.artist;
      if (flac.album) album = flac.album;
      if (flac.artworkDataUrl) artworkDataUrl = flac.artworkDataUrl;
    }

    // Also inspect ID3v1 tail for MP3
    if ((title === fallback.title || artist === fallback.artist) && file.size > 128) {
      const tail = new Uint8Array(await file.slice(file.size - 128).arrayBuffer());
      if (tail[0] === 0x54 && tail[1] === 0x41 && tail[2] === 0x47) {
        const t1 = decodeText(tail.subarray(3, 33));
        const a1 = decodeText(tail.subarray(33, 63));
        const al1 = decodeText(tail.subarray(63, 93));
        if (t1 && title === fallback.title) title = t1;
        if (a1 && artist === fallback.artist) artist = a1;
        if (al1 && album === folderName) album = al1;
      }
    }
  } catch {
    // Metadata parse errors never crash import
  }

  const probe = await probeMediaDuration(file);

  return {
    title,
    artist,
    album,
    folder: folderName,
    duration: probe.duration,
    format: ext,
    fileName: file.name,
    fileSize: file.size,
    sourceType: 'local',
    artworkDataUrl,
    isCorrupted: !probe.playable,
    corruptedReason: probe.playable ? undefined : 'تعذر فك ترميز الملف الصوتي أو الصيغة تالفة',
  };
}
