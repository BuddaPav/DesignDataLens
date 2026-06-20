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
varying vec3 vViewDir;

// Gerstner wave - realistic ocean waves
vec3 gerstnerWave(vec2 pos, float amp, float freq, float speed, vec2 dir, float steep, out vec3 tangent, out vec3 binormal) {
  float k = freq;
  float c = speed / k;
  float f = k * (dot(dir, pos) - c * uTime * uWave * speed);
  float a = amp;
  float s = steep;
  tangent = vec3(1.0 - s * dir.x * dir.x * k * a * sin(f), s * dir.x * k * a * cos(f), -s * dir.x * dir.y * k * a * sin(f));
  binormal = vec3(-s * dir.x * dir.y * k * a * sin(f), s * dir.y * k * a * cos(f), 1.0 - s * dir.y * dir.y * k * a * sin(f));
  return vec3(s * a * dir.x * cos(f), a * sin(f), s * a * dir.y * cos(f));
}

void main() {
  vUv = uv;
  vec3 pos = position;
  // 4 Gerstner waves with different directions/frequencies
  vec3 t1, b1, t2, b2, t3, b3, t4, b4;
  vec3 w1 = gerstnerWave(pos.xz, 0.35, 0.22, 1.2, vec2(0.7, 0.7), 0.4, t1, b1);
  vec3 w2 = gerstnerWave(pos.xz, 0.22, 0.35, 0.9, vec2(-0.6, 0.8), 0.35, t2, b2);
  vec3 w3 = gerstnerWave(pos.xz, 0.15, 0.55, 1.5, vec2(0.9, -0.4), 0.25, t3, b3);
  vec3 w4 = gerstnerWave(pos.xz, 0.08, 0.85, 1.8, vec2(-0.3, -0.9), 0.15, t4, b4);
  pos += w1 + w2 + w3 + w4;
  vec3 tangent = normalize(t1 + t2 + t3 + t4);
  vec3 binormal = normalize(b1 + b2 + b3 + b4);
  vN = normalize(cross(binormal, tangent));
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWorld = wp.xyz;
  vViewDir = normalize(cameraPosition - vWorld);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const frag = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vN;
varying vec3 vViewDir;
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

// Fresnel Schlick approximation
float fresnelSchlick(float cosTheta, float f0) {
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
  float dist = length(vWorld.xz - uCenter);
  if (dist > uRadius) discard;
  float shore = smoothstep(uRadius - 4.0, uRadius, dist);
  vec3 n = normalize(vN);
  vec3 v = normalize(vViewDir);
  float ndv = max(0.0, dot(n, v));

  // Fresnel - Schlick F0 for water ~0.02
  float fresnel = fresnelSchlick(ndv, 0.02);

  // Subsurface scattering approximation
  float sss = exp(-dist * 0.08) * 0.45;
  vec3 sssColor = uShallow * vec3(0.1, 0.45, 0.35);

  // Reflection
  vec3 reflDir = reflect(-v, n);
  float skyT = smoothstep(0.05, 0.95, reflDir.y);
  vec3 skyFake = mix(uSkyHorizon, uSkyZenith, skyT);

  // Specular (sun reflection)
  vec3 h = normalize(uSun + v);
  float spec = pow(max(0.0, dot(n, h)), 256.0) * 1.8;

  // Diffuse
  float ndl = max(0.15, dot(n, normalize(uSun)));

  // Depth-based color
  float depth = smoothstep(0.0, uRadius * 0.7, dist);
  vec3 waterColor = mix(uDeep, uShallow, depth * 0.6 + sssColor.r * 0.2);

  // Combine: base + fresnel reflection + SSS + specular
  vec3 finalColor = waterColor * (0.35 + ndl * 0.65);
  finalColor = mix(finalColor, skyFake, fresnel * uReflectStr * 0.85);
  finalColor += sssColor * sss;
  finalColor += vec3(1.0, 0.95, 0.85) * spec;

  // Foam on shorelines and wave peaks
  float foam = smoothstep(0.2, 0.85, uFoam + sin(vWorld.x * 0.5 + vWorld.z * 0.4) * 0.1);
  foam *= (1.0 - ndl) * 0.4;
  foam += (1.0 - shore) * 0.35;
  finalColor += vec3(1.0) * foam;

  gl_FragColor = vec4(finalColor, 0.68);
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
