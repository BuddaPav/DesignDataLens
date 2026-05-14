/**
 * Экспорт JSON-графа зависимостей Madge (без Graphviz).
 * Выход: docs/architecture/module-graph.json
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, '..');
const outDir = path.join(appRoot, 'docs', 'architecture');
const outFile = path.join(outDir, 'module-graph.json');

mkdirSync(outDir, { recursive: true });

const json = execSync('npx madge --json --extensions ts,tsx ./src', {
  cwd: appRoot,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});

writeFileSync(outFile, json, 'utf8');
console.log('[deps] wrote', path.relative(appRoot, outFile));
