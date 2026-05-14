// Chronos: AI Chronicles - Game Types

// ==================== CORE TYPES ====================

export type GamePhase = 'intro' | 'character_creation' | 'tutorial' | 'main_game' | 'ending';

export type EmotionState = 'neutral' | 'excited' | 'frustrated' | 'curious' | 'bored' | 'stressed' | 'relaxed';

export type PlayerArchetype = 'explorer' | 'achiever' | 'socializer' | 'killer' | 'storyteller';

export type StoryTone = 'heroic' | 'dark' | 'mysterious' | 'whimsical' | 'tragic' | 'epic';

export type LocationType =
  | 'city'
  | 'forest'
  | 'dungeon'
  | 'mountain'
  | 'coast'
  | 'ruins'
  | 'void'
  | 'landmark';

export type QuestType = 'main' | 'side' | 'character' | 'world' | 'generated' | 'event';

export type NPCStatus = 'alive' | 'dead' | 'missing' | 'imprisoned' | 'exiled';

export type RelationshipType = 'enemy' | 'rival' | 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'lover' | 'family';

/** Эпоха мира при старте — влияет на лор, предметы в тексте и «банк знаний» новых NPC */
export type WorldEra = 'medieval' | 'modern' | 'future';

/** Один факт в базе знаний NPC (может передаваться при сплетнях с потерей confidence) */
export interface KnowledgeFact {
  id: string;
  text: string;
  confidence: number;
  sourceNpcId?: string;
}

/** Область экспертизы и факты — используются в dialogueSystem и в промпте WebLLM */
export interface NPCKnowledgeBase {
  field: string;
  /** Нормализованные ключи для сопоставления с репликой игрока (латиница/транслит опционально) */
  fieldKeys: string[];
  facts: KnowledgeFact[];
  /** Общая уверенность в своей области (0–1) */
  confidence: number;
}

/** Психологическое состояние NPC — стресс, настроение, травма влияют на реплики и реакции */
export interface MentalState {
  stress: number;
  happiness: number;
  trauma: number;
}

/** Тематика строки журнала — для фильтров UI без regex по тексту. */
export type WorldLogTopic = 'social' | 'economy' | 'combat' | 'travel' | 'meta_time' | 'general';

/** Запись в журнале событий мира (бегущая строка в UI) */
export interface WorldLogEntry {
  id: string;
  timestamp: number;
  message: string;
  severity?: 'info' | 'rumor' | 'dramatic';
  /** Если не задано, фильтры используют severity + эвристики legacy-текста. */
  topic?: WorldLogTopic;
}

/** Отложенное последствие слухов: дельта репутации после игровых часов (см. rumorConsequenceQueue). */
export interface RumorConsequencePending {
  id: string;
  remainingHours: number;
  factionRepDelta: Record<string, number>;
}

/** Эмерджентная коалиция NPC-врагов игрока (общий лидер как «узел» угрозы). */
export interface EnemyCoalition {
  id: string;
  formedAt: number;
  leaderNpcId: string;
  memberNpcIds: string[];
  anchorLocationId: string;
}

/** Позиция на глобальной сетке открытого мира (до 1 000 000 × 1 000 000 тайлов); координаты могут быть дробными для плавного хода */
export interface WorldPosition {
  tileX: number;
  tileY: number;
}

// ==================== PLAYER TYPES ====================

export interface Player {
  id: string;
  name: string;
  createdAt: number;
  
  // Character
  character: Character;
  
  // Progress
  stats: PlayerStats;
  inventory: Inventory;
  
  // Story
  storyProgress: StoryProgress;
  choices: ChoiceRecord[];
  
  // AI Profile
  archetype: PlayerArchetype;
  preferredTone: StoryTone;
  emotionalHistory: EmotionRecord[];
  
  // Session
  lastSession: number;
  totalPlayTime: number;
  sessionCount: number;
}

export interface Character {
  name: string;
  title: string;
  level: number;
  experience: number;
  
  // Attributes
  attributes: Attributes;
  
  // Appearance
  appearance: Appearance;
  
  // Background
  origin: string;
  backstory: string;
  /** Выбранная при создании эпоха — задаёт тон мира и шаблоны знаний */
  worldEra?: WorldEra;
  
