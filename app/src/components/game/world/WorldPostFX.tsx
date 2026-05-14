/**
 * Цепочка постобработки: bloom → god rays → grain → хроматика → контраст/насыщенность → оттенок → виньетка → ACES → SMAA.
 * Пресеты low / balanced / high задают нагрузку и «киношность».
 */
import React, { memo, useMemo, type RefObject } from 'react';
import {
  EffectComposer,
  Bloom,
  GodRays,
  Noise,
  ChromaticAberration,
  Vignette,
  ToneMapping,
  SMAA,
  HueSaturation,
  BrightnessContrast
} from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import type { Weather, WorldEra } from '@/types/game';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';

export const WorldPostFX = memo(function WorldPostFX({
  isNight,
  weather,
  worldEra,
  sunRef,
  graphicsTier = 'balanced'
}: {
  isNight: boolean;
  weather: Weather;
  worldEra?: WorldEra;
  sunRef: RefObject<THREE.Mesh | null>;
  graphicsTier?: WorldGraphicsTier;
}) {
  const mystical = weather === 'mystical' || weather === 'foggy';
  const future = worldEra === 'future';
  const chromOffset = useMemo(() => {
    if (graphicsTier === 'low') return new THREE.Vector2(0, 0);
    const m = graphicsTier === 'high' ? 0.0022 : 0.0015;
    return new THREE.Vector2(m, m);
  }, [graphicsTier]);

  const godRays = useMemo(() => {
    const hi = graphicsTier === 'high';
    const lo = graphicsTier === 'low';
    if (lo) {
      return {
        samples: 8,
        density: 0.2,
        decay: 0.5,
        weight: 0,
        exposure: 0,
        clampMax: 1,
        blur: true,
        resolutionScale: 0.25
      };
    }
    return {
      samples: hi ? 72 : 60,
      density: mystical ? 0.88 : future ? 0.9 : isNight ? 0.84 : 0.92,
      decay: mystical ? 0.86 : 0.9,
      weight: mystical ? 0.52 : isNight ? 0.32 : 0.5,
      exposure: mystical ? 0.72 : isNight ? 0.48 : 0.66,
      clampMax: 1,
      blur: true,
      resolutionScale: hi ? 0.55 : 0.5
    };
  }, [isNight, mystical, future, graphicsTier]);

  const vignette = useMemo(() => {
    const dark = isNight || weather === 'stormy';
    const extra = graphicsTier === 'high' ? 0.08 : 0;
    return { darkness: (dark ? 0.62 : 0.44) + extra, offset: 0.2 };
  }, [isNight, weather, graphicsTier]);

  const bloomIntensity = graphicsTier === 'high' ? 1.38 : graphicsTier === 'low' ? 0.72 : 1.2;
  const bloomRadius = graphicsTier === 'low' ? 0.55 : 0.8;
  const noiseOpacity = graphicsTier === 'low' ? 0.14 : 0.28;

  const grade = useMemo(() => {
    if (future) return { brightness: 0.03, contrast: 0.18, saturation: 0.32, hue: 0.02 };
    if (worldEra === 'modern') return { brightness: 0.02, contrast: 0.16, saturation: 0.22, hue: 0 };
    return { brightness: 0.02, contrast: 0.15, saturation: 0.25, hue: -0.01 };
  }, [worldEra, future]);

  return (
    <EffectComposer
      depthBuffer
      multisampling={0}
      enableNormalPass={false}
      renderPriority={1}
      autoClear
    >
      <Bloom
        luminanceThreshold={0.1}
        intensity={bloomIntensity}
        mipmapBlur={graphicsTier !== 'low'}
        radius={bloomRadius}
        levels={graphicsTier === 'low' ? 6 : 8}
      />
      <GodRays sun={sunRef as React.RefObject<THREE.Mesh>} {...godRays} />
      <Noise premultiply opacity={noiseOpacity} blendFunction={BlendFunction.OVERLAY} />
      <ChromaticAberration offset={chromOffset} />
      <BrightnessContrast brightness={grade.brightness} contrast={grade.contrast} />
      <HueSaturation saturation={grade.saturation} hue={grade.hue} />
      <Vignette eskil={false} offset={vignette.offset} darkness={vignette.darkness} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
});
