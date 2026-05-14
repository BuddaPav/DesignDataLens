import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';

type OptionalLocalGlbProps = {
  /** Path under `public/`, e.g. `models/chronolith.glb`. */
  path: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** Hide when camera is farther than this distance. */
  maxDistance?: number;
  /** Minimum tier required to even attempt loading. */
  minTier?: WorldGraphicsTier;
  graphicsTier: WorldGraphicsTier;
};

function tierRank(t: WorldGraphicsTier): number {
  return t === 'low' ? 0 : t === 'balanced' ? 1 : 2;
}

function disposeScene(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.geometry?.dispose();
      const mm = m.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mm)) mm.forEach((x) => x.dispose());
      else mm?.dispose();
    }
  });
}

export function OptionalLocalGlb({
  path,
  position,
  rotation,
  scale = 1,
  maxDistance,
  minTier = 'balanced',
  graphicsTier,
}: OptionalLocalGlbProps) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  const enabled = tierRank(graphicsTier) >= tierRank(minTier);

  useEffect(() => {
    if (!enabled) return;
    const base = import.meta.env.BASE_URL || '/';
    const url = `${base}${path}`.replace(/([^:]\/)\/+/g, '$1');
    const loader = new GLTFLoader();
    let alive = true;
    loader.load(
      url,
      (gltf) => {
        if (!alive) {
          disposeScene(gltf.scene);
          return;
        }
        const root = gltf.scene;
        root.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
          }
        });
        setScene(root);
      },
      undefined,
      () => {
        if (alive) setScene(null);
      },
    );
    return () => {
      alive = false;
      setScene((prev) => {
        if (prev) disposeScene(prev);
        return null;
      });
    };
  }, [enabled, path]);

  const rot = rotation ?? [0, 0, 0];
  const pos = useMemo(() => new THREE.Vector3(position[0], position[1], position[2]), [position]);

  useFrame(({ camera }) => {
    if (!maxDistance) return;
    const g = groupRef.current;
    if (!g) return;
    const d = camera.position.distanceTo(pos);
    g.visible = d <= maxDistance;
  });

  if (!enabled || !scene) return null;
  return (
    <group ref={groupRef} position={position} rotation={rot} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

