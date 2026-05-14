// Chronos: AI Chronicles - Emotion Detection System
// Analyzes player behavior to detect emotional state

import type { EmotionState, PlayerAction, PlayerArchetype } from '@/types/game';

function actionDetailString(details: unknown, key: string): string | undefined {
  if (!details || typeof details !== 'object') return undefined;
  const v = (details as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

// ==================== BEHAVIOR PATTERNS ====================

interface BehaviorPattern {
  name: string;
  indicators: {
    actionSpeed?: 'fast' | 'slow' | 'variable';
    actionTypes?: string[];
    repetition?: 'high' | 'low';
    exploration?: 'high' | 'low';
    combatFrequency?: 'high' | 'low';
    deathFrequency?: 'high' | 'low';
    pauseFrequency?: 'high' | 'low';
  };
  emotion: EmotionState;
  confidence: number;
}

const behaviorPatterns: BehaviorPattern[] = [
  {
    name: 'Excited Engagement',
    indicators: {
      actionSpeed: 'fast',
      repetition: 'low',
      exploration: 'high',
      combatFrequency: 'high',
      deathFrequency: 'low'
    },
    emotion: 'excited',
    confidence: 0.85
  },
  {
    name: 'Frustrated Struggle',
    indicators: {
      actionSpeed: 'fast',
      repetition: 'high',
      deathFrequency: 'high',
      pauseFrequency: 'high'
    },
    emotion: 'frustrated',
    confidence: 0.9
  },
  {
    name: 'Curious Exploration',
    indicators: {
      actionSpeed: 'slow',
      exploration: 'high',
      combatFrequency: 'low',
      repetition: 'low'
    },
    emotion: 'curious',
    confidence: 0.8
  },
  {
    name: 'Bored Disengagement',
    indicators: {
      actionSpeed: 'slow',
      repetition: 'high',
      exploration: 'low',
      pauseFrequency: 'high'
    },
    emotion: 'bored',
    confidence: 0.75
  },
  {
    name: 'Stressed Challenge',
    indicators: {
      actionSpeed: 'fast',
      combatFrequency: 'high',
      deathFrequency: 'high',
      pauseFrequency: 'low'
    },
    emotion: 'stressed',
    confidence: 0.85
  },
  {
    name: 'Relaxed Immersion',
    indicators: {
      actionSpeed: 'slow',
      exploration: 'high',
      combatFrequency: 'low',
      pauseFrequency: 'low'
    },
    emotion: 'relaxed',
    confidence: 0.7
  }
];

// ==================== ACTION METRICS ====================

interface ActionMetrics {
  totalActions: number;
  actionRate: number; // actions per minute
  actionTypes: Map<string, number>;
  averageDecisionTime: number;
  explorationScore: number;
  repetitionScore: number;
  combatRatio: number;
  deathRatio: number;
}

// ==================== EMOTION DETECTOR ====================

export class EmotionDetector {
  private actions: PlayerAction[] = [];
  private sessionStartTime: number = Date.now();
  private lastActionTime: number = Date.now();
  private decisionTimes: number[] = [];
  
  // Tracking specific behaviors
  private locationVisits: Map<string, number> = new Map();
  private npcInteractions: Map<string, number> = new Map();
  private questAttempts: Map<string, number> = new Map();
  private deathCount: number = 0;
  private combatCount: number = 0;
  private pauseCount: number = 0;

  // Current state
  private currentEmotion: EmotionState = 'neutral';
  private emotionConfidence: number = 0.5;
  private emotionHistory: { emotion: EmotionState; timestamp: number }[] = [];

  // ==================== ACTION TRACKING ====================

  recordAction(type: string, details?: unknown, duration?: number) {
    const action: PlayerAction = {
      timestamp: Date.now(),
      type,
      details,
      duration
    };

    this.actions.push(action);
    
    // Track decision time if applicable
    if (type === 'choice_made' || type === 'dialogue_selected') {
      const decisionTime = action.timestamp - this.lastActionTime;
      this.decisionTimes.push(decisionTime);
      
      // Keep only recent decision times
      if (this.decisionTimes.length > 20) {
        this.decisionTimes.shift();
      }
    }

    // Track specific action types
    switch (type) {
      case 'location_entered':
        this.trackLocationVisit(actionDetailString(details, 'locationId'));
        break;
      case 'npc_talked':
        this.trackNPCInteraction(actionDetailString(details, 'npcId'));
        break;
      case 'combat_started':
        this.combatCount++;
        break;
      case 'player_died':
        this.deathCount++;
        break;
      case 'game_paused':
        this.pauseCount++;
        break;
      case 'quest_attempted':
        this.trackQuestAttempt(actionDetailString(details, 'questId'));
        break;
    }

    this.lastActionTime = action.timestamp;

    // Prune old actions
    this.pruneActions();

    // Re-evaluate emotion periodically
    if (this.actions.length % 5 === 0) {
      this.evaluateEmotion();
    }
  }

  private trackLocationVisit(locationId?: string) {
    if (!locationId) return;
    const current = this.locationVisits.get(locationId) || 0;
    this.locationVisits.set(locationId, current + 1);
  }

  private trackNPCInteraction(npcId?: string) {
    if (!npcId) return;
    const current = this.npcInteractions.get(npcId) || 0;
    this.npcInteractions.set(npcId, current + 1);
  }

  private trackQuestAttempt(questId?: string) {
    if (!questId) return;
    const current = this.questAttempts.get(questId) || 0;
    this.questAttempts.set(questId, current + 1);
  }

  private pruneActions() {
    const cutoff = Date.now() - 300000; // Keep last 5 minutes
    this.actions = this.actions.filter(a => a.timestamp > cutoff);
  }

  // ==================== EMOTION EVALUATION ====================

  evaluateEmotion(): { emotion: EmotionState; confidence: number } {
    const metrics = this.calculateMetrics();
    const pattern = this.matchPattern(metrics);
    
    if (pattern) {
      this.currentEmotion = pattern.emotion;
      this.emotionConfidence = pattern.confidence;
    } else {
      // Default to neutral with low confidence
      this.currentEmotion = 'neutral';
      this.emotionConfidence = 0.3;
    }

    // Record in history
    this.emotionHistory.push({
      emotion: this.currentEmotion,
      timestamp: Date.now()
    });

    // Keep history manageable
    if (this.emotionHistory.length > 20) {
      this.emotionHistory.shift();
    }

    return {
      emotion: this.currentEmotion,
      confidence: this.emotionConfidence
    };
  }

  private calculateMetrics(): ActionMetrics {
    const recentActions = this.actions.filter(
      a => a.timestamp > Date.now() - 60000 // Last minute
    );

    const actionTypes = new Map<string, number>();
    for (const action of this.actions) {
      const count = actionTypes.get(action.type) || 0;
      actionTypes.set(action.type, count + 1);
    }

    // Calculate exploration score
    const uniqueLocations = this.locationVisits.size;
    const totalLocationVisits = Array.from(this.locationVisits.values())
      .reduce((sum, count) => sum + count, 0);
    const explorationScore = uniqueLocations / Math.max(totalLocationVisits, 1);

    // Calculate repetition score
    const repeatedLocations = Array.from(this.locationVisits.values())
      .filter(count => count > 2).length;
    const repetitionScore = repeatedLocations / Math.max(uniqueLocations, 1);

    // Calculate combat ratio
    const totalActions = this.actions.length;
    const combatRatio = this.combatCount / Math.max(totalActions, 1);

    // Calculate death ratio
    const deathRatio = this.deathCount / Math.max(this.combatCount, 1);

    // Calculate average decision time
    const avgDecisionTime = this.decisionTimes.length > 0
      ? this.decisionTimes.reduce((sum, t) => sum + t, 0) / this.decisionTimes.length
      : 0;

    return {
      totalActions: this.actions.length,
      actionRate: recentActions.length,
      actionTypes,
      averageDecisionTime: avgDecisionTime,
      explorationScore,
      repetitionScore,
      combatRatio,
      deathRatio
    };
  }

  private matchPattern(metrics: ActionMetrics): BehaviorPattern | null {
    let bestMatch: BehaviorPattern | null = null;
    let bestScore = 0;

    for (const pattern of behaviorPatterns) {
      const score = this.calculatePatternScore(pattern, metrics);
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    return bestMatch;
  }

  private calculatePatternScore(pattern: BehaviorPattern, metrics: ActionMetrics): number {
    let score = 0;
    let factors = 0;

    const { indicators } = pattern;

    // Action speed
    if (indicators.actionSpeed) {
      factors++;
      const avgDecisionTime = metrics.averageDecisionTime;
      if (indicators.actionSpeed === 'fast' && avgDecisionTime < 3000) {
        score += 1;
      } else if (indicators.actionSpeed === 'slow' && avgDecisionTime > 5000) {
        score += 1;
      } else if (indicators.actionSpeed === 'variable' && avgDecisionTime > 3000 && avgDecisionTime < 8000) {
        score += 0.5;
      }
    }

    // Repetition
    if (indicators.repetition) {
      factors++;
      if (indicators.repetition === 'high' && metrics.repetitionScore > 0.3) {
        score += 1;
      } else if (indicators.repetition === 'low' && metrics.repetitionScore < 0.2) {
        score += 1;
      }
    }

    // Exploration
    if (indicators.exploration) {
      factors++;
      if (indicators.exploration === 'high' && metrics.explorationScore > 0.5) {
        score += 1;
      } else if (indicators.exploration === 'low' && metrics.explorationScore < 0.3) {
        score += 1;
      }
    }

    // Combat frequency
    if (indicators.combatFrequency) {
      factors++;
      if (indicators.combatFrequency === 'high' && metrics.combatRatio > 0.3) {
        score += 1;
      } else if (indicators.combatFrequency === 'low' && metrics.combatRatio < 0.1) {
        score += 1;
      }
    }

    // Death frequency
    if (indicators.deathFrequency) {
      factors++;
      if (indicators.deathFrequency === 'high' && metrics.deathRatio > 0.3) {
        score += 1;
      } else if (indicators.deathFrequency === 'low' && metrics.deathRatio < 0.1) {
        score += 1;
      }
    }

    // Pause frequency (proxy for engagement)
    if (indicators.pauseFrequency) {
      factors++;
      const sessionDuration = Date.now() - this.sessionStartTime;
      const pauseRatio = this.pauseCount / Math.max(sessionDuration / 60000, 1);
      
      if (indicators.pauseFrequency === 'high' && pauseRatio > 0.5) {
        score += 1;
      } else if (indicators.pauseFrequency === 'low' && pauseRatio < 0.2) {
        score += 1;
      }
    }

    return factors > 0 ? score / factors : 0;
  }

  // ==================== PUBLIC API ====================

  getCurrentEmotion(): { emotion: EmotionState; confidence: number } {
    return {
      emotion: this.currentEmotion,
      confidence: this.emotionConfidence
    };
  }

  getEmotionHistory(duration: number = 300000): { emotion: EmotionState; timestamp: number }[] {
    const cutoff = Date.now() - duration;
    return this.emotionHistory.filter(e => e.timestamp > cutoff);
  }

  getEmotionTrend(): 'improving' | 'declining' | 'stable' | 'volatile' {
    if (this.emotionHistory.length < 5) return 'stable';

    const recent = this.emotionHistory.slice(-5);
    const emotions = recent.map(e => e.emotion);

    // Check for volatility
    const uniqueEmotions = new Set(emotions);
    if (uniqueEmotions.size >= 4) return 'volatile';

    // Check for improvement (negative -> positive)
    const negativeEmotions = ['frustrated', 'stressed', 'bored'];
    const positiveEmotions = ['excited', 'curious', 'relaxed'];

    const earlyNegative = negativeEmotions.includes(emotions[0]);
    const latePositive = positiveEmotions.includes(emotions[emotions.length - 1]);

    if (earlyNegative && latePositive) return 'improving';

    // Check for decline
    const earlyPositive = positiveEmotions.includes(emotions[0]);
    const lateNegative = negativeEmotions.includes(emotions[emotions.length - 1]);

    if (earlyPositive && lateNegative) return 'declining';

    return 'stable';
  }

  getPlayerArchetype(): {
    archetype: PlayerArchetype | 'undetermined';
    confidence: number;
  } {
    const metrics = this.calculateMetrics();
    const actionTypes = metrics.actionTypes;

    const explorerScore = 
      (actionTypes.get('location_entered') || 0) * 2 +
      (actionTypes.get('secret_discovered') || 0) * 3;

    const achieverScore = 
      (actionTypes.get('quest_completed') || 0) * 3 +
      (actionTypes.get('achievement_unlocked') || 0) * 2;

    const socializerScore = 
      (actionTypes.get('npc_talked') || 0) * 2 +
      (actionTypes.get('dialogue_selected') || 0);

    const killerScore = 
      (actionTypes.get('combat_started') || 0) * 2 +
      (actionTypes.get('enemy_defeated') || 0) * 2;

    const scores = [
      { type: 'explorer', score: explorerScore },
      { type: 'achiever', score: achieverScore },
      { type: 'socializer', score: socializerScore },
      { type: 'killer', score: killerScore }
    ];

    scores.sort((a, b) => b.score - a.score);

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const topScore = scores[0];

    if (totalScore === 0 || topScore.score === 0) {
      return { archetype: 'undetermined', confidence: 0 };
    }

    const confidence = topScore.score / totalScore;

    return {
      archetype: topScore.type as PlayerArchetype | 'undetermined',
      confidence
    };
  }

  getSessionMetrics() {
    const metrics = this.calculateMetrics();
    
    return {
      startTime: this.sessionStartTime,
      actionsCount: this.actions.length,
      choicesMade: this.actions.filter(a => a.type === 'choice_made').length,
      combatEncounters: this.combatCount,
      dialogueExchanges: this.actions.filter(a => a.type === 'dialogue').length,
      explorationScore: metrics.explorationScore,
      avgDecisionTime: metrics.averageDecisionTime
    };
  }

  // ==================== ADAPTATION SUGGESTIONS ====================

  getAdaptationSuggestions(): {
    type: 'pace' | 'difficulty' | 'content' | 'social';
    suggestion: string;
    reason: string;
  }[] {
    const suggestions: { type: 'pace' | 'difficulty' | 'content' | 'social'; suggestion: string; reason: string; }[] = [];
    const emotion = this.getCurrentEmotion();
    void this.getEmotionTrend; // Mark as intentionally referenced
    const archetype = this.getPlayerArchetype();

    // Pace adaptations
    if (emotion.emotion === 'frustrated' && emotion.confidence > 0.7) {
      suggestions.push({
        type: 'difficulty',
        suggestion: 'reduce_difficulty',
        reason: 'Player showing signs of frustration with high death count'
      });
    }

    if (emotion.emotion === 'bored' && emotion.confidence > 0.6) {
      suggestions.push({
        type: 'pace',
        suggestion: 'increase_pace',
        reason: 'Player actions are slow and repetitive, indicating boredom'
      });
    }

    if (emotion.emotion === 'stressed') {
      suggestions.push({
        type: 'pace',
        suggestion: 'add_break_point',
        reason: 'Player showing stress signals, needs moment to breathe'
      });
    }

    // Content adaptations based on archetype
    if (archetype.archetype === 'explorer' && archetype.confidence > 0.6) {
      suggestions.push({
        type: 'content',
        suggestion: 'add_secrets',
        reason: 'Player is exploring extensively, reward with hidden content'
      });
    }

    if (archetype.archetype === 'socializer' && archetype.confidence > 0.6) {
      suggestions.push({
        type: 'social',
        suggestion: 'add_npc_interaction',
        reason: 'Player enjoys NPC interactions, provide more dialogue options'
      });
    }

    if (archetype.archetype === 'killer' && archetype.confidence > 0.6) {
      suggestions.push({
        type: 'content',
        suggestion: 'add_combat',
        reason: 'Player engages frequently in combat, provide challenging encounters'
      });
    }

    return suggestions;
  }

  // ==================== RESET ====================

  reset() {
    this.actions = [];
    this.sessionStartTime = Date.now();
    this.lastActionTime = Date.now();
    this.decisionTimes = [];
    this.locationVisits.clear();
    this.npcInteractions.clear();
    this.questAttempts.clear();
    this.deathCount = 0;
    this.combatCount = 0;
    this.pauseCount = 0;
    this.currentEmotion = 'neutral';
    this.emotionConfidence = 0.5;
    this.emotionHistory = [];
  }
}

// Singleton instance
let detectorInstance: EmotionDetector | null = null;

export function getEmotionDetector(): EmotionDetector {
  if (!detectorInstance) {
    detectorInstance = new EmotionDetector();
  }
  return detectorInstance;
}

export function resetEmotionDetector(): EmotionDetector {
  detectorInstance = new EmotionDetector();
  return detectorInstance;
}
