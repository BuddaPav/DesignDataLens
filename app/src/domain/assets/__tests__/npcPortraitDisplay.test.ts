import { describe, expect, it } from 'vitest';
import {
  NPC_STATUS_I18N_KEY,
  npcHudStatusKind,
  npcStatusIconUrl,
  resolveNpcAvatarImgSrc,
} from '@/domain/assets/npcPortraitDisplay';
import type { NPC } from '@/types/game';
import { chronosPlaceholderGlyphUrl } from '@/domain/assets/chronosGraphicsRegistry';

function minimalNpc(partial: Partial<NPC>): NPC {
  const base = {
    id: 'x',
    name: 'X',
    title: '',
    age: 30,
    profession: '',
    avatar: '',
    appearance: '',
    personality: {} as NPC['personality'],
    knowledgeBase: {} as NPC['knowledgeBase'],
    mentalState: { stress: 0, happiness: 50, trauma: 0 },
    status: 'alive' as const,
    location: 'l',
    level: 1,
    attributes: {} as NPC['attributes'],
    memories: [],
    relationships: new Map(),
    playerRelationship: {
      type: 'stranger',
      trust: 0,
      affection: 0,
      respect: 0,
      fear: 0,
      history: [],
    },
    schedule: {} as NPC['schedule'],
    goals: [],
    secrets: [],
    backstory: '',
    roleInStory: '',
  };
  return { ...base, ...partial } as NPC;
}

describe('npcPortraitDisplay', () => {
  it('resolveNpcAvatarImgSrc falls back to placeholder when empty', () => {
    expect(resolveNpcAvatarImgSrc({ avatar: '' })).toBe(chronosPlaceholderGlyphUrl());
  });

  it('resolveNpcAvatarImgSrc passes through https URL', () => {
    expect(resolveNpcAvatarImgSrc({ avatar: 'https://cdn.example.com/p.png' })).toBe(
      'https://cdn.example.com/p.png',
    );
  });

  it('resolveNpcAvatarImgSrc maps allowed chronos-relative asset path', () => {
    const u = resolveNpcAvatarImgSrc({ avatar: 'npc/npc_portrait_frame_128.png' });
    expect(u).toContain('npc/npc_portrait_frame_128.png');
    expect(u).toContain('assets/chronos-ai-chronicles/');
  });

  it('resolveNpcAvatarImgSrc rejects traversal and unknown prefixes', () => {
    const ph = chronosPlaceholderGlyphUrl();
    expect(resolveNpcAvatarImgSrc({ avatar: 'npc/../evil.png' })).toBe(ph);
    expect(resolveNpcAvatarImgSrc({ avatar: 'evil/foo.png' })).toBe(ph);
  });

  it('npcHudStatusKind detects dead', () => {
    const n = minimalNpc({ status: 'dead' });
    expect(npcHudStatusKind(n)).toBe('dead');
  });

  it('npcHudStatusKind prefers stressed over relationship when stress high', () => {
    const n = minimalNpc({
      status: 'alive',
      mentalState: { stress: 80, happiness: 50, trauma: 0 },
      playerRelationship: {
        type: 'enemy',
        trust: -50,
        affection: 0,
        respect: 0,
        fear: 0,
        history: [],
      },
    });
    expect(npcHudStatusKind(n)).toBe('stressed');
  });

  it('npcHudStatusKind hostile from low trust', () => {
    const n = minimalNpc({
      mentalState: { stress: 10, happiness: 50, trauma: 0 },
      playerRelationship: {
        type: 'stranger',
        trust: -40,
        affection: 0,
        respect: 0,
        fear: 0,
        history: [],
      },
    });
    expect(npcHudStatusKind(n)).toBe('hostile');
  });

  it('npcHudStatusKind hostile from enemy type', () => {
    const n = minimalNpc({
      mentalState: { stress: 0, happiness: 50, trauma: 0 },
      playerRelationship: {
        type: 'enemy',
        trust: 0,
        affection: 0,
        respect: 0,
        fear: 0,
        history: [],
      },
    });
    expect(npcHudStatusKind(n)).toBe('hostile');
  });

  it('npcHudStatusKind hostile from rival type', () => {
    const n = minimalNpc({
      mentalState: { stress: 0, happiness: 50, trauma: 0 },
      playerRelationship: {
        type: 'rival',
        trust: 20,
        affection: 0,
        respect: 0,
        fear: 0,
        history: [],
      },
    });
    expect(npcHudStatusKind(n)).toBe('hostile');
  });

  it('npcStatusIconUrl maps every HUD kind', () => {
    const kinds = ['dead', 'hostile', 'stressed', 'friendly'] as const;
    for (const k of kinds) {
      expect(npcStatusIconUrl(k)).toContain(`npc_status_${k}.png`);
    }
  });

  it('NPC_STATUS_I18N_KEY covers every HUD kind', () => {
    const kinds = ['dead', 'hostile', 'stressed', 'friendly'] as const;
    for (const k of kinds) {
      expect(NPC_STATUS_I18N_KEY[k]).toMatch(/^game\.npc_status_/);
    }
  });
});
