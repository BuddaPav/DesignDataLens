// Emotional Adaptation - Game adapts to player style

import type { Player } from '@/types/game';

// Player profile for adaptation
export interface PlayerProfile {
  playerId: string;
  preferredCombatStyle: 'aggressive' | 'defensive' | 'tactical';
  explorationScore: number; // 0-100
  socialScore: number; // 0-100
  playPattern: 'speedrunner' | 'completionist' | 'casual';
  sessionCount: number;
  totalCombatTime: number;
  totalExplorationTime: number;
  totalSocialTime: number;
  combatWins: number;
  combatLosses: number;
  questsCompleted: number;
  locationsDiscovered: number;
  npcsTalkedTo: number;
  lastUpdated: number;
}

// Session record
export interface Session {
  startTime: number;
  endTime?: number;
  combatCount: number;
  locationCount: number;
  npcInteractionCount: number;
}

// Difficulty adaptation
export interface DifficultySettings {
  combatMultiplier: number;
  enemyAggression: number;
  rewardMultiplier: number;
  npcHostility: number;
  questDifficulty: 'easy' | 'normal' | 'hard';
}

// Narrative adaptation
export interface NarrativeParams {
  combatEmphasis: number; // 0-1
  loreEmphasis: number; // 0-1
  socialEmphasis: number; // 0-1
  tone: 'epic' | 'dark' | 'light' | 'mysterious';
}

// Player profiles storage
const profiles = new Map<string, PlayerProfile>();
const sessions = new Map<string, Session[]>();

// Create profile
export function createProfile(playerId: string): PlayerProfile {
  const profile: PlayerProfile = {
    playerId,
    preferredCombatStyle: 'tactical',
    explorationScore: 50,
    socialScore: 50,
    playPattern: 'casual',
    sessionCount: 0,
    totalCombatTime: 0,
    totalExplorationTime: 0,
    totalSocialTime: 0,
    combatWins: 0,
    combatLosses: 0,
    questsCompleted: 0,
    locationsDiscovered: 0,
    npcsTalkedTo: 0,
    lastUpdated: Date.now(),
  };

  profiles.set(playerId, profile);
  return profile;
}

// Get profile
export function getProfile(playerId: string): PlayerProfile | null {
  return profiles.get(playerId) ?? null;
}

// Record session start
export function startSession(playerId: string): void {
  let playerSessions = sessions.get(playerId);
  if (!playerSessions) {
    playerSessions = [];
    sessions.set(playerId, playerSessions);
  }

  playerSessions.push({
    startTime: Date.now(),
    combatCount: 0,
    locationCount: 0,
    npcInteractionCount: 0,
  });

  // Update session count
  const profile = profiles.get(playerId);
  if (profile) {
    profile.sessionCount++;
    profile.lastUpdated = Date.now();
  }
}

// Record session end
export function endSession(playerId: string): void {
  const playerSessions = sessions.get(playerId);
  if (!playerSessions || playerSessions.length === 0) return;

  const session = playerSessions[playerSessions.length - 1];
  session.endTime = Date.now();

  const duration = session.endTime - session.startTime;

  // Update time totals
  const profile = profiles.get(playerId);
  if (profile) {
    profile.totalCombatTime += duration;
    profile.lastUpdated = Date.now();
  }
}

// Record combat
export function recordCombat(
  playerId: string,
  won: boolean
): void {
  const profile = profiles.get(playerId);
  if (!profile) return;

  if (won) {
    profile.combatWins++;
  } else {
    profile.combatLosses++;
  }

  profile.lastUpdated = Date.now();
}

// Record location visit
export function recordLocationVisit(playerId: string): void {
  const profile = profiles.get(playerId);
  if (!profile) return;

  profile.locationsDiscovered++;
  profile.lastUpdated = Date.now();
}

// Record NPC interaction
export function recordNPCInteraction(playerId: string): void {
  const profile = profiles.get(playerId);
  if (!profile) return;

  profile.npcsTalkedTo++;
  profile.lastUpdated = Date.now();
}

// Record quest completion
export function recordQuestCompletion(playerId: string): void {
  const profile = profiles.get(playerId);
  if (!profile) return;

  profile.questsCompleted++;
  profile.lastUpdated = Date.now();
}

