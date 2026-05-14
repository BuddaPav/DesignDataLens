/**
 * Теги фракций для слухов (связь с `factionReputation` и `ActiveRumor.factionTags`).
 */

export function factionTagsForGossipNpc(npc: {
  professionKey?: string;
  title?: string;
}): string[] {
  const pk = npc.professionKey ?? '';
  const title = npc.title?.toLowerCase() ?? '';
  if (pk === 'thief' || pk === 'rogue' || title.includes('rogue')) return ['thieves_guild'];
  if (pk === 'priest' || pk === 'paladin') return ['church_order'];
  if (pk === 'alchemist' || pk === 'sorcerer') return ['academy'];
  if (pk === 'noble') return ['guild_merchants'];
  return [];
}
