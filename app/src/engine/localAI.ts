// Chronos — WebLLM (@mlc-ai/web-llm) на устройстве игрока (WebGPU в клиенте). Процедурный слой: dialogueSystem.
// Гибрид: фоновые процедурные NPC (proc_*) не грузят GPU; ключевые — очередь + кэш localStorage.

import type { GameTime, NPC, Player, Weather, WorldEra } from '@/types/game';
import { mentalStateSummary } from '@/engine/psychology';
import { CHRONOS_WEBLLM_WEIGHT_LOAD_TIMEOUT_SEC } from '@/domain/ai/webllmConstants';
import { recordLlmWeightLoad } from '@/debug/chronosTelemetry';

const CACHE_PREFIX = 'chronos_llm_cache:';

/** Удаляет дисковый кэш ответов LLM в localStorage (MVP 092). */
export function clearChronosLlmDiskCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    /* квота / приватный режим */
  }
}
const DEFAULT_MODEL = 'Llama-3.1-8B-Instruct-q4f32_1-MLC';

/** Процедурные NPC карты — только dialogueSystem, без WebLLM (производительность). */
export function isBackgroundProceduralNpc(npc: NPC): boolean {
  return npc.id.startsWith('proc_');
}

function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

export function worldStateHash(w: {
  time: GameTime;
  weather: Weather;
  locationId: string;
  worldEra?: WorldEra;
}): string {
  return hashString(
    `${w.time.year}-${w.time.month}-${w.time.day}-${w.time.hour}-${w.weather}-${w.locationId}-${w.worldEra ?? ''}`
  );
}

export interface GenerateResponseOptions {
  /** false — не вызывать модель (уже есть процедурная реплика). По умолчанию true. */
  useWebLlm?: boolean;
}

export class LocalAIManager {
  modelName: string = DEFAULT_MODEL;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private engine: any = null;

  isLoaded = false;

  loadingProgress = 0;

  /** Серийная очередь запросов к движку (без параллельных completion). */
  private queue: Promise<unknown> = Promise.resolve();

  private cacheGet(key: string): string | null {
    try {
      return localStorage.getItem(CACHE_PREFIX + key);
    } catch {
      return null;
    }
  }

  private cacheSet(key: string, value: string): void {
    try {
      localStorage.setItem(CACHE_PREFIX + key, value);
    } catch {
      /* квота */
    }
  }

