/**
 * GPU-3D слой (Three.js) открытого мира: процедурный рельеф (те же elevation/moisture, что и в worldTiles),
 * плавающий origin для стабильности float у больших координат, день/ночь, туман, NPC, WASD/клик.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars, Cloud, OrbitControls, Environment, Stats } from '@react-three/drei';
import { WorldPostFX } from '@/components/game/world/WorldPostFX';
import { ChronolithAnchor } from '@/components/game/world/ChronolithAnchor';
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Component,
  type ErrorInfo,
  type MutableRefObject,
  type ReactNode,
  type RefObject
} from 'react';
import * as THREE from 'three';
import type { NPC, Weather, WorldEra } from '@/types/game';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';
import { loadChronosGameSettings } from '@/lib/chronosGameSettings';
import { usePlayerControls } from '@/hooks/usePlayerControls';
import {
  biomeAt,
  elevationAt,
  moistureAt,
  npcWorldTile,
  tileHash01
} from '@/engine/worldTiles';
import { npcMarkerStrokeColor } from '@/engine/npcMarkerStyle';
import { soundManager } from '@/engine/SoundManager';
import { recordR3fFrameTick } from '@/debug/chronosTelemetry';
import { useChronosPowerSavePaused } from '@/hooks/useChronosPowerSave';
import {
  createAlienTreeGeometry,
  createRockClusterGeometry,
  createCrystalClusterGeometry,
  createGrassBillboardGeometry,
  createMushroomGeometry,
  createRuinPillarGeometry,
  createMesaGeometry,
  createTechObeliskGeometry,
  createHabPodGeometry,
  createFloatingShardGeometry
} from '@/components/game/world/proceduralGeometries';
import { SIMPLEX3D_GLSL } from '@/rendering/simplex3d.glsl';
import { WaterSurface } from '@/rendering/WaterSurface';
import { FloatingIslands } from '@/rendering/FloatingIslands';
import { ChronosEnvironment } from '@/rendering/ChronosEnvironment';
import { SunAnchor, type SunAnchorState } from '@/rendering/SunAnchor';
import { LightningFlash } from '@/rendering/LightningFlash';
import type { NavPing } from '@/lib/navigationStorage';
import { Css2DWorldOverlay } from '@/ui/spatial/Css2DWorldOverlay';
import { NpcCss2DLabels } from '@/ui/spatial/NpcCss2DLabels';
import type { NpcSpatialDialogue } from '@/ui/spatial/NpcCss2DLabels';
import { HorizonHeroLandmarks } from '@/world/HorizonHeroLandmarks';
import { ResourcePickups } from '@/world/ResourcePickups';
import { WanderingCritters } from '@/entities/WanderingCritters';
import { MassGeneratedProps } from '@/components/game/world/MassGeneratedProps';
import { OptionalLocalGlb } from '@/rendering/OptionalLocalGlb';
import { chronosMassModelLodSet } from '@/domain/assets/chronosMassModelCatalog';

const PLANE_TILES = 96;
const SEG = 256;
const HEIGHT_SCALE = 16;
const MOVE_SPEED = 12; // Increased from 9 for better responsiveness
const MAX_NPC_MESH = 72;
const MAX_FLOATING = 48;

const MAX_BY_KIND = {
  tree: 340,
  rock: 300,
  crystal: 110,
  grass: 960,
  mushroom: 72,
  pillar: 36,
  mesa: 18,
  tech: 52,
  pod: 40,
  neon: 480
} as const;

type ScatterKind = keyof typeof MAX_BY_KIND;

export type SpatialNpcLine = { npcId: string; speakerName: string; text: string };

export type { WorldGraphicsTier };

export interface WorldScene3DProps {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  onMove: (d: { dTileX: number; dTileY: number }) => void;
  timeHour: number;
  weather: Weather;
  npcs: NPC[];
  onNpcClick: (npcId: string) => void;
  /** Эпоха мира — палитра, декор и «настроение» сцены (в т.ч. sci-fi). */
  worldEra?: WorldEra;
  /** Реплики текущей сцены над NPC в мировом пространстве (CSS2D). */
  spatialNpcLines?: SpatialNpcLine[];
  /** Временные пинги на тайлах (кольца в 3D). */
  worldPings?: NavPing[];
  /** Качество рендера (из настроек). По умолчанию balanced. */
  graphicsTier?: WorldGraphicsTier;
}

function isWeakGpuProfile(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.hardwareConcurrency !== 'number') return false;
  return navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
}

function shadowMapSizeForTier(graphicsTier: WorldGraphicsTier, weakGpu: boolean): number {
  if (weakGpu) return 512;
  if (graphicsTier === 'high') return 2048;
  if (graphicsTier === 'low') return 512;
  return 1024;
}

function strokeToColor(hex: string): THREE.Color {
  const c = new THREE.Color(hex.startsWith('#') ? hex : `#${hex}`);
  return c;
}