  // Personality (affects dialogue options)
  personality: CharacterPersonality;
}

export interface Attributes {
  strength: number;      // Combat, physical tasks
  intelligence: number;  // Magic, puzzles
  charisma: number;      // Dialogue, persuasion
  agility: number;       // Stealth, dodging
  wisdom: number;        // Perception, insight
  luck: number;          // Random events, drops
}

export interface Appearance {
  avatar: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  outfit: string;
  accessories: string[];
}

export interface CharacterPersonality {
  brave: number;      // 0-100
  cunning: number;
  kind: number;
  ruthless: number;
  honorable: number;
  mysterious: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  
  // Reputation
  reputation: Map<string, number>; // faction -> value
  
  // Achievements
  achievements: string[];
  
  // Combat
  battlesWon: number;
  battlesLost: number;
  enemiesDefeated: number;
}

export interface Inventory {
  gold: number;
  items: Item[];
  maxSlots: number;
  /** Сюжетные токены из внутриигрового магазина (не путать с real-money). */
  storyTokens?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'key' | 'material' | 'cosmetic';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  effects?: ItemEffect[];
  equipped?: boolean;
}

export interface ItemEffect {
  type: 'heal' | 'damage_boost' | 'defense_boost' | 'mana_restore' | 'attribute_boost';
  value: number;
  duration?: number;
}

// ==================== STORY TYPES ====================

export interface StoryProgress {
  currentChapter: number;
  currentScene: string;
  mainQuest: Quest | null;
  activeQuests: Quest[];
  completedQuests: string[];
  
  // World State
  worldState: WorldState;
  
  // Discovered content
  discoveredLocations: string[];
  metNPCs: string[];
  unlockedLore: string[];
  /** Журнал заметных событий (сплетни, поколения, сдвиги отношений) */
  worldEventLog: WorldLogEntry[];
  /** Координаты на процедурной карте мира (Canvas) */
  worldPosition: WorldPosition;
  /** Сформированные коалиции врагов (без скриптового «босса» — из отношений и времени). */
  enemyCoalitions?: EnemyCoalition[];
  /**
   * Активные сплетни с TTL — распространяются по графу локаций и караванами.
   * Один источник правды для «рынка слухов» (см. engine/gossipNetwork).
   */
  activeRumors?: ActiveRumor[];
  /** Репутация игрока у условных фракций (ключ → −100..100). */
  factionReputation?: Record<string, number>;
  /** Торговые караваны на фиксированных маршрутах. */
  tradeCaravans?: TradeCaravan[];
  /** Очередь отложенной репутационной реакции на слухи (игровые часы). */
  rumorConsequenceQueue?: RumorConsequencePending[];
}

/** Сплетня с часами жизни и охватом локаций. */
export interface ActiveRumor {
  id: string;
  message: string;
  severity?: WorldLogEntry['severity'];
  /** Оставшиеся игровые часы (уменьшаются при advanceTime). */
  ttlHours: number;
  originLocationId: string;
  /** Для модификаторов фракций и квестов (напр. guild_merchants, thieves_guild). */
  factionTags: string[];
  /** Куда слух уже «дошёл» сам или через торговцев. */
  reachedLocationIds: string[];
}

/** Караван на циклическом маршруте; везёт усиление охвата слухов. */
export interface TradeCaravan {
  id: string;
  /** id из `CHRONOS_TRADE_ROUTES` / `TradeRouteDef`. */
  routeId: string;
  /** Текущая вершина маршрута (индекс в массиве локаций). */
  atVertex: number;
  /** Часы до перехода к следующей локации. */
  hoursUntilNext: number;
}

export interface WorldState {
  time: GameTime;
  weather: Weather;
  globalEvents: WorldEvent[];
  factionPowers: Map<string, number>;
}

