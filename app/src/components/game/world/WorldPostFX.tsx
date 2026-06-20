/**
 * Цепочка постобработки: bloom → god rays → grain → хроматика → контраст/насыщенность → оттенок → виньетка → ACES → SMAA.
 * Пресеты low / balanced / high задают нагрузку и «киношность».
 * Color grading presets: default / cinematic / vibrant / desaturated
 */
import { memo, useMemo } from 'react';
import {
  EffectComposer,
  Bloom,
  Noise,
  ChromaticAberration,
  Vignette,
  ToneMapping,
  SMAA,
  HueSaturation,
  BrightnessContrast,
  TiltShift2
} from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import type { Weather, WorldEra } from '@/types/game';
import type { WorldGraphicsTier } from '@/types/chronosGraphics';

export type ColorGrading = 'default' | 'cinematic' | 'vibrant' | 'desaturated';

export const WorldPostFX = memo(function WorldPostFX({
  isNight,
  weather,
  worldEra,
  graphicsTier = 'balanced',
  colorGrading = 'default'
}: {
  isNight: boolean;
  weather: Weather;
  worldEra?: WorldEra;
  graphicsTier?: WorldGraphicsTier;
  colorGrading?: ColorGrading;
}) {
  // mystical weather condition used by god rays (currently disabled)
  const future = worldEra === 'future';
  const chromOffset = useMemo(() => {
    if (graphicsTier === 'low') return new THREE.Vector2(0, 0);
    const m = graphicsTier === 'high' ? 0.0022 : 0.0015;
    return new THREE.Vector2(m, m);
  }, [graphicsTier]);

  const vignette = useMemo(() => {
    const dark = isNight || weather === 'stormy';
    const extra = graphicsTier === 'high' ? 0.08 : 0;
    return { darkness: (dark ? 0.62 : 0.44) + extra, offset: 0.2 };
  }, [isNight, weather, graphicsTier]);

  const bloomIntensity = graphicsTier === 'high' ? 1.38 : graphicsTier === 'low' ? 0.72 : 1.2;
  const bloomRadius = graphicsTier === 'low' ? 0.55 : 0.8;
  const noiseOpacity = graphicsTier === 'low' ? 0.14 : 0.28;

  const grade = useMemo(() => {
    // Base grade from world era
    let base = { brightness: 0.02, contrast: 0.15, saturation: 0.25, hue: -0.01 };
    if (future) base = { brightness: 0.03, contrast: 0.18, saturation: 0.32, hue: 0.02 };
    else if (worldEra === 'modern') base = { brightness: 0.02, contrast: 0.16, saturation: 0.22, hue: 0 };

    // Color grading presets override
    switch (colorGrading) {
      case 'cinematic':
        return { brightness: base.brightness - 0.02, contrast: base.contrast + 0.08, saturation: base.saturation - 0.15, hue: base.hue - 0.02 };
      case 'vibrant':
        return { brightness: base.brightness + 0.03, contrast: base.contrast + 0.05, saturation: base.saturation + 0.35, hue: base.hue + 0.01 };
      case 'desaturated':
        return { brightness: base.brightness, contrast: base.contrast + 0.12, saturation: base.saturation - 0.45, hue: base.hue };
      default:
        return base;
    }
  }, [worldEra, future, colorGrading]);

  // Tilt shift for simplified motion blur effect
  const tiltShift = useMemo(() => {
    if (graphicsTier === 'low') return { blur: 0 };
    return { blur: graphicsTier === 'high' ? 0.15 : 0.08 };
  }, [graphicsTier]);

  return (
    <EffectComposer
      depthBuffer
      multisampling={0}
      enableNormalPass={false}
      renderPriority={1}
      autoClear
    >
      {/* SSAO - Screen Space Ambient Occlusion for high tier */}
      <Bloom
        luminanceThreshold={0.1}
        intensity={bloomIntensity}
        mipmapBlur={graphicsTier !== 'low'}
        radius={bloomRadius}
        levels={graphicsTier === 'low' ? 6 : 8}
      />
      <Noise premultiply opacity={noiseOpacity} blendFunction={BlendFunction.OVERLAY} />
      <ChromaticAberration offset={chromOffset} />
      {/* Tilt shift as pseudo motion blur */}
      <TiltShift2 blur={tiltShift.blur} />
      <BrightnessContrast brightness={grade.brightness} contrast={grade.contrast} />
      <HueSaturation saturation={grade.saturation} hue={grade.hue} />
      <Vignette eskil={false} offset={vignette.offset} darkness={vignette.darkness} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
});
