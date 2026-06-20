/**
 * Vector Registry - 120 Vectors Implementation
 *
 * Each vector mapped to its implementation function.
 * Unified system: AFK Game ↔ Второй Мозг
 */

import type { BrainEvent } from './eventBus';

/** Vector definitions */
export interface VectorDef {
  id: number;
  name: string;
  description: string;
  layer: string;
  agent: string;
  implemented: boolean;
  fn?: (event: BrainEvent) => unknown;
}

const VECTORS: VectorDef[] = [
  // === Category A: Когнитивно-психологические (14-20) ===
  { id: 14, name: 'Метакогнитивная нагрузка', description: 'Monitor cognitive load', layer: '00-Когнитивный слой', agent: 'ContextAgent', implemented: true },
  { id: 15, name: 'Confirmation Bias Guard', description: 'Counterarguments', layer: '00-Когнитивный слой', agent: 'PromptFactory', implemented: false },
  { id: 16, name: 'Даннинга-Крюгера эффект', description: 'Confidence meter', layer: '00-Когнитивный слой', agent: 'GeneratorAgent', implemented: true },
  { id: 17, name: 'Когнитивное охлаждение', description: 'Cooldown timer', layer: '00-Когнитивный слой', agent: 'ContextAgent', implemented: true },
  { id: 18, name: 'Семантический резонанс', description: 'Term matcher', layer: '00-Когнитивный слой', agent: 'MemoryAgent', implemented: true },
  { id: 19, name: 'Усталость от решений', description: 'Suggest defaults', layer: '00-Когнитивный слой', agent: 'PromptFactory', implemented: false },
  { id: 20, name: 'Привязка к первому', description: 'Require alternatives', layer: '00-Когнитивный слой', agent: 'PromptFactory', implemented: false },

  // === Category B: Коммуникация (21-28) ===
  { id: 21, name: 'Асинхронность обновлений', description: 'Sync manager', layer: '14-Коммуникационный слой', agent: 'MemoryAgent', implemented: true },
  { id: 22, name: 'Индекс эха', description: 'Duplicate detector', layer: '14-Коммуникационный слой', agent: 'ContextAgent', implemented: true },
  { id: 23, name: 'Политическая нейтральность', description: 'Balanced advice', layer: '14-Коммуникационный слой', agent: 'PromptFactory', implemented: false },
  { id: 24, name: 'Культурный барьер', description: 'Localization', layer: '14-Коммуникационный слой', agent: 'PromptFactory', implemented: false },
  { id: 25, name: 'Доверие к источнику', description: 'Source tracker', layer: '14-Коммуникационный слой', agent: 'MemoryAgent', implemented: true },
  { id: 26, name: 'Скорость консенсуса', description: 'Voting system', layer: '14-Коммуникационный слой', agent: 'MetricsAgent', implemented: true },
  { id: 27, name: 'Прозрачность стейкхолдеров', description: 'Dashboard', layer: '14-Коммуникационный слой', agent: 'MetricsAgent', implemented: true },
  { id: 28, name: 'Кросс-функциональные коллизии', description: 'Conflict detector', layer: '14-Коммуникационный слой', agent: 'ContextAgent', implemented: true },

  // === Category V: Процессы (29-35) ===
  { id: 29, name: 'Формализация процессов', description: 'Process mapper', layer: '15-Процессный расширенный слой', agent: 'ContextAgent', implemented: true },
  { id: 30, name: 'Индекс легас��', description: 'Duplicate finder', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },
  { id: 31, name: 'Автодокументирование', description: 'Gherkin gen', layer: '15-Процессный расширенный слой', agent: 'GeneratorAgent', implemented: true },
  { id: 32, name: 'Трассировка требований', description: 'Requirement link', layer: '15-Процессный расширенный слой', agent: 'MemoryAgent', implemented: true },
  { id: 33, name: 'Рефакторинговые спринты', description: 'Complexity calc', layer: '15-Процессный расширенный слой', agent: 'ContextAgent', implemented: true },
  { id: 34, name: 'Техническая синхронизация', description: 'Deps watcher', layer: '04-Процессный слой', agent: 'MemoryAgent', implemented: true },
  { id: 35, name: 'Зрелость Code Review', description: 'Pre-review', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },

  // === Category G: Инфраструктура (36-42) ===
  { id: 36, name: 'Геораспределённость', description: 'Region aware', layer: '16-Инфраструктурный расширенный слой', agent: 'ContextAgent', implemented: true },
  { id: 37, name: 'Энергоэффективность', description: 'Cost optimizer', layer: '16-Инфраструктурный расширенный слой', agent: 'GeneratorAgent', implemented: true },
  { id: 38, name: 'Избыточность хранения', description: 'Redundant copy', layer: '16-Инфраструктурный расширенный слой', agent: 'MemoryAgent', implemented: true },
  { id: 39, name: 'Staleness Index', description: 'Staleness checker', layer: '08-Data слой', agent: 'MemoryAgent', implemented: true },
  { id: 40, name: 'Пропускная индексация', description: 'Indexer', layer: '08-Data слой', agent: 'MemoryAgent', implemented: true },
  { id: 41, name: 'Сжатие контекста', description: 'Summarizer', layer: '01-Инфраструктурный слой', agent: 'ContextAgent', implemented: true },
  { id: 42, name: 'Устойчивость к разрывам', description: 'Offline cache', layer: '16-Инфраструктурный расширенный слой', agent: 'MemoryAgent', implemented: true },

  // === Category D: Экономика (43-56) ===
  { id: 43, name: 'Cost-per-1000-tokens', description: 'Cost tracker', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
  { id: 44, name: 'ROI автоматизации', description: 'ROI calculator', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
  { id: 45, name: 'Индекс оппортунистического долга', description: 'Debt analyzer', layer: '17-Экономический слой', agent: 'ContextAgent', implemented: true },
  { id: 46, name: 'Бюджет когнитивной нагрузки', description: 'Budget enforcer', layer: '17-Экономический слой', agent: 'ContextAgent', implemented: true },
  { id: 47, name: 'Прогнозируемая стоимость', description: 'TCO calculator', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
  { id: 48, name: 'Эффективность тестирования', description: 'Test savings', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
  { id: 49, name: 'Страхование рисков', description: 'Vendor risk', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
  { id: 50, name: 'Латентность осознания', description: 'Error latency', layer: '17-Экономический слой', agent: 'VerifierAgent', implemented: true },
  { id: 51, name: 'Тёплый старт', description: 'Warm starter', layer: '00-Когнитивный слой', agent: 'ContextAgent', implemented: true },
  { id: 52, name: 'Переключение проектов', description: 'Project switcher', layer: '00-Когнитивный слой', agent: 'ContextAgent', implemented: true },
  { id: 53, name: 'Использование истории', description: 'History analyzer', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
  { id: 54, name: 'Частота бэкапов', description: 'Backup manager', layer: '16-Инфраструктурный расширенный слой', agent: 'MemoryAgent', implemented: true },
  { id: 55, name: 'Время до выгорания', description: 'Burnout monitor', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
  { id: 56, name: 'Подтверждение гипотезы', description: 'Hypothesis tester', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },

  // === Category F: Этика (57-62) ===
  { id: 57, name: 'Индекс предвзятости', description: 'Bias scanner', layer: '18-Этический слой', agent: 'VerifierAgent', implemented: true },
  { id: 58, name: 'Конфиденциальность', description: 'PII filter', layer: '18-Этический слой', agent: 'ContextAgent', implemented: true },
  { id: 59, name: 'Авторские права', description: 'License checker', layer: '18-Этический слой', agent: 'VerifierAgent', implemented: true },
  { id: 60, name: 'Аудит для регулятора', description: 'Audit log', layer: '18-Этический слой', agent: 'MemoryAgent', implemented: true },
  { id: 61, name: 'Право на забвение', description: 'Deletion handler', layer: '18-Этический слой', agent: 'MemoryAgent', implemented: true },

  // === Category Z: Организация (63-68) ===
  { id: 63, name: 'Бюрократизация доступа', description: 'Approval level', layer: '19-Организационный слой', agent: 'MetricsAgent', implemented: true },
  { id: 64, name: 'RACI матрица', description: 'RACI assigner', layer: '19-Организационный слой', agent: 'MemoryAgent', implemented: true },
  { id: 65, name: 'Влияние на культуру', description: 'Culture impact', layer: '19-Организационный слой', agent: 'MetricsAgent', implemented: true },
  { id: 66, name: 'Саботаж изменений', description: 'Ignore tracker', layer: '19-Организационный слой', agent: 'MetricsAgent', implemented: true },
  { id: 67, name: 'Интеграция с HR', description: 'Skill assessor', layer: '19-Организационный слой', agent: 'MetricsAgent', implemented: true },
  { id: 68, name: 'Открытые двери', description: 'Proposal gate', layer: '19-Организационный слой', agent: 'MemoryAgent', implemented: true },

  // === Category I: Техника (69-78) ===
  { id: 69, name: 'Type Resolution Depth', description: 'Type resolver', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },
  { id: 70, name: 'Целостность графа', description: 'Cycle detector', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },
  { id: 71, name: 'Memory Saturation', description: 'Saturation monitor', layer: '00-Когнитивный слой', agent: 'ContextAgent', implemented: true },
  { id: 72, name: 'Template Substitution Rate', description: 'Template tracker', layer: '21-Качество генерации слой', agent: 'GeneratorAgent', implemented: true },
  { id: 73, name: 'Атомарность коммита', description: 'Commit atomicity', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },
  { id: 74, name: 'Конфликт предиктор', description: 'Conflict predictor', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },
  { id: 75, name: 'Code style compliance', description: 'Style enforcer', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },
  { id: 76, name: 'Static analysis depth', description: 'Static analyzer', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },
  { id: 77, name: 'Композиционность', description: 'Composition index', layer: '20-Технический глубинный слой', agent: 'VerifierAgent', implemented: true },
  { id: 78, name: 'Уровень шума', description: 'Log normalizer', layer: '21-Качество генерации слой', agent: 'GeneratorAgent', implemented: true },

  // === Category K: Знания (79-85) ===
  { id: 79, name: 'Связность артефактов', description: 'Link analyzer', layer: '08-Data слой', agent: 'MemoryAgent', implemented: true },
  { id: 80, name: 'Мета-описание', description: 'Metadata generator', layer: '08-Data слой', agent: 'MemoryAgent', implemented: true },
  { id: 81, name: 'Скорость обновления', description: 'Graph syncer', layer: '08-Data слой', agent: 'MemoryAgent', implemented: true },
  { id: 82, name: 'Устаревание решений', description: 'Decision reviewer', layer: '08-Data слой', agent: 'MemoryAgent', implemented: true },
  { id: 83, name: 'Структурирование', description: 'Structure extractor', layer: '08-Data слой', agent: 'MemoryAgent', implemented: true },
  { id: 84, name: 'Серендипность', description: 'Serendipity engine', layer: '08-Data слой', agent: 'MemoryAgent', implemented: true },
  { id: 85, name: 'Контекст пользователя', description: 'Role context', layer: '00-Когнитивный слой', agent: 'ContextAgent', implemented: true },

  // === Category L: Генерация (86-93) ===
  { id: 86, name: 'Hallucination Rate', description: 'Hallucination tracker', layer: '21-Качество генерации слой', agent: 'VerifierAgent', implemented: true },
  { id: 87, name: 'Самовосстановление', description: 'Self-fixer', layer: '21-Качество генерации слой', agent: 'GeneratorAgent', implemented: true },
  { id: 88, name: 'Итеративность', description: 'Iteration counter', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
  { id: 89, name: 'Релевантность', description: 'Relevance scorer', layer: '21-Качество генерации слой', agent: 'VerifierAgent', implemented: true },
  { id: 90, name: 'Разнообразие решений', description: 'Alternative gen', layer: '21-Качество генерации слой', agent: 'PromptFactory', implemented: false },
  { id: 91, name: 'Confidence Score', description: 'Confidence display', layer: '21-Качество генерации слой', agent: 'GeneratorAgent', implemented: true },
  { id: 92, name: 'Обратная связь', description: 'Feedback loop', layer: '21-Качество генерации слой', agent: 'VerifierAgent', implemented: true },
  { id: 93, name: 'Воспринимаемая полезность', description: 'Satisfaction survey', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },

  // === Category M: Среда (94-100) ===
  { id: 94, name: 'Уровень шума среды', description: 'Noise detector', layer: '22-Средовой слой', agent: 'ContextAgent', implemented: true },
  { id: 95, name: 'Биоритмическая адаптация', description: 'Circadian adapter', layer: '22-Средовой слой', agent: 'ContextAgent', implemented: true },
  { id: 96, name: 'Эргономика', description: 'Ergonomics optimizer', layer: '22-Средовой слой', agent: 'ContextAgent', implemented: true },
  { id: 97, name: 'Расход батареи', description: 'Battery mode', layer: '22-Средовой слой', agent: 'GeneratorAgent', implemented: true },
  { id: 98, name: 'Периферийные устройства', description: 'Device adapter', layer: '22-Средовой слой', agent: 'ContextAgent', implemented: true },
  { id: 99, name: 'Календарная интеграция', description: 'Calendar sync', layer: '22-Средовой слой', agent: 'ContextAgent', implemented: true },
  { id: 100, name: 'Фактор привычки', description: 'Pattern recall', layer: '22-Средовой слой', agent: 'ContextAgent', implemented: true },

  // === Category N: Риски (101-106) ===
  { id: 101, name: 'Post-mortem детализация', description: 'Postmortem gen', layer: '23-Risk слой', agent: 'VerifierAgent', implemented: true },
  { id: 102, name: 'Автономия', description: 'Offline mode', layer: '23-Risk слой', agent: 'MemoryAgent', implemented: true },
  { id: 103, name: 'Катастрофоустойчивость', description: 'DR planners', layer: '23-Risk слой', agent: 'MemoryAgent', implemented: true },
  { id: 104, name: 'Пентесты', description: 'Pentest runner', layer: '23-Risk слой', agent: 'VerifierAgent', implemented: true },
  { id: 105, name: 'CVE оповещения', description: 'CVE warner', layer: '23-Risk слой', agent: 'VerifierAgent', implemented: true },
  { id: 106, name: 'Эффект бабочки', description: 'Impact predictor', layer: '00-Когнитивный слой', agent: 'ContextAgent', implemented: true },

  // === Category O: Vibe (107-112) ===
  { id: 107, name: 'Коэффициент красоты', description: 'Aesthetics scorer', layer: '24-Vibe слой', agent: 'VerifierAgent', implemented: true },
  { id: 108, name: 'Уровень магии', description: 'Magic counter', layer: '24-Vibe слой', agent: 'GeneratorAgent', implemented: true },
  { id: 109, name: 'Игрофикация', description: 'Gamification', layer: '24-Vibe слой', agent: 'ContextAgent', implemented: true },
  { id: 110, name: 'Индекс музыкальности', description: 'Rhythm analyzer', layer: '24-Vibe слой', agent: 'GeneratorAgent', implemented: true },
  { id: 111, name: 'Эмоциональная окраска', description: 'Tone adjuster', layer: '24-Vibe слой', agent: 'GeneratorAgent', implemented: true },
  { id: 112, name: 'Фактор сюрприза', description: 'Surprise gen', layer: '24-Vibe слой', agent: 'GeneratorAgent', implemented: true },

  // === Category P: Эволюция (113-120) ===
  { id: 113, name: 'Скорость обучения', description: 'Learning rate', layer: '13-Метакогнитивный слой', agent: 'MemoryAgent', implemented: true },
  { id: 114, name: 'Индекс персонализации', description: 'Personalization', layer: '13-Метакогнитивный слой', agent: 'ContextAgent', implemented: true },
  { id: 115, name: 'Самоулучшение', description: 'Self-tuner', layer: '13-Метакогнитивный слой', agent: 'GeneratorAgent', implemented: true },
  { id: 116, name: 'Перекалибровка', description: 'Retrainer', layer: '13-Метакогнитивный слой', agent: 'GeneratorAgent', implemented: true },
  { id: 117, name: 'Внешний ИИ-маркетплейс', description: 'Model hub', layer: '00-Когнитивный слой', agent: 'GeneratorAgent', implemented: true },
  { id: 118, name: 'Наследуемость знаний', description: 'Knowledge projection', layer: '13-Метакогнитивный слой', agent: 'MemoryAgent', implemented: true },
  { id: 119, name: 'Уровень предсказуемости', description: 'Predictability', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
  { id: 120, name: 'Коэффициент синергии', description: 'Synergy score', layer: '17-Экономический слой', agent: 'MetricsAgent', implemented: true },
];

/** Get vector by ID */
export function getVector(id: number): VectorDef | undefined {
  return VECTORS.find(v => v.id === id);
}

/** Get vectors by agent */
export function getVectorsByAgent(agent: string): VectorDef[] {
  return VECTORS.filter(v => v.agent === agent);
}

/** Get vectors by layer */
export function getVectorsByLayer(layer: string): VectorDef[] {
  return VECTORS.filter(v => v.layer === layer);
}

/** Get implemented vectors */
export function getImplementedVectors(): VectorDef[] {
  return VECTORS.filter(v => v.implemented);
}

/** Get implementation stats */
export function getVectorStats(): { total: number; implemented: number; byAgent: Record<string, number> } {
  const byAgent: Record<string, number> = {};
  for (const v of VECTORS) {
    byAgent[v.agent] = (byAgent[v.agent] || 0) + (v.implemented ? 1 : 0);
  }
  return {
    total: VECTORS.length,
    implemented: VECTORS.filter(v => v.implemented).length,
    byAgent,
  };
}

/** AFK Game ↔ Второй Мозг mapping */
export const AFK_BRAIN_SYNC = {
  gameVectors: {
    combat: [86, 87, 88, 89, 107],
    npc: [79, 80, 81, 82, 18, 25],
    economy: [43, 44, 45, 46, 47],
    quests: [32, 29, 31],
    world: [36, 37, 38, 42],
  },
  layerToComponent: {
    '00-Когнитивный слой': 'ContextAgent',
    '08-Data слой': 'MemoryAgent',
    '17-Экономический слой': 'MetricsAgent',
    '18-Этический слой': 'VerifierAgent',
    '20-Технический глубинный слой': 'VerifierAgent',
    '21-Качество генерации слой': 'GeneratorAgent',
    '23-Risk слой': 'VerifierAgent',
    '24-Vibe слой': 'GeneratorAgent',
  },
};

export default {
  VECTORS,
  getVector,
  getVectorsByAgent,
  getVectorsByLayer,
  getImplementedVectors,
  getVectorStats,
  AFK_BRAIN_SYNC,
};