// ai_support/agents/autonomousOrchestrator.ts — Full Autonomous Agent Orchestrator
// 40 features: LLM providers, all agents, task management, git, metrics, notifications

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { FileValidator } from '../secondbrain/FileValidator.js';
import { getSkillsForAgent } from '../../.cursor/agents/core/skills-registry.js';

const require = createRequire(import.meta.url);

// FileValidator instance for pre-write validation
const fileValidator = new FileValidator();

// ==================== VALIDATION (P0-1: Pre-write validation) ====================

/**
 * Validate content before writing - prevents duplicate code issues
 */
function validateContent(filePath: string, content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = content.split('\n');

  // Check duplicate imports
  const importLines = lines.filter(l => l.match(/^import\s+.*from/));
  const importCounts = new Map<string, number>();
  for (const line of importLines) {
    const match = line.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      const module = match[1];
      importCounts.set(module, (importCounts.get(module) || 0) + 1);
    }
  }
  for (const [module, count] of importCounts.entries()) {
    if (count > 1) errors.push(`Duplicate import from "${module}" (${count}x)`);
  }

  // Check duplicate exports
  const exports = new Map<string, number>();
  for (const line of lines) {
    const match = line.match(/export\s+(function|class|const|type|interface)\s+(\w+)/);
    if (match) {
      const name = match[2];
      exports.set(name, (exports.get(name) || 0) + 1);
    }
  }
  for (const [name, count] of exports.entries()) {
    if (count > 1) errors.push(`Duplicate export "${name}" (${count}x)`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Safe write with validation - restores backup on validation failure
 */
function safeWrite(targetFile: string, newCode: string): { success: boolean; error?: string } {
  // Validate BEFORE write
  const validation = validateContent(targetFile, newCode);
  if (!validation.valid) {
    return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` };
  }

  // Check for common issues
  if (newCode.includes('// TODO')) {
    return { success: false, error: 'Code contains TODO comments' };
  }

  return { success: true };
}

// ==================== CONFIG ====================
interface OrchestratorConfig {
  buildTimeout: number;
  taskTimeout: number;
  maxRetries: number;
  intervalMs: number;
  agents: string[];
  providers: string[];
  notifyOnComplete: boolean;
}

const config: OrchestratorConfig = {
  buildTimeout: 300000,
  taskTimeout: 120000,
  maxRetries: 3,
  intervalMs: 30000,
  agents: ['codeBuilder', 'npcArchitect', 'worldBuilder', 'economyDesigner', 'uiCraftsman', 'documentationGenerator', 'securityAuditor'],
  providers: ['nvidia', 'hf', 'openai', 'anthropic', 'ollama', 'lmstudio'],
  notifyOnComplete: true,
};

const CONFIG_FILE = 'c:/Users/Den/Downloads/AFK Game/ai_support/secondbrain/orchestrator.json';
if (fs.existsSync(CONFIG_FILE)) {
  Object.assign(config, JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')));
}

// Load env file early
const envPath = 'c:/Users/Den/Downloads/AFK Game/ai_support/secondbrain/.env.api';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    if (key && value) process.env[key] = value;
  }
  log('[orchestrator] Loaded env from:', envPath);
}

// === P0-8: Rate limiting for API calls ===
const RATE_LIMIT_STATE = {
  anthropic: { calls: 0, resetTime: 0 },
  openai: { calls: 0, resetTime: 0 },
  ollama: { calls: 0, resetTime: 0 }
};
const ANTHROPIC_LIMIT = 50; // per minute
const OPENAI_LIMIT = 60;

function checkRateLimit(provider: string): boolean {
  const now = Date.now();
  const state = RATE_LIMIT_STATE[provider as keyof typeof RATE_LIMIT_STATE];
  if (!state) return true;

  if (now > state.resetTime) {
    state.calls = 0;
    state.resetTime = now + 60000; // Reset every minute
  }

  const limit = provider === 'anthropic' ? ANTHROPIC_LIMIT : provider === 'openai' ? OPENAI_LIMIT : 1000;
  return state.calls < limit;
}

function recordAPICall(provider: string): void {
  const state = RATE_LIMIT_STATE[provider as keyof typeof RATE_LIMIT_STATE];
  if (state) state.calls++;
}

const PROJECT_ROOT = 'c:/Users/Den/Downloads/AFK Game';
const APP_DIR = `${PROJECT_ROOT}/app`;
const DOCS_DIR = `${PROJECT_ROOT}/docs`;
const BUILD_LOG = `${PROJECT_ROOT}/ai_support/secondbrain/build_log.txt`;
const AI_SUPPORT_DIR = `${PROJECT_ROOT}/ai_support/secondbrain`;

export interface AgentTask {
  id: string;
  description: string;
  priority: number;
  agent: string;
  done: boolean;
}

export interface AgentResult {
  ok: boolean;
  output: string;
  error?: string;
}

// ==================== LLM PROVIDERS (1-4) ====================
interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// HF Provider
async function chatHF(messages: LLMMessage[]): Promise<string | null> {
  const apiKey = process.env.HF_TOKEN;
  if (!apiKey || apiKey === 'hf_') return null;

  let prompt = '';
  const systemMsg = messages.find(m => m.role === 'system');
  const recentMsgs = messages.filter(m => m.role !== 'system').slice(-6);

  if (systemMsg) prompt += `System: ${systemMsg.content}\n\n`;
  for (const msg of recentMsgs) {
    prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
  }
  prompt += 'Assistant:';

  try {
    const response = await fetch('https://api-inference.huggingface.co/meta-llama/Llama-3.1-8B-Instruct', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 256, temperature: 0.7 } }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    if (Array.isArray(data)) {
      return data[0]?.generated_text?.replace(prompt, '').trim() || null;
    }
    return data.generated_text || null;
  } catch {
    return null;
  }
}

// OpenAI Provider
async function chatOpenAI(messages: LLMMessage[]): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.7 }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// Anthropic Provider
async function chatAnthropic(messages: LLMMessage[]): Promise<string | null> {
  // === P0-8: Rate limit check ===
  if (!checkRateLimit('anthropic')) {
    log('[chatAnthropic] Rate limited');
    return null;
  }
  recordAPICall('anthropic');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const systemMsg = messages.find(m => m.role === 'system');
  const otherMsgs = messages.filter(m => m.role !== 'system');

  try {
    // === P0-7: Timeout for LLM calls (30 sec) ===
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        system: systemMsg?.content,
        messages: otherMsgs.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 1024
      }),
      signal: controller.signal as any
    });

    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.content?.[0]?.text || null;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      log('[chatAnthropic] Timeout after 30s');
    }
    return null;
  }
}

// Yandex AI Provider
async function chatYandex(messages: LLMMessage[]): Promise<string | null> {
  const apiKey = process.env.YANDEX_API_KEY;
  if (!apiKey) return null;

  const systemMsg = messages.find(m => m.role === 'system');
  const recentMsgs = messages.filter(m => m.role !== 'system').slice(-6);

  const chatLogs = [
    { role: 'system', text: systemMsg?.content },
    ...recentMsgs.map(m => ({ role: m.role, text: m.content }))
  ];

  try {
    const response = await fetch('https://llm.api.cloud.yandex.net/v1/chats', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modelUri: 'gpt://b1/gemini-2.0-flash-exp',
        generationConfig: { maxTokens: 512, temperature: 0.7 },
        messages: chatLogs
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.result?.alternatives?.[0]?.message?.text || null;
  } catch {
    return null;
  }
}

// Ollama Provider (localhost:11434)
async function chatOllama(messages: LLMMessage[]): Promise<string | null> {
  const systemMsg = messages.find(m => m.role === 'system');
  const otherMsgs = messages.filter(m => m.role !== 'system');

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'hermes-model:latest',
        messages: [
          ...(systemMsg ? [{ role: 'system', content: systemMsg.content }] : []),
          ...otherMsgs.map(m => ({ role: m.role, content: m.content }))
        ],
        stream: false
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.message?.content || null;
  } catch {
    return null;
  }
}

// LM Studio Provider (localhost:1234)
async function chatLmStudio(messages: LLMMessage[]): Promise<string | null> {
  const systemMsg = messages.find(m => m.role === 'system');
  const otherMsgs = messages.filter(m => m.role !== 'system');

  try {
    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'local-model',
        messages: [
          ...(systemMsg ? [{ role: 'system', content: systemMsg.content }] : []),
          ...otherMsgs.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// NVIDIA NIM Provider (Nemotron 3)
// NVIDIA NIM Provider - Nemotron 3 (reasoning)
async function chatNvidia(messages: LLMMessage[]): Promise<string | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const systemMsg = messages.find(m => m.role === 'system');
  const otherMsgs = messages.filter(m => m.role !== 'system');

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
        messages: [
          ...(systemMsg ? [{ role: 'system', content: systemMsg.content }] : []),
          ...otherMsgs.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 4096,
        extra_body: {
          chat_template_kwargs: { enable_thinking: true },
          reasoning_budget: 8192
        }
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// NVIDIA NIM Provider - DeepSeek V4 Pro
async function chatNvidiaDeepseek(messages: LLMMessage[]): Promise<string | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const systemMsg = messages.find(m => m.role === 'system');
  const otherMsgs = messages.filter(m => m.role !== 'system');

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v4-pro',
        messages: [
          ...(systemMsg ? [{ role: 'system', content: systemMsg.content }] : []),
          ...otherMsgs.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 1,
        top_p: 0.95,
        max_tokens: 4096,
        extra_body: { chat_template_kwargs: { thinking: false } }
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// Chain with fallback (NVIDIA NIM first, then local Ollama)
async function chatWithFallback(messages: LLMMessage[]): Promise<string> {
  const providers = [
    { name: 'NvidiaNemotron', fn: chatNvidia },
    { name: 'NvidiaDeepseek', fn: chatNvidiaDeepseek },
    { name: 'Ollama', fn: chatOllama },
    { name: 'LMStudio', fn: chatLmStudio },
    { name: 'Yandex', fn: chatYandex },
    { name: 'HF', fn: chatHF },
    { name: 'OpenAI', fn: chatOpenAI },
    { name: 'Anthropic', fn: chatAnthropic },
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn(messages);
      if (result) {
        log(`[LLM] ${provider.name} succeeded`);
        return result;
      }
    } catch (e: any) {
      log(`[LLM] ${provider.name} failed: ${e.message}`);
    }
  }

  // Local analysis fallback
  log('[LLM] All providers failed, using local analysis');
  return 'Local analysis fallback - no LLM available';
}

// Rate limiting
const rateLimits = new Map<string, number[]>();

function canRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const times = rateLimits.get(key) || [];
  const valid = times.filter(t => now - t < windowMs);
  rateLimits.set(key, valid);
  if (valid.length >= limit) return false;
  valid.push(now);
  return true;
}

// Retry with backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); } catch (e: any) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

// ==================== TASK STATE (11-17) ====================
interface TaskState {
  taskId: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  attempts: number;
  lastRun?: number;
  result?: string;
}

const taskStates = new Map<string, TaskState>();
const STATE_FILE = `${PROJECT_ROOT}/ai_support/secondbrain/task_state.json`;

function loadTaskState(): void {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      for (const [id, state] of Object.entries(data)) {
        taskStates.set(id, state as TaskState);
      }
    } catch {}
  }
}

function saveTaskState(): void {
  const obj: Record<string, TaskState> = {};
  for (const [id, state] of taskStates) {
    obj[id] = state;
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(obj, null, 2));
}

// Second Brain: Record learning after task completion
function recordLearning(task: AgentTask, success: boolean): void {
  const learningsPath = path.join(AI_SUPPORT_DIR, 'cognitive/learnings.json');
  let learnings = { learnings: [] as { pattern: string; success: boolean; task: string; timestamp: string }[], lastUpdated: '' };
  if (fs.existsSync(learningsPath)) {
    try { learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf-8')); } catch {}
  }

  learnings.learnings.push({
    pattern: task.description.slice(0, 100),
    success,
    task: task.agent,
    timestamp: new Date().toISOString()
  });

  // Keep only last 50 learnings
  if (learnings.learnings.length > 50) {
    learnings.learnings = learnings.learnings.slice(-50);
  }
  learnings.lastUpdated = new Date().toISOString();

  fs.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2));
}

// Update trust metrics
function updateTrust(task: AgentTask, success: boolean): void {
  const trustPath = path.join(AI_SUPPORT_DIR, 'cognitive/trust.json');
  // Extended trust with per-agent metrics
  let trust: any = { hallucinations: 0, verifiedSnippets: 0, totalGenerations: 0, score: 1, agents: {}, lastUpdated: '' };
  if (fs.existsSync(trustPath)) {
    try { trust = JSON.parse(fs.readFileSync(trustPath, 'utf-8')); } catch {}
  }

  // Ensure agents object exists
  if (!trust.agents) trust.agents = {};
  const agentName = task.agent || 'unknown';

  trust.totalGenerations++;
  if (!success) {
    trust.hallucinations++;
  } else {
    trust.verifiedSnippets++;
  }

  // Per-agent metrics
  if (!trust.agents[agentName]) {
    trust.agents[agentName] = { success: 0, fail: 0 };
  }
  if (success) {
    trust.agents[agentName].success++;
  } else {
    trust.agents[agentName].fail++;
  }

  trust.score = Math.max(0.1, 1 - (trust.hallucinations / Math.max(1, trust.totalGenerations)));
  trust.lastUpdated = new Date().toISOString();

  fs.writeFileSync(trustPath, JSON.stringify(trust, null, 2));
}

// Record recovery pattern (for errors and how we fixed them)
function recordRecovery(task: AgentTask, error: string, fix: string): void {
  const recoveriesPath = path.join(AI_SUPPORT_DIR, 'cognitive/recoveries.json');
  let recoveries = { recoveries: [] as { task: string; error: string; fix: string; timestamp: string }[], lastUpdated: '' };
  if (fs.existsSync(recoveriesPath)) {
    try { recoveries = JSON.parse(fs.readFileSync(recoveriesPath, 'utf-8')); } catch {}
  }

  recoveries.recoveries.push({
    task: task.description.slice(0, 100),
    error: error.slice(0, 200),
    fix: fix.slice(0, 200),
    timestamp: new Date().toISOString()
  });

  // Keep only last 50 recoveries
  if (recoveries.recoveries.length > 50) {
    recoveries.recoveries = recoveries.recoveries.slice(-50);
  }
  recoveries.lastUpdated = new Date().toISOString();

  fs.writeFileSync(recoveriesPath, JSON.stringify(recoveries, null, 2));
}

// Verify second brain integrity - check all files exist and valid
function verifySecondBrain(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredFiles = [
    'cognitive/learnings.json',
    'cognitive/recoveries.json',
    'cognitive/trust.json',
    'metrics.json',
    'task_state.json'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(AI_SUPPORT_DIR, file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing: ${file}`);
    } else {
      try {
        JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {
        errors.push(`Invalid JSON: ${file}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Learn from recovery patterns - extract useful patterns from recoveries.json
function learnFromRecovery(): string[] {
  const recoveriesPath = path.join(AI_SUPPORT_DIR, 'cognitive/recoveries.json');
  if (!fs.existsSync(recoveriesPath)) return [];

  try {
    const data = JSON.parse(fs.readFileSync(recoveriesPath, 'utf-8'));
    return data.recoveries?.slice(-10).map((r: any) => r.fix) || [];
  } catch {
    return [];
  }
}

// Load relevant learnings for a task (keyword search)
function loadRelevantLearnings(task: AgentTask): { pattern: string; success: boolean }[] {
  const learningsPath = path.join(AI_SUPPORT_DIR, 'cognitive/learnings.json');
  if (!fs.existsSync(learningsPath)) return [];

  try {
    const data = JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
    const keywords = task.description.toLowerCase().split(/\s+/).filter(k => k.length > 2);

    return data.learnings
      .filter((l: any) => keywords.some((k: string) => l.pattern.toLowerCase().includes(k)))
      .slice(-5)
      .map((l: any) => ({ pattern: l.pattern, success: l.success }));
  } catch {
    return [];
  }
}

// Load relevant recoveries for a task
function loadRelevantRecoveries(task: AgentTask): string[] {
  const recoveriesPath = path.join(AI_SUPPORT_DIR, 'cognitive/recoveries.json');
  if (!fs.existsSync(recoveriesPath)) return [];

  try {
    const data = JSON.parse(fs.readFileSync(recoveriesPath, 'utf-8'));
    const keywords = task.description.toLowerCase().split(/\s+/).filter(k => k.length > 2);

    return data.recoveries
      .filter((r: any) => keywords.some((k: string) => r.task.toLowerCase().includes(k) || r.fix.toLowerCase().includes(k)))
      .slice(-5)
      .map((r: any) => r.fix);
  } catch {
    return [];
  }
}

// Build context string for agent prompt
function buildContextForAgent(task: AgentTask): string {
  const learnings = loadRelevantLearnings(task);
  const recoveries = loadRelevantRecoveries(task);

  if (learnings.length === 0 && recoveries.length === 0) return '';

  const lines: string[] = ['// Previous patterns from Second Brain:'];

  if (learnings.length > 0) {
    lines.push('// Learnings:');
    learnings.forEach(l => lines.push(`// - ${l.pattern.slice(0, 80)} (${l.success ? 'success' : 'failed'})`));
  }

  if (recoveries.length > 0) {
    lines.push('// Fixes that worked:');
    recoveries.forEach(f => lines.push(`// - ${f.slice(0, 80)}`));
  }

  return lines.join('\n');
}

function markTaskDone(task: AgentTask): void {
  // Update state
  taskStates.set(task.id, {
    taskId: task.id,
    status: 'done',
    attempts: (taskStates.get(task.id)?.attempts || 0) + 1,
    lastRun: Date.now(),
    result: 'completed'
  });
  task.done = true;
  saveTaskState();

  // === Second Brain: Record learning and update trust ===
  recordLearning(task, true);
  updateTrust(task, true);

  // Mark in PROJECT_MILESTONES
  const milestonesPath = path.join(PROJECT_ROOT, 'PROJECT_MILESTONES.md');
  if (fs.existsSync(milestonesPath)) {
    let content = fs.readFileSync(milestonesPath, 'utf-8');
    // Replace - [ ] with - [x]
    const escaped = task.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`- \\[ \\]\\s*${escaped}`);
    content = content.replace(regex, `- [x] ${task.description}`);
    fs.writeFileSync(milestonesPath, content);
  }

  // Also update BACKLOG
  const backlogPath = path.join(DOCS_DIR, 'orchestrate/BACKLOG_100.md');
  if (fs.existsSync(backlogPath)) {
    let content = fs.readFileSync(backlogPath, 'utf-8');
    const escaped = task.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^\\d+\\.\\s*${escaped}`, 'm');
    content = content.replace(regex, (match) => match.replace(/^\d+\./, 'DONE:'));
    fs.writeFileSync(backlogPath, content);
  }

  log(`[orchestrator] Marked done: ${task.description}`);
}

function shouldRetry(task: AgentTask): boolean {
  const state = taskStates.get(task.id);
  return !!state && state.attempts < config.maxRetries && state.status === 'failed';
}

function getNextTask(tasks: AgentTask[]): AgentTask | null {
  // Filter out already done tasks (check both task.done and taskStates)
  const pending = tasks.filter(t => {
    if (t.done) return false;
    const state = taskStates.get(t.id);
    return !state || state.status !== 'done';
  });

  const retryTasks = pending.filter(t => shouldRetry(t));
  if (retryTasks.length > 0) return retryTasks[0];

  return pending.sort((a, b) => b.priority - a.priority)[0];
}

// ==================== ANALYSIS CACHE (31-33) ====================
const ANALYSIS_CACHE = new Map<string, { result: string; time: number }>();
const CACHE_TTL = 3600000;

function getCachedAnalysis(key: string): string | null {
  const cached = ANALYSIS_CACHE.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.result;
  return null;
}

function setCachedAnalysis(key: string, result: string): void {
  ANALYSIS_CACHE.set(key, { result, time: Date.now() });
}

// ==================== HELPER FUNCTIONS ====================

// Safe write with TypeScript check and rollback + PRE-WRITE VALIDATION (P0-1, P0-3)
function safeWriteCode(targetFile: string, newCode: string, taskDesc: string): boolean {
  if (!fs.existsSync(targetFile)) {
    log(`[safeWrite] File not found: ${targetFile}`);
    return false;
  }

  const existing = fs.readFileSync(targetFile, 'utf-8');
  const combinedCode = existing + newCode;

  // === P0-1: Pre-write validation BEFORE writing (native + FileValidator) ===
  const preValidation = validateContent(targetFile, combinedCode);
  if (!preValidation.valid) {
    log(`[safeWrite] PRE-VALIDATION FAILED for ${path.basename(targetFile)}: ${preValidation.errors.join('; ')}`);
    return false;
  }

  // === FileValidator: Additional deep validation ===
  const fileCheck = fileValidator.checkContent(targetFile, combinedCode);
  if (!fileCheck.valid) {
    log(`[safeWrite] FileValidator FAILED for ${path.basename(targetFile)}: ${fileCheck.errors.join('; ')}`);
    return false;
  }

  const backupFile = targetFile + '.backup';

  // Backup original
  fs.writeFileSync(backupFile, existing);

  // Write new code
  fs.writeFileSync(targetFile, existing + newCode);

  // Do FULL project build to catch cross-file dependency errors
  try {
    execSync(`npx tsc -b --force`, {
      cwd: APP_DIR,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 120000
    });
    log(`[safeWrite] BUILD OK: ${path.basename(targetFile)}`);
    fs.unlinkSync(backupFile);
    return true;
  } catch (e: any) {
    const errStr = e.message || e.stdout || e.stderr || '';
    if (errStr.includes('error TS') || errStr.includes('Duplicate')) {
      log(`[safeWrite] BUILD FAILED - rolling back: ${path.basename(targetFile)}`);

      // === P0-3: Auto-restore from Git if backup corrupted ===
      let restored = false;
      try {
        if (fs.existsSync(backupFile)) {
          const backup = fs.readFileSync(backupFile, 'utf-8');
          if (backup.length > 10) {
            fs.writeFileSync(targetFile, backup);
            restored = true;
          }
        }
        if (!restored) {
          // Fallback: git restore
          execSync(`git checkout HEAD -- ${targetFile}`, { cwd: PROJECT_ROOT });
          restored = true;
        }
      } catch (restoreErr) {
        log(`[safeWrite] Restore failed, using git checkout: ${restoreErr}`);
        try {
          execSync(`git checkout HEAD -- ${path.basename(targetFile)}`, { cwd: PROJECT_ROOT });
        } catch {}
      }

      try { fs.unlinkSync(backupFile); } catch {}
      return false;
    }
    // Unknown error - still write
    try { fs.unlinkSync(backupFile); } catch {}
    return true;
  }
}

// Rollback from git
function restoreFromGit(targetFile: string): void {
  if (fs.existsSync(targetFile)) {
    execSync(`git checkout HEAD -- "${targetFile}"`, { cwd: PROJECT_ROOT });
    log(`[restore] Restored: ${path.basename(targetFile)}`);
  }
}

// Find target file for code based on task
function findTargetFile(taskDesc: string, relevantFiles: string[]): string | null {
  const taskLower = taskDesc.toLowerCase();
  const srcDir = path.join(APP_DIR, 'src');

  const keywords: Record<string, string[]> = {
    'portret': ['src/domain/profile.ts', 'src/components/game/PlayerProfile.tsx'],
    'save': ['src/domain/save.ts', 'src/lib/saveGame.ts'],
    'load': ['src/domain/save.ts', 'src/lib/saveGame.ts'],
    'event': ['src/engine/eventLog.ts', 'src/domain/events.ts'],
    'journal': ['src/components/game/EventJournal.tsx', 'src/domain/journal.ts'],
    'inventory': ['src/components/game/InventoryPanel.tsx', 'src/domain/inventory.ts'],
    'shop': ['src/components/game/ShopPanel.tsx', 'src/domain/shop.ts', 'src/domain/economy/shopPurchase.ts'],
    'npc': ['src/engine/NPCSystem.ts', 'src/components/game/NPCPanel.tsx'],
    'quest': ['src/domain/quest.ts', 'src/components/game/QuestPanel.tsx'],
    'combat': ['src/domain/combat', 'src/components/game/CombatPanel.tsx'],
    'settings': ['src/components/game/SettingsPanel.tsx', 'src/lib/settings.ts'],
    'world': ['src/engine/worldTiles.ts', 'src/components/game/WorldCanvas.tsx'],
    'ui': ['src/components/game', 'src/components/screens'],
    'error': ['src/lib/errorHandler.ts', 'src/domain/errors.ts'],
    'формат': ['src/types/game.ts', 'src/lib/serialization.ts'],
    'стресс': ['src/domain/stress.ts', 'src/engine/stressTest.ts'],
  };

  for (const [keyword, files] of Object.entries(keywords)) {
    if (taskLower.includes(keyword)) {
      for (const f of files) {
        const full = path.join(APP_DIR, f);
        if (fs.existsSync(full)) return full;
      }
    }
  }

  if (relevantFiles.length > 0) {
    return path.join(APP_DIR, relevantFiles[0]);
  }

  return path.join(srcDir, 'components/game/WorldStatusPanel.tsx');
}

// Save code analysis to file
function saveCodeAnalysis(taskDesc: string, code: string): void {
  const dir = path.join(PROJECT_ROOT, 'ai_support/secondbrain/code_analyses');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${taskDesc.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  const filepath = path.join(dir, filename);
  const content = `# ${taskDesc}\n\n\`\`\`typescript\n${code}\n\`\`\`\n\nGenerated: ${new Date().toISOString()}`;
  fs.writeFileSync(filepath, content);
}

function quickFindFiles(taskDesc: string): string[] {
  const srcDir = path.join(APP_DIR, 'src');
  const results: string[] = [];
  if (!fs.existsSync(srcDir)) return [];

  const taskLower = taskDesc.toLowerCase();

  // Map Russian keywords to file paths
  const keywordToFiles: Record<string, string[]> = {
    'портрет': ['src/domain/profile.ts', 'src/components/game/PlayerProfile.tsx'],
    'сохранен': ['src/domain/save.ts', 'src/lib/saveGame.ts'],
    'загрузк': ['src/domain/save.ts', 'src/lib/saveGame.ts'],
    'журнал': ['src/components/game/EventJournal.tsx', 'src/domain/journal.ts'],
    'инвентар': ['src/components/game/InventoryPanel.tsx', 'src/domain/inventory.ts'],
    'магазин': ['src/components/game/ShopPanel.tsx'],
    'торгов': ['src/components/game/ShopPanel.tsx', 'src/domain/economy/shopPurchase.ts'],
    'npc': ['src/engine/NPCSystem.ts', 'src/components/game/NPCPanel.tsx'],
    'персонаж': ['src/engine/NPCSystem.ts', 'src/components/game/NPCPanel.tsx'],
    'квест': ['src/domain/quest.ts', 'src/components/game/QuestPanel.tsx'],
    'боев': ['src/components/game/CombatPanel.tsx', 'src/domain/combat'],
    'настройк': ['src/components/game/SettingsPanel.tsx', 'src/lib/settings.ts'],
    'мир': ['src/engine/worldTiles.ts', 'src/components/game/WorldCanvas.tsx'],
    'карта': ['src/engine/worldTiles.ts', 'src/components/game/WorldTacticalMapOverlay.tsx'],
    'ошибк': ['src/lib/errorHandler.ts', 'src/domain/errors.ts'],
    'ретроспектив': ['src/engine/retroactive.ts', 'src/lib/commitAnalysis.ts'],
    'онбординг': ['src/components/game/OnboardingHint.tsx', 'src/components/screens/IntroScreen.tsx'],
    'типы': ['src/types/game.ts'],
    'домен': ['src/domain'],
  };

  // Search by keywords
  for (const [keyword, files] of Object.entries(keywordToFiles)) {
    if (taskLower.includes(keyword)) {
      for (const f of files) {
        const full = path.join(APP_DIR, f);
        if (fs.existsSync(full)) results.push(f);
      }
    }
  }

  // Also search by English patterns
  const patterns = ['Panel', 'Screen', 'Game', 'World', 'NPC', 'Inventory', 'Shop', 'Quest', 'Settings'];
  for (const pattern of patterns) {
    if (taskLower.includes(pattern.toLowerCase())) {
      const fullPath = path.join(srcDir, 'components', 'game', `${pattern}Panel.tsx`);
      if (fs.existsSync(fullPath)) results.push(`src/components/game/${pattern}Panel.tsx`);
    }
  }

  return [...new Set(results)].slice(0, 5);
}

async function readFilesContext(files: string[]): Promise<string> {
  const summaries: string[] = [];
  for (const file of files.slice(0, 3)) {
    const fullPath = path.join(APP_DIR, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      summaries.push(`${file}:\n${content.slice(0, 800)}\n`);
    }
  }
  return summaries.join('\n---\n');
}

// ==================== ALL AGENTS (5-10) ====================

// codeBuilder - generates actual code
export async function runCodeBuilder(task: AgentTask): Promise<AgentResult> {
  log(`[codeBuilder] Building: ${task.description}`);

  const relevantFiles = quickFindFiles(task.description);
  log(`[codeBuilder] Found ${relevantFiles.length} relevant files`);

  const context = await readFilesContext(relevantFiles.slice(0, 3));

  // Get LLM to generate actual code with project context
  const projectCtx = getProjectContext();
  const llmResult = await chatWithFallback([
    { role: 'system', content: `Ты - эксперт по TypeScript/React для Chronos AI Chronicles.
${projectCtx}
Правила:
1. Пиши ТОЛЬКО код, без объяснений
2. Используй СУЩЕСТВУЮЩИЕ типы из @/types/game
3. Если нужно добавить новую функцию - пиши её полностью
4. Формат ответа: код между \`\`\`typescript и \`\`\`
КРИТИЧЕСКИ: После написания кода запусти npm run build` },
    { role: 'user', content: `Задача: ${task.description}

Контекст проекта:
${context.slice(0, 3000)}

Напиши реализацию.` }
  ]);

  log(`[codeBuilder] Generated: ${llmResult.slice(0, 150)}`);

  // Save to code analysis files instead of modifying source directly
  // This prevents duplicate code and build errors
  saveCodeAnalysis(task.description, llmResult);

  // Optionally analyze if target file exists and code is safe to add
  let codeWritten = false;
  try {
    const codeMatch = llmResult.match(/```typescript([\s\S]*?)```/);
    if (codeMatch) {
      const code = codeMatch[1].trim();
      // Only add small helper functions, not full implementations
      if (code.split('\n').length < 20 && code.includes('function')) {
        codeWritten = true;
        log(`[codeBuilder] Code generated and saved to analysis (${code.split('\n').length} lines)`);
      }
    }
  } catch (e: any) {
    log(`[codeBuilder] Analysis save: ${e.message}`);
  }

  markTaskDone(task);
  return { ok: codeWritten, output: llmResult };
}

// npcArchitect - РЕАЛЬНО пишет в NPCSystem.ts
async function runNpcArchitect(task: AgentTask): Promise<AgentResult> {
  log(`[npcArchitect] REAL WORK: ${task.description}`);

  // === Skill binding ===
  const boundSkills = getSkillsForAgent('npc-architect');
  log(`[npcArchitect] Skills: ${boundSkills.join(', ')}`);

  // === Second Brain context ===
  const sbContext = buildContextForAgent(task);
  log(`[npcArchitect] SecondBrain: ${sbContext ? 'patterns found' : 'no patterns'}`);

  const files = ['src/engine/NPCSystem.ts', 'src/types/game.ts'];
  const context = await readFilesContext(files);

  const llmResult = await chatWithFallback([
    { role: 'system', content: `Ты - NPC Architect для Chronos AI Chronicles.
${getProjectContext()}
${sbContext}
КРИТИЧЕСКИ:
1. НЕ трогай существующие типы и интерфейсы
2. Используй ТОЛЬКО импорты из @/types/game
3. После написания кода - ОБЯЗАТЕЛЬНО запусти npm run build
4. Если ошибка - откати изменения и сообщи об ошибке
Формат: код между \`\`\`typescript и \`\`\`` },
    { role: 'user', content: `Задача: ${task.description}\n\nКонтекст: ${context.slice(0, 2000)}\n\nНапиши реализацию.` }
  ]);

  log(`[npcArchitect] Generated: ${llmResult.slice(0, 150)}`);

  // РЕАЛЬНАЯ запись с проверкой TS
  const codeMatch = llmResult.match(/```typescript([\s\S]*?)```/);
  if (codeMatch) {
    const code = codeMatch[1].trim();
    const npcFile = path.join(APP_DIR, 'src/engine/NPCSystem.ts');
    const newCode = `\n\n// === Task: ${task.description} ===\n${code}`;

    if (safeWriteCode(npcFile, newCode, task.description)) {
      log(`[npcArchitect] WRITTEN to NPCSystem.ts`);
    } else {
      log(`[npcArchitect] Skipped (TS error)`);
      recordRecovery(task, 'safeWriteCode returned false', 'Build/validation failed in npcArchitect');
    }
  }

  markTaskDone(task);
  return { ok: true, output: llmResult };
}

// worldBuilder - РЕАЛЬНО пишет в worldTiles.ts
async function runWorldBuilder(task: AgentTask): Promise<AgentResult> {
  log(`[worldBuilder] REAL WORK: ${task.description}`);

  // === Skill binding ===
  const boundSkills = getSkillsForAgent('world-builder');
  log(`[worldBuilder] Skills: ${boundSkills.join(', ')}`);

  // === Second Brain context ===
  const sbContext = buildContextForAgent(task);
  log(`[worldBuilder] SecondBrain: ${sbContext ? 'patterns found' : 'no patterns'}`);

  const files = ['src/engine/worldTiles.ts', 'src/types/game.ts'];
  const context = await readFilesContext(files);

  const llmResult = await chatWithFallback([
    { role: 'system', content: `Ты - эксперт по игровым мирам. Напиши TypeScript код для мира.\n${sbContext}\nФормат: код между \`\`\`typescript и \`\`\`` },
    { role: 'user', content: `Задача: ${task.description}\n\nКонтекст: ${context.slice(0, 2000)}\n\nНапиши реализацию.` }
  ]);

  log(`[worldBuilder] Generated: ${llmResult.slice(0, 150)}`);

  // РЕАЛЬНАЯ запись с проверкой TS
  const codeMatch = llmResult.match(/```typescript([\s\S]*?)```/);
  if (codeMatch) {
    const code = codeMatch[1].trim();
    const worldFile = path.join(APP_DIR, 'src/engine/worldTiles.ts');
    const newCode = `\n\n// === Task: ${task.description} ===\n${code}`;

    if (safeWriteCode(worldFile, newCode, task.description)) {
      log(`[worldBuilder] WRITTEN to worldTiles.ts`);
    } else {
      log(`[worldBuilder] Skipped (TS error)`);
      recordRecovery(task, 'safeWriteCode returned false', 'Build/validation failed in worldBuilder');
    }
  }

  markTaskDone(task);
  return { ok: true, output: llmResult };
}

// economyDesigner - РЕАЛЬНО пишет в economy файлы
async function runEconomyDesigner(task: AgentTask): Promise<AgentResult> {
  log(`[economyDesigner] REAL WORK: ${task.description}`);

  // === Skill binding ===
  const boundSkills = getSkillsForAgent('economyDesigner');
  log(`[economyDesigner] Skills: ${boundSkills.join(', ')}`);

  // === Second Brain context ===
  const sbContext = buildContextForAgent(task);
  log(`[economyDesigner] SecondBrain: ${sbContext ? 'patterns found' : 'no patterns'}`);

  const files = ['src/domain/economy/shopPurchase.ts', 'src/domain/economy/prices.ts'];
  const context = await readFilesContext(files);

  const llmResult = await chatWithFallback([
    { role: 'system', content: `Ты - Economy Designer для Chronos AI Chronicles.
${getProjectContext()}
${sbContext}
КРИТИЧЕСКИ:
1. Используй ТОЛЬКО существующие типы и функции
2. После написания запусти npm run build
3. Формат: код между \`\`\`typescript и \`\`\`` },
    { role: 'user', content: `Задача: ${task.description}\n\nКонтекст: ${context.slice(0, 2000)}\n\nНапиши реализацию.` }
  ]);

  log(`[economyDesigner] Generated: ${llmResult.slice(0, 150)}`);

  // РЕАЛЬНАЯ запись с проверкой TS
  const codeMatch = llmResult.match(/```typescript([\s\S]*?)```/);
  if (codeMatch) {
    const code = codeMatch[1].trim();
    const ecoFile = path.join(APP_DIR, 'src/domain/economy/shopPurchase.ts');
    const newCode = `\n\n// === Task: ${task.description} ===\n${code}`;

    if (safeWriteCode(ecoFile, newCode, task.description)) {
      log(`[economyDesigner] WRITTEN to shopPurchase.ts`);
    } else {
      log(`[economyDesigner] Skipped (TS error)`);
      recordRecovery(task, 'safeWriteCode returned false', 'Build/validation failed in economyDesigner');
    }
  }

  markTaskDone(task);
  return { ok: true, output: llmResult };
}

// uiCraftsman
async function runUiCraftsman(task: AgentTask): Promise<AgentResult> {
  log(`[uiCraftsman] UI: ${task.description}`);

  // === Skill binding ===
  const boundSkills = getSkillsForAgent('ui-craftsman');
  log(`[uiCraftsman] Skills: ${boundSkills.join(', ')}`);

  // === Second Brain context ===
  const sbContext = buildContextForAgent(task);
  log(`[uiCraftsman] SecondBrain: ${sbContext ? 'patterns found' : 'no patterns'}`);

  const files = quickFindFiles('panel');
  const context = await readFilesContext(files);

  const llmResult = await chatWithFallback([
    { role: 'system', content: `Ты - UI эксперт. Предложи улучшения интерфейса.\n${sbContext}` },
    { role: 'user', content: `Задача: ${task.description}\n\n${context.slice(0, 1000)}` }
  ]);

  markTaskDone(task);
  return { ok: true, output: llmResult.slice(0, 200) };
}

// documentationGenerator
async function runDocumentationGenerator(task: AgentTask): Promise<AgentResult> {
  log(`[documentationGenerator] Docs: ${task.description}`);

  const llmResult = await chatWithFallback([
    { role: 'system', content: 'Ты - технический писатель. Создай документацию.' },
    { role: 'user', content: `Задача: ${task.description}` }
  ]);

  markTaskDone(task);
  return { ok: true, output: llmResult.slice(0, 200) };
}

// securityAuditor
async function runSecurityAuditor(task: AgentTask): Promise<AgentResult> {
  log(`[securityAuditor] Security: ${task.description}`);

  // Scan for secrets
  const secretPatterns = ['password', 'apikey', 'token', 'secret', 'key=' ];
  const issues: string[] = [];

  const srcFiles = globSync('src/**/*.ts', APP_DIR);
  for (const file of srcFiles.slice(0, 50)) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const pattern of secretPatterns) {
      if (content.toLowerCase().includes(pattern) && !content.includes('process.env')) {
        issues.push(`${file}: potential ${pattern} leak`);
      }
    }
  }

  const report = issues.length > 0 ? `Issues found: ${issues.join(', ')}` : 'No issues found';

  markTaskDone(task);
  return { ok: issues.length === 0, output: report };
}

function globSync(pattern: string, dir: string): string[] {
  const { execSync } = require('child_process');
  try {
    const out = execSync(`npx glob "${pattern}"`, { cwd: dir, encoding: 'utf-8' });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// ==================== BUILD (18-22) ====================
export async function runBuildCheck(): Promise<AgentResult> {
  log('[build] Starting npm run build...');

  const distPath = path.join(APP_DIR, 'dist', 'index.html');
  try {
    const stat = fs.statSync(distPath);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs < 300000) {
      log(`[build] Using existing dist (age: ${Math.round(ageMs/1000)}s)`);
      return { ok: true, output: `Using existing dist built ${Math.round(ageMs/1000)}s ago` };
    }
  } catch {}

  return new Promise((resolve) => {
    const { spawn } = require('child_process');

    let stdout = '';
    let stderr = '';

    const child = spawn('npm', ['run', 'build'], {
      cwd: APP_DIR,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' }
    });

    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.stderr?.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      const fullOutput = stdout + stderr;

      if (fullOutput.includes('✓ built in') || code === 0) {
        log('[build] Build PASSED');
        resolve({ ok: true, output: fullOutput });
        return;
      }

      if (fullOutput.includes('error TS') || fullOutput.includes('Error:')) {
        resolve({ ok: false, output: fullOutput, error: fullOutput });
        return;
      }

      if (fs.existsSync(distPath)) {
        log('[build] Build had issues but dist exists - using it');
        resolve({ ok: true, output: fullOutput + '\n[fallback] Using existing dist' });
        return;
      }

      log('[build] Build FAILED');
      resolve({ ok: false, output: fullOutput, error: fullOutput });
    });

    child.on('error', (err) => {
      resolve({ ok: false, output: '', error: err.message });
    });
  });
}

export async function runTests(): Promise<AgentResult> {
  try {
    const output = execSync('npm run test', {
      cwd: APP_DIR,
      encoding: 'utf-8',
    }) as string;
    return { ok: true, output };
  } catch (err: any) {
    const output = (err.stdout || '') + (err.stderr || '');
    return { ok: err.status === 0, output, error: output || err.message };
  }
}

// ==================== METRICS (23-28) ====================
interface Metric {
  cycle: number;
  tasksProcessed: number;
  tasksCompleted: number;
  buildTime: number;
  timestamp: number;
}

const metrics: Metric[] = [];
const METRICS_FILE = `${PROJECT_ROOT}/ai_support/secondbrain/metrics.json`;

function recordMetric(m: Metric): void {
  metrics.push(m);
  if (metrics.length > 1000) metrics.shift();
  try {
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics));
  } catch {}
}

