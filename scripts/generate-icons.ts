import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to create an uncompressed/deflated RGBA PNG
function createPNG(size: number, bgColor: [number, number, number]): Buffer {
  const width = size;
  const height = size;

  // Each row starts with filter byte 0
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Rounded rect mask
      const dx = Math.max(0, Math.abs(x - cx) - (size / 2 - radius));
      const dy = Math.max(0, Math.abs(y - cy) - (size / 2 - radius));
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isInside = dist <= radius;

      if (isInside) {
        // Gradient from dark blue to emerald teal
        const factor = (x + y) / (width + height);
        const r = Math.round(15 * (1 - factor) + 16 * factor);
        const g = Math.round(23 * (1 - factor) + 185 * factor);
        const b = Math.round(42 * (1 - factor) + 129 * factor);

        // Center symbol (cross / bar chart indicator)
        const inBar1 = x >= size * 0.28 && x <= size * 0.38 && y >= size * 0.55 && y <= size * 0.75;
        const inBar2 = x >= size * 0.45 && x <= size * 0.55 && y >= size * 0.40 && y <= size * 0.75;
        const inBar3 = x >= size * 0.62 && x <= size * 0.72 && y >= size * 0.25 && y <= size * 0.75;

        if (inBar1 || inBar2 || inBar3) {
          rawData[pixelOffset] = 255;
          rawData[pixelOffset + 1] = 255;
          rawData[pixelOffset + 2] = 255;
          rawData[pixelOffset + 3] = 240;
        } else {
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        // Transparent outside rounded corners
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = data.length;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);

    // CRC32
    let crc = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      let byte = chunk[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    chunk.writeUInt32BE(crc, 8 + len);
    return chunk;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('./public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, [15, 23, 42]));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, [15, 23, 42]));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, [15, 23, 42]));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, [15, 23, 42]));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, [15, 23, 42]));

console.log('PWA icons created successfully in public/');
