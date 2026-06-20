/**
 * Obsidian Auto-Sync Service
 * Фоновая синхронизация с Obsidian vault
 *
 * Запуск:
 *   node scripts/obsidian-auto-sync.cjs start  — запустить демон
 *   node scripts/obsidian-auto-sync.cjs stop   — остановить
 *
 * Проверка каждые 5 минут
 */

const fs = require('fs');
const path = require('path');

// === КОНФИГУРАЦИЯ ===
const PROJECT_ROOT = path.join(__dirname, '..');
const OBSIDIAN_VAULT = process.env.OBSIDIAN_VAULT ||
    'C:/Users/Den/Documents/История Шарма/История про Шарма';
const AFK_GAME_DIR = path.join(OBSIDIAN_VAULT, 'AFK Game');
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 минут

let syncInterval = null;
let lastSyncTime = null;

/**
 * Sync function
 */
async function sync() {
    const now = new Date().toISOString();
    console.log(`[${now}] Syncing...`);

    // Ensure folder
    if (!fs.existsSync(AFK_GAME_DIR)) {
        console.log('AFK Game folder not found, creating...');
        fs.mkdirSync(AFK_GAME_DIR, { recursive: true });
    }

    // Check for updates
    const progressLog = path.join(AFK_GAME_DIR, 'Progress Log.md');
    if (fs.existsSync(progressLog)) {
        const content = fs.readFileSync(progressLog, 'utf-8');
        const hasToday = content.includes(now.split('T')[0]);
        if (!hasToday) {
            console.log('No entry today, skipping');
        }
    }

    lastSyncTime = now;
    console.log(`[${now}] Sync complete`);
}

/**
 * Start daemon
 */
function start() {
    if (syncInterval) {
        console.log('Already running!');
        return;
    }

    console.log('Starting Obsidian Auto-Sync...');
    console.log(`Watching: ${AFK_GAME_DIR}`);
    console.log(`Interval: ${SYNC_INTERVAL / 60 / 1000} minutes`);

    // Initial sync
    sync();

    // Schedule
    syncInterval = setInterval(sync, SYNC_INTERVAL);

    // Handle shutdown
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
}

/**
 * Stop daemon
 */
function stop() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('Stopped');
        process.exit(0);
    }
}

// === MAIN ===
const command = process.argv[2];

switch (command) {
    case 'start':
        start();
        break;
    case 'stop':
        stop();
        break;
    default:
        console.log('Usage: node obsidian-auto-sync.cjs <start|stop>');
        console.log('  start — Запустить демон синхронизации');
        console.log('  stop  — Остановить демон');