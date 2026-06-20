// QuestProgressHUD — Compact quest progress indicator in HUD.
// Shows active quest objective in the footer area.

import { useMemo } from 'react';
import { AlertCircle, CheckCircle2, Triangle } from 'lucide-react';
import type { Quest } from '@/types/game';
import { useLanguage } from '@/i18n/LanguageProvider';
import { t } from '@/i18n';

interface QuestProgressHUDProps {
  activeQuests: Quest[];
  completedQuests: string[];
  currentLocationId: string;
  /** Compact mode for footer display */
  compact?: boolean;
}

export function QuestProgressHUD({
  activeQuests,
  currentLocationId,
  compact = true,
}: QuestProgressHUDProps) {
  const language = useLanguage();

  // Get the primary active quest (highest priority, not completed)
  const activeQuest = useMemo(() => {
    if (!activeQuests.length) return null;
    return activeQuests[0];
  }, [activeQuests]);

  if (!activeQuest) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span className={compact ? 'text-xs' : 'text-sm'}>
          {t('quest.no_active', language)}
        </span>
      </div>
    );
  }

  const objectives = activeQuest.objectives || [];
  const completedCount = objectives.filter(o => o.completed).length;
  const totalCount = objectives.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const currentObjective = objectives.find(o => !o.completed);
  const locationMatch = currentObjective?.locationId
    ? currentObjective.locationId === currentLocationId
    : true;

  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'p-3 bg-slate-800/80 rounded-lg'}`}>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Objective */}
      <div className="flex items-center gap-2 max-w-[200px]">
        {!locationMatch && currentObjective?.locationId ? (
          <Triangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
        ) : currentObjective?.completed ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
        )}
        <span className={`text-amber-100 truncate ${compact ? 'text-xs' : 'text-sm'}`} title={currentObjective?.text?.[language]}>
          {currentObjective?.text?.[language] || currentObjective?.text?.ru || '...'}
        </span>
      </div>
    </div>
  );
}