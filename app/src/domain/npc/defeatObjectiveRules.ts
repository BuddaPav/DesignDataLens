import type { NPC } from '@/types/game';

/** Сюжетные NPC — недоступны как цель процедурного «устранить угрозу». */
export const CHRONOS_DEFEAT_OBJECTIVE_EXCLUDED_NPC_IDS = new Set<string>(['elara', 'thorin']);

/**
 * MVP 064: безопасные цели для процедурного квеста defeat_enemy — процедурные NPC (`proc_*`)
 * и явный allowlist именованных не-сюжетных бойцов (если появятся в контенте).
 */
export const CHRONOS_DEFEAT_OBJECTIVE_NAMED_SAFE_IDS = new Set<string>([]);

export function isNpcEligibleForGeneratedDefeatObjective(npc: Pick<NPC, 'id' | 'status'>): boolean {
  if (npc.status !== 'alive') return false;
  if (CHRONOS_DEFEAT_OBJECTIVE_EXCLUDED_NPC_IDS.has(npc.id)) return false;
  if (npc.id.startsWith('proc_')) return true;
  return CHRONOS_DEFEAT_OBJECTIVE_NAMED_SAFE_IDS.has(npc.id);
}

/** Список id для контекста генерации квестов в текущей локации. */
export function collectEligibleDefeatNpcIdsForQuestGeneration(npcsInLocation: NPC[]): string[] {
  return npcsInLocation.filter(isNpcEligibleForGeneratedDefeatObjective).map((n) => n.id);
}
