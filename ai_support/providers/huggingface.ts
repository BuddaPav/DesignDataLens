// ai_support/providers/huggingface.ts - HuggingFace Inference API client
// Uses the HF_TOKEN from environment

export interface HFMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface HFChatOptions {
  messages: HFMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface HFResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'error';
}

// Use OpenAI-compatible endpoint
const HF_API_BASE = 'https://api-inference.huggingface.co/OpenAssistant/oasst-sft-4-llama-70b';

export async function chatHF(opts: HFChatOptions): Promise<HFResponse | null> {
  const apiKey = process.env.HF_TOKEN;

  if (!apiKey || apiKey === 'hf_') {
    console.log('[HF] No API key configured');
    return null;
  }

  // Use a smaller model that works better with free tier
  const url = 'https://api-inference.huggingface.co/meta-llama/Llama-3.1-8B-Instruct';

  // Convert messages to chat format
  const systemMsg = opts.messages.find(m => m.role === 'system');
  const recentMsgs = opts.messages.filter(m => m.role !== 'system').slice(-6);

  let prompt = '';
  if (systemMsg) {
    prompt += `System: ${systemMsg.content}\n\n`;
  }
  for (const msg of recentMsgs) {
    prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
  }
  prompt += 'Assistant:';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: opts.maxTokens || 256,
          temperature: opts.temperature || 0.7,
          return_full_text: false,
        },
      }),
    }).catch((err) => {
      console.log(`[HF] Network error: ${err.message}`);
      throw err;
    });

    if (!response.ok) {
      const err = await response.text();
      console.log(`[HF] API error: ${response.status} ${err}`);
      return null;
    }

    const data = await response.json() as any;

    // Parse response
    let content = '';
    if (Array.isArray(data)) {
      content = data[0]?.generated_text || '';
    } else if (data.generated_text) {
      content = data.generated_text;
    }

    // Clean - remove the prompt if echoed
    if (content.startsWith(prompt.replace('Assistant:', '').trim())) {
      content = content.slice(prompt.length).trim();
    }

    return {
      content: content.trim(),
      finishReason: content ? 'stop' : 'error',
    };
  } catch (err: any) {
    console.log(`[HF] Request error: ${err.message}`);
    return null;
  }
}

// Simple text completion fallback
export async function completeHF(prompt: string, maxTokens = 256): Promise<string | null> {
  const result = await chatHF({
    messages: [{ role: 'user', content: prompt }],
    maxTokens,
  });
  return result?.content || null;
}