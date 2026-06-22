// ai_support/llm_brain.ts - LLM Brain System with 40+ Agents
import fs from 'fs';

const BRAIN_HOME = 'c:/Users/Den/Downloads/AFK Game/ai_support/secondbrain';

// ==================== LLM REGISTRY ====================
interface LLMEndpoint {
  id: string;
  name: string;
  provider: string;
  model: string;
  strengths: string[];
  maxTokens: number;
  speed: 'fast' | 'medium' | 'slow';
  cost: number;
  available: boolean;
}

const LLM_REGISTRY: LLMEndpoint[] = [
  { id: 'nemotron', name: 'Nemotron 3 Nano', provider: 'nvidia', model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    strengths: ['code', 'reasoning', 'analysis'], maxTokens: 4096, speed: 'fast', cost: 0, available: true },
  { id: 'deepseek', name: 'DeepSeek V4 Pro', provider: 'nvidia', model: 'deepseek-ai/deepseek-v4-pro',
    strengths: ['math', 'logic', 'code'], maxTokens: 4096, speed: 'medium', cost: 0, available: true },
  { id: 'llama3', name: 'Llama 3 8B', provider: 'ollama', model: 'llama3',
    strengths: ['general', 'english'], maxTokens: 8192, speed: 'slow', cost: 0, available: true },
  { id: 'qwen', name: 'Qwen 2.5 7B', provider: 'ollama', model: 'qwen2.5:7b',
    strengths: ['code', 'reasoning'], maxTokens: 8192, speed: 'slow', cost: 0, available: true },
  { id: 'yandex', name: 'Gemini 2.0 Flash', provider: 'yandex', model: 'gpt://b1/gemini-2.0-flash-exp',
    strengths: ['fast', 'multimodal'], maxTokens: 512, speed: 'fast', cost: 0.6, available: true },
  { id: 'hf', name: 'Llama HF', provider: 'hf', model: 'meta-llama/Llama-3.1-8B-Instruct',
    strengths: ['general'], maxTokens: 256, speed: 'fast', cost: 0, available: true },
  { id: 'gpt4o', name: 'GPT-4o', provider: 'openai', model: 'gpt-4o',
    strengths: ['code', 'creative'], maxTokens: 4096, speed: 'medium', cost: 2.5, available: false },
  { id: 'gpt4o-mini', name: 'GPT-4o-mini', provider: 'openai', model: 'gpt-4o-mini',
    strengths: ['fast', 'cheap'], maxTokens: 4096, speed: 'fast', cost: 0.075, available: false },
  { id: 'claude-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', model: 'claude-3-5-sonnet-20240613',
    strengths: ['code', 'analysis', 'creative'], maxTokens: 8192, speed: 'medium', cost: 3, available: false },
  { id: 'claude-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', model: 'claude-3-haiku-20240307',
    strengths: ['fast', 'simple'], maxTokens: 1024, speed: 'fast', cost: 0.075, available: false },
  { id: 'lm-local', name: 'LM Studio Local', provider: 'lmstudio', model: 'local-model',
    strengths: ['local', 'privacy'], maxTokens: 4096, speed: 'slow', cost: 0, available: true },
  { id: 'qwen2', name: 'Qwen 2.5 Coder', provider: 'ollama', model: 'qwen2.5-coder:7b',
    strengths: ['code', 'reasoning'], maxTokens: 8192, speed: 'slow', cost: 0, available: true },
];

// ==================== API KEYS GENERATION ====================
function generateApiKeys() {
  const keys: Record<string, string> = {
    yandex: process.env.YANDEX_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    huggingface: process.env.HF_TOKEN || '',
  };
  return keys;
}

// ==================== FREE HF INFERENCE MODELS ====================
// Free models available without API key (rate limited)
const FREE_HF_MODELS = [
  'meta-llama/Llama-3.1-8B-Instruct',
  'Qwen/Qwen2-7B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.2',
  'google/gemma-2-9b-it',
  'bigcode/starcoder2-7b',
];

// ==================== CHAT FUNCTIONS ====================
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chatOllama(model: string, messages: ChatMessage[]): Promise<string | null> {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false })
    });
    const data = await response.json();
    return data.message?.content || null;
  } catch { return null; }
}

async function chatHF(model: string, messages: ChatMessage[]): Promise<string | null> {
  const apiKey = process.env.HF_TOKEN;
  if (!apiKey) return null;
  const prompt = messages.map(m => m.role + ': ' + m.content).join('\n') + '\nAssistant:';
  try {
    const response = await fetch('https://api-inference.huggingface.co/' + model, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 256 } })
    });
    const data = await response.json();
    return data[0]?.generated_text?.replace(prompt, '').trim() || null;
  } catch { return null; }
}

