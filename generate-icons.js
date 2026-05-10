const { createCanvas } = (() => {
  try { return require('canvas'); } catch { return null; }
})();

const fs = require('fs');
const path = require('path');

// Generate simple PNG icons using raw bytes (no canvas needed)
function generatePNG(size) {
  // Create a simple solid color PNG
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // data length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8; // bit depth
  ihdr[17] = 2; // color type (RGB)
  ihdr[18] = 0; // compression
  ihdr[19] = 0; // filter
  ihdr[20] = 0; // interlace
  
  const crc32 = require('zlib');
  const ihdrData = ihdr.slice(4, 21);
  const ihdrCrc = crc32.crc32(ihdrData);
  ihdr.writeInt32BE(ihdrCrc, 21);
  
  // IDAT chunk - raw pixel data with zlib compression
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 3)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const offset = y * (1 + width * 3) + 1 + x * 3;
      // Gradient purple circle
      const cx = x - width / 2;
      const cy = y - height / 2;
      const r = Math.sqrt(cx * cx + cy * cy);
      const maxR = width / 2;
      
      if (r < maxR * 0.85) {
        // Inside circle - indigo gradient
        const t = r / (maxR * 0.85);
        rawData[offset] = Math.round(79 + t * 20);     // R
        rawData[offset + 1] = Math.round(70 + t * 10);  // G
        rawData[offset + 2] = Math.round(229 - t * 30); // B
      } else if (r < maxR * 0.95) {
        // Border
        rawData[offset] = 255;
        rawData[offset + 1] = 255;
        rawData[offset + 2] = 255;
      } else {
        // Outside - transparent (white for RGB)
        rawData[offset] = 255;
        rawData[offset + 1] = 255;
        rawData[offset + 2] = 255;
      }
    }
  }
  
  const compressed = crc32.deflateSync(rawData);
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressed.length, 0);
  const idatType = Buffer.from('IDAT');
  const idatCrc = crc32.crc32(Buffer.concat([idatType, compressed]));
  const idatCrcBuf = Buffer.alloc(4);
  idatCrcBuf.writeInt32BE(idatCrc, 0);
  
  // IEND chunk
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
  
  return Buffer.concat([signature, ihdr, idatLength, idatType, compressed, idatCrcBuf, iend]);
}

[16, 48, 128].forEach(size => {
  const png = generatePNG(size);
  fs.writeFileSync(path.join('public', 'icons', `icon${size}.png`), png);
  console.log(`Generated icon${size}.png`);
});
