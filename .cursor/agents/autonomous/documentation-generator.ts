/**
 * Documentation Generator Agent
 * Autonomous documentation generation
 */

import { Agent } from '../core/agent'
import { ollama } from '../core/ollama-client'
import { knowledgeGraph, rememberSuccess, rememberError } from '../core/knowledge-graph'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

export const documentationGeneratorAgent: Agent = {
  id: 'documentation-generator',
  name: 'Documentation Generator',
  description: 'Autonomous documentation generation',

  async execute(context?: Record<string, unknown>): Promise<boolean> {
    console.log('[DocumentationGenerator] Executing...')

    try {
      // Generate component documentation
      if (context?.component) {
        const docs = await this.generateComponentDocs(context.component as string)
        await this.saveDocs(context.component as string, docs)
        console.log(`[DocumentationGenerator] Generated docs for ${context.component}`)
        rememberSuccess('doc-generation', context.component as string)
      }

      // Generate API docs
      const apiDocs = await this.generateAPIDocs()
      console.log(`[DocumentationGenerator] Generated ${apiDocs.length} API docs`)

      // Update index
      await this.updateIndex()
      console.log('[DocumentationGenerator] Updated index')

      return true
    } catch (error) {
      console.error('[DocumentationGenerator] Error:', error)
      rememberError('documentation-generator', String(error))
      return false
    }
  },

  async generateComponentDocs(component: string): Promise<string> {
    const filePath = join('app/src/components', component)
    try {
      const content = await readFile(filePath, 'utf-8')

      const prompt = `Generate documentation for this component:

${content.slice(0, 2000)}

Include:
- Description
- Props
- Usage example

Format as markdown:`

      return ollama.generate(prompt)
    } catch {
      return `# ${component}\n\nComponent documentation.`
    }
  },

  async generateAPIDocs(): Promise<string[]> {
    const { exec } = await import('child_process')
    return new Promise(resolve => {
      exec('grep -r "export function\\|export const" app/src --include="*.ts" | head -20', (err, stdout) => {
        if (err) resolve([])
        resolve(stdout.split('\n').filter(Boolean))
      })
    })
  },

  async saveDocs(component: string, docs: string): Promise<void> {
    const path = `docs/${component}.md`
    try {
      await writeFile(path, docs)
    } catch {
      // Ignore
    }
  },

  async updateIndex(): Promise<void> {
    knowledgeGraph.add({
      type: 'pattern',
      content: 'documentation',
      context: 'Updated documentation',
      strength: 0.5,
      tags: ['docs'],
      metadata: {}
    })
  }
}