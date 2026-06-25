// Achievement Engine - Unlock system for exploration, combat, and discoveries

export type AchievementCategory =
  | 'combat'
  | 'exploration'
  | 'social'
  | 'economy'
  | 'crafting'
  | 'story'
  | 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  points: number;
  requirements: AchievementRequirement[];
  rewards?: AchievementReward[];
  secret?: boolean;
  unlockedAt?: number;
}

export interface AchievementRequirement {
  type:
    | 'kill_count'
    | 'location_visit'
    | 'npc_met'
    | 'quest_complete'
    | 'item_collect'
    | 'gold_earned'
    | 'trade_count'
    | 'time_played'
    | 'combo_count'
    | 'custom';
  target: string | number;
  amount: number;
}

export interface AchievementReward {
  type: 'gold' | 'item' | 'title' | 'ability';
  value: string | number;
}

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Defeat your first enemy',
    category: 'combat',
    rarity: 'common',
    icon: 'sword',
    points: 10,
    requirements: [{ type: 'kill_count', target: '', amount: 1 }],
  },
  {
    id: 'monster_slayer',
    name: 'Monster Slayer',
    description: 'Defeat 100 enemies',
    category: 'combat',
    rarity: 'uncommon',
    icon: 'skull',
    points: 50,
    requirements: [{ type: 'kill_count', target: '', amount: 100 }],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Visit 10 different locations',
    category: 'exploration',
    rarity: 'uncommon',
    icon: 'compass',
    points: 30,
    requirements: [{ type: 'location_visit', target: '', amount: 10 }],
  },
  {
    id: 'world_traveler',
    name: 'World Traveler',
    description: 'Visit 50 different locations',
    category: 'exploration',
    rarity: 'rare',
    icon: 'globe',
    points: 100,
    requirements: [{ type: 'location_visit', target: '', amount: 50 }],
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Meet 25 NPCs',
    category: 'social',
    rarity: 'uncommon',
    icon: 'users',
    points: 40,
    requirements: [{ type: 'npc_met', target: '', amount: 25 }],
  },
  {
    id: 'merchant',
    name: 'Merchant',
    description: 'Complete 50 trades',
    category: 'economy',
    rarity: 'uncommon',
    icon: 'coins',
    points: 40,
    requirements: [{ type: 'trade_count', target: '', amount: 50 }],
  },
  {
    id: 'rich',
    name: 'Wealthy',
    description: 'Accumulate 10,000 gold',
    category: 'economy',
    rarity: 'rare',
    icon: 'crown',
    points: 75,
    requirements: [{ type: 'gold_earned', target: '', amount: 10000 }],
  },
  {
    id: 'hero',
    name: 'Hero',
    description: 'Complete 10 main story quests',
    category: 'story',
    rarity: 'epic',
    icon: 'shield',
    points: 200,
    requirements: [{ type: 'quest_complete', target: 'main', amount: 10 }],
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Execute 50 combat combos',
    category: 'combat',
    rarity: 'rare',
    icon: 'lightning',
    points: 80,
    requirements: [{ type: 'combo_count', target: '', amount: 50 }],
  },
  {
    id: 'dedicated',
    name: 'Dedicated Player',
    description: 'Play for 100 hours',
    category: 'special',
    rarity: 'epic',
    icon: 'clock',
    points: 150,
    requirements: [{ type: 'time_played', target: '', amount: 100 * 60 * 60 * 1000 }],
  },
  // Secret achievements (hidden until unlocked)
  {
    id: 'secret_discovery',
    name: '???',
    description: 'Find something special...',
    category: 'special',
    rarity: 'legendary',
    icon: 'star',
    points: 500,
    requirements: [{ type: 'custom', target: 'secret_discovery', amount: 1 }],
    secret: true,
  },
];

// Player achievement state
interface PlayerAchievements {
  playerId: string;
  unlocked: Map<string, number>; // achievementId -> unlockedAt
  progress: Map<string, number>; // requirement target -> current amount
}

// Storage
const playerAchievements = new Map<string, PlayerAchievements>();

// Get player data
function getPlayerData(playerId: string): PlayerAchievements {
  let data = playerAchievements.get(playerId);
  if (!data) {
    data = {
      playerId,
      unlocked: new Map(),
      progress: new Map(),
    };
    playerAchievements.set(playerId, data);
  }
  return data;
}

// Get all achievements
export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}

// Get achievement by ID
export function getAchievement(id: string): Achievement | null {
  return ACHIEVEMENTS.find(a => a.id === id) ?? null;
}

// Check if player has achievement
export function hasAchievement(playerId: string, achievementId: string): boolean {
  const data = getPlayerData(playerId);
  return data.unlocked.has(achievementId);
}

// Unlock achievement
export function unlockAchievement(
  playerId: string,
  achievementId: string
): Achievement | null {
  const achievement = getAchievement(achievementId);
  if (!achievement) return null;

  const data = getPlayerData(playerId);

  // Already unlocked
  if (data.unlocked.has(achievementId)) return null;

  data.unlocked.set(achievementId, Date.now());
  achievement.unlockedAt = Date.now();

  return achievement;
}

// Update player progress
export function updateProgress(
  playerId: string,
  requirementType: AchievementRequirement['type'],
  target: string | number,
  amount: number
): string[] {
  const data = getPlayerData(playerId);
  const key = `${requirementType}:${target}`;
  const current = data.progress.get(key) ?? 0;
  data.progress.set(key, current + amount);

  // Check for newly unlockable achievements
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (data.unlocked.has(achievement.id)) continue;

    for (const req of achievement.requirements) {
      if (req.type === requirementType) {
        const progressKey = `${req.type}:${req.target}`;
        const progress = data.progress.get(progressKey) ?? 0;

        if (progress >= req.amount) {
          const unlocked = unlockAchievement(playerId, achievement.id);
          if (unlocked) {
            newlyUnlocked.push(achievement.id);
          }
        }
      }
    }
  }

  return newlyUnlocked;
}

// Get player's unlocked achievements
export function getPlayerAchievements(playerId: string): Achievement[] {
  const data = getPlayerData(playerId);
  return ACHIEVEMENTS.filter(a => data.unlocked.has(a.id));
}

// Get player's progress for achievement
export function getAchievementProgress(
  playerId: string,
  achievementId: string
): number {
  const achievement = getAchievement(achievementId);
  if (!achievement) return 0;

  const data = getPlayerData(playerId);
  const req = achievement.requirements[0];
  if (!req) return 0;

  const progressKey = `${req.type}:${req.target}`;
  return data.progress.get(progressKey) ?? 0;
}

// Get player achievement points
export function getPlayerPoints(playerId: string): number {
  const data = getPlayerData(playerId);
  let points = 0;

  for (const achievementId of data.unlocked.keys()) {
    const achievement = getAchievement(achievementId);
    if (achievement) {
      points += achievement.points;
    }
  }

  return points;
}

// Calculate completion percentage
export function getCompletionPercentage(playerId: string): number {
  const data = getPlayerData(playerId);
  const totalPoints = ACHIEVEMENTS.filter(a => !a.secret).reduce(
    (sum, a) => sum + a.points,
    0
  );

  const earnedPoints = getPlayerPoints(playerId);

  return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
}

// Export
export const achievementEngine = {
  getAllAchievements,
  getAchievement,
  hasAchievement,
  unlockAchievement,
  updateProgress,
  getPlayerAchievements,
  getAchievementProgress,
  getPlayerPoints,
  getCompletionPercentage,
};

export default achievementEngine;