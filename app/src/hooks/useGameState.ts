// Chronos: AI Chronicles - Game State Hook
// Central state management integrating all AI systems

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { 
  Player, 
  Character,
  Quest,
  Scene,
  Choice,
  ChoiceRecord,
  EmotionRecord,
  Location,
  ShopItem,
  NPC,
  ActiveRumor,
} from '@/types/game';

import { getAIStoryEngine } from '@/engine/AIStoryEngine';
import { getMemorySystem } from '@/engine/MemorySystem';
import { getEmotionDetector } from '@/engine/EmotionDetector';
import { getNPCSystem } from '@/engine/NPCSystem';
import { getLocalAIManager, isBackgroundProceduralNpc } from '@/engine/localAI';
import {
  serializeMaps,
  reviveMaps,
  saveFullWorldToIndexedDB,
  loadFullWorldFromIndexedDB,
  clearFullWorldFromIndexedDB,
} from '@/engine/saveSystem';
import { runGenerationsTick } from '@/engine/generations';
import {
  prepareSocialGraphPairs,
  runAdvancedSocietyTick,
  runCrowdSocietyTick
} from '@/engine/societySimulation';
import {
  splitRumorReputationRipple,
  tickRumorConsequenceQueue,
} from '@/domain/social/rumorConsequenceQueue';
import {
  buildLocationAdjacency,
  buildSocialGossipActiveRumor,
  flushRumorJournalHighlights,
  factionTagsForGossipNpc,
  maybeSpawnOrganicRumor,
  tickActiveRumorsSync
} from '@/engine/gossipNetwork';
import { CHRONOS_TRADE_ROUTES, ensureDefaultCaravans, tickTradeCaravans } from '@/engine/traderCaravan';
import { coercivePlayerLineSeverity } from '@/engine/psychology';
import { recordWitnessedPlayerAction, tryEnemyCoalitionFormation } from '@/engine/socialPhysics';
import { pushWorldLog } from '@/engine/worldEvents';
import { getLanguage, t } from '@/i18n';
import { toast } from 'sonner';
import {
  CHRONOS_BROWSER_NOTIFY_TAGS,
  notifyGameBrowserEvent,
} from '@/domain/notifications/browserNotifications';
import { randomPointNearAnchor, clampWorldPosition } from '@/engine/worldTiles';
import { generatePopulation } from '@/engine/proceduralPopulation';
import { buildNPCReplySync } from '@/engine/dialogueSystem';
import { readProceduralDialogsOnly, readWebLlmAutoload } from '@/lib/chronosSettings';
import {
  applyChoiceConsequencesBatch,
  type ChoiceBatchSideEffects,
  type StoryFlagOp,
} from '@/domain/consequences/applyChoiceConsequences';
import { decayAndSpreadRumorsInWorker } from '@/engine/gossipSpreadWorkerClient';
import { traceAsync, traceSync } from '@/debug/chronosTelemetry';
import { applyMarketSupplyFromCaravanVisits } from '@/domain/economy/caravanEconomy';
import { purchaseShopItemWithGold, type ShopPurchaseResult } from '@/domain/economy/shopPurchase';
import { collectEligibleDefeatNpcIdsForQuestGeneration } from '@/domain/npc/defeatObjectiveRules';
import { applyDefeatEnemyProgressForMarkedDead } from '@/domain/quest/defeatEnemyObjective';
import {
  CHRONOS_QUICK_COMBAT_LOSS_HP,
  canLethallyKillNpcInCombat,
  isNpcHostileForQuickCombat,
  resolveQuickHostileCombat,
} from '@/domain/combat/quickHostileCombat';
import {
  collectFactionRepShiftLines,
  mergeFactionReputation,
  reputationDeltaFromRumorSpread,
} from '@/domain/social/factionReputationRules';
import { shouldSpreadRumorsInWorker } from '@/domain/social/gossipWorkerRules';
import { soundManager } from '@/engine/SoundManager';
import {
  CHRONOS_SAVE_SCHEMA_VERSION,
  migratePersistedSaveRevived,
  type PersistedChronosSave,
} from '@/domain/save/saveSchema';

const MAX_ACTIVE_RUMORS_BUFFER = 52;

// ==================== INITIAL STATE ====================

const createInitialCharacter = (name: string): Character => ({
  name,
  title: 'The Chosen',
  level: 1,
  experience: 0,
  attributes: {
    strength: 10,
    intelligence: 10,
    charisma: 10,
    agility: 10,
    wisdom: 10,
    luck: 10
  },
  appearance: {
    avatar: '/avatars/default.png',
    skinTone: 'medium',
    hairStyle: 'short',
    hairColor: 'brown',
    eyeColor: 'blue',
    outfit: 'traveler',
    accessories: []
  },
  origin: 'unknown',
  backstory: '',
  worldEra: 'medieval',
  personality: {
    brave: 50,
    cunning: 50,
    kind: 50,
    ruthless: 50,
    honorable: 50,
    mysterious: 50
  }
});

const createInitialPlayer = (name: string): Player => ({
  id: `player_${Date.now()}`,
  name,
  createdAt: Date.now(),
  character: createInitialCharacter(name),
  stats: {
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    stamina: 100,
    maxStamina: 100,
    reputation: new Map(),
    achievements: [],
    battlesWon: 0,
    battlesLost: 0,
    enemiesDefeated: 0
  },
  inventory: {
    gold: 100,
    items: [],
    maxSlots: 20,
    storyTokens: 0,
  },
  storyProgress: {
    currentChapter: 1,
    currentScene: 'intro',
    mainQuest: null,
    activeQuests: [],
    completedQuests: [],
    worldState: {
      time: { year: 1247, month: 3, day: 15, hour: 8, minute: 0 },
      weather: 'clear',
      globalEvents: [],
      factionPowers: new Map()
    },
    discoveredLocations: ['starting_village'],
    metNPCs: [],
    unlockedLore: [],
    worldEventLog: [],
    /** Старт у деревни Willbrook — центр условной «карты» */
    worldPosition: { tileX: 500_000, tileY: 500_000 },
    enemyCoalitions: [],
    activeRumors: [],
    factionReputation: {
      guild_merchants: 0,
      church_order: 0,
      thieves_guild: 0,
      academy: 0
    },
    tradeCaravans: ensureDefaultCaravans(undefined),
    rumorConsequenceQueue: [],
  },
  choices: [],
  archetype: 'storyteller',
  preferredTone: 'mysterious',
  emotionalHistory: [],
  lastSession: Date.now(),
  totalPlayTime: 0,
  sessionCount: 1
});

