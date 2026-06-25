// Quest Engine - Full quest system with chains and choices

import type { Quest, QuestObjective, QuestChoice, QuestReward } from '@/types/quest';

// Quest status
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | ' Abandoned';

// Quest instance with progress
export interface QuestInstance {
  quest: Quest;
  status: QuestStatus;
  progress: Map<string, number>;
  choices: string[];
  startedAt: number;
  completedAt?: number;
  location?: string;
}

// Quest state storage
const activeQuests = new Map<string, QuestInstance>();
const completedQuests = new Set<string>();

// Get quest by ID
export function getQuest(questId: string): Quest | null {
  // Will be loaded from quest database
  return null;
}

// Start quest
export function startQuest(questId: string, location?: string): QuestInstance | null {
  const quest = getQuest(questId);
  if (!quest) return null;

  const instance: QuestInstance = {
    quest,
    status: 'active',
    progress: new Map(
      quest.objectives.map(obj => [obj.id, 0])
    ),
    choices: [],
    startedAt: Date.now(),
    location,
  };

  activeQuests.set(questId, instance);
  return instance;
}

// Update objective progress
export function updateObjectiveProgress(
  questId: string,
  objectiveId: string,
  amount: number = 1
): boolean {
  const instance = activeQuests.get(questId);
  if (!instance || instance.status !== 'active') return false;

  const current = instance.progress.get(objectiveId) ?? 0;
  const objective = instance.quest.objectives.find(o => o.id === objectiveId);

  if (!objective) return false;

  instance.progress.set(objectiveId, current + amount);

  // Check if objective completed
  if (instance.progress.get(objectiveId)! >= objective.amount) {
    instance.progress.set(objectiveId, objective.amount);
  }

  // Check if all required objectives completed
  if (areAllObjectivesCompleted(questId)) {
    return true;
  }

  return false;
}

// Check if all objectives completed
export function areAllObjectivesCompleted(questId: string): boolean {
  const instance = activeQuests.get(questId);
  if (!instance) return false;

  for (const obj of instance.quest.objectives) {
    if (obj.optional) continue;

    const progress = instance.progress.get(obj.id) ?? 0;
    if (progress < obj.amount) return false;
  }

  return true;
}

// Make quest choice
export function makeChoice(
  questId: string,
  choiceId: string
): QuestChoice | null {
  const instance = activeQuests.get(questId);
  if (!instance || instance.status !== 'active') return null;

  const choice = instance.quest.choices?.find(c => c.id === choiceId);
  if (!choice) return null;

  instance.choices.push(choiceId);

  // Apply consequences
  applyChoiceConsequences(questId, choice.consequences);

  return choice;
}

// Apply choice consequences
function applyChoiceConsequences(
  questId: string,
  consequences: string[]
): void {
  for (const consequence of consequences) {
    // Parse and apply consequence
    // Format: "unlock:questId" or "remove:item" or "damage:amount"
    const [type, value] = consequence.split(':');

    switch (type) {
      case 'unlock':
        // Unlock another quest
        break;
      case 'remove':
        // Remove item from inventory
        break;
      case 'damage':
        // Deal damage to player
        break;
      case 'faction':
        // Change faction reputation
        break;
    }
  }
}

// Complete quest
export function completeQuest(
  questId: string
): QuestReward[] | null {
  const instance = activeQuests.get(questId);
  if (!instance || instance.status !== 'active') return null;

  if (!areAllObjectivesCompleted(questId)) {
    return null;
  }

  instance.status = 'completed';
  instance.completedAt = Date.now();
  completedQuests.add(questId);

  // Remove from active
  activeQuests.delete(questId);

  return instance.quest.rewards;
}

// Fail quest
export function failQuest(questId: string, reason?: string): boolean {
  const instance = activeQuests.get(questId);
  if (!instance) return false;

  instance.status = 'failed';
  completedQuests.add(questId);
  activeQuests.delete(questId);

  return true;
}

// Get quest status
export function getQuestStatus(questId: string): QuestStatus | null {
  const instance = activeQuests.get(questId);
  if (instance) return instance.status;

  if (completedQuests.has(questId)) {
    return 'completed';
  }

  return null;
}

// Get active quests
export function getActiveQuests(): QuestInstance[] {
  return Array.from(activeQuests.values());
}

// Get quest progress
export function getQuestProgress(questId: string): Map<string, number> | null {
  const instance = activeQuests.get(questId);
  return instance?.progress ?? null;
}

// Check quest availability
export function isQuestAvailable(
  quest: Quest,
  completedQuestIds: string[],
  playerLevel: number
): boolean {
  // Check prerequisites
  for (const prereq of quest.prerequisites ?? []) {
    if (!completedQuestIds.includes(prereq)) {
      return false;
    }
  }

  // Check level requirement
  if (quest.minLevel && playerLevel < quest.minLevel) {
    return false;
  }

  return true;
}

// Export
export const questEngine = {
  getQuest,
  startQuest,
  updateObjectiveProgress,
  makeChoice,
  completeQuest,
  failQuest,
  getQuestStatus,
  getActiveQuests,
  getQuestProgress,
  isQuestAvailable,
  areAllObjectivesCompleted,
};

export default questEngine;