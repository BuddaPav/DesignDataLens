/**
 * Knowledge Graph - Persistent Knowledge Management
 * Stores learned patterns, decisions, and insights for agent self-improvement
 */

interface KnowledgeNode {
  id: string
  type: 'pattern' | 'decision' | 'insight' | 'error' | 'success'
  content: string
  context: string
  strength: number
  timestamp: number
  tags: string[]
  metadata: Record<string, unknown>
}

interface KnowledgeEdge {
  from: string
  to: string
  weight: number
  type: 'derives' | 'related' | 'conflicts' | 'supports'
}

interface KnowledgeQuery {
  tags?: string[]
  type?: KnowledgeNode['type']
  minStrength?: number
  since?: number
  limit?: number
}

class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map()
  private edges: Map<string, KnowledgeEdge[]> = new Map()
  private storageKey = 'afk-game-knowledge-graph'
  private maxNodes = 10000

  constructor() {
    this.load()
  }

  private load() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.nodes = new Map(data.nodes || [])
        this.edges = new Map(data.edges || [])
      }
    } catch (e) {
      console.warn('[KnowledgeGraph] Load failed:', e)
    }
  }

  private save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        nodes: Array.from(this.nodes.entries()),
        edges: Array.from(this.edges.entries())
      }))
    } catch (e) {
      console.warn('[KnowledgeGraph] Save failed:', e)
    }
  }

  add(node: Omit<KnowledgeNode, 'id' | 'timestamp'>): string {
    const id = `kn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const fullNode: KnowledgeNode = {
      ...node,
      id,
      timestamp: Date.now()
    }
    this.nodes.set(id, fullNode)
    if (!this.edges.has(id)) this.edges.set(id, [])

    // Prune if needed
    if (this.nodes.size > this.maxNodes) this.prune()
    this.save()
    return id
  }

  private prune() {
    const byStrength = Array.from(this.nodes.values())
      .sort((a, b) => a.strength - b.strength)
    const toRemove = byStrength.slice(0, Math.floor(this.maxNodes * 0.1))
    toRemove.forEach(n => {
      this.nodes.delete(n.id)
      this.edges.delete(n.id)
    })
  }

  link(from: string, to: string, type: KnowledgeEdge['type'], weight = 1.0) {
    if (!this.nodes.has(from) || !this.nodes.has(to)) return false
    const existing = this.edges.get(from) || []
    existing.push({ from, to, weight, type })
    this.edges.set(from, existing)
    this.save()
    return true
  }

  query(q: KnowledgeQuery): KnowledgeNode[] {
    let results = Array.from(this.nodes.values())
    if (q.tags?.length) {
      results = results.filter(n => q.tags!.some(t => n.tags.includes(t)))
    }
    if (q.type) results = results.filter(n => n.type === q.type)
    if (q.minStrength) results = results.filter(n => n.strength >= q.minStrength!)
    if (q.since) results = results.filter(n => n.timestamp >= q.since!)
    if (q.limit) results = results.slice(0, q.limit)
    return results
  }

  getRelated(nodeId: string): KnowledgeNode[] {
    const edges = this.edges.get(nodeId) || []
    return edges.map(e => this.nodes.get(e.to)).filter(Boolean) as KnowledgeNode[]
  }

  strengthen(nodeId: string, delta = 0.1) {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.strength = Math.min(1.0, node.strength + delta)
      this.save()
    }
  }

  weaken(nodeId: string, delta = 0.1) {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.strength = Math.max(0, node.strength - delta)
      this.save()
    }
  }

  stats() {
    return {
      totalNodes: this.nodes.size,
      byType: Array.from(this.nodes.values()).reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      avgStrength: Array.from(this.nodes.values()).reduce((s, n) => s + n.strength, 0) / Math.max(1, this.nodes.size)
    }
  }

  clear() {
    this.nodes.clear()
    this.edges.clear()
    this.save()
  }
}

export const knowledgeGraph = new KnowledgeGraph()

// Quick helpers
export function remember(pattern: string, context: string, tags: string[]) {
  return knowledgeGraph.add({
    type: 'pattern',
    content: pattern,
    context,
    strength: 0.5,
    tags,
    metadata: {}
  })
}

export function rememberSuccess(action: string, result: string) {
  return knowledgeGraph.add({
    type: 'success',
    content: action,
    context: result,
    strength: 0.8,
    tags: ['success'],
    metadata: {}
  })
}

export function rememberError(action: string, error: string) {
  return knowledgeGraph.add({
    type: 'error',
    content: action,
    context: error,
    strength: 0.3,
    tags: ['error', 'avoid'],
    metadata: { error: true }
  })
}

export function recall(tags: string[], limit = 10) {
  return knowledgeGraph.query({ tags, limit })
}