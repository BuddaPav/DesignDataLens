#!/usr/bin/env node
/**
 * Выгружает ключи словаря ru в текстовый файл (для переводчиков / diff).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/i18n/index.ts'), 'utf8');
const start = src.indexOf('ru: {');
const end = src.indexOf('\n  },\n  en:', start);
if (start < 0 || end < 0) {
  console.error('[i18n-export-keys] Could not find ru/en blocks.');
  process.exit(1);
}
const block = src.slice(start, end);
const keys = [...block.matchAll(/\n\s*'([^']+)':/g)].map((m) => m[1]);
const outPath = join(root, 'i18n-keys.export.txt');
writeFileSync(outPath, `${keys.join('\n')}\n`);
console.log('[i18n-export-keys]', keys.length, 'keys →', outPath);
