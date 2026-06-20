#!/usr/bin/env node
/**
 * CLI Runner for Autonomous System
 * Usage: node cli-runner.mjs start|status|stop
 */

import { systemRunner } from './system-runner.ts'

const args = process.argv.slice(2)
const command = args[0] || 'status'

async function main() {
  console.log('[CLI] Running command:', command)

  switch (command) {
    case 'start':
      await systemRunner.start()
      console.log('[CLI] Started!')
      break

    case 'status':
      console.log('[CLI] Status:', JSON.stringify(systemRunner.getStatus(), null, 2))
      break

    case 'stop':
      systemRunner.stop()
      console.log('[CLI] Stopped!')
      break

    default:
      console.log('[CLI] Unknown command:', command)
      console.log('[CLI] Usage: node cli-runner.mjs start|status|stop')
  }
}

main().catch(console.error)