  async loadModel(progressCallback?: (p: number) => void): Promise<boolean> {
    if (this.isLoaded && this.engine) return true;
    const timeoutMs = CHRONOS_WEBLLM_WEIGHT_LOAD_TIMEOUT_SEC * 1000;
    try {
      const webllm = await import('@mlc-ai/web-llm');
      const CreateMLCEngine = webllm.CreateMLCEngine as (name: string, opts: Record<string, unknown>) => Promise<unknown>;

      this.loadingProgress = 0;
      progressCallback?.(0);

      const enginePromise = CreateMLCEngine(this.modelName, {
        initProgressCallback: (report: { progress?: number }) => {
          const p = typeof report?.progress === 'number' ? report.progress : 0;
          this.loadingProgress = p;
          progressCallback?.(p);
        }
      });

      // [TECH_DEBT: CHRONOS-TD-001] Promise.race не отменяет загрузку весов в @mlc-ai/web-llm — fix: AbortSignal при поддержке движка или отдельный worker
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('CHRONOS_WEBLLM_LOAD_TIMEOUT')), timeoutMs);
      });

      this.engine = await Promise.race([enginePromise, timeoutPromise]);

      this.isLoaded = true;
      this.loadingProgress = 1;
      progressCallback?.(1);
      recordLlmWeightLoad('ok');
      return true;
    } catch (e) {
      console.warn('[LocalAI] Модель не загружена (нужен WebGPU и сеть для кэша):', e);
      this.engine = null;
      this.isLoaded = false;
      recordLlmWeightLoad('fail');
      return false;
    }
  }

  private buildSystemPrompt(
    npc: NPC,
    player: Player,
    opts: { time: GameTime; weather: Weather; locationName: string; language: 'ru' | 'en'; worldEra?: WorldEra }
  ): string {
    const p = npc.personality;
    const rel = npc.playerRelationship;
    const kb = npc.knowledgeBase;
    const factsList = [...(kb?.facts || [])]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 12)
      .map((f) => f.text);
    const factsJoined = factsList.join(' | ') || '—';

    const memPlayer = [...npc.memories]
      .filter((m) => m.relatedEntities?.includes(player.id) || m.content.toLowerCase().includes(player.character.name.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map((m) => `• ${m.content}`);

    const memBlock = memPlayer.length > 0 ? memPlayer.join('\n') : opts.language === 'ru' ? '(записей пока мало)' : '(few records yet)';

    const relLine =
      opts.language === 'ru'
        ? `тип связи: ${rel.type}; доверие ${rel.trust}, симпатия ${rel.affection}, уважение ${rel.respect}, страх ${rel.fear} (шкала отношений к игроку примерно −100…+100).`
        : `relationship type: ${rel.type}; trust ${rel.trust}, affection ${rel.affection}, respect ${rel.respect}, fear ${rel.fear} (roughly −100…+100 toward the player).`;

    const psych =
      opts.language === 'ru'
        ? `стресс ${npc.mentalState.stress}, счастье ${npc.mentalState.happiness}, травма ${npc.mentalState.trauma} (${mentalStateSummary(npc.mentalState)})`
        : `stress ${npc.mentalState.stress}, happiness ${npc.mentalState.happiness}, trauma ${npc.mentalState.trauma} (${mentalStateSummary(npc.mentalState)})`;

    if (opts.language === 'ru') {
      const agree = Math.round(p.agreeableness * 100);
      const conscient = Math.round(p.conscientiousness * 100);
      const open = Math.round(p.openness * 100);
      const extra = Math.round(p.extraversion * 100);
      const neur = Math.round(p.neuroticism * 100);
      return [
        `Ты — ${npc.name}, ${npc.age} лет, ${npc.profession}.`,
        `Твой характер (Big Five 0–100 и черты): доброжелательность ${agree}, добросовестность ${conscient}, открытость ${open}, общительность ${extra}, нейротизм ${neur}; смелость ${p.bravery}, жадность ${p.greed}, верность ${p.loyalty}, амбиции ${p.ambition}, эмпатия ${p.empathy}.`,
        `Твоё отношение к игроку: ${relLine}`,
        `Твоё психологическое состояние: ${psych}.`,
        `Ты помнишь следующие события с игроком (новее важнее):\n${memBlock}`,
        `Твои знания и экспертиза: область «${kb?.field || 'общее'}», уверенность ${((kb?.confidence ?? 0.5) * 100).toFixed(0)}%; факты: ${factsJoined}.`,
        `Сейчас ${opts.time.hour}:${String(opts.time.minute).padStart(2, '0')}, погода ${opts.weather}, ты в месте «${opts.locationName}», эпоха мира ${opts.worldEra ?? 'medieval'}.`,
        'Отвечай как живой человек с этим характером и опытом. Не используй шаблонные фразы и не ломай характер. Учитывай отношение к игроку и своё состояние. Не противоречь своим фактам.',
        'Отвечай по-русски, разговорно, без «я языковая модель».'
      ].join('\n');
    }

    return [
      `You are ${npc.name}, ${npc.age} years old, ${npc.profession}.`,
      `Personality: Big Five as 0–100 approx — agreeableness ${Math.round(p.agreeableness * 100)}, conscientiousness ${Math.round(
        p.conscientiousness * 100
      )}, openness ${Math.round(p.openness * 100)}, extraversion ${Math.round(p.extraversion * 100)}, neuroticism ${Math.round(
        p.neuroticism * 100
      )}; bravery ${p.bravery}, greed ${p.greed}, loyalty ${p.loyalty}, ambition ${p.ambition}, empathy ${p.empathy}.`,
      `Your stance toward the player: ${relLine}`,
      `Mental state: ${psych}.`,
      `Memories involving the player (newer first):\n${memBlock}`,
      `Knowledge: field "${kb?.field || 'general'}", confidence ${((kb?.confidence ?? 0.5) * 100).toFixed(0)}%; facts: ${factsJoined}.`,
      `Now ${opts.time.hour}:${String(opts.time.minute).padStart(2, '0')}, weather ${opts.weather}, you are at "${opts.locationName}", era ${
        opts.worldEra ?? 'medieval'
      }.`,
      'Reply as a living person with this personality and history. No clichés, no “as an AI”. Honor your facts and relationship.',
      'Reply in English, natural dialogue.'
    ].join('\n');
  }

  /**
   * Ответ WebLLM. Очередь + кэш localStorage (npc + сообщение + хэш мира + модель).
   * Гибрид: при useWebLlm === false или proc_* NPC — вернёт null (остаётся процедурная реплика).
   */
  async generateResponse(
    npc: NPC,
    player: Player,
    playerMessage: string,
    world: {
      time: GameTime;
      weather: Weather;
      locationId: string;
      locationName: string;
      language: 'ru' | 'en';
      worldEra?: WorldEra;
    },
    options?: GenerateResponseOptions
  ): Promise<string | null> {
    const useLlm = options?.useWebLlm !== false;
    if (!useLlm || isBackgroundProceduralNpc(npc)) return null;
    if (!this.isLoaded || !this.engine) return null;

    const cacheKey = hashString(
      `${npc.id}|${playerMessage}|${worldStateHash(world)}|${player.id}|${this.modelName}|v2`
    );
    const cached = this.cacheGet(cacheKey);
    if (cached) return cached;

    const run = async (): Promise<string | null> => {
      const system = this.buildSystemPrompt(npc, player, {
        time: world.time,
        weather: world.weather,
        locationName: world.locationName,
        language: world.language,
        worldEra: world.worldEra
      });

      try {
        const completion = await this.engine.chat.completions.create({
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: playerMessage }
          ],
          temperature: 0.82,
          max_tokens: 520
        });
        const text =
          completion?.choices?.[0]?.message?.content?.trim() ||
          completion?.choices?.[0]?.message?.content ||
          null;
        if (text) this.cacheSet(cacheKey, text);
        return text;
      } catch (e) {
        console.warn('[LocalAI] generateResponse failed:', e);
        return null;
      }
    };

    const exec = this.queue
      .then(() => run())
      .catch((e) => {
        console.warn('[LocalAI] queued task error:', e);
        return null;
      });
    this.queue = exec.then(() => undefined).catch(() => undefined);
    return exec;
  }
}

let instance: LocalAIManager | null = null;

export function getLocalAIManager(): LocalAIManager {
  if (!instance) instance = new LocalAIManager();
  return instance;
}
