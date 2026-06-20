#!/usr/bin/env node
// ai_support/run.ts — CLI runner для агентной системы.

import process from 'process';
import fs from 'fs';
import path from 'path';

const BUILD_LOG = './build_log.txt';
const PROJECT_ROOT = './app/src';

async function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(BUILD_LOG, line + '\n');
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';

  // Lazy init
  const ai = await import('./index.ts');
  await ai.initAISupport();

  if (cmd === 'help' || !cmd) {
    console.log(`
ai_support CLI — мультиагентная система для AFK Game

Команды:
  search <pattern>      — найти файлы по паттерну
  analyze <file>        — анализировать файл (баги, статы)
  task <description>    — выполнить задачу (если скилл найден)
  memory                — показать статистику памяти
  skills                — список доступных скиллов
  index                 — проиндексировать проект
  help                  — эта справка
    `.trim());
    return;
  }

  if (cmd === 'skills') {
    const list = ai.listSkills();
    console.log('Available skills:', list.join(', '));
    return;
  }

  if (cmd === 'memory') {
    const stats = ai.getStats();
    console.log('Memory entries:', stats.entries);
    return;
  }

  if (cmd === 'search') {
    const pattern = args[1];
    if (!pattern) { console.log('Usage: search <pattern>'); return; }
    const results = await ai.searchProject(pattern, 10);
    console.log(`Found ${results.length} matches:`);
    for (const r of results) {
      console.log(`  ${r.id}: ${r.content.slice(0, 80)}...`);
    }
    return;
  }

  if (cmd === 'analyze') {
    const file = args[1];
    if (!file) { console.log('Usage: analyze <file>'); return; }

    const skill = ai.getSkill('coder');
    if (!skill) { console.log('Coder skill not found'); return; }

    const result = await ai.runAgent('coder', { file: path.join(PROJECT_ROOT, file) });
    console.log('Analysis:', JSON.stringify(result, null, 2));
    return;
  }

  if (cmd === 'index') {
    log('Indexing project...');
    const indexFile = async (filePath: string) => {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);
        const tags = filePath.includes('engine') ? ['engine']
          : filePath.includes('domain') ? ['domain']
          : filePath.includes('component') ? ['ui']
          : filePath.includes('test') ? ['test']
          : ['code'];

        await ai.addProjectChunk(filePath, content.slice(0, 5000), { size: String(stats.size) }, tags);
      } catch (e) {
        // skip
      }
    };

    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    let count = 0;

    function walk(dir: string) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (count > 200) break;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
            walk(full);
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            indexFile(full);
            count++;
          }
        }
      } catch { /* skip */ }
    }

    walk(PROJECT_ROOT);
    log(`Indexed ${count} files`);
    console.log(`Indexed ${count} files`);
    return;
  }

  // Default: unknown command
  console.log(`Unknown command: ${cmd}`);
  console.log('Run: help');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});