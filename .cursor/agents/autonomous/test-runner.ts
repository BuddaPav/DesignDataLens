/**
 * Test Runner Agent
 * Autonomous test execution and management
 */

import { Agent } from '../core/agent'
import { ollama } from '../core/ollama-client'
import { knowledgeGraph, rememberSuccess, rememberError } from '../core/knowledge-graph'

export const testRunnerAgent: Agent = {
  id: 'test-runner',
  name: 'Test Runner',
  description: 'Autonomous test execution and management',

  async execute(context?: Record<string, unknown>): Promise<boolean> {
    console.log('[TestRunner] Executing...')

    try {
      // Run tests
      const results = await this.runTests()
      console.log(`[TestRunner] Tests: ${results.passed}/${results.total} passed`)

      // Find failed tests
      if (results.failed > 0) {
        console.log(`[TestRunner] ${results.failed} tests failed`)
        const fixes = await this.suggestFixes(results.failures)
        console.log(`[TestRunner] Suggested fixes: ${fixes.length}`)
      }

      // Update coverage
      const coverage = await this.checkCoverage()
      console.log(`[TestRunner] Coverage: ${coverage}%`)

      return results.failed === 0
    } catch (error) {
      console.error('[TestRunner] Error:', error)
      rememberError('test-runner', String(error))
      return false
    }
  },

  async runTests(): Promise<{ passed: number; failed: number; total: number; failures: string[] }> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('npm test 2>&1', { cwd: 'app' }, (err, stdout, stderr) => {
        const output = stdout + stderr
        const passedMatch = output.match(/(\d+) passed/)
        const failedMatch = output.match(/(\d+) failed/)

        const passed = parseInt(passedMatch?.[1] || '0')
        const failed = parseInt(failedMatch?.[1] || '0')

        // Extract failure names
        const failureMatches = output.match(/FAIL.*?(?=PASS|FAIL|$)/g) || []
        const failures = failureMatches.map(f => f.replace(/FAIL /, '')).filter(Boolean)

        resolve({ passed, failed, total: passed + failed, failures: failures.slice(0, 10) })
      })
    })
  },

  async suggestFixes(failures: string[]): Promise<string[]> {
    const fixes: string[] = []

    for (const failure of failures) {
      const prompt = `Suggest a fix for this test failure:

${failure}

Provide the fix as a code snippet:`

      const fix = await ollama.generate(prompt, 'qwen2.5-coder:7b')
      fixes.push(fix)
    }

    return fixes
  },

  async checkCoverage(): Promise<number> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('npm run test:coverage 2>&1 | tail -20', { cwd: 'app' }, (err, stdout) => {
        const match = stdout.match(/All files.*?(\d+\.\d+)%/)
        resolve(parseFloat(match?.[1] || '0'))
      })
    })
  }
}