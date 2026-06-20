// Secure API Configuration
// Keys encrypted with project secret - DO NOT commit unencrypted

export interface APIKeys {
  huggingface?: string;
  telegram?: string;
  yandex?: string;
  openai?: string;
  anthropic?: string;
}

// In production, load from encrypted environment or secret vault
// For local dev, use process.env with fallback
export const apiKeys: APIKeys = {
  huggingface: process.env.HF_TOKEN || 'hf_',
  telegram: process.env.TELEGRAM_BOT_TOKEN || '',
  yandex: process.env.YANDEX_API_KEY || 'sk-or-v1-',
  openai: process.env.OPENAI_API_KEY || '',
  anthropic: process.env.ANTHROPIC_API_KEY || ''
};

export function getAPIKey(provider: keyof APIKeys): string | undefined {
  return apiKeys[provider];
}

export function hasAPIKey(provider: keyof APIKeys): boolean {
  const key = apiKeys[provider];
  return !!key && key.length > 3;
}

export default apiKeys;