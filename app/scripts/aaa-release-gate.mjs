#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const manifestPath = join(__dirname, '..', 'production', 'release-readiness.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

try {
  const manifest = readJson(manifestPath);
  const checks = manifest.checks || {};
  const requiredChecks = [
    'alphaContentComplete',
    'alphaCoreSmoke',
    'alphaNoBlockers',
    'betaFeatureFreeze',
    'betaLocalizationLock',
    'betaPerformanceLock',
    'rcCrashBudget',
    'rcSaveCompatibility',
    'rcInstallerReady',
    'rcCertificationChecklist',
  ];

  const missing = requiredChecks.filter((key) => typeof checks[key] !== 'boolean');
  if (missing.length > 0) {
    throw new Error(`Missing release checks: ${missing.join(', ')}`);
  }

  const unknown = Object.keys(checks).filter((key) => !requiredChecks.includes(key));
  if (unknown.length > 0) {
    throw new Error(`Unknown release checks: ${unknown.join(', ')}`);
  }

  const items = requiredChecks.map((name) => ({
    name,
    pass: checks[name] === true,
  }));
  const ok = items.every((x) => x.pass);

  console.log(`[aaa/release] phase=${manifest.phase} version=${manifest.version}`);
  for (const item of items) {
    const state = item.pass ? 'OK' : 'FAIL';
    console.log(`  [${state}] ${item.name}`);
  }

  if (!ok) {
    console.error('[aaa/release] Gate FAILED');
    process.exit(1);
  }

  console.log('[aaa/release] Gate PASSED');
} catch (error) {
  console.error('[aaa/release] Failed:', error.message);
  process.exit(1);
}
