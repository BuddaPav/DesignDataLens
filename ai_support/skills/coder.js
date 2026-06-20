// ai_support/skills/coder.js — Coder skill: analyze code.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..', 'app', 'src');

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.lua'];

export const skill = {
  name: 'coder',
  description: 'Analyze code, find bugs',
  async run(ctx, opts) {
    const target = opts.file || opts.path;
    if (!target) return { ok: false, error: 'No target specified' };

    // Resolve path
    let filePath = target;
    if (!path.isAbsolute(target)) {
      filePath = path.join(PROJECT_ROOT, target);
    }
    if (!fs.existsSync(filePath)) {
      // Try full project path
      filePath = path.join(process.cwd(), 'app', 'src', target);
    }
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: `File not found: ${target}` };
    }

    const ext = path.extname(filePath);
    if (!CODE_EXTENSIONS.includes(ext)) {
      return { ok: false, error: `Unsupported: ${ext}` };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    // Simple patterns
    if (content.includes('any')) issues.push('uses "any" type');
    if (content.includes('console.log') && !filePath.includes('test')) {
      issues.push('console.log in production');
    }
    if (content.match(/\/\/ TODO/)) issues.push('TODO comments');
    if (content.match(/\/\/ FIXME/)) issues.push('FIXME comments');

    const lines = content.split('\n').length;

    return {
      ok: true,
      data: { file: path.basename(filePath), lines, issues, size: content.length },
    };
  },
};

export function register() { return skill; }