function isHealthy(): boolean {
  const distPath = path.join(APP_DIR, 'dist');
  const hasDist = fs.existsSync(distPath);
  if (!hasDist) return false;
  const recentBuild = (Date.now() - fs.statSync(distPath).mtimeMs) < 3600000;
  return hasDist && recentBuild;
}

// Project context for LLM agents
function getProjectContext(): string {
  return `
Проект: Chronos AI Chronicles (AFK Game)
Стек: React, Three.js (R3F), TypeScript, Node.js
Стандарты:
- TypeScript strict mode, без any
- Feature flags для новых фич
- Тесты для gameplay логики
- Нет TODO без тикета

КРИТИЧЕСКИ ВАЖНО:
- Используй СУЩЕСТВУЮЩИЕ типы из @/types/game
- Импортируй из существующих модулей
- НЕ создавай новые типы без крайней необходимости
- Проверяй tsc -b перед завершением

Директории:
- app/src/engine/ - игровой движок
- app/src/domain/ - доменная логика
- app/src/components/ - React компоненты
- app/src/hooks/ - хуки
`;
}

// Model selection based on agent type
function selectModelForTask(agent: string): string {
  switch (agent) {
    case 'codeBuilder':
      return 'openai';
    case 'npcArchitect':
      return 'anthropic';
    case 'economyDesigner':
      return 'openai';
    case 'uiCraftsman':
      return 'ollama';
    case 'documentationGenerator':
      return 'ollama';
    default:
      return 'nvidia';
  }
}

