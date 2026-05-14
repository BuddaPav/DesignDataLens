// Chronos: AI Chronicles - AI Story Engine
// Procedural narrative generation system

import type {
  AIStoryContext,
  GeneratedContent,
  Scene,
  Choice,
  Dialogue,
  Atmosphere,
  Consequence,
  Quest,
  StoryTone,
  PlayerArchetype,
  EmotionState,
  CharacterPersonality,
  Objective,
  Reward,
  NPC,
  Location,
  WorldEra
} from '@/types/game';
import { getNPCSystem } from '@/engine/NPCSystem';
import { buildNPCReplySync } from '@/engine/dialogueSystem';
import { buildKnowledgeBaseFromPool } from '@/engine/knowledge';
import { defaultMentalState } from '@/engine/psychology';
import { getLanguage } from '@/i18n';
import { getStoryEngineBundle, type StoryTemplate } from '@/engine/storyLocale';

// ==================== AI STORY ENGINE ====================

export class AIStoryEngine {
  private random: () => number;
  private storyHistory: string[] = [];
  private choiceHistory: string[] = [];

  constructor(seed?: number) {
    this.random = this.createRandom(seed || Date.now());
  }

  private createRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(this.random() * array.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  private makeUniqueQuestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `quest_${crypto.randomUUID()}`;
    }
    return `quest_${Date.now()}_${this.randomInt(100000, 999999)}_${this.randomInt(100000, 999999)}`;
  }

  // ==================== MAIN GENERATION METHODS ====================

  generateScene(context: AIStoryContext): GeneratedContent {
    const { player } = context;
    
    // Select appropriate template based on player archetype and tone preference
    const template = this.selectStoryTemplate(player.archetype, player.preferredTone);
    
    // Generate narrative
    const narrative = this.generateNarrative(context, template);
    
    // Generate atmosphere
    const atmosphere = this.generateAtmosphere(context);
    
    // Generate dialogue if NPCs are present
    const dialogue = this.generateDialogue(context);
    
    // Generate choices based on context
    const choices = this.generateChoices(context);

    return {
      narrative,
      dialogue,
      choices,
      atmosphere
    };
  }

  generateQuest(context: AIStoryContext, type: 'main' | 'side' | 'character'): Quest {
    const { player } = context;
    const template = this.selectStoryTemplate(player.archetype, player.preferredTone);

    let questId = this.makeUniqueQuestId();
    if (context.currentQuest?.id === questId) {
      questId = this.makeUniqueQuestId();
    }
    
    // Generate quest structure
    const opening = this.randomChoice(template.openings);
    const development = this.randomChoice(template.developments);
    const climax = this.randomChoice(template.climaxes);
    const resolution = this.randomChoice(template.resolutions);

    // Generate objectives based on quest type
    const objectives = this.generateObjectives(type, context);
    
    // Generate scenes
    const scenes = this.generateQuestScenes(opening, development, climax, resolution, context);

    return {
      id: questId,
      type,
      title: this.generateQuestTitle(type, template.tone),
      description: opening,
      objectives,
      currentObjectiveIndex: 0,
      scenes,
      currentSceneIndex: 0,
      status: 'not_started',
      rewards: this.generateRewards(type),
      relatedNPCs: [],
      generated: true,
      generationParams: {
        tone: template.tone,
        complexity: this.randomInt(3, 8),
        urgency: this.randomInt(3, 8),
        moralAmbiguity: this.randomInt(2, 7),
        playerArchetype: player.archetype
      }
    };
  }

  /**
   * Реплика в процедурной сцене: гибрид знаний/психики (как в прямом диалоге), иначе старые шаблоны.
   */
  generateNPCDialogue(npc: NPC, context: AIStoryContext, topic?: string): string {
    const { player, currentLocation } = context;
    if (currentLocation && npc.knowledgeBase && npc.mentalState != null) {
      const ws = player.storyProgress.worldState;
      const inLoc = currentLocation.npcs
        .map((id) => getNPCSystem().getNPC(id))
        .filter((n): n is NPC => !!n);
      return buildNPCReplySync(npc, player, topic || '', {
        location: currentLocation,
        time: ws.time,
        weather: ws.weather,
        language: getLanguage(),
        npcsInLocation: inLoc,
        worldEra: player.character.worldEra
      });
    }

    const relationship = npc.playerRelationship ?? { type: 'stranger', trust: 0, affection: 0, respect: 0, fear: 0, history: [] };
    let emotion = 'neutral';
    if (relationship.affection > 50) emotion = 'grateful';
    else if (relationship.affection < -30) emotion = 'angry';
    else if (relationship.trust < -20) emotion = 'suspicious';
    else if ((npc.personality?.neuroticism ?? 0) > 0.7) emotion = 'fearful';
    else if ((npc.personality?.openness ?? 0) > 0.7) emotion = 'curious';

    const { dialogueTemplates } = getStoryEngineBundle();
    const templates = dialogueTemplates.find((d) => d.emotion === emotion)?.templates || dialogueTemplates[0].templates;
    let dialogue = this.randomChoice(templates);
    const defaultName = getLanguage() === 'en' ? 'Adventurer' : 'Путник';
    dialogue = dialogue.replace(/{playerName}/g, player.character.name || defaultName);
    if (topic) {
      dialogue += ` ${this.addTopicContext(topic, npc)}`;
    }
    return dialogue;
  }

  /** Минимальный NPC, если в системе ещё нет записи (не должно случаться при синхронизации локаций). */
  private makeFallbackNPC(npcId: string, locationId: string): NPC {
    const kb = buildKnowledgeBaseFromPool('medieval', 'default');
    const fb = getStoryEngineBundle().fallbackNPC;
    return {
      id: npcId,
      name: fb.name,
      title: fb.title,
      age: 30,
      profession: 'прохожий',
      avatar: '',
      appearance: '',
      personality: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
        bravery: 50,
        loyalty: 50,
        greed: 50,
        ambition: 50,
        empathy: 50
      },
      knowledgeBase: kb,
      mentalState: defaultMentalState(),
      status: 'alive',
      location: locationId,
      level: 1,
      attributes: { strength: 10, intelligence: 10, charisma: 10, agility: 10, wisdom: 10, luck: 10 },
      memories: [],
      relationships: new Map(),
      playerRelationship: { type: 'stranger', trust: 0, affection: 0, respect: 0, fear: 0, history: [] },
      schedule: { defaultLocation: locationId, routines: [], currentActivity: '' },
      goals: [],
      secrets: [],
      backstory: '',
      roleInStory: ''
    };
  }

  // ==================== HELPER METHODS ====================

  private selectStoryTemplate(archetype: PlayerArchetype, tone: StoryTone): StoryTemplate {
    const storyTemplates = getStoryEngineBundle().storyTemplates;
    const matching = storyTemplates.filter(t => 
      t.archetypes.includes(archetype) && t.tone === tone
    );
    
    if (matching.length > 0) {
      return this.randomChoice(matching);
    }
    
    // Fallback to archetype match
    const archetypeMatch = storyTemplates.filter(t => 
      t.archetypes.includes(archetype)
    );
    
    if (archetypeMatch.length > 0) {
      return this.randomChoice(archetypeMatch);
    }
    
    return this.randomChoice(storyTemplates);
  }

  private generateNarrative(context: AIStoryContext, _template: StoryTemplate): string {
    const { player, currentLocation, emotionalState } = context;
    void player; // Used for context
    
    // Base narrative elements
    const locationDesc = this.describeLocation(currentLocation, emotionalState, player.character.worldEra);
    const moodDesc = this.describeMood(emotionalState);
    
    // Build narrative
    let narrative = `${locationDesc} ${moodDesc}`;
    
    // Add emotional flavor
    narrative += ` ${this.addEmotionalFlavor(emotionalState)}`;
    
    // Add player-specific references
    if (this.storyHistory.length > 0) {
      narrative += ` ${this.addContinuityReference()}`;
    }
    
    return narrative;
  }

  private describeLocation(
    location: Location | null | undefined,
    _emotion: EmotionState,
    worldEra?: WorldEra
  ): string {
    const descriptions = getStoryEngineBundle().locationDescriptions;
    const t = location?.type as string | undefined;
    const locationDescs = descriptions[t ?? ''] || descriptions.city;
    const piece = this.randomChoice(locationDescs);
    const lang = getLanguage();
    const name = location?.name ?? (lang === 'ru' ? 'эти места' : 'this place');
    const era =
      worldEra === 'future'
        ? lang === 'ru'
          ? 'Хроники тянутся к чужим звёздам. '
          : 'The chronicle reaches toward alien suns. '
        : worldEra === 'modern'
          ? lang === 'ru'
            ? 'Современность накладывает свой ритм. '
            : 'The modern age sets its own rhythm. '
          : '';
    if (lang === 'ru') {
      return `${era}${piece} Запись называет это «${name}».`;
    }
    return `${era}${piece} The record names it "${name}".`;
  }

  private describeMood(emotion: EmotionState): string {
    const moods = getStoryEngineBundle().moods;
    return this.randomChoice(moods[emotion] || moods.neutral);
  }

  private addEmotionalFlavor(emotion: EmotionState): string {
    const flavors = getStoryEngineBundle().flavors;
    return this.randomChoice(flavors[emotion] || flavors.neutral);
  }

  private addContinuityReference(): string {
    return this.randomChoice(getStoryEngineBundle().continuityReferences);
  }

  private addTopicContext(topic: string, _npc: NPC): string {
    const contexts = getStoryEngineBundle().topicContexts;
    const topicContexts = contexts[topic] || contexts.rumor;
    return this.randomChoice(topicContexts);
  }

  private generateAtmosphere(context: AIStoryContext): Atmosphere {
    const { emotionalState } = context;
    const b = getStoryEngineBundle();
    return {
      mood: this.randomChoice(b.atmosphereMoods[emotionalState] || b.atmosphereMoods.neutral),
      lighting: this.randomChoice(b.atmosphereLightings),
      sounds: [this.randomChoice(b.atmosphereSounds), this.randomChoice(b.atmosphereSounds)],
      music: this.randomChoice(b.atmosphereMusics)
    };
  }

  private generateDialogue(context: AIStoryContext): Dialogue[] | undefined {
    const { currentLocation } = context;
    
    if (!currentLocation?.npcs || currentLocation.npcs.length === 0) {
      return undefined;
    }
    
    // Generate dialogue for present NPCs
    const dialogues: Dialogue[] = [];
    
    for (const npcId of currentLocation.npcs.slice(0, 2)) {
      const npc = getNPCSystem().getNPC(npcId) ?? this.makeFallbackNPC(npcId, currentLocation.id);
      dialogues.push({
        id: `dlg_${Date.now()}_${this.randomInt(1000, 9999)}`,
        speakerId: npcId,
        speakerName: npc.name,
        text: this.generateNPCDialogue(npc, context),
        emotion: 'neutral'
      });
    }
    
    return dialogues;
  }

  private generateChoices(context: AIStoryContext): Choice[] {
    
    const choices: Choice[] = [];
    void context; // Mark as intentionally used
    
    // Generate 3-4 choices with different archetypes
    const shuffledArchetypes = [...getStoryEngineBundle().choiceArchetypes].sort(() => this.random() - 0.5);
    
    for (let i = 0; i < Math.min(3 + Math.floor(this.random() * 2), shuffledArchetypes.length); i++) {
      const archetype = shuffledArchetypes[i];
      
      choices.push({
        id: `choice_${Date.now()}_${i}`,
        text: this.generateChoiceText(archetype.type, context),
        type: archetype.type === 'compassionate' ? 'moral' : 
              archetype.type === 'cunning' ? 'strategic' : 'action',
        consequences: this.generateConsequences(archetype.type, context),
        personalityAlignment: this.getPersonalityAlignment(archetype.type)
      });
    }
    
    return choices;
  }

  private generateChoiceText(type: string, context: AIStoryContext): string {
    const texts = getStoryEngineBundle().choiceTexts;
    const raw = this.randomChoice(texts[type] || texts.pragmatic);
    const loc = context.currentLocation?.name ?? (getLanguage() === 'ru' ? 'здесь' : 'here');
    return raw.replace(/\{location\}/g, loc);
  }

  private generateConsequences(type: string, context: AIStoryContext): Consequence[] {
    const consequences: Consequence[] = [];
    
    // Each choice has 1-3 consequences
    const numConsequences = 1 + Math.floor(this.random() * 3);
    
    for (let i = 0; i < numConsequences; i++) {
      const conType = this.randomChoice([
        'attribute_change',
        'reputation_change',
        'story_flag',
        'npc_relationship',
        'item_gain',
        'gold',
        'world_event',
        'quest_unlock',
      ]);
      
      switch (conType) {
        case 'attribute_change':
          consequences.push({
            type: 'attribute_change',
            key: this.randomChoice(['strength', 'intelligence', 'charisma']),
            value: this.randomInt(1, 5) * (type === 'heroic' ? 1 : -1),
            hidden: this.random() > 0.5
          });
          break;
        case 'reputation_change':
          consequences.push({
            type: 'reputation_change',
            key: this.randomChoice(['guild_merchants', 'church_order', 'thieves_guild', 'academy']),
            value: this.randomInt(2, 10) * (type === 'compassionate' ? 1 : -1),
            hidden: false
          });
          break;
        case 'story_flag':
          consequences.push({
            type: 'story_flag',
            key: `flag_${Date.now()}`,
            value: true,
            hidden: true
          });
          break;
        case 'npc_relationship':
          consequences.push({
            type: 'npc_relationship',
            key: 'affected_npc',
            value: { trust: this.randomInt(-10, 10) },
            hidden: this.random() > 0.7
          });
          break;
        case 'item_gain':
          consequences.push({
            type: 'item_gain',
            key: this.randomChoice([
              'herb',
              'wild_mushroom',
              'iron_ore',
              'torch_bundle',
              'dried_rations',
              'ink_vial',
              'leather_strip',
              'spice_sachet',
              'silver_wire',
              'obsidian_fragment',
              'travel_biscuits',
              'guild_badge',
              'composure_tonic',
            ]),
            value: this.randomInt(1, 3),
            hidden: false,
          });
          break;
        case 'gold':
          consequences.push({
            type: 'gold',
            key: 'gold',
            value: this.randomInt(10, 80) * (type === 'ruthless' ? 1 : 1),
            hidden: false,
          });
          break;
        case 'world_event': {
          const locId = context.currentLocation?.id ?? 'starting_village';
          const langEv = getLanguage();
          if (this.random() > 0.4) {
            const locDelta = this.randomInt(-5, 5);
            let factionReputationDelta: Record<string, number> | undefined;
            if (this.random() > 0.72) {
              const fk = this.randomChoice([
                'guild_merchants',
                'church_order',
                'thieves_guild',
                'academy',
              ]);
              const fv = this.randomInt(-4, 4);
              if (fv !== 0) factionReputationDelta = { [fk]: fv };
            }
            consequences.push({
              type: 'world_event',
              key: langEv === 'ru' ? 'Событие мира' : 'World event',
              value: {
                message:
                  langEv === 'ru'
                    ? 'Местные перешёптываются о вашем выборе — настроение в округе меняется.'
                    : 'Locals murmur about your choice—the mood in the area shifts.',
                ...(locDelta !== 0 ? { locationReputationDelta: { [locId]: locDelta } } : {}),
                ...(factionReputationDelta ? { factionReputationDelta } : {}),
              },
              hidden: false,
            });
          } else {
            consequences.push({
              type: 'world_event',
              key: langEv === 'ru' ? 'Событие мира' : 'World event',
              value:
                langEv === 'ru'
                  ? 'По дорогам прошёл караван — слухи и товары сменили руки.'
                  : 'A caravan passed the road—goods and rumors changed hands.',
              hidden: false,
            });
          }
          break;
        }
        case 'quest_unlock':
          consequences.push({
            type: 'quest_unlock',
            key: `q_${Date.now()}_${this.randomInt(100, 999)}`,
            value: 1,
            hidden: false,
          });
          break;
      }
    }
    
    return consequences;
  }

  private getPersonalityAlignment(type: string): Partial<CharacterPersonality> {
    const alignments: Record<string, Partial<CharacterPersonality>> = {
      heroic: { brave: 80, honorable: 90 },
      pragmatic: { cunning: 60 },
      cunning: { cunning: 90, mysterious: 70 },
      compassionate: { kind: 90 },
      ruthless: { ruthless: 90 }
    };
    
    return alignments[type] || {};
  }

  private generateQuestTitle(type: string, tone: StoryTone): string {
    const b = getStoryEngineBundle();
    const prefix = this.randomChoice(b.questPrefixes[type] || b.questPrefixes.side);
    const suffix = this.randomChoice(b.questSuffixes[tone] || b.questSuffixes.mysterious);
    if (getLanguage() === 'ru' && prefix === '') {
      return suffix.charAt(0).toUpperCase() + suffix.slice(1);
    }
    return prefix ? `${prefix} ${suffix}` : suffix;
  }

  private generateObjectives(type: string, context: AIStoryContext): Objective[] {
    const eligibleDefeat = context.eligibleDefeatNpcIds?.filter(Boolean) ?? [];
    const objectiveTypesAll: Objective['type'][] = [
      'reach_location',
      'talk_to_npc',
      'collect_item',
      'defeat_enemy',
      'solve_puzzle',
    ];
    const objectiveTypes: Objective['type'][] =
      eligibleDefeat.length > 0
        ? objectiveTypesAll
        : objectiveTypesAll.filter((t) => t !== 'defeat_enemy');

    const numObjectives = type === 'main' ? 3 + Math.floor(this.random() * 2) : 
                          type === 'side' ? 2 + Math.floor(this.random() * 2) : 1;
    
    const objectives: Objective[] = [];
    
    for (let i = 0; i < numObjectives; i++) {
      const objType = this.randomChoice(objectiveTypes);
      const target =
        objType === 'defeat_enemy' && eligibleDefeat.length > 0
          ? this.randomChoice(eligibleDefeat)
          : `target_${i}`;
      
      objectives.push({
        id: `obj_${Date.now()}_${i}`,
        description: this.generateObjectiveDescription(objType),
        type: objType,
        target,
        required: 1,
        current: 0,
        completed: false
      });
    }
    
    return objectives;
  }

  private generateObjectiveDescription(type: Objective['type']): string {
    const descriptions = getStoryEngineBundle().objectiveDescriptions;
    return this.randomChoice(descriptions[type] || descriptions.reach_location);
  }

  private generateQuestScenes(opening: string, development: string, climax: string, resolution: string, context: AIStoryContext): Scene[] {
    return [
      {
        id: `scene_${Date.now()}_0`,
        location: context.currentLocation?.id || 'unknown',
        narrative: opening,
        choices: this.generateChoices(context)
      },
      {
        id: `scene_${Date.now()}_1`,
        location: context.currentLocation?.id || 'unknown',
        narrative: development,
        choices: this.generateChoices(context)
      },
      {
        id: `scene_${Date.now()}_2`,
        location: context.currentLocation?.id || 'unknown',
        narrative: climax,
        choices: this.generateChoices(context)
      },
      {
        id: `scene_${Date.now()}_3`,
        location: context.currentLocation?.id || 'unknown',
        narrative: resolution,
        choices: []
      }
    ];
  }

  private generateRewards(type: string): Reward[] {
    const rewards: Reward[] = [];
    
    // Experience
    rewards.push({
      type: 'experience',
      key: 'character',
      value: type === 'main' ? 500 : type === 'side' ? 200 : 100
    });
    
    // Gold
    rewards.push({
      type: 'gold',
      key: 'inventory',
      value: type === 'main' ? 100 : type === 'side' ? 50 : 25
    });
    
    // Possible item
    if (this.random() > 0.5) {
      rewards.push({
        type: 'item',
        key: 'tpl:herb',
        value: 1
      });
    }
    
    return rewards;
  }

  // ==================== UTILITY METHODS ====================

  addToHistory(content: string, choice?: string) {
    this.storyHistory.push(content);
    if (choice) {
      this.choiceHistory.push(choice);
    }
    
    // Keep history manageable
    if (this.storyHistory.length > 50) {
      this.storyHistory.shift();
    }
    if (this.choiceHistory.length > 50) {
      this.choiceHistory.shift();
    }
  }

  getStoryContext(): string {
    return this.storyHistory.slice(-5).join(' ');
  }

  reset() {
    this.storyHistory = [];
    this.choiceHistory = [];
  }
}

// Singleton instance
let engineInstance: AIStoryEngine | null = null;

export function getAIStoryEngine(seed?: number): AIStoryEngine {
  if (!engineInstance) {
    engineInstance = new AIStoryEngine(seed);
  }
  return engineInstance;
}

export function resetAIStoryEngine(seed?: number): AIStoryEngine {
  engineInstance = new AIStoryEngine(seed);
  return engineInstance;
}
