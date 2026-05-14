import { describe, expect, it, vi } from 'vitest';
import { NPCSystem } from '@/engine/NPCSystem';
import { driftMentalState } from '@/engine/psychology';

describe('NPCSystem.simulateNPCTurn', () => {
  it('применяет driftMentalState ровно на hoursElapsed (без второго дубля)', () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const sys = new NPCSystem();
    const npc = sys.getNPC('elara');
    expect(npc).toBeDefined();
    const before = { ...npc!.mentalState };

    sys.simulateNPCTurn('elara', 10, 12);

    const expected = driftMentalState(before, 10);
    expect(npc!.mentalState.stress).toBeCloseTo(expected.stress, 5);
    expect(npc!.mentalState.happiness).toBeCloseTo(expected.happiness, 5);
    expect(npc!.mentalState.trauma).toBeCloseTo(expected.trauma, 5);

    rnd.mockRestore();
  });
});
