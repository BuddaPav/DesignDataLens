// Chronos: AI Chronicles - Dynamic NPC System
// Living NPCs with relationships, memories, and autonomous behavior

import type {
  NPC,
  NPCPersonality,
  Relationship,
  RelationshipType,
  RelationshipEvent,
  NPCMemory,
  NPCSchedule,
  NPCGoal,
  Secret,
  Player,
  Location,
  WorldEra,
  GameTime,
  Weather,
  Attributes,
} from '@/types/game';
import { buildNPCReplySync } from '@/engine/dialogueSystem';
import { getMemorySystem } from './MemorySystem';
import { getLanguage } from '@/i18n';
import { buildKnowledgeBaseFromPool } from '@/engine/knowledge';
import { defaultMentalState, applyNegativePlayerInteraction, applyPositivePlayerInteraction, driftMentalState } from '@/engine/psychology';
import { spreadKnowledgeFromGossip } from '@/engine/worldEvents';
import { effectiveGossipImpact, shouldNpcSpreadGossip } from '@/domain/social/npcIndividuality';
import { trustDeltaTowardPlayerFromAllyDeath } from '@/domain/social/inheritGrudgeRules';

export type NPCSystemSerialized = {
  npcs: [string, NPC][];
  relationships: Array<{ id: string; rels: [string, Relationship][] }>;
};

// ==================== NPC TEMPLATES ====================

interface NPCTemplate {
  id: string;
  name: string;
  title: string;
  /** Краткая профессия для диалогов (язык шаблона — EN, UI может локализовать позже) */
  profession: string;
  age: number;
  /** Ключ пула знаний в knowledge.ts (medieval/modern/future) */
  professionKey: string;
  /** Эпоха для банка знаний при генерации */
  knowledgeEra: WorldEra;
  appearance: string;
  personality: Partial<NPCPersonality>;
  backstory: string;
  roleInStory: string;
  secrets: Partial<Secret>[];
}

