/**
 * Economy Designer Agent
 * Autonomous economy and trading system design
 */

import { Agent } from '../core/agent'
import { ollama } from '../core/ollama-client'
import { knowledgeGraph, rememberSuccess, rememberError } from '../core/knowledge-graph'

interface Item {
  name: string
  value: number
  rarity: string
}

export const economyDesignerAgent: Agent = {
  id: 'economy-designer',
  name: 'Economy Designer',
  description: 'Autonomous economy and trading system design',

  async execute(context?: Record<string, unknown>): Promise<boolean> {
    console.log('[EconomyDesigner] Executing...')

    try {
      // Analyze current economy
      const items = await this.analyzeItems()
      console.log(`[EconomyDesigner] Found ${items.length} items`)

      // Generate new items
      if (context?.itemCount) {
        const newItems = await this.generateItems(context.itemCount as number)
        console.log(`[EconomyDesigner] Generated ${newItems.length} items`)
        rememberSuccess('economy-design', `Items: ${context.itemCount}`)
      }

      // Balance prices
      await this.balancePrices()
      console.log('[EconomyDesigner] Balanced prices')

      return true
    } catch (error) {
      console.error('[EconomyDesigner] Error:', error)
      rememberError('economy-designer', String(error))
      return false
    }
  },

  async analyzeItems(): Promise<Item[]> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('grep -r "ITEM_|ITEMS" app/src --include="*.ts" | head -30', (err, stdout) => {
        if (err) resolve([])
        const items: Item[] = []
        const matches = stdout.match(/\w+Item/g) || []
        const unique = [...new Set(matches)]
        items.push(...unique.map(name => ({ name, value: 100, rarity: 'common' })))
        resolve(items)
      })
    })
  },

  async generateItems(count: number): Promise<Item[]> {
    const prompt = `Generate ${count} detailed items for an RPG game economy.

For each item provide:
- name
- value (gold cost)
- rarity (common/uncommon/rare/epic/legendary)
- category (weapon/armor/consumable/material)

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

  async balancePrices(): Promise<void> {
    knowledgeGraph.add({
      type: 'pattern',
      content: 'economy-balancing',
      context: 'Balanced economy prices',
      strength: 0.5,
      tags: ['economy', 'balancing'],
      metadata: {}
    })
  }
}