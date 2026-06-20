/**
 * Memory Agent
 *
 * Agent for persistent memory with RAG and embedding.
 * Implements vectors: 79-82, 39, 41
 * - 79: Artifact linkage
 * - 80: Meta-description
 * - 81: Graph sync
 * - 82: Decision review
 * - 39: Staleness index
 * - 41: Context compression
 */

import type { AgentResult, AgentState } from './base';
import { Agent, createAgentState } from './base';
import type { BrainEvent } from '../eventBus';
import type { BrainConfig } from '../config';
import { DEFAULT_BRAIN_CONFIG } from '../config';

/**
 * Memory entry
 */
export interface MemoryEntry {
  id: string;
  type: 'code' | 'dialog' | 'decision' | 'artifact';
  content: string;
  embedding?: number[];
  metadata: {
    timestamp: number;
    source: string;
    tags: string[];
    stale?: boolean;
    confidence?: number;
  };
  // For graph relationships
  references?: string[];
  derivedFrom?: string[];
}

/**
 * RAG result
 */
export interface RagResult {
  entry: MemoryEntry;
  score: number;
  highlights: string[];
}

/**
 * Memory Agent
 *
 * Handles persistent memory including:
 * - Storing and retrieving memory entries
 * - RAG-based retrieval
 * - Bayesian updates on errors
 * - Graph maintenance
 *
 * Corresponds to MemoryAgent in plan Section B.2
 */
export class MemoryAgent extends Agent {
  private state: AgentState;
  private entries: Map<string, MemoryEntry> = new Map();
  private embeddingIndex: Map<string, number[]> = new Map();

  constructor(id: string, config: BrainConfig = DEFAULT_BRAIN_CONFIG) {
    super(id, 'MemoryAgent', config);
    this.vectors = [79, 80, 81, 82, 39, 41];
    this.state = createAgentState();

    // Subscribe to memory events
    this.subscribe('memory.store', this.handleStore.bind(this));
    this.subscribe('memory.retrieve', this.handleRetrieve.bind(this));
    this.subscribe('memory.update', this.handleUpdate.bind(this));
    this.subscribe('memory.bayes', this.handleBayesUpdate.bind(this));
  }

