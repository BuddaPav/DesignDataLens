// ai_support/index.ts — Main entry: initialize all systems.

import { initStorage, addProjectChunk, searchProject, queryByTag, isReady as storageReady, getStats } from './storage';
import { initAgents, getSkill, runAgent, listSkills, searchProject as agentSearch } from './agents';
import { registerSkill } from './agents/index';
import { skill as coderSkill } from './skills/coder';
import { skill as searchSkill } from './skills/search';

let initialized = false;

export async function initAISupport(): Promise<boolean> {
  if (initialized) return true;

  console.log('[ai_support] Initializing...');

  // 1. Storage (memory)
  await initStorage();

  // 2. Register skills
  registerSkill(coderSkill);
  registerSkill(searchSkill);

  // 3. Agent system
  await initAgents();

  initialized = true;
  console.log('[ai_support] Ready');
  console.log('[ai_support] Skills:', listSkills().join(', '));
  console.log('[ai_support] Memory entries:', getStats().entries);

  return true;
}

// Index key functions for external use
export { addProjectChunk, searchProject, queryByTag, runAgent, listSkills, storageReady, getStats };

// Also export agents components
export { getSkill } from './agents/index';
export { chat } from './llm';
export type { AgentContext, AgentResult, AgentSkill } from './agents/index';