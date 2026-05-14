/**
 * Расширенная социальная симуляция: полный граф пар в локации, триады «общих знакомых»,
 * межлокационные связи по professionKey (гильдии / цехи). Толпа на карте — отдельный путь без NPCSystem.
 */
import type { NPC, Relationship, WorldLogEntry } from '@/types/game';
import type { Language } from '@/i18n';
import type { NPCSystem } from '@/engine/NPCSystem';
import { applyCoLocatedSocialDrift } from '@/engine/generations';
import { pushWorldLog } from '@/engine/worldEvents';
import {
  ADVANCED_SOCIETY_MAX_HOURS_PER_TICK,
  ADVANCED_SOCIETY_MIN_HOURS_PER_TICK,
  GUILD_ADJUST_SKIP_CHANCE,
  GUILD_ATTEMPTS_PER_CAPITA,
  GUILD_AFFECTION_DRIFT_AMPLITUDE,
  GUILD_LOG_CHANCE,
  GUILD_TRUST_DRIFT_AMPLITUDE,
  TRIAD_ATTEMPT_BASE,
  TRIAD_AFFECTION_FACTOR,
  TRIAD_BUMP_RANDOM_MAX,
  TRIAD_LOG_CHANCE,
  TRIAD_SECOND_GATE,
  TRIAD_TRUST_THRESHOLD,
} from '@/domain/social/societySimulationConstants';

function rng(): number {
  return Math.random();
}

function neutralRel(): Relationship {
  return {
    type: 'stranger',
    trust: 0,
    affection: 0,
    respect: 0,
    fear: 0,
    history: []
  };
}

/** Пары NPC толпы (процедурные) — только объекты в памяти, без записи в NPCSystem. */
export function ensureCrowdPair(a: NPC, b: NPC): void {
  if (a.id === b.id) return;
  if (!a.relationships.has(b.id)) a.relationships.set(b.id, neutralRel());
  if (!b.relationships.has(a.id)) b.relationships.set(a.id, neutralRel());
}

/** Все живые NPC в одной локации получают нейтральную пару, если ещё не связаны. */
export function prepareSocialGraphPairs(npcSystem: NPCSystem): void {
  const byLoc = new Map<string, NPC[]>();
  for (const n of npcSystem.getAllNPCs()) {
    if (n.status !== 'alive') continue;
    const list = byLoc.get(n.location) ?? [];
    list.push(n);
    byLoc.set(n.location, list);
  }
  for (const [, group] of byLoc) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        npcSystem.ensureRelationshipPair(group[i].id, group[j].id);
      }
    }
  }
}

/**
 * Толпа на карте: связи и тот же дрейф, что у сторизных NPC в generations.
 */
export function runCrowdSocietyTick(crowd: NPC[], hours: number, worldLog: WorldLogEntry[]): void {
  if (crowd.length < 2) return;
  const byLoc = new Map<string, NPC[]>();
  for (const n of crowd) {
    if (n.status !== 'alive') continue;
    const list = byLoc.get(n.location) ?? [];
    list.push(n);
    byLoc.set(n.location, list);
  }
  for (const [, group] of byLoc) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        ensureCrowdPair(group[i], group[j]);
      }
    }
    applyCoLocatedSocialDrift(group, hours, worldLog);
  }
}

