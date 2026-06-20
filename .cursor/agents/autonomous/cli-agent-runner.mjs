#!/usr/bin/env node
/**
 * AFK Game Autonomous Agents CLI Runner
 * Run agents directly without browser
 */

import http from 'http';

const OLLAMA_URL = 'http://127.0.0.1:11434';

async function checkOllama() {
  return new Promise((resolve) => {
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

async function ollamaChat(messages, model = 'llama3.2:3b') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ model, messages, stream: false });
    const req = http.request(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.message?.content || '');
        } catch {
          resolve(body.slice(0, 500));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runAgent(name, task) {
  console.log(`\n[Agent: ${name}] Task: ${task}`);
  const start = Date.now();

  try {
    const response = await ollamaChat([
      { role: 'system', content: `You are ${name} agent for AFK Game. Complete the task efficiently.` },
      { role: 'user', content: task }
    ]);

    const content = response?.message?.content || response?.response || response || 'No response';
    console.log(`[${name}] Result: ${content.slice(0, 300)}...`);
    console.log(`[${name}] Time: ${Date.now() - start}ms`);
    return content;
  } catch (e) {
    console.error(`[${name}] Error: ${e.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';

  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  AFK Game Autonomous Agents CLI Runner          ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  const models = await checkOllama();
  if (models === 0) {
    console.log('ERROR: Ollama not running on port 11434');
    console.log('Start with: ollama serve');
    process.exit(1);
  }
  console.log(`Connected to Ollama: ${models} models\n`);

  switch (command) {
    case 'run':
    case 'start':
      // Run all 10 agents
      const agents = [
        ['CodeBuilder', 'Analyze app/src for unused exports and suggest cleanup'],
        ['NPCArchitect', 'Review NPCSystem and suggest improvements'],
        ['WorldBuilder', 'Check worldTiles for missing biomes'],
        ['EconomyDesigner', 'Review shopPurchase for balance issues'],
        ['UICraftsman', 'Check components for accessibility issues'],
        ['TestRunner', 'Suggest additional test coverage areas'],
        ['PerformanceProfiler', 'Find useMemo/useCallback optimization opportunities'],
        ['DocumentationGenerator', 'List exported functions needing docs'],
        ['HumanEvaluator', 'Rate the game UX from 1-10'],
        ['SecurityAuditor', 'Scan for potential security issues']
      ];

      for (const [name, task] of agents) {
        await runAgent(name, task);
      }

      console.log('\n╔═══════════════════════════════════════════════════╗');
      console.log('║  All agents completed                        ║');
      console.log('╚═══════════════════════════════════════════════════╝');
      break;

    case 'status':
      console.log('System: ONLINE');
      console.log(`Ollama: ${models} models`);
      console.log('Agents: Ready to run');
      break;

    default:
      console.log(`Unknown command: ${command}`);
      console.log('Usage: cli-agent-runner.mjs run|status');
  }
}

main().catch(console.error);