export interface GameTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export type Weather = 'clear' | 'rainy' | 'stormy' | 'foggy' | 'snowy' | 'mystical';

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  type: 'political' | 'natural' | 'magical' | 'social';
  startTime: number;
  endTime?: number;
  affectedLocations: string[];
  consequences: Consequence[];
}

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  
  // Structure
  objectives: Objective[];
  currentObjectiveIndex: number;
  
  // Story
  scenes: Scene[];
  currentSceneIndex: number;
  
  // State
  status: 'not_started' | 'active' | 'completed' | 'failed';
  
  // Rewards
  rewards: Reward[];
  
  // Relationships
  giverId?: string;
  relatedNPCs: string[];
  
  // AI Generated
  generated: boolean;
  generationParams?: GenerationParams;
}

export interface Objective {
  id: string;
  description: string;
  type: 'reach_location' | 'talk_to_npc' | 'defeat_enemy' | 'collect_item' | 'solve_puzzle' | 'make_choice';
  target: string;
  required: number;
  current: number;
  completed: boolean;
}

export interface Scene {
  id: string;
  location: string;
  narrative: string;
  dialogue?: Dialogue[];
  choices: Choice[];
  atmosphere?: Atmosphere;
}

export interface Atmosphere {
  mood: string;
  lighting: string;
  sounds: string[];
  music: string;
}

export interface Choice {
  id: string;
  text: string;
  type: 'dialogue' | 'action' | 'moral' | 'strategic';
  
  // Requirements
  requirements?: Requirement[];
  
  // Consequences
  consequences: Consequence[];
  
  // Personality alignment
  personalityAlignment?: Partial<CharacterPersonality>;
  
  // Emotional impact
  emotionalImpact?: Partial<Record<EmotionState, number>>;
}

export interface Requirement {
  type: 'attribute' | 'item' | 'reputation' | 'quest_completed' | 'npc_relationship';
  key: string;
  value: number;
  operator: '>' | '<' | '>=' | '<=' | '==';
}

export interface Consequence {
  type:
    | 'attribute_change'
    | 'reputation_change'
    | 'item_gain'
    | 'item_loss'
    | 'quest_unlock'
    | 'quest_complete'
    | 'npc_relationship'
    | 'npc_mark_dead'
    | 'world_event'
    | 'story_flag'
    | 'gold'
    | 'experience';
  key: string;
  /** Тип зависит от `type` (число, флаг, дельта отношений и т.д.) — сужать при применении. */
  value: unknown;
  hidden?: boolean;
  delay?: number; // in game hours
}

export interface Dialogue {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  emotion?: string;
  gestures?: string[];
}

export interface Reward {
  type: 'experience' | 'gold' | 'item' | 'reputation' | 'attribute' | 'unlock';
  key: string;
  value: number;
}

export interface GenerationParams {
  tone: StoryTone;
  complexity: number;
  urgency: number;
  moralAmbiguity: number;
  playerArchetype: PlayerArchetype;
}

// ==================== MEMORY SYSTEM ====================

export interface ChoiceRecord {
  id: string;
  timestamp: number;
  questId: string;
  sceneId: string;
  choiceId: string;
  choiceText: string;
  consequences: Consequence[];
  importance: number; // 1-10, for memory pruning
}

export interface EmotionRecord {
  timestamp: number;
  emotion: EmotionState;
  intensity: number;
  trigger: string;
}

// ==================== NPC TYPES ====================

export interface NPC {
  id: string;
  name: string;
  title: string;
  /** Возраст для лора и промпта ИИ */
  age: number;
  /** Краткая профессия на языке сцены (RU/EN задаётся контекстом генерации) */
  profession: string;
  /** Ключ пула знаний / гильдии для межлокационной социальной симуляции */
  professionKey?: string;

  // Visual
  avatar: string;
  appearance: string;
  
  // Personality (Big Five Model)
  personality: NPCPersonality;

  /** Экспертиза и факты — глубокие темы в диалогах */
  knowledgeBase: NPCKnowledgeBase;
  /** Стресс / счастье / травма */
  mentalState: MentalState;
  
  // State
  status: NPCStatus;
  location: string;
  /** Абсолютные координаты на мировой сетке (процедурные NPC на карте) */
  worldTile?: { x: number; y: number };
  
  // Stats
  level: number;
  attributes: Attributes;
  
  // Memory
  memories: NPCMemory[];
  
  // Relationships
  relationships: Map<string, Relationship>; // npcId -> relationship
  playerRelationship: Relationship;
  