const npcTemplates: NPCTemplate[] = [
  {
    id: 'elara',
    name: 'Elara Moonwhisper',
    title: 'Mysterious Sorceress',
    profession: 'колдунья и исследовательница запретных знаний',
    age: 34,
    professionKey: 'sorcerer',
    knowledgeEra: 'medieval',
    appearance: 'A woman with silver hair and eyes that shimmer like starlight. Her robes seem to move with a breeze that isn\'t there.',
    personality: {
      openness: 0.9,
      conscientiousness: 0.6,
      extraversion: 0.4,
      agreeableness: 0.5,
      neuroticism: 0.7,
      bravery: 70,
      loyalty: 40,
      greed: 30,
      ambition: 90,
      empathy: 60
    },
    backstory: 'Once a student at the Academy of Stars, Elara discovered forbidden knowledge that led to her exile. She now seeks to uncover the truth about the Void.',
    roleInStory: 'Mentor and guide, but with hidden motives',
    secrets: [
      { id: 'elara_1', content: 'She caused the death of her mentor', knownBy: [], discoveredByPlayer: false },
      { id: 'elara_2', content: 'She is being hunted by the Academy', knownBy: [], discoveredByPlayer: false }
    ]
  },
  {
    id: 'thorin',
    name: 'Thorin Ironheart',
    title: 'Veteran Warrior',
    profession: 'ветеран войны и тактик',
    age: 156,
    professionKey: 'warrior',
    knowledgeEra: 'medieval',
    appearance: 'A burly dwarf with a braided beard and scars crisscrossing his arms. His eyes hold the weight of a hundred battles.',
    personality: {
      openness: 0.3,
      conscientiousness: 0.8,
      extraversion: 0.7,
      agreeableness: 0.6,
      neuroticism: 0.2,
      bravery: 95,
      loyalty: 90,
      greed: 40,
      ambition: 50,
      empathy: 70
    },
    backstory: 'Thorin fought in the Great War and lost his entire company. He drinks to forget, but the memories never fade.',
    roleInStory: 'Loyal companion and moral compass',
    secrets: [
      { id: 'thorin_1', content: 'He abandoned his company to survive', knownBy: [], discoveredByPlayer: false },
      { id: 'thorin_2', content: 'He has a daughter he hasn\'t seen in 20 years', knownBy: [], discoveredByPlayer: false }
    ]
  },
  {
    id: 'vesper',
    name: 'Vesper Nightshade',
    title: 'Cunning Rogue',
    profession: 'агент воровской гильдии',
    age: 26,
    professionKey: 'rogue',
    knowledgeEra: 'medieval',
    appearance: 'A lithe figure wrapped in dark leather. Her smile never reaches her eyes, which constantly scan for exits.',
    personality: {
      openness: 0.6,
      conscientiousness: 0.3,
      extraversion: 0.8,
      agreeableness: 0.3,
      neuroticism: 0.5,
      bravery: 60,
      loyalty: 20,
      greed: 80,
      ambition: 85,
      empathy: 30
    },
    backstory: 'Raised in the Thieves\' Guild, Vesper learned that trust is a weapon and love is a weakness. She\'s never met a lock she couldn\'t pick or a person she couldn\'t manipulate.',
    roleInStory: 'Unreliable ally with valuable skills',
    secrets: [
      { id: 'vesper_1', content: 'She is the Guildmaster\'s illegitimate child', knownBy: [], discoveredByPlayer: false },
      { id: 'vesper_2', content: 'She stole a cursed artifact', knownBy: [], discoveredByPlayer: false }
    ]
  },
  {
    id: 'aria',
    name: 'Aria Dawnbringer',
    title: 'Idealistic Paladin',
    profession: 'паладин Ордена Рассвета',
    age: 24,
    professionKey: 'paladin',
    knowledgeEra: 'medieval',
    appearance: 'A young woman in gleaming armor, her eyes bright with unwavering conviction. A holy symbol hangs at her neck.',
    personality: {
      openness: 0.5,
      conscientiousness: 0.9,
      extraversion: 0.7,
      agreeableness: 0.8,
      neuroticism: 0.3,
      bravery: 90,
      loyalty: 95,
      greed: 10,
      ambition: 70,
      empathy: 90
    },
    backstory: 'Aria was orphaned by bandits and raised by the Order of the Dawn. She believes absolutely in justice and mercy, sometimes to a fault.',
    roleInStory: 'Moral challenge and potential romance',
    secrets: [
      { id: 'aria_1', content: 'She is questioning her faith', knownBy: [], discoveredByPlayer: false },
      { id: 'aria_2', content: 'She has feelings for someone she shouldn\'t', knownBy: [], discoveredByPlayer: false }
    ]
  },
  {
    id: 'mortimer',
    name: 'Mortimer Blackwood',
    title: 'Eccentric Alchemist',
    profession: 'алхимик и маргинальный учёный',
    age: 67,
    professionKey: 'alchemist',
    knowledgeEra: 'medieval',
    appearance: 'An elderly man with wild white hair and stained robes. His laboratory smells of sulfur and something... else.',
    personality: {
      openness: 0.95,
      conscientiousness: 0.2,
      extraversion: 0.4,
      agreeableness: 0.5,
      neuroticism: 0.8,
      bravery: 40,
      loyalty: 50,
      greed: 60,
      ambition: 80,
      empathy: 40
    },
    backstory: 'Mortimer was once a respected scholar until his experiments crossed ethical lines. Now he lives on the fringes, still pursuing knowledge at any cost.',
    roleInStory: 'Source of power and potential corruption',
    secrets: [
      { id: 'mortimer_1', content: 'He has extended his life through forbidden means', knownBy: [], discoveredByPlayer: false },
      { id: 'mortimer_2', content: 'He is slowly going mad', knownBy: [], discoveredByPlayer: false }
    ]
  },
  {
    id: 'kira',
    name: 'Kira Stormwind',
    title: 'Rebellious Princess',
    profession: 'беглая знать и политический ум',
    age: 22,
    professionKey: 'noble',
    knowledgeEra: 'medieval',
    appearance: 'A young woman in travel-worn clothes, her royal bearing betrayed by her determined gaze. She carries herself like someone who\'s never been told "no."',
    personality: {
      openness: 0.8,
      conscientiousness: 0.4,
      extraversion: 0.9,
      agreeableness: 0.4,
      neuroticism: 0.4,
      bravery: 85,
      loyalty: 60,
      greed: 30,
      ambition: 95,
      empathy: 50
    },
    backstory: 'Kira ran away from an arranged marriage and has been living as a commoner. She\'s determined to prove she can survive without her title.',
    roleInStory: 'Political ally with complicated loyalties',
    secrets: [
      { id: 'kira_1', content: 'She is the rightful heir to the throne', knownBy: [], discoveredByPlayer: false },
      { id: 'kira_2', content: 'She knows who killed her mother', knownBy: [], discoveredByPlayer: false }
    ]
  }
];

