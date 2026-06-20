/**
 * Obsidian Sync System
 * Автоматическая синхронизация между Claude Code и Obsidian vault
 *
 * Использование:
 *   node scripts/obsidian-sync.mjs pull     — загрузить контекст из Obsidian
 *   node scripts/obsidian-sync.mjs push     — сохранить изменения в Obsidian
 *   node scripts/obsidian-sync.mjs status  — показать статус синхронизации
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === КОНФИГУРАЦИЯ ===
const PROJECT_ROOT = path.join(__dirname, '../..');
const OBSIDIAN_VAULT = process.env.OBSIDIAN_VAULT ||
    'C:/Users/Den/Documents/История Шарма/История про Шарма';
const AFK_GAME_DIR = path.join(OBSIDIAN_VAULT, 'AFK Game');

// Notes to sync
const SYNC_FILES = [
    'Agent Memory.md',
    'Progress Log.md',
    'Bugs.md',
    'Improvements.md',
    'Ideas.md',
    'Architecture Decisions.md'
];

// === ФУНКЦИИ ===

/**
 * Ensure AFK Game folder exists
 */
function ensureFolder() {
    if (!fs.existsSync(AFK_GAME_DIR)) {
        fs.mkdirSync(AFK_GAME_DIR, { recursive: true });
        console.log(`Created: ${AFK_GAME_DIR}`);
    }
}

/**
 * Pull latest context from Obsidian
 */
function pull() {
    ensureFolder();
    console.log('\n=== Pulling from Obsidian ===\n');

    const context = {
        lastUpdated: new Date().toISOString(),
        files: {}
    };

    for (const file of SYNC_FILES) {
        const filePath = path.join(AFK_GAME_DIR, file);
        if (fs.existsSync(filePath)) {
            context.files[file] = fs.readFileSync(filePath, 'utf-8');
            console.log(`✓ Loaded: ${file}`);
        } else {
            console.log(`○ Missing: ${file}`);
        }
    }

    // Save to project cache
    const cacheFile = path.join(PROJECT_ROOT, '.obsidian-context.json');
    fs.writeFileSync(cacheFile, JSON.stringify(context, null, 2));
    console.log(`\nSaved to: ${cacheFile}`);

    return context;
}

/**
 * Push project updates to Obsidian
 */
function push() {
    ensureFolder();
    console.log('\n=== Pushing to Obsidian ===\n');

    // Update Progress Log
    const progressLogPath = path.join(AFK_GAME_DIR, 'Progress Log.md');
    const today = new Date().toISOString().split('T')[0];
    const newEntry = `\n### ${today}\n- [Session completed]`;

    if (fs.existsSync(progressLogPath)) {
        const content = fs.readFileSync(progressLogPath, 'utf-8');
        if (!content.includes(newEntry)) {
            fs.writeFileSync(progressLogPath, content + '\n' + newEntry);
            console.log('✓ Updated: Progress Log.md');
        }
    }

    // Update Agent Memory timestamp
    const memoryPath = path.join(AFK_GAME_DIR, 'Agent Memory.md');
    if (fs.existsSync(memoryPath)) {
        let content = fs.readFileSync(memoryPath, 'utf-8');
        content = content.replace(
            /\*\*Last Updated\*\*: [\d-]+/,
            `**Last Updated**: ${today}`
        );
        fs.writeFileSync(memoryPath, content);
        console.log('✓ Updated: Agent Memory.md');
    }

    console.log('\n=== Push complete ===');
}

/**
 * Show sync status
 */
function status() {
    ensureFolder();
    console.log('\n=== Obsidian Sync Status ===\n');
    console.log(`Vault: ${OBSIDIAN_VAULT}`);
    console.log(`AFK Game: ${AFK_GAME_DIR}\n`);

    for (const file of SYNC_FILES) {
        const filePath = path.join(AFK_GAME_DIR, file);
        const exists = fs.existsSync(filePath);
        const status = exists ? '✓' : '○';
        const size = exists ? `(${fs.statSync(filePath).size}b)` : '';
        console.log(`${status} ${file} ${size}`);
    }

    // Check cache
    const cacheFile = path.join(PROJECT_ROOT, '.obsidian-context.json');
    if (fs.existsSync(cacheFile)) {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        console.log(`\nCache: ${cache.lastUpdated}`);
    }

    console.log('\n=== Status complete ===');
}

// === MAIN ===
const command = process.argv[2];

switch (command) {
    case 'pull':
        pull();
        break;
    case 'push':
        push();
        break;
    case 'status':
        status();
        break;
    default:
        console.log('Usage: node obsidian-sync.mjs <pull|push|status>');
        console.log('  pull   — Load context from Obsidian');
        console.log('  push   — Save changes to Obsidian');
        console.log('  status — Show sync status');
}