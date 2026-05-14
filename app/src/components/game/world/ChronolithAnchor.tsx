/**
 * Визуальный якорь мира: процедурный «хронолит» (смещение вершин + iridescent physical)
 * и опциональный локальный GLB `public/models/chronolith.glb` при наличии файла.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { WorldEra } from '@/types/game';
import { elevationAt, tileHash01 } from '@/engine/worldTiles';
import { OptionalLocalGlb } from '@/rendering/OptionalLocalGlb';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';

const HEIGHT_SCALE = 16;

function heightAtWorld(tx: number, ty: number, seed: number): number {
  return elevationAt(tx, ty, seed) * HEIGHT_SCALE;
}

const spireVert = /* glsl */ `
uniform float uTime;
uniform float uSeed;
varying vec3 vN;
varying vec3 vP;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

float noise(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n = p.x + p.y * 57.0 + 113.0 * p.z + uSeed;
  return mix(
    mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
    mix(mix(hash(n + 113.0), hash(n + 114.0), f.x), mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
    f.z
  );
}

void main() {
  vec3 pos = position;
  vec3 dir = normalize(position);
  float n = noise(dir * 3.2 + uTime * 0.12);
  float wave = sin(pos.y * 0.55 + uTime * 0.8) * 0.08;
  float disp = (n - 0.5) * 0.45 + wave;
  pos += normal * disp;
  vN = normalize(normalMatrix * normal);
  vP = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const spireFrag = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uSunDir;

void main() {
  vec3 n = normalize(vN);
  float ndl = max(0.08, dot(n, normalize(uSunDir)));
  float rim = pow(1.0 - max(0.0, dot(n, vec3(0.0, 1.0, 0.0))), 2.2);
  vec3 base = mix(uColorA, uColorB, ndl);
  vec3 outc = base * (0.35 + 0.65 * ndl) + vec3(0.15, 0.08, 0.35) * rim;
  gl_FragColor = vec4(outc, 1.0);
}
`;

function ChronolithSpire({ worldEra, sunDir }: { worldEra: WorldEra; sunDir: THREE.Vector3 }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const u = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: worldEra === 'future' ? 91 : worldEra === 'modern' ? 42 : 17 },
      uColorA: {
        value: new THREE.Color(worldEra === 'future' ? '#1a0a3a' : worldEra === 'modern' ? '#1a2530' : '#0d2818')
      },
      uColorB: {
        value: new THREE.Color(worldEra === 'future' ? '#6d28d9' : worldEra === 'modern' ? '#94a3b8' : '#2d6a4f')
      },
      uSunDir: { value: sunDir.clone() }
    }),
    [worldEra, sunDir]
  );

  useFrame((st) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value = st.clock.elapsedTime;
    m.uniforms.uSunDir.value.copy(sunDir);
  });

  return (
    <mesh castShadow receiveShadow position={[0, 5.2, 0]}>
      <icosahedronGeometry args={[2.2, 4]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={spireVert}
        fragmentShader={spireFrag}
        uniforms={u}
      />
    </mesh>
  );
}

function OrbitHalo({ worldEra }: { worldEra: WorldEra }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.x = st.clock.elapsedTime * 0.31;
    m.rotation.z = st.clock.elapsedTime * 0.19;
  });
  const col = worldEra === 'future' ? '#a78bfa' : worldEra === 'modern' ? '#38bdf8' : '#4ade80';
  return (
    <mesh ref={ref} castShadow position={[0, 8.4, 0]}>
      <torusKnotGeometry args={[1.35, 0.22, 160, 16]} />
      <meshPhysicalMaterial
        color={col}
        metalness={0.55}
        roughness={0.18}
        clearcoat={0.85}
        clearcoatRoughness={0.12}
        emissive={col}
        emissiveIntensity={0.12}
        iridescence={0.65}
        iridescenceIOR={1.5}
      />
    </mesh>
  );
}

export function ChronolithAnchor({
  playerTileX,
  playerTileY,
  worldSeed,
  worldEra,
  sunDir,
  graphicsTier = 'balanced'
}: {
  playerTileX: number;
  playerTileY: number;
  worldSeed: number;
  worldEra: WorldEra;
  sunDir: THREE.Vector3;
  graphicsTier?: WorldGraphicsTier;
}) {
  const era: WorldEra = worldEra ?? 'medieval';
  const anchor = useMemo(() => {
    const h = tileHash01(Math.floor(playerTileX), Math.floor(playerTileY), worldSeed + 701);
    const ang = h * Math.PI * 2;
    const dist = 32 + (h * 18);
    return {
      mx: playerTileX + Math.cos(ang) * dist,
      mz: playerTileY + Math.sin(ang) * dist
    };
  }, [playerTileX, playerTileY, worldSeed]);

  const py = heightAtWorld(playerTileX, playerTileY, worldSeed) + 1.2;
  const ground = heightAtWorld(anchor.mx, anchor.mz, worldSeed);
  const lx = anchor.mx + playerTileX;
  const ly = ground + py;
  const lz = anchor.mz + playerTileY;

  return (
    <group position={[lx, ly, lz]}>
      <ChronolithSpire worldEra={era} sunDir={sunDir} />
      <OrbitHalo worldEra={era} />
      <OptionalLocalGlb
        path="models/chronolith.glb"
        position={[0.4, 4.2, 0.6]}
        scale={6}
        maxDistance={graphicsTier === 'high' ? 220 : 140}
        minTier="balanced"
        graphicsTier={graphicsTier}
      />
    </group>
  );
}
