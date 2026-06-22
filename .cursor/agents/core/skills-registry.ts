/**
 * Skills Registry - 118+ Skills for AFK Game
 * Includes skill binding system for agents
 */

interface Skill {
  id: string
  name: string
  category: string
  description: string
}

class SkillsRegistry {
  private skills: Map<string, Skill> = new Map()
  constructor() { this.registerAll() }

  private registerAll() {
    const core = ['code-scaffold','type-generator','hook-creator','test-generator','mock-fabricator','refactor-assistant','lint-fix','dependency-analyzer','api-contract','schema-validator','code-validator','duplicate-fixer','import-normalizer']
    core.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: 'core', description: id }))
    const s3d = ['model-importer','texture-packer','material-creator','lighting-setup','animation-rigger','particle-system','postprocess-setup','level-optimizer','asset-bundler','gpu-profiler']
    s3d.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: '3d', description: id }))
    const ai = ['npc-generator','dialogue-builder','personality-model','gossip-propagator','memory-archiver','faction-manager','quest-generator','ai-behaviour-tree','emotion-engine','relationship-calculator']
    ai.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: 'ai', description: id }))
    const eco = ['economy-balancer','item-generator','price-calculator','trade-route-manager','caravan-simulator','market-analytics','crafting-engine','inventory-manager','loot-generator','currency-manager']
    eco.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: 'economy', description: id }))
    const world = ['world-generator','biome-creator','poi-manager','weather-system','day-night-cycle','ambient-manager','map-painter','landmark-placer','mini-map-generator','exploration-tracker']
    world.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: 'world', description: id }))
    const ui = ['panel-constructor','menu-builder','tooltip-generator','notification-manager','dialog-system','inventory-ui','minimap-overlay','hud-builder','accessibility-checker','responsive-adapter']
    ui.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: 'ui', description: id }))
    const audio = ['sound-designer','music-mixer','ambient-audio','voice-manager','audio-bundler','volume-balancer','spatial-audio','audio-loader','vocal-tracker','sfx-library']
    audio.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: 'audio', description: id }))
    const save = ['save-manager','cloud-sync','profile-manager','rollback-system','cloud-storage','cross-device-sync','backup-manager','conflict-resolver','encrypted-store','version-migrator']
    save.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: 'save', description: id }))
    const devops = ['build-automator','release-manager','version-bumper','changelog-generator','artifact-manager','deploy-automator','rollback-deployer','cdn-manager','rollback-manager','canary-deployer']
    devops.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: 'devops', description: id }))
    const int = ['github-automator','discord-bot','analytics-integration','telemetry-collector','crash-reporter','feature-flag-manager','ab-test-manager','notification-pusher','social-share','modding-api']
    int.forEach(id => this.register({ id, name: id.replace(/-/g,' '), category: 'integration', description: id }))
  }

  private register(skill: Skill) { this.skills.set(skill.id, skill) }
  get(id: string) { return this.skills.get(id) }
  byCategory(c: string) { return Array.from(this.skills.values()).filter(s => s.category === c) }
  all() { return Array.from(this.skills.values()) }
}

export const skillsRegistry = new SkillsRegistry()

// Skill Binding System - maps agents to their required skills
export type AgentSkillBinding = {
  agent: string
  skills: string[]
  description: string
}

export const AGENT_SKILL_BINDINGS: AgentSkillBinding[] = [
  { agent: 'economyDesigner', skills: ['economy-balancer','item-generator','price-calculator','trade-route-manager','caravan-simulator','market-analytics'], description: 'Economy generation' },
  { agent: 'npc-architect', skills: ['npc-generator','dialogue-builder','personality-model','gossip-propagator','memory-archiver','relationship-calculator'], description: 'NPC creation' },
  { agent: 'world-builder', skills: ['world-generator','biome-creator','poi-manager','weather-system','day-night-cycle','landmark-placer'], description: 'World generation' },
  { agent: 'ui-craftsman', skills: ['panel-constructor','menu-builder','tooltip-generator','notification-manager','hud-builder','accessibility-checker'], description: 'UI validation' },
  { agent: 'code-validator', skills: ['code-validator','duplicate-fixer','import-normalizer','dependency-analyzer'], description: 'Code validation' },
]

export function getSkillsForAgent(agentName: string): string[] {
  const binding = AGENT_SKILL_BINDINGS.find(b => b.agent === agentName)
  return binding?.skills ?? []
}