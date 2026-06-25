// NPC Memory System - Extended memory for NPCs
// NPCs remember past conversations, form opinions about player, develop relationships

import type { NPC, Player } from '@/types/game';

// Single interaction record
export interface NPCInteraction {
  id: string;
  timestamp: number;
  playerAction: string;
  npcResponse: string;
  location: string;
  quest?: string;
  trust: number;
  type: 'greeting' | 'trade' | 'quest' | 'combat' | 'information' | 'farewell';
}

// Player opinion about different aspects
export interface NPCOpinion {
  aspect: 'combat' | 'exploration' | 'negotiation' | 'morality';
  value: number; // -100 to +100
  confidence: number; // 0 to 1
  lastUpdated: number;
}

// NPC-to-NPC relationship
export interface NPCRelationship {
  npcId: string;
  trust: number; // -100 to +100
  lastInteraction: number;
  sharedHistory: string[];
}

// Complete memory for one NPC
export interface NPCMemory {
  npcId: string;
  playerId: string;
  interactions: NPCInteraction[];
  opinions: NPCOpinion[];
  relationships: Map<string, NPCRelationship>;
  unlockedDialogues: string[];
  firstMet: number;
  lastMet: number;
  totalMeetings: number;
  opinionsAboutPlayer: string[];
}

// Storage
const memoryStore = new Map<string, NPCMemory>();

