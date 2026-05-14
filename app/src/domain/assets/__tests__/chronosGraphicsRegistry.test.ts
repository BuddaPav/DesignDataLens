import { describe, expect, it } from 'vitest';
import {
  chronosGeneratedManifestUrl,
  chronosGraphicsUrl,
  chronosPlaceholderGlyphUrl,
  chronosSplashDefaultUrl,
  npcPortraitFrameUrl,
  uiIconCloseUrl,
  uiIconQuestUrl,
  CHRONOS_GRAPHICS_REGISTRY,
} from '@/domain/assets/chronosGraphicsRegistry';

describe('chronosGraphicsRegistry', () => {
  it('builds URLs under graphics root', () => {
    const u = chronosGraphicsUrl('ui/chronos_glyph_placeholder.svg');
    expect(u).toContain('assets/chronos-ai-chronicles/');
    expect(u).toContain('chronos_glyph_placeholder.svg');
  });

  it('exposes splash and manifest helpers', () => {
    expect(chronosSplashDefaultUrl()).toContain('chronos_splash_art.png');
    expect(chronosGeneratedManifestUrl()).toContain('generated/manifest.json');
    expect(chronosPlaceholderGlyphUrl()).toContain('chronos_glyph_placeholder.svg');
  });

  it('registry lists splash and placeholder', () => {
    const ids = CHRONOS_GRAPHICS_REGISTRY.map((e) => e.id);
    expect(ids).toContain('splash_default');
    expect(ids).toContain('ui_placeholder_glyph');
  });

  it('HUD helper URLs point at npc/ui PNG paths', () => {
    expect(npcPortraitFrameUrl()).toContain('npc_portrait_frame_128.png');
    expect(uiIconQuestUrl()).toContain('ui_icon_quest_24.png');
    expect(uiIconCloseUrl()).toContain('ui_icon_close_24.png');
  });
});
