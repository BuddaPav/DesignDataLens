#!/usr/bin/env node
/**
 * Kenney Assets Downloader - Free CC0 3D models for games
 *
 * Downloads free 3D assets from Kenney (CC0 license)
 * Run: node scripts/download-kenney-3d.mjs
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(__dirname, '..');
const modelsRoot = join(appRoot, 'public', 'models', 'aaa', 'kenney');

// Kenney free 3D asset packs (CC0 licensed)
// Using direct CDN links from Kenney
const KENNEY_PACKS = [
  {
    name: 'furniture',
    url: 'https://kenney.nl/content/upload-assets/ARCHIVE%20-%20Unity%20Package%20-%20Furniture.zip',
    zipFile: 'furniture.zip',
  },
  {
    name: 'nature',
    url: 'https://kenney.nl/content/upload-assets/ARCHIVE%20-%20Unity%20Package%20-%20Nature.zip',
    zipFile: 'nature.zip',
  },
  {
    name: 'props',
    url: 'https://kenney.nl/content/upload-assets/ARCHIVE%20-%20Unity%20Package%20-%20Props.zip',
    zipFile: 'props.zip',
  },
];

// Alternative: single file assets that can be downloaded directly
const KENNEY_DIRECT = [
  // Sample URLs - these would need actual URLs from Kenney
  // For now, we'll create a script that can download from any URL list
];

async function downloadFile(url, destPath) {
  console.log(`[download-kenney-3d] Downloading: ${url.slice(0, 80)}...`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`[download-kenney-3d] Skip: ${res.status} ${url}`);
      return false;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(destPath, buf);
    console.log(`[download-kenney-3d] Saved: ${destPath} (${buf.length} bytes)`);
    return true;
  } catch (err) {
    console.log(`[download-kenney-3d] Error: ${err.message}`);
    return false;
  }
}

async function downloadPacks() {
  await mkdir(modelsRoot, { recursive: true });

  // Check for custom URLs in env
  const urlList = process.env.KENNEY_ASSET_URLS;
  if (urlList) {
    const urls = urlList.split(',').map(u => u.trim()).filter(Boolean);
    console.log(`[download-kenney-3d] Using ${urls.length} URLs from KENNEY_ASSET_URLS`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const ext = url.includes('.zip') ? '.zip' : url.includes('.glb') ? '.glb' : '';
      const dest = join(modelsRoot, `asset_${String(i + 1).padStart(3, '0')}${ext}`);
      await downloadFile(url, dest);
    }
    return;
  }

  console.log('[download-kenney-3d] No KENNEY_ASSET_URLS set');
  console.log('[download-kenney-3d] To download assets:');
  console.log('  1. Go to https://kenney.nl/assets');
  console.log('  2. Download free 3D packs');
  console.log('  3. Extract glb/gltf files to public/models/aaa/kenney/');
  console.log('');
  console.log('  Or set URLs in environment:');
  console.log('    set KENNEY_ASSET_URLS=https://example.com/model1.glb,https://example.com/model2.glb');
  console.log('    node scripts/download-kenney-3d.mjs');

  // Try to download from direct Kenney CDN (may not work - Kenney uses redirects)
  console.log('\n[download-kenney-3d] Checking Kenney CDN...');

  // Kenney's alternative - use the free toolkit directly
  const toolkitUrl = 'https://kenney.nl/content/upload-assets/Kitbash3d%20-%20Dungeon.png';
  await downloadFile(toolkitUrl, join(modelsRoot, 'kitbash_dungeon.png'));
}

async function main() {
  console.log('[download-kenney-3d] Kenney Assets Downloader');
  console.log('[download-kenney-3d] =============================');

  await mkdir(modelsRoot, { recursive: true });

  const customEnv = process.env.KENNEY_ASSET_URLS;
  if (customEnv) {
    console.log('[download-kenney-3d] Processing URLs from KENNEY_ASSET_URLS');
    const urls = customEnv.split(',').filter(Boolean);

    let downloaded = 0;
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i].trim();
      if (!url) continue;

      // Determine extension from URL
      let ext = '.glb';
      if (url.includes('.zip')) ext = '.zip';
      else if (url.includes('.gltf')) ext = '.gltf';
      else if (url.includes('.png') || url.includes('.jpg')) ext = '.png';

      const dest = join(modelsRoot, `kenney_${String(i + 1).padStart(4, '0')}${ext}`);
      const ok = await downloadFile(url, dest);
      if (ok) downloaded++;
    }

    console.log(`[download-kenney-3d] Downloaded ${downloaded}/${urls.length} files`);
    return;
  }

  console.log('[download-kenney-3d] No URLs provided');
  console.log('');
  console.log('Usage options:');
  console.log('');
  console.log('Option 1: Download from Kenney.nl manually');
  console.log('  1. Visit https://kenney.nl/assets/3d-assets');
  console.log('  2. Download free packs (look for "FREE" label)');
  console.log('  3. Extract .glb/.gltf files to:');
  console.log(`     ${modelsRoot}`);
  console.log('');
  console.log('Option 2: Use environment variable with direct URLs');
  console.log('  set KENNEY_ASSET_URLS=url1,url2,url3');
  console.log('  node scripts/download-kenney-3d.mjs');
  console.log('');
  console.log('Option 3: Use MCP/agent to fetch assets');
  console.log('  Ask your assistant to download assets from Kenney');

  // List files already in the kenney folder
  try {
    const files = await readFile(modelsRoot, 'utf8').catch(() => '');
    console.log(`\n[download-kenney-3d] Current files in ${modelsRoot}:`);
  } catch {
    console.log(`\n[download-kenney-3d] Folder exists but empty`);
  }
}

main().catch(console.error);