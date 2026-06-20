#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(__dirname, '..');
const manifestPath = join(appRoot, 'production', 'vertical-slice-manifest.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function checkMetric(name, actual, min) {
  if (!Number.isFinite(Number(actual)) || !Number.isFinite(Number(min))) {
    throw new Error(`Metric ${name} must be finite numbers`);
  }
  const pass = Number(actual) >= Number(min);
  return { name, actual, min, pass };
}

try {
  const m = readJson(manifestPath);
  const requiredTargetKeys = [
    'heroAssetsMin',
    'modelsMin',
    'animationsMin',
    'vfxMin',
    'musicMinutesMin',
  ];
  const requiredActualKeys = ['heroAssets', 'models', 'animations', 'vfx', 'musicMinutes'];
  const requiredGateKeys = [
    'orchestrateGatePassed',
    'questFlowSmokePassed',
    'performanceBudgetPassed',
    'fallbackPathsVerified',
  ];

  for (const key of requiredTargetKeys) {
    if (typeof m.targets?.[key] !== 'number') {
      throw new Error(`Missing numeric targets.${key}`);
    }
  }
  for (const key of requiredActualKeys) {
    if (typeof m.actual?.[key] !== 'number') {
      throw new Error(`Missing numeric actual.${key}`);
    }
  }
  for (const key of requiredGateKeys) {
    if (typeof m.gates?.[key] !== 'boolean') {
      throw new Error(`Missing boolean gates.${key}`);
    }
  }

  const unknownGateKeys = Object.keys(m.gates || {}).filter((k) => !requiredGateKeys.includes(k));
  if (unknownGateKeys.length > 0) {
    throw new Error(`Unknown gate keys: ${unknownGateKeys.join(', ')}`);
  }

  const metrics = [
    checkMetric('heroAssets', m.actual.heroAssets, m.targets.heroAssetsMin),
    checkMetric('models', m.actual.models, m.targets.modelsMin),
    checkMetric('animations', m.actual.animations, m.targets.animationsMin),
    checkMetric('vfx', m.actual.vfx, m.targets.vfxMin),
    checkMetric('musicMinutes', m.actual.musicMinutes, m.targets.musicMinutesMin),
  ];

  const gateChecks = requiredGateKeys.map((name) => ({
    name,
    pass: m.gates[name] === true,
  }));

  const allMetricsPass = metrics.every((x) => x.pass);
  const allGatesPass = gateChecks.every((x) => x.pass);
  const ok = allMetricsPass && allGatesPass;

  console.log(`[aaa/vertical-slice] slice=${m.sliceId} version=${m.version}`);
  for (const item of metrics) {
    const state = item.pass ? 'OK' : 'FAIL';
    console.log(`  [${state}] ${item.name}: ${item.actual} / min ${item.min}`);
  }
  for (const gate of gateChecks) {
    const state = gate.pass ? 'OK' : 'FAIL';
    console.log(`  [${state}] gate.${gate.name}`);
  }

  if (!ok) {
    console.error('[aaa/vertical-slice] Gate result: PIVOT');
    process.exit(1);
  }

  console.log('[aaa/vertical-slice] Gate result: GREENLIGHT');
} catch (error) {
  console.error('[aaa/vertical-slice] Failed to evaluate gate:', error.message);
  process.exit(1);
}
