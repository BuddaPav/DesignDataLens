import { MapPinned, Swords } from 'lucide-react';
import type { EnemyCoalition, NPC } from '@/types/game';
import type { Language } from '@/i18n';
import { t } from '@/i18n';
import { Button } from '@/components/ui/button';

function leaderName(npcs: NPC[], leaderId: string): string {
  return npcs.find((n) => n.id === leaderId)?.name ?? leaderId;
}

export interface EnemyCoalitionBarProps {
  coalitions: EnemyCoalition[];
  npcs: NPC[];
  lang: Language;
  onOpenWorldCoalitions: () => void;
  onOpenTacticalMap: () => void;
}

/**
 * Компактная полоска угроз при активных коалициях врагов — видна без открытия панели «Мир».
 */
export function EnemyCoalitionBar({
  coalitions,
  npcs,
  lang,
  onOpenWorldCoalitions,
  onOpenTacticalMap,
}: EnemyCoalitionBarProps) {
  if (!coalitions.length) return null;

  const first = coalitions[0]!;
  const extra = coalitions.length - 1;
  const leader = leaderName(npcs, first.leaderNpcId);
  const subtitle =
    extra > 0
      ? t('game.coalition_bar_more', lang).replace('{{n}}', String(extra))
      : t('game.coalition_bar_members', lang).replace('{{n}}', String(first.memberNpcIds.length));

  return (
    <div
      role="status"
      className="border-b border-rose-900/40 bg-gradient-to-r from-rose-950/80 via-slate-950/90 to-rose-950/70 px-3 py-2 text-sm text-rose-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Swords className="h-4 w-4 shrink-0 text-rose-400" aria-hidden />
          <div className="min-w-0">
            <p className="truncate font-medium text-rose-50">
              {t('game.coalition_bar_title', lang).replace('{{leader}}', leader)}
            </p>
            <p className="truncate text-xs text-rose-200/70">{subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-rose-800/60 bg-rose-950/40 text-xs text-rose-100 hover:bg-rose-900/50"
            onClick={() => {
              onOpenTacticalMap();
            }}
          >
            <MapPinned className="mr-1.5 h-3.5 w-3.5" />
            {t('game.coalition_bar_map', lang)}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 bg-rose-800/50 text-xs text-rose-50 hover:bg-rose-700/60"
            onClick={() => {
              onOpenWorldCoalitions();
            }}
          >
            {t('game.coalition_bar_details', lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}
