/**
 * NPC Architect Agent
 * Autonomous NPC system generation and management
 */

import { Agent } from '../core/agent'
import { ollama } from '../core/ollama-client'
import { knowledgeGraph, rememberSuccess, rememberError } from '../core/knowledge-graph'

export const npcArchitectAgent: Agent = {
  id: 'npc-architect',
  name: 'NPC Architect',
  description: 'Autonomous NPC generation and management',

  async execute(context?: Record<string, unknown>): Promise<boolean> {
    console.log('[NPCArchitect] Executing...')

    try {
      // Analyze existing NPCs
      const npcs = await this.scanNPCs()
      console.log(`[NPCArchitect] Found ${npcs.length} NPCs`)

      // Generate new NPCs
      if (context?.count) {
        const newNPCs = await this.generateNPCs(context.count as number)
        console.log(`[NPCArchitect] Generated ${newNPCs.length} new NPCs`)
        rememberSuccess('npc-generation', `Count: ${context.count}`)
      }

      // Update NPC relationships
      await this.updateRelationships()
      console.log('[NPCArchitect] Updated relationships')

      return true
    } catch (error) {
      console.error('[NPCArchitect] Error:', error)
      rememberError('npc-architect', String(error))
      return false
    }
  },

  async scanNPCs(): Promise<string[]> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('grep -rl "NPCSystem\\|createNPC" app/src --include="*.ts" --include="*.tsx" | head -20', (err, stdout) => {
        if (err) resolve([])
        resolve(stdout.split('\n').filter(Boolean))
      })
    })
  },

  async generateNPCs(count: number): Promise<Array<{ name: string; role: string; personality: string }>> {
    const prompt = `Generate ${count} detailed NPC profiles for an RPG game.

For each NPC provide:
- name
- role/occupation
- personality traits
- background story (2-3 sentences)

Format as JSON array:`

    const result = await ollama.generate(prompt)

    // Parse JSON from result
    try {
      const match = result.match(/\[[\s\S]*\]/)
      if (match) {
        return JSON.parse(match[0])
      }
    } catch {
      // Return parsed NPCs
    }

    return []
  },

  async updateRelationships(): Promise<void> {
    // Update NPC relationship graph
    knowledgeGraph.add({
      type: 'pattern',
      content: 'npc-relationships',
      context: 'Updated NPC relationships',
      strength: 0.5,
      tags: ['npc', 'relationships'],
      metadata: {}
    })
  }
}