// Create interaction ID
function createInteractionId(): string {
  return `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get or create memory
export function getMemory(npcId: string, playerId: string): NPCMemory {
  const key = `${npcId}:${playerId}`;

  if (!memoryStore.has(key)) {
    memoryStore.set(key, {
      npcId,
      playerId,
      interactions: [],
      opinions: [],
      relationships: new Map(),
      unlockedDialogues: [],
      firstMet: Date.now(),
      lastMet: Date.now(),
      totalMeetings: 0,
      opinionsAboutPlayer: [],
    });
  }

  return memoryStore.get(key)!;
}

// Record interaction
export function recordInteraction(
  npcId: string,
  playerId: string,
  interaction: Omit<NPCInteraction, 'id' | 'timestamp'>
): NPCInteraction {
  const memory = getMemory(npcId, playerId);
  const record: NPCInteraction = {
    ...interaction,
    id: createInteractionId(),
    timestamp: Date.now(),
  };

  memory.interactions.push(record);
  memory.lastMet = Date.now();
  memory.totalMeetings++;

  // Update trust based on interaction type
  updateTrust(npcId, playerId, record.type, record.trust);

  // Update opinion based on action
  updateOpinionFromAction(npcId, playerId, record.playerAction);

  return record;
}

// Update trust rating
function updateTrust(
  npcId: string,
  playerId: string,
  type: NPCInteraction['type'],
  delta: number
): void {
  const memory = getMemory(npcId, playerId);

  // Find or create combat/opinion entry
  let opinion = memory.opinions.find(o => o.aspect === 'combat');
  if (!opinion) {
    opinion = { aspect: 'combat' as const, value: 0, confidence: 0.5, lastUpdated: Date.now() };
    memory.opinions.push(opinion);
  }

  // Different interaction types affect different aspects
  const trustMap: Record<NPCInteraction['type'], NPCOpinion['aspect']> = {
    combat: 'combat',
    trade: 'negotiation',
    quest: 'morality',
    information: 'exploration',
    greeting: 'negotiation',
    farewell: 'negotiation',
  };

  const aspect = trustMap[type] ?? 'negotiation';
  const target = memory.opinions.find(o => o.aspect === aspect);
  if (target) {
    target.value = Math.max(-100, Math.min(100, target.value + delta));
    target.confidence = Math.min(1, target.confidence + 0.1);
    target.lastUpdated = Date.now();
  }
}

// Update opinion from player action
function updateOpinionFromAction(npcId: string, playerId: string, action: string): void {
  const memory = getMemory(npcId, playerId);

  // Parse action and update relevant opinion
  const actionLower = action.toLowerCase();

  if (actionLower.includes('attack') || actionLower.includes('kill')) {
    const opinion = memory.opinions.find(o => o.aspect === 'combat');
    if (opinion) {
      opinion.value -= 30;
      opinion.confidence = Math.min(1, opinion.confidence + 0.2);
    }
  } else if (actionLower.includes('help') || actionLower.includes('save')) {
    const opinion = memory.opinions.find(o => o.aspect === 'morality');
    if (opinion) {
      opinion.value += 20;
      opinion.confidence = Math.min(1, opinion.confidence + 0.15);
    }
  } else if (actionLower.includes('give') || actionLower.includes('trade')) {
    const opinion = memory.opinions.find(o => o.aspect === 'negotiation');
    if (opinion) {
      opinion.value += 10;
      opinion.confidence = Math.min(1, opinion.confidence + 0.1);
    }
  }
}

// Get NPC's current opinion about player
export function getPlayerOpinion(
  npcId: string,
  playerId: string
): number {
  const memory = getMemory(npcId, playerId);
  const opinions = memory.opinions;

  if (opinions.length === 0) return 0;

  // Weighted average
  let totalWeight = 0;
  let weightedSum = 0;

  for (const op of opinions) {
    const weight = op.confidence;
    weightedSum += op.value * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// Get recent interactions
export function getRecentInteractions(
  npcId: string,
  playerId: string,
  limit = 5
): NPCInteraction[] {
  const memory = getMemory(npcId, playerId);
  return memory.interactions
    .slice(-limit)
    .reverse();
}

// Unlock dialogue
export function unlockDialogue(
  npcId: string,
  playerId: string,
  dialogueId: string
): void {
  const memory = getMemory(npcId, playerId);
  if (!memory.unlockedDialogues.includes(dialogueId)) {
    memory.unlockedDialogues.push(dialogueId);
  }
}

// Check if dialogue is unlocked
export function isDialogueUnlocked(
  npcId: string,
  playerId: string,
  dialogueId: string
): boolean {
  const memory = getMemory(npcId, playerId);
  return memory.unlockedDialogues.includes(dialogueId);
}

// Check if NPC knows player well
export function isNPCFamiliarWithPlayer(
  npcId: string,
  playerId: string
): boolean {
  const memory = getMemory(npcId, playerId);
  return memory.totalMeetings >= 3;
}

// Get NPC relationship with another NPC
export function getNPCRelationship(
  npcId: string,
  playerId: string,
  otherNpcId: string
): number {
  const memory = getMemory(npcId, playerId);
  const rel = memory.relationships.get(otherNpcId);
  return rel?.trust ?? 0;
}

// Update NPC-to-NPC relationship
export function updateNPCRelationship(
  npcId: string,
  playerId: string,
  otherNpcId: string,
  delta: number
): void {
  const memory = getMemory(npcId, playerId);
  const rel = memory.relationships.get(otherNpcId);

  if (rel) {
    rel.trust = Math.max(-100, Math.min(100, rel.trust + delta));
    rel.lastInteraction = Date.now();
  } else {
    memory.relationships.set(otherNpcId, {
      npcId: otherNpcId,
      trust: delta,
      lastInteraction: Date.now(),
      sharedHistory: [],
    });
  }
}

// Generate response based on memory
export function generateMemoryBasedResponse(
  npcId: string,
  playerId: string
): string {
  const memory = getMemory(npcId, playerId);
  const opinion = getPlayerOpinion(npcId, playerId);
  const meetings = memory.totalMeetings;

  if (meetings === 0) {
    return 'first_meeting';
  }

  if (opinion < -50) {
    return 'hostile';
  }

  if (opinion < 0) {
    return 'cautious';
  }

  if (opinion > 50) {
    return 'friendly';
  }

  return 'neutral';
}

// Export
export const npcMemory = {
  getMemory,
  recordInteraction,
  getPlayerOpinion,
  getRecentInteractions,
  unlockDialogue,
  isDialogueUnlocked,
  isNPCFamiliarWithPlayer,
  getNPCRelationship,
  updateNPCRelationship,
  generateMemoryBasedResponse,
};

export default npcMemory;