// Free HF Inference API (serverless, rate limited)
async function chatHFServerless(model: string, messages: ChatMessage[]): Promise<string | null> {
  const prompt = messages.map(m => m.role + ': ' + m.content).join('\n');
  try {
    // Use v1/chat/completions endpoint (OpenAI-compatible)
    const response = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 256,
        temperature: 0.7
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.choices?.[0]?.text || null;
  } catch { return null; }
}

async function chatYandex(model: string, messages: ChatMessage[]): Promise<string | null> {
  const apiKey = process.env.YANDEX_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch('https://llm.api.cloud.yandex.net/v1/chats', {
      method: 'POST',
      headers: { 'Authorization': 'Api-Key ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelUri: model,
        messages: messages.map(m => ({ role: m.role, text: m.content }))
      })
    });
    const data = await response.json();
    return data.result?.alternatives?.[0]?.message?.text || null;
  } catch { return null; }
}

async function chatAnthropic(model: string, messages: ChatMessage[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const systemMsg = messages.find(m => m.role === 'system');
  const otherMsgs = messages.filter(m => m.role !== 'system');
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, system: systemMsg?.content, messages: otherMsgs, max_tokens: 1024 })
    });
    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch { return null; }
}

async function chatOpenAI(model: string, messages: ChatMessage[]): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.7 })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

async function chatLmStudio(model: string, messages: ChatMessage[]): Promise<string | null> {
  try {
    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'local-model', messages, temperature: 0.7 })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

// Main chat function
async function chatWithLLM(llmId: string, messages: ChatMessage[]): Promise<string | null> {
  const llm = LLM_REGISTRY.find(l => l.id === llmId);
  if (!llm || !llm.available) return null;

  // Try providers based on availability
  if (llmId === 'llama3' || llmId === 'qwen' || llmId === 'qwen2' || llmId === 'mistral') {
    return await chatOllama(llm.model, messages);
  }
  if (llmId === 'hf') {
    return await chatHF(llm.model, messages);
  }
  if (llmId === 'yandex') {
    return await chatYandex(llm.model, messages);
  }
  if (llmId === 'claude-sonnet' || llmId === 'claude-haiku') {
    return await chatAnthropic(llm.model, messages);
  }
  if (llmId === 'gpt4o' || llmId === 'gpt4o-mini') {
    return await chatOpenAI(llm.model, messages);
  }
  if (llmId === 'lm-local') {
    return await chatLmStudio(llm.model, messages);
  }
  // Fallback to Ollama for nvidia models
  return await chatOllama('llama3.1:8b', messages);
}

// ==================== BRAIN HOME FUNCTIONS ====================
function loadRules() {
  const f = BRAIN_HOME + '/brain_rules.json';
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : { patterns: {}, rules: {}, learned: {} };
}

function saveRules(rules: any) {
  fs.writeFileSync(BRAIN_HOME + '/brain_rules.json', JSON.stringify(rules, null, 2));
}

function loadTaskHistory() {
  const f = BRAIN_HOME + '/task_history.json';
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : [];
}

function saveTaskResult(task: string, result: any, agent: string, llm: string) {
  const history = loadTaskHistory();
  history.push({ task, agent, llm, result, timestamp: Date.now() });
  fs.writeFileSync(BRAIN_HOME + '/task_history.json', JSON.stringify(history.slice(-1000), null, 2));
}

function loadStats() {
  const f = BRAIN_HOME + '/agent_stats.json';
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : {};
}

function updateStats(agentId: string, status: string) {
  const stats = loadStats();
  if (!stats[agentId]) stats[agentId] = { success: 0, fail: 0 };
  stats[agentId][status]++;
  fs.writeFileSync(BRAIN_HOME + '/agent_stats.json', JSON.stringify(stats, null, 2));
}

function loadState() {
  const f = BRAIN_HOME + '/state.json';
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : { active: false, lastTask: null };
}

function saveState(state: any) {
  fs.writeFileSync(BRAIN_HOME + '/state.json', JSON.stringify(state, null, 2));
}

function loadMemory() {
  const f = BRAIN_HOME + '/memory.json';
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : { shortTerm: [], longTerm: [] };
}

function saveMemory(memory: any) {
  fs.writeFileSync(BRAIN_HOME + '/memory.json', JSON.stringify(memory, null, 2));
}