// ==================== NPC SYSTEM ====================

export class NPCSystem {
  private npcs: Map<string, NPC> = new Map();
  private relationships: Map<string, Map<string, Relationship>> = new Map();

  constructor() {
    this.initializeNPCs();
  }

  // ==================== INITIALIZATION ====================

  private initializeNPCs() {
    for (const template of npcTemplates) {
      const npc = this.createNPCFromTemplate(template);
      this.npcs.set(npc.id, npc);
    }

    // Initialize relationships between NPCs
    this.initializeNPCRelationships();

    // Ensure per-NPC relationship maps are hydrated
    this.hydrateNPCRelationshipMaps();
  }

  private createNPCFromTemplate(template: NPCTemplate): NPC {
    const personality: NPCPersonality = {
      openness: template.personality.openness || 0.5,
      conscientiousness: template.personality.conscientiousness || 0.5,
      extraversion: template.personality.extraversion || 0.5,
      agreeableness: template.personality.agreeableness || 0.5,
      neuroticism: template.personality.neuroticism || 0.5,
      bravery: template.personality.bravery || 50,
      loyalty: template.personality.loyalty || 50,
      greed: template.personality.greed || 50,
      ambition: template.personality.ambition || 50,
      empathy: template.personality.empathy || 50
    };

    const knowledgeBase = buildKnowledgeBaseFromPool(template.knowledgeEra, template.professionKey);

    return {
      id: template.id,
      name: template.name,
      title: template.title,
      age: template.age,
      profession: template.profession,
      professionKey: template.professionKey,
      avatar: `/npcs/${template.id}.png`,
      appearance: template.appearance,
      personality,
      knowledgeBase,
      mentalState: defaultMentalState(),
      status: 'alive',
      location: 'unknown',
      level: 5 + Math.floor(Math.random() * 10),
      attributes: this.generateAttributes(personality),
      memories: [],
      relationships: new Map(),
      playerRelationship: this.createInitialRelationship(),
      schedule: this.generateSchedule(template.id),
      goals: this.generateGoals(template),
      secrets: template.secrets?.map(s => ({
        id: s.id || `secret_${Date.now()}`,
        content: s.content || '',
        knownBy: s.knownBy || [],
        discoveredByPlayer: s.discoveredByPlayer || false,
        revealConditions: []
      })) || [],
      backstory: template.backstory,
      roleInStory: template.roleInStory
    };
  }

  private generateAttributes(personality: NPCPersonality): Attributes {
    return {
      strength: Math.floor(personality.bravery * 0.5 + personality.conscientiousness * 30),
      intelligence: Math.floor(personality.openness * 50 + personality.conscientiousness * 30),
      charisma: Math.floor(personality.extraversion * 50 + personality.agreeableness * 30),
      agility: Math.floor(50 + Math.random() * 30),
      wisdom: Math.floor(personality.openness * 30 + personality.empathy * 40),
      luck: Math.floor(50 + Math.random() * 20)
    };
  }

  private createInitialRelationship(): Relationship {
    return {
      type: 'stranger',
      trust: 0,
      affection: 0,
      respect: 0,
      fear: 0,
      history: []
    };
  }

