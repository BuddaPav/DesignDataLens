/**
 * Generator Agent
 *
 * Agent for LLM code/artifact generation.
 * Implements vectors: 86-93, 107-112
 * - 86: Hallucination rate tracking
 * - 87: Self-correction
 * - 88: Iterativity
 * - 90: Alternative diversity
 * - 91: Confidence score
 * - 107-112: Aesthetic/quality vectors
 */

import type { AgentResult, AgentState } from './base';
import { Agent, createAgentState } from './base';
import type { BrainEvent } from '../eventBus';
import type { BrainConfig } from '../config';
import { DEFAULT_BRAIN_CONFIG } from '../config';
import type { ModelSize } from '../config';

/**
 * Generation request
 */
export interface GenerationRequest {
  prompt: string;
  model: ModelSize;
  temperature?: number;
  maxTokens?: number;
  schema?: object;
}

/**
 * Generation response
 */
export interface GenerationResponse {
  content: string;
  model: string;
  finishReason: 'stop' | 'length' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  alternatives?: string[];
}

/**
 * Generator Agent
 *
 * Handles LLM-based generation including:
 * - Model selection based on complexity
 * - Self-correction on errors
 * - Alternative generation
 * - Confidence scoring
 *
 * Corresponds to GeneratorAgent in plan Section B.2
 */
export class GeneratorAgent extends Agent {
  private state: AgentState;
  private cache: Map<string, GenerationResponse> = new Map();
  private hallucinations = 0;
  private totalGenerations = 0;
  private selfCorrected = 0;

  constructor(id: string, config: BrainConfig = DEFAULT_BRAIN_CONFIG) {
    super(id, 'GeneratorAgent', config);
    this.vectors = [86, 87, 88, 90, 91, 107, 108, 109, 110, 111, 112];
    this.state = createAgentState();

    // Subscribe to generation events
    this.subscribe('generate.request', this.handleGenerate.bind(this));
    this.subscribe('generate.error', this.handleError.bind(this));
  }

  /**
   * Process events
   */
  async process(event: BrainEvent): Promise<AgentResult> {
    const startTime = Date.now();

    switch (event.type) {
      case 'generate.request':
        return this.handleGenerate(event);

      default:
        return {
          success: false,
          error: `Unknown event type: ${event.type}`,
          confidence: 0,
          vectors: this.vectors,
          metadata: {
            latency: Date.now() - startTime,
            modelUsed: 'none',
            retries: 0,
            tokens: 0,
          },
        };
    }
  }

  /**
   * Handle generation request
   */
  private handleGenerate(event: BrainEvent): AgentResult<GenerationResponse> {
    const payload = event.payload as GenerationRequest;
    const { prompt, model, temperature, maxTokens } = payload;

    // Check cache
    const cacheKey = this.getCacheKey(prompt, model);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        confidence: 0.95,
        vectors: this.vectors,
        metadata: {
          latency: 0,
          modelUsed: model,
          retries: 0,
          tokens: cached.usage.totalTokens,
        },
      };
    }

    // In production, this would call the LLM
    // For now, return mock response
    const response = this.generateMockResponse(prompt, model);

    // Track generation
    this.totalGenerations++;

    // Calculate confidence based on quality checks
    const confidence = this.calculateConfidence(response.content);

    // Store in cache
    this.cache.set(cacheKey, response);

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    return {
      success: true,
      data: response,
      confidence,
      vectors: this.vectors,
      metadata: {
        latency: 100,
        modelUsed: model,
        retries: 0,
        tokens: response.usage.totalTokens,
      },
    };
  }

  /**
   * Handle generation error (self-correction - vector 87)
   */
  private handleError(event: BrainEvent): AgentResult<GenerationResponse> {
    const payload = event.payload as { error: string; originalPrompt?: string };
    this.hallucinations++;
    this.selfCorrected++;

    // Reset confidence tracking
    this.totalGenerations = 0;

    return {
      success: false,
      error: payload.error,
      confidence: 0,
      vectors: [87],
      metadata: {
        latency: 0,
        modelUsed: 'none',
        retries: this.selfCorrected,
        tokens: 0,
      },
    };
  }

  /**
   * Generate alternative responses (vector 90)
   */
  generateAlternatives(prompt: string, count: number = 3): string[] {
    const alternatives: string[] = [];

    for (let i = 0; i < count; i++) {
      alternatives.push(`Alternative ${i + 1} for: ${prompt.slice(0, 50)}...`);
    }

    return alternatives;
  }

  /**
   * Get hallucination rate (vector 86)
   */
  getHallucinationRate(): number {
    if (this.totalGenerations === 0) return 0;
    return this.hallucinations / this.totalGenerations;
  }

  /**
   * Get self-correction rate (vector 87)
   */
  getSelfCorrectionRate(): number {
    if (this.totalGenerations === 0) return 0;
    return this.selfCorrected / this.totalGenerations;
  }

  /**
   * Calculate confidence score (vector 91)
   */
  private calculateConfidence(content: string): number {
    let score = 0.7; // Base confidence

    // Check for common hallucination markers
    if (/\.nonExistent\(\)/.test(content)) score -= 0.3;
    if (/fake|non-existent|phantom/i.test(content)) score -= 0.2;

    // Check for code quality (vector 107)
    const hasProperStructure = /\{[\s\S]*\}/.test(content);
    if (hasProperStructure) score += 0.1;

    // Check for comments (vector 107)
    const hasComments = /\/\/|\/\*|\*\//.test(content);
    if (hasComments) score += 0.05;

    // Check for imports
    const hasImports = /import\s+.*from/.test(content);
    if (hasImports) score += 0.05;

    return Math.max(0.1, Math.min(1.0, score));
  }

  /**
   * Generate mock response (placeholder for real LLM)
   */
  private generateMockResponse(prompt: string, model: ModelSize): GenerationResponse {
    return {
      content: `// Generated with ${model} model\n// Prompt: ${prompt.slice(0, 100)}...\n\n// TODO: Implement generation logic`,
      model: this.config.models[model],
      finishReason: 'stop',
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 50,
        totalTokens: Math.ceil(prompt.length / 4) + 50,
      },
      alternatives: this.generateAlternatives(prompt, 3),
    };
  }

  /**
   * Get cache key
   */
  private getCacheKey(prompt: string, model: string): string {
    return `${model}:${prompt.slice(0, 100)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear statistics
   */
  clearStats(): void {
    this.hallucinations = 0;
    this.totalGenerations = 0;
    this.selfCorrected = 0;
  }
}