function buildHeightTexture(
  originX: number,
  originY: number,
  worldSeed: number,
  size: number
): THREE.DataTexture {
  const dim = size + 1;
  const data = new Uint8Array(dim * dim * 4);
  let i = 0;
  for (let j = 0; j < dim; j++) {
    for (let x = 0; x < dim; x++) {
      const tx = originX + x;
      const ty = originY + j;
      const e = elevationAt(tx, ty, worldSeed);
      const m = moistureAt(tx, ty, worldSeed);
      data[i++] = Math.min(255, Math.max(0, Math.floor(e * 255)));
      data[i++] = Math.min(255, Math.max(0, Math.floor(m * 255)));
      data[i++] = 0;
      data[i++] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, dim, dim, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.generateMipmaps = true;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const terrainVert = /* glsl */ `
${SIMPLEX3D_GLSL}
varying vec2 vUv;
varying vec3 vWorld;
uniform sampler2D uHeight;
uniform float uDisp;
uniform float uTime;
uniform vec3 uCameraPos;
void main() {
  vUv = uv;
  float e = texture2D(uHeight, uv).r;
  vec3 pos = position;
  pos.y = e * uDisp;
  vec4 w0 = modelMatrix * vec4(pos, 1.0);
  float n1 = snoise(w0.xyz * 0.038 + uTime * 0.06) * 2.8;
  float n2 = snoise(w0.xyz * 0.092 + uTime * 0.04) * 1.35;
  float n3 = snoise(w0.xyz * 0.18 + uTime * 0.03) * 0.65;
  pos.y += n1 + n2 + n3;
  vec4 w = modelMatrix * vec4(pos, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const terrainFrag = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
uniform sampler2D uHeight;
uniform vec3 uSun;
uniform vec3 uFogCol;
uniform float uFogNear;
uniform float uFogFar;
uniform float uDay;
uniform float uWaterShift;
uniform int uSeed;
uniform float uEra;
uniform float uDisp;
uniform float uWet;
uniform vec3 uCameraPos;

float hash01(ivec2 ij) {
  ivec2 p = ij * ivec2(374761393, 668265263) + ivec2(uSeed * 97, uSeed * 131);
  uint n = uint(p.x ^ p.y);
  n = n * 2246822519u;
  n ^= n >> 13;
  n *= 3266489917u;
  n ^= n >> 16;
  return float(n & 65535u) / 65535.0;
}

void main() {
  vec3 vdir = normalize(uCameraPos - vWorld);
  vec2 puv = vUv;
  for (int i = 0; i < 5; i++) {
    float h = texture2D(uHeight, puv).r;
    puv += vdir.xz * h * 0.0018 * (5.0 - float(i));
  }
  vec4 samp = texture2D(uHeight, puv);
  float e = samp.r;
  float m = samp.g;
  float ruins = hash01(ivec2(int(floor(vUv.x * 96.0) / 80.0), int(floor(vUv.y * 96.0) / 80.0))) > 0.985 ? 1.0 : 0.0;

  vec3 albedo;
  if (e < 0.28) {
    float w = sin(vWorld.x * 0.8 + uWaterShift) * 0.5 + 0.5;
    albedo = mix(vec3(0.04, 0.09, 0.18), vec3(0.08, 0.22, 0.32), w * 0.35 + e * 0.65);
  } else if (e < 0.34) {
    albedo = mix(vec3(0.1, 0.28, 0.35), vec3(0.15, 0.38, 0.45), m);
  } else if (e < 0.38) {
    albedo = vec3(0.72, 0.65, 0.52);
  } else if (ruins > 0.5 && e > 0.42 && e < 0.62) {
    albedo = mix(vec3(0.18, 0.16, 0.22), vec3(0.35, 0.32, 0.42), e);
  } else if (e > 0.72 && m < 0.35) {
    albedo = vec3(0.88, 0.92, 0.98);
  } else if (e > 0.65) {
    albedo = m > 0.45 ? vec3(0.9, 0.93, 1.0) : vec3(0.38, 0.4, 0.44);
  } else if (e > 0.52) {
    albedo = mix(vec3(0.32, 0.38, 0.28), vec3(0.48, 0.55, 0.42), m);
  } else if (m > 0.55 && e < 0.58) {
    albedo = mix(vec3(0.06, 0.18, 0.11), vec3(0.12, 0.32, 0.2), e);
  } else if (m < 0.28 && e > 0.4 && e < 0.55) {
    albedo = vec3(0.78, 0.65, 0.38);
  } else {
    albedo = mix(vec3(0.18, 0.38, 0.2), vec3(0.28, 0.52, 0.3), m * 0.5 + 0.25);
  }

  vec2 px = dFdx(puv);
  vec2 py = dFdy(puv);
  float ex = texture2D(uHeight, puv + px).r - texture2D(uHeight, puv - px).r;
  float ey = texture2D(uHeight, puv + py).r - texture2D(uHeight, puv - py).r;
  vec3 n = normalize(vec3(-ex * uDisp * 120.0, 1.0, -ey * uDisp * 120.0));

  float ndl = max(0.15, dot(n, normalize(uSun)));
  float wetGloss = mix(1.0, 1.55, uWet);
  vec3 lit = albedo * (0.22 + 0.78 * ndl * uDay) * wetGloss;
  if (uEra > 0.65) {
    lit = mix(lit, lit * vec3(0.72, 0.95, 1.22), 0.32);
    lit += vec3(0.008, 0.02, 0.045) * (uEra - 0.65);
  } else if (uEra > 0.28) {
    lit = mix(lit, lit * vec3(1.02, 1.03, 1.08), 0.14);
  }
  float fogF = smoothstep(uFogNear, uFogFar, length(vWorld.xz)) * 0.38;
  vec3 outC = mix(lit, uFogCol, fogF);
  gl_FragColor = vec4(outC, 1.0);
}
`;

function eraShaderValue(era: WorldEra | undefined): number {
  if (era === 'future') return 1;
  if (era === 'modern') return 0.38;
  return 0;
}

function TerrainPlane({
  worldSeed,
  playerTileX,
  playerTileY,
  timeHour,
  weather,
  worldEra
}: {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  timeHour: number;
  weather: Weather;
  worldEra?: WorldEra;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();
  const originX = Math.floor(playerTileX) - PLANE_TILES / 2;
  const originY = Math.floor(playerTileY) - PLANE_TILES / 2;

  const tex = useMemo(
    () => buildHeightTexture(originX, originY, worldSeed, PLANE_TILES),
    [originX, originY, worldSeed]
  );

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  const envRef = useRef({ timeHour, weather, worldEra });
  envRef.current = { timeHour, weather, worldEra };

  const waterPhase = useRef(0);
  const timeAcc = useRef(0);
  useFrame((_, dt) => {
    waterPhase.current += dt * 1.1;
    timeAcc.current += dt;
    const m = matRef.current;
    if (!m) return;
    const { timeHour: th, weather: wx, worldEra: we } = envRef.current;
    m.uniforms.uTime.value = timeAcc.current;
    m.uniforms.uCameraPos.value.copy(camera.position);
    m.uniforms.uWet.value = wx === 'rainy' || wx === 'stormy' ? 1.0 : 0.0;
    m.uniforms.uEra.value = eraShaderValue(we);
    const rad = ((th - 6) / 24) * Math.PI * 2;
    const h = Math.max(0.08, Math.sin(rad));
    m.uniforms.uSun.value.set(
      Math.cos(rad) * 0.65,
      h,
      Math.sin(rad) * 0.45 + 0.2
    ).normalize();
    let day = 1;
    if (th >= 6 && th <= 20) day = 1;
    else if (th < 5 || th > 21) day = 0.28;
    else if (th < 6) day = 0.28 + (th - 5) * 0.72;
    else day = 1 - (th - 20) * 0.72;
    m.uniforms.uDay.value = day;
    const fc = new THREE.Color(wx === 'snowy' ? '#c8d8e8' : '#6b7a9a');
    if (wx === 'foggy' || wx === 'mystical') fc.lerp(new THREE.Color('#8899aa'), 0.55);
    if (we === 'future') fc.lerp(new THREE.Color('#3d5588'), 0.38);
    else if (we === 'modern') fc.lerp(new THREE.Color('#7a8494'), 0.18);
    fc.lerp(new THREE.Color('#0a0f18'), 1 - day);
    m.uniforms.uFogCol.value.copy(fc);
    m.uniforms.uWaterShift.value = waterPhase.current;
    if (wx === 'foggy' || wx === 'mystical') {
      m.uniforms.uFogNear.value = 8;
      m.uniforms.uFogFar.value = 55;
    } else if (wx === 'snowy') {
      m.uniforms.uFogNear.value = 18;
      m.uniforms.uFogFar.value = 95;
    } else {
      m.uniforms.uFogNear.value = 22;
      m.uniforms.uFogFar.value = 120;
    }
  });

  const uniforms = useMemo(
    () => ({
      uHeight: { value: tex },
      uDisp: { value: HEIGHT_SCALE },
      uSun: { value: new THREE.Vector3(0.4, 0.85, 0.35) },
      uFogCol: { value: new THREE.Color(0x6b7a9a) },
      uFogNear: { value: 22 },
      uFogFar: { value: 120 },
      uDay: { value: 1 },
      uWaterShift: { value: 0 },
      uSeed: { value: worldSeed },
      uEra: { value: eraShaderValue(worldEra) },
      uTime: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
      uWet: { value: 0 }
    }),
    [tex, worldSeed, worldEra]
  );

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[originX + PLANE_TILES / 2, 0, originY + PLANE_TILES / 2]}
      receiveShadow
    >
      <planeGeometry args={[PLANE_TILES, PLANE_TILES, SEG, SEG]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={terrainVert}
        fragmentShader={terrainFrag}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function heightAtWorld(tx: number, ty: number, seed: number): number {
  return elevationAt(tx, ty, seed) * HEIGHT_SCALE;
}

const WATER_LEVEL = 0.28 * HEIGHT_SCALE - 0.34;

type ScatterItem = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
  sc: number;
  kind: ScatterKind;
};

function mkScatterItem(
  tx: number,
  ty: number,
  y: number,
  kind: ScatterKind,
  worldSeed: number,
  salt: number
): ScatterItem {
  const ix = Math.floor(tx);
  const iy = Math.floor(ty);
  const h1 = tileHash01(ix, iy, worldSeed + salt);
  const h2 = tileHash01(ix, iy, worldSeed + salt + 17);
  const h3 = tileHash01(ix, iy, worldSeed + salt + 29);
  return {
    x: tx,
    y,
    z: ty,
    rx: (h1 - 0.5) * 0.28,
    ry: h2 * Math.PI * 2,
    rz: (h3 - 0.5) * 0.22,
    sx: 0.82 + h2 * 0.38,
    sy: 0.82 + h3 * 0.38,
    sz: 0.82 + h1 * 0.38,
    sc: 0.72 + h1 * 0.48,
    kind
  };
}

function gatherScatterBuckets(
  originX: number,
  originY: number,
  worldSeed: number,
  worldEra: WorldEra | undefined,
  graphicsTier: WorldGraphicsTier
): Record<ScatterKind, ScatterItem[]> {
  const buckets = {
    tree: [] as ScatterItem[],
    rock: [] as ScatterItem[],
    crystal: [] as ScatterItem[],
    grass: [] as ScatterItem[],
    mushroom: [] as ScatterItem[],
    pillar: [] as ScatterItem[],
    mesa: [] as ScatterItem[],
    tech: [] as ScatterItem[],
    pod: [] as ScatterItem[],
    neon: [] as ScatterItem[]
  };

  const push = (kind: ScatterKind, item: ScatterItem) => {
    const mul = graphicsTier === 'high' ? 1.15 : graphicsTier === 'low' ? 0.55 : 1;
    const max = Math.max(1, Math.floor(MAX_BY_KIND[kind] * mul));
    if (buckets[kind].length >= max) return;
    buckets[kind].push(item);
  };

  const step = graphicsTier === 'low' ? 3 : 2;
  const center = PLANE_TILES / 2;
  const farR = graphicsTier === 'low' ? 26 : graphicsTier === 'high' ? 44 : 36;
  const farR2 = farR * farR;
  for (let j = 0; j < PLANE_TILES; j += step) {
    for (let i = 0; i < PLANE_TILES; i += step) {
      const tx = originX + i + 0.5;
      const ty = originY + j + 0.5;
      const ix = Math.floor(tx);
      const iy = Math.floor(ty);
      const biome = biomeAt(ix, iy, worldSeed);
      const h01 = tileHash01(ix, iy, worldSeed + 4001);
      const moist = moistureAt(ix, iy, worldSeed);
      const y = elevationAt(tx, ty, worldSeed) * HEIGHT_SCALE;
      const dx = i - center;
      const dz = j - center;
      const d2 = dx * dx + dz * dz;
      const isFar = d2 > farR2;
      const ultraFarR = farR * 1.58;
      const isUltraFar = d2 > ultraFarR * ultraFarR;

      if (worldEra === 'future') {
        if (biome === 'deep_water' || biome === 'shallow') continue;
        if (!isFar || h01 > 0.9) {
          if (h01 > 0.84) push('tech', mkScatterItem(tx, ty, y + 0.15, 'tech', worldSeed, 501));
          if (h01 > 0.9) push('crystal', mkScatterItem(tx, ty, y + 0.35, 'crystal', worldSeed, 502));
          if (!isFar && !isUltraFar && h01 > 0.52 && h01 < 0.78) {
            push('neon', mkScatterItem(tx, ty, y + 0.08, 'neon', worldSeed, 503));
          }
        }
        continue;
      }

      if (worldEra === 'modern') {
        if (biome !== 'deep_water' && biome !== 'shallow' && biome !== 'beach') {
          if (!isUltraFar && (biome === 'plains' || biome === 'hills') && h01 > 0.89) {
            push('pod', mkScatterItem(tx, ty, y, 'pod', worldSeed, 601));
          }
          if ((biome === 'mountain' || biome === 'ruins') && h01 > 0.93) {
            push('crystal', mkScatterItem(tx, ty, y + 0.25, 'crystal', worldSeed, 602));
          }
        }
      }

      if (biome === 'deep_water' || biome === 'shallow') continue;

      if (biome === 'beach' && h01 > 0.58) {
        if (!isFar && !isUltraFar) push('grass', mkScatterItem(tx, ty, y, 'grass', worldSeed, 701));
      }

      if (biome === 'plains' || biome === 'forest' || biome === 'hills') {
        if (h01 > 0.35 && h01 < 0.74) {
          if (!isFar && !isUltraFar) push('grass', mkScatterItem(tx, ty, y, 'grass', worldSeed, 801));
        }
      }

      if (biome === 'forest' && h01 > 0.52 && moist > 0.42) {
        if (!isFar && !isUltraFar) push('mushroom', mkScatterItem(tx, ty, y, 'mushroom', worldSeed, 802));
      }

      if (biome === 'ruins' && h01 > 0.45) {
        push('pillar', mkScatterItem(tx, ty, y, 'pillar', worldSeed, 803));
      }

      if (biome === 'desert' && h01 > 0.88) {
        const m = mkScatterItem(tx, ty, y, 'mesa', worldSeed, 804);
        m.sc *= 1.35 + h01 * 0.45;
        push('mesa', m);
      }

      if (biome === 'forest' && h01 > 0.2) {
        push('tree', mkScatterItem(tx, ty, y, 'tree', worldSeed, 805));
      } else if ((biome === 'hills' || biome === 'plains') && h01 > 0.74) {
        push('tree', mkScatterItem(tx, ty, y, 'tree', worldSeed, 806));
      }

      if ((biome === 'mountain' || biome === 'snow' || biome === 'ruins') && h01 > 0.5) {
        push('rock', mkScatterItem(tx, ty, y, 'rock', worldSeed, 807));
      } else if (biome === 'desert' && h01 > 0.55) {
        push('rock', mkScatterItem(tx, ty, y, 'rock', worldSeed, 808));
      }

      if ((biome === 'mountain' || biome === 'ruins') && h01 > 0.94) {
        push('crystal', mkScatterItem(tx, ty, y + 0.2, 'crystal', worldSeed, 809));
      }
    }
  }

  return buckets;
}

function ScatterInstanced({
  items,
  yLift,
  geometry,
  material,
  maxCount
}: {
  items: ScatterItem[];
  yLift: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  maxCount: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || items.length === 0) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      dummy.position.set(it.x, it.y + yLift, it.z);
      dummy.rotation.set(it.rx, it.ry, it.rz);
      dummy.scale.set(it.sx * it.sc, it.sy * it.sc, it.sz * it.sc);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = items.length;
  }, [items, yLift, dummy]);

  if (items.length === 0) return null;

  return (
    <instancedMesh ref={ref} args={[geometry, material, maxCount]} castShadow receiveShadow />
  );
}

function BiomeScatter({
  worldSeed,
  playerTileX,
  playerTileY,
  worldEra,
  graphicsTier
}: {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  worldEra?: WorldEra;
  graphicsTier: WorldGraphicsTier;
}) {
  const { scene } = useThree();
  const originX = Math.floor(playerTileX) - PLANE_TILES / 2;
  const originY = Math.floor(playerTileY) - PLANE_TILES / 2;
  const buckets = useMemo(
    () => gatherScatterBuckets(originX, originY, worldSeed, worldEra, graphicsTier),
    [originX, originY, worldSeed, worldEra, graphicsTier]
  );

  const geo = useMemo(
    () => ({
      tree: createAlienTreeGeometry(),
      rock: createRockClusterGeometry(),
      crystal: createCrystalClusterGeometry(),
      grass: createGrassBillboardGeometry(),
      mushroom: createMushroomGeometry(),
      pillar: createRuinPillarGeometry(),
      mesa: createMesaGeometry(),
      tech: createTechObeliskGeometry(),
      pod: createHabPodGeometry(),
      neon: createGrassBillboardGeometry()
    }),
    []
  );

  const mat = useMemo(
    () => ({
      tree: new THREE.MeshStandardMaterial({
        color: '#1a5c3a',
        roughness: 0.82,
        metalness: 0.06
      }),
      rock: new THREE.MeshStandardMaterial({
        color: '#5a5f6a',
        roughness: 0.88,
        metalness: 0.14
      }),
      crystal: new THREE.MeshStandardMaterial({
        color: '#8b5cf6',
        emissive: '#4c1d95',
        emissiveIntensity: 0.55,
        roughness: 0.22,
        metalness: 0.38
      }),
      grass: new THREE.MeshStandardMaterial({
        color: '#2d6a45',
        roughness: 0.78,
        metalness: 0.02
      }),
      mushroom: new THREE.MeshStandardMaterial({
        color: '#c94b6a',
        emissive: '#3b0764',
        emissiveIntensity: 0.08,
        roughness: 0.65,
        metalness: 0.05
      }),
      pillar: new THREE.MeshStandardMaterial({
        color: '#4a4658',
        roughness: 0.92,
        metalness: 0.04
      }),
      mesa: new THREE.MeshStandardMaterial({
        color: '#c9a86e',
        roughness: 0.9,
        metalness: 0.02
      }),
      tech: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        emissive: '#38bdf8',
        emissiveIntensity: 0.35,
        roughness: 0.28,
        metalness: 0.62
      }),
      pod: new THREE.MeshStandardMaterial({
        color: '#64748b',
        emissive: '#0ea5e9',
        emissiveIntensity: 0.12,
        roughness: 0.42,
        metalness: 0.48
      }),
      neon: new THREE.MeshStandardMaterial({
        color: '#22d3ee',
        emissive: '#06b6d4',
        emissiveIntensity: 0.85,
        roughness: 0.35,
        metalness: 0.25
      })
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(geo).forEach((g) => g.dispose());
      Object.values(mat).forEach((m) => m.dispose());
    };
  }, [geo, mat]);

  useEffect(() => {
    const env = scene.environment as THREE.Texture | null;
    if (!env || !('isTexture' in env) || !(env as THREE.Texture).isTexture) return;
    Object.values(mat).forEach((m) => {
      m.envMap = env;
      m.envMapIntensity = m.metalness > 0.38 ? 1.05 : 0.45;
    });
  }, [scene.environment, mat]);

  return (
    <group>
      <ScatterInstanced
        items={buckets.tree}
        yLift={0.02}
        geometry={geo.tree}
        material={mat.tree}
        maxCount={MAX_BY_KIND.tree}
      />
      <ScatterInstanced
        items={buckets.rock}
        yLift={0.12}
        geometry={geo.rock}
        material={mat.rock}
        maxCount={MAX_BY_KIND.rock}
      />
      <ScatterInstanced
        items={buckets.crystal}
        yLift={0.02}
        geometry={geo.crystal}
        material={mat.crystal}
        maxCount={MAX_BY_KIND.crystal}
      />
      <ScatterInstanced
        items={buckets.grass}
        yLift={0.28}
        geometry={geo.grass}
        material={mat.grass}
        maxCount={MAX_BY_KIND.grass}
      />
      <ScatterInstanced
        items={buckets.mushroom}
        yLift={0.02}
        geometry={geo.mushroom}
        material={mat.mushroom}
        maxCount={MAX_BY_KIND.mushroom}
      />
      <ScatterInstanced
        items={buckets.pillar}
        yLift={0.02}
        geometry={geo.pillar}
        material={mat.pillar}
        maxCount={MAX_BY_KIND.pillar}
      />
      <ScatterInstanced
        items={buckets.mesa}
        yLift={0.02}
        geometry={geo.mesa}
        material={mat.mesa}
        maxCount={MAX_BY_KIND.mesa}
      />
      <ScatterInstanced
        items={buckets.tech}
        yLift={0.02}
        geometry={geo.tech}
        material={mat.tech}
        maxCount={MAX_BY_KIND.tech}
      />
      <ScatterInstanced
        items={buckets.pod}
        yLift={0.02}
        geometry={geo.pod}
        material={mat.pod}
        maxCount={MAX_BY_KIND.pod}
      />
      <ScatterInstanced
        items={buckets.neon}
        yLift={0.22}
        geometry={geo.neon}
        material={mat.neon}
        maxCount={MAX_BY_KIND.neon}
      />
    </group>
  );
}