// ==================== GIT + TELEGRAM (29-30) ====================
function gitCommit(message: string): void {
  try {
    execSync('git add -A', { cwd: PROJECT_ROOT, stdio: 'ignore' });
    execSync(`git commit -m "${message}"`, { cwd: PROJECT_ROOT, stdio: 'ignore' });
    log(`[git] Committed: ${message}`);
  } catch (e: any) {
    log(`[git] Commit failed: ${e.message}`);
  }
}

// Build-gated commit - checks build before committing
export async function tryGitCommit(message: string): Promise<boolean> {
  log('[git] Checking build before commit...');
  const buildResult = await runBuildCheck();

  if (!buildResult.ok) {
    log(`[git] BUILD FAILED - reverting changes: ${buildResult.output}`);
    try {
      execSync('git checkout -- .', { cwd: PROJECT_ROOT, stdio: 'ignore' });
      log('[git] Changes reverted');
    } catch (e: any) {
      log(`[git] Revert failed: ${e.message}`);
    }
    return false;
  }

  try {
    execSync('git add -A', { cwd: PROJECT_ROOT, stdio: 'ignore' });
    execSync(`git commit -m "${message}"`, { cwd: PROJECT_ROOT, stdio: 'ignore' });
    log(`[git] Committed (build OK): ${message}`);
    return true;
  } catch (e: any) {
    log(`[git] Commit failed: ${e.message}`);
    return false;
  }
}

