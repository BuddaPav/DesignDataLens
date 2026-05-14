import type { NPC } from '@/types/game';
import type { Language } from '@/i18n';
import {
  CHRONOS_DEFEAT_OBJECTIVE_EXCLUDED_NPC_IDS,
  isNpcEligibleForGeneratedDefeatObjective,
} from '@/domain/npc/defeatObjectiveRules';

/**
 * MVP 064: в DEV показывает, какие NPC в локации допустимы для процедурного квеста `defeat_enemy`
 * (не сюжетные; приоритет `proc_*`).
 */
export function CombatQuestEligibilityDevPanel({ npcs, lang }: { npcs: NPC[]; lang: Language }) {
  const excluded = [...CHRONOS_DEFEAT_OBJECTIVE_EXCLUDED_NPC_IDS].join(', ');
  return (
    <aside
      className="pointer-events-none fixed bottom-4 right-4 z-[90] max-w-[min(100vw-2rem,18rem)] rounded-xl border border-amber-500/25 bg-slate-950/92 p-3 text-[11px] leading-snug text-amber-100/95 shadow-2xl backdrop-blur-md ring-1 ring-white/[0.04]"
      aria-hidden
    >
      <p className="pointer-events-none font-semibold uppercase tracking-wide text-amber-300/95">
        {lang === 'ru' ? 'Тест defeat_enemy (DEV)' : 'defeat_enemy test (DEV)'}
      </p>
      <ul className="pointer-events-none mt-2 max-h-36 space-y-0.5 overflow-y-auto font-mono text-[10px] text-slate-200/95">
        {npcs.length === 0 ? (
          <li className="text-slate-500">{lang === 'ru' ? '(нет NPC)' : '(no NPCs)'}</li>
        ) : (
          npcs.map((n) => (
            <li key={n.id} className="flex justify-between gap-2 border-b border-white/[0.04] py-0.5 last:border-0">
              <span className="min-w-0 truncate">{n.id}</span>
              <span className="shrink-0 text-emerald-400/95">
                {isNpcEligibleForGeneratedDefeatObjective(n) ? '✓' : '—'}
              </span>
            </li>
          ))
        )}
      </ul>
      <p className="pointer-events-none mt-2 border-t border-white/[0.06] pt-2 text-[10px] text-slate-500">
        {lang === 'ru' ? 'Исключены сюжетные:' : 'Story exclusions:'} {excluded || '—'}
      </p>
    </aside>
  );
}
