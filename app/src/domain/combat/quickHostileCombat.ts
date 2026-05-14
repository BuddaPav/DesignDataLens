import type { NPC, Player } from '@/types/game';
import { npcHudStatusKind } from '@/domain/assets/npcPortraitDisplay';
import { isNpcEligibleForGeneratedDefeatObjective } from '@/domain/npc/defeatObjectiveRules';

// DECISION: lethal outcome in panel combat reuses defeat_enemy eligibility (proc_* + allowlist, no story keys) so narrative-critical NPCs cannot die here; alternative was separate combat allowlist — rejected to avoid drift.

/** Урон здоровью игрока при поражении в быстрой схватке (MVP-бой из панели NPC). */
export const CHRONOS_QUICK_COMBAT_LOSS_HP = 18;

/** Игрок сильнее базы NPC на эту величину — гарантированная победа при roll=0. */
const PLAYER_POWER_BIAS = 4;

export type QuickHostileCombatOutcome = 'player_wins' | 'player_loses';

/**
 * Враждебность по тем же правилам, что и иконка HUD (враг / соперник / низкое доверие).
 */
export function isNpcHostileForQuickCombat(npc: Pick<NPC, 'status' | 'mentalState' | 'playerRelationship'>): boolean {
  if (npc.status !== 'alive') return false;
  return npcHudStatusKind(npc as NPC) === 'hostile';
}

/**
 * Те же id, что и для квеста defeat_enemy: lethal kill в бою только для «безопасных» целей.
 */
export function canLethallyKillNpcInCombat(npc: Pick<NPC, 'id' | 'status'>): boolean {
  return isNpcEligibleForGeneratedDefeatObjective(npc);
}

export interface QuickHostileCombatInput {
  player: Pick<Player, 'stats' | 'character'>;
  npc: Pick<NPC, 'attributes' | 'level'>;
  /** Детерминированный сдвиг [0, 1); в проде — Math.random(). */
  roll: number;
}

/**
 * Упрощённое сравнение силы: сила игрока + доля HP против сила+уровень NPC + случайная вариация.
 */
export function resolveQuickHostileCombat(input: QuickHostileCombatInput): QuickHostileCombatOutcome {
  const r = Math.min(0.999999, Math.max(0, input.roll));
  const ps = input.player.character.attributes.strength;
  const ph = input.player.stats.health;
  const pm = Math.max(1, input.player.stats.maxHealth);
  const ns = input.npc.attributes.strength;
  const nl = Math.max(1, input.npc.level);

  const playerPower = ps * 10 + (ph / pm) * 35 + PLAYER_POWER_BIAS;
  const npcPower = ns * 9 + nl * 6 + r * 28;

  return playerPower >= npcPower ? 'player_wins' : 'player_loses';
}
