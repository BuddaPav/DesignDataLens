import { useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { biomeAt, elevationAt, tileHash01 } from '@/engine/worldTiles';
import { SIMPLEX3D_GLSL } from '@/rendering/simplex3d.glsl';

const HEIGHT_SCALE = 16;
const PLANE_TILES = 96;
const MAX_ISLANDS = 20;

const islandVert = /* glsl */ `
${SIMPLEX3D_GLSL}
uniform float uTime;
uniform float uDisp;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 pos = position;
  vec3 w = (modelMatrix * vec4(pos, 1.0)).xyz;
  float n = snoise(w * 0.052 + uTime * 0.07) * 0.5 + snoise(w * 0.1 + uTime * 0.045) * 0.25;
  pos += normal * n * uDisp;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vP = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const islandFrag = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
uniform vec3 uSun;
uniform vec3 uColorA;
uniform vec3 uColorB;
void main() {
  vec3 n = normalize(vN);
  vec3 sunDir = normalize(uSun);
  float ndl = max(0.14, dot(n, sunDir));
  vec3 c = mix(uColorA, uColorB, ndl);
  float rim = pow(1.0 - max(0.0, dot(n, vec3(0.0, 1.0, 0.0))), 2.25);
  vec3 rimHue = mix(vec3(0.2, 0.85, 0.95), vec3(0.75, 0.35, 1.0), ndl * 0.45);
  vec3 ambient = vec3(0.04, 0.06, 0.1);
  gl_FragColor = vec4(c + rim * rimHue * 0.55 + ambient, 1.0);
}
`;

export function FloatingIslands({
  worldSeed,
  playerTileX,
  playerTileY
}: {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
}) {
  const originX = Math.floor(playerTileX) - PLANE_TILES / 2;
  const originY = Math.floor(playerTileY) - PLANE_TILES / 2;
  const items = useMemo(() => {
    const arr: { x: number; y: number; z: number; s: number }[] = [];
    for (let k = 0; k < MAX_ISLANDS * 5; k++) {
      if (arr.length >= MAX_ISLANDS) break;
      const lx = tileHash01(k * 3, k + 1, worldSeed + 12001) * PLANE_TILES;
      const lz = tileHash01(k * 3 + 1, k + 2, worldSeed + 12002) * PLANE_TILES;
      const tx = originX + lx;
      const tz = originY + lz;
      const biome = biomeAt(Math.floor(tx), Math.floor(tz), worldSeed);
      if (biome === 'deep_water' || biome === 'shallow') continue;
      const base = elevationAt(tx, tz, worldSeed) * HEIGHT_SCALE;
      const h = tileHash01(k, worldSeed, 12003);
      const below = h > 0.52;
      arr.push({
        x: tx,
        y: below ? base - 8 - h * 14 : base + 6 + h * 18,
        z: tz,
        s: 2.2 + h * 4.2
      });
    }
    return arr;
  }, [originX, originY, worldSeed]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDisp: { value: 1.25 },
          uSun: { value: new THREE.Vector3(0.4, 0.85, 0.3) },
          uColorA: { value: new THREE.Color('#2d3748') },
          uColorB: { value: new THREE.Color('#94a3b8') }
        },
        vertexShader: islandVert,
        fragmentShader: islandFrag
      }),
    []
  );

  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime;
  });

  useEffect(() => () => mat.dispose(), [mat]);

  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.y, it.z]} scale={it.s} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 3]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
