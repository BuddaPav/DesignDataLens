/**
 * Agent Interface - Base agent definition
 */

export interface Agent {
  id: string
  name: string
  description: string
  execute(context?: Record<string, unknown>): Promise<boolean>
}

export interface AgentResult {
  success: boolean
  message?: string
  data?: unknown
}

export class AgentRunner {
  private agents: Map<string, Agent> = new Map()

  register(agent: Agent) {
    this.agents.set(agent.id, agent)
  }

  async run(agentId: string, context?: Record<string, unknown>): Promise<AgentResult> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      return { success: false, message: `Agent ${agentId} not found` }
    }

    try {
      const success = await agent.execute(context)
      return { success, message: success ? 'OK' : 'Failed' }
    } catch (error) {
      return { success: false, message: String(error) }
    }
  }

  list(): Agent[] {
    return Array.from(this.agents.values())
  }
}

export const agentRunner = new AgentRunner()