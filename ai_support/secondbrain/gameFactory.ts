import fs from 'fs';
import path from 'path';

import { chat, getLLMConfig } from '../llm';
import {
  addADR,
  addTodo,
  init,
  recordDecision,
  setFeatureFlag,
} from './orchestrator';

type BlueprintStatus = 'llm' | 'deterministic';

export interface GameFactoryRequest {
  goal?: string;
  userPrompt?: string;
  constraints?: string[];
  forceDeterministic?: boolean;
  includeRawContext?: boolean;
}

export interface GameFactoryContextFragment {
  source: string;
  kind: 'project' | 'obsidian' | 'memory' | 'secondbrain';
  weight: number;
  content: string;
}

export interface GameFactoryContext {
  projectSummary: string[];
  gamePillars: string[];
  technicalConstraints: string[];
  openProblems: string[];
  userPreferences: string[];
  obsidianSignals: string[];
  sourceSummary: string[];
  fragments: GameFactoryContextFragment[];
}

export interface GameBlueprintTask {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GameGenerationBlueprint {
  goal: string;
  summary: string;
  genre: string;
  playerPromise: string;
  pillars: string[];
  gameplayLoop: string[];
  systems: string[];
  contentPipeline: string[];
  technicalArchitecture: string[];
  firstIncrement: string[];
  tasks: GameBlueprintTask[];
  risks: string[];
  contextUsed: string[];
  provider: string;
  status: BlueprintStatus;
  generatedAt: string;
  rawLlmResponse?: string;
}

interface ObsidianContextFile {
  lastUpdated?: string;
  skillsImplemented?: string[];
  files?: Record<string, string>;
}

interface SecondBrainMemory {
  user_context?: {
    language?: string;
    communication_style?: string;
    tone?: string;
    project?: string;
    stack?: string[];
    preferences?: Record<string, unknown>;
    motivation?: string;
  };
  learned?: {
    model_performance?: Record<string, { success_rate?: number; avg_time_ms?: number }>;
  };
}

const MAX_FRAGMENT_LENGTH = 4000;
const DEFAULT_GOAL = 'Запустить автоматическое создание и развитие AFK Game через LLM, второй мозг в Obsidian и пользовательский контекст';

function resolveProjectRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
  ];

  for (const candidate of candidates) {
    const hasApp = fs.existsSync(path.join(candidate, 'app', 'src'));
    const hasBrain = fs.existsSync(path.join(candidate, 'ai_support', 'secondbrain'));
    if (hasApp && hasBrain) {
      return candidate;
    }
  }

  return process.cwd();
}

function safeReadFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return '';
  }

  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function safeReadJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function normalizeText(content: string): string {
  return content
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

function clip(content: string, maxLength = MAX_FRAGMENT_LENGTH): string {
  const normalized = normalizeText(content);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function extractBulletPoints(content: string, limit: number): string[] {
  const seen = new Set<string>();
  const matches = content
    .split('\n')
    .map(line => line.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, '').trim())
    .filter(line => line.length > 15);

  const selected: string[] = [];

  for (const line of matches) {
    const normalized = line.replace(/\s+/g, ' ').trim();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    selected.push(normalized);
    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

function extractSection(content: string, header: string): string {
  const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`##\\s+${escapedHeader}[\\s\\S]*?(?=\\n##\\s+|$)`, 'i');
  const match = content.match(regex);
  return match ? match[0] : '';
}

function getTopModel(memory: SecondBrainMemory | null): string | null {
  const entries = Object.entries(memory?.learned?.model_performance || {});
  if (entries.length === 0) {
    return null;
  }

  entries.sort((a, b) => {
    const aScore = a[1].success_rate || 0;
    const bScore = b[1].success_rate || 0;
    return bScore - aScore;
  });

  return entries[0]?.[0] || null;
}

function buildContextFragments(rootDir: string): GameFactoryContextFragment[] {
  const obsidianContext = safeReadJson<ObsidianContextFile>(path.join(rootDir, '.obsidian-context.json'), {});
  const secondBrainMemory = safeReadJson<SecondBrainMemory>(path.join(rootDir, 'ai_support', 'secondbrain', 'memory.json'), {});
  const readme = safeReadFile(path.join(rootDir, 'README.md'));
  const design = safeReadFile(path.join(rootDir, 'CHRONOS_DESIGN.md'));
  const dashboard = safeReadFile(path.join(rootDir, '.obsidian', 'secondbrain', '00-DASHBOARD.md'));
  const decisions = safeReadFile(path.join(rootDir, '.obsidian', 'secondbrain', 'cognitive', '01-DECISIONS.md'));
  const flags = safeReadFile(path.join(rootDir, '.obsidian', 'secondbrain', 'delivery', '01-FLAGS.md'));
  const snapshot = safeReadFile(path.join(rootDir, '.obsidian', 'secondbrain', 'communication', '01-SNAPSHOT.md'));

  const contextFiles = Object.entries(obsidianContext.files || {})
    .slice(0, 5)
    .map(([name, content]) => ({
      source: `.obsidian-context.json:${name}`,
      kind: 'obsidian' as const,
      weight: 0.8,
      content: clip(content),
    }));

  const fragments: GameFactoryContextFragment[] = [
    {
      source: 'README.md',
      kind: 'project',
      weight: 1,
      content: clip(readme),
    },
    {
      source: 'CHRONOS_DESIGN.md',
      kind: 'project',
      weight: 1,
      content: clip(design),
    },
    {
      source: '.obsidian/secondbrain/00-DASHBOARD.md',
      kind: 'secondbrain',
      weight: 0.8,
      content: clip(dashboard),
    },
    {
      source: '.obsidian/secondbrain/cognitive/01-DECISIONS.md',
      kind: 'secondbrain',
      weight: 0.9,
      content: clip(decisions),
    },
    {
      source: '.obsidian/secondbrain/delivery/01-FLAGS.md',
      kind: 'secondbrain',
      weight: 0.7,
      content: clip(flags),
    },
    {
      source: '.obsidian/secondbrain/communication/01-SNAPSHOT.md',
      kind: 'secondbrain',
      weight: 0.7,
      content: clip(snapshot),
    },
    {
      source: 'ai_support/secondbrain/memory.json',
      kind: 'memory',
      weight: 1,
      content: clip(JSON.stringify(secondBrainMemory, null, 2)),
    },
    ...contextFiles,
  ];

  return fragments.filter(fragment => fragment.content.length > 0);
}

export function collectGameFactoryContext(rootDir = resolveProjectRoot()): GameFactoryContext {
  const fragments = buildContextFragments(rootDir);
  const readme = fragments.find(fragment => fragment.source === 'README.md')?.content || '';
  const design = fragments.find(fragment => fragment.source === 'CHRONOS_DESIGN.md')?.content || '';
  const decisions = fragments.find(fragment => fragment.source.includes('01-DECISIONS'))?.content || '';
  const snapshot = fragments.find(fragment => fragment.source.includes('01-SNAPSHOT'))?.content || '';
  const secondBrainMemory = safeReadJson<SecondBrainMemory>(path.join(rootDir, 'ai_support', 'secondbrain', 'memory.json'), {});

  const projectSummary = extractBulletPoints(readme, 8);
  const designPillars = extractBulletPoints(extractSection(design, '🎯 Core Pillars'), 6);
  const technicalConstraints = [
    ...extractBulletPoints(readme, 6),
    ...extractBulletPoints(snapshot, 6),
  ].filter(item =>
    /electron|vite|react|three|r3f|gpu|indexeddb|localstorage|fallback|offline|desktop|webllm|typescript/i.test(item)
  ).slice(0, 10);

  const openProblems = [
    ...extractBulletPoints(decisions, 5),
    ...extractBulletPoints(snapshot, 5),
  ].filter(item =>
    /todo|risk|problem|bug|constraint|coverage|refactor|fallback|offline|llm/i.test(item)
  ).slice(0, 8);

  const userPreferences = Object.entries(secondBrainMemory.user_context?.preferences || {})
    .map(([key, value]) => `${key}: ${String(value)}`);

  const obsidianSignals = fragments
    .filter(fragment => fragment.kind === 'obsidian' || fragment.kind === 'secondbrain')
    .slice(0, 6)
    .map(fragment => fragment.source);

  const sourceSummary = fragments.map(fragment => `${fragment.source} (${fragment.kind})`);

  return {
    projectSummary,
    gamePillars: designPillars.length > 0 ? designPillars : [
      'Infinite Storytelling',
      'True Player Agency',
      'Living World',
      'Personal Connection with NPCs',
    ],
    technicalConstraints,
    openProblems,
    userPreferences,
    obsidianSignals,
    sourceSummary,
    fragments,
  };
}

function buildPrompt(context: GameFactoryContext, request: GameFactoryRequest): string {
  return [
    'Ты проектный AI-архитектор для AFK Game.',
    'Нужно спроектировать первый рабочий инкремент системы автоматического создания и эволюции игры.',
    'Используй только контекст ниже и верни строго JSON без пояснений.',
    '',
    `Цель: ${request.goal || DEFAULT_GOAL}`,
    request.userPrompt ? `Дополнительный запрос пользователя: ${request.userPrompt}` : '',
    request.constraints?.length ? `Ограничения: ${request.constraints.join('; ')}` : '',
    '',
    'Контекст проекта:',
    JSON.stringify({
      projectSummary: context.projectSummary,
      gamePillars: context.gamePillars,
      technicalConstraints: context.technicalConstraints,
      openProblems: context.openProblems,
      userPreferences: context.userPreferences,
      obsidianSignals: context.obsidianSignals,
      sourceSummary: context.sourceSummary,
    }, null, 2),
    '',
    'Верни JSON со схемой:',
    JSON.stringify({
      goal: 'string',
      summary: 'string',
      genre: 'string',
      playerPromise: 'string',
      pillars: ['string'],
      gameplayLoop: ['string'],
      systems: ['string'],
      contentPipeline: ['string'],
      technicalArchitecture: ['string'],
      firstIncrement: ['string'],
      tasks: [{ title: 'string', description: 'string', priority: 'high|medium|low' }],
      risks: ['string'],
      contextUsed: ['string'],
    }, null, 2),
  ].filter(Boolean).join('\n');
}

function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1);
  }

  return null;
}

