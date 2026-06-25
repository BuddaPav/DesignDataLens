// Cross-Location Save - Save world state when moving between locations

import type { NPC, Quest, Player, PlayerStats, Inventory } from '@/types/game';

// Minimal player data to preserve between locations
export interface SavedPlayerData {
  id: string;
  stats: PlayerStats;
  inventory: Inventory;
  location?: string;
}

// World state to preserve
export interface WorldState {
  player: SavedPlayerData;
  npcStates: Map<string, NPCState>;
  questProgress: Map<string, QuestProgress>;
  worldVariables: Map<string, number>;
  economyState: Map<string, number>;
  timestamp: number;
  fromLocation: string;
}

export interface NPCState {
  id: string;
  status: 'alive' | 'dead' | 'missing' | 'imprisoned' | 'exiled';
  worldTile?: { x: number; y: number };
  health?: number;
  currentDialogue?: string;
  inventory?: string[];
  relations?: Map<string, number>;
}

export interface QuestProgress {
  questId: string;
  objectives: Map<string, number>;
  choices: string[];
  startedAt: number;
}

// Location history
const locationHistory = new Map<string, WorldState>();

// Save current world state
export function saveWorldState(
  currentLocation: string,
  player: Player,
  npcs: NPC[],
  activeQuests: Map<string, QuestProgress>
): void {
  const state: WorldState = {
    player: {
      id: player.id,
      stats: player.stats,
      inventory: player.inventory,
    },
    npcStates: new Map(
      npcs.map(npc => [
        npc.id,
        {
          id: npc.id,
          status: 'alive' as const,
        } as NPCState,
      ])
    ),
    questProgress: new Map(activeQuests),
    worldVariables: new Map(),
    economyState: new Map(),
    timestamp: Date.now(),
    fromLocation: currentLocation,
  };

  locationHistory.set(currentLocation, state);
}

// Load world state for location
export function loadWorldState(
  targetLocation: string
): WorldState | null {
  return locationHistory.get(targetLocation) ?? null;
}

// Check if state exists
export function hasWorldState(location: string): boolean {
  return locationHistory.has(location);
}

// Get saved NPCs for location
export function getSavedNPCStates(
  location: string
): NPCState[] | null {
  const state = locationHistory.get(location);
  return state ? Array.from(state.npcStates.values()) : null;
}

// Get saved quest progress
export function getSavedQuestProgress(
  location: string
): Map<string, QuestProgress> | null {
  const state = locationHistory.get(location);
  return state?.questProgress ?? null;
}

// Clear saved state (after loading)
export function clearSavedState(location: string): void {
  locationHistory.delete(location);
}

// Get all saved locations
export function getSavedLocations(): string[] {
  return Array.from(locationHistory.keys());
}

// Get latest save time for location
export function getLastSaveTime(location: string): number | null {
  const state = locationHistory.get(location);
  return state?.timestamp ?? null;
}

// Restore NPC to saved state
export function restoreNPCState(
  npc: NPC,
  savedState: NPCState
): NPC {
  return {
    ...npc,
    status: savedState.status,
    worldTile: savedState.worldTile,
  };
}

// Save global world variable
export function saveWorldVariable(
  key: string,
  value: number
): void {
  for (const state of locationHistory.values()) {
    state.worldVariables.set(key, value);
  }
}

// Get world variable
export function getWorldVariable(
  key: string,
  location?: string
): number | null {
  // If location specified, get from that state
  if (location) {
    const state = locationHistory.get(location);
    return state?.worldVariables.get(key) ?? null;
  }

  // Otherwise get from most recent
  const states = Array.from(locationHistory.values());
  if (states.length === 0) return null;

  const latest = states[states.length - 1];
  return latest.worldVariables.get(key) ?? null;
}

// Auto-save on location change
export function autoSave(
  fromLocation: string,
  player: Player,
  npcs: NPC[],
  quests: Map<string, QuestProgress>
): void {
  saveWorldState(fromLocation, player, npcs, quests);
  console.log(`[Save] World state saved for ${fromLocation}`);
}

// Auto-load on location enter
export function autoLoad(
  toLocation: string
): WorldState | null {
  const state = loadWorldState(toLocation);

  if (state) {
    console.log(`[Save] World state loaded for ${toLocation}`);
  }

  return state;
}

// Export
export const crossLocationSave = {
  saveWorldState,
  loadWorldState,
  hasWorldState,
  getSavedNPCStates,
  getSavedQuestProgress,
  clearSavedState,
  getSavedLocations,
  getLastSaveTime,
  restoreNPCState,
  saveWorldVariable,
  getWorldVariable,
  autoSave,
  autoLoad,
};

export default crossLocationSave;