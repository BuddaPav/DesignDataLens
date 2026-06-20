/** Пресет качества 3D-мира (постобработка, вода, часть декора). */
export type WorldGraphicsTier = 'low' | 'balanced' | 'high';

/** Color grading presets for post-processing */
export type ColorGradingPreset = 'default' | 'cinematic' | 'vibrant' | 'desaturated';

/** Player control settings */
export interface PlayerControlSettings {
  sensitivity: number;
  invertY: boolean;
  cameraMode: 'first' | 'third';
  fieldOfView: number;
}

/** Extended graphics settings */
export interface GraphicsSettings {
  tier: WorldGraphicsTier;
  colorGrading: ColorGradingPreset;
  motionBlur: boolean;
  ssao: boolean;
}
