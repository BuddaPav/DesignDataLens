/**
 * Отображение портрета NPC: разрешение URL из поля `avatar` и выбор иконки статуса HUD.
 */
import type { NPC } from '@/types/game';
import type { RelationshipType } from '@/types/game';
import { chronosGraphicsUrl, chronosPlaceholderGlyphUrl } from '@/domain/assets/chronosGraphicsRegistry';

export type NpcHudStatusKind = 'dead' | 'hostile' | 'stressed' | 'friendly';

/** Разрешённые префиксы публичных ассетов Chronos (без «..», без произвольных схем). */
const ALLOWED_RELATIVE_AVATAR_PREFIXES = ['npc/', 'ui/', 'atlas/', 'generated/', 'chronos_'] as const;

function isAllowedRelativeAvatarPath(s: string): boolean {
  if (!s || s.includes('..') || s.includes('\\')) return false;
  if (s.startsWith('/') || s.startsWith('http')) return false;
  if (s.includes(':')) return false;
  return ALLOWED_RELATIVE_AVATAR_PREFIXES.some((p) => s.startsWith(p));
}

export function resolveNpcAvatarImgSrc(npc: Pick<NPC, 'avatar'>): string {
  const a = npc.avatar?.trim();
  if (!a) return chronosPlaceholderGlyphUrl();
  if (a.startsWith('http://') || a.startsWith('https://')) return a;
  const base = import.meta.env.BASE_URL || '/';
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  if (a.startsWith('/')) return `${normalized}${a}`;
  if (isAllowedRelativeAvatarPath(a)) return chronosGraphicsUrl(a);
  return chronosPlaceholderGlyphUrl();
}

export function npcHudStatusKind(npc: NPC): NpcHudStatusKind {
  if (npc.status === 'dead') return 'dead';
  if (npc.mentalState.stress > 78) return 'stressed';
  const pr = npc.playerRelationship;
  if (pr.trust < -28 || pr.type === 'enemy' || pr.type === 'rival') return 'hostile';
  return 'friendly';
}

export function npcStatusIconUrl(kind: NpcHudStatusKind): string {
  const map: Record<NpcHudStatusKind, string> = {
    dead: 'npc/npc_status_dead.png',
    hostile: 'npc/npc_status_hostile.png',
    stressed: 'npc/npc_status_stressed.png',
    friendly: 'npc/npc_status_friendly.png',
  };
  return chronosGraphicsUrl(map[kind]);
}

/** Ключи i18n для подсказки HUD-статуса (Kenney-иконка у портрета). */
export const NPC_STATUS_I18N_KEY = {
  dead: 'game.npc_status_dead',
  stressed: 'game.npc_status_stressed',
  hostile: 'game.npc_status_hostile',
  friendly: 'game.npc_status_friendly',
} as const satisfies Record<NpcHudStatusKind, string>;

/** Ключи i18n для типа отношений */
export const RELATIONSHIP_I18N_KEY = {
  enemy: 'game.rel_enemy',
  rival: 'game.rel_rival',
  stranger: 'game.rel_stranger',
  acquaintance: 'game.rel_acquaintance',
  friend: 'game.rel_friend',
  close_friend: 'game.rel_close_friend',
  lover: 'game.rel_lover',
  family: 'game.rel_family',
} as const satisfies Record<RelationshipType, string>;
