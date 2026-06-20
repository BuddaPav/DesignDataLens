/**
 * Brain System Index
 *
 * Main exports for the "Второй Мозг" Brain system.
 *
 * Usage:
 * import { Brain, BrainRequest } from './brain';
 *
 * const brain = new Brain();
 * await brain.initialize();
 * const response = await brain.process({ input: 'Create a Player class' });
 */

export { Brain } from './brain';
export type { BrainRequest, BrainResponse } from './brain';

export { DEFAULT_BRAIN_CONFIG } from './config';
export type { BrainConfig, ModelSize } from './config';

export { EventBus } from './eventBus';
export type { BrainEvent, BrainEventType, EventFactory } from './eventBus';

export {
  Agent,
  AgentFactory,
  createAgentState,
} from './agents/base';
export type { AgentContext, AgentResult, AgentState } from './agents/base';

export { ContextAgent } from './agents/contextAgent';
export type { ClassifiedIntent, InputComplexity } from './agents/contextAgent';

export { GeneratorAgent } from './agents/generatorAgent';
export type { GenerationRequest, GenerationResponse } from './agents/generatorAgent';

export { MemoryAgent } from './agents/memoryAgent';
export type { MemoryEntry, RagResult } from './agents/memoryAgent';

export { VerifierAgent } from './agents/verifierAgent';
export type { VerificationResult, VerificationCheck } from './agents/verifierAgent';

export { MetricsAgent } from './agents/metricsAgent';
export type { MetricEntry, SystemMetrics } from './agents/metricsAgent';

export {
  getLayerByVector,
  getLayersByVectors,
  getTemplates,
  getTemplate,
  searchVault,
  getVaultStats,
  getVaultPath,
} from './obsidian';
export type { VECTOR_LAYER_MAP, AGENT_VECTOR_MAP } from './obsidian';
export type { LayerInfo, TemplateInfo, SearchResult } from './obsidian';