/**
 * Brain - Main Orchestrator
 *
 * Main orchestrator for the "Второй Мозг" agent system.
 * Coordinates all agents based on the 120-vector architecture.
 */

import { EventBus, EventFactory } from './eventBus';
import { DEFAULT_BRAIN_CONFIG } from './config';
import type { BrainConfig } from './config';
// Type imports for future use
// import type { Agent, AgentResult } from './agents/base';
import { ContextAgent } from './agents/contextAgent';
import type { ClassifiedIntent } from './agents/contextAgent';
import { GeneratorAgent } from './agents/generatorAgent';
import type { GenerationRequest, GenerationResponse } from './agents/generatorAgent';
import { MemoryAgent } from './agents/memoryAgent';
import type { MemoryEntry, RagResult } from './agents/memoryAgent';
import { VerifierAgent } from './agents/verifierAgent';
import type { VerificationResult } from './agents/verifierAgent';
import { MetricsAgent } from './agents/metricsAgent';

/**
 * Brain request
 */
export interface BrainRequest {
  input: string;
  type?: 'code' | 'asset' | 'audio' | 'general';
  context?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    includeAlternatives?: boolean;
  };
}

/**
 * Brain response
 */
export interface BrainResponse {
  success: boolean;
  content?: string;
  classification?: ClassifiedIntent;
  verification?: VerificationResult;
  memory?: RagResult[];
  alternatives?: string[];
  confidence: number;
  latency: number;
  metadata: {
    tokens: number;
    model: string;
    vectors: number[];
    retries: number;
  };
}

/**
 * Brain - Main Orchestrator
 *
 * Coordinates all agents in the "Второй Мозг" system:
 * 1. ContextAgent - classifies and manages context
 * 2. GeneratorAgent - generates code/artifacts
 * 3. VerifierAgent - verifies output
 * 4. MemoryAgent - stores and retrieves memory
 * 5. MetricsAgent - tracks metrics
 *
 * Implements the flow from plan Section B.3
 */
export class Brain {
  private config: BrainConfig;
  private contextAgent: ContextAgent;
  private generatorAgent: GeneratorAgent;
  private verifierAgent: VerifierAgent;
  private memoryAgent: MemoryAgent;
  private metricsAgent: MetricsAgent;
  private eventBus: EventBus;
  private isInitialized = false;

  constructor(config: BrainConfig = DEFAULT_BRAIN_CONFIG) {
    this.config = config;
    this.contextAgent = new ContextAgent('context', config);
    this.generatorAgent = new GeneratorAgent('generator', config);
    this.verifierAgent = new VerifierAgent('verifier', config);
    this.memoryAgent = new MemoryAgent('memory', config);
    this.metricsAgent = new MetricsAgent('metrics', config);
    this.eventBus = new EventBus('brain');
  }

  /**
   * Initialize the Brain
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.contextAgent.initialize();
    await this.generatorAgent.initialize();
    await this.verifierAgent.initialize();
    await this.memoryAgent.initialize();
    await this.metricsAgent.initialize();

    // Wire up event bus subscriptions
    this.setupEventHandlers();

    this.isInitialized = true;
  }

  /**
   * Process a request through the Brain pipeline
   *
   * Flow: Input -> ContextAgent -> Generator -> Verifier -> Memory -> Output
   * Implements plan Section B.3
   */
  async process(request: BrainRequest): Promise<BrainResponse> {
    const startTime = Date.now();

    // Step 1: Classify input (ContextAgent)
    const classifyResult = await this.contextAgent.process(
      EventFactory.createClassificationEvent('brain', request.input, 1, [14])
    );

    if (!classifyResult.success) {
      return this.errorResponse('Classification failed', Date.now() - startTime);
    }

    const classification = classifyResult.data as ClassifiedIntent;

    // Step 2: Retrieve relevant context from memory
    const memoryResult = await this.memoryAgent.process(
      EventFactory.createMemoryEvent('brain', 'retrieve', { query: request.input }, [79])
    );

    // Step 3: Generate (GeneratorAgent)
    const generateRequest: GenerationRequest = {
      prompt: request.input,
      model: classification.suggestedModel,
      temperature: request.options?.temperature,
      maxTokens: request.options?.maxTokens,
    };

    const generateResult = await this.generatorAgent.process(
      EventFactory.createGenerationEvent('brain', generateRequest.prompt, generateRequest.model, [86])
    );

    if (!generateResult.success || !generateResult.data) {
      return this.errorResponse('Generation failed', Date.now() - startTime);
    }

    const generated = generateResult.data as GenerationResponse;

    // Step 4: Verify (VerifierAgent)
    const verifyResult = await this.verifierAgent.process({
      id: `verify-${Date.now()}`,
      type: 'verify.request',
      source: 'brain',
      payload: { artifact: generated.content, type: request.type || 'code' },
      metadata: { timestamp: Date.now(), vectors: [76] },
    });

    const verification = verifyResult.data as VerificationResult | undefined;

    // Step 5: Store in memory if verified
    if (verifyResult.success) {
      await this.memoryAgent.process(
        EventFactory.createMemoryEvent('brain', 'store', {
          type: 'code',
          content: generated.content,
          metadata: {
            source: 'generation',
            tags: classification.keywords,
            confidence: generated.content ? 0.8 : 0.5,
          },
        }, [80])
      );
    }

    // Calculate overall confidence
    const confidence = this.calculateConfidence(classifyResult.confidence, generateResult.confidence, verifyResult.confidence);

    // Track metrics
    await this.metricsAgent.process({
      id: `metrics-${Date.now()}`,
      type: 'metrics.track',
      source: 'brain',
      payload: { latency: Date.now() - startTime, success: verifyResult.success },
      metadata: { timestamp: Date.now(), vectors: [43] },
    });

    return {
      success: verifyResult.success,
      content: generated.content,
      classification,
      verification,
      memory: memoryResult.success ? memoryResult.data as RagResult[] : undefined,
      alternatives: request.options?.includeAlternatives
        ? this.generatorAgent.generateAlternatives(request.input)
        : undefined,
      confidence,
      latency: Date.now() - startTime,
      metadata: {
        tokens: generated.usage.totalTokens,
        model: classification.suggestedModel,
        vectors: [14, 17, 41, 71, 86, 87, 92].filter(v => v > 0),
        retries: generateResult.metadata.retries,
      },
    };
  }