function buildDeterministicBlueprint(
  context: GameFactoryContext,
  request: GameFactoryRequest,
  provider: string,
  rawLlmResponse?: string,
): GameGenerationBlueprint {
  const summary = [
    'Система собирает контекст из репозитория, второго мозга и Obsidian.',
    'На его основе формируется blueprint новых механик, контента и технических задач.',
    'Первый инкремент не меняет весь runtime игры, а создаёт управляемый контур генерации артефактов.',
  ].join(' ');

  const tasks: GameBlueprintTask[] = [
    {
      title: 'Сбор unified context',
      description: 'Объединить README, дизайн-доки, Obsidian notes, memory.json и secondbrain notes в единый контекстный пакет.',
      priority: 'high',
    },
    {
      title: 'Blueprint generation',
      description: 'Генерировать структурированный JSON/Markdown blueprint для систем, контента и сценариев развития игры.',
      priority: 'high',
    },
    {
      title: 'Task materialization',
      description: 'Преобразовывать blueprint в TODO, ADR, feature flags и дорожную карту второго мозга.',
      priority: 'high',
    },
    {
      title: 'Runtime bridge',
      description: 'Начать подключение blueprint-артефактов к app/src/brain и игровым engine-модулям.',
      priority: 'medium',
    },
  ];

  return {
    goal: request.goal || DEFAULT_GOAL,
    summary,
    genre: 'AI-driven narrative AFK RPG',
    playerPromise: 'Каждый игрок получает живой мир, который развивается по его действиям, стилю игры и накопленному контексту.',
    pillars: context.gamePillars,
    gameplayLoop: [
      'Собрать контекст игрока, мира и проектных ограничений',
      'Сгенерировать blueprint новых сюжетов, систем и контент-пакетов',
      'Проверить ограничения, флаги и риски',
      'Материализовать задачи в разработку и артефакты',
      'Подключить результат к runtime системам игры',
    ],
    systems: [
      'Context ingestion из Obsidian и second brain',
      'LLM-orchestrated blueprint generation',
      'Decision/TODO/ADR synchronization',
      'Feature-flagged rollout новых систем',
      'Fallback procedural generation без LLM',
    ],
    contentPipeline: [
      'Obsidian/README/design docs -> context bundle',
      'context bundle -> LLM prompt',
      'LLM/fallback -> structured blueprint',
      'blueprint -> artifact json + markdown + todos + ADR',
      'artifact -> ручное и последующее автоматическое подключение к runtime',
    ],
    technicalArchitecture: [
      'ai_support/secondbrain/gameFactory.ts как точка оркестрации',
      'ai_support/llm.ts как LLM слой с local/cloud fallback',
      'ai_support/secondbrain/orchestrator.ts как память и журнал решений',
      'Obsidian vault и .obsidian-context.json как внешний контекст',
      'app/src/brain как следующая точка интеграции runtime-агентов',
    ],
    firstIncrement: [
      'Собрать unified context',
      'Сгенерировать первый blueprint',
      'Сохранить артефакт в secondbrain и Obsidian',
      'Создать backlog на интеграцию в runtime',
    ],
    tasks,
    risks: [
      'Источники истины пока раздвоены между Obsidian, .obsidian-context.json и secondbrain json',
      'Generator/runtime в app/src/brain ещё stub и не подключён к реальному LLM',
      'Без строгой схемы артефактов возможен дрейф формата blueprint',
    ],
    contextUsed: context.sourceSummary,
    provider,
    status: rawLlmResponse ? 'llm' : 'deterministic',
    generatedAt: new Date().toISOString(),
    rawLlmResponse,
  };
}

