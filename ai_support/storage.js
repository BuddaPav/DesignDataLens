// ai_support/storage.js — "второй мозг": простой JSON + term search.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_FILE = path.join(__dirname, 'memory', 'chronos_memory.json');

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function ensureDir() {
  const dir = path.dirname(MEMORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    }
  } catch { /* first run */ }
  return [];
}

function save(memory) {
  ensureDir();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

// Simple term scoring
function scoreTerms(query, entry) {
  const q = query.toLowerCase().split(/\s+/);
  const c = entry.content.toLowerCase();
  let score = 0;
  for (const term of q) {
    if (c.includes(term)) score += 1;
    if (entry.tags?.some(t => t.toLowerCase().includes(term))) score += 2;
  }
  // recency boost
  if (entry.ts > Date.now() - 86400000) score += 0.5;
  return score;
}

let memory = [];

export async function initStorage() {
  memory = load();
  console.log('[ai_support] Memory ready, entries:', memory.length);
  return true;
}

export async function addProjectChunk(key, content, meta = {}, tags = []) {
  const entry = { id: key, content, tags, meta, ts: Date.now() };
  memory.push(entry);
  save(memory);
  return true;
}

export async function searchProject(query, topK = 5) {
  const scored = memory.map(e => ({ e, s: scoreTerms(query, e) }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, topK).map(({ e }) => ({ id: e.id, content: e.content, meta: e.meta }));
}

export async function queryByTag(tag) {
  return memory
    .filter(e => e.tags?.some(t => t.toLowerCase().includes(tag.toLowerCase())))
    .map(e => ({ id: e.id, content: e.content }));
}

export function isReady() { return true; }

export function getStats() { return { entries: memory.length }; }