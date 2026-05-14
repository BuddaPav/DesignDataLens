#!/usr/bin/env node
/**
 * BACKLOG #81: быстрая диагностика окружения для багрепортов (Node/Electron/OS).
 * GPU renderer доступен только в Chromium DevTools → chrome://gpu (не в Node).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import process from 'node:process';

const root = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(root, '..', 'package.json');

console.log('=== Chronos diagnose ===\n');
console.log('node.js', process.version);
console.log('platform', `${process.platform} ${os.release()}`.trim());
console.log('arch', process.arch);
console.log('cwd', process.cwd());

try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  console.log('package', pkg.version);
} catch {
  console.log('package', '(could not read package.json)');
}

if (process.versions.electron) {
  console.log('electron', process.versions.electron);
  console.log('chrome', process.versions.chrome);
}

if (process.env.CHRONOS_DESKTOP_DEV) {
  console.log('CHRONOS_DESKTOP_DEV', process.env.CHRONOS_DESKTOP_DEV);
}

console.log('\nДля GPU/WebGPU: DevTools → chrome://gpu или вкладка Rendering.');
console.log('========================');