  private generateSchedule(_npcId: string): NPCSchedule {
    void _npcId; // Mark as intentionally used
    const routines = [];
    
    // Morning routine
    routines.push({
      startHour: 6,
      endHour: 9,
      location: 'home',
      activity: 'morning_routine'
    });

    // Work/day activity
    routines.push({
      startHour: 9,
      endHour: 17,
      location: 'work',
      activity: 'working'
    });

    // Evening
    routines.push({
      startHour: 17,
      endHour: 22,
      location: 'tavern',
      activity: 'socializing'
    });

    // Night
    routines.push({
      startHour: 22,
      endHour: 6,
      location: 'home',
      activity: 'sleeping'
    });

    return {
      defaultLocation: 'home',
      routines,
      currentActivity: 'unknown'
    };
  }

  private generateGoals(template: NPCTemplate): NPCGoal[] {
    const goals: NPCGoal[] = [];

    // Primary goal based on personality
    if (template.personality.ambition && template.personality.ambition > 70) {
      goals.push({
        id: `goal_${template.id}_1`,
        description: 'Achieve greatness and recognition',
        priority: 90,
        progress: 30
      });
    }

    if (template.personality.greed && template.personality.greed > 60) {
      goals.push({
        id: `goal_${template.id}_2`,
        description: 'Accumulate wealth and power',
        priority: 80,
        progress: 40
      });
    }

    if (template.personality.loyalty && template.personality.loyalty > 70) {
      goals.push({
        id: `goal_${template.id}_3`,
        description: 'Protect those I care about',
        priority: 95,
        progress: 50
      });
    }

    return goals;
  }

  private initializeNPCRelationships() {
    // Define some pre-existing relationships
    const relationshipPairs = [
      { npc1: 'elara', npc2: 'mortimer', type: 'acquaintance', trust: 20 },
      { npc1: 'thorin', npc2: 'aria', type: 'friend', trust: 60 },
      { npc1: 'vesper', npc2: 'kira', type: 'rival', trust: -30 },
      { npc1: 'elara', npc2: 'aria', type: 'stranger', trust: 0 }
    ];

    for (const pair of relationshipPairs) {
      this.setNPCRelationship(pair.npc1, pair.npc2, {
        type: pair.type as RelationshipType,
        trust: pair.trust,
        affection: 0,
        respect: 0,
        fear: 0,
        history: [{
          timestamp: Date.now() - 86400000 * 30,
          type: 'first_meet',
          description: 'Met in the city',
          impact: 0
        }]
      });
    }
  }

  // ==================== RELATIONSHIP MANAGEMENT ====================

  getNPC(npcId: string): NPC | undefined {
    return this.npcs.get(npcId);
  }

  getAllNPCs(): NPC[] {
    return Array.from(this.npcs.values());
  }

  getNPCsInLocation(locationId: string): NPC[] {
    return this.getAllNPCs().filter(npc => npc.location === locationId);
  }

  /**
   * Нейтральная пара NPC↔NPC для симуляции (если записи ещё нет).
   */
  ensureRelationshipPair(npc1Id: string, npc2Id: string): void {
    if (npc1Id === npc2Id) return;
    if (this.getNPCRelationship(npc1Id, npc2Id)) return;
    const neutral = this.createInitialRelationship();
    this.setNPCRelationship(npc1Id, npc2Id, neutral);
  }

  setNPCRelationship(npc1Id: string, npc2Id: string, relationship: Relationship) {
    if (!this.relationships.has(npc1Id)) {
      this.relationships.set(npc1Id, new Map());
    }
    this.relationships.get(npc1Id)!.set(npc2Id, relationship);

    // Set reciprocal relationship
    if (!this.relationships.has(npc2Id)) {
      this.relationships.set(npc2Id, new Map());
    }
    this.relationships.get(npc2Id)!.set(npc1Id, {
      ...relationship,
      history: [...relationship.history]
    });

    // Also hydrate per-NPC relationship maps for autonomous behavior
    const npc1 = this.npcs.get(npc1Id);
    const npc2 = this.npcs.get(npc2Id);
    if (npc1) npc1.relationships.set(npc2Id, relationship);
    if (npc2) npc2.relationships.set(npc1Id, { ...relationship, history: [...relationship.history] });
  }

