/**
 * Крупные силуэты на горизонте — процедурные «геройские» меши + LOD (drei Detailed).
 */
import { Detailed } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { biomeAt, elevationAt } from '@/engine/worldTiles';

const H_SCALE = 16;

function noiseDeform(geo: THREE.BufferGeometry, amp: number, seed: number): THREE.BufferGeometry {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const s = Math.sin(v.x * 0.4 + seed) * Math.cos(v.z * 0.35 + seed * 0.7);
    v.y += s * amp;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function CrashedFreighterLOD({ seed }: { seed: number }) {
  const gHi = useMemo(() => noiseDeform(new THREE.BoxGeometry(18, 4.2, 42, 4, 2, 6), 1.1, seed), [seed]);
  const gLo = useMemo(() => new THREE.BoxGeometry(18, 4.2, 42, 2, 1, 3), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#475569',
        metalness: 0.55,
        roughness: 0.42,
        emissive: '#0c4a6e',
        emissiveIntensity: 0.08
      }),
    []
  );

  useEffect(() => {
    return () => {
      gHi.dispose();
      gLo.dispose();
      mat.dispose();
    };
  }, [gHi, gLo, mat]);

  return (
    <Detailed distances={[0, 70, 160]}>
      <mesh castShadow receiveShadow geometry={gHi} material={mat} />
      <mesh geometry={gLo} material={mat} />
      <mesh geometry={gLo} material={mat} />
    </Detailed>
  );
}

function AlienTower({ seed }: { seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => noiseDeform(new THREE.CylinderGeometry(2.2, 5.5, 38, 10, 6, true), 0.65, seed + 3), [seed]);
  const knotGeo = useMemo(() => new THREE.TorusKnotGeometry(3.5, 0.85, 48, 12), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#312e81',
        emissive: '#6d28d9',
        emissiveIntensity: 0.35,
        metalness: 0.35,
        roughness: 0.4,
        side: THREE.DoubleSide
      }),
    []
  );
  const knotMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#22d3ee',
        emissive: '#0891b2',
        emissiveIntensity: 0.55,
        metalness: 0.5,
        roughness: 0.22
      }),
    []
  );

  useEffect(() => {
    return () => {
      geo.dispose();
      knotGeo.dispose();
      mat.dispose();
      knotMat.dispose();
    };
  }, [geo, knotGeo, mat, knotMat]);

  useFrame((st) => {
    const g = ref.current;
    if (g) g.rotation.y = st.clock.elapsedTime * 0.04;
  });
  return (
    <group ref={ref}>
      <mesh castShadow geometry={geo} material={mat} />
      <mesh position={[0, 20, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={knotGeo} material={knotMat} />
    </group>
  );
}

export interface HorizonHeroLandmarksProps {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
}

export function HorizonHeroLandmarks({ worldSeed, playerTileX, playerTileY }: HorizonHeroLandmarksProps) {
  const spots = useMemo(() => {
    const arr: { x: number; z: number; y: number; kind: 'freighter' | 'tower' | 'mesa'; ang: number }[] = [];
    const dirs = [
      [-58, -72],
      [64, -58],
      [-52, 68],
      [78, 62],
      [0, -88]
    ];
    let i = 0;
    for (const [dx, dz] of dirs) {
      const x = Math.round(playerTileX + dx);
      const z = Math.round(playerTileY + dz);
      const biome = biomeAt(x, z, worldSeed);
      if (biome === 'deep_water' || biome === 'shallow') continue;
      const y = elevationAt(x + 0.5, z + 0.5, worldSeed) * H_SCALE;
      const kinds: Array<'freighter' | 'tower' | 'mesa'> = ['freighter', 'tower', 'mesa'];
      arr.push({ x, z, y, kind: kinds[i % kinds.length], ang: (i * 1.7) % (Math.PI * 2) });
      i++;
    }
    return arr;
  }, [playerTileX, playerTileY, worldSeed]);

  return (
    <group>
      {spots.map((s, idx) => {
        if (s.kind === 'freighter') {
          return (
            <group key={idx} position={[s.x, s.y + 2.2, s.z]} rotation={[0.08, s.ang, -0.04]}>
              <CrashedFreighterLOD seed={worldSeed + idx * 97} />
            </group>
          );
        }
        if (s.kind === 'tower') {
          return (
            <group key={idx} position={[s.x, s.y, s.z]}>
              <AlienTower seed={worldSeed + idx * 131} />
            </group>
          );
        }
        return (
          <mesh key={idx} position={[s.x, s.y + 8, s.z]} castShadow rotation={[0.12, s.ang, 0]}>
            <coneGeometry args={[16, 28, 5, 1, true]} />
            <meshStandardMaterial
              color="#92400e"
              roughness={0.88}
              metalness={0.04}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}
