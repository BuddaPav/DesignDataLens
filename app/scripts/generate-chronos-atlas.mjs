/**
 * Генерация пиксель-арт атласа Chronos (32×32): биомы ×6, edge-маски ×8, волна ×4, крона, камень.
 * Детерминированно, без внешних PNG — под Kimi / Art Bible палитру.
 * Запуск: node scripts/generate-chronos-atlas.mjs
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = join(root, 'public', 'assets', 'chronos-ai-chronicles');
const outDir = join(assetsRoot, 'atlas');
const npcDir = join(assetsRoot, 'npc');
const uiDir = join(assetsRoot, 'ui');
const TILE = 32;

const BIOMES = [
  ['deep_water', { r: 10, g: 28, b: 48 }],
  ['shallow', { r: 26, g: 78, b: 98 }],
  ['beach', { r: 198, g: 178, b: 128 }],
  ['plains', { r: 52, g: 112, b: 62 }],
  ['forest', { r: 22, g: 72, b: 48 }],
  ['hills', { r: 72, g: 92, b: 58 }],
  ['mountain', { r: 88, g: 92, b: 98 }],
  ['snow', { r: 218, g: 232, b: 248 }],
  ['desert', { r: 188, g: 158, b: 92 }],
  ['ruins', { r: 58, g: 52, b: 78 }]
];

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function tileBufferFromRGBA(gen) {
  const buf = Buffer.alloc(TILE * TILE * 4);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = (y * TILE + x) * 4;
      const [R, G, B, A] = gen(x, y);
      buf[i] = clamp(Math.round(R), 0, 255);
      buf[i + 1] = clamp(Math.round(G), 0, 255);
      buf[i + 2] = clamp(Math.round(B), 0, 255);
      buf[i + 3] = clamp(Math.round(A * 255), 0, 255);
    }
  }
  return buf;
}

async function pngFromTile(gen) {
  const buf = tileBufferFromRGBA(gen);
  return sharp(buf, { raw: { width: TILE, height: TILE, channels: 4 } }).png().toBuffer();
}

function biomeTileGen(base, variant) {
  const rnd = mulberry32(variant * 977 + base.r * 13 + base.g * 7 + base.b * 3);
  return (x, y) => {
    const n1 = rnd();
    const n2 = rnd();
    const edge = Math.min(x, y, TILE - 1 - x, TILE - 1 - y);
    const shade = (n1 - 0.5) * 22 - edge * 1.2;
    const speck = n2 > 0.92 ? 35 : 0;
    return [
      base.r + shade + speck * (n2 - 0.5),
      base.g + shade * 0.9 + speck * (n2 - 0.5),
      base.b + shade * 0.85 + speck * (n2 - 0.5),
      1
    ];
  };
}

/** Маска: белый с альфой у ребра, чёрный прозрачный с другой стороны — для overlay-смешения. */
function edgeMaskGen(dir) {
  return (x, y) => {
    let t = 0;
    if (dir === 'n') t = 1 - y / (TILE - 1);
    if (dir === 's') t = y / (TILE - 1);
    if (dir === 'e') t = x / (TILE - 1);
    if (dir === 'w') t = 1 - x / (TILE - 1);
    if (dir === 'ne') t = (1 - y / (TILE - 1)) * (x / (TILE - 1));
    if (dir === 'nw') t = (1 - y / (TILE - 1)) * (1 - x / (TILE - 1));
    if (dir === 'se') t = (y / (TILE - 1)) * (x / (TILE - 1));
    if (dir === 'sw') t = (y / (TILE - 1)) * (1 - x / (TILE - 1));
    t = Math.pow(clamp(t, 0, 1), 1.4);
    return [255, 255, 255, t * 0.85];
  };
}

function waveGen(frame) {
  const phase = frame * 1.7;
  return (x, y) => {
    const w = Math.sin(x * 0.45 + y * 0.2 + phase) * 0.5 + 0.5;
    const a = w * 0.35;
    return [180, 230, 255, a];
  };
}

function treeCanopyGen() {
  const rnd = mulberry32(42);
  return (x, y) => {
    const cx = 16,
      cy = 22;
    const dx = x - cx,
      dy = y - cy;
    if (dy > 0 && dy < 18 && Math.abs(dx) < dy * 0.85) {
      const g = 40 + rnd() * 60;
      return [20, g, 45 + rnd() * 30, 0.92];
    }
    return [0, 0, 0, 0];
  };
}

function rockGen() {
  const rnd = mulberry32(99);
  return (x, y) => {
    const cx = 16,
      cy = 18;
    const d = Math.hypot(x - cx, y - cy);
    if (d < 10 + rnd() * 4) {
      const v = 70 + rnd() * 40;
      return [v, v * 0.95, v * 1.05, 1];
    }
    return [0, 0, 0, 0];
  };
}