  /**
   * Process events
   */
  async process(event: BrainEvent): Promise<AgentResult> {
    const startTime = Date.now();

    switch (event.type) {
      case 'memory.store':
        return this.handleStore(event);

      case 'memory.retrieve':
        return this.handleRetrieve(event);

      case 'memory.update':
        return this.handleUpdate(event);

      case 'memory.bayes':
        return this.handleBayesUpdate(event);

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
   * Store memory entry (vector 80 - meta-description)
   */
  private handleStore(event: BrainEvent): AgentResult<MemoryEntry> {
    const payload = event.payload as {
      type: MemoryEntry['type'];
      content: string;
      metadata?: MemoryEntry['metadata'];
    };

    const entry: MemoryEntry = {
      id: this.generateId(),
      type: payload.type,
      content: payload.content,
      metadata: {
        timestamp: Date.now(),
        source: event.source,
        tags: payload.metadata?.tags || [],
        ...payload.metadata,
      },
    };

    // Generate embedding (placeholder)
    const embedding = this.generateEmbedding(payload.content);
    entry.embedding = embedding;

    // Store entry
    this.entries.set(entry.id, entry);
    this.embeddingIndex.set(entry.id, embedding);

    // Track stats
    this.state.successCount++;

    // Limit storage
    if (this.entries.size > 1000) {
      this.pruneStale();
    }

    return {
      success: true,
      data: entry,
      confidence: 0.9,
      vectors: [80],
      metadata: {
        latency: 10,
        modelUsed: 'none',
        retries: 0,
        tokens: payload.content.split(/\s+/).length,
      },
    };
  }

  /**
   * Retrieve memory entries (RAG - vector 79)
   */
  private handleRetrieve(event: BrainEvent): AgentResult<RagResult[]> {
    const payload = event.payload as {
      query: string;
      type?: MemoryEntry['type'];
      limit?: number;
    };

    const query = payload.query;
    const limit = payload.limit || 5;
    const typeFilter = payload.type;

    // Generate query embedding
    const queryEmbedding = this.generateEmbedding(query);

    // Calculate similarities
    const results: RagResult[] = [];

    for (const [id, entry] of this.entries) {
      // Type filter
      if (typeFilter && entry.type !== typeFilter) continue;

      // Skip stale (vector 39 - staleness)
      if (entry.metadata.stale) continue;

      // Calculate similarity
      const embedding = this.embeddingIndex.get(id);
      if (!embedding) continue;

      const score = this.cosineSimilarity(queryEmbedding, embedding);

      if (score > 0.3) {
        const highlights = this.extractHighlights(entry.content, query);
        results.push({ entry, score, highlights });
      }
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, limit);

    return {
      success: topResults.length > 0,
      data: topResults,
      confidence: topResults.length > 0 ? 0.85 : 0.3,
      vectors: [79],
      metadata: {
        latency: 20,
        modelUsed: 'none',
        retries: 0,
        tokens: query.split(/\s+/).length,
      },
    };
  }

  /**
   * Update memory entry (vector 82 - decision review)
   */
  private handleUpdate(event: BrainEvent): AgentResult<MemoryEntry> {
    const payload = event.payload as {
      id: string;
      updates: Partial<MemoryEntry>;
    };

    const existing = this.entries.get(payload.id);
    if (!existing) {
      return {
        success: false,
        error: 'Entry not found',
        confidence: 0,
        vectors: [82],
        metadata: {
          latency: 0,
          modelUsed: 'none',
          retries: 0,
          tokens: 0,
        },
      };
    }

    // Apply updates
    const updated: MemoryEntry = {
      ...existing,
      ...payload.updates,
      id: existing.id, // Keep original ID
    };

    this.entries.set(payload.id, updated);

    return {
      success: true,
      data: updated,
      confidence: 0.95,
      vectors: [82],
      metadata: {
        latency: 5,
        modelUsed: 'none',
        retries: 0,
        tokens: 0,
      },
    };
  }

  /**
   * Bayesian update on errors (vector 81 - graph sync)
   *
   * When an error occurs, downgrade confidence of related decisions.
   * Uses: P(H|E) = P(E|H) * P(H) / P(E)
   */
  private handleBayesUpdate(event: BrainEvent): AgentResult<number> {
    const payload = event.payload as {
      decisionId: string;
      error: boolean;
      truePositive?: number;
      falsePositive?: number;
    };

    const decision = this.entries.get(payload.decisionId);
    if (!decision) {
      return {
        success: false,
        error: 'Decision not found',
        confidence: 0,
        vectors: [81],
        metadata: {
          latency: 0,
          modelUsed: 'none',
          retries: 0,
          tokens: 0,
        },
      };
    }

    // Current confidence (prior)
    const prior = decision.metadata.confidence || 0.8;

    // Likelihoods
    const truePositive = payload.truePositive || 0.1;
    const falsePositive = payload.falsePositive || 0.3;

    // Calculate posterior
    const posterior = (truePositive * prior) / (truePositive * prior + falsePositive * (1 - prior));

    // Update entry
    const updated = {
      ...decision,
      metadata: {
        ...decision.metadata,
        confidence: posterior,
      },
    };

    this.entries.set(decision.id, updated);

    return {
      success: true,
      data: posterior,
      confidence: posterior,
      vectors: [81],
      metadata: {
        latency: 5,
        modelUsed: 'none',
        retries: 0,
        tokens: 0,
      },
    };
  }

  /**
   * Prune stale entries (vector 39 - staleness)
   */
  private pruneStale(): void {
    const staleThreshold = this.config.memory.staleAfterDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const [id, entry] of this.entries) {
      const age = now - entry.metadata.timestamp;
      if (age > staleThreshold) {
        entry.metadata.stale = true;
      }
    }

    // Remove stale entries if still over limit
    if (this.entries.size > 1000) {
      const stale: string[] = [];
      for (const [id, entry] of this.entries) {
        if (entry.metadata.stale) {
          stale.push(id);
        }
      }

      for (const id of stale.slice(0, 100)) {
        this.entries.delete(id);
        this.embeddingIndex.delete(id);
      }
    }
  }

  /**
   * Generate simple embedding (placeholder)
   */
  private generateEmbedding(content: string): number[] {
    // Simple hash-based embedding for demo
    const hash = this.simpleHash(content);
    const dim = this.config.vectorDb.dimension;

    // Generate deterministic pseudo-embedding
    const embedding: number[] = [];
    for (let i = 0; i < dim; i++) {
      embedding.push(Math.sin(hash + i) * 0.5 + 0.5);
    }

    return embedding;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Cosine similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Extract relevant highlights from content
   */
  private extractHighlights(content: string, query: string): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLines = content.split('\n');
    const highlights: string[] = [];

    for (const line of contentLines) {
      const lower = line.toLowerCase();
      for (const word of queryWords) {
        if (word.length > 3 && lower.includes(word)) {
          highlights.push(line.trim());
          break;
        }
      }
    }

    return highlights.slice(0, 3);
  }

  /**
   * Get all entries
   */
  getAllEntries(): MemoryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get entry by ID
   */
  getEntry(id: string): MemoryEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.entries.clear();
    this.embeddingIndex.clear();
  }

  private generateId(): string {
    return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}