  /**
   * Generate code only (skip verification)
   */
  async generate(request: BrainRequest): Promise<BrainResponse> {
    const startTime = Date.now();

    // Classify
    const classifyResult = await this.contextAgent.process(
      EventFactory.createClassificationEvent('brain', request.input, 1, [14])
    );

    if (!classifyResult.success) {
      return this.errorResponse('Classification failed', Date.now() - startTime);
    }

    const classification = classifyResult.data as ClassifiedIntent;

    // Generate
    const generateRequest: GenerationRequest = {
      prompt: request.input,
      model: classification.suggestedModel,
      temperature: request.options?.temperature,
      maxTokens: request.options?.maxTokens,
    };

    const generateResult = await this.generatorAgent.process(
      EventFactory.createGenerationEvent('brain', generateRequest.prompt, generateRequest.model, [86])
    );

    if (!generateResult.success || !generateResult.data) {
      return this.errorResponse('Generation failed', Date.now() - startTime);
    }

    const generated = generateResult.data as GenerationResponse;

    return {
      success: true,
      content: generated.content,
      classification,
      confidence: generateResult.confidence,
      latency: Date.now() - startTime,
      metadata: {
        tokens: generated.usage.totalTokens,
        model: classification.suggestedModel,
        vectors: [86, 91],
        retries: generateResult.metadata.retries,
      },
    };
  }

  /**
   * Verify code
   */
  async verify(code: string): Promise<VerificationResult> {
    const result = await this.verifierAgent.process({
      id: `verify-${Date.now()}`,
      type: 'verify.request',
      source: 'brain',
      payload: { artifact: code, type: 'code' },
      metadata: { timestamp: Date.now(), vectors: [76] },
    });

    return result.data as VerificationResult;
  }

  /**
   * Store memory
   */
  async storeMemory(entry: Omit<MemoryEntry, 'id'>): Promise<MemoryEntry> {
    const result = await this.memoryAgent.process(
      EventFactory.createMemoryEvent('brain', 'store', entry, [80])
    );

    return result.data as MemoryEntry;
  }

  /**
   * Retrieve memory (RAG)
   */
  async retrieveMemory(query: string, limit?: number): Promise<RagResult[]> {
    const result = await this.memoryAgent.process(
      EventFactory.createMemoryEvent('brain', 'retrieve', { query, limit }, [79])
    );

    return (result.data as RagResult[]) || [];
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.contextAgent.cleanup();
    await this.generatorAgent.cleanup();
    await this.verifierAgent.cleanup();
    await this.memoryAgent.cleanup();
    await this.metricsAgent.cleanup();
  }

  /**
   * Setup event handlers between agents
   */
  private setupEventHandlers(): void {
    // Connect agents via event bus
    this.eventBus.subscribe('generate.error', async (event) => {
      // On generation error, trigger verification
      await this.verifierAgent.process({
        id: event.id,
        type: 'verify.fail',
        source: event.source,
        payload: event.payload,
        metadata: { timestamp: Date.now(), vectors: [87] },
      });
    });

    this.eventBus.subscribe('verify.fail', async (event) => {
      // On verification fail, reduce confidence in memory (Bayesian update)
      const payload = event.payload as { decisionId?: string };
      if (payload.decisionId) {
        await this.memoryAgent.process({
          id: `bayes-${Date.now()}`,
          type: 'memory.bayes',
          source: 'brain',
          payload: { decisionId: payload.decisionId, error: true },
          metadata: { timestamp: Date.now(), vectors: [81] },
        });
      }
    });
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(...confidences: number[]): number {
    if (confidences.length === 0) return 0;

    // Use geometric mean
    const product = confidences.reduce((a, b) => a * b, 1);
    return Math.pow(product, 1 / confidences.length);
  }

  /**
   * Create error response
   */
  private errorResponse(error: string, latency: number): BrainResponse {
    return {
      success: false,
      confidence: 0,
      latency,
      metadata: {
        tokens: 0,
        model: 'none',
        vectors: [],
        retries: 0,
      },
    };
  }

  /**
   * Get system status
   */
  getStatus(): {
    initialized: boolean;
    contextTokens: number;
    memoryEntries: number;
    hallucinationRate: number;
  } {
    return {
      initialized: this.isInitialized,
      contextTokens: this.contextAgent.getTokenCount(),
      memoryEntries: this.memoryAgent.getAllEntries().length,
      hallucinationRate: this.generatorAgent.getHallucinationRate(),
    };
  }
}

export default Brain;