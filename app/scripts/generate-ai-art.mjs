/**
 * Опциональная генерация фона для интро через внешнее API изображений.
 *
 * OpenAI (DALL·E 3):
 *   set OPENAI_API_KEY=sk-...
 *   node scripts/generate-ai-art.mjs
 *
 * Свой промпт:
 *   set CHRONOS_ART_PROMPT=...   (Windows) или export CHRONOS_ART_PROMPT=...
 *
 * Результат: public/assets/chronos-ai-chronicles/generated/backdrop.png + manifest.json
 * Интро подхватывает manifest при наличии (см. IntroScreen).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'assets', 'chronos-ai-chronicles', 'generated');

const defaultPrompt =
  'Cinematic dark fantasy alien landscape at twilight, vast scale, atmospheric fog, ' +
  'no text, no watermark, matte painting style suitable as game splash background';

async function downloadToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

async function openaiDalle3() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false;

  const prompt = process.env.CHRONOS_ART_PROMPT || defaultPrompt;

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      response_format: 'url'
    })
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[generate-ai-art] OpenAI error:', res.status, JSON.stringify(json).slice(0, 800));
    return false;
  }

  const url = json?.data?.[0]?.url;
  if (!url) {
    console.error('[generate-ai-art] Нет URL в ответе:', JSON.stringify(json).slice(0, 500));
    return false;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const pngPath = path.join(outDir, 'backdrop.png');
  await downloadToFile(url, pngPath);

  const manifest = {
    backdrop: 'backdrop.png',
    prompt,
    provider: 'openai-dall-e-3',
    created: Date.now()
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('[generate-ai-art] Готово:', pngPath);
  return true;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  if (!process.env.OPENAI_API_KEY) {
    console.log('[generate-ai-art] Нет OPENAI_API_KEY — пропуск (не коммитьте ключи).');
    console.log('  Windows: set OPENAI_API_KEY=sk-... && node scripts/generate-ai-art.mjs');
    return 0;
  }
  return (await openaiDalle3()) ? 0 : 1;
}

try {
  process.exit(await main());
} catch (e) {
  console.error('[generate-ai-art]', e);
  process.exit(1);
}
