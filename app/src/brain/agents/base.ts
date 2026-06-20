/**
 * Agent Base Class
 *
 * Base class for all agents in the "Второй Мозг" system.
 * Implements core functionality from 120-vector architecture.
 */

import type { BrainEvent, BrainEventType } from '../eventBus';
import { EventBus } from '../eventBus';
import type { BrainConfig } from '../config';
import { DEFAULT_BRAIN_CONFIG } from '../config';

export interface AgentContext {
  sessionId: string;
  userId: string;
  inputTokens: number;
  outputTokens: number;
  startTime: number;
  history: BrainEvent[];
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  confidence: number;
  vectors: number[];
  metadata: {
    latency: number;
    modelUsed: string;
    retries: number;
    tokens: number;
  };
}

/**
 * Base class for all Brain agents
 * Corresponds to agent architecture in plan Section B.2
 */
export abstract class Agent {
  protected id: string;
  protected name: string;
  protected config: BrainConfig;
  protected eventBus: EventBus;
  protected vectors: number[] = [];

  constructor(id: string, name: string, config: BrainConfig = DEFAULT_BRAIN_CONFIG) {
    this.id = id;
    this.name = name;
    this.config = config;
    this.eventBus = new EventBus(id);
  }

  /**
   * Get agent ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get vectors this agent is responsible for
   */
  getVectors(): number[] {
    return this.vectors;
  }

  /**
   * Process an event and return result
   */
  abstract process(event: BrainEvent): Promise<AgentResult>;

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Cleanup the agent
   */
  async cleanup(): Promise<void> {
    this.eventBus.unsubscribeAll();
  }

  /**
   * Get event bus for publishing events
   */
  protected getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Publish an event
   */
  protected publish(type: BrainEventType, payload: unknown, vectors?: number[]): BrainEvent {
    return this.eventBus.publish(type, payload, { vectors: vectors || this.vectors });
  }

  /**
   * Subscribe to events
   */
  protected subscribe(type: BrainEventType, handler: (event: BrainEvent) => unknown): void {
    this.eventBus.subscribe(type, handler as (event: BrainEvent) => void | Promise<void>);
  }
}

/**
 * Agent type for factory registry
 */
export type AgentClass = new (id: string, name: string, config?: BrainConfig) => Agent;

/**
 * Factory for creating agents
 * Returns base Agent type - actual agent classes created by calling code
 */
export class AgentFactory {
  private static registry: Map<string, AgentClass> = new Map();

  static register(agentType: string, agentClass: AgentClass): void {
    this.registry.set(agentType, agentClass);
  }

  // These methods must be called with the actual agent class from outside
  // Usage: new ContextAgent('context', 'ContextAgent', config)
  static create<T extends Agent>(
    agentClass: new (id: string, name: string, config?: BrainConfig) => T,
    id: string,
    name: string,
    config?: BrainConfig
  ): T {
    return new agentClass(id, name, config);
  }
}

/**
 * Base agent state for context tracking
 */
export interface AgentState {
  isProcessing: boolean;
  lastEvent?: BrainEvent;
  lastResult?: AgentResult;
  errorCount: number;
  successCount: number;
  averageLatency: number;
}

/**
 * Create agent state
 */
export function createAgentState(): AgentState {
  return {
    isProcessing: false,
    errorCount: 0,
    successCount: 0,
    averageLatency: 0,
  };
}