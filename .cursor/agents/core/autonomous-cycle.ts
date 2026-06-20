/**
 * Autonomous Cycle Runner - 24/7 Working Cycle
 * Self-improving agent that continuously works on the project
 */

import { skillsRegistry } from './skills-registry'
import { knowledgeGraph, rememberSuccess, rememberError, recall } from './knowledge-graph'
import { ollama } from './ollama-client'
import { evolutionEngine } from './evolution-engine'

interface WorkItem {
  id: string
  priority: number
  description: string
  skills: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  attempts: number
  maxAttempts: number
  createdAt: number
  lastAttempt?: number
  result?: string
  tags: string[]
}

interface CycleState {
  running: boolean
  cycleCount: number
  lastCycle: number
  successCount: number
  failCount: number
  currentWork?: WorkItem
}

class AutonomousCycle {
  private state: CycleState = {
    running: false,
    cycleCount: 0,
    lastCycle: 0,
    successCount: 0,
    failCount: 0
  }
  private workQueue: WorkItem[] = []
  private cycleInterval = 60000 // 1 minute between cycles
  private maxQueueSize = 50
  private tickInterval?: ReturnType<typeof setInterval>
  private lastAnalysis = 0
  private analysisInterval = 300000 // 5 minutes between analyses

  constructor() {
    this.loadState()
    this.populateInitialWork()
  }

  private loadState() {
    try {
      const stored = localStorage.getItem('afk-autonomous-state')
      if (stored) {
        this.state = { ...this.state, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.warn('[AutonomousCycle] Load state failed:', e)
    }
  }

  private saveState() {
    try {
      localStorage.setItem('afk-autonomous-state', JSON.stringify(this.state))
    } catch (e) {
      console.warn('[AutonomousCycle] Save state failed:', e)
    }
  }

  private populateInitialWork() {
    const initial = [
      { priority: 1, description: 'Analyze code for bugs', skills: ['code-scaffold'], tags: ['analysis'] },
      { priority: 2, description: 'Check test coverage', skills: ['test-generator'], tags: ['testing'] },
      { priority: 3, description: 'Review dependencies', skills: ['dependency-analyzer'], tags: ['architecture'] },
      { priority: 4, description: 'Optimize performance', skills: ['gpu-profiler'], tags: ['performance'] },
      { priority: 5, description: 'Run lint checks', skills: ['lint-fix'], tags: ['quality'] }
    ]
    initial.forEach(item => this.queueWork(item))
  }

  queueWork(item: Omit<WorkItem, 'id' | 'status' | 'attempts' | 'createdAt'>) {
    if (this.workQueue.length >= this.maxQueueSize) return false
    const work: WorkItem = {
      ...item,
      id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now()
    }
    this.workQueue.push(work)
    this.sortQueue()
    return true
  }

  private sortQueue() {
    this.workQueue.sort((a, b) => {
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1
      if (a.status === 'pending' && b.status === 'pending') return a.priority - b.priority
      return 0
    })
  }

  start() {
    if (this.state.running) return
    this.state.running = true
    console.log('[AutonomousCycle] Starting 24/7 cycle...')
    this.tick()
    this.tickInterval = setInterval(() => this.tick(), this.cycleInterval)
    this.saveState()
  }

  stop() {
    this.state.running = false
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = undefined
    }
    console.log('[AutonomousCycle] Stopped')
    this.saveState()
  }

  private async tick() {
    this.state.cycleCount++
    this.state.lastCycle = Date.now()
    console.log(`[AutonomousCycle] Cycle ${this.state.cycleCount}`)

    try {
      // Periodic analysis
      if (Date.now() - this.lastAnalysis > this.analysisInterval) {
        await this.analyze()
        this.lastAnalysis = Date.now()
      }

      // Get next work item
      const work = this.getNextWork()
      if (!work) {
        console.log('[AutonomousCycle] No work available')
        return
      }

      // Execute work
      this.state.currentWork = work
      work.status = 'in_progress'
      work.lastAttempt = Date.now()

      const result = await this.executeWork(work)

      // Check result
      if (result.success) {
        work.status = 'completed'
        this.state.successCount++
        rememberSuccess(work.description, result.message)
        console.log(`[AutonomousCycle] Success: ${work.description}`)
      } else {
        work.attempts++
        if (work.attempts >= work.maxAttempts) {
          work.status = 'failed'
          this.state.failCount++
          rememberError(work.description, result.message)
          console.log(`[AutonomousCycle] Failed: ${work.description}`)
        } else {
          work.status = 'pending'
        }
      }

      work.result = result.message

      // Record in evolution engine
      await evolutionEngine.evolve(
        { id: work.id, description: work.description, skills: work.skills },
        { attempts: work.attempts },
        result
      )

      this.saveState()
    } catch (error) {
      console.error('[AutonomousCycle] Tick error:', error)
    }
  }

  private getNextWork(): WorkItem | undefined {
    this.sortQueue()
    return this.workQueue.find(w => w.status === 'pending')
  }

  private async executeWork(work: WorkItem): Promise<{ success: boolean; message: string }> {
    const skills = work.skills.map(id => skillsRegistry.get(id)).filter(Boolean)

    if (skills.length === 0) {
      return { success: false, message: 'No valid skills found' }
    }

    try {
      // Use AI to analyze and suggest action
      const context = `Work: ${work.description}\nSkills: ${work.skills.join(', ')}`
      const recentLearnings = recall(work.tags, 3)
      const contextWithLearning = recentLearnings.length > 0
        ? `${context}\nPrevious learnings: ${recentLearnings.map(l => l.content).join('; ')}`
        : context

      const prompt = `Analyze this work item and suggest the best approach:\n${contextWithLearning}`
      const analysis = await ollama.chat([
        { role: 'system', content: 'You are an expert code analyzer. Provide actionable suggestions.' },
        { role: 'user', content: prompt }
      ])

      // Simplified execution - just mark as success with analysis
      // In a full implementation, this would execute actual work
      console.log(`[AutonomousCycle] Analysis: ${analysis.slice(0, 200)}`)

      return { success: true, message: analysis.slice(0, 500) }
    } catch (error) {
      return { success: false, message: String(error) }
    }
  }

  private async analyze() {
    console.log('[AutonomousCycle] Running periodic analysis...')
    try {
      const stats = {
        queueSize: this.workQueue.length,
        successRate: this.state.successCount / Math.max(1, this.state.cycleCount),
        successCount: this.state.successCount,
        failCount: this.state.failCount,
        knowledgeStats: knowledgeGraph.stats()
      }

      // Queue more work based on analysis
      if (stats.queueSize < 10) {
        this.queueWork({
          priority: 5,
          description: 'Review code quality',
          skills: ['refactor-assistant'],
          tags: ['quality'],
          maxAttempts: 3
        })
      }

      console.log('[AutonomousCycle] Analysis complete:', stats)
    } catch (error) {
      console.error('[AutonomousCycle] Analysis error:', error)
    }
  }

  getStatus() {
    return {
      ...this.state,
      queueSize: this.workQueue.length,
      pendingWork: this.workQueue.filter(w => w.status === 'pending').length,
      inProgressWork: this.workQueue.filter(w => w.status === 'in_progress').length
    }
  }

  getQueue() {
    return [...this.workQueue]
  }
}

export const autonomousCycle = new AutonomousCycle()