function FutureFloatingShards({
  worldSeed,
  playerTileX,
  playerTileY
}: {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
}) {
  const shardGeo = useMemo(() => createFloatingShardGeometry(), []);
  useEffect(() => {
    return () => shardGeo.dispose();
  }, [shardGeo]);

  const originX = Math.floor(playerTileX) - PLANE_TILES / 2;
  const originY = Math.floor(playerTileY) - PLANE_TILES / 2;
  const groupRef = useRef<THREE.Group>(null);
  const shards = useMemo(() => {
    const arr: { x: number; y: number; z: number; s: number; ph: number }[] = [];
    for (let k = 0; k < MAX_FLOATING; k++) {
      const lx = tileHash01(k * 5, k, worldSeed + 8801) * PLANE_TILES;
      const lz = tileHash01(k * 5 + 2, k, worldSeed + 8802) * PLANE_TILES;
      const tx = originX + lx;
      const tz = originY + lz;
      const biome = biomeAt(Math.floor(tx), Math.floor(tz), worldSeed);
      if (biome === 'deep_water' || biome === 'shallow') continue;
      const base = heightAtWorld(tx, tz, worldSeed);
      const h = tileHash01(k, worldSeed, 9103);
      arr.push({
        x: tx,
        y: base + 2.2 + h * 9,
        z: tz,
        s: 0.15 + h * 0.35,
        ph: h * Math.PI * 2
      });
    }
    return arr;
  }, [originX, originY, worldSeed]);

  useFrame((st) => {
    const g = groupRef.current;
    if (!g) return;
    const t = st.clock.elapsedTime;
    g.children.forEach((ch, i) => {
      const sh = shards[i];
      if (!sh || !ch) return;
      ch.position.y = sh.y + Math.sin(t * 0.7 + sh.ph) * 0.35;
      ch.rotation.y = t * 0.15 + sh.ph;
    });
  });

  return (
    <group ref={groupRef}>
      {shards.map((sh, i) => (
        <mesh key={i} position={[sh.x, sh.y, sh.z]} castShadow scale={sh.s}>
          <primitive object={shardGeo} attach="geometry" />
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#6d28d9"
            emissiveIntensity={0.8}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function PlanetaryRings({ era }: { era: WorldEra }) {
  const refA = useRef<THREE.Mesh>(null);
  const refB = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime * 0.018;
    if (refA.current) refA.current.rotation.y = t;
    if (refB.current) refB.current.rotation.y = -t * 0.74;
  });
  const strong = era === 'future';
  return (
    <group position={[0, 92, -72]}>
      <mesh ref={refA} rotation={[1.44, 0.48, 0.12]}>
        <torusGeometry args={[418, 3.4, 6, 280]} />
        <meshBasicMaterial
          color={strong ? '#5eead4' : '#94a3b8'}
          transparent
          opacity={strong ? 0.4 : 0.1}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {strong && (
        <mesh ref={refB} rotation={[1.4, 0.35, -0.1]}>
          <torusGeometry args={[392, 1.15, 5, 220]} />
          <meshBasicMaterial
            color="#c4b5fd"
            transparent
            opacity={0.22}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}

function DistantOrbs({ era }: { era: WorldEra }) {
  const orbs = useMemo(
    () =>
      era === 'future'
        ? [
            { x: -300, y: 108, z: -200, r: 20, c: '#bae6fd', o: 0.5 },
            { x: 340, y: 76, z: 160, r: 12, c: '#ddd6fe', o: 0.42 },
            { x: 140, y: 152, z: -340, r: 8, c: '#fef3c7', o: 0.38 }
          ]
        : era === 'modern'
          ? [{ x: -260, y: 90, z: -160, r: 14, c: '#e2e8f0', o: 0.22 }]
          : [
              { x: -240, y: 100, z: -140, r: 16, c: '#fcd34d', o: 0.18 },
              { x: 260, y: 85, z: 120, r: 10, c: '#fde68a', o: 0.14 }
            ],
    [era]
  );

  return (
    <group>
      {orbs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} renderOrder={-3}>
          <sphereGeometry args={[p.r, 16, 16]} />
          <meshBasicMaterial color={p.c} transparent opacity={p.o} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function SpaceDust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 120;
      p[i * 3 + 1] = 6 + Math.random() * 42;
      p[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    return p;
  }, [count]);
  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    pts.rotation.y += dt * 0.012;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#a5b4fc" size={0.045} transparent opacity={0.35} depthWrite={false} />
    </points>
  );
}

function npcDialogueFor(
  npcId: string,
  spatialNpcLines: SpatialNpcLine[] | undefined
): NpcSpatialDialogue | null {
  if (!spatialNpcLines?.length) return null;
  const lines = spatialNpcLines.filter((l) => l.npcId === npcId);
  if (!lines.length) return null;
  const last = lines[lines.length - 1];
  return { speakerName: last.speakerName, text: last.text };
}

function NpcFigures({
  npcs,
  playerTileX,
  playerTileY,
  worldSeed,
  worldEra,
  spatialNpcLines,
  onPick
}: {
  npcs: NPC[];
  playerTileX: number;
  playerTileY: number;
  worldSeed: number;
  worldEra?: WorldEra;
  spatialNpcLines?: SpatialNpcLine[];
  onPick: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  const sorted = useMemo(() => {
    const withD = npcs.map((n) => {
      const p = npcWorldTile(n);
      const d = Math.hypot(p.x - playerTileX, p.y - playerTileY);
      return { n, p, d };
    });
    withD.sort((a, b) => a.d - b.d);
    return withD.slice(0, MAX_NPC_MESH);
  }, [npcs, playerTileX, playerTileY]);

  const onPointerDown = useCallback(
    (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const objs: THREE.Object3D[] = [];
      if (groupRef.current) groupRef.current.traverse((ch) => {
        if ((ch as THREE.Mesh).isMesh && ch.userData.npcId) objs.push(ch);
      });
      const hits = raycaster.intersectObjects(objs, false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.npcId as string;
        soundManager.play('dialogue');
        onPick(id);
      }
    },
    [camera, gl, onPick, pointer, raycaster]
  );

  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    return () => el.removeEventListener('pointerdown', onPointerDown);
  }, [gl, onPointerDown]);

  return (
    <group ref={groupRef}>
      {sorted.map(({ n, p }) => {
        const y = heightAtWorld(p.x, p.y, worldSeed) + 0.55;
        const col = strokeToColor(npcMarkerStrokeColor(n));
        const fut = worldEra === 'future';
        const mod = worldEra === 'modern';
        return (
          <group key={n.id} position={[p.x, y, p.y]}>
            <NpcCss2DLabels npc={n} dialogueLine={npcDialogueFor(n.id, spatialNpcLines)} />
            <mesh
              userData={{ npcId: n.id }}
              castShadow
              onClick={(ev) => {
                ev.stopPropagation();
                soundManager.play('dialogue');
                onPick(n.id);
              }}
            >
              <capsuleGeometry args={[0.35, 0.85, 6, 12]} />
              <meshStandardMaterial
                color={col}
                emissive={col}
                emissiveIntensity={0.25}
                roughness={0.45}
                metalness={0.15}
              />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
              <sphereGeometry args={[0.22, 10, 10]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            {fut && (
              <>
                <mesh position={[0, 0.52, -0.26]} rotation={[0.15, 0, 0]} castShadow>
                  <boxGeometry args={[0.44, 0.32, 0.16]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.32} />
                </mesh>
                <mesh position={[0.36, 0.98, 0]} rotation={[0, 0, -0.45]} castShadow>
                  <cylinderGeometry args={[0.035, 0.045, 0.52, 6]} />
                  <meshStandardMaterial
                    color="#64748b"
                    emissive="#0ea5e9"
                    emissiveIntensity={0.45}
                    metalness={0.4}
                    roughness={0.28}
                  />
                </mesh>
              </>
            )}
            {mod && !fut && (
              <mesh position={[0, 0.48, -0.22]} castShadow>
                <boxGeometry args={[0.36, 0.28, 0.12]} />
                <meshStandardMaterial color="#334155" metalness={0.25} roughness={0.55} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function PlayerFigure({
  playerTileX,
  playerTileY,
  worldSeed,
  worldEra
}: {
  playerTileX: number;
  playerTileY: number;
  worldSeed: number;
  worldEra?: WorldEra;
}) {
  const y = heightAtWorld(playerTileX, playerTileY, worldSeed) + 0.45;
  const fut = worldEra === 'future';
  return (
    <group position={[playerTileX, y, playerTileY]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.28, 0.75, 5, 10]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#6d28d9"
          emissiveIntensity={0.35}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
      {fut && (
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.78, 28]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.55}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

function WeatherVfx({ weather }: { weather: Weather }) {
  const ref = useRef<THREE.Points>(null);
  const count = weather === 'rainy' || weather === 'stormy' ? 2200 : weather === 'snowy' ? 1600 : 0;
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = 8 + Math.random() * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
      vel[i * 3] = weather === 'snowy' ? (Math.random() - 0.5) * 0.4 : -0.2;
      vel[i * 3 + 1] = weather === 'snowy' ? -0.4 - Math.random() * 0.8 : -12 - Math.random() * 10;
      vel[i * 3 + 2] = weather === 'snowy' ? (Math.random() - 0.5) * 0.4 : -0.5;
    }
    return { positions: pos, velocities: vel };
  }, [count, weather]);

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts || count === 0) return;
    const pos = pts.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3] * dt * (weather === 'snowy' ? 3 : 1);
      pos[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      pos[i * 3 + 2] += velocities[i * 3 + 2] * dt * (weather === 'snowy' ? 3 : 1);
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3] = (Math.random() - 0.5) * 90;
        pos[i * 3 + 1] = 28 + Math.random() * 12;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
      }
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={weather === 'snowy' ? '#eef6ff' : '#88aaff'}
        size={weather === 'snowy' ? 0.12 : 0.06}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

const PING_BEACON_CAP = 3;
const PING_BEACON_MODEL_BAND = 32;

function WorldPingRings({
  worldSeed,
  pings,
  graphicsTier
}: {
  worldSeed: number;
  pings: NavPing[];
  graphicsTier: WorldGraphicsTier;
}) {
  const t = useRef(0);
  useFrame((st) => {
    t.current = st.clock.elapsedTime;
  });
  const now = Date.now();
  const active = pings.filter((p) => p.until > now).slice(0, PING_BEACON_CAP);
  const beaconMaxDist = graphicsTier === 'high' ? 72 : 52;

  return (
    <group>
      {active.map((p, i) => {
        const y = elevationAt(p.tileX + 0.5, p.tileY + 0.5, worldSeed) * HEIGHT_SCALE + 2.8;
        const groundY = elevationAt(p.tileX + 0.5, p.tileY + 0.5, worldSeed) * HEIGHT_SCALE + 0.08;
        const fade = Math.min(1, (p.until - now) / 3000);
        const h = tileHash01(p.tileX, p.tileY, worldSeed + 55009 + i);
        const lodPaths = chronosMassModelLodSet(1 + Math.floor(h * PING_BEACON_MODEL_BAND));
        return (
          <group key={`${p.tileX}_${p.tileY}_${i}_${p.until}`}>
            <mesh position={[p.tileX, y, p.tileY]} rotation={[Math.PI / 2, t.current * 0.6, 0]}>
              <torusGeometry args={[2.4, 0.14, 8, 48]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.42 * fade}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <OptionalLocalGlb
              path={lodPaths[0]}
              lodPaths={[...lodPaths]}
              position={[p.tileX + 0.5, groundY, p.tileY + 0.5]}
              rotation={[0, h * Math.PI * 2, 0]}
              scale={0.5 + h * 0.28}
              maxDistance={beaconMaxDist}
              minTier="low"
              graphicsTier={graphicsTier}
            />
          </group>
        );
      })}
    </group>
  );
}

function SceneFog({
  timeHour,
  worldEra,
  weather,
  graphicsTier
}: {
  timeHour: number;
  worldEra?: WorldEra;
  weather: Weather;
  graphicsTier: WorldGraphicsTier;
}) {
  const { scene } = useThree();
  useEffect(() => {
    const night = timeHour < 6 || timeHour > 20;
    const prev = scene.fog;
    const future = worldEra === 'future';
    const modern = worldEra === 'modern';
    const col = future
      ? night
        ? '#040612'
        : '#142238'
      : modern
        ? night
          ? '#0c1014'
          : '#6a7588'
        : night
          ? '#0a0e18'
          : '#8fa4c8';
    const base = 0.012;
    const tierMul =
      graphicsTier === 'high' ? 1.06 : graphicsTier === 'low' ? 0.88 : 1;
    const density =
      (weather === 'foggy' || weather === 'mystical' ? 1.55 : weather === 'snowy' ? 1.12 : 1.0) *
      (future ? (night ? 1.05 : 0.92) : modern ? (night ? 1.08 : 0.95) : night ? 1.12 : 0.9) *
      base *
      tierMul;
    scene.fog = new THREE.FogExp2(col, density);
    return () => {
      scene.fog = prev;
    };
  }, [scene, timeHour, worldEra, weather, graphicsTier]);
  return null;
}

type WorldContentProps = WorldScene3DProps & {
  sunRef: RefObject<THREE.Mesh | null>;
  worldAnchorRef: MutableRefObject<SunAnchorState>;
};

function WorldContent(props: WorldContentProps) {
  const {
    worldSeed,
    playerTileX,
    playerTileY,
    timeHour,
    weather,
    npcs,
    onNpcClick,
    worldEra,
    sunRef,
    worldAnchorRef,
    spatialNpcLines,
    worldPings,
    graphicsTier: graphicsTierProp
  } = props;
  const graphicsTier = graphicsTierProp ?? 'balanced';
  const weakGpu = isWeakGpuProfile();
  const shadowMapSize = shadowMapSizeForTier(graphicsTier, weakGpu);
  const era = worldEra ?? 'medieval';
  const rootRef = useRef<THREE.Group>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const waterCenter = useMemo(() => {
    const originX = Math.floor(playerTileX) - PLANE_TILES / 2;
    const originY = Math.floor(playerTileY) - PLANE_TILES / 2;
    return { cx: originX + PLANE_TILES / 2, cz: originY + PLANE_TILES / 2 };
  }, [playerTileX, playerTileY]);

  // Camera mode state: first-person (0) or third-person (1)
  const [cameraMode, setCameraMode] = useState<0 | 1>(1);
  const cameraTransitionRef = useRef({ target: 1, current: 1 });

  // Load settings from chronosGameSettings for hook initialization
  const gameSettings = useMemo(() => loadChronosGameSettings(), []);
  const initialSettings = useMemo(() => ({
    sensitivity: gameSettings.mouseSensitivity ?? 1.0,
    invertY: gameSettings.invertMouseY ?? false,
    cameraMode: (gameSettings.cameraMode === 'first' ? 'first' : 'third') as 'first' | 'third'
  }), [gameSettings]);

  // Initialize usePlayerControls hook - provides first/third person, pointer lock, mouse look
  const {
    cameraMode: hookCameraMode,
    getMovementVector
  } = usePlayerControls(initialSettings);

  // Sync camera mode between hook and local state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const newMode = hookCameraMode === 'first' ? 0 : 1;
    if (cameraMode !== newMode) {
      setCameraMode(newMode);
      cameraTransitionRef.current.target = newMode;
    }
  }, [hookCameraMode]);

  // Smooth camera transition for first/third person toggle
  useFrame((_, dt) => {
    const trans = cameraTransitionRef.current;
    if (Math.abs(trans.current - trans.target) > 0.01) {
      trans.current += (trans.target - trans.current) * Math.min(1, dt / 0.25);
    } else {
      trans.current = trans.target;
    }
  });

  useFrame((_, dt) => {
    const w = propsRef.current;
    // Use hook's movement vector instead of manual WASD parsing
    const move = getMovementVector();
    if (move.length() > 0) {
      w.onMove({ dTileX: move.x * MOVE_SPEED * dt, dTileY: -move.z * MOVE_SPEED * dt });
    }
    const py =
      heightAtWorld(w.playerTileX, w.playerTileY, w.worldSeed) + 1.2;
    if (rootRef.current) {
      rootRef.current.position.set(-w.playerTileX, -py, -w.playerTileY);
    }
    worldAnchorRef.current = {
      px: w.playerTileX,
      py: py,
      pz: w.playerTileY,
      timeHour: w.timeHour
    };
  });

  const isNight = timeHour < 6 || timeHour > 20;
  const sunVec = useMemo(() => {
    const rad = ((timeHour - 6) / 24) * Math.PI * 2;
    const y = Math.sin(rad);
    return new THREE.Vector3(Math.cos(rad) * 400, Math.max(20, y * 350), 180);
  }, [timeHour]);

  const sunDirWorld = useMemo(() => sunVec.clone().normalize(), [sunVec]);

  return (
    <>
      <group ref={rootRef}>
      <SceneFog
        timeHour={timeHour}
        worldEra={worldEra}
        weather={weather}
        graphicsTier={graphicsTier}
      />
      {cameraMode === 1 && (
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.07}
          minPolarAngle={0.38}
          maxPolarAngle={Math.PI / 2 - 0.06}
          minDistance={cameraTransitionRef.current.current < 0.5 ? 0.1 : 8}
          maxDistance={72}
          target={[0, 1.8, 0]}
        />
      )}
      <ambientLight intensity={isNight ? 0.12 : era === 'future' ? 0.22 : 0.28} />
      <directionalLight
        position={[sunVec.x * 0.002, sunVec.y * 0.002 + 40, sunVec.z * 0.002]}
        intensity={isNight ? 0.15 : era === 'future' ? 0.88 : 1.05}
        castShadow
        color={era === 'future' ? '#cfe8ff' : '#ffffff'}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-far={220}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
      />
      <hemisphereLight
        args={[
          era === 'future' ? '#9ab6ff' : '#87a8c9',
          era === 'future' ? '#0a0618' : '#1a1520',
          isNight ? 0.2 : era === 'future' ? 0.52 : 0.45
        ]}
      />
      <pointLight position={[32, 16, -24]} intensity={0.88} distance={92} decay={2} color="#22d3ee" />
      <pointLight position={[-28, 12, 30]} intensity={0.68} distance={88} decay={2} color="#e879f9" />
      <pointLight position={[6, 10, 38]} intensity={0.58} distance={76} decay={2} color="#fde68a" />

      <Suspense fallback={null}>
        <ChronosEnvironment />
        <Environment
          preset={era === 'future' ? 'night' : era === 'modern' ? 'city' : 'forest'}
          environmentIntensity={era === 'future' ? 0.55 : era === 'modern' ? 0.42 : 0.38}
          background={false}
        />
        <Sky
          distance={520000}
          sunPosition={sunVec}
          inclination={0}
          azimuth={era === 'future' ? 0.42 : 0.25}
          mieCoefficient={weather === 'foggy' ? 0.016 : era === 'future' ? 0.0024 : 0.0035}
          rayleigh={isNight ? 0.85 : era === 'future' ? 1.65 : 2.45}
        />
      </Suspense>

      {isNight && (
        <Stars
          radius={era === 'future' ? 580 : 320}
          depth={era === 'future' ? 130 : 90}
          count={
            graphicsTier === 'low'
              ? era === 'future'
                ? 4200
                : 2200
              : graphicsTier === 'high'
                ? era === 'future'
                  ? 22000
                  : 9600
                : era === 'future'
                  ? 18000
                  : 7200
          }
          factor={era === 'future' ? 2.6 : 3.2}
          fade
          speed={0.5}
        />
      )}

      <PlanetaryRings era={era} />
      <DistantOrbs era={era} />

      {era === 'future' && (
        <SpaceDust count={graphicsTier === 'low' ? 900 : graphicsTier === 'high' ? 4200 : 3200} />
      )}

      {(weather === 'clear' || weather === 'mystical') && timeHour > 8 && timeHour < 17 && (
        <Cloud position={[0, 38, 0]} speed={0.15} opacity={era === 'future' ? 0.22 : 0.38} segments={16} />
      )}

      <WaterSurface
        cx={waterCenter.cx}
        cz={waterCenter.cz}
        worldEra={worldEra}
        weather={weather}
        waterLevel={WATER_LEVEL}
        graphicsTier={graphicsTier}
      />
      <TerrainPlane
        worldSeed={worldSeed}
        playerTileX={playerTileX}
        playerTileY={playerTileY}
        timeHour={timeHour}
        weather={weather}
        worldEra={worldEra}
      />
      <FloatingIslands worldSeed={worldSeed} playerTileX={playerTileX} playerTileY={playerTileY} />
      <BiomeScatter
        worldSeed={worldSeed}
        playerTileX={playerTileX}
        playerTileY={playerTileY}
        worldEra={worldEra}
        graphicsTier={graphicsTier}
      />
      <HorizonHeroLandmarks
        worldSeed={worldSeed}
        playerTileX={playerTileX}
        playerTileY={playerTileY}
        graphicsTier={graphicsTier}
      />
      <ResourcePickups
        worldSeed={worldSeed}
        playerTileX={playerTileX}
        playerTileY={playerTileY}
        planeHalf={PLANE_TILES / 2}
      />
      <WanderingCritters worldSeed={worldSeed} playerTileX={playerTileX} playerTileY={playerTileY} count={3} />
      {era === 'future' && (
        <FutureFloatingShards
          worldSeed={worldSeed}
          playerTileX={playerTileX}
          playerTileY={playerTileY}
        />
      )}
      <PlayerFigure
        playerTileX={playerTileX}
        playerTileY={playerTileY}
        worldSeed={worldSeed}
        worldEra={worldEra}
      />
      <NpcFigures
        npcs={npcs}
        playerTileX={playerTileX}
        playerTileY={playerTileY}
        worldSeed={worldSeed}
        worldEra={worldEra}
        spatialNpcLines={spatialNpcLines}
        onPick={onNpcClick}
      />
      <WeatherVfx weather={weather} />
      <ChronolithAnchor
        playerTileX={playerTileX}
        playerTileY={playerTileY}
        worldSeed={worldSeed}
        worldEra={era}
        sunDir={sunDirWorld}
        graphicsTier={graphicsTier}
      />
      <MassGeneratedProps
        worldSeed={worldSeed}
        playerTileX={playerTileX}
        playerTileY={playerTileY}
        graphicsTier={graphicsTier}
      />
      <WorldPingRings worldSeed={worldSeed} pings={worldPings ?? []} graphicsTier={graphicsTier} />
      </group>
      <SunAnchor stateRef={worldAnchorRef} sunRef={sunRef} />
      <LightningFlash weather={weather} />
    </>
  );
}

function eraHudLabel(era: WorldEra | undefined): string {
  if (era === 'future') return 'ERA: FUTURE';
  if (era === 'modern') return 'ERA: MODERN';
  return 'ERA: MEDIEVAL';
}

function HudOverlay({
  playerTileX,
  playerTileY,
  worldSeed,
  worldEra
}: {
  playerTileX: number;
  playerTileY: number;
  worldSeed: number;
  worldEra?: WorldEra;
}) {
  const biome = biomeAt(Math.floor(playerTileX), Math.floor(playerTileY), worldSeed);
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-2 z-[30] flex justify-center px-2">
        <div className="flex items-center gap-1 rounded-full border border-cyan-400/25 bg-black/45 px-4 py-1 font-mono text-[9px] uppercase tracking-[0.35em] text-cyan-100/90 shadow-[0_0_18px_rgba(34,211,238,0.12)] backdrop-blur-sm">
          <span className="text-cyan-300">N</span>
          <span className="opacity-40">·</span>
          <span className="opacity-70">E</span>
          <span className="opacity-40">·</span>
          <span className="opacity-70">S</span>
          <span className="opacity-40">·</span>
          <span className="opacity-70">W</span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[30] flex justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent px-3 py-2 text-[11px] text-slate-300">
        <span className="font-mono text-violet-200/90">
          {playerTileX.toFixed(1)} , {playerTileY.toFixed(1)}
        </span>
        <span className="flex flex-col items-end gap-0.5 text-right">
          <span className="uppercase tracking-wide text-cyan-300/80">{eraHudLabel(worldEra)}</span>
          <span className="uppercase tracking-wide text-slate-400">{biome.replace(/_/g, ' ')}</span>
        </span>
      </div>
    </>
  );
}

/** Телеметрия кадра для предупреждения о низком FPS (localStorage `chronos_debug_telemetry=1`). */
function ChronosFpsTelemetryRecorder({ graphicsTier }: { graphicsTier: WorldGraphicsTier }) {
  useFrame(() => {
    recordR3fFrameTick(graphicsTier);
  });
  return null;
}

/** Three.js Stats: FPS / ms; включается в настройках графики (см. `showFpsOverlay`). */
function ChronosFpsStats() {
  const [show, setShow] = useState(() => loadChronosGameSettings().showFpsOverlay);
  useEffect(() => {
    const onPatch = (e: Event) => {
      const d = (e as CustomEvent<boolean>).detail;
      if (typeof d === 'boolean') setShow(d);
    };
    const onSaved = () => setShow(loadChronosGameSettings().showFpsOverlay);
    window.addEventListener('chronos:fps_overlay', onPatch as EventListener);
    window.addEventListener('chronos:settings_updated', onSaved);
    return () => {
      window.removeEventListener('chronos:fps_overlay', onPatch as EventListener);
      window.removeEventListener('chronos:settings_updated', onSaved);
    };
  }, []);
  if (!show) return null;
  return <Stats className="!top-auto !left-auto !bottom-2 !right-2" />;
}

/** Корневая обёртка: Canvas снаружи вызывает этот компонент без useThree в родителе */
export function WorldScene3DCanvas(props: WorldScene3DProps) {
  const powerPaused = useChronosPowerSavePaused();
  const weakGpu = isWeakGpuProfile();
  const requestedTier = props.graphicsTier ?? 'balanced';
  const graphicsTier: WorldGraphicsTier = weakGpu && requestedTier === 'high' ? 'balanced' : requestedTier;
  const colorGrading = useMemo(() => loadChronosGameSettings().colorGrading ?? 'default', []) as 'default' | 'cinematic' | 'vibrant' | 'desaturated';
  const sunRef = useRef<THREE.Mesh>(null);
  const worldAnchorRef = useRef<SunAnchorState>({
    px: 0,
    py: 0,
    pz: 0,
    timeHour: 12
  });
  return (
    <div
      data-chronos-world-viewport
      className="relative z-0 w-full overflow-hidden rounded-xl border border-[var(--chronos-border)] bg-black"
      style={{ height: 'min(640px, 56vh)' }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[25] -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full border border-cyan-300/55 bg-cyan-400/25 shadow-[0_0_12px_rgba(34,211,238,0.45)]"
        aria-hidden
      />
      <Canvas
        frameloop={powerPaused ? 'never' : 'always'}
        shadows={graphicsTier !== 'low'}
        dpr={
          graphicsTier === 'low'
            ? [1, 1]
            : graphicsTier === 'high'
              ? [1, 1.5]
              : [1, 1.5]
        }
        gl={{ antialias: !weakGpu, alpha: false, powerPreference: 'high-performance' }}
        camera={{ fov: 52, near: 0.1, far: 920, position: [0, 22, 32] }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 2, 0);
        }}
      >
        <color attach="background" args={['#05070d']} />
        <WorldContent {...props} graphicsTier={graphicsTier} sunRef={sunRef} worldAnchorRef={worldAnchorRef} />
        <WorldPostFX
          isNight={props.timeHour < 6 || props.timeHour > 20}
          weather={props.weather}
          worldEra={props.worldEra}
          graphicsTier={graphicsTier}
          colorGrading={colorGrading}
        />
        <Css2DWorldOverlay />
        <ChronosFpsTelemetryRecorder graphicsTier={graphicsTier} />
        <ChronosFpsStats />
      </Canvas>
      <HudOverlay
        playerTileX={props.playerTileX}
        playerTileY={props.playerTileY}
        worldSeed={props.worldSeed}
        worldEra={props.worldEra}
      />
    </div>
  );
}

type EBState = { hasError: boolean };

export class World3DErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  EBState
> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.warn('[WorldScene3D]', err, info.componentStack);
    const line = `${err?.message ?? String(err)}\n${info.componentStack ?? ''}\n`;
    void window.chronosDesktop?.writeCrashLog?.(line);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
