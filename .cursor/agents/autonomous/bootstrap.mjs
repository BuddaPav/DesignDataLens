#!/usr/bin/env node
/**
 * AFK Game Autonomous System Bootstrap
 * Run: node bootstrap.mjs [start|status|stop|eval]
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OLLAMA_URL = 'http://127.0.0.1:11434';

function checkOllama() {
  return new Promise((resolve, reject) => {
    http.get(`${OLLAMA_URL}/api/tags`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.models?.length || 0);
        } catch {
          resolve(0);
        }
      });
    }).on('error', () => resolve(0));
  });
}

function checkProject() {

  const files = {
    'orchestrator.ts': '.cursor/agents/autonomous/orchestrator.ts',
    'system-runner.ts': '.cursor/agents/autonomous/system-runner.ts',
    'human-evaluation.ts': '.cursor/agents/core/human-evaluation.ts',
    'ollama-client.ts': '.cursor/agents/core/ollama-client.ts',
    'knowledge-graph.ts': '.cursor/agents/core/knowledge-graph.ts',
  };

  const status = {};
  for (const [name, file] of Object.entries(files)) {
    status[name] = fs.existsSync(path.join(process.cwd(), file));
  }
  return status;
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'status';

  console.log('========================================');
  console.log('   AFK Game Autonomous System');
  console.log('========================================\n');

  switch (cmd) {
    case 'start':
      console.log('[Boot] Checking Ollama...');
      const models = await checkOllama();
      if (models > 0) {
        console.log(`[Boot] ✓ Ollama: ${models} models`);
      } else {
        console.log('[Boot] ✗ Ollama not available');
        console.log('[Boot] Run Ollama first: ollama serve');
        process.exit(1);
      }

      console.log('[Boot] Checking project files...');
      const files = checkProject();
      const missing = Object.entries(files).filter(([, exists]) => !exists);

      if (missing.length > 0) {
        console.log('[Boot] Missing files:');
        for (const [name] of missing) {
          console.log(`  - ${name}`);
        }
        process.exit(1);
      }
      console.log('[Boot] ✓ All core files present');

      console.log('\n========================================');
      console.log('   SYSTEM READY');
      console.log('========================================');
      console.log('\nTo run the autonomous system:');
      console.log('  1. npm run dev');
      console.log('  2. Open browser console');
      console.log('  3. Run: afkStart()');
      console.log('\nOr use:');
      console.log('  afkStatus() - check status');
      console.log('  afkStop() - stop system');
      break;

    case 'status':
      console.log('[Status] Checking Ollama...');
      const modelCount = await checkOllama();
      console.log(`[Status] Ollama models: ${modelCount}`);

      console.log('[Status] Project files:');
      const fileStatus = checkProject();
      for (const [name, exists] of Object.entries(fileStatus)) {
        console.log(`  ${exists ? '✓' : '✗'} ${name}`);
      }
      break;

    case 'eval':
      console.log('[Eval] Running human evaluation...');
      console.log('[Eval] This requires browser environment');
      console.log('[Eval] Run: npm run dev');
      console.log('[Eval] Then in console: humanEvaluatorAgent.execute()');
      break;

    case 'stop':
      console.log('[Stop] Stopping system...');
      console.log('[Stop] In browser console run: afkStop()');
      break;

    default:
      console.log('Commands: start | status | eval | stop');
      console.log('Usage: node bootstrap.mjs start');
  }
}

main().catch(console.error);