/**
 * Если NPC, близкий к погибшему союзнику, узнаёт о смерти — доверие к игроку может упасть.
 */
export const GRUDGE_ALLY_TRUST_THRESHOLD = 42;

export function trustDeltaTowardPlayerFromAllyDeath(npcToDeceasedTrust: number): number {
  if (!Number.isFinite(npcToDeceasedTrust)) return 0;
  if (npcToDeceasedTrust < GRUDGE_ALLY_TRUST_THRESHOLD) return 0;
  return -Math.min(30, Math.round((npcToDeceasedTrust - 35) * 0.32));
}
