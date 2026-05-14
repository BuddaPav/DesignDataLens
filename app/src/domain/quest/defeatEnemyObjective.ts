import type { Language } from '@/i18n';
import { t } from '@/i18n';
import type { Player, WorldLogEntry } from '@/types/game';
import { pushWorldLog } from '@/engine/worldEvents';

/**
 * После npc_mark_dead: зачесть цели defeat_enemy, обновить статистику, строку журнала о бое.
 * Идемпотентно по квесту: одна и та же цель не даст двойного зачёта при повторном вызове.
 */
export function applyDefeatEnemyProgressForMarkedDead(
  player: Player,
  npcId: string,
  lang: Language,
  log: WorldLogEntry[],
): Player {
  const id = npcId.trim();
  if (!id) return player;

  let anyObjectiveDone = false;

  const activeQuests = player.storyProgress.activeQuests.map((q) => {
    let qTouch = false;
    const objectives = q.objectives.map((o) => {
      if (o.type !== 'defeat_enemy' || o.completed || o.target !== id) return o;
      qTouch = true;
      anyObjectiveDone = true;
      return { ...o, completed: true, current: o.required };
    });
    return qTouch ? { ...q, objectives } : q;
  });

  if (!anyObjectiveDone) return player;

  const line = t('game.log.battle_completed_world', lang).replace('{{id}}', id);
  pushWorldLog(log, line, 'dramatic', 'combat');

  return {
    ...player,
    stats: {
      ...player.stats,
      enemiesDefeated: player.stats.enemiesDefeated + 1,
      battlesWon: player.stats.battlesWon + 1,
    },
    storyProgress: {
      ...player.storyProgress,
      activeQuests,
      worldEventLog: log,
    },
  };
}
