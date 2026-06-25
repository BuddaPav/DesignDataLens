// PvP Arena Engine - Player versus Player combat system

import type { CombatLog, CombatResult } from '@/types/combat';

// Arena types
export type ArenaType = 'duel' | 'free_for_all' | 'team' | 'siege';
export type ArenaStatus = 'waiting' | 'countdown' | 'active' | 'ended';
export type Team = 'blue' | 'red' | 'neutral';

// Player arena state
interface ArenaPlayer {
  id: string;
  name: string;
  team: Team;
  health: number;
  maxHealth: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  isAlive: boolean;
}

// Arena match
export interface ArenaMatch {
  id: string;
  type: ArenaType;
  status: ArenaStatus;
  players: ArenaPlayer[];
  spectators: string[];
  startTime: number;
  endTime?: number;
  winner?: string;
  rewards: Record<string, number>; // playerId -> reward
  settings: ArenaSettings;
}

// Arena settings
export interface ArenaSettings {
  maxPlayers: number;
  teamSize: number;
  roundDuration: number; // ms
  respawnDelay: number; // ms
  friendlyFire: boolean;
  minLevel: number;
  stakes: number; // gold entry fee
}

// Default settings
const DEFAULT_SETTINGS: ArenaSettings = {
  maxPlayers: 8,
  teamSize: 4,
  roundDuration: 600000, // 10 min
  respawnDelay: 5000,
  friendlyFire: false,
  minLevel: 1,
  stakes: 100,
};

// Active matches
const activeMatches = new Map<string, ArenaMatch>();
const matchHistory: ArenaMatch[] = [];

