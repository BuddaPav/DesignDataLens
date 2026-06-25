// Ambient Audio Engine - Location-based and dynamic music system for AAA immersion

import type { MusicTrack, SoundType } from '@/engine/SoundManager';
import { soundManager } from '@/engine/SoundManager';

// Biome-specific ambient sounds
export type BiomeAmbient =
  | 'forest' | 'desert' | 'ocean' | 'mountain' | 'cave'
  | 'city' | 'ruins' | 'swamp' | 'tundra' | 'volcanic';

export interface AmbientLayer {
  id: string;
  volume: number; // 0-1
  playbackRate: number; // 0.5-2.0
  pan: number; // -1 to 1
  muted: boolean;
}

// Dynamic music state
interface MusicState {
  currentTrack: MusicTrack | null;
  transitionProgress: number;
  targetTrack: MusicTrack | null;
  pendingTransition: boolean;
}

// Ambient configuration by biome
const BIOME_AMBIENTS: Record<BiomeAmbient, string[]> = {
  forest: ['birds', 'wind', 'insects'],
  desert: ['wind', 'sand', 'scorpions'],
  ocean: ['waves', 'seagulls', 'whales'],
  mountain: ['wind', 'eagles', 'bells'],
  cave: ['water_drips', 'bats', 'echo'],
  city: ['market', 'voices', 'horses'],
  ruins: ['wind', 'creaks', 'spirit'],
  swamp: ['frogs', 'insects', 'mist'],
  tundra: ['wind', 'wolves', 'ice'],
  volcanic: ['lava', 'rumble', 'steam'],
};

// Music intensity levels
export type MusicIntensity = 'calm' | 'normal' | 'intense' | 'combat';

// Crossfade duration
const CROSSFADE_DURATION = 3000; // ms
const MAX_AMBIENT_LAYERS = 6;

class AmbientAudioEngine {
  private audioContext: AudioContext | null = null;
  private ambientLayers: Map<string, AmbientLayer> = new Map();
  private musicState: MusicState = {
    currentTrack: null,
    transitionProgress: 0,
    targetTrack: null,
    pendingTransition: false,
  };
  private currentBiome: BiomeAmbient | null = null;
  private playerProximity: number = 1;
  private isInitialized = false;

  // Initialize engine
  init(): void {
    if (this.isInitialized) return;

    // Hook into SoundManager
    this.audioContext = (soundManager as unknown as { audioContext?: AudioContext }).audioContext ?? null;
    this.isInitialized = true;
  }

  // Set current biome for ambient selection
  setBiome(biome: BiomeAmbient): void {
    if (this.currentBiome === biome) return;

    this.currentBiome = biome;
    this.updateAmbientLayers(biome);
  }

  // Update ambient layers based on biome
  private updateAmbientLayers(biome: BiomeAmbient): void {
    // Clear old layers
    this.ambientLayers.clear();

    // Add new ambient layers
    const sounds = BIOME_AMBIENTS[biome] ?? [];
    sounds.slice(0, MAX_AMBIENT_LAYERS).forEach((sound, index) => {
      this.ambientLayers.set(sound, {
        id: sound,
        volume: 0.3 - index * 0.04,
        playbackRate: 0.8 + Math.random() * 0.4,
        pan: (Math.random() - 0.5) * 0.6,
        muted: false,
      });
    });
  }

  // Set player proximity to sounds (0-1 for distance)
  setPlayerProximity(proximity: number): void {
    this.playerProximity = Math.max(0, Math.min(1, proximity));
    this.applyProximityVolume();
  }

  // Apply proximity-based volume adjustment
  private applyProximityVolume(): void {
    for (const layer of this.ambientLayers.values()) {
      // Louder when closer
      const proximityBoost = this.playerProximity * 0.3;
      layer.volume = Math.min(0.5, layer.volume + proximityBoost);
    }
  }

  // Play music track with crossfade
  playMusic(track: MusicTrack, intensity: MusicIntensity = 'normal'): void {
    if (this.musicState.currentTrack === track) return;

    // Start transition
    this.musicState.targetTrack = track;
    this.musicState.pendingTransition = true;
    this.musicState.transitionProgress = 0;

    // Execute crossfade after short delay
    setTimeout(() => {
      if (this.musicState.targetTrack) {
        this.musicState.currentTrack = this.musicState.targetTrack;
        this.musicState.targetTrack = null;
        this.musicState.pendingTransition = false;
      }
    }, CROSSFADE_DURATION);
  }

  // Stop music
  stopMusic(): void {
    this.musicState.currentTrack = null;
    this.musicState.targetTrack = null;
    this.musicState.pendingTransition = false;
  }

  // Get current track
  getCurrentTrack(): MusicTrack | null {
    return this.musicState.currentTrack;
  }

  // Get ambient layer by ID
  getAmbientLayer(id: string): AmbientLayer | undefined {
    return this.ambientLayers.get(id);
  }

  // Set layer volume
  setLayerVolume(id: string, volume: number): void {
    const layer = this.ambientLayers.get(id);
    if (layer) {
      layer.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // Set layer mute
  setLayerMuted(id: string, muted: boolean): void {
    const layer = this.ambientLayers.get(id);
    if (layer) {
      layer.muted = muted;
    }
  }

  // Get all active ambient layers
  getActiveLayers(): AmbientLayer[] {
    return Array.from(this.ambientLayers.values()).filter(l => !l.muted);
  }

  // Get all available biomes
  getAvailableBiomes(): BiomeAmbient[] {
    return Object.keys(BIOME_AMBIENTS) as BiomeAmbient[];
  }

  // Mute/unmute all ambient
  setMuted(muted: boolean): void {
    for (const layer of this.ambientLayers.values()) {
      layer.muted = muted;
    }
  }
}

// Singleton instance
export const ambientAudioEngine = new AmbientAudioEngine();

export default ambientAudioEngine;