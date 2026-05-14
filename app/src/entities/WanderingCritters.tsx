/**
 * Простые процедурные существа: икосаэдр + цилиндры-ноги, блуждание рядом с игроком.
 */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { elevationAt } from '@/engine/worldTiles';

const H_SCALE = 16;

type Critter = {
  id: number;
  ox: number;
  oz: number;
  phase: number;
  hue: number;
};

export interface WanderingCrittersProps {
  worldSeed: number;
  playerTileX: number;
  playerTileY: number;
  count?: number;
}

export function WanderingCritters({
  worldSeed,
  playerTileX,
  playerTileY,
  count = 3
}: WanderingCrittersProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyGeo = useMemo(() => new THREE.IcosahedronGeometry(0.52, 1), []);
  const legGeo = useMemo(() => new THREE.CylinderGeometry(0.06, 0.07, 0.4, 5), []);

  const critters = useMemo(() => {
    const arr: Critter[] = [];
    for (let i = 0; i < count; i++) {
      const a = ((worldSeed + i * 997) % 360) * (Math.PI / 180);
      const r = 6 + ((worldSeed >> (i + 3)) % 8);
      arr.push({
        id: i,
        ox: Math.cos(a) * r,
        oz: Math.sin(a) * r,
        phase: (worldSeed % 1000) * 0.01 + i * 1.7,
        hue: 0.55 + ((i * 0.09) % 0.35)
      });
    }
    return arr;
  }, [count, worldSeed]);

  const mats = useMemo(() => {
    return critters.map((c) => {
      const col = new THREE.Color().setHSL(c.hue, 0.55, 0.42);
      return new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.55,
        metalness: 0.12,
        emissive: col.clone().multiplyScalar(0.15)
      });
    });
  }, [critters]);

  useEffect(() => {
    return () => {
      mats.forEach((m) => m.dispose());
      bodyGeo.dispose();
      legGeo.dispose();
    };
  }, [mats, bodyGeo, legGeo]);

  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const root = groupRef.current;
    if (!root) return;
    root.children.forEach((ch, i) => {
      const c = critters[i];
      if (!c || !(ch instanceof THREE.Group)) return;
      const wander =
        4.2 * Math.sin(t * 0.35 + c.phase) + 2.8 * Math.cos(t * 0.22 + c.phase * 0.7);
      const wx = playerTileX + c.ox + Math.sin(t * 0.4 + c.phase) * wander * 0.25;
      const wz = playerTileY + c.oz + Math.cos(t * 0.33 + c.phase) * wander * 0.22;
      const y = elevationAt(wx, wz, worldSeed) * H_SCALE + 0.42;
      ch.position.set(wx, y, wz);
      ch.rotation.y = t * 0.8 + i;
    });
  });

  return (
    <group ref={groupRef}>
      {critters.map((c, i) => (
        <group key={c.id}>
          <mesh castShadow geometry={bodyGeo} material={mats[i]} position={[0, 0.35, 0]} />
          {[0, 1, 2, 3].map((leg) => {
            const ang = (leg / 4) * Math.PI * 2;
            const lx = Math.cos(ang) * 0.3;
            const lz = Math.sin(ang) * 0.3;
            return (
              <mesh
                key={leg}
                geometry={legGeo}
                material={mats[i]}
                position={[lx, 0.12, lz]}
                rotation={[0.2, ang, 0]}
              />
            );
          })}
        </group>
      ))}
    </group>
  );
}