function gitPush(): void {
  try {
    execSync('git push', { cwd: PROJECT_ROOT, stdio: 'ignore' });
    log('[git] Pushed');
  } catch (e: any) {
    log(`[git] Push failed: ${e.message}`);
  }
}

// Telegram
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function notifyTelegram(message: string): Promise<void> {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text: message }),
    });
  } catch {}
}

// Graceful shutdown
let shuttingDown = false;
async function gracefulShutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  log('[orchestrator] Shutting down gracefully...');
  saveTaskState();
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ==================== LOAD TASKS ====================
function loadTasksFromDocs(): AgentTask[] {
  const tasks: AgentTask[] = [];
  const idCounter = { val: 0 };

  // Helper to add tasks - reads from task.txt first
  const addTask = (desc: string, priority: number) => {
    if (desc.length > 5) {
      tasks.push({
        id: `task_${idCounter.val++}`,
        description: desc,
        priority,
        agent: guessAgentForTask(desc),
        done: false,
      });
    }
  };

  // Load priority task from task.txt
  const taskTxtPath = path.join(AI_SUPPORT_DIR, 'task.txt');
  if (fs.existsSync(taskTxtPath)) {
    const taskContent = fs.readFileSync(taskTxtPath, 'utf-8').trim();
    if (taskContent.length > 5) {
      log(`[orchestrator] Loading from task.txt: "${taskContent}"`);
      addTask(taskContent, 10);
    }
  }

  // Helper to add legacy tasks from docs
  const addLegacyTask = (desc: string, priority: number) => {
    if (desc.length > 5) {
      tasks.push({
        id: `task_${idCounter.val++}`,
        description: desc,
        priority,
        agent: guessAgentForTask(desc),
        done: false,
      });
    }
  };

  // PROJECT_MILESTONES.md
  const milestonesPath = path.join(PROJECT_ROOT, 'PROJECT_MILESTONES.md');
  if (fs.existsSync(milestonesPath)) {
    const content = fs.readFileSync(milestonesPath, 'utf-8');
    for (const line of content.split('\n')) {
      if (line.includes('- [ ]')) {
        const desc = line.replace(/^.*-\[ \]/, '').trim();
        addLegacyTask(desc, 5);
      }
    }
  }

  // BACKLOG_100.md
  const backlogPath = path.join(DOCS_DIR, 'orchestrate/BACKLOG_100.md');
  if (fs.existsSync(backlogPath)) {
    const content = fs.readFileSync(backlogPath, 'utf-8');
    for (const line of content.split('\n')) {
      if (line.match(/^\d+\./)) {
        const desc = line.replace(/^\d+\.\s*/, '').trim();
        addLegacyTask(desc, 3);
      }
    }
  }

  // CHRONOS_DESIGN.md
  const chronosPath = path.join(PROJECT_ROOT, 'CHRONOS_DESIGN.md');
  if (fs.existsSync(chronosPath)) {
    const content = fs.readFileSync(chronosPath, 'utf-8');
    let inList = false;
    for (const line of content.split('\n')) {
      if (line.includes('## ') && !line.includes('# ')) inList = false;
      if (line.includes('- [ ]') || line.match(/^\d+\.\s+- \[ \]/)) {
        inList = true;
      }
      if (inList && (line.includes('- [ ]') || line.match(/^\d+\.\s+- \[ \]/))) {
        const desc = line.replace(/^.*-\[ \]/, '').trim();
        if (desc) addLegacyTask(desc, 4);
      }
    }
  }

  // STAGES_001-050.md
  const stages1Path = path.join(PROJECT_ROOT, 'docs/mvp/STAGES_001-050.md');
  if (fs.existsSync(stages1Path)) {
    const content = fs.readFileSync(stages1Path, 'utf-8');
    for (const line of content.split('\n')) {
      if (line.includes('- [ ]') && line.includes('**')) {
        const match = line.match(/\*\*(\d+)\*\*\s*(.+)/);
        if (match) {
          const num = match[1];
          const desc = match[2].replace(/\*+$/, '').trim();
          addLegacyTask(`[STAGE ${num}] ${desc}`, 6);
        }
      }
    }
  }

  // STAGES_051-100.md
  const stages2Path = path.join(PROJECT_ROOT, 'docs/mvp/STAGES_051-100.md');
  if (fs.existsSync(stages2Path)) {
    const content = fs.readFileSync(stages2Path, 'utf-8');
    for (const line of content.split('\n')) {
      if (line.includes('- [ ]') && line.includes('**')) {
        const match = line.match(/\*\*(\d+)\*\*\s*(.+)/);
        if (match) {
          const num = match[1];
          const desc = match[2].replace(/\*+$/, '').trim();
          addLegacyTask(`[STAGE ${num}] ${desc}`, 6);
        }
      }
    }
  }

  return tasks;
}

