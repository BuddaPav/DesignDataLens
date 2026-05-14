/**
 * Подтягивает PNG из набора Kenney Game Icons (экспорт 32×32, общественное зеркало на GitHub),
 * нормализует размер и кладёт на стабильные пути Chronos (`npc_status_*`, UI-квест/закрыть).
 * Запуск: после `generate-chronos-atlas.mjs` в `npm run prebuild`.
 *
 * Лицензия исходных спрайтов: CC0 (Kenney, https://kenney.nl). См. third_party/kenney-game-icons/LICENSE.txt
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = join(root, 'public', 'assets', 'chronos-ai-chronicles');
const uiDir = join(assetsRoot, 'ui');
const npcDir = join(assetsRoot, 'npc');
const thirdParty = join(assetsRoot, 'third_party', 'kenney-game-icons');

const RAW_BASE =
  'https://raw.githubusercontent.com/nicodinh/kenney-icon-font/develop/pngs/32x32';

/** @type {Array<{ key: string; out: string; size: number }>} */
const JOBS = [
  { key: 'flag.png', out: join(uiDir, 'ui_icon_quest_24.png'), size: 24 },
  { key: 'button-times.png', out: join(uiDir, 'ui_icon_close_24.png'), size: 24 },
  { key: 'heart.png', out: join(npcDir, 'npc_status_friendly.png'), size: 32 },
  { key: 'fist.png', out: join(npcDir, 'npc_status_hostile.png'), size: 32 },
  { key: 'exclamation-triangle.png', out: join(npcDir, 'npc_status_stressed.png'), size: 32 },
  { key: 'minus-circle.png', out: join(npcDir, 'npc_status_dead.png'), size: 32 },
];

async function fetchPng(name) {
  const url = `${RAW_BASE}/${encodeURIComponent(name)}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`[vendor-kenney-icons] ${res.status} ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function fileLooksPresent(path) {
  try {
    return existsSync(path) && statSync(path).size > 64;
  } catch {
    return false;
  }
}

async function writeResized(buf, outPath, size) {
  await sharp(buf)
    .ensureAlpha()
    .resize(size, size, { fit: 'contain', position: 'centre' })
    .png()
    .toFile(outPath);
}

async function main() {
  mkdirSync(uiDir, { recursive: true });
  mkdirSync(npcDir, { recursive: true });
  mkdirSync(thirdParty, { recursive: true });

  for (const { key, out, size } of JOBS) {
    let buf;
    try {
      buf = await fetchPng(key);
    } catch (e) {
      if (fileLooksPresent(out)) {
        console.warn('[vendor-kenney-icons] network skip, using existing', out, `(${e.message})`);
        continue;
      }
      throw e;
    }
    await writeResized(buf, out, size);
    console.log('[vendor-kenney-icons]', key, '→', out, `(${size}×${size})`);
  }

  const licenseText = `Kenney Game Icons — CC0 (public domain)
Source: https://kenney.nl/assets/game-icons
Raster mirror used for CI: https://github.com/nicodinh/kenney-icon-font (develop/pngs/32x32)
You may use these graphics in personal and commercial projects; credit is appreciated but not required.
`;
  writeFileSync(join(thirdParty, 'LICENSE.txt'), licenseText, 'utf8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
