/**
 * Напоминание об аудите «археолог» при числе коммитов, кратном 50 (корень git-репозитория).
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

try {
  const out = execSync('git rev-list --count HEAD', {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
  const n = parseInt(out, 10);
  if (Number.isFinite(n) && n > 0 && n % 50 === 0) {
    console.warn(
      '[orchestrate/archaeology] Порог: число коммитов кратно 50. Проведите аудит по docs/orchestrate/plugins/archaeology.md',
    );
  }
} catch {
  // Нет git или не репозиторий — тихо выходим.
}
