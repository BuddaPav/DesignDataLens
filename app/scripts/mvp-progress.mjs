/**
 * Считает чекбоксы во всех docs/mvp/STAGES_*.md: [x] / [X] vs [ ].
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mvpDir = join(__dirname, '..', '..', 'docs', 'mvp');

let files;
try {
  files = readdirSync(mvpDir).filter((f) => f.startsWith('STAGES_') && f.endsWith('.md'));
} catch {
  console.error('mvp-progress: docs/mvp not found');
  process.exit(1);
}

if (files.length === 0) {
  console.error('mvp-progress: no STAGES_*.md files');
  process.exit(1);
}

let done = 0;
let pending = 0;
for (const f of files.sort()) {
  const md = readFileSync(join(mvpDir, f), 'utf8');
  done += (md.match(/^\s*-\s*\[[xX]\]/gm) ?? []).length;
  pending += (md.match(/^\s*-\s*\[ \]/gm) ?? []).length;
}

console.log(`MVP stages (${files.join(', ')}): ${done} done, ${pending} open (checkbox lines)`);
process.exit(0);
