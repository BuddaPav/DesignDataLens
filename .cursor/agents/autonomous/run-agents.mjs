#!/usr/bin/env node
/**
 * Autonomous Agents Runner
 * Start all agents with full access to project, build, and AI
 * Run: node .cursor/agents/autonomous/run-agents.mjs
 */

import { orchestrator } from './orchestrator.ts'

console.log('========================================')
console.log('   AFK Game Autonomous Agents')
console.log('========================================')
console.log('')
console.log('Starting with FULL ACCESS:')
console.log('  - File system: read/write all project files')
console.log('  - Build system: npm build & test')
console.log('  - AI: ollama for code generation')
console.log('  - Auto-fix: TypeScript errors')
console.log('')

// Start the orchestrator
await orchestrator.start()

// Report status every 10 seconds
const interval = setInterval(() => {
  const status = orchestrator.getStatus()
  const running = status.filter(s => s.running).length
  console.log(`[Runner] ${running} agents running...`)
}, 10000)

// Handle shutdown
process.on('SIGINT', () => {
  console.log('[Runner] Shutting down...')
  clearInterval(interval)
  orchestrator.stop()
  process.exit(0)
})