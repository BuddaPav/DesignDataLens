#!/usr/bin/env node
// ai_support/run.js — CLI runner.

import process from 'process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_LOG = path.join(__dirname, '..', 'build_log.txt');
const PROJECT_ROOT = path.join(__dirname, '..', 'app', 'src');

async function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(BUILD_LOG, line + '\n');
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';

  const ai = await import('./index.js');
  await ai.initAISupport();

  if (cmd === 'help' || !cmd) {
    console.log(`
ai_support CLI

Commands:
  search <pattern>     Find files by pattern
  analyze <file>       Analyze code file
  memory              Show memory stats
  skills              List skills
  index               Index project files
  help                This help
    `.trim());
    return;
  }

  if (cmd === 'skills') {
    console.log('Skills:', ai.listSkills().join(', '));
    return;
  }

  if (cmd === 'memory') {
    console.log('Entries:', ai.getStats().entries);
    return;
  }

  if (cmd === 'search') {
    const pattern = args[1];
    if (!pattern) { console.log('Usage: search <pattern>'); return; }
    const skill = ai.getSkill('search');
    const result = await skill.run({}, { pattern, maxFiles: 20 });
    console.log(`Found ${result.data.totalMatches} matches in ${result.data.filesScanned} files:`);
    for (const m of result.data.matches.slice(0, 10)) {
      console.log(`  ${m.file}:${m.line} ${m.content.slice(0, 60)}`);
    }
    return;
  }

  if (cmd === 'analyze') {
    const file = args[1];
    if (!file) { console.log('Usage: analyze <file>'); return; }
    const skill = ai.getSkill('coder');
    const result = await skill.run({}, { file: path.join(PROJECT_ROOT, file) });
    console.log('Analysis:', JSON.stringify(result, null, 2));
    log(`Analyzed ${file}: ${result.data?.lines} lines, ${result.data?.issues?.length || 0} issues`);
    return;
  }

  if (cmd === 'index') {
    log('Indexing project, root: ' + PROJECT_ROOT);
    log('Exists: ' + fs.existsSync(PROJECT_ROOT));
    log('Indexing project...');
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    let count = 0;

    async function walk(dir) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (count > 200) break;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
            walk(full);
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            try {
              const content = fs.readFileSync(full, 'utf-8').slice(0, 3000);
              const tags = full.includes('engine') ? ['engine']
                : full.includes('domain') ? ['domain']
                : full.includes('component') ? ['ui']
                : full.includes('test') ? ['test']
                : ['code'];
              await ai.addProjectChunk(full, content, { size: String(content.length) }, tags);
              count++;
            } catch { /* skip */ }
          }
        }
      } catch { /* skip */ }
    }

    walk(PROJECT_ROOT);
    log(`Indexed ${count} files`);
    console.log(`Indexed ${count} files`);
    return;
  }

  console.log(`Unknown: ${cmd}`);
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});