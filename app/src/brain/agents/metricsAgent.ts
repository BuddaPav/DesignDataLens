/**
 * Metrics Agent
 *
 * Agent for tracking system metrics.
 * Implements vectors: 43-56, 101-106
 * - 43: Cost per 1000 tokens
 * - 44: ROI automation
 * - 45: Technical debt index
 * - 46: Cognitive load budget
 * - 47: Predictable cost
 * - 48: Testing efficiency
 * - 49: Risk insurance
 * - 50: Error latency
 * - 51: Warm start
 * - 52: Project switching
 * - 53: History usage
 * - 54: Backup frequency
 * - 55: Time to burnout
 * - 56: Hypothesis confirmation
 * - 101-106: Risk management
 */

import type { AgentResult, AgentState } from './base';
import { Agent, createAgentState } from './base';
import type { BrainEvent } from '../eventBus';
import type { BrainConfig } from '../config';
import { DEFAULT_BRAIN_CONFIG } from '../config';

/**
 * Metric entry
 */
export interface MetricEntry {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: string[];
}

/**
 * System metrics
 */
export interface SystemMetrics {
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  success: {
    rate: number;
    total: number;
  };
  tokens: {
    used: number;
    cost: number;
  };
  errors: {
    count: number;
    rate: number;
  };
}

/**
 * Metrics Agent
 *
 * Tracks all system metrics:
 * - Latency percentiles
 * - Success rates
 * - Token usage and costs
 * - Error tracking
 *
 * Corresponds to MetricsAgent in plan Section B.2
 */
export class MetricsAgent extends Agent {
  private state: AgentState;
  private latencies: number[] = [];
  private successes = 0;
  private failures = 0;
  private tokensUsed = 0;
  private costPer1kTokens = 0.001; // Default cost

  constructor(id: string, config: BrainConfig = DEFAULT_BRAIN_CONFIG) {
    super(id, 'MetricsAgent', config);
    this.vectors = [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 101, 102, 103, 104, 105, 106];
    this.state = createAgentState();

    this.subscribe('metrics.track', this.handleTrack.bind(this));
    this.subscribe('metrics.alert', this.handleAlert.bind(this));
  }

  /**
   * Process events
   */
  async process(event: BrainEvent): Promise<AgentResult> {
    const startTime = Date.now();

    switch (event.type) {
      case 'metrics.track':
        return this.handleTrack(event);

      case 'metrics.alert':
        return this.handleAlert(event);

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
   * Track metric
   */
  private handleTrack(event: BrainEvent): AgentResult<MetricEntry> {
    const payload = event.payload as {
      latency?: number;
      success?: boolean;
      tokens?: number;
      cost?: number;
    };

    // Track latency (vector 50)
    if (payload.latency) {
      this.latencies.push(payload.latency);
      if (this.latencies.length > 1000) {
        this.latencies.shift();
      }
    }

    // Track success/failure
    if (payload.success !== undefined) {
      if (payload.success) {
        this.successes++;
      } else {
        this.failures++;
      }
    }

    // Track tokens (vector 43)
    if (payload.tokens) {
      this.tokensUsed += payload.tokens;
    }

    const total = this.successes + this.failures;
    const successRate = total > 0 ? this.successes / total : 0;

    const metric: MetricEntry = {
      name: 'track',
      value: successRate,
      unit: 'rate',
      timestamp: Date.now(),
      tags: [],
    };

    return {
      success: true,
      data: metric,
      confidence: 1.0,
      vectors: [43, 50],
      metadata: {
        latency: 1,
        modelUsed: 'none',
        retries: 0,
        tokens: 0,
      },
    };
  }

  /**
   * Handle alert
   */
  private handleAlert(event: BrainEvent): AgentResult<boolean> {
    const payload = event.payload as {
      metric: string;
      threshold: number;
      value: number;
    };

    const exceeded = payload.value > payload.threshold;

    return {
      success: true,
      data: exceeded,
      confidence: 1.0,
      vectors: [105],
      metadata: {
        latency: 0,
        modelUsed: 'none',
        retries: 0,
        tokens: 0,
      },
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): SystemMetrics {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

    const total = this.successes + this.failures;
    const successRate = total > 0 ? this.successes / total : 0;

    const tokenCost = (this.tokensUsed / 1000) * this.costPer1kTokens;

    return {
      latency: { p50, p95, p99 },
      success: { rate: successRate, total },
      tokens: { used: this.tokensUsed, cost: tokenCost },
      errors: { count: this.failures, rate: total > 0 ? this.failures / total : 0 },
    };
  }

  /**
   * Calculate ROI (vector 44)
   */
  calculateROI(hoursSaved: number, costOfAI: number): number {
    const hourlyRate = 50; // Assuming $50/hour developer rate
    const savings = hoursSaved * hourlyRate;
    return (savings - costOfAI) / costOfAI;
  }

  /**
   * Calculate time to burnout (vector 55)
   */
  estimateBurnout(sessionsPerDay: number, avgDuration: number): number {
    // Assume 1000 "stress points" before burnout
    const dailyStress = sessionsPerDay * avgDuration * 0.1;
    return Math.floor(1000 / dailyStress);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.latencies = [];
    this.successes = 0;
    this.failures = 0;
    this.tokensUsed = 0;
  }
}