  // Behavior
  schedule: NPCSchedule;
  goals: NPCGoal[];
  secrets: Secret[];
  
  // Story
  backstory: string;
  roleInStory: string;
}

export interface NPCPersonality {
  openness: number;           // 0-1
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  
  // Derived traits
  bravery: number;
  loyalty: number;
  greed: number;
  ambition: number;
  empathy: number;
}

export interface Relationship {
  type: RelationshipType;
  trust: number;        // -100 to 100
  affection: number;    // -100 to 100
  respect: number;      // -100 to 100
  fear: number;         // 0 to 100
  history: RelationshipEvent[];
}

export interface RelationshipEvent {
  timestamp: number;
  type: 'first_meet' | 'helped' | 'betrayed' | 'saved' | 'fought' | 'gift' | 'conversation' | 'quest';
  description: string;
  impact: number;
}

export interface NPCMemory {
  id: string;
  timestamp: number;
  type: 'observation' | 'conversation' | 'event' | 'promise' | 'betrayal' | 'gratitude' | 'manipulation';
  content: string;
  importance: number; // 1-10
  relatedEntities: string[]; // npcIds, locationIds, etc.
  emotionalValence: number; // -1 to 1
}

export interface NPCSchedule {
  defaultLocation: string;
  routines: Routine[];
  currentActivity: string;
}

export interface Routine {
  startHour: number;
  endHour: number;
  location: string;
  activity: string;
}

export interface NPCGoal {
  id: string;
  description: string;
  priority: number;
  progress: number;
  deadline?: number;
}

export interface Secret {
  id: string;
  content: string;
  knownBy: string[]; // npcIds
  discoveredByPlayer: boolean;
  revealConditions: Requirement[];
}

// ==================== AI ENGINE TYPES ====================

export interface AIStoryContext {
  player: Player;
  currentQuest: Quest | null;
  currentLocation: Location;
  recentEvents: WorldEvent[];
  relevantMemories: ChoiceRecord[];
  emotionalState: EmotionState;
  sessionMetrics: SessionMetrics;
  /** id NPC в текущей локации, допустимые для цели `defeat_enemy` (MVP 063). */
  eligibleDefeatNpcIds?: string[];
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;
  atmosphere: Atmosphere;
  connectedLocations: string[];
  npcs: string[];
  pointsOfInterest: PointOfInterest[];
  secrets: Secret[];
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'building' | 'landmark' | 'item' | 'npc' | 'entrance';
  description: string;
  interactable: boolean;
}

export interface SessionMetrics {
  startTime: number;
  actionsCount: number;
  choicesMade: number;
  combatEncounters: number;
  dialogueExchanges: number;
  explorationScore: number;
  avgDecisionTime: number;
}

export interface GeneratedContent {
  narrative: string;
  dialogue?: Dialogue[];
  choices: Choice[];
  atmosphere?: Atmosphere;
  consequences?: Consequence[];
}

// ==================== MONETIZATION ====================

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'story_pass' | 'character_slot' | 'cosmetic' | 'token' | 'premium';
  priceUSD: number;
  /** Базовая цена в золоте до множителя `marketSupply` (MVP 066–068). */
  goldPriceBase: number;
  rewards: ShopReward[];
  limited?: boolean;
  limitTime?: number;
}

export interface ShopReward {
  type: 'story_unlock' | 'cosmetic' | 'token' | 'character_slot' | 'premium_days' | 'story_tokens';
  key: string;
  value: number;
}

// ==================== SAVE SYSTEM ====================

export interface SaveData {
  version: string;
  timestamp: number;
  player: Player;
  npcs: NPC[];
  locations: Location[];
  worldEvents: WorldEvent[];
  storyHistory: GeneratedContent[];
}

// ==================== ANALYTICS ====================

export interface PlayerAnalytics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  
  // Engagement
  actions: PlayerAction[];
  choices: string[];
  emotions: EmotionState[];
  
  // Progress
  questsStarted: string[];
  questsCompleted: string[];
  npcsMet: string[];
  locationsVisited: string[];
  
  // Performance
  loadTimes: number[];
  errors: string[];
}

export interface PlayerAction {
  timestamp: number;
  type: string;
  details: unknown;
  duration?: number;
}
