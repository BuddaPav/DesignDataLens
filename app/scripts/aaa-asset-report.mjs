#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const intakePath = join(__dirname, '..', 'production', 'asset-intake.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

try {
  const data = readJson(intakePath);
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const byType = new Map();
  const byTier = new Map();
  const byStatus = new Map();

  for (const asset of assets) {
    increment(byType, asset.assetType || 'unknown');
    increment(byTier, asset.tier || 'unknown');
    increment(byStatus, asset.status || 'unknown');
  }

  console.log(`[aaa/asset-report] total assets: ${assets.length}`);
  console.log('[aaa/asset-report] byType');
  for (const [key, value] of byType.entries()) {
    console.log(`  - ${key}: ${value}`);
  }
  console.log('[aaa/asset-report] byTier');
  for (const [key, value] of byTier.entries()) {
    console.log(`  - ${key}: ${value}`);
  }
  console.log('[aaa/asset-report] byStatus');
  for (const [key, value] of byStatus.entries()) {
    console.log(`  - ${key}: ${value}`);
  }
} catch (error) {
  console.error('[aaa/asset-report] Failed:', error.message);
  process.exit(1);
}
