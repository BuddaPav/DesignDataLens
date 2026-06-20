// ai_support/skills/search.ts — Search skill: find code by pattern.

import fs from 'fs';
import path from 'path';

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.lua', '.md'];

export const skill = {
  name: 'search',
  description: 'Ищет файлы по паттерну (regex или term)',
  run: async (ctx, opts) => {
    const pattern = opts?.pattern;
    if (!pattern) return { ok: false, error: 'No pattern specified' };

    const root = opts?.root || ctx.projectRoot;
    const maxFiles = opts?.maxFiles || 50;
    const exts = opts?.exts || CODE_EXTENSIONS;

    const regex = new RegExp(pattern, opts?.flags || '');

    const matches: { file: string; line: number; content: string }[] = [];
    const scanned: string[] = [];

    function scanDir(dir: string) {
      if (matches.length >= maxFiles || scanned.length >= 500) return;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (matches.length >= maxFiles || scanned.length >= 500) break;
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'build') {
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
            } catch { /* skip unreadable */ }
          }
        }
      } catch { /* skip inaccessible */ }
    }

    scanDir(root);

    return {
      ok: true,
      data: {
        pattern,
        matches: matches.slice(0, 20),
        totalMatches: matches.length,
        filesScanned: scanned.length,
      },
    };
  },
};

export function register() {
  return skill;
}