async function applyImprovements(analysis: string) {
  const rulesMatch = analysis.match(/RULE:(.*)/g);
  if (rulesMatch) {
    const rules = loadRules();
    for (const rule of rulesMatch) {
      const [name, value] = rule.replace('RULE:', '').split('=');
      if (name && value) rules.rules[name.trim()] = value.trim();
    }
    saveRules(rules);
    log('[selfAnalyzer] Applied ' + rulesMatch.length + ' rules');
  }
}

// ==================== AGENTS ====================
const AGENTS = {
  // === Layer 1: Base (15 agents) - using local Ollama models ===
  codeBuilder: async (task: string) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: task }]);
    updateStats('codeBuilder', result ? 'success' : 'fail');
    return { agent: 'codeBuilder', result, llm: 'qwen2' };
  },
  codeReviewer: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Review code: ' + task }]);
    updateStats('codeReviewer', result ? 'success' : 'fail');
    return { agent: 'codeReviewer', result, llm: 'llama3' };
  },
  npcArchitect: async (task: string) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Create NPC: ' + task }]);
    updateStats('npcArchitect', result ? 'success' : 'fail');
    return { agent: 'npcArchitect', result, llm: 'qwen2' };
  },
  npcPsychologist: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'NPC psychology: ' + task }]);
    updateStats('npcPsychologist', result ? 'success' : 'fail');
    return { agent: 'npcPsychologist', result, llm: 'llama3' };
  },
  worldBuilder: async (task: string) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Build world: ' + task }]);
    updateStats('worldBuilder', result ? 'success' : 'fail');
    return { agent: 'worldBuilder', result, llm: 'qwen2' };
  },
  worldManager: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Manage world: ' + task }]);
    updateStats('worldManager', result ? 'success' : 'fail');
    return { agent: 'worldManager', result, llm: 'llama3' };
  },
  economyDesigner: async (task: string) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Design economy: ' + task }]);
    updateStats('economyDesigner', result ? 'success' : 'fail');
    return { agent: 'economyDesigner', result, llm: 'qwen2' };
  },
  traderEngine: async (task: string) => {
    const result = await chatWithLLM('qwen', [{ role: 'user', content: 'Trade: ' + task }]);
    updateStats('traderEngine', result ? 'success' : 'fail');
    return { agent: 'traderEngine', result, llm: 'qwen' };
  },
  combatEngine: async (task: string) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Combat: ' + task }]);
    updateStats('combatEngine', result ? 'success' : 'fail');
    return { agent: 'combatEngine', result, llm: 'qwen2' };
  },
  questGiver: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Quest: ' + task }]);
    updateStats('questGiver', result ? 'success' : 'fail');
    return { agent: 'questGiver', result, llm: 'llama3' };
  },
  dialogueMaster: async (task: string) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Dialogue: ' + task }]);
    updateStats('dialogueMaster', result ? 'success' : 'fail');
    return { agent: 'dialogueMaster', result, llm: 'qwen2' };
  },
  uiCraftsman: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'UI: ' + task }]);
    updateStats('uiCraftsman', result ? 'success' : 'fail');
    return { agent: 'uiCraftsman', result, llm: 'llama3' };
  },
  securityAuditor: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Security audit: ' + task }]);
    updateStats('securityAuditor', result ? 'success' : 'fail');
    return { agent: 'securityAuditor', result, llm: 'llama3' };
  },
  testEngine: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Test: ' + task }]);
    updateStats('testEngine', result ? 'success' : 'fail');
    return { agent: 'testEngine', result, llm: 'llama3' };
  },
  docsWriter: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Docs: ' + task }]);
    updateStats('docsWriter', result ? 'success' : 'fail');
    return { agent: 'docsWriter', result, llm: 'llama3' };
  },

  // === Layer 2: Meta (8 agents) - using local models ===
  metaArchitect: async (task: string) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Architecture: ' + task }]);
    return { agent: 'metaArchitect', result, llm: 'qwen2' };
  },
  ruleOptimizer: async (task: string) => {
    const rules = loadRules();
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Optimize rules: ' + JSON.stringify(rules.rules) + ' for ' + task }]);
    return { agent: 'ruleOptimizer', result, llm: 'llama3' };
  },
  conceptRefiner: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Refine concept: ' + task }]);
    return { agent: 'conceptRefiner', result, llm: 'llama3' };
  },
  promptTuner: async (task: string) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Tune prompt: ' + task }]);
    return { agent: 'promptTuner', result, llm: 'qwen2' };
  },
  performanceMonitor: async () => {
    const stats = loadStats();
    return { agent: 'performanceMonitor', result: stats };
  },
  qualityGate: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Quality check: ' + task }]);
    return { agent: 'qualityGate', result, llm: 'llama3' };
  },
  costOptimizer: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Optimize cost: ' + task }]);
    return { agent: 'costOptimizer', result, llm: 'llama3' };
  },
  fallbackManager: async (task: string) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Fallback strategy: ' + task }]);
    return { agent: 'fallbackManager', result, llm: 'qwen2' };
  },

  // === Layer 3: Self-Improvement (6 agents) ===
  selfAnalyzer: async () => {
    const history = loadTaskHistory().slice(-50);
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Analyze last 50 tasks: ' + JSON.stringify(history) }]);
    if (result?.includes('IMPROVE:')) await applyImprovements(result);
    return { agent: 'selfAnalyzer', result };
  },
  strategyPicker: async (task: string) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Pick strategy for: ' + task }]);
    return { agent: 'strategyPicker', result };
  },
  priorityAgent: async (tasks: string[]) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Prioritize: ' + JSON.stringify(tasks) }]);
    return { agent: 'priorityAgent', result };
  },
  learningAgent: async () => {
    const stats = loadStats();
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Learn from stats: ' + JSON.stringify(stats) }]);
    return { agent: 'learningAgent', result };
  },
  adaptationAgent: async (userPrefs: any) => {
    const result = await chatWithLLM('llama3', [{ role: 'user', content: 'Adapt: ' + JSON.stringify(userPrefs) }]);
    return { agent: 'adaptationAgent', result };
  },
  evolutionAgent: async () => {
    const state = loadState();
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Evolve system. Current state: ' + JSON.stringify(state) }]);
    return { agent: 'evolutionAgent', result };
  },

  // === Layer 4: Integration (5 agents) ===
  director: async (task: string) => {
    log('[director] Analyzing: ' + task);
    // Simple decomposition - in real impl would use LLM
    const agents = selectBestAgents(task);
    const results = [];
    for (const agentName of agents) {
      const result = await AGENTS[agentName](task);
      results.push(result);
    }
    return { agent: 'director', results };
  },
  consensus: async (results: any[]) => {
    const result = await chatWithLLM('qwen2', [{ role: 'user', content: 'Synthesize: ' + JSON.stringify(results) }]);
    return { agent: 'consensus', result };
  },
  validator: async (task: string, result: any) => {
    const isValid = await chatWithLLM('llama3', [{ role: 'user', content: 'Validate: ' + task + ' -> ' + JSON.stringify(result) }]);
    return { agent: 'validator', isValid: isValid?.includes('VALID') || isValid?.includes('OK') };
  },
  orchestrator: async (tasks: string[]) => {
    const results = [];
    for (const task of tasks) {
      const agent = selectBestAgent(task);
      const result = await (AGENTS as any)[agent](task);
      results.push(result);
    }
    return { agent: 'orchestrator', results };
  },
  healthMonitor: async () => {
    const stats = loadStats();
    let totalSuccess = 0, totalFail = 0;
    for (const agent of Object.values(stats) as any[]) {
      totalSuccess += agent.success || 0;
      totalFail += agent.fail || 0;
    }
    const failRate = totalFail / (totalSuccess + totalFail) || 0;
    return { agent: 'healthMonitor', isHealthy: failRate < 0.2, stats, failRate };
  },

  // === Layer 5: Autonomy (5 agents) ===
  autonomousRunner: async (task: string) => {
    log('[autonomous] Starting: ' + task);
    const result = await AGENTS.director(task);
    saveTaskResult(task, result, 'director', 'mixed');
    log('[autonomous] Done');
    return result;
  },
  selfHealer: async () => {
    const health = await AGENTS.healthMonitor();
    if (!health.isHealthy) {
      log('[selfHealer] Issues detected, optimizing...');
      await AGENTS.ruleOptimizer('fix failures');
    }
  },
  selfDeployer: async (changes: string) => {
    log('[selfDeployer] Would commit: ' + changes);
    return { agent: 'selfDeployer', done: true };
  },
  selfTester: async () => {
    log('[selfTester] Would run tests');
    return { agent: 'selfTester', done: true };
  },
  selfReporter: async () => {
    const stats = loadStats();
    const lines = ['=== BRAIN REPORT ===', 'Agents: ' + Object.keys(stats).length];
    for (const [agent, s] of Object.entries(stats) as any[]) {
      lines.push(agent + ': s=' + s.success + ' f=' + s.fail);
    }
    return { agent: 'selfReporter', report: lines.join('\n') };
  },
};

