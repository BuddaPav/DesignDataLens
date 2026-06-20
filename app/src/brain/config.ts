/**
 * Brain Configuration
 *
 * Configuration for the "Второй Мозг" agent system
 * based on the 120-vector architecture plan.
 */

export interface BrainConfig {
  // Model settings
  models: {
    tiny: string;      // 0.5B - classification
    small: string;      // 1-3B - simple code
    medium: string;    // 7B - main generation
    large: string;     // 70B - architecture (optional)
  };

  // Vector database (Qdrant)
  vectorDb: {
    url: string;
    collection: string;
    dimension: number;
  };

  // Event bus (Redis)
  eventBus: {
    url: string;
  };

  // Context settings
  context: {
    maxTokens: number;      // 32K max
    summarizeAt: number;   // 16K tokens
    compressionThreshold: number;
  };

  // Memory settings
  memory: {
    staleAfterDays: number;
    backupFrequency: number; // hours
  };

  // Verification settings
  verification: {
    maxRetries: number;
    timeout: number; // ms
  };

  // Latency targets (ms)
  latencyTargets: {
    tiny: number;    // < 500ms
    small: number;   // < 2000ms
    medium: number;  // < 10000ms
    large: number;    // < 60000ms
  };
}

export const DEFAULT_BRAIN_CONFIG: BrainConfig = {
  models: {
    tiny: 'ollama://tinyllama',
    small: 'ollama://llama3.2:1b',
    medium: 'ollama://mistral',
    large: 'ollama://llama3.1:70b',
  },

  vectorDb: {
    url: 'http://localhost:6333',
    collection: 'brain-memory',
    dimension: 384, // all-MiniLM-L6-v2
  },

  eventBus: {
    url: 'redis://localhost:6379',
  },

  context: {
    maxTokens: 32000,
    summarizeAt: 16000,
    compressionThreshold: 0.5,
  },

  memory: {
    staleAfterDays: 30,
    backupFrequency: 24,
  },

  verification: {
    maxRetries: 3,
    timeout: 30000,
  },

  latencyTargets: {
    tiny: 500,
    small: 2000,
    medium: 10000,
    large: 60000,
  },
};

export type ModelSize = 'tiny' | 'small' | 'medium' | 'large';