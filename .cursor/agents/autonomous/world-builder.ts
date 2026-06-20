/**
 * World Builder Agent
 * Autonomous world generation and management
 */

import { Agent } from '../core/agent'
import { ollama } from '../core/ollama-client'
import { knowledgeGraph, rememberSuccess, rememberError } from '../core/knowledge-graph'

export const worldBuilderAgent: Agent = {
  id: 'world-builder',
  name: 'World Builder',
  description: 'Autonomous world generation and management',

  async execute(context?: Record<string, unknown>): Promise<boolean> {
    console.log('[WorldBuilder] Executing...')

    try {
      // Analyze world tiles
      const tiles = await this.analyzeTiles()
      console.log(`[WorldBuilder] Found ${tiles.length} tile types`)

      // Generate new biomes
      if (context?.biomeCount) {
        const biomes = await this.generateBiomes(context.biomeCount as number)
        console.log(`[WorldBuilder] Generated ${biomes.length} biomes`)
        rememberSuccess('world-generation', `Biomes: ${context.biomeCount}`)
      }

      // Update landmarks
      await this.updateLandmarks()
      console.log('[WorldBuilder] Updated landmarks')

      return true
    } catch (error) {
      console.error('[WorldBuilder] Error:', error)
      rememberError('world-builder', String(error))
      return false
    }
  },

  async analyzeTiles(): Promise<string[]> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('grep -r "WorldTile\\|Biome" app/src/engine/worldTiles.ts | head -20', (err, stdout) => {
        if (err) resolve([])
        const matches = stdout.match(/\w+(?=Tile|Biome)/g) || []
        resolve([...new Set(matches)])
      })
    })
  },

  async generateBiomes(count: number): Promise<Array<{ name: string; terrain: string; resources: string[] }>> {
    const prompt = `Generate ${count} detailed biomes for an RPG game world.

For each biome provide:
- name
- terrain type
- resources available (array)
- weather pattern
- difficulty level (1-10)

Format as JSON array:`

    const result = await ollama.generate(prompt)

    try {
      const match = result.match(/\[[\s\S]*\]/)
      if (match) {
        return JSON.parse(match[0])
      }
    } catch {
      // Parse error
    }

    return []
  },

  async updateLandmarks(): Promise<void> {
    knowledgeGraph.add({
      type: 'pattern',
      content: 'world-landmarks',
      context: 'Updated world landmarks',
      strength: 0.5,
      tags: ['world', 'landmarks'],
      metadata: {}
    })
  }
}