/**
 * System Runner - Start 24/7 Autonomous Cycle
 * Initializes and runs all autonomous agents
 */

import { orchestrator } from './orchestrator'
import { autonomousCycle } from '../core/autonomous-cycle'
import { ollama } from '../core/ollama-client'
import { humanEvaluation } from '../core/human-evaluation'
import { knowledgeGraph } from '../core/knowledge-graph'

interface SystemStatus {
  running: boolean
  agents: number
  cycleCount: number
  ollamaModels: number
  knowledgeNodes: number
  timestamp: number
}

class SystemRunner {
  private interval?: ReturnType<typeof setInterval>
  private running = false

  async start(): Promise<boolean> {
    if (this.running) {
      console.log('[SystemRunner] Already running')
      return true
    }

    console.log('[SystemRunner] Starting autonomous system...')

    try {
      // 1. Test Ollama connection
      const models = await this.checkOllama()
      console.log(`[SystemRunner] Ollama: ${models} models`)

      // 2. Start orchestrator
      orchestrator.start()
      console.log('[SystemRunner] Orchestrator started')

      // 3. Start autonomous cycle
      autonomousCycle.start()
      console.log('[SystemRunner] Autonomous cycle started')

      // 4. Run initial human evaluation
      await this.runInitialEvaluation()

      // 5. Start continuous monitoring
      this.startMonitoring()

      this.running = true
      console.log('[SystemRunner] === AUTONOMOUS SYSTEM RUNNING ===')

      return true
    } catch (error) {
      console.error('[SystemRunner] Start failed:', error)
      return false
    }
  }

  private async checkOllama(): Promise<number> {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags')
      const data = await response.json()
      return data.models?.length || 0
    } catch {
      return 0
    }
  }

  private async runInitialEvaluation(): Promise<void> {
    console.log('[SystemRunner] Running initial evaluation...')

    try {
      // Quick human evaluation
      const result = await humanEvaluation.evaluate({
        gameplay: 'AFK Game RPG mechanics',
        npcInteractions: 'NPC dialogue and relationships',
        worldState: 'Open world with biomes',
        ui: 'HUD and panels'
      })

      console.log(`[SystemRunner] Initial score: ${result.overall.toFixed(1)}/10`)
      console.log(`[SystemRunner] Metrics: Autonomy=${result.metrics.autonomy}, Engagement=${result.metrics.engagement}`)
    } catch (error) {
      console.log('[SystemRunner] Initial eval error:', error)
    }
  }

  private startMonitoring(): void {
    // Monitor every 30 seconds
    this.interval = setInterval(() => {
      this.monitor()
    }, 30000)
  }

  private async monitor(): Promise<void> {
    const status = this.getStatus()
    console.log(`[SystemRunner] Status: ${status.agents} agents, ${status.cycleCount} cycles, ${status.knowledgeNodes} knowledge`)
  }

  stop(): void {
    this.running = false
    if (this.interval) {
      clearInterval(this.interval)
    }
    orchestrator.stop()
    autonomousCycle.stop()
    console.log('[SystemRunner] Stopped')
  }

  getStatus(): SystemStatus {
    return {
      running: this.running,
      agents: orchestrator.getStatus().length,
      cycleCount: autonomousCycle.getStatus().cycleCount,
      ollamaModels: 10, // Static for now
      knowledgeNodes: knowledgeGraph.stats().totalNodes,
      timestamp: Date.now()
    }
  }
}

export const systemRunner = new SystemRunner()

// Auto-start
if (typeof window !== 'undefined') {
  // Expose for manual start
  ;(window as any).afkStart = () => systemRunner.start()
  ;(window as any).afkStatus = () => systemRunner.getStatus()
  ;(window as any).afkStop = () => systemRunner.stop()
}

// Export for CLI
export function start() {
  return systemRunner.start()
}

export function status() {
  return systemRunner.getStatus()
}

export function stop() {
  return systemRunner.stop()
}