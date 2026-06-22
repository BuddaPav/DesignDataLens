// Stub for skills-registry (fallback from missing .cursor module)
export function getSkillsForAgent(agentType) {
  const skills = {
    'npc-architect': ['npc-generator', 'dialogue-writer'],
    'world-builder': ['terrain-generator', 'biome-planner'],
    'economyDesigner': ['economy-modeler', 'balance-calculator'],
    'ui-craftsman': ['ui-builder', 'animation-coder'],
    'codeBuilder': ['code-generator'],
    'documentationGenerator': ['doc-writer'],
    'securityAuditor': ['security-checker']
  };
  return skills[agentType] || [];
}