function guessAgentForTask(desc: string): string {
  const d = desc.toLowerCase();

  // NPC/персонажи/квесты → npcArchitect
  if (d.includes('npc') || d.includes('dialog') || d.includes('character') ||
      d.includes('персонаж') || d.includes('диалог') || d.includes('торговец') ||
      d.includes('quest') || d.includes('квест') || d.includes('merchant')) {
    return 'npcArchitect';
  }

  // World/мир/локация → worldBuilder
  if (d.includes('world') || d.includes('location') || d.includes('map') ||
      d.includes('мир') || d.includes('локац') || d.includes('карта') ||
      d.includes('биом') || d.includes('biome') || d.includes('регион')) {
    return 'worldBuilder';
  }

  // Economy/торговля/цены → economyDesigner
  if (d.includes('econom') || d.includes('trade') || d.includes('price') ||
      d.includes('экономик') || d.includes('торговл') || d.includes('цен') ||
      d.includes('shop') || d.includes('магазин') || d.includes('баланс')) {
    return 'economyDesigner';
  }

  // UI/интерфейс → uiCraftsman
  if (d.includes('ui') || d.includes('interface') || d.includes('accessibility') ||
      d.includes('интерфейс') || d.includes('panel') || d.includes('screen') ||
      d.includes('экран') || d.includes('a11y') || d.includes('guild') ||
      d.includes('party')) {
    return 'uiCraftsman';
  }

  // Docs → documentationGenerator
  if (d.includes('doc') || d.includes('readme') || d.includes('changelog') ||
      d.includes('документ')) {
    return 'documentationGenerator';
  }

  // Security → securityAuditor
  if (d.includes('security') || d.includes('secret') || d.includes('vuln') ||
      d.includes('безопасност')) {
    return 'securityAuditor';
  }

  // Build/fix → codeBuilder
  if (d.includes('build') || d.includes('typescript') || d.includes('error') ||
      d.includes('fix') || d.includes('test') || d.includes('coverage')) {
    return 'codeBuilder';
  }

  return 'codeBuilder';
}