async function generateBlueprintWithLlm(
  context: GameFactoryContext,
  request: GameFactoryRequest,
): Promise<GameGenerationBlueprint | null> {
  const prompt = buildPrompt(context, request);
  const config = getLLMConfig();
  const response = await chat({
    messages: [
      {
        role: 'system',
        content: 'Ты возвращаешь только корректный JSON. Никаких markdown-пояснений вне JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    maxTokens: 1800,
  });

  if (!response?.content) {
    return null;
  }

  const rawJson = extractJsonObject(response.content);
  if (!rawJson) {
    return buildDeterministicBlueprint(context, request, `${config.provider}:${config.model}`, response.content);
  }

  try {
    const parsed = JSON.parse(rawJson) as Omit<GameGenerationBlueprint, 'provider' | 'status' | 'generatedAt' | 'rawLlmResponse'>;
    return {
      ...parsed,
      goal: parsed.goal || request.goal || DEFAULT_GOAL,
      provider: `${config.provider}:${config.model}`,
      status: 'llm',
      generatedAt: new Date().toISOString(),
      rawLlmResponse: response.content,
    };
  } catch {
    return buildDeterministicBlueprint(context, request, `${config.provider}:${config.model}`, response.content);
  }
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function renderBlueprintMarkdown(blueprint: GameGenerationBlueprint, context: GameFactoryContext): string {
  const tasks = blueprint.tasks
    .map(task => `- [${task.priority}] ${task.title}: ${task.description}`)
    .join('\n');

  return [
    '# Game Factory Blueprint',
    '',
    `- Goal: ${blueprint.goal}`,
    `- Status: ${blueprint.status}`,
    `- Provider: ${blueprint.provider}`,
    `- Generated: ${blueprint.generatedAt}`,
    '',
    '## Summary',
    blueprint.summary,
    '',
    '## Player Promise',
    blueprint.playerPromise,
    '',
    '## Pillars',
    ...blueprint.pillars.map(item => `- ${item}`),
    '',
    '## Gameplay Loop',
    ...blueprint.gameplayLoop.map(item => `- ${item}`),
    '',
    '## Systems',
    ...blueprint.systems.map(item => `- ${item}`),
    '',
    '## Content Pipeline',
    ...blueprint.contentPipeline.map(item => `- ${item}`),
    '',
    '## First Increment',
    ...blueprint.firstIncrement.map(item => `- ${item}`),
    '',
    '## Tasks',
    tasks,
    '',
    '## Risks',
    ...blueprint.risks.map(item => `- ${item}`),
    '',
    '## Sources',
    ...context.sourceSummary.map(item => `- ${item}`),
    '',
  ].join('\n');
}

function persistBlueprint(
  rootDir: string,
  blueprint: GameGenerationBlueprint,
  context: GameFactoryContext,
  includeRawContext = false,
): void {
  const jsonDir = path.join(rootDir, 'ai_support', 'secondbrain', 'artifacts');
  const markdownDir = path.join(rootDir, '.obsidian', 'secondbrain', 'artifacts');
  ensureDir(jsonDir);
  ensureDir(markdownDir);

  const jsonPayload = includeRawContext
    ? { blueprint, context }
    : { blueprint };

  fs.writeFileSync(
    path.join(jsonDir, 'game-factory-blueprint.json'),
    JSON.stringify(jsonPayload, null, 2),
    'utf-8',
  );

  fs.writeFileSync(
    path.join(markdownDir, '02-GAME-FACTORY.md'),
    renderBlueprintMarkdown(blueprint, context),
    'utf-8',
  );
}

function materializeBlueprintInSecondBrain(blueprint: GameGenerationBlueprint): void {
  recordDecision(
    'С чего начать автоматическое создание игры через LLM и второй мозг?',
    'Запустить Game Factory как контекстный генератор blueprint-артефактов',
    'Это даёт воспроизводимый первый инкремент без прямого вторжения в весь runtime и связывает Obsidian, second brain и LLM.',
    [
      'Сразу генерировать runtime-код в app/src',
      'Ограничиться только документированием',
    ],
    ['game-factory', 'llm', 'obsidian', 'secondbrain'],
  );

  addADR(
    'Game Factory bootstrap',
    'Первый инкремент автоматического создания игры строится вокруг blueprint-артефакта, а не прямой массовой генерации кода.',
    [
      'Появляется единый формат артефакта для генерации',
      'Упрощается подключение Obsidian и user context',
      'Следующим шагом нужно связать blueprint с runtime brain/app systems',
    ],
  );

  setFeatureFlag('llm_game_factory', true, 100, []);

  for (const task of blueprint.tasks.slice(0, 4)) {
    addTodo(`[game-factory] ${task.title}`, task.description, task.priority === 'high' ? 9 : 6);
  }
}

export async function generateGameBlueprint(request: GameFactoryRequest = {}): Promise<{
  context: GameFactoryContext;
  blueprint: GameGenerationBlueprint;
}> {
  await init();

  const rootDir = resolveProjectRoot();
  const context = collectGameFactoryContext(rootDir);
  const secondBrainMemory = safeReadJson<SecondBrainMemory>(path.join(rootDir, 'ai_support', 'secondbrain', 'memory.json'), {});
  const preferredModel = getTopModel(secondBrainMemory);

  const enrichedRequest: GameFactoryRequest = {
    ...request,
    constraints: [
      'Сохранять layered architecture UI -> hooks -> engine -> domain -> types',
      'Использовать feature flags для rollout',
      preferredModel ? `Учитывать успешность модели: ${preferredModel}` : '',
      ...(request.constraints || []),
    ].filter(Boolean),
  };

  const provider = `${getLLMConfig().provider}:${getLLMConfig().model}`;
  const blueprint = request.forceDeterministic
    ? buildDeterministicBlueprint(context, enrichedRequest, provider)
    : await generateBlueprintWithLlm(context, enrichedRequest) || buildDeterministicBlueprint(context, enrichedRequest, provider);

  persistBlueprint(rootDir, blueprint, context, request.includeRawContext);
  materializeBlueprintInSecondBrain(blueprint);

  return { context, blueprint };
}

async function main(): Promise<void> {
  const goal = process.argv.slice(2).join(' ').trim();
  const result = await generateGameBlueprint({
    goal: goal || DEFAULT_GOAL,
  });

  console.log('[game-factory] Blueprint generated');
  console.log(JSON.stringify({
    goal: result.blueprint.goal,
    status: result.blueprint.status,
    provider: result.blueprint.provider,
    firstIncrement: result.blueprint.firstIncrement,
    tasks: result.blueprint.tasks,
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[game-factory] Failed:', error);
    process.exit(1);
  });
}
