import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { createChronosCubeEnv } from '@/rendering/chronosEnvMap';

/** PMREM окружения для металла / воды / «SSR»-фолбэка. */
export function ChronosEnvironment() {
  const { gl, scene } = useThree();
  const pmrem = useMemo(() => new THREE.PMREMGenerator(gl), [gl]);
  const envRT = useMemo(() => {
    const cube = createChronosCubeEnv();
    const rt = pmrem.fromCubemap(cube);
    cube.dispose();
    return rt;
  }, [pmrem]);

  useEffect(() => {
    const prev = scene.environment;
    scene.environment = envRT.texture;
    return () => {
      scene.environment = prev;
      envRT.dispose();
      pmrem.dispose();
    };
  }, [scene, envRT, pmrem]);

  return null;
}
