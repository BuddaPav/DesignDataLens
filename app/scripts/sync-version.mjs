/**
 * Перед production-сборкой синхронизирует public/version.json с package.json.
 * При деплое замените dist/version.json (или хостинг) на новый манифест — клиент увидит обновление.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const notesFromPkg =
  typeof pkg.chronosReleaseNotesRu === 'string' ? pkg.chronosReleaseNotesRu.trim() : '';
const manifest = {
  version: pkg.version,
  downloadUrl: typeof pkg.chronosDownloadUrl === 'string' ? pkg.chronosDownloadUrl.trim() : '',
  releaseNotesRu:
    notesFromPkg ||
    'Обновление Chronos. Замените файлы сборки или выполните установку заново, затем обновите страницу (Ctrl+F5).',
  releasedAt: new Date().toISOString().slice(0, 10)
};
writeFileSync(join(root, 'public', 'version.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('[sync-version]', manifest.version, '→ public/version.json');

const swPath = join(root, 'public', 'sw.js');
try {
  let sw = readFileSync(swPath, 'utf8');
  const cacheId = `chronos-v${pkg.version.replace(/\./g, '-')}`;
  sw = sw.replace(/const CACHE_NAME = '[^']*'/, `const CACHE_NAME = '${cacheId}'`);
  writeFileSync(swPath, sw, 'utf8');
  console.log('[sync-version] service worker CACHE_NAME →', cacheId);
} catch (e) {
  console.warn('[sync-version] sw.js skip:', e.message);
}
