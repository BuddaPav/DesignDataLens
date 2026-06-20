/**
 * Personal Autonomous Agents Orchestrator
 * Enhanced with full Node.js capabilities for continuous autonomous operation
 */

import { Agent } from '../core/agent';
import { codeBuilderAgent } from './code-builder';
import { npcArchitectAgent } from './npc-architect';
import { worldBuilderAgent } from './world-builder';
import { economyDesignerAgent } from './economy-designer';
import { uiCraftsmanAgent } from './ui-craftsman';
import { testRunnerAgent } from './test-runner';
import { performanceProfilerAgent } from './performance-profiler';
import { documentationGeneratorAgent } from './documentation-generator';
import { humanEvaluatorAgent } from './human-evaluator';
import { securityAuditorAgent } from './security-auditor';
import { execSync, spawn } from 'child_process';

interface AutonomousAgent {
  id: string
  agent: Agent
  priority: number
  continuous: boolean
  running: boolean
  cycleCount: number
}

class AutonomousOrchestrator {
  private agents: Map<string, AutonomousAgent> = new Map();
  private running: boolean = false;
  private maxConcurrent: number = 4;
  private cycleInterval: number = 30000; // 30 sec between cycles
  private autoRun: boolean = true;

  constructor() {
    this.registerAgents();
  }

  private registerAgents() {
    // Code Builder - Highest priority (fixes build errors)
    this.agents.set('code-builder', {
      id: 'code-builder',
      agent: codeBuilderAgent,
      priority: 1,
      continuous: true,
      running: false,
      cycleCount: 0
    });

    // NPC Architect
    this.agents.set('npc-architect', {
      id: 'npc-architect',
      agent: npcArchitectAgent,
      priority: 2,
      continuous: true,
      running: false,
      cycleCount: 0
    });

    // World Builder
    this.agents.set('world-builder', {
      id: 'world-builder',
      agent: worldBuilderAgent,
      priority: 3,
      continuous: true,
      running: false,
      cycleCount: 0
    });

    // Economy Designer
    this.agents.set('economy-designer', {
      id: 'economy-designer',
      agent: economyDesignerAgent,
      priority: 4,
      continuous: true,
      running: false,
      cycleCount: 0
    });

    // UI Craftsman
    this.agents.set('ui-craftsman', {
      id: 'ui-craftsman',
      agent: uiCraftsmanAgent,
      priority: 5,
      continuous: true,
      running: false,
      cycleCount: 0
    });

    // Test Runner
    this.agents.set('test-runner', {
      id: 'test-runner',
      agent: testRunnerAgent,
      priority: 6,
      continuous: true,
      running: false,
      cycleCount: 0
    });

    // Performance Profiler
    this.agents.set('performance-profiler', {
      id: 'performance-profiler',
      agent: performanceProfilerAgent,
      priority: 7,
      continuous: true,
      running: false,
      cycleCount: 0
    });

    // Documentation Generator
    this.agents.set('documentation-generator', {
      id: 'documentation-generator',
      agent: documentationGeneratorAgent,
      priority: 8,
      continuous: true,
      running: false,
      cycleCount: 0
    });

    // Security Auditor
    this.agents.set('security-auditor', {
      id: 'security-auditor',
      agent: securityAuditorAgent,
      priority: 9,
      continuous: true,
      running: false,
      cycleCount: 0
    });
  }

  async start() {
    if (this.running) {
      console.log('[Orchestrator] Already running')
      return
    }

    this.running = true
    console.log('='.repeat(50))
    console.log('[Orchestrator] Starting autonomous agents with FULL ACCESS')
    console.log('  - File system: read/write all project files')
    console.log('  - Build: npm run build')
    console.log('  - AI: ollama for code generation')
    console.log('  - Auto-fix: TypeScript errors')
    console.log('='.repeat(50))

    // Check build first
    try {
      console.log('[Orchestrator] Initial build check...')
      execSync('cd app && npm run build 2>&1', { encoding: 'utf-8', timeout: 120000 })
      console.log('[Orchestrator] Build OK!')
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      const errors = msg.split('\n').filter(l => l.includes('error TS')).slice(0, 5)
      console.log(`[Orchestrator] Build issues: ${errors.length}`)
      for (const err of errors) console.log('  ' + err)
    }

    // Start agents in priority order
    const sorted = Array.from(this.agents.values())
      .sort((a, b) => a.priority - b.priority)

    let concurrent = 0
    for (const agentConfig of sorted) {
      if (concurrent >= this.maxConcurrent) break
      this.launchAgent(agentConfig)
      concurrent++
    }

    console.log(`[Orchestrator] Launched ${concurrent} agents`)
  }

  private launchAgent(agentConfig: AutonomousAgent) {
    if (!agentConfig.continuous || agentConfig.running) return

    agentConfig.running = true

    // Run agent on interval
    const run = async () => {
      while (this.running && agentConfig.running && this.autoRun) {
        agentConfig.cycleCount++
        try {
          const start = Date.now()
          await agentConfig.agent.execute()
          const duration = Date.now() - start
          console.log(`[${agentConfig.id}] Cycle ${agentConfig.cycleCount} done in ${duration}ms`)

          // Brief pause between cycles
          await this.delay(this.cycleInterval)
        } catch (error) {
          console.error(`[${agentConfig.id}] Error:`, error)
          await this.delay(5000) // Longer delay on error
        }
      }
    }

    run()
    console.log(`[Orchestrator] Agent running: ${agentConfig.id}`)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  stop(agentId?: string) {
    if (agentId) {
      const agent = this.agents.get(agentId)
      if (agent) {
        agent.running = false
        console.log(`[Orchestrator] Stopped: ${agentId}`)
      }
    } else {
      this.running = false
      this.autoRun = false
      this.agents.forEach(a => a.running = false)
      console.log('[Orchestrator] All agents stopped')
    }
  }

  getStatus() {
    return Array.from(this.agents.values()).map(a => ({
      id: a.id,
      running: a.running,
      priority: a.priority,
      cycles: a.cycleCount
    }))
  }
}

export const orchestrator = new AutonomousOrchestrator()

// Auto-start in Node.js
if (typeof window === 'undefined') {
  // CLI mode - auto start
  console.log('[Orchestrator] Starting in standalone mode...')
  orchestrator.start()

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('[Orchestrator] Shutting down...')
    orchestrator.stop()
    process.exit(0)
  })
}