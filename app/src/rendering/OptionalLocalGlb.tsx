import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';

type OptionalLocalGlbProps = {
  /** Path under `public/`, e.g. `models/chronolith.glb`. */
  path: string;
  /** Optional LOD path set (near->far). */
  lodPaths?: string[];
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
  lodPaths,
  position,
  rotation,
  scale = 1,
  maxDistance,
  minTier = 'balanced',
  graphicsTier,
}: OptionalLocalGlbProps) {
  const [scenes, setScenes] = useState<Map<string, THREE.Group>>(new Map());
  const groupRef = useRef<THREE.Group>(null);
  const visiblePathRef = useRef<string | null>(null);

  const enabled = tierRank(graphicsTier) >= tierRank(minTier);
  const activePaths = useMemo(() => {
    const list = lodPaths?.length ? lodPaths : [path];
    return Array.from(new Set(list));
  }, [lodPaths, path]);

  useEffect(() => {
    if (!enabled) return;
    const next = new Map<string, THREE.Group>();
    let alive = true;

    const loader = new GLTFLoader();
    const base = import.meta.env.BASE_URL || '/';
    const loads = activePaths.map(
      (assetPath) =>
        new Promise<void>((resolve) => {
          const url = `${base}${assetPath}`.replace(/([^:]\/)\/+/g, '$1');
          loader.load(
            url,
            (gltf) => {
              const root = gltf.scene;
              root.traverse((o) => {
                const m = o as THREE.Mesh;
                if (m.isMesh) {
                  m.castShadow = true;
                  m.receiveShadow = true;
                }
              });
              next.set(assetPath, root);
              resolve();
            },
            undefined,
            () => resolve()
          );
        })
    );

    Promise.all(loads).then(() => {
      if (!alive) {
        for (const scene of next.values()) {
          disposeScene(scene);
        }
        return;
      }
      setScenes(next);
    });

    return () => {
      alive = false;
      setScenes((prev) => {
        for (const scene of prev.values()) {
          disposeScene(scene);
        }
        return new Map();
      });
    };
  }, [activePaths, enabled]);

  const rot = rotation ?? [0, 0, 0];
  const pos = useMemo(() => new THREE.Vector3(position[0], position[1], position[2]), [position]);

  const visiblePath = useMemo(() => {
    if (activePaths.length <= 1) return activePaths[0] ?? null;
    if (!maxDistance) return activePaths[0];
    return activePaths[0];
  }, [activePaths, maxDistance]);

  useFrame(({ camera }) => {
    const g = groupRef.current;
    if (!g) return;

    if (maxDistance) {
      const d = camera.position.distanceTo(pos);
      g.visible = d <= maxDistance;
      if (!g.visible) return;

      if (activePaths.length > 1) {
        const t1 = maxDistance * 0.45;
        const t2 = maxDistance * 0.75;
        const idx = d <= t1 ? 0 : d <= t2 ? 1 : Math.min(2, activePaths.length - 1);
        visiblePathRef.current = activePaths[idx] ?? activePaths[0] ?? null;
        return;
      }
    }

    visiblePathRef.current = visiblePath;
  });

  useEffect(() => {
    if (!visiblePathRef.current) visiblePathRef.current = visiblePath;
  }, [visiblePath]);

  if (!enabled || scenes.size === 0) return null;
  return (
    <group ref={groupRef} position={position} rotation={rot} scale={scale}>
      {Array.from(scenes.entries()).map(([assetPath, scene]) => {
        const shouldShow = (visiblePathRef.current ?? visiblePath) === assetPath;
        if (!shouldShow) return null;
        return <primitive key={assetPath} object={scene} />;
      })}
    </group>
  );
}