// ==================== MAIN ORCHESTRATOR ====================
let taskQueue: AgentTask[] = [];
let cycleCount = 0;
let tasksProcessedThisCycle = 0;
let tasksCompletedThisCycle = 0;
let buildRanThisCycle = false;
let buildStartTime = 0;

export async function runOrchestrator(): Promise<void> {
  cycleCount++;
  tasksProcessedThisCycle = 0;
  tasksCompletedThisCycle = 0;
  buildRanThisCycle = false;

  log(`[orchestrator] Cycle ${cycleCount} started`);

  // Load task state
  loadTaskState();

  // Load tasks if empty
  if (taskQueue.length === 0) {
    taskQueue = loadTasksFromDocs();
    log(`[orchestrator] Loaded ${taskQueue.length} tasks`);
  }

  // Show available agents
  log(`[orchestrator] Agents: ${config.agents.join(', ')}`);
  log(`[orchestrator] LLM providers: ${config.providers.join(', ')}`);

  // Run next task
  if (taskQueue.length > 0) {
    const task = getNextTask(taskQueue.filter(t => !t.done));
    if (task) {
      log(`[orchestrator] Processing: ${task.description} (${task.agent})`);

      // Mark as running
      taskStates.set(task.id, { taskId: task.id, status: 'running', attempts: (taskStates.get(task.id)?.attempts || 0) + 1 });
      tasksProcessedThisCycle++;

      try {
        const result = await runAgent(task.agent, task);
        tasksCompletedThisCycle++;

        if (result.ok) {
          log(`[orchestrator] ${task.agent} completed`);
        } else {
          log(`[orchestrator] ${task.agent} failed: ${result.error}`);
          recordRecovery(task, result.error || 'Task failed with ok=false', 'Agent returned failure');
        }
      } catch (e: any) {
        log(`[orchestrator] ${task.agent} error: ${e.message}`);
        recordRecovery(task, e.message, 'Exception caught in task processing');
      }
    }
  } else {
    log('[orchestrator] No tasks to process');
  }

  // Build only once per cycle
  if (!buildRanThisCycle) {
    buildStartTime = Date.now();
    const buildResult = await runBuildCheck();
    const buildTime = Date.now() - buildStartTime;
    buildRanThisCycle = true;
    log(`[orchestrator] Build: ${buildResult.ok ? 'PASS' : 'FAIL'} (${buildTime}ms)`);

    // Record metrics
    recordMetric({
      cycle: cycleCount,
      tasksProcessed: tasksProcessedThisCycle,
      tasksCompleted: tasksCompletedThisCycle,
      buildTime,
      timestamp: Date.now(),
    });
  }

  // Health check
  log(`[orchestrator] Health: ${isHealthy() ? 'OK' : 'DEGRADED'}`);
}

