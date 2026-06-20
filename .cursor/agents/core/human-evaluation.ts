/**
 * Human Evaluation Engine - Second Brain System
 * Evaluates game by human brain criteria: psychology, motivation, engagement
 */

import { ollama } from './ollama-client'
import { knowledgeGraph } from './knowledge-graph'

// Human brain evaluation criteria for games
interface Humanmetrics {
  // Core motivation (Self-Determination Theory)
  autonomy: number        // Freedom, choice, control
  competence: number   // Mastery, skill growth
  relatedness: number  // Social connection

  // Flow theory (Csikszentmihalyi)
  challenge: number    // Difficulty balance
  clarity: number    // Clear goals
  feedback: number  // Immediate feedback
  focus: number    // Immersion

  // Engagement factors
  curiosity: number   // Novelty, surprise
  novelty: number   // Fresh content
  complexity: number // Depth

  // Emotional evaluation
  fun: number       // Enjoyment
  engagement: number // sustained interest
  satisfaction: number // Accomplishment
  frustration: number // Negative (should be low)

  // Social
  competition: number  // PvP drive
  cooperation: number // Teamplay
  community: number // Social presence

  // Long-term retention
  addiction: number   // Long sessions
  return: number   // Come back
  loyalty: number  // Recommend
}

interface EvaluationResult {
  overall: number
  metrics: Humanmetrics
  issues: string[]
  suggestions: string[]
}

// Player type classifications (Bartle)
type PlayerType = 'Achiever' | 'Explorer' | 'Socializer' | 'Killer'

class HumanEvaluation {
  private currentEval?: Humanmetrics

  // Evaluate game state against human brain criteria
  async evaluate(context: {
    gameplay?: string
    npcInteractions?: string
    worldState?: string
    ui?: string
  }): Promise<EvaluationResult> {
    console.log('[HumanEval] Evaluating game...')

    const metrics: Humanmetrics = {
      autonomy: 0,
      competence: 0,
      relatedness: 0,
      challenge: 0,
      clarity: 0,
      feedback: 0,
      focus: 0,
      curiosity: 0,
      novelty: 0,
      complexity: 0,
      fun: 0,
      engagement: 0,
      satisfaction: 0,
      frustration: 0,
      competition: 0,
      cooperation: 0,
      community: 0,
      addiction: 0,
      return: 0,
      loyalty: 0
    }

    const issues: string[] = []
    const suggestions: string[] = []

    try {
      // Use AI to analyze gameplay for human metrics
      const analysis = await this.analyzeGameplay(context)
      console.log(`[HumanEval] Analysis: ${analysis.slice(0, 200)}...`)

      // Update current metrics
      this.currentEval = metrics

      // Store in knowledge graph
      knowledgeGraph.add({
        type: 'insight',
        content: 'human-evaluation',
        context: JSON.stringify(metrics),
        strength: 0.7,
        tags: ['human-metrics', 'evaluation'],
        metadata: { metrics }
      })

    } catch (error) {
      console.error('[HumanEval] Error:', error)
      issues.push(String(error))
    }

    // Calculate overall
    const overall = this.calculateOverall(metrics)

    return { overall, metrics, issues, suggestions }
  }

  private async analyzeGameplay(context: {
    gameplay?: string
    npcInteractions?: string
    worldState?: string
    ui?: string
  }): Promise<string> {
    const prompt = `Evaluate this game context for human engagement metrics:

Gameplay: ${context.gameplay || 'standard RPG mechanics'}
NPCs: ${context.npcInteractions || 'dialogue system'}
World: ${context.worldState || 'open world'}
UI: ${context.ui || 'standard HUD'}

Evaluate on scale 0-10 for:
- Autonomy (player freedom)
- Competence (skill growth)
- Relatedness (social)
- Challenge (difficulty balance)
- Clarity (clear goals)
- Feedback (immediate)
- Curiosity (novelty)
- Fun (enjoyment)
- Engagement (sustained interest)

Return JSON with scores and issues:`

    return ollama.generate(prompt)
  }

  private calculateOverall(metrics: Humanmetrics): number {
    // Weighted average based on importance
    const weights = {
      fun: 0.25,
      engagement: 0.20,
      satisfaction: 0.15,
      autonomy: 0.10,
      competence: 0.10,
      relatedness: 0.05,
      challenge: 0.10,
      novelty: 0.05
    }

    let total = 0
    let weight = 0

    for (const [key, w] of Object.entries(weights)) {
      total += (metrics as any)[key] * w
      weight += w
    }

    return total / weight
  }

  // Get player type distribution
  getPlayerTypes(): Record<PlayerType, number> {
    // Estimate from current metrics
    const types: Record<PlayerType, number> = {
      Achiever: 0,
      Explorer: 0,
      Socializer: 0,
      Killer: 0
    }

    if (this.currentEval) {
      types.Achiever = this.currentEval.competence * 0.8 + this.currentEval.satisfaction * 0.2
      types.Explorer = this.currentEval.curiosity * 0.6 + this.currentEval.novelty * 0.4
      types.Socializer = this.currentEval.relatedness * 0.7 + this.currentEval.cooperation * 0.3
      types.Killer = this.currentEval.competition * 0.9 + this.currentEval.frustration * 0.1
    }

    return types
  }

  // Generate suggestions for improvement
  async generateSuggestions(): Promise<string[]> {
    if (!this.currentEval) return []

    const suggestions: string[] = []

    if (this.currentEval.autonomy < 5) {
      suggestions.push('Add more player choices and branching paths')
    }
    if (this.currentEval.competence < 5) {
      suggestions.push('Implement skill progression system')
    }
    if (this.currentEval.challenge < 5) {
      suggestions.push('Balance difficulty with adaptive AI')
    }
    if (this.currentEval.feedback < 5) {
      suggestions.push('Add immediate visual/audio feedback')
    }
    if (this.currentEval.novelty < 5) {
      suggestions.push('Add random events and surprises')
    }

    return suggestions
  }

  getMetrics(): Humanmetrics | undefined {
    return this.currentEval
  }
}

export const humanEvaluation = new HumanEvaluation()

// Quick evaluation helpers
export async function quickEval(gameState: string): Promise<number> {
  const result = await humanEvaluation.evaluate({ gameplay: gameState })
  return result.overall
}

export function getPlayerTypes(): Record<PlayerType, number> {
  return humanEvaluation.getPlayerTypes()
}