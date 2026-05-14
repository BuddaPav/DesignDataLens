/**
 * Светящиеся ресурсы (instanced) + CSS2D-метка для ближайшего к игроку.
 */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { elevationAt, tileHash01 } from '@/engine/worldTiles';

const H_SCALE = 16;
const LABEL_DIST = 11;
const COUNT = 96;

type Pickup = { x: number; y: number; z: number; name: string };

export interface ResourcePickupsProps {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  planeHalf: number;
}

export function ResourcePickups({ worldSeed, playerTileX, playerTileY, planeHalf }: ResourcePickupsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  const labelObjRef = useRef<CSS2DObject | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const playerRef = useRef({ x: playerTileX, z: playerTileY });
  playerRef.current = { x: playerTileX, z: playerTileY };
  const { scene } = useThree();

  const pickups = useMemo(() => {
    const originX = Math.floor(playerTileX) - planeHalf;
    const originY = Math.floor(playerTileY) - planeHalf;
    const pts: Pickup[] = [];
    let n = 0;
    for (let j = 0; j < planeHalf * 2 && n < COUNT; j += 2) {
      for (let i = 0; i < planeHalf * 2 && n < COUNT; i += 2) {
        const tx = originX + i + 0.5;
        const ty = originY + j + 0.5;
        const h = tileHash01(Math.floor(tx), Math.floor(ty), worldSeed + 91011);
        if (h < 0.72) continue;
        const y = elevationAt(tx, ty, worldSeed) * H_SCALE + 0.55;
        const names = ['Эхо-пыль', 'Хроно-слиток', 'Нить судьбы', 'Кристалл памяти'];
        pts.push({ x: tx, y, z: ty, name: names[n % names.length] });
        n++;
      }
    }
    return pts;
  }, [playerTileX, playerTileY, planeHalf, worldSeed]);

  const geo = useMemo(() => new THREE.OctahedronGeometry(0.38, 0), []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#fbbf24',
        emissive: '#f59e0b',
        emissiveIntensity: 0.85,
        metalness: 0.35,
        roughness: 0.18,
        transmission: 0.22,
        thickness: 0.6,
        ior: 1.45,
        transparent: true,
        opacity: 0.96
      }),
    []
  );

  const max = Math.max(1, pickups.length);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, i * 0.7, 0);
      dummy.scale.setScalar(0.9 + (i % 5) * 0.06);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = pickups.length;
  }, [dummy, pickups]);

  useEffect(() => {
    const g = labelGroupRef.current;
    if (!g) return;
    const el = document.createElement('div');
    el.className = 'chronos-resource-tag';
    el.style.cssText =
      'padding:3px 10px;border-radius:10px;background:rgba(6,10,18,0.82);border:1px solid rgba(251,191,36,0.5);color:#fef3c7;font-size:10px;font-weight:600;opacity:0;pointer-events:none;box-shadow:0 0 14px rgba(251,191,36,0.25);';
    const obj = new CSS2DObject(el);
    obj.position.set(0, 0.85, 0);
    g.add(obj);
    labelObjRef.current = obj;
    return () => {
      g.remove(obj);
      labelObjRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useEffect(() => {
    const env = scene.environment as THREE.Texture | null;
    if (env && 'isTexture' in env && (env as THREE.Texture).isTexture) {
      mat.envMap = env as THREE.Texture;
      mat.envMapIntensity = 1;
      mat.needsUpdate = true;
    }
  }, [scene.environment, mat]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh) mesh.rotation.y += 0.006;

    const g = labelGroupRef.current;
    const obj = labelObjRef.current;
    const msh = meshRef.current;
    if (!g || !obj || !msh || pickups.length === 0) return;

    const el = obj.element as HTMLDivElement;
    const px = playerRef.current.x;
    const pz = playerRef.current.z;
    const mat4 = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    let best: Pickup | null = null;
    let bestD = LABEL_DIST;
    for (let i = 0; i < pickups.length; i++) {
      msh.getMatrixAt(i, mat4);
      pos.setFromMatrixPosition(mat4);
      const d = Math.hypot(pos.x - px, pos.z - pz);
      if (d < bestD) {
        bestD = d;
        best = pickups[i];
      }
    }
    if (!best || bestD > LABEL_DIST) {
      el.style.opacity = '0';
      return;
    }
    g.position.set(best.x, best.y, best.z);
    el.textContent = best.name;
    el.style.opacity = String(Math.min(1, (LABEL_DIST - bestD) / 3.2));
  });

  if (pickups.length === 0) return null;

  return (
    <group>
      <instancedMesh ref={meshRef} args={[geo, mat, max]} castShadow />
      <group ref={labelGroupRef} />
    </group>
  );
}
