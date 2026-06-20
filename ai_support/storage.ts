// ai_support/storage.ts — "второй мозг": простой JSON + term search (без embedding).
// NOTE: Node ESM requires explicit .js extensions in imports.
// Позже можно добавить chromadb/ef when ready.

import fs from 'fs';
import path from 'path';

const MEMORY_FILE = './ai_support/memory/chronos_memory.json';

interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  meta: Record<string, string>;
  ts: number;
}

let memory: MemoryEntry[] = [];
let dirty = false;

function ensureDir() {
  const dir = path.dirname(MEMORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load(): void {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      memory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    }
  } catch { memory = []; }
}

function save(): void {
  if (!dirty) return;
  ensureDir();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  dirty = false;
}

// Простой term search: tf-idf style
function scoreTerms(query: string, entry: MemoryEntry): number {
  const q = query.toLowerCase().split(/\s+/);
  const c = entry.content.toLowerCase();
  let score = 0;
  for (const term of q) {
    if (c.includes(term)) score += 1;
    if (entry.tags.some(t => t.toLowerCase().includes(term))) score += 2;
  }
  // recency boost
  score += (entry.ts > Date.now() - 86400000) ? 0.5 : 0;
  return score;
}

export async function initStorage(): Promise<boolean> {
  load();
  console.log('[ai_support] Memory storage ready, entries:', memory.length);
  return true;
}

export async function addProjectChunk(key: string, content: string, meta: Record<string, string> = {}, tags: string[] = []): Promise<boolean> {
  const entry: MemoryEntry = { id: key, content, tags, meta, ts: Date.now() };
  memory.push(entry);
  dirty = true;
  save();
  return true;
}

export async function searchProject(query: string, topK = 5): Promise<{ id: string; content: string; meta: Record<string, string> }[]> {
  const scored = memory.map(e => ({ e, s: scoreTerms(query, e) }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, topK).map(({ e }) => ({ id: e.id, content: e.content, meta: e.meta }));
}

export async function queryByTag(tag: string): Promise<{ id: string; content: string }[]> {
  return memory
    .filter(e => e.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())))
    .map(e => ({ id: e.id, content: e.content }));
}

export function isReady(): boolean { return true; }

export function getStats() { return { entries: memory.length }; }