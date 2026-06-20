// ai_support/skills/search.js — Search skill.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..', 'app', 'src');

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.lua', '.md'];

export const skill = {
  name: 'search',
  description: 'Find files by pattern',
  async run(ctx, opts) {
    const pattern = opts.pattern;
    if (!pattern) return { ok: false, error: 'No pattern specified' };

    const maxFiles = opts.maxFiles || 50;
    const exts = opts.exts || CODE_EXTENSIONS;

    let regex;
    try {
      regex = new RegExp(pattern, opts.flags || '');
    } catch {
      regex = new RegExp(pattern, 'i');
    }

    const matches = [];
    const scanned = [];

    function scanDir(dir) {
      if (matches.length >= maxFiles || scanned.length >= 500) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (matches.length >= maxFiles || scanned.length >= 500) break;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
              scanDir(fullPath);
            }
          } else if (entry.isFile() && exts.some(ext => entry.name.endsWith(ext))) {
            scanned.push(fullPath);
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                  matches.push({ file: fullPath, line: i + 1, content: lines[i].slice(0, 200) });
                  if (matches.length >= maxFiles) break;
                }
                regex.lastIndex = 0;
              }
            } catch { /* skip */ }
          }
        }
      } catch { /* skip */ }
    }

    scanDir(PROJECT_ROOT);

    return {
      ok: true,
      data: { pattern, matches: matches.slice(0, 20), totalMatches: matches.length, filesScanned: scanned.length },
    };
  },
};

export function register() { return skill; }