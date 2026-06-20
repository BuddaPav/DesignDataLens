// ai_support/agents/index.js — Agent registry + execution.

import { chat } from '../llm.js';
import { searchProject, addProjectChunk, queryByTag } from '../storage.js';

// Agent registry
const skills = new Map();

export async function registerSkill(skill) {
  skills.set(skill.name, skill);
  console.log('[ai_support] Registered skill:', skill.name);
}

export function getSkill(name) {
  return skills.get(name);
}

export function listSkills() {
  return Array.from(skills.keys());
}

// Built-in skills
export async function initAgents() {
  console.log('[ai_support] Agent system ready, skills:', listSkills().length);
}

// Simple execution
export async function runAgent(skillName, opts = {}) {
  const skill = getSkill(skillName);
  if (!skill) return { ok: false, error: `Skill not found: ${skillName}` };

  const ctx = {
    projectRoot: './app/src',
    state: {},
    memories: [],
  };

  return skill.run(ctx, opts);
}

export { searchProject, addProjectChunk, queryByTag, chat };