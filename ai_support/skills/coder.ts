// ai_support/skills/coder.ts — Coder skill: analyze code + suggest fixes.

import fs from 'fs';
import path from 'path';

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.lua'];

export const skill = {
  name: 'coder',
  description: 'Анализирует код, находит баги и предлагает исправления',
  run: async (ctx, opts) => {
    const target = opts?.file || opts?.path;
    if (!target) return { ok: false, error: 'No target file specified' };

    // Resolve path
    const filePath = path.isAbsolute(target) ? target : path.join(ctx.projectRoot, target);
    if (!fs.existsSync(filePath)) return { ok: false, error: `File not found: ${filePath}` };

    const ext = path.extname(filePath);
    if (!CODE_EXTENSIONS.includes(ext)) return { ok: false, error: `Unsupported extension: ${ext}` };

    const content = fs.readFileSync(filePath, 'utf-8');

    // Simple analysis patterns
    const issues: string[] = [];

    // Detect common issues
    if (content.includes('any')) issues.push('Использование "any" типа');
    if (content.includes('console.log') && !filePath.includes('test')) issues.push('console.log в продакшен коде');
    if (content.match(/\/\/ TODO/)) issues.push('TODO comments');
    if (content.match(/\/\/ FIXME/)) issues.push('FIXME comments');

    // Basic code stats
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+|(\w+)\s*\(/g) || []).length;

    return {
      ok: true,
      data: {
        file: filePath,
        lines,
        functions,
        issues,
        size: content.length,
      },
    };
  },
};

export function register() {
  return skill;
}