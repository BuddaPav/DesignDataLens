import { describe, expect, it } from 'vitest';

import { resetNPCSystem } from '@/engine/NPCSystem';
import type { NPCMemory } from '@/types/game';

function mkMemory(i: number, text: string, importance = 5): NPCMemory {
  return {
    id: `m_${i}`,
    timestamp: Date.now() - i * 1_000,
    type: 'observation',
    content: text,
    importance,
    relatedEntities: [],
    emotionalValence: 0,
  };
}

describe('NPCSystem memory relevance', () => {
  it('caps memory size to prevent unbounded growth', () => {
    const npc = resetNPCSystem();
    for (let i = 0; i < 150; i++) {
      npc.addMemoryToNPC('elara', mkMemory(i, `memory_${i}`, 1 + (i % 9)));
    }
    const data = npc.exportData();
    const elara = data.npcs.find((n) => n.id === 'elara');
    expect((elara?.memories.length ?? 0) <= 120).toBe(true);
  });

  it('returns context-relevant memories first', () => {
    const npc = resetNPCSystem();
    npc.addMemoryToNPC('elara', mkMemory(1, 'player saved caravan near marsh', 9));
    npc.addMemoryToNPC('elara', mkMemory(2, 'quiet day at the inn', 3));
    npc.addMemoryToNPC('elara', mkMemory(3, 'marsh rumor about ruins', 8));
    const top = npc.getRelevantMemories('elara', 'marsh caravan');
    expect(top.length).toBeGreaterThan(0);
    expect(top[0]?.content.toLowerCase().includes('marsh')).toBe(true);
  });
});
