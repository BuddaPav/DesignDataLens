// Feature Flags для AFK Game
// Управлять через URL ?feature=name или config

export type FeatureFlag =
  | 'new_npc_dialogue_system'
  | 'advanced_weather'
  | 'future_world_era'
  | 'coalition_hud'
  | 'quest_progress_hud';

export const defaultFlags: Record<FeatureFlag, boolean> = {
  new_npc_dialogue_system: false, // в разработке
  advanced_weather: true,
  future_world_era: false,
  coalition_hud: true,
  quest_progress_hud: true
};

export function isEnabled(flag: FeatureFlag, customFlags?: Partial<Record<FeatureFlag, boolean>>): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has(flag)) {
    return params.get(flag) === 'true';
  }
  return customFlags?.[flag] ?? defaultFlags[flag];
}

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return isEnabled(flag);
}