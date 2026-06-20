---
tags: [knowledge, assets]
type: assets-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# Assets Encyclopedia

## 3D Models

| Category | Format | Source |
|----------|--------|--------|
| Characters | .glb, .gltf | Kenney / Custom |
| Props | .glb | Kenney |
| Tiles | .glb | Custom |
| Effects | .glb + shader | Custom |

## Textures

| Type | Format | Size |
|------|--------|------|
| Sprites | PNG | 16x16 - 64x64 |
| Tiles | PNG | 32x32 |
| UI | PNG | various |
| Skybox | HDR | cubemap |

## Audio

| Type | Format | Notes |
|------|--------|-------|
| Music | OGG, MP3 | loopable |
| SFX | OGG | short |
| Voice | OGG | optional |
| Ambient | OGG | loopable |

## Asset Pipeline

```
Source > Process > Optimized > Game
   v         v          v
 Kenney   atlas gen   render
```

## Naming Convention

- `{category}_{name}_{size}.ext`
- `npc_human_merchant_32.png`
- `ui_icon_sword_24.png`
- `world_tile_grass_32.png`


## Atlas Strategy

- World: 1024x1024 (sprites)
- UI: 512x512 (icons)
- NPC: 512x512 (portraits)

## Optimization

| Technique | Savings |
|-----------|----------|
| Texture atlas | -40% draw calls |
| Instancing | -80% geometry |
| LOD | +30% FPS distant |
| Frustum cull | +20% FPS |