class PvPArenaEngine {
  // Create new arena match
  createMatch(type: ArenaType, settings: Partial<ArenaSettings> = {}): ArenaMatch {
    const match: ArenaMatch = {
      id: `arena_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      status: 'waiting',
      players: [],
      spectators: [],
      startTime: 0,
      rewards: {},
      settings: { ...DEFAULT_SETTINGS, ...settings },
    };

    activeMatches.set(match.id, match);
    return match;
  }

  // Join arena
  joinMatch(matchId: string, playerId: string, playerName: string, team: Team = 'neutral'): boolean {
    const match = activeMatches.get(matchId);
    if (!match) return false;
    if (match.status !== 'waiting') return false;
    if (match.players.length >= match.settings.maxPlayers) return false;

    match.players.push({
      id: playerId,
      name: playerName,
      team,
      health: 100,
      maxHealth: 100,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      damageTaken: 0,
      isAlive: true,
    });

    return true;
  }

  // Leave arena
  leaveMatch(matchId: string, playerId: string): boolean {
    const match = activeMatches.get(matchId);
    if (!match) return false;

    const index = match.players.findIndex(p => p.id === playerId);
    if (index === -1) return false;

    match.players.splice(index, 1);
    return true;
  }

  // Start match countdown
  startCountdown(matchId: string): boolean {
    const match = activeMatches.get(matchId);
    if (!match || match.status !== 'waiting') return false;
    if (match.players.length < 2) return false;

    match.status = 'countdown';
    setTimeout(() => this.startMatch(matchId), 10000); // 10 sec countdown
    return true;
  }

  // Start active match
  private startMatch(matchId: string): void {
    const match = activeMatches.get(matchId);
    if (!match) return;

    match.status = 'active';
    match.startTime = Date.now();

    // Start auto-end timer
    setTimeout(() => this.endMatch(matchId), match.settings.roundDuration);
  }

  // Process combat damage
  processDamage(
    matchId: string,
    attackerId: string,
    targetId: string,
    damage: number
  ): boolean {
    const match = activeMatches.get(matchId);
    if (!match || match.status !== 'active') return false;

    const attacker = match.players.find(p => p.id === attackerId);
    const target = match.players.find(p => p.id === targetId);

    if (!attacker || !target || !attacker.isAlive || !target.isAlive) return false;
    if (!match.settings.friendlyFire && attacker.team === target.team) return false;

    attacker.damageDealt += damage;
    target.damageTaken += damage;
    target.health -= damage;

    if (target.health <= 0) {
      target.health = 0;
      target.isAlive = false;
      target.deaths++;
      attacker.kills++;

      // Respawn timer
      setTimeout(() => this.respawnPlayer(matchId, targetId), match.settings.respawnDelay);
    }

    // Check for winner
    this.checkWinner(matchId);
    return true;
  }

  // Respawn player
  private respawnPlayer(matchId: string, playerId: string): void {
    const match = activeMatches.get(matchId);
    if (!match || match.status !== 'active') return;

    const player = match.players.find(p => p.id === playerId);
    if (player) {
      player.health = player.maxHealth;
      player.isAlive = true;
    }
  }

  // Check for winner
  private checkWinner(matchId: string): void {
    const match = activeMatches.get(matchId);
    if (!match || match.status !== 'active') return;

    if (match.type === 'duel') {
      const alive = match.players.filter(p => p.isAlive);
      if (alive.length === 1) {
        this.endMatch(matchId, alive[0].id);
      }
    } else if (match.type === 'team') {
      const blueAlive = match.players.filter(p => p.team === 'blue' && p.isAlive).length;
      const redAlive = match.players.filter(p => p.team === 'red' && p.isAlive).length;

      if (blueAlive === 0 || redAlive === 0) {
        this.endMatch(matchId, blueAlive > 0 ? 'blue' : 'red');
      }
    }
  }

  // End match
  endMatch(matchId: string, winnerId?: string): void {
    const match = activeMatches.get(matchId);
    if (!match) return;

    match.status = 'ended';
    match.endTime = Date.now();
    match.winner = winnerId;

    // Calculate rewards
    this.calculateRewards(match);

    // Move to history
    matchHistory.push(match);
    activeMatches.delete(matchId);
  }

  // Calculate rewards
  private calculateRewards(match: ArenaMatch): void {
    const winner = match.players.find(p => p.id === match.winner);
    const baseReward = match.settings.stakes * match.players.length;

    for (const player of match.players) {
      let reward = 0;

      if (player.id === match.winner) {
        reward = baseReward;
      } else {
        reward = Math.floor(baseReward * 0.1);
      }

      // Bonus for performance
      reward += player.kills * 50;
      reward -= player.deaths * 25;

      match.rewards[player.id] = Math.max(0, reward);
    }
  }

  // Get match info
  getMatch(matchId: string): ArenaMatch | null {
    return activeMatches.get(matchId) ?? null;
  }

  // Get active matches
  getActiveMatches(): ArenaMatch[] {
    return Array.from(activeMatches.values()).filter(m => m.status !== 'ended');
  }

  // Get player stats
  getPlayerStats(playerId: string): { kills: number; deaths: number; matches: number } {
    let kills = 0;
    let deaths = 0;
    let matches = 0;

    for (const match of matchHistory) {
      const player = match.players.find(p => p.id === playerId);
      if (player) {
        kills += player.kills;
        deaths += player.deaths;
        matches++;
      }
    }

    return { kills, deaths, matches };
  }

  // Add spectator
  addSpectator(matchId: string, playerId: string): boolean {
    const match = activeMatches.get(matchId);
    if (!match || match.status === 'ended') return false;

    if (!match.spectators.includes(playerId)) {
      match.spectators.push(playerId);
    }
    return true;
  }

  // Remove spectator
  removeSpectator(matchId: string, playerId: string): boolean {
    const match = activeMatches.get(matchId);
    if (!match) return false;

    const index = match.spectators.indexOf(playerId);
    if (index !== -1) {
      match.spectators.splice(index, 1);
    }
    return true;
  }

  // Get match leaderboard
  getLeaderboard(limit = 10): Array<{ playerId: string; name: string; kills: number; deaths: number }> {
    const stats = new Map<string, { name: string; kills: number; deaths: number }>();

    for (const match of matchHistory) {
      for (const player of match.players) {
        const existing = stats.get(player.id) ?? { name: player.name, kills: 0, deaths: 0 };
        existing.kills += player.kills;
        existing.deaths += player.deaths;
        stats.set(player.id, existing);
      }
    }

    return Array.from(stats.entries())
      .map(([playerId, data]) => ({ playerId, ...data }))
      .sort((a, b) => b.kills - a.kills)
      .slice(0, limit);
  }
}

// Singleton
export const pvpArenaEngine = new PvPArenaEngine();

export default pvpArenaEngine;