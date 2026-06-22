// ai_support/agents/index.ts — Agent registry + execution.

import { chat, type ChatMessage } from '../llm';
import { searchProject, addProjectChunk, queryByTag } from '../storage';

export interface AgentSkill {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (ctx: AgentContext, opts?: any) => Promise<AgentResult>;
}

export interface AgentContext {
  projectRoot: string;
  currentFile?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: Record<string, any>;
  memories: string[];
}

export interface AgentResult {
  ok: boolean;
  output?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
}

// Agent registry
const skills = new Map<string, AgentSkill>();

export function registerSkill(skill: AgentSkill): void {
  skills.set(skill.name, skill);
  console.log('[ai_support] Registered skill:', skill.name);
}

export function getSkill(name: string): AgentSkill | undefined {
  return skills.get(name);
}

export function listSkills(): string[] {
  return Array.from(skills.keys());
}

// Base prompts
const SYSTEM_PROMPT = `Ты — агент-разработчик для проекта Chronos (AFK Game).
Твоя задача — анализировать код, находить проблемы, предлагать улучшения.
Используй предоставленные инструменты: search (поиск по проекту), read (чтение файла), edit (редактирование).

Правила:
- Не создавай бессмысленных файлов
- Минимум действий, максимум результата
- Фиксируй значимые изменения в build_log.txt`;

const CODE_ANALYST_PROMPT = `Ты — агент-аналитик кода. Твоя задача:
1. Найти баги и техдолг в коде
2. Оценить качество и предложить улучшения
3. Вернуть структурированный отчёт

Анализируй предоставленный файл или паттерн.`;

// Agent execution
export async function runAgent(
  skillName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opts?: any
): Promise<AgentResult> {
  const skill = getSkill(skillName);
  if (!skill) return { ok: false, error: `Skill not found: ${skillName}` };

  const ctx: AgentContext = {
    projectRoot: './afk_game',
    state: {},
    memories: [],
  };

  return skill.run(ctx, opts);
}

// Built-in skills (будут добавлены позже)
export async function initAgents(): Promise<void> {
  console.log('[ai_support] Agent system ready, skills:', listSkills().length);
}

export { searchProject, addProjectChunk, queryByTag, chat, type ChatMessage };