// Chronos — задел системы поколений: брак, наследование отношений, события при пропуске времени.
// Здесь лёгкая эмерджентность без тяжёлого графа родства (расширяется позже).

import type { NPC, WorldLogEntry } from '@/types/game';
import { pushWorldLog } from '@/engine/worldEvents';

function rng(): number {
  return Math.random();
}

/**
 * Социальный дрейф для группы NPC в одной локации (пары уже должны иметь записи в relationships).
 */
export function applyCoLocatedSocialDrift(
  group: NPC[],
  hours: number,
  worldLog: WorldLogEntry[]
): void {
  const h = Math.min(168, Math.max(1, hours));
  const intensity = Math.min(1, h / 24);
  if (group.length < 2) return;

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      if (rng() > 0.02 * intensity) continue;
      const a = group[i];
      const b = group[j];
      const relA = a.relationships.get(b.id);
      if (!relA) continue;

      if (relA.trust > 60 && relA.affection > 40 && rng() < 0.08 * intensity) {
        pushWorldLog(
          worldLog,
          `Между ${a.name} и ${b.name} зреет союз — шепчутся о совместном будущем.`,
          'rumor',
          'social',
        );
        relA.affection = Math.min(100, relA.affection + 3);
        const relB = b.relationships.get(a.id);
        if (relB) relB.affection = Math.min(100, relB.affection + 3);
      }

      if (relA.trust < -50 && rng() < 0.06 * intensity) {
        pushWorldLog(worldLog, `${a.name} и ${b.name} едва сдерживаются, чтобы не сцепиться.`, 'dramatic', 'social');
        relA.trust = Math.max(-100, relA.trust - 2);
      }
    }
  }
}

/**
 * Один тик симуляции на пропущенные часы: случайные «семейные» и социальные заметки,
 * лёгкое углубление дружбы/вражды между NPC в одной локации.
 */
export function runGenerationsTick(
  npcs: NPC[],
  hours: number,
  worldLog: WorldLogEntry[]
): void {
  const h = Math.min(168, Math.max(1, hours));
  const intensity = Math.min(1, h / 24);

  const byLoc = new Map<string, NPC[]>();
  for (const n of npcs) {
    if (n.status !== 'alive') continue;
    const list = byLoc.get(n.location) || [];
    list.push(n);
    byLoc.set(n.location, list);
  }

  for (const [, group] of byLoc) {
    applyCoLocatedSocialDrift(group, hours, worldLog);
  }

  // Редкое «рождение» как лор-событие (без отдельной сущности ребёнка в коде)
  if (rng() < 0.04 * intensity) {
    const alive = npcs.filter((n) => n.status === 'alive');
    const parent = alive[Math.floor(rng() * alive.length)];
    if (parent) {
      pushWorldLog(
        worldLog,
        `В ${parent.location} говорят о новом ребёнке в семье, связанной с ${parent.name}.`,
        'info',
        'social',
      );
    }
  }
}

/** При смерти NPC часть вражды к игроку переносится на «наследника» (упрощённо — ближайший по связи) — вызов из будущей системы смерти */
export function inheritGrudgeOnDeath(dead: NPC, others: NPC[], _playerId: string): void {
  const rel = dead.playerRelationship;
  if (rel.trust > -30) return;

  let heir: NPC | null = null;
  let best = -Infinity;
  for (const n of others) {
    if (n.id === dead.id || n.status !== 'alive') continue;
    const r = n.relationships.get(dead.id);
    if (!r) continue;
    const score = r.affection + r.trust;
    if (score > best) {
      best = score;
      heir = n;
    }
  }
  if (!heir) return;

  const delta = Math.round((rel.trust / 100) * 25);
  heir.playerRelationship.trust = Math.max(-100, heir.playerRelationship.trust + delta);
}