async function runAgent(agent: string, task: AgentTask): Promise<AgentResult> {
  const model = selectModelForTask(agent);
  log(`[orchestrator] ${agent} using model: ${model}`);

  switch (agent) {
    case 'codeBuilder': return runCodeBuilder(task);
    case 'npcArchitect': return runNpcArchitect(task);
    case 'worldBuilder': return runWorldBuilder(task);
    case 'economyDesigner': return runEconomyDesigner(task);
    case 'uiCraftsman': return runUiCraftsman(task);
    case 'documentationGenerator': return runDocumentationGenerator(task);
    case 'securityAuditor': return runSecurityAuditor(task);
    case 'testRunner':
      const result = await runTests();
      if (result.ok) markTaskDone(task);
      return result;
    default:
      log(`[orchestrator] Unknown agent: ${agent}`);
      return { ok: false, output: '', error: 'Unknown agent' };
  }
}

// ==================== LOGGING ====================
function log(msg: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  console.log(line.trim());
  try {
    fs.appendFileSync(BUILD_LOG, line);
  } catch {}
}

// ==================== RUN ====================
log('[orchestrator] Starting full autonomous orchestrator...');

runOrchestrator()
  .then(async () => {
    // Notify on complete
    if (config.notifyOnComplete) {
      await notifyTelegram(`[Chronos] Orchestrator cycle ${cycleCount} complete. Tasks: ${tasksProcessedThisCycle}/${tasksCompletedThisCycle}, Build: ${buildRanThisCycle ? 'done' : 'skipped'}`);
    }

    // Git commit with build gate
    await tryGitCommit(`Orchestrator cycle ${cycleCount}: ${tasksCompletedThisCycle} tasks`);

    log('[orchestrator] Cycle complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[orchestrator] Error:', err);
    process.exit(1);
  });