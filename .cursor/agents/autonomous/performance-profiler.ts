/**
 * Performance Profiler Agent
 * Autonomous performance analysis and optimization
 */

import { Agent } from '../core/agent'
import { ollama } from '../core/ollama-client'
import { knowledgeGraph, rememberSuccess, rememberError } from '../core/knowledge-graph'

export const performanceProfilerAgent: Agent = {
  id: 'performance-profiler',
  name: 'Performance Profiler',
  description: 'Autonomous performance analysis and optimization',

  async execute(context?: Record<string, unknown>): Promise<boolean> {
    console.log('[PerformanceProfiler] Executing...')

    try {
      // Profile bundle size
      const bundle = await this.profileBundle()
      console.log(`[PerformanceProfiler] Bundle: ${bundle.size}KB`)

      // Check for performance issues
      const issues = await this.findIssues()
      if (issues.length > 0) {
        console.log(`[PerformanceProfiler] ${issues.length} issues found`)
        // Analyze with AI
        const analysis = await ollama.analyzeCode(issues.join('\n'))
        console.log(`[PerformanceProfiler] Analysis: ${analysis.slice(0, 200)}...`)
      }

      // Check render performance
      const renders = await this.checkRenders()
      console.log(`[PerformanceProfiler] Render checks: ${renders}`)

      return true
    } catch (error) {
      console.error('[PerformanceProfiler] Error:', error)
      rememberError('performance-profiler', String(error))
      return false
    }
  },

  async profileBundle(): Promise<{ size: number; files: number }> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('npm run build 2>&1 | grep "total" | head -1', { cwd: 'app' }, (err, stdout) => {
        const size = parseInt(stdout.match(/(\d+)/)?.[1] || '0')
        resolve({ size, files: 1 })
      })
    })
  },

  async findIssues(): Promise<string[]> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('grep -r "useEffect\\|useMemo\\|useCallback" app/src --include="*.tsx" | head -20', (err, stdout) => {
        if (err) resolve([])
        resolve(stdout.split('\n').filter(Boolean).slice(0, 10))
      })
    })
  },

  async checkRenders(): Promise<number> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('grep -r "React.memo" app/src --include="*.tsx" | wc -l', (err, stdout) => {
        resolve(parseInt(stdout.trim()) || 0)
      })
    })
  }
}