// Analyze play style
export function analyzePlayStyle(playerId: string): PlayerProfile['preferredCombatStyle'] {
  const profile = profiles.get(playerId);
  if (!profile) return 'tactical';

  const winRate = profile.combatWins / (profile.combatWins + profile.combatLosses + 1);
  const avgSessionDuration =
    (profile.totalCombatTime + profile.totalExplorationTime + profile.totalSocialTime) /
    (profile.sessionCount || 1);

  // If high win rate and less time = aggressive speedrunner
  if (winRate > 0.7 && avgSessionDuration < 600000) {
    return 'aggressive';
  }

  // If low win rate = defensive
  if (winRate < 0.4) {
    return 'defensive';
  }

  return 'tactical';
}

// Calculate difficulty settings
export function getAdaptedDifficulty(
  playerId: string
): DifficultySettings {
  const profile = profiles.get(playerId);
  const style = profile ? analyzePlayStyle(playerId) : 'tactical';

  // Base settings
  let settings: DifficultySettings = {
    combatMultiplier: 1.0,
    enemyAggression: 1.0,
    rewardMultiplier: 1.0,
    npcHostility: 1.0,
    questDifficulty: 'normal',
  };

  if (!profile) return settings;

  const winRate = profile.combatWins / (profile.combatWins + profile.combatLosses + 1);

  // Adapt based on style and win rate
  if (style === 'aggressive') {
    settings.combatMultiplier = 1.2;
    settings.enemyAggression = 1.3;
    settings.questDifficulty = 'hard';
  } else if (style === 'defensive') {
    settings.combatMultiplier = 0.8;
    settings.enemyAggression = 0.7;
    settings.rewardMultiplier = 1.2;
    settings.questDifficulty = 'easy';
  } else {
    // Tactical - adapt to win rate
    if (winRate > 0.8) {
      settings.combatMultiplier = 1.2;
      settings.questDifficulty = 'hard';
    } else if (winRate < 0.3) {
      settings.combatMultiplier = 0.7;
      settings.questDifficulty = 'easy';
    }
  }

  return settings;
}

// Calculate narrative parameters
export function getAdaptedNarrative(
  playerId: string
): NarrativeParams {
  const profile = profiles.get(playerId);
  if (!profile) {
    return {
      combatEmphasis: 0.33,
      loreEmphasis: 0.33,
      socialEmphasis: 0.34,
      tone: 'epic',
    };
  }

  const total = profile.combatWins + profile.locationsDiscovered + profile.npcsTalkedTo;

  if (total === 0) {
    return { combatEmphasis: 0.33, loreEmphasis: 0.33, socialEmphasis: 0.34, tone: 'epic' };
  }

  const combatEmphasis = profile.combatWins / total;
  const loreEmphasis = profile.locationsDiscovered / total;
  const socialEmphasis = profile.npcsTalkedTo / total;

  // Determine tone based on play pattern
  let tone: NarrativeParams['tone'] = 'epic';
  if (profile.combatLosses > profile.combatWins * 1.5) {
    tone = 'dark';
  } else if (profile.questsCompleted > 10 && profile.locationsDiscovered > 5) {
    tone = 'epic';
  } else if (profile.npcsTalkedTo > profile.combatWins) {
    tone = 'mysterious';
  }

  return { combatEmphasis, loreEmphasis, socialEmphasis, tone };
}

// Get play pattern
export function getPlayPattern(playerId: string): PlayerProfile['playPattern'] {
  const profile = profiles.get(playerId);
  if (!profile) return 'casual';

  const avgSessions = profile.sessionCount > 5 ? 5 : profile.sessionCount;
  if (avgSessions === 0) return 'casual';

  const avgDuration =
    (profile.totalCombatTime + profile.totalExplorationTime + profile.totalSocialTime) /
    avgSessions;

  // Under 10 min avg = speedrunner
  if (avgDuration < 600000) return 'speedrunner';

  // Over 30 min avg + many quests = completionist
  if (avgDuration > 1800000 && profile.questsCompleted > 10) {
    return 'completionist';
  }

  return 'casual';
}

// Export
export const emotionalAdaptation = {
  createProfile,
  getProfile,
  startSession,
  endSession,
  recordCombat,
  recordLocationVisit,
  recordNPCInteraction,
  recordQuestCompletion,
  analyzePlayStyle,
  getAdaptedDifficulty,
  getAdaptedNarrative,
  getPlayPattern,
};

export default emotionalAdaptation;