// Процедурные NPC на карте: русские имена, знания по эпохе, позиция worldTile.
import type { NPC, WorldEra } from '@/types/game';
import { buildKnowledgeBaseFromPool } from '@/engine/knowledge';
import { defaultMentalState } from '@/engine/psychology';
import { nearestLocationId, WORLD_SIZE } from '@/engine/worldTiles';

const FIRST_RU = [
  'Артём', 'Марина', 'Илья', 'Софья', 'Дмитрий', 'Алина', 'Кирилл', 'Елена', 'Максим', 'Ольга',
  'Андрей', 'Татьяна', 'Сергей', 'Наталья', 'Павел', 'Виктория', 'Роман', 'Дарья', 'Никита', 'Анна',
  'Глеб', 'Полина', 'Егор', 'Ксения', 'Станислав', 'Юлия', 'Вадим', 'Мария', 'Игорь', 'Екатерина'
];

const LAST_RU = [
  'Волков', 'Орлова', 'Соколов', 'Лебедев', 'Козлов', 'Новиков', 'Морозов', 'Петров', 'Васильев', 'Соловьёв',
  'Зайцев', 'Павлов', 'Семёнов', 'Голубев', 'Виноградов', 'Богданов', 'Воробьёв', 'Фёдоров', 'Михайлов', 'Белов',
  'Тарасов', 'Белова', 'Комаров', 'Орлов', 'Киселёв', 'Макаров', 'Андреев', 'Ковалёв', 'Ильин', 'Гусев'
];

type ProfRow = { key: string; title: string; profession: string };

const MEDIEVAL: ProfRow[] = [
  { key: 'blacksmith', title: 'Кузнец', profession: 'кузнец и мастер по металлу' },
  { key: 'innkeeper', title: 'Трактирщик', profession: 'хозяин постоялого двора' },
  { key: 'priest', title: 'Священник', profession: 'служитель храма' },
  { key: 'thief', title: 'Вор', profession: 'член теневой гильдии' },
  { key: 'alchemist', title: 'Алхимик', profession: 'зельевар и экспериментатор' },
  { key: 'warrior', title: 'Воин', profession: 'наёмник и охранник' },
  { key: 'sorcerer', title: 'Маг', profession: 'исследователь арканы' },
  { key: 'rogue', title: 'Плут', profession: 'разведчик и переговорщик' },
  { key: 'default', title: 'Ремесленник', profession: 'торговец и ремесленник' }
];

const MODERN: ProfRow[] = [
  { key: 'scientist', title: 'Учёный', profession: 'исследователь и консультант' },
  { key: 'bartender', title: 'Бармен', profession: 'работник бара и «ухо района»' },
  { key: 'police', title: 'Офицер', profession: 'представитель правопорядка' },
  { key: 'homeless_scholar', title: 'Уличный философ', profession: 'бывший академик на обочине' },
  { key: 'default', title: 'Горожанин', profession: 'житель мегаполиса' }
];

const FUTURE: ProfRow[] = [
  { key: 'hacker', title: 'Хакер', profession: 'специалист по теневым сетям' },
  { key: 'drone_pilot', title: 'Пилот дронов', profession: 'логистика и доставка' },
  { key: 'ai_admin', title: 'Аудитор ИИ', profession: 'этика алгоритмов и данных' },
  { key: 'default', title: 'Гражданин', profession: 'обитатель мегаполиса будущего' }
];

function profsForEra(era: WorldEra): ProfRow[] {
  if (era === 'modern') return MODERN;
  if (era === 'future') return FUTURE;
  return MEDIEVAL;
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function clampTile(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(WORLD_SIZE - 1, x)),
    y: Math.max(0, Math.min(WORLD_SIZE - 1, y))
  };
}

function randomPersonality(r: () => number) {
  const t = () => 0.28 + r() * 0.62;
  return {
    openness: t(),
    conscientiousness: t(),
    extraversion: t(),
    agreeableness: t(),
    neuroticism: t(),
    bravery: Math.floor(35 + r() * 55),
    loyalty: Math.floor(35 + r() * 55),
    greed: Math.floor(15 + r() * 75),
    ambition: Math.floor(25 + r() * 65),
    empathy: Math.floor(30 + r() * 60)
  };
}

function pickName(r: () => number): string {
  const f = FIRST_RU[Math.floor(r() * FIRST_RU.length)];
  const l = LAST_RU[Math.floor(r() * LAST_RU.length)];
  return `${f} ${l}`;
}

function appearanceLine(r: () => number): string {
  const opts = [
    'Неприметная одежда путника, усталый взгляд.',
    'Руки в мозолях — явный трудяг.',
    'Подозрительно блуждающий взгляд, привычка оглядываться.',
    'Аккуратный вид, сдержанные жесты.',
    'Следы дороги: пыль на сапогах, потёртый плащ.'
  ];
  return opts[Math.floor(r() * opts.length)];
}

/**
 * Генерирует «толпу» NPC вокруг точки — для отображения на карте и диалогов.
 */
export function generatePopulation(
  centerTileX: number,
  centerTileY: number,
  radius: number,
  count: number,
  era: WorldEra,
  seed: number
): NPC[] {
  const r = makeRng(seed);
  const rows = profsForEra(era);
  const out: NPC[] = [];

  for (let i = 0; i < count; i++) {
    const angle = r() * Math.PI * 2;
    const dist = r() * radius;
    const rawX = centerTileX + Math.cos(angle) * dist;
    const rawY = centerTileY + Math.sin(angle) * dist;
    const wt = clampTile(rawX, rawY);
    const locId = nearestLocationId(wt.x, wt.y, 220);
    const row = rows[Math.floor(r() * rows.length)] ?? rows[0];
    const kb = buildKnowledgeBaseFromPool(era, row.key);
    const age = 18 + Math.floor(r() * 48);
    const id = `proc_${seed}_${i}`;

    const npc: NPC = {
      id,
      name: pickName(r),
      title: row.title,
      age,
      profession: row.profession,
      professionKey: row.key,
      avatar: '',
      appearance: appearanceLine(r),
      personality: randomPersonality(r),
      knowledgeBase: kb,
      mentalState: defaultMentalState(),
      status: 'alive',
      location: locId,
      worldTile: { x: wt.x, y: wt.y },
      level: 1 + Math.floor(r() * 4),
      attributes: {
        strength: 8 + Math.floor(r() * 8),
        intelligence: 8 + Math.floor(r() * 8),
        charisma: 8 + Math.floor(r() * 8),
        agility: 8 + Math.floor(r() * 8),
        wisdom: 8 + Math.floor(r() * 8),
        luck: 8 + Math.floor(r() * 8)
      },
      memories: [],
      relationships: new Map(),
      playerRelationship: {
        type: 'stranger',
        trust: Math.floor(-5 + r() * 15),
        affection: 0,
        respect: Math.floor(r() * 20),
        fear: Math.floor(r() * 15),
        history: []
      },
      schedule: {
        defaultLocation: locId,
        routines: [],
        currentActivity: r() > 0.5 ? 'Идёт по дороге' : 'Осматривает окрестности'
      },
      goals: [],
      secrets: [],
      backstory: 'Живёт поблизости, знает местные сплетни и ремесло.',
      roleInStory: 'Прохожий'
    };
    out.push(npc);
  }

  return out;
}
