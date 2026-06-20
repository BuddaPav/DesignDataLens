// Autonomous Agent Loop - Runs every 30 seconds
// Monitors build, fixes errors, manages workflow

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load env file early - use process.cwd() for tsx
const envPath = path.join(process.cwd(), '.env.api');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    if (key && value) process.env[key] = value;
  }
}
import {
  init,
  enterFlow,
  getValidationLatency,
  getTrustScore,
  getRecentErrors,
  getActiveTodos,
  recordValidation,
  recordError,
  indexFile as sbIndexFile,
  getConfiguredAPIs,
  isAPIReady
} from './orchestrator';

// Import agents
import { runOrchestrator, runBuildCheck as doBuildCheck, runTests as doRunTests } from '../agents/autonomousOrchestrator';

const APP_DIR = 'c:/Users/Den/Downloads/AFK Game/app';
const BUILD_LOG = 'c:/Users/Den/Downloads/AFK Game/ai_support/secondbrain/build_log.txt';
const CHECK_INTERVAL = 30000; // 30 seconds
const PROGRESS_REPORT_INTERVAL = 360; // 180 minutes (360 cycles of 30 sec)

let lastBuildStatus: 'pass' | 'fail' | 'unknown' = 'unknown';
let cycleCount = 0;
let lastFileCount = 0;
let sessionStartTime = Date.now();

// Initialize
init().then(() => {
  console.log('[autonomous] Second brain ready');
  runLoop();
});

async function runLoop() {
  cycleCount++;
  console.log(`[autonomous] Cycle ${cycleCount} started`);
  
  // Step 1: Check for file changes
  const fileCount = countSourceFiles();
  if (fileCount !== lastFileCount) {
    console.log(`[autonomous] File change detected: ${lastFileCount} -> ${fileCount}`);
    lastFileCount = fileCount;
    enterFlow();
  }

  // Step 1b: Check API status
  const apis = ['huggingface', 'telegram', 'yandex'];
  // Direct check - not using the cached map
  const hfReady = !!process.env.HF_TOKEN;
  const tgReady = !!process.env.TELEGRAM_BOT_TOKEN;
  const yaReady = !!process.env.YANDEX_API_KEY;
  console.log(`[autonomous] APIs status: HF=${!!hfReady}, TG=${!!tgReady}, YA=${!!yaReady}`);
  
  // Step 2: Run build check
  await runBuildCheck();

  // Step 2b: Run agent orchestrator (real work!)
  try {
    await runOrchestrator();
  } catch (err: any) {
    console.error('[autonomous] Orchestrator error:', err.message);
  }
  
  // Step 3: Check validation latency
  const latency = getValidationLatency();
  if (latency.p95 > 5000) {
    console.warn(`[autonomous] High validation latency: ${latency.p95}ms`);
  }

  // Step 4: Check trust score
  const trust = getTrustScore();
  if (trust < 0.7) {
    console.warn(`[autonomous] Low trust score: ${trust}`);
  }

  // Step 5: Check active errors
  const errors = getRecentErrors();
  if (errors.length > 0) {
    for (const err of errors) {
      console.log(`[autonomous] Unresolved error: ${err.error.substring(0, 50)}...`);
    }
  }

  // Step 6: Check TODOs
  const todos = getActiveTodos();
  console.log(`[autonomous] Active TODOs: ${todos.length}`);
  
  // Step 7: Sync to memory
  await indexProjectFiles();
  
  console.log(`[autonomous] Cycle ${cycleCount} complete`);

  // Progress report every 180 minutes (360 cycles)
  if (cycleCount % PROGRESS_REPORT_INTERVAL === 0) {
    printProgressReport();
  }

  // Schedule next cycle
  setTimeout(runLoop, CHECK_INTERVAL);
}

function countSourceFiles(): number {
  let count = 0;
  const srcDir = path.join(APP_DIR, 'src');
  if (fs.existsSync(srcDir)) {
    count = countFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);
  }
  return count;
}

function countFiles(dir: string, exts: string[]): number {
  let count = 0;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        count += countFiles(fullPath, exts);
      } else if (exts.some(ext => file.endsWith(ext))) {
        count++;
      }
    }
  } catch {}
  return count;
}

async function runBuildCheck(): Promise<void> {
  // Run actual build check via orchestrator
  const result = await doBuildCheck();
  lastBuildStatus = result.ok ? 'pass' : 'fail';

  // Log to file
  const logMsg = `[${new Date().toISOString()}] Build: ${lastBuildStatus}
${result.error || ''}
`;
  try {
    fs.appendFileSync(BUILD_LOG, logMsg);
  } catch {}

  console.log(`[autonomous] Build status: ${lastBuildStatus}`);

  recordValidation('build', result.ok ? 'pass' : 'fail', result.error ? [result.error] : [], 0);
}

async function indexProjectFiles(): Promise<void> {
  const srcDir = path.join(APP_DIR, 'src');
  if (!fs.existsSync(srcDir)) return;

  // Index key files
  const keyFiles = [
    'src/lib/featureFlags.ts',
    'src/lib/utils.ts',
    'src/version.ts'
  ];

  for (const file of keyFiles) {
    const fullPath = path.join(APP_DIR, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      sbIndexFile(file, content, 'source');
    }
  }
}

function printProgressReport(): void {
  const elapsedMs = Date.now() - sessionStartTime;
  const hours = Math.floor(elapsedMs / 3600000);
  const minutes = Math.floor((elapsedMs % 3600000) / 60000);

  const latency = getValidationLatency();
  const trust = getTrustScore();
  const errors = getRecentErrors();
  const todos = getActiveTodos();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         AUTONOMOUS AGENT - PROGRESS REPORT          ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Session Duration: ${hours}h ${minutes}m                          ║`);
  console.log(`║  Cycles Completed: ${cycleCount}                            ║`);
  console.log(`║  Source Files: ${lastFileCount}                                   ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  API Status:                                       ║');
  console.log(`║    HuggingFace: ${!!process.env.HF_TOKEN ? '✓' : '✗'}                                     ║`);
  console.log(`║    Telegram:  ${!!process.env.TELEGRAM_BOT_TOKEN ? '✓' : '✗'}                                     ║`);
  console.log(`║    Yandex:    ${!!process.env.YANDEX_API_KEY ? '✓' : '✗'}                                     ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Trust Score: ${(trust * 100).toFixed(0)}%                                  ║`);
  console.log(`║  Latency p95: ${latency.p95}ms                                ║`);
  console.log(`║  Active Errors: ${errors.length}                                ║`);
  console.log(`║  Active TODOs: ${todos.length}                                 ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
}

// Helper using Node's built-in execSync with full error capture
function execAsync(cmd: string, opts: any): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const { execSync } = require('child_process');

    try {
      const result = execSync(cmd, {
        cwd: opts.cwd,
        env: { ...process.env, ...opts.env },
        encoding: 'utf-8',
        timeout: opts.timeout
      });
      resolve({ stdout: String(result), stderr: '' });
    } catch (err: any) {
      const stdout = err.stdout ? String(err.stdout) : '';
      const stderr = err.stderr ? String(err.stderr) : '';
      const message = err.message || '';
      const status = err.status ?? 1;

      if (status === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Exit code ${status}: ${stderr || stdout || message || 'unknown'}`));
      }
    }
  });
}
