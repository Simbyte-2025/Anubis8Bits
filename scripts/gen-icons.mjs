// Generates PWA icons from the catSpriteSit pixel matrix.
// Run once: `node scripts/gen-icons.mjs` then commit the public/*.png outputs.
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public');

const catSpriteSit = [
  [0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,2,2,2,3,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,2,2,2,2,2,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,2,2,2,2,2,2,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,2,2,2,2,2,2,2,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,2,2,2,2,2,2,2,1,1,0,0,0,0,0],
  [0,0,1,1,1,0,2,2,2,2,2,2,2,1,1,0,0,0,0,0],
  [0,1,1,0,1,1,1,2,2,2,2,2,1,1,0,0,0,0,0,0],
  [0,1,1,0,0,1,1,1,1,1,1,4,4,4,4,0,0,0,0,0],
  [0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const palette = {
  0: [0, 0, 0, 0],
  1: [0x4B, 0x36, 0x21, 0xff],
  2: [0xF5, 0xF5, 0xDC, 0xff],
  3: [0x87, 0xCE, 0xEB, 0xff],
  4: [0xFF, 0xFF, 0xFF, 0xff]
};

const BG = [0xFF, 0xB6, 0xC1, 0xff];
const BG_DARK = [0xF5, 0x9C, 0xA8, 0xff];

const setPixel = (png, x, y, rgba) => {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = rgba[0];
  png.data[idx + 1] = rgba[1];
  png.data[idx + 2] = rgba[2];
  png.data[idx + 3] = rgba[3];
};

const renderIcon = (size, opts = {}) => {
  const { transparent = false, padFraction = 0.15 } = opts;
  const png = new PNG({ width: size, height: size });
  const bgRgba = transparent ? [0, 0, 0, 0] : BG;
  const bgDarkRgba = transparent ? [0, 0, 0, 0] : BG_DARK;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const checker = (Math.floor(x / (size / 16)) + Math.floor(y / (size / 16))) % 2;
      setPixel(png, x, y, transparent ? bgRgba : (checker ? bgRgba : bgDarkRgba));
    }
  }
  const spriteH = catSpriteSit.length;
  const spriteW = catSpriteSit[0].length;
  const usable = size * (1 - padFraction * 2);
  const scale = Math.floor(Math.min(usable / spriteW, usable / spriteH));
  const drawW = spriteW * scale;
  const drawH = spriteH * scale;
  const offsetX = Math.floor((size - drawW) / 2);
  const offsetY = Math.floor((size - drawH) / 2);
  for (let r = 0; r < spriteH; r++) {
    for (let c = 0; c < spriteW; c++) {
      const code = catSpriteSit[r][c];
      if (code === 0) continue;
      const rgba = palette[code];
      for (let py = 0; py < scale; py++) {
        for (let px = 0; px < scale; px++) {
          setPixel(png, offsetX + c * scale + px, offsetY + r * scale + py, rgba);
        }
      }
    }
  }
  return png;
};

const writePng = (png, name) => {
  const file = path.join(outDir, name);
  const buf = PNG.sync.write(png);
  fs.writeFileSync(file, buf);
  console.log(`wrote ${file} (${png.width}x${png.height})`);
};

fs.mkdirSync(outDir, { recursive: true });
writePng(renderIcon(180, { padFraction: 0.1 }), 'apple-touch-icon.png');
writePng(renderIcon(192, { padFraction: 0.1 }), 'icon-192.png');
writePng(renderIcon(512, { padFraction: 0.1 }), 'icon-512.png');
writePng(renderIcon(512, { padFraction: 0.22 }), 'icon-512-maskable.png');
console.log('done');
