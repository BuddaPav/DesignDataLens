// Simple .env loader for secure API key management
import fs from 'fs';
import path from 'path';

const ENV_FILE = path.join(__dirname, '.env.api');

export function loadEnvFile(): void {
  if (!fs.existsSync(ENV_FILE)) {
    console.log('[env] No .env.api file found');
    return;
  }

  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();

    if (key && value) {
      process.env[key] = value;
    }
  }

  console.log('[env] Loaded API keys from .env.api');
}

// Auto-load on import
loadEnvFile();