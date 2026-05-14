// Quest Panel - Shows active and completed quests

import { BookOpen, CheckCircle, Circle, Sparkles, Plus, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Quest } from '@/types/game';
import type { Language } from '@/i18n';
import { t } from '@/i18n';
import { CHRONOS_CORE_FACTION_IDS } from '@/domain/social/factionReputationRules';
import { getLocationStanding } from '@/domain/social/locationReputation';

interface QuestPanelProps {
  activeQuests: Quest[];
  completedQuests: string[];
  currentQuest: Quest | null;
  onGenerateQuest: (type: 'main' | 'side' | 'character') => void;
  factionReputation?: Record<string, number>;
  /** Карта репутации с ключами `location:*` и др. */
  playerReputation?: Map<string, number>;
  currentLocationId?: string;
  lang: Language;
}

export function QuestPanel({
  activeQuests,
  completedQuests,
  currentQuest,
  onGenerateQuest,
  factionReputation,
  playerReputation,
  currentLocationId,
  lang,
}: QuestPanelProps) {
  const localStanding =
    playerReputation && currentLocationId
      ? getLocationStanding(playerReputation, currentLocationId)
      : null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Globe2 className="h-4 w-4 text-[var(--chronos-primary-hex)]" />
          {t('game.world_rep_heading', lang)}
        </h3>
        {localStanding !== null && (
          <p className="mb-2 text-[11px] text-slate-400">
            {t('game.quest_local_standing', lang).replace('{{n}}', String(Math.round(localStanding)))}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {CHRONOS_CORE_FACTION_IDS.map((id) => (
            <div
              key={id}
              className="rounded-md border border-white/[0.06] bg-slate-950/30 px-2 py-1 text-xs text-slate-300"
              title={t(`game.faction.${id}` as Parameters<typeof t>[0], lang)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-400">
                  {t(`game.faction.${id}` as Parameters<typeof t>[0], lang)}
                </span>
                <span className="font-semibold text-slate-200 tabular-nums">
                  {Math.round((factionReputation?.[id] ?? 0) * 10) / 10}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate new quest */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGenerateQuest('side')}
          className="flex-1 border-slate-700 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Find Quest
        </Button>
      </div>

      {/* Active quests */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Active ({activeQuests.length})
        </h3>
        
        {activeQuests.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active quests</p>
            <p className="text-xs mt-1">Explore to find new adventures</p>
          </div>
        ) : (
          <div className="max-h-[min(420px,50vh)] space-y-2 overflow-y-auto overscroll-contain pr-1">
            {activeQuests.map((quest) => (
              <div
                key={quest.id}
                className={`p-3 rounded-lg border ${
                  currentQuest?.id === quest.id
                    ? 'bg-violet-500/10 border-violet-500/50'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {quest.type === 'main' ? (
                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{quest.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{quest.description}</p>
                    
                    {/* Progress */}
                    {quest.objectives.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Progress</span>
                          <span className="text-violet-400">
                            {quest.objectives.filter(o => o.completed).length}/{quest.objectives.length}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-violet-500 rounded-full transition-all"
                            style={{ 
                              width: `${(quest.objectives.filter(o => o.completed).length / quest.objectives.length) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed quests */}
      {completedQuests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Completed ({completedQuests.length})
          </h3>
          <div className="space-y-1">
            {completedQuests.slice(-5).map((questId) => (
              <div
                key={questId}
                className="flex items-center gap-2 p-2 text-sm text-slate-500"
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="line-through">Quest #{questId.slice(-4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
