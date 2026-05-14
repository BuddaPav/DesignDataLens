import { useFrame } from '@react-three/fiber';
import { useRef, type MutableRefObject, type RefObject } from 'react';
import * as THREE from 'three';

export type SunAnchorState = {
  px: number;
  py: number;
  pz: number;
  timeHour: number;
};

/** Невидимый меш-источник для GodRaysEffect (мировые координаты, не внутри смещённого root). */
export function SunAnchor({
  stateRef,
  sunRef
}: {
  stateRef: MutableRefObject<SunAnchorState>;
  sunRef: RefObject<THREE.Mesh | null>;
}) {
  const dir = useRef(new THREE.Vector3());
  useFrame(() => {
    const s = stateRef.current;
    const m = sunRef.current;
    if (!m) return;
    const rad = ((s.timeHour - 6) / 24) * Math.PI * 2;
    const h = Math.max(0.08, Math.sin(rad));
    dir.current.set(Math.cos(rad) * 0.72, h, Math.sin(rad) * 0.48 + 0.22).normalize();
    m.position.set(s.px + dir.current.x * 920, s.py + 260 + dir.current.y * 520, s.pz + dir.current.z * 920);
  });
  return (
    <mesh ref={sunRef} frustumCulled={false}>
      <sphereGeometry args={[24, 6, 6]} />
      <meshBasicMaterial color="#fffbeb" transparent opacity={0.001} depthWrite={false} />
    </mesh>
  );
}
