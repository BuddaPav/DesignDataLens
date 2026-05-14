// Chronos: AI Chronicles - Memory System
// Tracks player choices, emotions, and history for personalized experiences

import type { 
  ChoiceRecord, 
  EmotionRecord, 
  Player,
  Consequence,
  NPCMemory,
  EmotionState
} from '@/types/game';

// ==================== MEMORY WEIGHTS ====================

interface MemoryWeight {
  baseImportance: number;
  emotionalBonus: number;
  recencyBonus: number;
  relevanceBonus: number;
}

const memoryWeights: MemoryWeight = {
  baseImportance: 1,
  emotionalBonus: 2,
  recencyBonus: 1.5,
  relevanceBonus: 2.5
};

// ==================== MEMORY CATEGORIES ====================

export type MemoryCategory = 
  | 'major_decision'      // Life-changing choices
  | 'character_moment'    // Character development
  | 'relationship_shift'  // Changes in relationships
  | 'world_impact'        // Actions affecting the world
  | 'personal_growth'     // Player's character growth
  | 'emotional_peak'      // High emotional moments
  | 'secret_discovered'   // Hidden knowledge found
  | 'promise_made'        // Commitments to NPCs
  | 'betrayal'           // Acts of betrayal
  | 'heroic_deed';       // Noble actions

// ==================== MEMORY SYSTEM ====================

export class MemorySystem {
  private choices: Map<string, ChoiceRecord> = new Map();
  private emotions: EmotionRecord[] = [];
  private storyFlags: Map<string, unknown> = new Map();
  // private relationshipHistory: Map<string, any[]> = new Map(); // Reserved for future use
  
  // Memory pruning threshold
  private readonly MAX_MEMORIES = 100;
  private readonly MEMORY_DECAY_DAYS = 30;

  // ==================== CHOICE TRACKING ====================