async function writeRingFrame(size, innerR, ringW, path) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = innerR + ringW;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const d = Math.hypot(x - cx, y - cy);
      let R = 11,
        G = 12,
        B = 16,
        A = 0;
      if (d <= innerR) {
        R = 18;
        G = 22;
        B = 30;
        A = 0.88;
      } else if (d <= outerR) {
        const t = (d - innerR) / ringW;
        R = Math.round(18 + (102 - 18) * t);
        G = Math.round(22 + (252 - 22) * t);
        B = Math.round(30 + (241 - 30) * t);
        A = 1;
      } else if (d <= outerR + 6) {
        const t = (d - outerR) / 6;
        R = 102;
        G = 252;
        B = 241;
        A = (1 - t) * 0.4;
      }
      buf[i] = clamp(R, 0, 255);
      buf[i + 1] = clamp(G, 0, 255);
      buf[i + 2] = clamp(B, 0, 255);
      buf[i + 3] = clamp(Math.round(A * 255), 0, 255);
    }
  }
  await sharp(buf, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toFile(path);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  mkdirSync(npcDir, { recursive: true });
  mkdirSync(uiDir, { recursive: true });

  const frames = {};
  const composites = [];
  const cols = 32;
  let idx = 0;

  const place = async (name, gen) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const left = col * TILE;
    const top = row * TILE;
    const png = await pngFromTile(gen);
    composites.push({ input: png, left, top });
    frames[`${name}.png`] = {
      frame: { x: left, y: top, w: TILE, h: TILE },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: TILE, h: TILE },
      sourceSize: { w: TILE, h: TILE }
    };
    idx++;
  };

  for (const [name, rgb] of BIOMES) {
    for (let v = 1; v <= 6; v++) {
      const pad = v < 10 ? `0${v}` : String(v);
      await place(`biome_${name}_var${pad}`, biomeTileGen(rgb, v));
    }
  }

  for (const dir of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
    await place(`edge_mask_${dir}`, edgeMaskGen(dir));
  }

  for (let f = 1; f <= 4; f++) {
    const pad = `0${f}`;
    await place(`overlay_water_wave_${pad}`, waveGen(f));
  }
  await place('overlay_tree_canopy_01', treeCanopyGen());
  await place('overlay_rock_mountain_01', rockGen());

  const rows = Math.ceil(idx / cols);
  const atlasW = cols * TILE;
  const atlasH = rows * TILE;

  const atlasPath = join(outDir, 'atlas_world_v01.png');
  await sharp({
    create: {
      width: atlasW,
      height: atlasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toFile(atlasPath);

  const json = {
    frames,
    meta: {
      app: 'Chronos',
      image: 'atlas_world_v01.png',
      size: { w: atlasW, h: atlasH },
      scale: 1,
      generated: new Date().toISOString()
    }
  };
  writeFileSync(join(outDir, 'atlas_world_v01.json'), JSON.stringify(json, null, 2), 'utf8');

  console.log('[generate-chronos-atlas]', idx, 'sprites →', atlasW, '×', atlasH, atlasPath);

  await writeRingFrame(64, 20, 4, join(npcDir, 'npc_medallion_frame_64.png'));
  await writeRingFrame(128, 44, 6, join(npcDir, 'npc_portrait_frame_128.png'));
  console.log('[generate-chronos-atlas] portrait ring frames →', npcDir, '(HUD icons: npm prebuild → vendor-kenney-icons.mjs)');

  /** Заглушки под `manifest.json` → atlas.npc / atlas.ui (заменить TexturePacker-экспортом). */
  await writeStubAtlas('atlas_npc_v01', async () => pngFromTile(biomeTileGen(BIOMES[4][1], 3)));
  await writeStubAtlas('atlas_ui_v01', async () => pngFromTile(biomeTileGen(BIOMES[3][1], 2)));
}

/** Один тайл 32×32 + JSON — чтобы пути из manifest существовали до финального арта */
async function writeStubAtlas(baseName, makeTilePng) {
  const pngBuf = await makeTilePng();
  const pngPath = join(outDir, `${baseName}.png`);
  await sharp(pngBuf).toFile(pngPath);
  const json = {
    frames: {
      [`${baseName}_stub.png`]: {
        frame: { x: 0, y: 0, w: TILE, h: TILE },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: TILE, h: TILE },
        sourceSize: { w: TILE, h: TILE },
      },
    },
    meta: {
      app: 'Chronos',
      image: `${baseName}.png`,
      size: { w: TILE, h: TILE },
      scale: 1,
      generated: new Date().toISOString(),
      note: 'stub single-tile atlas — replace with TexturePacker export',
    },
  };
  writeFileSync(join(outDir, `${baseName}.json`), JSON.stringify(json, null, 2), 'utf8');
  console.log('[generate-chronos-atlas] stub atlas', baseName);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
