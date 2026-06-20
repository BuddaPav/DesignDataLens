/**
 * Context Agent
 *
 * Agent for managing context, classification, and summarization.
 * Implements vectors: 14, 17, 18, 39, 41, 71
 * - 14: Metacognitive load monitoring
 * - 17: Cognitive cooldown
 * - 18: Semantic resonance
 * - 39: Staleness index
 * - 41: Context compression
 * - 71: Memory saturation
 */

import type { AgentResult, AgentState } from './base';
import { Agent, createAgentState } from './base';
import type { BrainEvent } from '../eventBus';
import type { BrainConfig } from '../config';
import { DEFAULT_BRAIN_CONFIG } from '../config';

/**
 * Input classification based on complexity
 */
export type InputComplexity = 1 | 2 | 3 | 4 | 5;

/**
 * Classified intent
 */
export interface ClassifiedIntent {
  complexity: InputComplexity;
  category: 'simple' | 'medium' | 'complex' | 'architectural';
  keywords: string[];
  estimatedTokens: number;
  suggestedModel: 'tiny' | 'small' | 'medium' | 'large';
}

/**
 * Context summary
 */
export interface ContextSummary {
  keyFacts: string[];
  decisions: string[];
  contextTokens: number;
  summaryTokens: number;
  isCompressed: boolean;
}

/**
 * Context Agent
 *
 * Manages context including:
 * - Input classification and complexity estimation
 * - Context summarization and compression
 * - Memory saturation monitoring
 * - Cognitive cooldown tracking
 *
 * Corresponds to ContextAgent in plan Section B.2
 */
export class ContextAgent extends Agent {
  private state: AgentState;
  private lastClassified?: ClassifiedIntent;
  private tokenCount = 0;
  private cooldownUntil = 0;

  constructor(id: string, config: BrainConfig = DEFAULT_BRAIN_CONFIG) {
    super(id, 'ContextAgent', config);
    this.vectors = [14, 17, 18, 39, 41, 71];
    this.state = createAgentState();

    // Subscribe to relevant events
    this.subscribe('context.classify', this.handleClassify.bind(this));
    this.subscribe('context.summarize', this.handleSummarize.bind(this));
    this.subscribe('context.saturation', this.handleSaturation.bind(this));
  }

