/**
 * Autonomous Agent Evolution Engine
 * Self-improving system that learns from actions and evolves
 */

import { skillsRegistry } from './skills-registry';
import { knowledgeGraph } from './knowledge-graph';
import { ollama } from './ollama-client';

interface EvolutionRecord {
  timestamp: number
  action: string
  result: 'success' | 'failure'
  context: Record<string, unknown>
  learnedPatterns: string[]
}

class EvolutionEngine {
  private history: EvolutionRecord[] = [];
  private maxHistory = 1000;
  private patterns: Map<string, number> = new Map();

  async evolve(action: string, context: Record<string, unknown>, result: 'success' | 'failure') {
    const record: EvolutionRecord = {
      timestamp: Date.now(),
      action,
      result,
      context,
      learnedPatterns: []
    };

    if (result === 'success') {
      record.learnedPatterns = this.extractPatterns(context);
      record.learnedPatterns.forEach(p => {
        this.patterns.set(p, (this.patterns.get(p) || 0) + 1);
      });
    }

    this.history.push(record);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    await this.learnFromHistory();
  }

  private extractPatterns(context: Record<string, unknown>): string[] {
    const patterns: string[] = [];
    if (context.file) patterns.push(`file:${context.file}`);
    if (context.error) patterns.push(`error:${context.error}`);
    if (context.module) patterns.push(`module:${context.module}`);
    return patterns;
  }

  private async learnFromHistory() {
    const successCount = this.history.filter(r => r.result === 'success').length;
    const totalCount = this.history.length;
    const successRate = successCount / totalCount;

    if (successRate < 0.6 && totalCount > 10) {
      await this.adaptStrategy();
    }
  }

  private async adaptStrategy() {
    const failures = this.history.filter(r => r.result === 'failure');
    const errorTypes = new Set(failures.map(f => f.context.error));

    console.log('[Evolution] Low success rate. Adapting strategy...');
    console.log('[Evolution] Detected error patterns:', Array.from(errorTypes));
  }

  getTopPatterns(): Array<{ pattern: string; count: number }> {
    return Array.from(this.patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));
  }

  getSuccessRate(): number {
    const success = this.history.filter(r => r.result === 'success').length;
    return this.history.length > 0 ? success / this.history.length : 1;
  }
}

export const evolutionEngine = new EvolutionEngine();