/**
 * Code Builder Agent
 * Enhanced autonomous code generation and refactoring with full console and source access
 */

import { Agent } from '../core/agent'
import { ollama } from '../core/ollama-client'
import { knowledgeGraph, rememberSuccess, rememberError } from '../core/knowledge-graph'
import { gitIntegration } from '../core/git-integration'
import { skillsRegistry } from '../core/skills-registry'
import { readFile, writeFile, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { execSync, spawn } from 'child_process'

// Access to all project files for autonomous learning
const PROJECT_ROOT = process.cwd()

interface CodeTask {
  type: 'generate' | 'refactor' | 'analyze' | 'fix' | 'build' | 'test'
  target: string
  spec?: string
}

function log(message: string, ...args: unknown[]) {
  console.log(`[CodeBuilder] ${message}`, ...args)
}

function error(message: string, ...args: unknown[]) {
  console.error(`[CodeBuilder] ERROR: ${message}`, ...args)
}

export const codeBuilderAgent: Agent = {
  id: 'code-builder',
  name: 'Code Builder',
  description: 'Autonomous code with full console & source access',

  async execute(context?: Record<string, unknown>): Promise<boolean> {
    log('Starting with full capabilities...')

    try {
      // 1. Scan all project files
      const codeFiles = await this.scanForCode()
      log(`Found ${codeFiles.length} code files`)

      // 2. Run TypeScript build to find errors
      const buildErrors = await this.runBuild()
      if (buildErrors.length > 0) {
        log(`Build errors: ${buildErrors.length}`)
        // Try to auto-fix first error
        await this.autoFixErrors(buildErrors)
      } else {
        log('Build clean!')
      }

      // 3. Find TODO/FIXME comments
      const issues = await this.findIssues()
      if (issues.length > 0) {
        log(`Found ${issues.length} TODO/FIXME`)
      }

      // 4. Learn from dependencies
      await this.learnDependencies()

      // 5. Generate code if context provided
      if (context?.spec) {
        const code = await this.generateCode(context.spec as string)
        log(`Generated: ${code.slice(0, 80)}...`)
        rememberSuccess('code-generation', context.spec as string)
      }

      return true
    } catch (err) {
      error('Execution failed:', err)
      rememberError('code-builder', String(err))
      return false
    }
  },

  // Scan ALL TypeScript files in project
  async scanForCode(): Promise<string[]> {
    const files: string[] = []

    function walk(dir: string) {
      try {
        const items = readdirSync(dir, { withFileTypes: true })
        for (const item of items) {
          const full = join(dir, item.name)
          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'production') {
            walk(full)
          } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
            files.push(full)
          }
        }
      } catch { /* skip errors */ }
    }

    walk(join(PROJECT_ROOT, 'app', 'src'))
    return files
  },

  // Run build and capture errors
  async runBuild(): Promise<string[]> {
    log('Running build...')
    try {
      const output = execSync('cd app && npm run build 2>&1', { encoding: 'utf-8', timeout: 120000 })
      return output.includes('error TS') ? output.split('\n').filter(l => l.includes('error TS')).slice(0, 10) : []
    } catch (e: unknown) {
      const output = e instanceof Error ? e.message : ''
      return output.split('\n').filter(l => l.includes('error TS')).slice(0, 10)
    }
  },

  // Auto-fix TypeScript errors
  async autoFixErrors(errors: string[]): Promise<void> {
    if (errors.length === 0) return
    log(`Attempting to fix ${errors.length} errors...`)

    for (const err of errors.slice(0, 3)) {
      const match = err.match(/src[/\\](.+\.[tj]sx?)\((\d+),\d+\): error TS(\d+): (.+)/)
      if (!match) continue

      const [, file, line, code, message] = match
      log(`Analyzing: ${file}:${line} - ${message}`)

      // Read file and get context
      try {
        const content = await readFile(join(PROJECT_ROOT, 'app', file), 'utf-8')
        const lines = content.split('\n')
        const context = lines.slice(Math.max(0, parseInt(line) - 10), parseInt(line) + 5).join('\n')

        // Use AI to suggest fix
        const fix = await ollama.generate(
          `Fix this TypeScript error (${code}): ${message}\n\nFile: ${file}\nContext:\n${context}\n\nProvide the exact fix:`,
          'qwen2.5-coder:7b'
        )
        log(`AI suggest: ${fix.slice(0, 100)}`)
        rememberSuccess('fix', `${file}:${line}`)
      } catch (e) {
        log(`Could not fix: ${e}`)
      }
    }
  },

  // Find all TODO/FIXME
  async findIssues(): Promise<string[]> {
    const issues: string[] = []
    try {
      const output = execSync('grep -rn "TODO\\|FIXME" app/src --include="*.ts" --include="*.tsx" | head -20', { encoding: 'utf-8' })
      issues.push(...output.split('\n').filter(Boolean))
    } catch { /* none found */ }
    return issues
  },

  // Learn from package.json dependencies
  async learnDependencies(): Promise<void> {
    try {
      const pkg = await readFile(join(PROJECT_ROOT, 'app', 'package.json'), 'utf-8')
      const deps = JSON.parse(pkg)
      const libraries = Object.keys({ ...deps.dependencies, ...deps.devDependencies })
      log(`Dependencies: ${libraries.length} packages`)
      rememberSuccess('dependencies', libraries.join(', '))
    } catch (e) {
      log(`Could not read dependencies: ${e}`)
    }
  },

  async generateCode(spec: string): Promise<string> {
    const prompt = `Generate TypeScript code for this specification:

${spec}

Provide clean, well-typed code:`

    return ollama.generate(prompt, 'qwen2.5-coder:7b')
  },

  async fixIssue(issue: string): Promise<string> {
    const { exec } = await import('child_process')
    const { readFile } = await import('fs/promises')

    // Extract file path from issue
    const match = issue.match(/([^:]+\.[tj]sx?):(\d+)/)
    if (!match) return 'Could not parse issue'

    const [, filePath, line] = match
    try {
      const content = await readFile(filePath, 'utf-8')
      const context = content.split('\n').slice(Math.max(0, parseInt(line) - 5), parseInt(line) + 5).join('\n')

      return ollama.suggestFix(issue, context)
    } catch {
      return 'Error reading file'
    }
  }
}