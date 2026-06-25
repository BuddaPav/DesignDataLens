// Faction System - Factions with reputation and rewards

export type FactionAlignment = 'good' | 'neutral' | 'evil';

export interface Faction {
  id: string;
  name: string;
  description: string;
  alignment: FactionAlignment;
  color: string;
  quests: string[];
  rewards: FactionReward[];
  members: string[];
  allies: string[];
  enemies: string[];
}

export interface FactionReward {
  id: string;
  name: string;
  type: 'item' | 'ability' | 'title' | 'discount';
  cost: number;
  minReputation: number;
}

export interface FactionQuest {
  factionId: string;
  questId: string;
  minReputation: number;
  rewards: string[];
}

export interface PlayerFactionData {
  factionId: string;
  reputation: number;
  joinedAt: number;
  lastInteraction: number;
  completedQuests: string[];
  unlockedRewards: string[];
}

// Storage
const factions = new Map<string, Faction>();
const playerFactions = new Map<string, Map<string, PlayerFactionData>>();

// Register faction
export function registerFaction(faction: Faction): void {
  factions.set(faction.id, faction);
}

// Get faction
export function getFaction(factionId: string): Faction | null {
  return factions.get(factionId) ?? null;
}

// Get all factions
export function getAllFactions(): Faction[] {
  return Array.from(factions.values());
}

// Join faction
export function joinFaction(
  playerId: string,
  factionId: string
): boolean {
  const faction = factions.get(factionId);
  if (!faction) return false;

  let playerFactionData = playerFactions.get(playerId);
  if (!playerFactionData) {
    playerFactionData = new Map();
    playerFactions.set(playerId, playerFactionData);
  }

  if (playerFactionData.has(factionId)) return false;

  playerFactionData.set(factionId, {
    factionId,
    reputation: 0,
    joinedAt: Date.now(),
    lastInteraction: Date.now(),
    completedQuests: [],
    unlockedRewards: [],
  });

  return true;
}

// Update reputation
export function updateReputation(
  playerId: string,
  factionId: string,
  delta: number
): boolean {
  const playerFactionData = playerFactions.get(playerId);
  if (!playerFactionData) return false;

  const data = playerFactionData.get(factionId);
  if (!data) return false;

  data.reputation = Math.max(-100, Math.min(100, data.reputation + delta));
  data.lastInteraction = Date.now();

  return true;
}

// Get reputation
export function getReputation(
  playerId: string,
  factionId: string
): number {
  const playerFactionData = playerFactions.get(playerId);
  if (!playerFactionData) return 0;

  const data = playerFactionData.get(factionId);
  return data?.reputation ?? 0;
}

// Get all player factions
export function getPlayerFactions(playerId: string): PlayerFactionData[] {
  const playerFactionData = playerFactions.get(playerId);
  if (!playerFactionData) return [];

  return Array.from(playerFactionData.values());
}

// Complete faction quest
export function completeFactionQuest(
  playerId: string,
  factionId: string,
  questId: string,
  baseReputation: number
): boolean {
  const playerFactionData = playerFactions.get(playerId);
  if (!playerFactionData) return false;

  const data = playerFactionData.get(factionId);
  if (!data) return false;

  if (!data.completedQuests.includes(questId)) {
    data.completedQuests.push(questId);
  }

  data.reputation = Math.min(100, data.reputation + baseReputation);
  data.lastInteraction = Date.now();

  return true;
}

// Unlock reward
export function unlockReward(
  playerId: string,
  factionId: string,
  rewardId: string
): boolean {
  const playerFactionData = playerFactions.get(playerId);
  if (!playerFactionData) return false;

  const data = playerFactionData.get(factionId);
  if (!data) return false;

  const faction = factions.get(factionId);
  if (!faction) return false;

  const reward = faction.rewards.find(r => r.id === rewardId);
  if (!reward) return false;

  if (data.reputation < reward.minReputation) return false;

  if (!data.unlockedRewards.includes(rewardId)) {
    data.unlockedRewards.push(rewardId);
  }

  return true;
}

// Check reward availability
export function isRewardAvailable(
  playerId: string,
  factionId: string,
  rewardId: string
): boolean {
  const reputation = getReputation(playerId, factionId);

  const faction = factions.get(factionId);
  if (!faction) return false;

  const reward = faction.rewards.find(r => r.id === rewardId);
  if (!reward) return false;

  return reputation >= reward.minReputation;
}

// Get faction relationships
export function getFactionRelationships(
  factionId: string
): { allies: string[]; enemies: string[] } {
  const faction = factions.get(factionId);
  if (!faction) return { allies: [], enemies: [] };

  return {
    allies: faction.allies,
    enemies: faction.enemies,
  };
}

// Generate faction rewards
export function generateFactionRewards(
  faction: Faction
): FactionReward[] {
  const rewards: FactionReward[] = [
    {
      id: `${faction.id}_ initiates`,
      name: `${faction.name} Initiate`,
      type: 'title',
      cost: 0,
      minReputation: 10,
    },
    {
      id: `${faction.id}_member`,
      name: `${faction.name} Member`,
      type: 'title',
      cost: 0,
      minReputation: 30,
    },
    {
      id: `${faction.id}_veteran`,
      name: `${faction.name} Veteran`,
      type: 'title',
      cost: 0,
      minReputation: 60,
    },
    {
      id: `${faction.id}_champion`,
      name: `${faction.name} Champion`,
      type: 'title',
      cost: 0,
      minReputation: 90,
    },
  ];

  return rewards;
}

// Export
export const factionEngine = {
  registerFaction,
  getFaction,
  getAllFactions,
  joinFaction,
  updateReputation,
  getReputation,
  getPlayerFactions,
  completeFactionQuest,
  unlockReward,
  isRewardAvailable,
  getFactionRelationships,
};

export default factionEngine;