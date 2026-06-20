// ai_support/llm.js — LLM client: Ollama (local), Groq/OpenRouter (cloud).

export function getLLMConfig() {
  if (process.env.USE_GROQ === '1') {
    return {
      provider: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.1-8b-instant',
      apiKey: process.env.GROQ_API_KEY || '',
    };
  }
  if (process.env.USE_OPENROUTER === '1') {
    return {
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-3.1-8b-instruct',
      apiKey: process.env.OPENROUTER_API_KEY || '',
    };
  }
  return {
    provider: 'ollama',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  };
}

export async function chat(opts) {
  const cfg = getLLMConfig();
  const messages = opts.messages || [];

  try {
    if (cfg.provider === 'ollama') {
      const res = await fetch(`${cfg.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 512,
        }),
      });
      const json = await res.json();
      return { content: json.message?.content || '', finishReason: json.done ? 'stop' : 'error' };
    }

    if (cfg.provider === 'groq') {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 512,
        }),
      });
      const json = await res.json();
      return { content: json.choices?.[0]?.message?.content || '', finishReason: json.choices?.[0]?.finish_reason || 'error' };
    }

    if (cfg.provider === 'openrouter') {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
          'HTTP-Referer': 'https://chronos-game.local',
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 512,
        }),
      });
      const json = await res.json();
      return { content: json.choices?.[0]?.message?.content || '', finishReason: json.choices?.[0]?.finish_reason || 'error' };
    }
  } catch (e) {
    console.warn('[ai_support/llm] chat error:', e);
    return null;
  }
  return null;
}