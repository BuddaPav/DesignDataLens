/**
 * Список файлов под app/public для ручной сверки ссылок и пайплайна ассетов.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, '..', 'public');

function walk(dir, prefix = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(p).isDirectory()) {
      out.push(...walk(p, rel));
    } else {
      out.push(rel.replace(/\\/g, '/'));
    }
  }
  return out;
}

try {
  const files = walk(publicDir).sort();
  console.log(`[orchestrate/assets] ${files.length} files under public/`);
  for (const f of files) console.log(f);
} catch (e) {
  console.error('[orchestrate/assets]', e.message);
  process.exitCode = 1;
}