  getNPCRelationship(npc1Id: string, npc2Id: string): Relationship | undefined {
    return this.relationships.get(npc1Id)?.get(npc2Id);
  }

  private hydrateNPCRelationshipMaps() {
    for (const [npc1Id, rels] of this.relationships.entries()) {
      const npc1 = this.npcs.get(npc1Id);
      if (!npc1) continue;
      for (const [npc2Id, rel] of rels.entries()) {
        npc1.relationships.set(npc2Id, rel);
      }
    }
  }

  // ==================== LOCATION SYNC ====================

  setNPCLocation(npcId: string, locationId: string) {
    const npc = this.npcs.get(npcId);
    if (!npc) return;
    npc.location = locationId;
  }

  /**
   * Sync NPC locations based on Location.npcs lists.
   * - If an NPC appears in multiple locations, first match wins.
   * - NPCs not present in any location keep their existing location.
   */
  syncNPCsToLocations(locations: Location[]) {
    const firstLocationByNpc = new Map<string, string>();
    for (const loc of locations) {
      for (const npcId of loc.npcs) {
        if (!firstLocationByNpc.has(npcId)) {
          firstLocationByNpc.set(npcId, loc.id);
        }
      }
    }

    for (const [npcId, npc] of this.npcs.entries()) {
      const locId = firstLocationByNpc.get(npcId);
      if (locId) npc.location = locId;
    }
  }

  // ==================== PLAYER INTERACTION ====================

  interactWithPlayer(
    npcId: string,
    player: Player,
    interactionType: string,
    impact: number,
    locationId?: string
  ): {
    rumor?: {
      locationId: string;
      reputationDelta: number;
      affectedNpcIds: string[];
      trustDeltaByNpcId: Record<string, number>;
      /** Импакт после «спина» личности/отношений — для текста слуха на рынке `activeRumors`. */
      effectiveImpact: number;
    };
    /** Сообщение для журнала мира (сплетни, социальные эффекты) */
    worldLogMessage?: string;
  } {
    const npc = this.npcs.get(npcId);
    if (!npc) return {};

    const relationship = npc.playerRelationship;

    // Record the interaction
    const event: RelationshipEvent = {
      timestamp: Date.now(),
      type: this.mapInteractionType(interactionType),
      description: interactionType,
      impact
    };

    relationship.history.push(event);

    // Update relationship values based on interaction
    this.updateRelationshipValues(relationship, interactionType, impact, npc.personality);

    // Психология: сильные негативные/позитивные контакты меняют стресс и травму
    if (impact < 0) {
      applyNegativePlayerInteraction(npc, impact * 10);
    } else if (impact > 0) {
      applyPositivePlayerInteraction(npc, impact * 10);
    }

    // Update relationship type if thresholds are crossed
    this.updateRelationshipType(relationship);

    const locHint = locationId ? ` @${locationId}` : '';
    this.addMemoryToNPC(npcId, {
      id: `mem_${Date.now()}`,
      timestamp: Date.now(),
      type: 'conversation',
      content:
        interactionType === 'talk'
          ? `Разговор с игроком ${player.character.name}${locHint}.`
          : `Игрок: действие «${interactionType}»${locHint}.`,
      importance: Math.abs(impact) > 20 ? 8 : 5,
      relatedEntities: [player.id, ...(locationId ? [locationId] : [])],
      emotionalValence: impact > 0 ? 1 : -1
    });

    // Also record in global memory system
    void getMemorySystem(); // Ensure memory system is available
    // This would be called from the game logic

    const effectiveImpact = effectiveGossipImpact(relationship, impact);

    // Social propagation: rumors that affect others' opinions + local reputation
    const shouldSpreadRumor = shouldNpcSpreadGossip({
      locationId,
      personality: npc.personality,
      relationship,
      effectiveImpact
    });

    if (!shouldSpreadRumor) return {};

    const others = this.getNPCsInLocation(locationId!).filter(n => n.id !== npcId);
    const trustDeltaByNpcId: Record<string, number> = {};

    // Extraverted NPCs influence others more strongly; заряд — по эффективному импакту (спин отношений)
    const baseTrustDelta = effectiveImpact * 8 * npc.personality.extraversion;
    for (const other of others) {
      // More agreeable NPCs are more influenced by social signals
      const agreeFactor = other.personality.agreeableness * 0.6 + 0.7;
      const delta = baseTrustDelta * agreeFactor;
      other.playerRelationship.trust = Math.max(-100, Math.min(100, other.playerRelationship.trust + delta));
      trustDeltaByNpcId[other.id] = delta;
    }

    // Передача фактов между NPC (обучение через сплетню)
    spreadKnowledgeFromGossip(npc, others, Math.abs(effectiveImpact));

    // Reputation delta is softer than direct trust changes
    const reputationDelta = Math.round(effectiveImpact * 5);

    const lang = getLanguage();
    const worldLogMessage =
      effectiveImpact < 0
        ? lang === 'ru'
          ? `${npc.name} распускает недобрые слухи о встрече — настроение в локации вредит вам.`
          : `${npc.name} spreads unkind talk about the encounter—local sentiment turns against you.`
        : lang === 'ru'
          ? `${npc.name} тепло отзывается о вас — в локации мнения чуть улучшились.`
          : `${npc.name} speaks warmly about you—local opinions edge in your favor.`;

    return {
      rumor: {
        locationId: locationId!,
        reputationDelta,
        affectedNpcIds: others.map(o => o.id),
        trustDeltaByNpcId,
        effectiveImpact
      },
      worldLogMessage
    };
  }

