import { describe, expect, it } from 'vitest';
import { factionTagsForGossipNpc } from '@/domain/social/gossipFactionTags';

describe('factionTagsForGossipNpc', () => {
  it('maps professions and titles to faction tags', () => {
    expect(factionTagsForGossipNpc({ professionKey: 'rogue' })).toEqual(['thieves_guild']);
    expect(factionTagsForGossipNpc({ professionKey: 'thief' })).toEqual(['thieves_guild']);
    expect(factionTagsForGossipNpc({ title: 'The Rogue' })).toEqual(['thieves_guild']);

    expect(factionTagsForGossipNpc({ professionKey: 'priest' })).toEqual(['church_order']);
    expect(factionTagsForGossipNpc({ professionKey: 'paladin' })).toEqual(['church_order']);

    expect(factionTagsForGossipNpc({ professionKey: 'alchemist' })).toEqual(['academy']);
    expect(factionTagsForGossipNpc({ professionKey: 'sorcerer' })).toEqual(['academy']);

    expect(factionTagsForGossipNpc({ professionKey: 'noble' })).toEqual(['guild_merchants']);

    expect(factionTagsForGossipNpc({ professionKey: 'warrior' })).toEqual([]);
  });
});
