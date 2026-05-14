#!/usr/bin/env node
/**
 * Проверяет, что пути `/assets/...` из исходников и index.html существуют под `public/assets/`.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(root, 'public');

function walk(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules') continue;
      walk(p, acc);
    } else acc.push(p);
  }
  return acc;
}

const sources = [
  ...walk(join(root, 'src')).filter((f) => /\.(tsx|ts|css)$/.test(f)),
  join(root, 'index.html'),
];

const seen = new Set();
const missing = [];

for (const file of sources) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const re = /(['"])\/assets\/([^'"]+)\1/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const sub = m[2];
    const key = sub;
    if (seen.has(key)) continue;
    seen.add(key);

    const disk = join(publicRoot, 'assets', sub);
    if (!existsSync(disk) || !statSync(disk).isFile()) {
      missing.push({ ref: `/assets/${sub}`, file });
    }
  }
}

if (missing.length) {
  console.error('[check-public-asset-refs] Missing files:');
  for (const x of missing) {
    console.error(`  ${x.ref} (referenced from ${x.file})`);
  }
  process.exit(1);
}

console.log('[check-public-asset-refs] OK,', seen.size, 'unique /assets/* refs checked.');
