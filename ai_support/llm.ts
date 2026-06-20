// ai_support/llm.ts — LLM client: Ollama (local), Groq/OpenRouter (cloud free).

export type LLMProvider = 'ollama' | 'groq' | 'openrouter';

interface LLMConfig {
  provider: LLMProvider;
  baseUrl?: string;
  model: string;
  apiKey?: string;
}

// Дефолт: Ollama local (слабое железо — приоритет)
const DEFAULT_CONFIG: LLMConfig = {
  provider: 'ollama',
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
};

export function getLLMConfig(): LLMConfig {
  // Groq бесплатный тир, если Ollama недоступен
  if (process.env.USE_GROQ === '1') {
    return {
      provider: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.1-8b-instant',
      apiKey: process.env.GROQ_API_KEY || '',
    };
  }
  // OpenRouter fallback
  if (process.env.USE_OPENROUTER === '1') {
    return {
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-3.1-8b-instruct',
      apiKey: process.env.OPENROUTER_API_KEY || '',
    };
  }
  return DEFAULT_CONFIG;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'error';
}

export async function chat(opts: ChatOptions): Promise<LLMResponse | null> {
  const cfg = getLLMConfig();
  const { chatOllama, chatGroq, chatOpenRouter } = await import('./providers/' + cfg.provider + '.js').catch(() => null);

  const providerFn = cfg.provider === 'ollama' ? chatOllama
    : cfg.provider === 'groq' ? chatGroq
    : chatOpenRouter;

  if (!providerFn) return null;

  try {
    return await providerFn(cfg, opts);
  } catch (e) {
    console.warn('[ai_support/llm] chat failed:', e);
    return null;
  }
}

// Provider implementations lazy-load
async function chatOllama(cfg: LLMConfig, opts: ChatOptions): Promise<LLMResponse> {
  const res = await fetch(`${cfg.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 512,
    }),
  });
  const json = await res.json();
  return { content: json.message?.content || '', finishReason: json.done ? 'stop' : 'error' };
}

async function chatGroq(cfg: LLMConfig, opts: ChatOptions): Promise<LLMResponse> {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 512,
    }),
  });
  const json = await res.json();
  return { content: json.choices?.[0]?.message?.content || '', finishReason: json.choices?.[0]?.finish_reason || 'error' };
}

async function chatOpenRouter(cfg: LLMConfig, opts: ChatOptions): Promise<LLMResponse> {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`,
      'HTTP-Referer': 'https://chronos-game.local',
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 512,
    }),
  });
  const json = await res.json();
  return { content: json.choices?.[0]?.message?.content || '', finishReason: json.choices?.[0]?.finish_reason || 'error' };
}