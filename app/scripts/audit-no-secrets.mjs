/**
 * MVP 091: быстрый аудит — типичные анти-паттерны хранения секретов в клиентском коде.
 * Не замена секрет-сканеру; срабатывания требуют ручной проверки.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walkTs(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === '__tests__') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTs(p, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

const patterns = [
  { re: /localStorage\.setItem\s*\(\s*['"][^'"]*(api[_-]?key|secret|token|password)/i, msg: 'possible secret key in localStorage.setItem' },
  { re: /sessionStorage\.setItem\s*\(\s*['"][^'"]*(api[_-]?key|secret|token)/i, msg: 'possible secret key in sessionStorage.setItem' },
  { re: /['"][a-zA-Z0-9]{32,}['"]\s*\/\/\s*sk-/i, msg: 'suspicious inline key comment' },
];

const files = walkTs(root);
let hits = 0;
for (const abs of files) {
  const f = relative(root, abs).replace(/\\/g, '/');
  let text;
  try {
    text = readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  for (const { re, msg } of patterns) {
    if (re.test(text)) {
      console.warn(`[audit-no-secrets] ${f}: ${msg}`);
      hits++;
    }
  }
}


if (hits > 0) {
  console.warn(`[audit-no-secrets] ${hits} pattern match(es) — review manually.`);
  process.exitCode = 0;
} else {
  console.log('[audit-no-secrets] no obvious client-side secret storage patterns.');
}