// Helper functions
function selectBestAgent(task: string): string {
  const t = task.toLowerCase();
  if (t.includes('code') || t.includes('код')) return 'codeBuilder';
  if (t.includes('npc') || t.includes('персонаж')) return 'npcArchitect';
  if (t.includes('world') || t.includes('мир')) return 'worldBuilder';
  if (t.includes('trade') || t.includes('торгов')) return 'traderEngine';
  if (t.includes('combat') || t.includes('бой')) return 'combatEngine';
  if (t.includes('economy') || t.includes('экономик')) return 'economyDesigner';
  return 'codeBuilder';
}

function selectBestAgents(task: string): string[] {
  const t = task.toLowerCase();
  const agents: string[] = [];
  if (t.includes('code') || t.includes('код') || t.includes('game')) agents.push('codeBuilder', 'worldBuilder', 'npcArchitect');
  else if (t.includes('npc') || t.includes('персонаж')) agents.push('npcArchitect', 'dialogueMaster');
  else if (t.includes('world') || t.includes('мир')) agents.push('worldBuilder', 'economyDesigner');
  else agents.push('codeBuilder');
  return agents;
}

function log(msg: string) {
  console.log(msg);
}

// ==================== ROUTER ====================
function selectLLM(task: string) {
  const t = task.toLowerCase();
  if (t.includes('code') || t.includes('код')) return 'qwen2';
  if (t.includes('npc') || t.includes('диалог') || t.includes('dialogue')) return 'qwen2';
  if (t.includes('world') || t.includes('мир')) return 'llama3';
  return 'llama3';
}

