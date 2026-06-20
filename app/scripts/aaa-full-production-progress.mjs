#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const statusPath = join(__dirname, '..', 'production', 'full-production-status.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function percent(actual, target) {
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, Math.round((actual / target) * 10000) / 100);
}

try {
  const data = readJson(statusPath);
  const keys = [
    'environmentProps',
    'modularKits',
    'landmarks',
    'keyCharacters',
    'crowdVariants',
    'animationClips',
    'vfxSystems',
    'sfxEvents',
    'musicMinutes',
    'quests',
    'dialogueLines',
  ];
  let allPass = true;

  if (!data.targets || !data.actual) {
    throw new Error('Missing targets or actual blocks in full-production-status.json');
  }

  console.log('[aaa/full-production] Progress report');
  for (const key of keys) {
    if (typeof data.targets[key] !== 'number') {
      throw new Error(`Missing numeric targets.${key}`);
    }
    if (typeof data.actual[key] !== 'number') {
      throw new Error(`Missing numeric actual.${key}`);
    }
    const target = Number(data.targets[key]);
    const actual = Number(data.actual[key]);
    const pct = percent(actual, target);
    const pass = actual >= target;
    if (!pass) allPass = false;
    const state = pass ? 'OK' : 'IN_PROGRESS';
    console.log(`  [${state}] ${key}: ${actual}/${target} (${pct}%)`);
  }

  if (!allPass) {
    console.error('[aaa/full-production] Not all targets reached.');
    process.exit(1);
  }

  console.log('[aaa/full-production] All scale targets reached.');
} catch (error) {
  console.error('[aaa/full-production] Failed:', error.message);
  process.exit(1);
}