  /** После батча последствий сцены (дельты trust/affection из `applyChoiceConsequences`). */
  syncPlayerRelationshipType(npcId: string): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;
    this.updateRelationshipType(npc.playerRelationship);
  }

  private mapInteractionType(type: string): RelationshipEvent['type'] {
    const mapping: Record<string, RelationshipEvent['type']> = {
      'helped': 'helped',
      'betrayed': 'betrayed',
      'saved': 'saved',
      'fought': 'fought',
      'gift': 'gift',
      'talked': 'conversation',
      'quest': 'quest'
    };
    return mapping[type] || 'conversation';
  }

  private updateRelationshipValues(
    relationship: Relationship, 
    type: string, 
    impact: number,
    personality: NPCPersonality
  ) {
    // Different personality types value different things
    switch (type) {
      case 'helped':
        relationship.trust += impact * (personality.agreeableness * 0.5 + 0.5);
        relationship.affection += impact * (personality.empathy / 100);
        break;
      case 'betrayed':
        relationship.trust -= impact * 2;
        relationship.affection -= impact * 1.5;
        if (personality.neuroticism > 0.6) {
          relationship.fear += impact;
        }
        break;
      case 'saved':
        relationship.trust += impact;
        relationship.affection += impact * 1.5;
        relationship.respect += impact;
        break;
      case 'gift':
        relationship.affection += impact * (personality.greed / 100 + 0.5);
        if (personality.greed > 60) {
          relationship.trust += impact * 0.5;
        }
        break;
      case 'quest':
        relationship.respect += impact * (personality.conscientiousness * 0.5 + 0.5);
        relationship.trust += impact * 0.5;
        break;
      default:
        relationship.trust += impact * 0.3;
        relationship.affection += impact * 0.2;
    }

    // Clamp values
    relationship.trust = Math.max(-100, Math.min(100, relationship.trust));
    relationship.affection = Math.max(-100, Math.min(100, relationship.affection));
    relationship.respect = Math.max(-100, Math.min(100, relationship.respect));
    relationship.fear = Math.max(0, Math.min(100, relationship.fear));
  }

  private updateRelationshipType(relationship: Relationship) {
    const { trust, affection, fear } = relationship;

    // Порог «враг»: сильная ненависть или страх + низкое доверие (эмерджентный босс-кандидат в будущем)
    if (trust <= -80) {
      relationship.type = 'enemy';
    } else if (fear > 60 && trust < -20) {
      relationship.type = 'enemy';
    } else if (trust < -40) {
      relationship.type = 'rival';
    } else if (trust > 80 && affection > 70) {
      relationship.type = 'lover';
    } else if (trust > 60 && affection > 40) {
      relationship.type = 'close_friend';
    } else if (trust > 30 || affection > 30) {
      relationship.type = 'friend';
    } else if (trust > -20) {
      relationship.type = 'acquaintance';
    } else {
      relationship.type = 'stranger';
    }
  }

  // ==================== MEMORY SYSTEM ====================

  addMemoryToNPC(npcId: string, memory: NPCMemory) {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    npc.memories.push(memory);

    // Сортировка только для удобства выборки в диалоге — записи не выбрасываем (память не «стирается»).
    npc.memories.sort((a, b) => {
      const scoreA = a.importance * 10 + (Date.now() - a.timestamp) / 86400000;
      const scoreB = b.importance * 10 + (Date.now() - b.timestamp) / 86400000;
      return scoreB - scoreA;
    });
  }

  getRelevantMemories(npcId: string, context: string): NPCMemory[] {
    const npc = this.npcs.get(npcId);
    if (!npc) return [];

    // Simple relevance scoring based on content matching
    return npc.memories
      .filter(m => m.content.toLowerCase().includes(context.toLowerCase()))
      .slice(0, 3);
  }

  // ==================== DIALOGUE GENERATION ====================

  /**
   * Собрать реплику NPC с учётом знаний, психики и контекста локации/времени.
   */
  generateDialogue(
    npcId: string,
    playerMessage: string,
    player: Player,
    ctx: {
      location: Location;
      time: GameTime;
      weather: Weather;
      worldEra?: WorldEra;
    }
  ): string {
    const npc = this.npcs.get(npcId);
    if (!npc) return '...';

    const lang = getLanguage();
    const others = this.getNPCsInLocation(ctx.location.id);

    return buildNPCReplySync(npc, player, playerMessage, {
      location: ctx.location,
      time: ctx.time,
      weather: ctx.weather,
      language: lang,
      npcsInLocation: others,
      worldEra: ctx.worldEra ?? player.character.worldEra
    });
  }

  // ==================== SECRETS ====================

  revealSecret(npcId: string, secretId: string, player: Player): Secret | null {
    const npc = this.npcs.get(npcId);
    if (!npc) return null;

    const secret = npc.secrets.find(s => s.id === secretId);
    if (!secret) return null;

    // Check if conditions are met
    const relationship = npc.playerRelationship;
    if (relationship.trust < 50 && relationship.affection < 50) {
      return null; // Not close enough
    }

    secret.discoveredByPlayer = true;
    secret.knownBy.push(player.id);

    return secret;
  }

  // ==================== AUTONOMOUS BEHAVIOR ====================

  /**
   * Автономный шаг NPC после пропуска времени в мире.
   * @param hoursElapsed — сколько игровых часов прошло (один вызов `driftMentalState`, без дубля снаружи).
   * @param hourOfDay — текущий час суток игры 0..23 (расписание; не системные часы ОС).
   */
  simulateNPCTurn(npcId: string, hoursElapsed: number, hourOfDay: number) {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    const hour = ((Math.floor(hourOfDay) % 24) + 24) % 24;
    const routine = npc.schedule.routines.find(
      (r) => hour >= r.startHour && hour < r.endHour
    );

    if (routine) {
      npc.schedule.currentActivity = routine.activity;
      npc.location = routine.location;
    }

    for (const goal of npc.goals) {
      if (Math.random() < 0.1) {
        goal.progress = Math.min(100, goal.progress + Math.random() * 5);
      }
    }

    npc.mentalState = driftMentalState(npc.mentalState, hoursElapsed);

    this.updateNPCOpinions(npc);
  }

  private updateNPCOpinions(npc: NPC) {
    for (const [, relationship] of npc.relationships) {
      // Randomly adjust opinions slightly based on personality
      if (Math.random() < 0.05) {
        const drift = (Math.random() - 0.5) * 2;
        relationship.trust += drift * (1 - npc.personality.conscientiousness);
        
        // Clamp
        relationship.trust = Math.max(-100, Math.min(100, relationship.trust));
      }
    }
  }

  /**
   * Пересборка знаний у всех NPC из шаблонов под эпоху мира игрока (medieval / modern / future).
   */
  applyWorldEraToTemplateKnowledge(era: WorldEra): void {
    for (const template of npcTemplates) {
      const npc = this.npcs.get(template.id);
      if (!npc) continue;
      npc.knowledgeBase = buildKnowledgeBaseFromPool(era, template.professionKey);
    }
  }

  /**
   * Смерть NPC (бой/сюжет). При переданном `playerId` близкие к погибшему могут охладеть к игроку.
   */
  markNpcDead(npcId: string, playerId?: string): void {
    const npc = this.npcs.get(npcId);
    if (!npc || npc.status === 'dead') return;
    npc.status = 'dead';
    if (playerId) this.applyGrudgeInheritance(npcId, playerId);
  }

  private applyGrudgeInheritance(deceasedId: string, _playerId: string): void {
    void _playerId;
    for (const npc of this.npcs.values()) {
      if (npc.id === deceasedId || npc.status !== 'alive') continue;
      const bond = this.getNPCRelationship(npc.id, deceasedId);
      if (!bond) continue;
      const delta = trustDeltaTowardPlayerFromAllyDeath(bond.trust);
      if (!delta) continue;
      npc.playerRelationship.trust = Math.max(-100, Math.min(100, npc.playerRelationship.trust + delta));
    }
  }

  // ==================== SAVE/LOAD ====================

  exportData(): NPCSystemSerialized {
    return {
      npcs: Array.from(this.npcs.entries()),
      relationships: Array.from(this.relationships.entries()).map(([id, rels]) => ({
        id,
        rels: Array.from(rels.entries()),
      })),
    };
  }

  /**
   * Восстановление NPC из сохранения: Map отношений, банк знаний и психика для старых сейвов.
   */
  importData(data: unknown) {
    if (!data || typeof data !== 'object') return;
    const d = data as Partial<NPCSystemSerialized>;
    if (!Array.isArray(d.npcs) || !Array.isArray(d.relationships)) return;

    this.npcs.clear();
    this.relationships.clear();

    for (const [id, raw] of d.npcs) {
      const npc = raw as NPC;
      if (!(npc.relationships instanceof Map)) {
        const rawRel = (npc as unknown as { relationships?: Record<string, Relationship> }).relationships;
        npc.relationships = new Map(Object.entries(rawRel || {}));
      }
      const template = npcTemplates.find((t) => t.id === npc.id);
      if (!npc.knowledgeBase?.facts?.length) {
        npc.knowledgeBase = buildKnowledgeBaseFromPool(template?.knowledgeEra ?? 'medieval', template?.professionKey ?? 'default');
      }
      if (!npc.mentalState) {
        npc.mentalState = defaultMentalState();
      }
      if (npc.age == null || Number.isNaN(npc.age)) {
        npc.age = template?.age ?? 30;
      }
      if (!npc.profession) {
        npc.profession = template?.profession ?? npc.title;
      }
      this.npcs.set(id, npc);
    }

    for (const { id, rels } of d.relationships) {
      const relMap = new Map();
      for (const [otherId, rel] of rels) {
        relMap.set(otherId, rel);
      }
      this.relationships.set(id, relMap);
    }

    this.hydrateNPCRelationshipMaps();
  }
}

// Singleton instance
let npcSystemInstance: NPCSystem | null = null;

export function getNPCSystem(): NPCSystem {
  if (!npcSystemInstance) {
    npcSystemInstance = new NPCSystem();
  }
  return npcSystemInstance;
}

export function resetNPCSystem(): NPCSystem {
  npcSystemInstance = new NPCSystem();
  return npcSystemInstance;
}