  recordChoice(
    player: Player,
    questId: string,
    sceneId: string,
    choiceId: string,
    choiceText: string,
    consequences: Consequence[],
    category?: MemoryCategory
  ): ChoiceRecord {
    
    const importance = this.calculateImportance(
      consequences, 
      player.emotionalHistory[player.emotionalHistory.length - 1],
      category
    );

    const record: ChoiceRecord = {
      id: `choice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      questId,
      sceneId,
      choiceId,
      choiceText,
      consequences,
      importance
    };

    this.choices.set(record.id, record);
    
    // Apply consequences
    this.applyConsequences(consequences);
    
    // Prune old memories if needed
    this.pruneMemories();
    
    return record;
  }

  private calculateImportance(
    consequences: Consequence[],
    emotion?: EmotionRecord,
    category?: MemoryCategory
  ): number {
    let importance = memoryWeights.baseImportance;

    // Consequence impact
    const significantConsequences = consequences.filter(c => 
      c.type === 'quest_unlock' || 
      c.type === 'world_event' ||
      c.type === 'npc_relationship'
    );
    importance += significantConsequences.length * 2;

    // Emotional impact
    if (emotion && emotion.intensity > 0.7) {
      importance += memoryWeights.emotionalBonus;
    }

    // Category bonus
    const categoryMultipliers: Record<MemoryCategory, number> = {
      major_decision: 3,
      betrayal: 3,
      heroic_deed: 2.5,
      world_impact: 2.5,
      emotional_peak: 2,
      character_moment: 1.5,
      relationship_shift: 1.5,
      personal_growth: 1.5,
      secret_discovered: 1.5,
      promise_made: 1
    };

    if (category) {
      importance *= categoryMultipliers[category] || 1;
    }

    return Math.min(importance, 10);
  }

  private applyConsequences(consequences: Consequence[]) {
    for (const consequence of consequences) {
      if (consequence.type === 'story_flag') {
        this.storyFlags.set(consequence.key, consequence.value);
      }
    }
  }

  // ==================== EMOTION TRACKING ====================

  recordEmotion(emotion: EmotionState, intensity: number, trigger: string): EmotionRecord {
    const record: EmotionRecord = {
      timestamp: Date.now(),
      emotion,
      intensity,
      trigger
    };

    this.emotions.push(record);
    
    // Keep only recent emotions
    if (this.emotions.length > 50) {
      this.emotions.shift();
    }

    return record;
  }

  getEmotionalTrend(duration: number = 3600000): { 
    dominant: EmotionState; 
    averageIntensity: number;
    volatility: number;
  } {
    const cutoff = Date.now() - duration;
    const recentEmotions = this.emotions.filter(e => e.timestamp > cutoff);

    if (recentEmotions.length === 0) {
      return { dominant: 'neutral', averageIntensity: 0.5, volatility: 0 };
    }

    // Count emotion occurrences
    const emotionCounts: Partial<Record<EmotionState, number>> = {};
    let totalIntensity = 0;

    for (const e of recentEmotions) {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      totalIntensity += e.intensity;
    }

    // Find dominant emotion
    let dominant: EmotionState = 'neutral';
    let maxCount = 0;

    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = emotion as EmotionState;
      }
    }

    // Calculate volatility (how much emotions change)
    let changes = 0;
    for (let i = 1; i < recentEmotions.length; i++) {
      if (recentEmotions[i].emotion !== recentEmotions[i - 1].emotion) {
        changes++;
      }
    }
    const volatility = changes / (recentEmotions.length - 1);

    return {
      dominant,
      averageIntensity: totalIntensity / recentEmotions.length,
      volatility
    };
  }

  // ==================== MEMORY RETRIEVAL ====================

  getRelevantMemories(context: {
    location?: string;
    npcId?: string;
    questId?: string;
    emotion?: EmotionState;
    limit?: number;
  }): ChoiceRecord[] {
    const { location, npcId, questId, emotion, limit = 5 } = context;

    const allMemories = Array.from(this.choices.values());
    
    // Score each memory for relevance
    const scoredMemories = allMemories.map(memory => {
      let score = memory.importance;

      // Recency bonus (newer = more relevant)
      const age = Date.now() - memory.timestamp;
      const recencyFactor = Math.max(0, 1 - age / (this.MEMORY_DECAY_DAYS * 24 * 60 * 60 * 1000));
      score += recencyFactor * memoryWeights.recencyBonus;

      // Location relevance
      if (location && memory.consequences.some(c => c.key.includes(location))) {
        score += memoryWeights.relevanceBonus;
      }

      // NPC relevance
      if (npcId && memory.consequences.some(c => 
        c.type === 'npc_relationship' && c.key === npcId
      )) {
        score += memoryWeights.relevanceBonus * 2;
      }

      // Quest relevance
      if (questId && memory.questId === questId) {
        score += memoryWeights.relevanceBonus;
      }

      // Emotional connection
      if (emotion && memory.importance > 7) {
        score += memoryWeights.emotionalBonus;
      }

      return { memory, score };
    });

    // Sort by score and return top memories
    scoredMemories.sort((a, b) => b.score - a.score);
    
    return scoredMemories.slice(0, limit).map(s => s.memory);
  }

  getMemoriesByCategory(_category: MemoryCategory): ChoiceRecord[] {
    void _category; // Mark as intentionally used
    // This would require storing category with each memory
    // For now, return high-importance memories as proxy
    return Array.from(this.choices.values())
      .filter(m => m.importance >= 7)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getMemoriesAboutNPC(npcId: string): ChoiceRecord[] {
    return Array.from(this.choices.values())
      .filter(m => m.consequences.some(c => 
        c.type === 'npc_relationship' && c.key === npcId
      ))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getPlayerPersonalityFromChoices(): {
    brave: number;
    cunning: number;
    kind: number;
    ruthless: number;
    honorable: number;
  } {
    const allChoices = Array.from(this.choices.values());
    
    let brave = 50;
    let cunning = 50;
    let kind = 50;
    let ruthless = 50;
    let honorable = 50;

    for (const choice of allChoices) {
      const text = choice.choiceText.toLowerCase();
      
      // Analyze choice text for personality indicators
      if (text.includes('protect') || text.includes('confront') || text.includes('stand')) {
        brave += 5;
      }
      if (text.includes('clever') || text.includes('deception') || text.includes('advantage')) {
        cunning += 5;
      }
      if (text.includes('help') || text.includes('mercy') || text.includes('compassion')) {
        kind += 5;
      }
      if (text.includes('whatever necessary') || text.includes('eliminate') || text.includes('ruthless')) {
        ruthless += 5;
      }
      if (text.includes('right') || text.includes('honor') || text.includes('noble')) {
        honorable += 5;
      }
    }

    // Clamp values
    return {
      brave: Math.min(100, Math.max(0, brave)),
      cunning: Math.min(100, Math.max(0, cunning)),
      kind: Math.min(100, Math.max(0, kind)),
      ruthless: Math.min(100, Math.max(0, ruthless)),
      honorable: Math.min(100, Math.max(0, honorable))
    };
  }

  // ==================== STORY FLAGS ====================

  setFlag(key: string, value: unknown) {
    this.storyFlags.set(key, value);
  }

  getFlag(key: string): unknown {
    return this.storyFlags.get(key);
  }

  hasFlag(key: string): boolean {
    return this.storyFlags.has(key);
  }

  getAllFlags(): Map<string, unknown> {
    return new Map(this.storyFlags);
  }

  // ==================== MEMORY PRUNING ====================

  private pruneMemories() {
    if (this.choices.size <= this.MAX_MEMORIES) return;

    const allMemories = Array.from(this.choices.values());
    
    // Sort by importance (keep important memories)
    allMemories.sort((a, b) => {
      // Always keep major decisions
      if (a.importance >= 8 && b.importance < 8) return -1;
      if (b.importance >= 8 && a.importance < 8) return 1;
      
      // Then sort by timestamp (newer first)
      return b.timestamp - a.timestamp;
    });

    // Keep top memories
    const memoriesToKeep = allMemories.slice(0, this.MAX_MEMORIES);
    
    // Rebuild map
    this.choices.clear();
    for (const memory of memoriesToKeep) {
      this.choices.set(memory.id, memory);
    }
  }

  // ==================== EXPORT/IMPORT ====================

  exportMemories(): {
    choices: ChoiceRecord[];
    emotions: EmotionRecord[];
    flags: Record<string, unknown>;
  } {
    const flags: Record<string, unknown> = {};
    this.storyFlags.forEach((value, key) => {
      flags[key] = value;
    });

    return {
      choices: Array.from(this.choices.values()),
      emotions: this.emotions,
      flags
    };
  }

  importMemories(data: {
    choices: ChoiceRecord[];
    emotions: EmotionRecord[];
    flags: Record<string, unknown>;
  }) {
    this.choices.clear();
    for (const choice of data.choices) {
      this.choices.set(choice.id, choice);
    }

    this.emotions = data.emotions;

    this.storyFlags.clear();
    for (const [key, value] of Object.entries(data.flags)) {
      this.storyFlags.set(key, value);
    }
  }

  // ==================== ANALYTICS ====================

  getMemoryStats(): {
    totalChoices: number;
    totalEmotions: number;
    activeFlags: number;
    averageImportance: number;
    dominantEmotion: EmotionState;
  } {
    const allChoices = Array.from(this.choices.values());
    const avgImportance = allChoices.length > 0
      ? allChoices.reduce((sum, c) => sum + c.importance, 0) / allChoices.length
      : 0;

    const emotionTrend = this.getEmotionalTrend();

    return {
      totalChoices: allChoices.length,
      totalEmotions: this.emotions.length,
      activeFlags: this.storyFlags.size,
      averageImportance: avgImportance,
      dominantEmotion: emotionTrend.dominant
    };
  }

  // ==================== NPC MEMORY CONVERSION ====================

  convertToNPCMemory(choice: ChoiceRecord, emotionalValence: number): NPCMemory {
    return {
      id: `npc_mem_${Date.now()}`,
      timestamp: choice.timestamp,
      type: this.determineMemoryType(choice),
      content: choice.choiceText,
      importance: choice.importance,
      relatedEntities: choice.consequences
        .filter(c => c.type === 'npc_relationship')
        .map(c => c.key),
      emotionalValence
    };
  }

  private determineMemoryType(choice: ChoiceRecord): NPCMemory['type'] {
    const text = choice.choiceText.toLowerCase();
    
    if (text.includes('betray') || text.includes('lie')) return 'betrayal';
    if (text.includes('thank') || text.includes('help')) return 'gratitude';
    if (text.includes('promise') || text.includes('swear')) return 'promise';
    if (choice.consequences.some(c => c.type === 'quest_complete')) return 'event';
    
    return 'observation';
  }
}

// Singleton instance
let memorySystemInstance: MemorySystem | null = null;

export function getMemorySystem(): MemorySystem {
  if (!memorySystemInstance) {
    memorySystemInstance = new MemorySystem();
  }
  return memorySystemInstance;
}

export function resetMemorySystem(): MemorySystem {
  memorySystemInstance = new MemorySystem();
  return memorySystemInstance;
}