/** Приведение старых сохранений к Map и новым полям storyProgress */
function migrateLoadedPlayer(player: Player): void {
  const rep = player.stats.reputation;
  if (!(rep instanceof Map)) {
    player.stats.reputation = new Map(Object.entries((rep as Record<string, number>) || {}));
  }
  const fp = player.storyProgress.worldState.factionPowers;
  if (fp && !(fp instanceof Map)) {
    player.storyProgress.worldState.factionPowers = new Map(Object.entries(fp as Record<string, number>));
  }
  if (!player.storyProgress.worldEventLog) {
    player.storyProgress.worldEventLog = [];
  }
  if (!player.character.worldEra) {
    player.character.worldEra = 'medieval';
  }
  if (!player.storyProgress.worldPosition) {
    player.storyProgress.worldPosition = { tileX: 500_000, tileY: 500_000 };
  }
  if (!player.storyProgress.enemyCoalitions) {
    player.storyProgress.enemyCoalitions = [];
  }
  if (!player.storyProgress.activeRumors) {
    player.storyProgress.activeRumors = [];
  }
  if (!player.storyProgress.rumorConsequenceQueue) {
    player.storyProgress.rumorConsequenceQueue = [];
  }
  if (!player.storyProgress.factionReputation) {
    player.storyProgress.factionReputation = {
      guild_merchants: 0,
      church_order: 0,
      thieves_guild: 0,
      academy: 0
    };
  }
  player.storyProgress.tradeCaravans = ensureDefaultCaravans(player.storyProgress.tradeCaravans);
  if (player.inventory.storyTokens === undefined) {
    player.inventory.storyTokens = 0;
  }
}


const initialLocations: Location[] = [
  {
    id: 'starting_village',
    name: 'Willbrook Village',
    type: 'city',
    description: 'A small village nestled between rolling hills and an ancient forest. The air smells of hearth fires and freshly baked bread.',
    atmosphere: {
      mood: 'peaceful',
      lighting: 'golden',
      sounds: ['birds', 'wind', 'distant chatter'],
      music: 'ambient_peaceful'
    },
    connectedLocations: ['whispering_forest', 'old_ruins', 'misty_crossroads'],
    npcs: ['elara', 'thorin'],
    pointsOfInterest: [
      { id: 'village_inn', name: 'The Hearthstone Inn', type: 'building', description: 'A cozy inn with a warm fire', interactable: true },
      { id: 'village_square', name: 'Village Square', type: 'landmark', description: 'The heart of the village', interactable: true }
    ],
    secrets: []
  },
  {
    id: 'misty_crossroads',
    name: 'Misty Crossroads',
    type: 'landmark',
    description: 'A windworn crossroads where traders and wanderers swap rumors under a pale sky.',
    atmosphere: {
      mood: 'watchful',
      lighting: 'silver',
      sounds: ['wind', 'distant hooves', 'whispers'],
      music: 'ambient_mysterious'
    },
    connectedLocations: ['starting_village', 'whispering_forest'],
    npcs: [],
    pointsOfInterest: [
      { id: 'crossroads_stone', name: 'Waystone', type: 'landmark', description: 'An old stone with chipped runes', interactable: true }
    ],
    secrets: []
  },
  {
    id: 'whispering_forest',
    name: 'Whispering Forest',
    type: 'forest',
    description: 'Ancient trees tower overhead, their leaves whispering secrets in a language only the wind understands.',
    atmosphere: {
      mood: 'mysterious',
      lighting: 'dappled',
      sounds: ['rustling leaves', 'distant whispers', 'creaking wood'],
      music: 'ambient_mysterious'
    },
    connectedLocations: ['starting_village', 'old_ruins', 'misty_crossroads'],
    npcs: ['vesper'],
    pointsOfInterest: [
      { id: 'ancient_oak', name: 'The Ancient Oak', type: 'landmark', description: 'A tree older than memory', interactable: true },
      { id: 'hidden_grove', name: 'Hidden Grove', type: 'entrance', description: 'Something glimmers in the shadows', interactable: true }
    ],
    secrets: [
      { id: 'forest_secret_1', content: 'The forest is alive and watches all who enter', knownBy: [], discoveredByPlayer: false, revealConditions: [] }
    ]
  },
  {
    id: 'old_ruins',
    name: 'Forgotten Ruins',
    type: 'ruins',
    description: 'Crumbling stone walls bear witness to a civilization long past. Magic lingers here, old and dangerous.',
    atmosphere: {
      mood: 'ominous',
      lighting: 'shadowy',
      sounds: ['howling wind', 'stone grinding', 'echoes'],
      music: 'ambient_dark'
    },
    connectedLocations: ['starting_village', 'whispering_forest'],
    npcs: ['mortimer'],
    pointsOfInterest: [
      { id: 'ruined_temple', name: 'Ruined Temple', type: 'building', description: 'A temple to forgotten gods', interactable: true },
      { id: 'underground_entrance', name: 'Dark Passage', type: 'entrance', description: 'Stairs descend into darkness', interactable: true }
    ],
    secrets: [
      { id: 'ruins_secret_1', content: 'An ancient power sleeps beneath the ruins', knownBy: ['mortimer'], discoveredByPlayer: false, revealConditions: [] }
    ]
  }
];

/** Пауза после входа в playing, чтобы не конкурировать с первым кадром/3D. */
const WEBLLM_START_GRACE_MS = 750;
/** Дедлайн для requestIdleCallback, если main thread долго занят. */
const WEBLLM_IDLE_DEADLINE_MS = 2600;

// ==================== GAME STATE HOOK ====================

