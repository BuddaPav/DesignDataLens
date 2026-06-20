// ai_support/index.js — Main entry.

import { initStorage, addProjectChunk, searchProject, queryByTag, getStats } from './storage.js';
import { initAgents, getSkill, runAgent, listSkills } from './agents/index.js';
import { registerSkill } from './agents/index.js';
import { skill as coderSkill } from './skills/coder.js';
import { skill as searchSkill } from './skills/search.js';

let initialized = false;

export async function initAISupport() {
  if (initialized) return true;
  console.log('[ai_support] Initializing...');

  await initStorage();
  registerSkill(coderSkill);
  registerSkill(searchSkill);
  await initAgents();

  initialized = true;
  console.log('[ai_support] Ready');
  console.log('[ai_support] Skills:', listSkills().join(', '));
  console.log('[ai_support] Memory:', getStats().entries, 'entries');
  return true;
}

export { addProjectChunk, searchProject, queryByTag, runAgent, listSkills, getSkill, getStats };

// Lazy LLM
let _chat = null;
export async function chat(opts) {
  if (!_chat) _chat = (await import('./llm.js')).chat;
  return _chat(opts);
}