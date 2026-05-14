// Цвета обводки маркера NPC по Art Bible (Kimi): нейтрал / дружба / вражда / стресс / мёртв.
import type { NPC } from '@/types/game';

export function npcMarkerStrokeColor(npc: NPC): string {
  if (npc.status === 'dead') return '#374151';
  const { trust, affection } = npc.playerRelationship;
  const { stress, trauma } = npc.mentalState;
  if (trust < -40 || affection < -50) return '#FF6B6B';
  if (affection > 50 || trust > 40) return '#4CAF50';
  if (stress > 80 || trauma > 70) return '#FF9800';
  return '#9CA3AF';
}

export function npcMarkerGlowRGBA(npc: NPC): string {
  const stroke = npcMarkerStrokeColor(npc);
  if (stroke === '#4CAF50') return 'rgba(76,175,80,0.35)';
  if (stroke === '#FF6B6B') return 'rgba(255,107,107,0.35)';
  if (stroke === '#FF9800') return 'rgba(255,152,0,0.3)';
  if (stroke === '#374151') return 'rgba(55,65,81,0.25)';
  return 'rgba(156,163,175,0.2)';
}
