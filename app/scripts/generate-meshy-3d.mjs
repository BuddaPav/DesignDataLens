#!/usr/bin/env node
/**
 * AI 3D Model Generation via Meshy API (meshy.ai)
 *
 * Setup:
 *   npm install -g meshy-ts  (optional)
 *   set MESHY_API_KEY=msy_...
 *   node scripts/generate-meshy-3d.mjs
 *
 * Free tier: 50 generations/month
 */

import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(__dirname, '..');
const modelsRoot = join(appRoot, 'public', 'models', 'aaa', 'biomes');

const MESHY_API = 'https://api.meshy.ai/v1';
const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 120000;

// Biome-specific prompts for game props
const BIOME_PROMPTS = {
  forest: [
    'low poly fantasy pine tree',
    'fantasy oak tree with leaves',
    'bare dead tree trunk',
    'mossy rock with grass',
    'fallen log',
    'tree stump',
    'bush with berries',
    'fern plant',
    'mushroom cluster',
    'forest boulder',
  ],
  desert: [
    'cactus plant',
    'sandstone rock formation',
    'desert skull',
    'pyramid temple',
    'sand dune',
    'cactus saguaro',
    'desert rock',
    'ancient obelisk',
    'ruins pillar',
    'camel skull',
  ],
  mountain: [
    'crystal cluster purple',
    'rock formation mountain',
    'stone shrine',
    'mountain peak rock',
    'crystal blue',
    'stalagmite',
    'mountain boulder',
    'ancient altar',
    'ice crystal',
    'cave rock formation',
  ],
  swamp: [
    'bare dead tree',
    'giant mushroom',
    'ruins column',
    'swamp tree roots',
    'muddy rock',
    'dead wood pile',
    'swamp vegetation',
    'rotten stump',
    'mossy ruins',
    'wicker basket',
  ],
  water: [
    'seaweed plant',
    'coral pink',
    'shipwreck debris',
    'driftwood',
    'clam shell',
    'starfish',
    'boat hull',
    'barrel floating',
    'water bottle',
    'anchor',
  ],
  general: [
    'wooden barrel',
    'wooden crate',
    'campfire pit',
    'wooden bench',
    'stone table',
    'torch holder',
    'lantern',
    'chest treasure',
    'weapons rack',
    'signpost',
  ],
};

const LORA_KEYWORDS = {
  forest: 'forest nature',
  desert: 'desert ancient',
  mountain: 'mountain crystal',
  swamp: 'swamp ruins',
  water: 'ocean underwater',
  general: 'game prop',
};

async function meshyFetch(path, body = null) {
  const key = process.env.MESHY_API_KEY;
  if (!key) throw new Error('MESHY_API_KEY not set');

  const res = await fetch(`${MESHY_API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meshy API ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

async function createTextTo3D(prompt, lora = '') {
  const body = {
    prompt,
    enable_lora: !!lora,
    lora_keywords: lora ? [lora] : undefined,
    art_style: 'low_poly',
    aspect_ratio: '1:1',
  };

  const result = await meshyFetch('/text-to-3d', body);
  console.log(`[generate-meshy-3d] Created task: ${result.result}`);
  return result.result;
}

async function waitForCompletion(taskId) {
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT_MS) {
    const status = await meshyFetch(`/text-to-3d/${taskId}`);
    const state = status.status;

    if (state === 'SUCCEEDED') {
      console.log(`[generate-meshy-3d] Task ${taskId} succeeded`);
      return status.model_urls;
    }
    if (state === 'FAILED') {
      throw new Error(`Task ${taskId} failed: ${status.error}`);
    }

    console.log(`[generate-meshy-3d] Task ${taskId}: ${state}...`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`Task ${taskId} timeout after ${MAX_WAIT_MS}ms`);
}

async function downloadUrlToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  console.log(`[generate-meshy-3d] Downloaded: ${destPath}`);
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function generateBiomeModels() {
  await mkdir(modelsRoot, { recursive: true });

  const key = process.env.MESHY_API_KEY;
  if (!key) {
    console.log('[generate-meshy-3d] MESHY_API_KEY not set — skipping generation');
    console.log('  Windows: set MESHY_API_KEY=msy_... && node scripts/generate-meshy-3d.mjs');
    return;
  }

  let generated = 0;
  const maxGen = Number.parseInt(process.env.CHRONOS_MESHY_LIMIT ?? '', 10) || 12; // Default 12 for testing

  console.log(`[generate-meshy-3d] Starting generation (max: ${maxGen})`);

  for (const [biome, prompts] of Object.entries(BIOME_PROMPTS)) {
    if (generated >= maxGen) break;

    const biomeDir = join(modelsRoot, biome);
    await mkdir(biomeDir, { recursive: true });

    const lora = LORA_KEYWORDS[biome] || '';

    for (const prompt of prompts) {
      if (generated >= maxGen) break;

      console.log(`\n[generate-meshy-3d] Generating: ${biome} > ${prompt}`);

      try {
        const taskId = await createTextTo3D(prompt, lora);
        const urls = await waitForCompletion(taskId);

        // Download GLB
        const glbUrl = urls.glb;
        if (!glbUrl) {
          console.log(`[generate-meshy-3d] No GLB URL in response, skipping`);
          continue;
        }

        const filename = `${sanitizeFilename(prompt)}.glb`;
        await downloadUrlToFile(glbUrl, join(biomeDir, filename));

        generated++;
      } catch (err) {
        console.error(`[generate-meshy-3d] Error: ${err.message}`);
      }
    }
  }

  console.log(`\n[generate-meshy-3d] Done: ${generated} models generated`);
}

async function main() {
  // Check for API key first
  if (!process.env.MESHY_API_KEY) {
    console.log('[generate-meshy-3d] MESHY_API_KEY environment variable not set');
    console.log('  Get your API key from: https://meshy.ai/settings/api');
    console.log('  Set it with:');
    console.log('    Windows: set MESHY_API_KEY=msy_...');
    console.log('    Linux/Mac: export MESHY_API_KEY=msy_...');
    console.log('');
    console.log('Then run this script again.');
    return;
  }

  // Test API key with a simple request
  console.log('[generate-meshy-3d] Testing API connection...');
  const test = await meshyFetch('/credits');
  console.log(`[generate-meshy-3d] Credits remaining: ${test.credits}`);

  if (test.credits < 1) {
    console.log('[generate-meshy-3d] No credits available, exiting');
    return;
  }

  await generateBiomeModels();
}

main().catch((err) => {
  console.error('[generate-meshy-3d] Fatal:', err.message);
  process.exit(1);
});