// ==================== MAIN ====================
const cmd = process.argv[2] || 'status';
const arg = process.argv[3] || '';

log('=== LLM BRAIN SYSTEM ===');
log('Total LLMs: ' + LLM_REGISTRY.filter(l => l.available).length);
log('Free: ' + LLM_REGISTRY.filter(l => l.available && l.cost === 0).length);

if (cmd === 'status') {
  const stats = loadStats();
  const history = loadTaskHistory();
  const state = loadState();
  log('');
  log('History: ' + history.length + ' tasks');
  log('Stats: ' + Object.keys(stats).length + ' agents');
  log('State: ' + (state.active ? 'active' : 'idle'));
  log('Layers: ' + Object.keys(AGENTS).length + ' agents');
}

if (cmd === 'run' && arg) {
  (async () => {
    log('');
    log('[run] Task: ' + arg);
    const result = await AGENTS.autonomousRunner(arg);
    log('[run] Result: ' + JSON.stringify(result).slice(0, 200));
  })();
}

if (cmd === 'keys' || cmd === 'api') {
  const keys = generateApiKeys();
  log('');
  log('=== API Keys ===');
  log('OpenAI: ' + (keys.openai ? 'configured' : 'missing'));
  log('Anthropic: ' + (keys.anthropic ? 'configured' : 'missing'));
  log('Yandex: ' + (keys.yandex ? 'configured' : 'missing'));
  log('HuggingFace: ' + (keys.huggingface ? 'configured (' + keys.huggingface.slice(0,8) + '...)' : 'missing'));
  log('');
  log('=== Free HF Models ===');
  for (const m of FREE_HF_MODELS) log('  - ' + m);
}

if (cmd === 'history') {
  const history = loadTaskHistory();
  log('');
  log('=== Task History (' + history.length + ') ===');
  for (const h of history.slice(-10)) {
    log('  ' + h.agent + ': ' + h.task.slice(0, 50));
  }
}

if (cmd === 'improve') {
  (async () => {
    log('');
    log('[improve] Running self-analysis...');
    const result = await AGENTS.selfAnalyzer();
    log('[improve] Result: ' + (result.result || 'done').slice(0, 200));
  })();
}

if (cmd === 'test') {
  (async () => {
    log('');
    log('[test] Testing agents...');
    const test = 'Create a simple shop NPC';
    const result = await AGENTS.npcArchitect(test);
    log('[test] npcArchitect: ' + (result.result || 'no response').slice(0, 100));
  })();
}

if (cmd === 'agents') {
  log('');
  log('=== Agents by Layer ===');
  log('Layer 1 (Base): codeBuilder, npcArchitect, worldBuilder, economyDesigner...');
  log('Layer 2 (Meta): metaArchitect, ruleOptimizer, promptTuner...');
  log('Layer 3 (Self): selfAnalyzer, strategyPicker, learningAgent...');
  log('Layer 4 (Int): director, consensus, validator...');
  log('Layer 5 (Auto): autonomousRunner, selfHealer, selfReporter...');
}

log('');
log('OK');

// Export for other modules
export { LLM_REGISTRY, AGENTS, chatWithLLM, loadRules, loadTaskHistory, loadStats, loadState };