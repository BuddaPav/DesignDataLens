/**
 * Event Bus
 *
 * Central event communication system for agent-based architecture.
 * Based on the "Второй Мозг" 120-vector plan.
 */

import { EventEmitter } from 'events';

// Event types aligned with vector architecture
export type BrainEventType =
  | 'context.classify'
  | 'context.compress'
  | 'context.summarize'
  | 'context.saturation'
  | 'prompt.build'
  | 'prompt.alternatives'
  | 'prompt.defaults'
  | 'generate.request'
  | 'generate.response'
  | 'generate.error'
  | 'generate.confidence'
  | 'verify.request'
  | 'verify.pass'
  | 'verify.fail'
  | 'verify.hallucination'
  | 'memory.store'
  | 'memory.retrieve'
  | 'memory.update'
  | 'memory.bayes'
  | 'memory.offline'
  | 'game.code'
  | 'game.asset'
  | 'game.audio'
  | 'metrics.track'
  | 'metrics.alert';

// Brain event structure
export interface BrainEvent {
  id: string;
  type: BrainEventType;
  source: string;
  target?: string;
  payload: unknown;
  metadata: {
    timestamp: number;
    correlationId?: string;
    vectors: number[];
    tokenCount?: number;
    confidence?: number;
  };
}

export type EventHandler = (event: BrainEvent) => void | Promise<void>;

// In-memory event bus
class InMemoryEventBus extends EventEmitter {
  private handlers: Map<BrainEventType, Set<EventHandler>>;
  private eventHistory: BrainEvent[];
  private maxHistory: number;

  constructor() {
    super();
    this.handlers = new Map();
    this.eventHistory = [];
    this.maxHistory = 1000;
  }

  publish(event: BrainEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }
    this.emit(event.type, event);
    this.emit('*', event);
  }

  subscribe(eventType: BrainEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    this.on(eventType, handler);
    return () => {
      this.handlers.get(eventType)?.delete(handler);
      this.off(eventType, handler);
    };
  }

  getHistory(eventType?: BrainEventType): BrainEvent[] {
    if (!eventType) return [...this.eventHistory];
    return this.eventHistory.filter(e => e.type === eventType);
  }

  clear(): void {
    this.eventHistory = [];
  }
}

/**
 * Event Bus for agent communication
 * Corresponds to Event Bus in the architectural plan Section B.1.
 */
export class EventBus {
  private bus: InMemoryEventBus;
  private agentId: string;
  private subscriptions: Map<BrainEventType, () => void>;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.bus = new InMemoryEventBus();
    this.subscriptions = new Map();
  }

  publish(type: BrainEventType, payload: unknown, metadata: Partial<BrainEvent['metadata']> = {}): BrainEvent {
    const event: BrainEvent = {
      id: this.generateId(),
      type,
      source: this.agentId,
      payload,
      metadata: {
        timestamp: Date.now(),
        vectors: [],
        ...metadata,
      },
    };
    this.bus.publish(event);
    return event;
  }

  subscribe(type: BrainEventType, handler: EventHandler): void {
    const unsubscribe = this.bus.subscribe(type, handler);
    this.subscriptions.set(type, unsubscribe);
  }

  subscribeAll(handler: EventHandler): void {
    this.bus.subscribe('*' as BrainEventType, handler);
  }

  unsubscribe(type: BrainEventType): void {
    const unsub = this.subscriptions.get(type);
    if (unsub) {
      unsub();
      this.subscriptions.delete(type);
    }
  }

  unsubscribeAll(): void {
    const unsubscribeFns = Array.from(this.subscriptions.values());
    for (const unsub of unsubscribeFns) {
      unsub();
    }
    this.subscriptions.clear();
  }

  getHistory(type?: BrainEventType): BrainEvent[] {
    return this.bus.getHistory(type);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

/**
 * Factory for creating Brain Events with proper metadata
 */
export class EventFactory {
  static createClassificationEvent(
    agentId: string,
    input: string,
    complexity: number,
    vectors: number[]
  ): BrainEvent {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type: 'context.classify',
      source: agentId,
      payload: { input, complexity },
      metadata: {
        timestamp: Date.now(),
        vectors,
        tokenCount: input.split(/\s+/).length,
      },
    };
  }

  static createGenerationEvent(
    agentId: string,
    prompt: string,
    model: string,
    vectors: number[]
  ): BrainEvent {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type: 'generate.request',
      source: agentId,
      payload: { prompt, model },
      metadata: {
        timestamp: Date.now(),
        vectors,
        tokenCount: prompt.split(/\s+/).length,
      },
    };
  }

  static createVerificationEvent(
    agentId: string,
    artifact: unknown,
    vectors: number[]
  ): BrainEvent {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type: 'verify.request',
      source: agentId,
      payload: artifact,
      metadata: {
        timestamp: Date.now(),
        vectors,
      },
    };
  }

  static createMemoryEvent(
    agentId: string,
    action: 'store' | 'retrieve' | 'update',
    data: unknown,
    vectors: number[]
  ): BrainEvent {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type: `memory.${action}` as BrainEventType,
      source: agentId,
      payload: data,
      metadata: {
        timestamp: Date.now(),
        vectors,
      },
    };
  }
}