  /**
   * Process events
   */
  async process(event: BrainEvent): Promise<AgentResult> {
    const startTime = Date.now();

    switch (event.type) {
      case 'context.classify':
        return this.handleClassify(event);

      case 'context.compress':
      case 'context.summarize':
        return this.handleSummarize(event);

      case 'context.saturation':
        return this.handleSaturation(event);

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
   * Classify input (vector 14 - metacognitive load)
   */
  private handleClassify(event: BrainEvent): AgentResult<ClassifiedIntent> {
    const input = event.payload as { input: string };
    const text = input.input || '';

    // Basic complexity estimation
    const complexity = this.estimateComplexity(text);
    const category = this.getCategory(complexity);
    const keywords = this.extractKeywords(text);
    const estimatedTokens = this.estimateTokens(text);

    // Determine model based on complexity
    const suggestedModel = this.getSuggestedModel(complexity);

    // Track token count
    this.tokenCount += estimatedTokens;

    // Check for cognitive cooldown (vector 17)
    const cooldown = this.checkCooldown();

    const intent: ClassifiedIntent = {
      complexity,
      category,
      keywords,
      estimatedTokens,
      suggestedModel,
    };

    this.lastClassified = intent;

    return {
      success: true,
      data: intent,
      confidence: this.calculateConfidence(complexity),
      vectors: this.vectors,
      metadata: {
        latency: 0,
        modelUsed: 'internal',
        retries: 0,
        tokens: estimatedTokens,
      },
    };
  }

  /**
   * Summarize/compress context (vector 41 - context compression)
   */
  private handleSummarize(event: BrainEvent): AgentResult<ContextSummary> {
    const payload = event.payload as { context: string; maxTokens?: number };
    const context = payload.context || '';
    const maxTokens = payload.maxTokens || this.config.context.summarizeAt;

    const currentTokens = this.estimateTokens(context);

    // Check if compression needed
    if (currentTokens <= maxTokens) {
      return {
        success: true,
        data: {
          keyFacts: [],
          decisions: [],
          contextTokens: currentTokens,
          summaryTokens: currentTokens,
          isCompressed: false,
        },
        confidence: 1.0,
        vectors: this.vectors,
        metadata: {
          latency: 0,
          modelUsed: 'none',
          retries: 0,
          tokens: currentTokens,
        },
      };
    }

    // Extract key facts and decisions
    const keyFacts = this.extractKeyFacts(context);
    const decisions = this.extractDecisions(context);

    // Simple compression (in production, use LLM)
    const summaryTokens = Math.min(maxTokens, Math.floor(currentTokens * 0.3));
    const isCompressed = true;

    this.tokenCount = summaryTokens;

    return {
      success: true,
      data: {
        keyFacts,
        decisions,
        contextTokens: currentTokens,
        summaryTokens,
        isCompressed,
      },
      confidence: 0.8,
      vectors: this.vectors,
      metadata: {
        latency: 0,
        modelUsed: 'internal',
        retries: 0,
        tokens: summaryTokens,
      },
    };
  }

  /**
   * Check memory saturation (vector 71)
   */
  private handleSaturation(event: BrainEvent): AgentResult<{ saturation: number; shouldCompress: boolean }> {
    const payload = event.payload as { currentTokens: number };
    const currentTokens = payload.currentTokens || this.tokenCount;

    const maxTokens = this.config.context.maxTokens;
    const saturation = currentTokens / maxTokens;

    const shouldCompress = saturation > this.config.context.compressionThreshold;

    // Update token count
    this.tokenCount = currentTokens;

    return {
      success: true,
      data: {
        saturation,
        shouldCompress,
      },
      confidence: 1.0,
      vectors: [71],
      metadata: {
        latency: 0,
        modelUsed: 'none',
        retries: 0,
        tokens: currentTokens,
      },
    };
  }

  /**
   * Estimate complexity (1-5)
   */
  private estimateComplexity(text: string): InputComplexity {
    const lines = text.split('\n').length;
    const words = text.split(/\s+/).length;
    const hasInterfaces = /interface|type\s+\w+/.test(text);
    const hasClasses = /class\s+\w+/.test(text);
    const hasAsync = /async|await|Promise/.test(text);
    const hasDatabase = /database|query SQL/.test(text);
    const hasAI = /AI|LLM|generation|model/.test(text);

    let score = 1;

    if (words > 100) score++;
    if (hasInterfaces || hasClasses) score++;
    if (hasAsync || hasDatabase) score++;
    if (hasAI) score++;

    return Math.min(5, score) as InputComplexity;
  }

  /**
   * Get category from complexity
   */
  private getCategory(complexity: InputComplexity): ClassifiedIntent['category'] {
    if (complexity <= 1) return 'simple';
    if (complexity <= 2) return 'medium';
    if (complexity <= 3) return 'complex';
    return 'architectural';
  }

  /**
   * Get suggested model from complexity
   */
  private getSuggestedModel(complexity: InputComplexity): ClassifiedIntent['suggestedModel'] {
    if (complexity <= 1) return 'tiny';
    if (complexity <= 2) return 'small';
    if (complexity <= 3) return 'medium';
    return 'large';
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const keywords = new Set<string>();

    // Common programming keywords
    const keyTerms = [
      'class', 'function', 'interface', 'type', 'enum', 'const', 'let', 'var',
      'import', 'export', 'from', 'async', 'await', 'return', 'if', 'else',
      'for', 'while', 'switch', 'case', 'break', 'continue',
      'try', 'catch', 'throw', 'finally',
      'new', 'this', 'super', 'extends', 'implements',
      'public', 'private', 'protected', 'static', 'readonly',
      'api', 'endpoint', 'route', 'handler', 'middleware',
      'game', 'player', 'enemy', 'npc', 'combat', 'quest',
      'database', 'query', 'transaction', 'index',
      'ai', 'llm', 'model', 'generation', 'prompt',
    ];

    for (const word of words) {
      if (keyTerms.includes(word)) {
        keywords.add(word);
      }
    }

    return Array.from(keywords).slice(0, 10);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  /**
   * Check cognitive cooldown (vector 17)
   */
  private checkCooldown(): boolean {
    if (Date.now() < this.cooldownUntil) {
      return true;
    }
    return false;
  }

  /**
   * Set cooldown
   */
  setCooldown(durationMs: number): void {
    this.cooldownUntil = Date.now() + durationMs;
  }

  /**
   * Calculate confidence based on complexity
   */
  private calculateConfidence(complexity: InputComplexity): number {
    // Higher complexity = lower confidence
    return Math.max(0.5, 1.0 - (complexity - 1) * 0.15);
  }

  /**
   * Extract key facts from context
   */
  private extractKeyFacts(context: string): string[] {
    // Extract lines that look like definitions or important statements
    const lines = context.split('\n');
    const facts: string[] = [];

    for (const line of lines) {
      if (/^\s*(const|let|var|function|class|interface|type)/.test(line)) {
        const trimmed = line.trim();
        if (trimmed.length > 10 && trimmed.length < 200) {
          facts.push(trimmed);
        }
      }
    }

    return facts.slice(0, 20);
  }

  /**
   * Extract decisions from context
   */
  private extractDecisions(context: string): string[] {
    const lines = context.split('\n');
    const decisions: string[] = [];

    for (const line of lines) {
      // Look for decision patterns
      if (/selected|chosen|decided|adopted|chosen/i.test(line)) {
        decisions.push(line.trim());
      }
    }

    return decisions.slice(0, 10);
  }

  /**
   * Get current token count
   */
  getTokenCount(): number {
    return this.tokenCount;
  }

  /**
   * Get last classification
   */
  getLastClassification(): ClassifiedIntent | undefined {
    return this.lastClassified;
  }

  /**
   * Reset token count
   */
  reset(): void {
    this.tokenCount = 0;
    this.lastClassified = undefined;
  }
}