/** Триады и межлокационные профессиональные связи (после базового дрейва поколений). */
export function runAdvancedSocietyTick(
  npcSystem: NPCSystem,
  hours: number,
  worldLog: WorldLogEntry[],
  lang: Language
): void {
  const h = Math.min(ADVANCED_SOCIETY_MAX_HOURS_PER_TICK, Math.max(ADVANCED_SOCIETY_MIN_HOURS_PER_TICK, hours));
  const intensity = Math.min(1, h / 24);

  const alive = npcSystem.getAllNPCs().filter((n) => n.status === 'alive');

  const byLoc = new Map<string, NPC[]>();
  for (const n of alive) {
    const list = byLoc.get(n.location) ?? [];
    list.push(n);
    byLoc.set(n.location, list);
  }

  // Триады: A–B и B–C дружелюбны → слегка усиливается A–C
  for (const [, group] of byLoc) {
    if (group.length < 3 || rng() > TRIAD_ATTEMPT_BASE * intensity) continue;
    const a = group[Math.floor(rng() * group.length)];
    const b = group[Math.floor(rng() * group.length)];
    const c = group[Math.floor(rng() * group.length)];
    if (new Set([a.id, b.id, c.id]).size < 3) continue;

    npcSystem.ensureRelationshipPair(a.id, b.id);
    npcSystem.ensureRelationshipPair(b.id, c.id);
    npcSystem.ensureRelationshipPair(a.id, c.id);

    const rab = a.relationships.get(b.id);
    const rbc = b.relationships.get(c.id);
    if (!rab || !rbc || rab.trust < TRIAD_TRUST_THRESHOLD || rbc.trust < TRIAD_TRUST_THRESHOLD) continue;
    if (rng() > TRIAD_SECOND_GATE) continue;

    const rac = a.relationships.get(c.id);
    const rca = c.relationships.get(a.id);
    if (!rac || !rca) continue;

    const bump = 1 + rng() * TRIAD_BUMP_RANDOM_MAX;
    rac.trust = Math.min(100, rac.trust + bump);
    rca.trust = rac.trust;
    rac.affection = Math.min(100, rac.affection + bump * TRIAD_AFFECTION_FACTOR);
    rca.affection = rac.affection;

    if (rng() < TRIAD_LOG_CHANCE * intensity) {
      pushWorldLog(
        worldLog,
        lang === 'ru'
          ? `Общие знакомые сближают ${a.name} и ${c.name}.`
          : `Shared circles draw ${a.name} and ${c.name} closer.`,
        'info',
        'social',
      );
    }
  }

  // «Цеха»: один professionKey, разные локации — слабые перекрёстные связи
  const byProf = new Map<string, NPC[]>();
  for (const n of alive) {
    const k = n.professionKey ?? 'unknown';
    const list = byProf.get(k) ?? [];
    list.push(n);
    byProf.set(k, list);
  }

  for (const [, list] of byProf) {
    if (list.length < 2) continue;
    const attempts = Math.max(1, Math.ceil(list.length * GUILD_ATTEMPTS_PER_CAPITA * intensity));
    for (let t = 0; t < attempts; t++) {
      const a = list[Math.floor(rng() * list.length)];
      const b = list[Math.floor(rng() * list.length)];
      if (a.id === b.id || a.location === b.location) continue;

      npcSystem.ensureRelationshipPair(a.id, b.id);
      if (rng() > GUILD_ADJUST_SKIP_CHANCE * intensity) continue;

      const relAB = npcSystem.getNPCRelationship(a.id, b.id);
      const relBA = npcSystem.getNPCRelationship(b.id, a.id);
      if (!relAB || !relBA) continue;

      const dTrust = (rng() - 0.5) * GUILD_TRUST_DRIFT_AMPLITUDE;
      relAB.trust = Math.max(-100, Math.min(100, relAB.trust + dTrust));
      relBA.trust = relAB.trust;
      const dAff = (rng() - 0.5) * GUILD_AFFECTION_DRIFT_AMPLITUDE;
      relAB.affection = Math.max(-100, Math.min(100, relAB.affection + dAff));
      relBA.affection = relAB.affection;

      if (rng() < GUILD_LOG_CHANCE * intensity) {
        pushWorldLog(
          worldLog,
          lang === 'ru'
            ? `${a.name} и ${b.name} перекидываются вестями ремесла, хоть и далеко друг от друга.`
            : `${a.name} and ${b.name} swap craft gossip across the miles.`,
          'rumor',
          'social',
        );
      }
    }
  }
}
