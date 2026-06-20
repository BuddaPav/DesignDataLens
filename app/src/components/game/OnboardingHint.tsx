// OnboardingHint — Contextual hints for first 5 minutes of gameplay.
// Displays context-sensitive tips based on player actions.

import { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

interface OnboardingHintProps {
  /** Unique hint identifier */
  hintId: string;
  /** Minimum game time (in minutes) to show hint */
  minGameTime?: number;
  /** Maximum game time (in minutes) after which hint is hidden */
  maxGameTime?: number;
  /** Trigger condition: show when true */
  showCondition?: boolean;
  /** Hint disappears after this many milliseconds, 0 = manual dismiss */
  autoHideMs?: number;
  /** Called when hint is dismissed */
  onDismiss?: () => void;
}

// Hints for onboarding phase
const HINTS = {
  first_move: {
    ru: 'Используй стрелки или WASD для перемещения по локации',
    en: 'Use arrow keys or WASD to move around the location',
  },
  talk_npc: {
    ru: 'Подойди к NPC и нажми Enter, чтобы начать разговор',
    en: 'Approach an NPC and press Enter to start a conversation',
  },
  open_map: {
    ru: 'Нажми M чтобы открыть карту мира',
    en: 'Press M to open the world map',
  },
  open_inventory: {
    ru: 'Нажми I для открытия инвентаря',
    en: 'Press I to open inventory',
  },
  accept_quest: {
    ru: 'Прими квест у NPC, чтобы получить цель',
    en: 'Accept a quest from an NPC to get an objective',
  },
  combat: {
    ru: 'Нажми F для вступления в бой или выбери противника',
    en: 'Press F to enter combat or select an opponent',
  },
  rest: {
    ru: 'Найди костёр или кровать для отдыха и сохранения',
    en: 'Find a campfire or bed to rest and save',
  },
  travel: {
    ru: 'Используй карту (M) для путешествия между локациями',
    en: 'Use the map (M) to travel between locations',
  },
  shop: {
    ru: 'Загляни в лавку (B) для покупки снаряжения',
    en: 'Visit the shop (B) to buy equipment',
  },
} as const;

type HintId = keyof typeof HINTS;

interface OnboardingHintState {
  shown: string[];
  dismissed: string[];
}

/** Load/save hint state from localStorage */
function loadHintState(): OnboardingHintState {
  try {
    const raw = localStorage.getItem('chronos_hint_state');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { shown: [], dismissed: [] };
}

function saveHintState(state: OnboardingHintState): void {
  try {
    localStorage.setItem('chronos_hint_state', JSON.stringify(state));
  } catch { /* ignore */ }
}

/**
 * Hook for managing onboarding hints.
 * Shows contextual hints based on game state and player actions.
 */
export function useOnboardingHint() {
  const [currentHint, setCurrentHint] = useState<HintId | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [shown, setShown] = useState<string[]>([]);

  useEffect(() => {
    const state = loadHintState();
    setShown(state.shown);
    setDismissed(state.dismissed);
  }, []);

  const showHint = (hintId: HintId) => {
    if (shown.includes(hintId) || dismissed.includes(hintId)) return;
    setCurrentHint(hintId);
    const newShown = [...shown, hintId];
    setShown(newShown);
    saveHintState({ shown: newShown, dismissed });
  };

  const dismissHint = (hintId: string) => {
    if (!currentHint) return;
    const newDismissed = [...dismissed, hintId];
    setDismissed(newDismissed);
    saveHintState({ shown, dismissed: newDismissed });
    setCurrentHint(null);
  };

  return { currentHint, showHint, dismissHint };
}

/**
 * Individual hint component with auto-dismiss.
 */
export function OnboardingHint({
  hintId,
  showCondition = true,
  autoHideMs = 8000,
  onDismiss,
}: OnboardingHintProps) {
  const language = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!showCondition) return;
    // Fade in after mount
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, [showCondition]);

  useEffect(() => {
    if (!visible || !autoHideMs) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, autoHideMs);
    return () => clearTimeout(timer);
  }, [visible, autoHideMs, onDismiss]);

  if (!visible || !showCondition) return null;

  const hint = HINTS[hintId as HintId];
  if (!hint) return null;

  const text = hint[language] || hint.ru;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 bg-slate-900/95 border border-amber-500/50 rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm">
        <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <span className="text-amber-100 text-sm max-w-xs">{text}</span>
        <button
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          className="text-slate-400 hover:text-slate-200 flex-shrink-0"
          aria-label="Dismiss hint"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export type { HintId };