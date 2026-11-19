import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Pure-Node RGBA PNG generator so zero native canvas dependencies are needed.
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter None
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function renderNeonIcon(size, safeMarginRatio = 0.0) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const scale = 1 - safeMarginRatio * 2;
  const ringR = size * 0.34 * scale;
  const ringThick = size * 0.042 * scale;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      // Deep midnight-indigo gradient background
      const bgT = Math.min(1, Math.hypot(x - cx, y - cy * 0.65) / (size * 0.78));
      let r = lerp(28, 4, bgT);
      let g = lerp(24, 9, bgT);
      let b = lerp(82, 30, bgT);

      // Ambient top-left cyan / bottom-right magenta glow
      const glowCyan = Math.exp(-Math.pow(Math.hypot(x - size * 0.3, y - size * 0.3) / (size * 0.45), 2));
      const glowPink = Math.exp(-Math.pow(Math.hypot(x - size * 0.72, y - size * 0.72) / (size * 0.45), 2));
      r += glowPink * 55;
      g += glowCyan * 42;
      b += glowCyan * 70 + glowPink * 50;

      // Neon Ring
      const ringDist = Math.abs(dist - ringR);
      const angle = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2); // 0..1
      const ringCore = Math.max(0, 1 - ringDist / (ringThick * 0.65));
      const ringHalo = Math.exp(-Math.pow(ringDist / (ringThick * 1.9), 2)) * 0.65;
      const ringIntensity = Math.min(1, ringCore + ringHalo);

      const ringRCol = lerp(0, 236, Math.abs(angle - 0.5) * 2);
      const ringGCol = lerp(229, 72, Math.abs(angle - 0.5) * 2);
      const ringBCol = lerp(255, 153, Math.abs(angle - 0.5) * 2);

      r = lerp(r, ringRCol, ringIntensity);
      g = lerp(g, ringGCol, ringIntensity);
      b = lerp(b, ringBCol, ringIntensity);

      // Music note glyph inside center
      const nx = (x - cx) / (size * scale);
      const ny = (y - cy) / (size * scale);

      // Two note heads + vertical stems + top beam
      const head1 = Math.hypot(nx + 0.085, ny - 0.115) < 0.072;
      const head2 = Math.hypot(nx - 0.105, ny - 0.065) < 0.072;
      const stem1 = nx >= -0.045 && nx <= -0.005 && ny >= -0.145 && ny <= 0.115;
      const stem2 = nx >= 0.145 && nx <= 0.185 && ny >= -0.195 && ny <= 0.065;
      const beam =
        nx >= -0.045 &&
        nx <= 0.185 &&
        ny >= -0.165 - 0.22 * (nx + 0.045) &&
        ny <= -0.105 - 0.22 * (nx + 0.045);

      if (head1 || head2 || stem1 || stem2 || beam) {
        const noteMix = head2 || stem2 ? 0.55 : 0.0;
        r = lerp(120, 236, noteMix);
        g = lerp(240, 100, noteMix);
        b = 255;
      }

      buf[idx] = Math.max(0, Math.min(255, Math.round(r)));
      buf[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      buf[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      buf[idx + 3] = 255;
    }
  }
  return encodePNG(size, size, buf);
}

const outDir = path.resolve(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), renderNeonIcon(192, 0.04));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), renderNeonIcon(512, 0.04));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), renderNeonIcon(512, 0.16));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), renderNeonIcon(180, 0.04));

console.log('Generated PWA PNG icons in public/.');
