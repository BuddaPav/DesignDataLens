/**
 * Индивидуальность NPC в социальном слое: как «спин» отношений искажает
 * распространяемый заряд встречи (слухи, доверие соседей, локальная репутация).
 */
import type { NPCPersonality, Relationship } from '@/types/game';

/** Заряд события после учёта типа отношений (тот же знак, что и сырой импакт, но масштаб/инверсия). */
export function effectiveGossipImpact(relationship: Relationship, rawImpact: number): number {
  if (!Number.isFinite(rawImpact)) return 0;

  const t = relationship.trust;
  const type = relationship.type;

  if (type === 'enemy' || t <= -60) {
    if (rawImpact > 0) return -Math.abs(rawImpact) * 0.88;
    return rawImpact * 1.18;
  }
  if (type === 'rival' || t < -28) {
    if (rawImpact > 0) return -Math.abs(rawImpact) * 0.42;
    return rawImpact * 1.08;
  }
  if (type === 'lover' || (t > 72 && relationship.affection > 65)) {
    return rawImpact > 0 ? rawImpact * 1.28 : rawImpact * 0.62;
  }
  if (type === 'close_friend' || (t > 55 && relationship.affection > 38)) {
    return rawImpact > 0 ? rawImpact * 1.16 : rawImpact * 0.72;
  }
  if (type === 'friend' || t > 28) {
    return rawImpact > 0 ? rawImpact * 1.08 : rawImpact * 0.82;
  }
  return rawImpact;
}

const IMPACT_FLOOR = 0.38;

export function shouldNpcSpreadGossip(args: {
  locationId: string | undefined;
  personality: NPCPersonality;
  relationship: Relationship;
  effectiveImpact: number;
}): boolean {
  const { locationId, personality, relationship, effectiveImpact } = args;
  if (!locationId) return false;
  if (!Number.isFinite(effectiveImpact) || Math.abs(effectiveImpact) < IMPACT_FLOOR) return false;

  if (personality.extraversion > 0.62) return true;
  if (relationship.trust < -32 && personality.neuroticism > 0.5) return true;
  if (relationship.trust > 52 && relationship.affection > 42 && personality.agreeableness > 0.44) return true;
  return false;
}