export function useGameState() {
  // Core systems
  const storyEngine = useRef(getAIStoryEngine());
  const memorySystem = useRef(getMemorySystem());
  const emotionDetector = useRef(getEmotionDetector());
  const npcSystem = useRef(getNPCSystem());
  const localAI = useRef(getLocalAIManager());
  const rumorWorkerToken = useRef(0);
  const isAdvanceTimeInFlight = useRef(false);
  const playerRef = useRef<Player | null>(null);

  // Player state
  const [player, setPlayer] = useState<Player | null>(null);
  const [isAdvancingTime, setIsAdvancingTime] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location>(initialLocations[0]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [currentQuest, setCurrentQuest] = useState<Quest | null>(null);
  const [gamePhase, setGamePhase] = useState<'intro' | 'character_creation' | 'playing'>('intro');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [saveLoadError, setSaveLoadError] = useState<string | null>(null);
  /** 0..1 загрузка весов WebLLM (null — не грузим / готово) */
  const [llmLoadProgress, setLlmLoadProgress] = useState<number | null>(null);
  /** Инкремент при сохранении настроек — перезапуск фоновой загрузки WebLLM при смене «только процедурные диалоги». */
  const [settingsRev, setSettingsRev] = useState(0);

  // UI state
  const [showInventory, setShowInventory] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);
  const [showMap, setShowMap] = useState(false);
  /** Процедурные NPC на карте (не в NPCSystem — чтобы не раздувать сохранение). */
  const [crowdNPCs, setCrowdNPCs] = useState<NPC[]>([]);

  const worldMapNpcs = useMemo(() => {
    const story = npcSystem.current.getAllNPCs();
    const seen = new Set(story.map((n) => n.id));
    return [...story, ...crowdNPCs.filter((c) => !seen.has(c.id))];
  }, [crowdNPCs]);

  const regionIx = player ? Math.floor(player.storyProgress.worldPosition.tileX / 100) : 0;
  const regionIy = player ? Math.floor(player.storyProgress.worldPosition.tileY / 100) : 0;

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    if (gamePhase !== 'playing' || !player) {
      if (gamePhase !== 'playing') {
        setCrowdNPCs([]);
      }
      return;
    }
    const tx = player.storyProgress.worldPosition.tileX;
    const ty = player.storyProgress.worldPosition.tileY;
    const era = player.character.worldEra ?? 'medieval';
    const seed =
      (hashStringToSeed(player.id) ^
        (Math.imul(regionIx, 10007) >>> 0) ^
        (Math.imul(regionIy, 11003) >>> 0)) >>>
      0;
    setCrowdNPCs(generatePopulation(tx, ty, 150, 40, era, seed));
  }, [gamePhase, player, regionIx, regionIy]);

  // Keep NPC locations synced to world locations
  useEffect(() => {
    npcSystem.current.syncNPCsToLocations(initialLocations);
  }, []);

  useEffect(() => {
    const onSettings = () => setSettingsRev((r) => r + 1);
    window.addEventListener('chronos:settings_updated', onSettings);
    return () => window.removeEventListener('chronos:settings_updated', onSettings);
  }, []);

  // Фоновая загрузка WebLLM (WebGPU + кэш весов); старт после паузы и в idle — меньше лагов при входе в мир.
  useEffect(() => {
    if (gamePhase !== 'playing' || readProceduralDialogsOnly() || !readWebLlmAutoload()) {
      setLlmLoadProgress(null);
      return;
    }
    let cancelled = false;
    let idleHandle: number | undefined;
    const runLoad = () => {
      if (cancelled) return;
      setLlmLoadProgress(0);
      void localAI.current
        .loadModel((p) => {
          setLlmLoadProgress(p < 1 ? p : null);
          if (p >= 1) {
            console.log('[Chronos] WebLLM готов к диалогам с NPC');
          }
        })
        .then((ok) => {
          if (!ok) {
            setLlmLoadProgress(null);
            const L = getLanguage();
            toast.info(t('app.toast.llm_dialogue_fallback', L), {
              description: t('app.toast.llm_dialogue_fallback_desc', L),
            });
          }
        });
    };
    const graceTimer = window.setTimeout(() => {
      if (cancelled) return;
      if (typeof requestIdleCallback !== 'undefined') {
        idleHandle = requestIdleCallback(runLoad, { timeout: WEBLLM_IDLE_DEADLINE_MS });
      } else {
        runLoad();
      }
    }, WEBLLM_START_GRACE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(graceTimer);
      if (idleHandle !== undefined && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleHandle);
      }
    };
  }, [gamePhase, settingsRev]);

  useEffect(() => {
    // Ensure NPCs "live" in the currently active location immediately
    for (const npcId of currentLocation.npcs) {
      npcSystem.current.setNPCLocation(npcId, currentLocation.id);
    }
  }, [currentLocation.id, currentLocation.npcs]);

  // ==================== INITIALIZATION ====================

  const initializePlayer = useCallback((name: string) => {
    const newPlayer = createInitialPlayer(name);
    setPlayer(newPlayer);
    setGamePhase('character_creation');
    return newPlayer;
  }, []);

  const finalizeCharacter = useCallback((character: Partial<Character>) => {
    if (!player) return;

    const nextPlayer: Player = {
      ...player,
      character: {
        ...player.character,
        ...character,
        worldEra: character.worldEra ?? player.character.worldEra ?? 'medieval'
      }
    };

    setPlayer(nextPlayer);
    setGamePhase('playing');

    const era = nextPlayer.character.worldEra ?? 'medieval';
    npcSystem.current.applyWorldEraToTemplateKnowledge(era);

    // Generate initial scene (avoid state race & TDZ issues)
    (async () => {
      setIsGenerating(true);
      setLastError(null);
      try {
        const emotion = emotionDetector.current.getCurrentEmotion();
        const context = {
          player: nextPlayer,
          currentQuest,
          currentLocation,
          recentEvents: nextPlayer.storyProgress.worldState.globalEvents.slice(-3),
          relevantMemories: memorySystem.current.getRelevantMemories({
            location: currentLocation.id,
            limit: 3
          }),
          emotionalState: emotion.emotion,
          sessionMetrics: emotionDetector.current.getSessionMetrics()
        };

        const content = storyEngine.current.generateScene(context);

        const scene: Scene = {
          id: `scene_${Date.now()}`,
          location: currentLocation.id,
          narrative: content.narrative,
          dialogue: content.dialogue,
          choices: content.choices,
          atmosphere: content.atmosphere
        };

        setCurrentScene(scene);
        storyEngine.current.addToHistory(content.narrative);
      } catch (e) {
        console.error('Failed to generate initial scene:', e);
        const msg = e instanceof Error ? e.message : 'Failed to generate initial scene';
        setLastError(msg);
        const L = getLanguage();
        const failTitle = t('app.toast.scene_generation_failed', L);
        const failDesc = t('app.toast.scene_generation_failed_desc', L);
        toast.error(failTitle, {
          description: failDesc,
        });
        notifyGameBrowserEvent({
          tag: CHRONOS_BROWSER_NOTIFY_TAGS.sceneGenerationFailed,
          title: failTitle,
          body: failDesc,
        });
      } finally {
        setIsGenerating(false);
      }
    })();
  }, [player, currentQuest, currentLocation]);

  // ==================== SCENE GENERATION ====================

  const generateScene = useCallback(async (overrides?: {
    player?: Player;
    currentLocation?: Location;
    currentQuest?: Quest | null;
  }) => {
    const effectivePlayer = overrides?.player ?? player;
    const effectiveLocation = overrides?.currentLocation ?? currentLocation;
    const effectiveQuest = overrides?.currentQuest ?? currentQuest;

    if (!effectivePlayer) return;

    setIsGenerating(true);
    setLastError(null);

    try {
      // Get current emotion
      const emotion = emotionDetector.current.getCurrentEmotion();

      // Build context
      const context = {
        player: effectivePlayer,
        currentQuest: effectiveQuest,
        currentLocation: effectiveLocation,
        recentEvents: effectivePlayer.storyProgress.worldState.globalEvents.slice(-3),
        relevantMemories: memorySystem.current.getRelevantMemories({
          location: effectiveLocation.id,
          limit: 3
        }),
        emotionalState: emotion.emotion,
        sessionMetrics: emotionDetector.current.getSessionMetrics()
      };

      // Generate content
      const content = storyEngine.current.generateScene(context);

      // Create scene
      const scene: Scene = {
        id: `scene_${Date.now()}`,
        location: effectiveLocation.id,
        narrative: content.narrative,
        dialogue: content.dialogue,
        choices: content.choices,
        atmosphere: content.atmosphere
      };

      setCurrentScene(scene);

      // Record in history
      storyEngine.current.addToHistory(content.narrative);

      return scene;
    } catch (e) {
      console.error('Failed to generate scene:', e);
      const msg = e instanceof Error ? e.message : 'Failed to generate scene';
      setLastError(msg);
      const L = getLanguage();
      const failTitle = t('app.toast.scene_generation_failed', L);
      const failDesc = t('app.toast.scene_generation_failed_desc', L);
      toast.error(failTitle, {
        description: failDesc,
      });
      notifyGameBrowserEvent({
        tag: CHRONOS_BROWSER_NOTIFY_TAGS.sceneGenerationFailed,
        title: failTitle,
        body: failDesc,
      });
      return;
    } finally {
      setIsGenerating(false);
    }
  }, [player, currentQuest, currentLocation]);

  // Ensure the story always starts when entering "playing"
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    if (!player) return;
    if (currentScene) return;
    if (isGenerating) return;
    void generateScene({ player });
  }, [gamePhase, player, currentScene, isGenerating, generateScene]);

  // ==================== CHOICE HANDLING ====================

  const applyConsequences = useCallback((consequences: Choice['consequences']) => {
    if (!player) return;

    setPlayer((prev) => {
      if (!prev) return null;
      const lang = getLanguage();
      const log = [...(prev.storyProgress.worldEventLog || [])];
      const storyFlags: StoryFlagOp[] = [];
      const sideEffects: ChoiceBatchSideEffects = { npcRelDeltas: [], npcIdsToMarkDead: [] };
      let next = applyChoiceConsequencesBatch(prev, consequences, lang, log, storyFlags, sideEffects);
      for (const id of new Set(sideEffects.npcIdsToMarkDead)) {
        next = applyDefeatEnemyProgressForMarkedDead(next, id, lang, log);
      }
      for (const f of storyFlags) {
        memorySystem.current.setFlag(f.key, f.value);
      }
      for (const d of sideEffects.npcRelDeltas) {
        const npc = npcSystem.current.getNPC(d.npcId);
        if (!npc) continue;
        const pr = npc.playerRelationship;
        if (d.trust !== undefined) pr.trust = Math.max(-100, Math.min(100, pr.trust + d.trust));
        if (d.affection !== undefined) pr.affection = Math.max(-100, Math.min(100, pr.affection + d.affection));
        if (d.respect !== undefined) pr.respect = Math.max(-100, Math.min(100, pr.respect + d.respect));
        if (d.fear !== undefined) pr.fear = Math.max(0, Math.min(100, pr.fear + d.fear));
        npcSystem.current.syncPlayerRelationshipType(d.npcId);
      }
      for (const deadId of sideEffects.npcIdsToMarkDead) {
        const victim = npcSystem.current.getNPC(deadId);
        npcSystem.current.markNpcDead(deadId, prev.id);
        emotionDetector.current.recordAction('npc_marked_dead', { npcId: deadId });
        const name = victim?.name ?? deadId;
        pushWorldLog(
          log,
          lang === 'ru' ? `«${name}» больше не среди живых.` : `"${name}" is no more.`,
          'dramatic',
          'combat',
        );
      }
      return next;
    });
  }, [player]);

  /** Быстрая схватка с враждебным NPC из панели «Люди»: смерть только для тех же id, что и defeat_enemy (proc_*, allowlist). */
  const resolveQuickCombatWithNpc = useCallback(
    (npcId: string) => {
      if (!player) return;
      const npc = npcSystem.current.getNPC(npcId);
      if (!npc) {
        toast.error(t('game.combat_system_only', getLanguage()));
        return;
      }
      if (!isNpcHostileForQuickCombat(npc)) {
        toast.info(t('game.combat_not_hostile', getLanguage()));
        return;
      }

      emotionDetector.current.recordAction('combat_started', { npcId });
      soundManager.play('battle');

      const roll = Math.random();
      const outcome = resolveQuickHostileCombat({ player, npc, roll });

      if (outcome === 'player_loses') {
        soundManager.play('error');
        emotionDetector.current.recordAction('combat_ended_loss', { npcId });
        setPlayer((prev) => {
          if (!prev) return null;
          const lang = getLanguage();
          const log = [...(prev.storyProgress.worldEventLog || [])];
          pushWorldLog(
            log,
            t('game.combat_loss_log', lang).replace('{{name}}', npc.name),
            'dramatic',
            'combat',
          );
          return {
            ...prev,
            stats: {
              ...prev.stats,
              health: Math.max(1, prev.stats.health - CHRONOS_QUICK_COMBAT_LOSS_HP),
              battlesLost: prev.stats.battlesLost + 1,
            },
            storyProgress: { ...prev.storyProgress, worldEventLog: log },
          };
        });
        toast.error(t('game.combat_loss', getLanguage()));
        return;
      }

      emotionDetector.current.recordAction('enemy_defeated', { npcId });
      const lethal = canLethallyKillNpcInCombat(npc);
      if (lethal) {
        soundManager.play('questComplete');
        applyConsequences([{ type: 'npc_mark_dead', key: npcId, value: true }]);
        toast.success(t('game.combat_win_kill', getLanguage()));
        return;
      }

      soundManager.play('success');
      setPlayer((prev) => {
        if (!prev) return null;
        const lang = getLanguage();
        const log = [...(prev.storyProgress.worldEventLog || [])];
        pushWorldLog(
          log,
          t('game.combat_win_nonlethal_log', lang).replace('{{name}}', npc.name),
          'dramatic',
          'combat',
        );
        return {
          ...prev,
          stats: {
            ...prev.stats,
            battlesWon: prev.stats.battlesWon + 1,
            enemiesDefeated: prev.stats.enemiesDefeated + 1,
          },
          storyProgress: { ...prev.storyProgress, worldEventLog: log },
        };
      });
      toast.success(t('game.combat_win_nonlethal', getLanguage()));
    },
    [player, applyConsequences],
  );

  const makeChoice = useCallback((choice: Choice) => {
    if (!player || !currentScene) return;

    // Record action
    emotionDetector.current.recordAction('choice_made', { choiceId: choice.id });

    // Record in memory system
    memorySystem.current.recordChoice(
      player,
      currentQuest?.id || 'exploration',
      currentScene.id,
      choice.id,
      choice.text,
      choice.consequences
    );

    const langChoice = getLanguage();
    recordWitnessedPlayerAction(npcSystem.current, {
      locationId: currentLocation.id,
      excludeNpcIds: new Set(),
      summary:
        langChoice === 'ru'
          ? `Свидетели: игрок сделал выбор — «${choice.text.slice(0, 140)}»`
          : `Witnesses: the player chose "${choice.text.slice(0, 140)}"`,
      playerId: player.id,
      importance: choice.type === 'moral' ? 8 : choice.type === 'strategic' ? 7 : 5
    });

    // Apply consequences
    applyConsequences(choice.consequences);

    // Update personality if aligned
    if (choice.personalityAlignment) {
      setPlayer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          character: {
            ...prev.character,
            personality: {
              ...prev.character.personality,
              ...choice.personalityAlignment
            }
          }
        };
      });
    }

    // Generate next scene
    generateScene();
  }, [player, currentScene, currentQuest, currentLocation, generateScene, applyConsequences]);

  // ==================== LOCATION MANAGEMENT ====================

  const travelTo = useCallback((locationId: string) => {
    const location = initialLocations.find(l => l.id === locationId);
    if (!location) return;

    setCurrentLocation(location);
    emotionDetector.current.recordAction('location_entered', { locationId });

    setPlayer(prev => {
      if (!prev) return null;
      const discovered = prev.storyProgress.discoveredLocations.includes(locationId)
        ? prev.storyProgress.discoveredLocations
        : [...prev.storyProgress.discoveredLocations, locationId];
      const wp = randomPointNearAnchor(locationId, Date.now() ^ prev.id.length);
      return {
        ...prev,
        storyProgress: {
          ...prev.storyProgress,
          discoveredLocations: discovered,
          worldPosition: wp
        }
      };
    });

    generateScene({ currentLocation: location });
  }, [generateScene]);

  /** Плавное перемещение по карте (Canvas): delta в тайлах за кадр */
  const updateWorldPosition = useCallback((delta: { dTileX: number; dTileY: number }) => {
    setPlayer(prev => {
      if (!prev) return null;
      const p = prev.storyProgress.worldPosition;
      return {
        ...prev,
        storyProgress: {
          ...prev.storyProgress,
          worldPosition: clampWorldPosition({
            tileX: p.tileX + delta.dTileX,
            tileY: p.tileY + delta.dTileY
          })
        }
      };
    });
  }, []);

  // ==================== NPC INTERACTION ====================

  const interactWithNPC = useCallback(
    (npcId: string, interactionType: string, customPlayerLine?: string) => {
      const fromSystem = npcSystem.current.getNPC(npcId);
      const fromCrowd = crowdNPCs.find((n) => n.id === npcId);
      const npc = fromSystem ?? fromCrowd;
      if (!npc || !player) return;

      if (interactionType === 'combat_attack') {
        if (!fromSystem) {
          toast.error(t('game.combat_system_only', getLanguage()));
          return;
        }
        resolveQuickCombatWithNpc(npcId);
        return;
      }

      const trimmed = customPlayerLine?.trim();
      const isFollowUp = !!(trimmed && trimmed.length > 0);

      if (!isFollowUp) {
        emotionDetector.current.recordAction('npc_talked', { npcId });
      } else {
        emotionDetector.current.recordAction('dialogue_selected', {
          npcId,
          topic: trimmed!.slice(0, 120)
        });
      }

      let talkNpc = npc;

      if (fromSystem && !isFollowUp) {
        const charisma = player.character.attributes.charisma;
        const baseImpact = charisma / 10;
        const impact = (Math.random() - 0.3) * baseImpact;
        const result = npcSystem.current.interactWithPlayer(
          npcId,
          player,
          interactionType,
          impact,
          currentLocation.id
        );

        if (result.rumor) {
          const rumorLang = getLanguage();
          const socialRumor = buildSocialGossipActiveRumor({
            npcName: npc.name,
            playerName: player.character.name,
            locationName: currentLocation.name,
            originLocationId: result.rumor.locationId,
            effectiveImpact: result.rumor.effectiveImpact,
            factionTags: factionTagsForGossipNpc(npc),
            lang: rumorLang
          });
          setPlayer((prev) => {
            if (!prev) return null;
            const newReputation = new Map(prev.stats.reputation);
            const key = `location:${result.rumor!.locationId}`;
            const current = newReputation.get(key) || 0;
            newReputation.set(key, current + result.rumor!.reputationDelta);
            const log = [...(prev.storyProgress.worldEventLog || [])];
            if (result.worldLogMessage) {
              log.push({
                id: `log_${Date.now()}`,
                timestamp: Date.now(),
                message: result.worldLogMessage,
                severity: socialRumor.severity ?? 'rumor'
              });
              if (log.length > 80) log.splice(0, log.length - 80);
            }
            const prevRumors = [...(prev.storyProgress.activeRumors ?? [])];
            const activeRumors = [...prevRumors, socialRumor].slice(-MAX_ACTIVE_RUMORS_BUFFER);
            return {
              ...prev,
              stats: {
                ...prev.stats,
                reputation: newReputation
              },
              storyProgress: {
                ...prev.storyProgress,
                worldEventLog: log,
                activeRumors
              }
            };
          });
        }
      } else if (!fromSystem && !isFollowUp) {
        const pr = { ...npc.playerRelationship };
        pr.trust = Math.min(100, pr.trust + 2);
        pr.affection = Math.min(100, pr.affection + 1);
        talkNpc = { ...npc, playerRelationship: pr };
        setCrowdNPCs((prev) => prev.map((n) => (n.id === npcId ? talkNpc : n)));
      }

      if (!isFollowUp && !player.storyProgress.metNPCs.includes(npcId)) {
        setPlayer((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            storyProgress: {
              ...prev.storyProgress,
              metNPCs: [...prev.storyProgress.metNPCs, npcId]
            }
          };
        });
      }

      const lang = getLanguage();
      const defaultLine =
        lang === 'ru'
          ? 'Хочу поговорить: магия, алхимия, ковка, политика, слухи — ответь по своей экспертизе.'
          : "I'd like to talk: magic, alchemy, forging, politics, rumors—answer from your expertise.";
      const playerLine = isFollowUp ? trimmed! : defaultLine;

      const othersInLoc = npcSystem.current.getNPCsInLocation(currentLocation.id);

      const dialogue = fromSystem
        ? npcSystem.current.generateDialogue(npcId, playerLine, player, {
            location: currentLocation,
            time: player.storyProgress.worldState.time,
            weather: player.storyProgress.worldState.weather,
            worldEra: player.character.worldEra
          })
        : buildNPCReplySync(talkNpc, player, playerLine, {
            location: currentLocation,
            time: player.storyProgress.worldState.time,
            weather: player.storyProgress.worldState.weather,
            language: lang,
            npcsInLocation: othersInLoc,
            worldEra: player.character.worldEra
          });

      if (fromSystem) {
        const sev = coercivePlayerLineSeverity(playerLine, lang);
        if (sev) {
          npcSystem.current.addMemoryToNPC(npcId, {
            id: `mem_man_${Date.now()}`,
            timestamp: Date.now(),
            type: 'manipulation',
            content:
              lang === 'ru'
                ? sev === 'threat'
                  ? `Игрок давил угрозой: «${playerLine.slice(0, 200)}»`
                  : `Игрок давил словесно / подрывал доверие: «${playerLine.slice(0, 200)}»`
                : sev === 'threat'
                  ? `Player used threats: "${playerLine.slice(0, 200)}"`
                  : `Player used verbal pressure / undermined trust: "${playerLine.slice(0, 200)}"`,
            importance: 9,
            relatedEntities: [player.id, currentLocation.id],
            emotionalValence: -1
          });
        }
        if (isFollowUp) {
          npcSystem.current.addMemoryToNPC(npcId, {
            id: `mem_rep_${Date.now()}`,
            timestamp: Date.now(),
            type: 'conversation',
            content:
              lang === 'ru'
                ? `Реплика игрока: «${playerLine.slice(0, 240)}»`
                : `Player said: "${playerLine.slice(0, 240)}"`,
            importance: 6,
            relatedEntities: [player.id],
            emotionalValence: 0
          });
        }
        recordWitnessedPlayerAction(npcSystem.current, {
          locationId: currentLocation.id,
          excludeNpcIds: new Set([npcId]),
          summary:
            lang === 'ru'
              ? `Видели, как ${player.character.name} общается с ${talkNpc.name}.`
              : `People saw ${player.character.name} speaking with ${talkNpc.name}.`,
          playerId: player.id,
          importance: 4
        });
      }

      const sceneId = `dialogue_${Date.now()}`;
      const scene: Scene = {
        id: sceneId,
        location: currentLocation.id,
        narrative: dialogue,
        dialogue: [
          {
            id: `dlg_${Date.now()}`,
            speakerId: npcId,
            speakerName: talkNpc.name,
            text: dialogue,
            emotion: 'neutral'
          }
        ],
        choices: [
          {
            id: `choice_ask_${Date.now()}`,
            text: t('dialog.ask_story', lang),
            type: 'dialogue',
            consequences: [{ type: 'npc_relationship', key: npcId, value: { trust: 2 } }]
          },
          {
            id: `choice_quest_${Date.now()}`,
            text: t('dialog.ask_help', lang),
            type: 'dialogue',
            consequences: [{ type: 'npc_relationship', key: npcId, value: { trust: 3, affection: 2 } }]
          },
          {
            id: `choice_leave_${Date.now()}`,
            text: t('dialog.goodbye', lang),
            type: 'dialogue',
            consequences: []
          }
        ]
      };

      setCurrentScene(scene);

      const ai = localAI.current;
      if (!readProceduralDialogsOnly() && ai.isLoaded) {
        void ai
          .generateResponse(
            talkNpc,
            player,
            playerLine,
            {
              time: player.storyProgress.worldState.time,
              weather: player.storyProgress.worldState.weather,
              locationId: currentLocation.id,
              locationName: currentLocation.name,
              language: lang === 'ru' ? 'ru' : 'en',
              worldEra: player.character.worldEra
            },
            { useWebLlm: !isBackgroundProceduralNpc(talkNpc) }
          )
          .then((text) => {
            if (!text) return;
            setCurrentScene((prev) => {
              if (!prev || prev.id !== sceneId) return prev;
              const first = prev.dialogue?.[0];
              if (!first) return prev;
              return {
                ...prev,
                narrative: text,
                dialogue: [{ ...first, text }]
              };
            });
          });
      }
    },
    [player, currentLocation, crowdNPCs, resolveQuickCombatWithNpc]
  );

  // ==================== QUEST MANAGEMENT ====================

  const generateQuest = useCallback((type: 'main' | 'side' | 'character' = 'side') => {
    if (!player) return null;

    const emotion = emotionDetector.current.getCurrentEmotion();
    
    const eligibleDefeatNpcIds = collectEligibleDefeatNpcIdsForQuestGeneration(
      npcSystem.current.getNPCsInLocation(currentLocation.id),
    );

    const context = {
      player,
      currentQuest,
      currentLocation,
      recentEvents: [],
      relevantMemories: [],
      emotionalState: emotion.emotion,
      sessionMetrics: emotionDetector.current.getSessionMetrics(),
      eligibleDefeatNpcIds,
    };

    const quest = storyEngine.current.generateQuest(context, type);
    
    setPlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        storyProgress: {
          ...prev.storyProgress,
          activeQuests: [...prev.storyProgress.activeQuests, quest]
        }
      };
    });

    return quest;
  }, [player, currentQuest, currentLocation]);

  const startQuest = useCallback((quest: Quest) => {
    setCurrentQuest(quest);
    
    // Update quest status
    setPlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        storyProgress: {
          ...prev.storyProgress,
          activeQuests: prev.storyProgress.activeQuests.map(q => 
            q.id === quest.id ? { ...q, status: 'active' as const } : q
          )
        }
      };
    });

    // Generate first scene of quest
    if (quest.scenes.length > 0) {
      setCurrentScene(quest.scenes[0]);
    }
  }, []);

  // ==================== EMOTION TRACKING ====================

  const recordAction = useCallback((type: string, details?: unknown) => {
    emotionDetector.current.recordAction(type, details);
  }, []);

  const getCurrentEmotion = useCallback(() => {
    return emotionDetector.current.getCurrentEmotion();
  }, []);

  const getEmotionTrend = useCallback(() => {
    return emotionDetector.current.getEmotionTrend();
  }, []);

  const getAdaptationSuggestions = useCallback(() => {
    return emotionDetector.current.getAdaptationSuggestions();
  }, []);

  // ==================== SAVE/LOAD ====================

  type LoadedSaveSnapshot = {
    player: Player;
    currentLocation: string;
    memorySystem: {
      choices: ChoiceRecord[];
      emotions: EmotionRecord[];
      flags: Record<string, unknown>;
    };
    npcData: unknown;
  };

  const applyLoadedSnapshot = useCallback(
    (saveData: LoadedSaveSnapshot) => {
      migrateLoadedPlayer(saveData.player);
      setPlayer(saveData.player);
      const loc = initialLocations.find((l) => l.id === saveData.currentLocation);
      if (loc) setCurrentLocation(loc);
      memorySystem.current.importMemories(saveData.memorySystem);
      npcSystem.current.importData(saveData.npcData);
      npcSystem.current.applyWorldEraToTemplateKnowledge(saveData.player.character.worldEra ?? 'medieval');
      setGamePhase('playing');
      generateScene({ player: saveData.player, currentLocation: loc ?? currentLocation });
    },
    [generateScene, currentLocation],
  );

  const clearBrowserSaveSlots = useCallback(async () => {
    try {
      localStorage.removeItem('chronos_save');
    } catch {
      /* ignore */
    }
    await clearFullWorldFromIndexedDB().catch(() => {});
  }, []);

  const saveGame = useCallback(() => {
    if (!player) return null;
    if (isAdvanceTimeInFlight.current) return null;

    const saveData = {
      saveSchemaVersion: CHRONOS_SAVE_SCHEMA_VERSION,
      player,
      currentLocation: currentLocation.id,
      memorySystem: memorySystem.current.exportMemories(),
      emotionHistory: emotionDetector.current.getEmotionHistory(86400000),
      npcData: npcSystem.current.exportData(),
      timestamp: Date.now()
    };

    const serialized = serializeMaps(saveData);
    try {
      localStorage.setItem('chronos_save', JSON.stringify(serialized));
    } catch (e) {
      console.error('localStorage save failed', e);
    }
    void saveFullWorldToIndexedDB(serialized).catch(() => {});
    return saveData;
  }, [player, currentLocation]);

  const clearSaveLoadError = useCallback(() => setSaveLoadError(null), []);

  const tryMigrateSave = useCallback(
    (data: PersistedChronosSave): boolean => {
      const r = migratePersistedSaveRevived(data);
      if (r.ok) return true;
      if (r.reason === 'unsupported_forward_schema') {
        void clearBrowserSaveSlots();
        setSaveLoadError(t('app.save_schema_unsupported', getLanguage()));
      }
      return false;
    },
    [clearBrowserSaveSlots],
  );

  const loadGame = useCallback(() => {
    const saveString = localStorage.getItem('chronos_save');
    if (!saveString) return false;

    try {
      const raw = JSON.parse(saveString);
      const saveData = reviveMaps(raw) as LoadedSaveSnapshot;
      if (!tryMigrateSave(saveData as unknown as PersistedChronosSave)) return false;
      setSaveLoadError(null);
      applyLoadedSnapshot(saveData);
      return true;
    } catch (e) {
      console.error('Failed to load game:', e);
      const L = getLanguage();
      setSaveLoadError(t('app.save_load_failed', L));
      return false;
    }
  }, [applyLoadedSnapshot, tryMigrateSave]);

  /** Загрузка последнего полного снимка из IndexedDB (если localStorage пуст или повреждён) */
  const loadGameFromIndexedDB = useCallback(async () => {
    try {
      const raw = await loadFullWorldFromIndexedDB();
      if (!raw || typeof raw !== 'object') return false;
      const saveData = reviveMaps(raw) as LoadedSaveSnapshot;
      if (!tryMigrateSave(saveData as unknown as PersistedChronosSave)) return false;
      setSaveLoadError(null);
      applyLoadedSnapshot(saveData);
      return true;
    } catch (e) {
      console.error('IndexedDB load failed', e);
      const L = getLanguage();
      setSaveLoadError(t('app.save_load_failed_idb', L));
      return false;
    }
  }, [applyLoadedSnapshot, tryMigrateSave]);

  /** Сначала localStorage, при повреждении — полный снимок из IndexedDB (MVP 058). */
  const loadGameWithRecovery = useCallback(async (): Promise<{
    ok: boolean;
    recoveredFromIndexedDb?: boolean;
    unsupportedSchema?: boolean;
  }> => {
    const L = getLanguage();
    const saveString = localStorage.getItem('chronos_save');
    let localFailed = false;

    if (saveString) {
      try {
        const raw = JSON.parse(saveString);
        const saveData = reviveMaps(raw) as LoadedSaveSnapshot;
        if (!tryMigrateSave(saveData as unknown as PersistedChronosSave)) {
          return { ok: false, unsupportedSchema: true };
        }
        setSaveLoadError(null);
        applyLoadedSnapshot(saveData);
        return { ok: true, recoveredFromIndexedDb: false };
      } catch {
        localFailed = true;
      }
    }

    try {
      const raw = await loadFullWorldFromIndexedDB();
      if (!raw || typeof raw !== 'object') {
        if (localFailed || saveString) {
          setSaveLoadError(t('app.save_load_failed', L));
        }
        return { ok: false };
      }
      const saveData = reviveMaps(raw) as LoadedSaveSnapshot;
      if (!tryMigrateSave(saveData as unknown as PersistedChronosSave)) {
        return { ok: false, unsupportedSchema: true };
      }
      setSaveLoadError(null);
      applyLoadedSnapshot(saveData);
      return {
        ok: true,
        recoveredFromIndexedDb: localFailed,
      };
    } catch (e) {
      console.error('Recovery load failed', e);
      setSaveLoadError(t('app.save_load_failed_idb', L));
      return { ok: false };
    }
  }, [applyLoadedSnapshot, tryMigrateSave]);

  const deleteLocalSave = useCallback(async () => {
    await clearBrowserSaveSlots();
    setSaveLoadError(null);
  }, [clearBrowserSaveSlots]);

  // ==================== TIME PROGRESSION ====================

  const advanceTime = useCallback((hours: number) => {
    if (isAdvanceTimeInFlight.current) return;
    const snapshot = playerRef.current;
    if (!snapshot) return;

    const lang = getLanguage();
    const h = Math.max(1, Math.min(168, hours));
    isAdvanceTimeInFlight.current = true;
    setIsAdvancingTime(true);

    const token = ++rumorWorkerToken.current;

    void (async () => {
      try {
        const newTime = { ...snapshot.storyProgress.worldState.time };
        newTime.hour += h;

        while (newTime.hour >= 24) {
          newTime.hour -= 24;
          newTime.day++;
        }

        while (newTime.day > 30) {
          newTime.day -= 30;
          newTime.month++;
        }

        while (newTime.month > 12) {
          newTime.month -= 12;
          newTime.year++;
        }

        const log = [...(snapshot.storyProgress.worldEventLog || [])];
        prepareSocialGraphPairs(npcSystem.current);
        runGenerationsTick(npcSystem.current.getAllNPCs(), h, log);
        runAdvancedSocietyTick(npcSystem.current, h, log, lang);
        runCrowdSocietyTick(crowdNPCs, h, log);

        const adj = buildLocationAdjacency(initialLocations);
        let rumors = [...(snapshot.storyProgress.activeRumors ?? [])];
        let factionPowers = snapshot.storyProgress.worldState.factionPowers;
        maybeSpawnOrganicRumor(npcSystem.current, currentLocation?.id, rumors, lang);
        const rumorsBeforeSpread: ActiveRumor[] = rumors.map((r) => ({
          ...r,
          reachedLocationIds: [...r.reachedLocationIds],
          factionTags: [...r.factionTags],
        }));
        const caravans = [...ensureDefaultCaravans(snapshot.storyProgress.tradeCaravans)];

        const isHeavyRumorTick = shouldSpreadRumorsInWorker(h, rumorsBeforeSpread.length);

        if (!isHeavyRumorTick) {
          rumors = traceSync('advanceTime/rumorsSync', () => tickActiveRumorsSync(rumorsBeforeSpread, h, adj));
          const visited = traceSync('advanceTime/caravansSync', () =>
            tickTradeCaravans(caravans, CHRONOS_TRADE_ROUTES, rumors, h, log, lang),
          );
          factionPowers = applyMarketSupplyFromCaravanVisits(factionPowers, visited, h);
        } else {
          const visited = traceSync('advanceTime/caravansPre', () =>
            tickTradeCaravans(caravans, CHRONOS_TRADE_ROUTES, rumorsBeforeSpread, h, log, lang),
          );
          factionPowers = applyMarketSupplyFromCaravanVisits(factionPowers, visited, h);
          const res = await traceAsync('advanceTime/rumorsWorker', () =>
            decayAndSpreadRumorsInWorker(rumorsBeforeSpread, h, adj, token),
          );
          const out = res?.rumors ?? tickActiveRumorsSync(rumorsBeforeSpread, h, adj);
          rumors = out.map((r) => ({ ...r }));
          if (visited.length > 0) {
            for (const r of rumors) {
              const reach = new Set(r.reachedLocationIds);
              for (const v of visited) reach.add(v);
              r.reachedLocationIds = [...reach];
            }
          }
        }

        let rumorQueue = [...(snapshot.storyProgress.rumorConsequenceQueue ?? [])];
        const queueTick = tickRumorConsequenceQueue(rumorQueue, h);
        rumorQueue = queueTick.queue;

        let factionReputation = mergeFactionReputation(
          snapshot.storyProgress.factionReputation,
          queueTick.releasedReputationDelta,
        );
        for (const line of collectFactionRepShiftLines(queueTick.releasedReputationDelta, lang)) {
          pushWorldLog(log, line, 'rumor', 'social');
        }

        const rawSpreadDelta = reputationDeltaFromRumorSpread(rumorsBeforeSpread, rumors);
        const split = splitRumorReputationRipple(rawSpreadDelta);
        factionReputation = mergeFactionReputation(factionReputation, split.immediate);
        rumorQueue.push(...split.pending);

        for (const line of collectFactionRepShiftLines(split.immediate, lang)) {
          pushWorldLog(log, line, 'rumor', 'social');
        }
        flushRumorJournalHighlights(rumors, log, lang, currentLocation?.id);

        const coalitions = tryEnemyCoalitionFormation(
          npcSystem.current.getAllNPCs(),
          snapshot.storyProgress.enemyCoalitions,
          log,
          lang,
        );
        log.push({
          id: `log_${Date.now()}`,
          timestamp: Date.now(),
          message:
            lang === 'ru'
              ? `Прошло ${h} ч. Жизнь мира ускорилась: отношения, слухи, быт.`
              : `${h} hours passed. The world kept moving.`,
          severity: 'info',
          topic: 'meta_time',
        });
        if (log.length > 80) log.splice(0, log.length - 80);

        if (rumorWorkerToken.current !== token) return;
        if (playerRef.current !== snapshot) return;

        setPlayer({
          ...snapshot,
          storyProgress: {
            ...snapshot.storyProgress,
            enemyCoalitions: coalitions,
            worldEventLog: log,
            activeRumors: rumors,
            tradeCaravans: caravans,
            factionReputation,
            rumorConsequenceQueue: rumorQueue,
            worldState: {
              ...snapshot.storyProgress.worldState,
              factionPowers,
              time: newTime,
            },
          },
        });

        for (const npc of npcSystem.current.getAllNPCs()) {
          npcSystem.current.simulateNPCTurn(npc.id, h, newTime.hour);
        }
      } finally {
        if (rumorWorkerToken.current === token) {
          isAdvanceTimeInFlight.current = false;
          setIsAdvancingTime(false);
        }
      }
    })();
  }, [crowdNPCs, currentLocation?.id]);

  // ==================== SHOP ====================

  const shopItems = useMemo<ShopItem[]>(() => [
    {
      id: 'story_pass',
      name: 'Chronicles Pass',
      description: 'Unlock exclusive storylines and premium content',
      type: 'story_pass',
      priceUSD: 9.99,
      goldPriceBase: 450,
      rewards: [{ type: 'story_unlock', key: 'premium_stories', value: 1 }]
    },
    {
      id: 'character_slot',
      name: 'Additional Character Slot',
      description: 'Create another hero with a unique story',
      type: 'character_slot',
      priceUSD: 4.99,
      goldPriceBase: 220,
      rewards: [{ type: 'character_slot', key: 'slots', value: 1 }]
    },
    {
      id: 'cosmetic_pack',
      name: 'Legendary Outfit Pack',
      description: 'Exclusive cosmetic items for your character',
      type: 'cosmetic',
      priceUSD: 7.99,
      goldPriceBase: 320,
      rewards: [{ type: 'cosmetic', key: 'legendary_outfits', value: 5 }]
    },
    {
      id: 'story_tokens_10',
      name: '10 Story Tokens',
      description: 'Accelerate story generation and unlock special choices',
      type: 'token',
      priceUSD: 2.99,
      goldPriceBase: 120,
      rewards: [{ type: 'token', key: 'story_tokens', value: 10 }]
    },
    {
      id: 'premium_month',
      name: 'Premium Membership (30 days)',
      description: 'All premium features for one month',
      type: 'premium',
      priceUSD: 14.99,
      goldPriceBase: 900,
      rewards: [
        { type: 'premium_days', key: 'premium', value: 30 },
        { type: 'story_tokens', key: 'tokens', value: 50 }
      ]
    }
  ], []);

  const purchaseShopItem = useCallback(
    (itemId: string): ShopPurchaseResult => {
      const prev = playerRef.current;
      if (!prev) return { ok: false, reason: 'not_enough_gold' };
      const item = shopItems.find((i) => i.id === itemId);
      if (!item) return { ok: false, reason: 'not_enough_gold' };
      const lang = getLanguage();
      const log = [...(prev.storyProgress.worldEventLog || [])];
      const res = purchaseShopItemWithGold(prev, item, currentLocation.id, lang, log);
      if (res.ok) setPlayer(res.player);
      return res;
    },
    [currentLocation.id, shopItems],
  );

  // ==================== EFFECTS ====================

  useEffect(() => {
    // Auto-save every 5 minutes
    const interval = setInterval(() => {
      if (player && gamePhase === 'playing') {
        saveGame();
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [player, gamePhase, saveGame]);

  // ==================== RETURN ====================

  return {
    // State
    player,
    currentLocation,
    currentScene,
    currentQuest,
    gamePhase,
    isGenerating,
    lastError,
    llmLoadProgress,
    shopItems,
    
    // NPCs
    npcs: npcSystem.current.getAllNPCs(),
    worldMapNpcs,
    npcsInLocation: npcSystem.current.getNPCsInLocation(currentLocation.id),
    
    // Actions
    initializePlayer,
    finalizeCharacter,
    generateScene,
    makeChoice,
    travelTo,
    updateWorldPosition,
    interactWithNPC,
    generateQuest,
    startQuest,
    recordAction,
    advanceTime,
    saveGame,
    loadGame,
    loadGameFromIndexedDB,
    loadGameWithRecovery,
    deleteLocalSave,
    purchaseShopItem,
    saveLoadError,
    clearSaveLoadError,
    
    // Emotion
    getCurrentEmotion,
    getEmotionTrend,
    getAdaptationSuggestions,
    
    // UI
    showInventory,
    setShowInventory,
    showQuestLog,
    setShowQuestLog,
    showCharacter,
    setShowCharacter,
    showMap,
    setShowMap,
    isAdvancingTime,
    
    // Locations
    locations: initialLocations,

    // Журнал мира (для бегущей строки в UI)
    worldEventLog: player?.storyProgress.worldEventLog ?? [],

    worldPosition: player?.storyProgress.worldPosition ?? { tileX: 500_000, tileY: 500_000 },
    worldSeed: player ? hashStringToSeed(player.id) : 42_069
  };
}

function hashStringToSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
