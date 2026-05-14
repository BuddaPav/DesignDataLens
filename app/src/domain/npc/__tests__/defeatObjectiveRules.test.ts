import { describe, expect, it } from 'vitest';
import {
  CHRONOS_DEFEAT_OBJECTIVE_EXCLUDED_NPC_IDS,
  collectEligibleDefeatNpcIdsForQuestGeneration,
  isNpcEligibleForGeneratedDefeatObjective,
} from '@/domain/npc/defeatObjectiveRules';
import type { NPC } from '@/types/game';

describe('defeatObjectiveRules', () => {
  it('excludes story NPC ids', () => {
    const id = [...CHRONOS_DEFEAT_OBJECTIVE_EXCLUDED_NPC_IDS][0];
    expect(id).toBeDefined();
    expect(isNpcEligibleForGeneratedDefeatObjective({ id: id!, status: 'alive' })).toBe(false);
  });

  it('allows proc_*', () => {
    expect(isNpcEligibleForGeneratedDefeatObjective({ id: 'proc_bandit_1', status: 'alive' })).toBe(true);
  });

  it('collectEligibleDefeatNpcIdsForQuestGeneration filters list', () => {
    const list = collectEligibleDefeatNpcIdsForQuestGeneration([
      { id: 'elara', status: 'alive' } as NPC,
      { id: 'proc_x', status: 'alive' } as NPC,
      { id: 'thorin', status: 'alive' } as NPC,
    ]);
    expect(list).toEqual(['proc_x']);
  });
});
