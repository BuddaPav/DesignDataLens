import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { Weather, WorldEra } from '@/types/game';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';

const vert = /* glsl */ `
uniform float uTime;
uniform float uWave;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vN;
void main() {
  vUv = uv;
  vec3 pos = position;
  float w =
    sin(pos.x * 0.35 + uTime * uWave) * cos(pos.z * 0.28 + uTime * uWave * 0.85) * 0.45 +
    sin(pos.x * 0.72 - uTime * uWave * 1.1) * 0.22;
  pos.y += w;
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWorld = wp.xyz;
  float dx = -cos(pos.x * 0.35 + uTime * uWave) * 0.35 * 0.35 * 0.45;
  float dz = sin(pos.z * 0.28 + uTime * uWave * 0.85) * 0.28 * 0.45;
  vec3 tn = normalize(vec3(dx, 1.0, dz));
  vN = normalize(mat3(modelMatrix) * tn);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const frag = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vN;
uniform vec3 uSun;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSkyZenith;
uniform vec3 uSkyHorizon;
uniform float uEnvStr;
uniform float uFoam;
uniform float uDay;
uniform float uReflectStr;
uniform vec2 uCenter;
uniform float uRadius;
void main() {
  float dist = length(vWorld.xz - uCenter);
  if (dist > uRadius) discard;
  float shore = smoothstep(uRadius - 4.0, uRadius, dist);
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vWorld);
  float fr = pow(1.0 - max(0.0, dot(n, v)), 2.6);
  vec3 env = mix(uDeep * 1.6, vec3(0.32, 0.62, 0.82), fr) * uEnvStr;
  float ndl = max(0.15, dot(n, normalize(uSun)));
  vec3 reflDir = reflect(-v, n);
  float skyT = smoothstep(0.05, 0.95, reflDir.y);
  vec3 skyFake = mix(uSkyHorizon, uSkyZenith, skyT);
  vec3 specMix = mix(env, skyFake, uReflectStr * fr * (0.55 + 0.45 * ndl));
  float foam = smoothstep(0.15, 0.95, uFoam + sin(vWorld.x * 0.5 + vWorld.z * 0.4) * 0.08) * (1.0 - ndl) * 0.35;
  foam += (1.0 - shore) * 0.25;
  vec3 base = mix(uDeep, uShallow, ndl * 0.65 + 0.2);
  vec3 lit = mix(base, specMix, 0.42 * uDay + 0.18 * uReflectStr);
  lit += vec3(1.0) * foam;
  gl_FragColor = vec4(lit, 0.62);
}
`;

export function WaterSurface({
  cx,
  cz,
  worldEra,
  weather,
  waterLevel,
  graphicsTier = 'balanced'
}: {
  cx: number;
  cz: number;
  worldEra?: WorldEra;
  weather: Weather;
  waterLevel: number;
  graphicsTier?: WorldGraphicsTier;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const era = worldEra ?? 'medieval';

  const segments = graphicsTier === 'low' ? 64 : graphicsTier === 'high' ? 160 : 128;
  const usePlanar = graphicsTier === 'high' || graphicsTier === 'balanced';
  const reflectorRes = graphicsTier === 'high' ? 1024 : 512;

  const uniforms = useMemo(() => {
    const deep =
      era === 'future' ? new THREE.Color('#020617') : era === 'modern' ? new THREE.Color('#082038') : new THREE.Color('#061428');
    const shallow =
      era === 'future' ? new THREE.Color('#155e75') : era === 'modern' ? new THREE.Color('#164e63') : new THREE.Color('#134e4a');
    const reflectStr = graphicsTier === 'high' ? 0.92 : graphicsTier === 'low' ? 0.38 : 0.68;
    const skyZenith =
      era === 'future'
        ? new THREE.Color('#7dd3fc')
        : era === 'modern'
          ? new THREE.Color('#93c5fd')
          : new THREE.Color('#bae6fd');
    const skyHorizon =
      era === 'future'
        ? new THREE.Color('#1e293b')
        : era === 'modern'
          ? new THREE.Color('#0f172a')
          : new THREE.Color('#0c4a6e');
    return {
      uTime: { value: 0 },
      uWave: { value: 1.05 },
      uSun: { value: new THREE.Vector3(0.4, 0.85, 0.35) },
      uDeep: { value: deep },
      uShallow: { value: shallow },
      uSkyZenith: { value: skyZenith },
      uSkyHorizon: { value: skyHorizon },
      uEnvStr: { value: 0.85 },
      uFoam: { value: 0.4 },
      uDay: { value: 1 },
      uReflectStr: { value: reflectStr },
      uCenter: { value: new THREE.Vector2(cx, cz) },
      uRadius: { value: 70 }
    };
  }, [era, cx, cz, graphicsTier]);

  useFrame((st) => {
    const m = meshRef.current?.material as THREE.ShaderMaterial | undefined;
    if (!m) return;
    m.uniforms.uTime.value = st.clock.elapsedTime;
    m.uniforms.uWave.value = weather === 'stormy' ? 1.65 : weather === 'rainy' ? 1.25 : 0.95;
    m.uniforms.uFoam.value = weather === 'stormy' ? 0.72 : 0.38;
    m.uniforms.uCenter.value.set(cx, cz);
  });

  return (
    <group>
      {usePlanar && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, waterLevel - 0.02, cz]}>
          <planeGeometry args={[144, 144]} />
          <MeshReflectorMaterial
            resolution={reflectorRes}
            mirror={0.72}
            mixBlur={0.55}
            mixStrength={0.6}
            blur={[256, 64]}
            metalness={0}
            roughness={0.25}
            color={era === 'future' ? '#061428' : '#0b1a30'}
          />
        </mesh>
      )}

      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[cx, waterLevel, cz]}
        renderOrder={-1}
      >
        <planeGeometry args={[144, 144, segments, segments]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
