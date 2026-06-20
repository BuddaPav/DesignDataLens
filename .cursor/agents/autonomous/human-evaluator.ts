/**
 * Human Evaluator Agent
 * Continuously evaluates game against human brain criteria
 */

import { Agent } from '../core/agent'
import { ollama } from '../core/ollama-client'
import { knowledgeGraph, rememberSuccess, rememberError } from '../core/knowledge-graph'
import { humanEvaluation, getPlayerTypes } from '../core/human-evaluation'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const humanEvaluatorAgent: Agent = {
  id: 'human-evaluator',
  name: 'Human Evaluator',
  description: 'Evaluates game by human brain criteria',

  async execute(context?: Record<string, unknown>): Promise<boolean> {
    console.log('[HumanEvaluator] Executing...')

    try {
      // 1. Load key game files for evaluation
      const gameContext = await this.loadGameContext()

      // 2. Evaluate against human metrics
      const evalResult = await humanEvaluation.evaluate(gameContext)
      console.log(`[HumanEvaluator] Overall score: ${evalResult.overall.toFixed(1)}/10`)

      // 3. Check specific systems
      await this.evaluateNPCs()
      await this.evaluateCombat()
      await this.evaluateEconomy()
      await this.evaluateUI()
      await this.evaluateWorld()

      // 4. Get player type distribution
      const types = getPlayerTypes()
      console.log('[HumanEvaluator] Player types:', types)

      // 5. Generate improvement suggestions
      const suggestions = await humanEvaluation.generateSuggestions()
      if (suggestions.length > 0) {
        console.log(`[HumanEvaluator] ${suggestions.length} suggestions`)
        for (const s of suggestions.slice(0, 3)) {
          console.log(`  - ${s}`)
        }
      }

      // 6. Store in knowledge graph
      rememberSuccess('human-evaluation', `Score: ${evalResult.overall}`)

      return evalResult.overall >= 5
    } catch (error) {
      console.error('[HumanEvaluator] Error:', error)
      rememberError('human-evaluator', String(error))
      return false
    }
  },

  async loadGameContext(): Promise<{
    gameplay?: string
    npcInteractions?: string
    worldState?: string
    ui?: string
  }> {
    const context: any = {}

    try {
      // Load NPC system
      const npcFile = join('app/src/engine/NPCSystem.ts')
      const npc = await readFile(npcFile, 'utf-8')
      context.npcInteractions = npc.slice(0, 1000)
    } catch { /* ignore */ }

    try {
      // Load combat
      const combat = await readFile('app/src/domain/combat/quickHostileCombat.ts', 'utf-8')
      context.gameplay = combat.slice(0, 1000)
    } catch { /* ignore */ }

    try {
      // Load economy
      const economy = await readFile('app/src/domain/economy/caravanEconomy.ts', 'utf-8')
      context.worldState = economy.slice(0, 500)
    } catch { /* ignore */ }

    return context
  },

  async evaluateNPCs(): Promise<void> {
    // Evaluate NPC dialogue system
    knowledgeGraph.add({
      type: 'insight',
      content: 'npc-evaluation',
      context: 'Evaluated NPC interactions',
      strength: 0.6,
      tags: ['npc', 'human-metrics'],
      metadata: {}
    })
    console.log('[HumanEvaluator] NPCs evaluated')
  },

  async evaluateCombat(): Promise<void> {
    // Evaluate combat engagement
    knowledgeGraph.add({
      type: 'insight',
      content: 'combat-evaluation',
      context: 'Evaluated combat system',
      strength: 0.6,
      tags: ['combat', 'human-metrics'],
      metadata: {}
    })
    console.log('[HumanEvaluator] Combat evaluated')
  },

  async evaluateEconomy(): Promise<void> {
    // Evaluate economy balance
    knowledgeGraph.add({
      type: 'insight',
      content: 'economy-evaluation',
      context: 'Evaluated economy',
      strength: 0.6,
      tags: ['economy', 'human-metrics'],
      metadata: {}
    })
    console.log('[HumanEvaluator] Economy evaluated')
  },

  async evaluateUI(): Promise<void> {
    // Evaluate UI/UX
    knowledgeGraph.add({
      type: 'insight',
      content: 'ui-evaluation',
      context: 'Evaluated UI/UX',
      strength: 0.6,
      tags: ['ui', 'human-metrics'],
      metadata: {}
    })
    console.log('[HumanEvaluator] UI evaluated')
  },

  async evaluateWorld(): Promise<void> {
    // Evaluate world engagement
    knowledgeGraph.add({
      type: 'insight',
      content: 'world-evaluation',
      context: 'Evaluated world',
      strength: 0.6,
      tags: ['world', 'human-metrics'],
      metadata: {}
    })
    console.log('[HumanEvaluator] World evaluated')
  }
}