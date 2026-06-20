// Sound Manager - Web Audio API based sound system

export type SoundType = 
  | 'click' | 'hover' | 'success' | 'error' | 'levelUp' 
  | 'questComplete' | 'battle' | 'magic' | 'heal' | 'coin'
  | 'dialogue' | 'travel' | 'save' | 'notification'
  | 'mapOpen' | 'mapWaypoint';

export type MusicTrack = 'main' | 'battle' | 'exploration' | 'mystery' | 'triumph';

interface SoundSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
  musicEnabled: boolean;
}

class SoundManager {
  private audioContext: AudioContext | null = null;
  private settings: SoundSettings = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    muted: false,
    musicEnabled: true
  };
  private currentMusic: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private isInitialized = false;

  // Sound synthesis configurations
  private soundConfigs: Record<SoundType, () => void> = {
    click: () => this.playTone(800, 0.05, 'sine', 0.1),
    hover: () => this.playTone(400, 0.03, 'sine', 0.05),
    success: () => this.playArpeggio([523.25, 659.25, 783.99, 1046.50], 0.1),
    error: () => this.playTone(200, 0.2, 'sawtooth', 0.2),
    levelUp: () => this.playArpeggio([261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50], 0.15),
    questComplete: () => this.playArpeggio([440, 554.37, 659.25, 880], 0.2),
    battle: () => this.playTone(150, 0.3, 'sawtooth', 0.3),
    magic: () => this.playSweep(400, 800, 0.5),
    heal: () => this.playArpeggio([523.25, 659.25, 783.99], 0.3),
    coin: () => this.playTone(1200, 0.1, 'sine', 0.1),
    dialogue: () => this.playTone(600, 0.05, 'sine', 0.08),
    travel: () => this.playNoise(0.5),
    save: () => this.playArpeggio([523.25, 659.25], 0.15),
    notification: () => this.playTone(880, 0.15, 'sine', 0.15),
    mapOpen: () => this.playSweep(220, 520, 0.22),
    mapWaypoint: () => this.playArpeggio([660, 880], 0.08)
  };

  private init() {
    if (this.isInitialized) return;
    
    try {
      const Ctor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        console.warn('Web Audio API not supported');
        return;
      }
      this.audioContext = new Ctor();
      this.musicGain = this.audioContext.createGain();
      this.musicGain.connect(this.audioContext.destination);
      this.musicGain.gain.value = this.settings.musicVolume * this.settings.masterVolume;
      this.isInitialized = true;
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, volume: number) {
    if (!this.audioContext || this.settings.muted) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    const finalVolume = volume * this.settings.sfxVolume * this.settings.masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playArpeggio(frequencies: number[], noteDuration: number) {
    if (!this.audioContext || this.settings.muted) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime + index * noteDuration * 0.5);

      const finalVolume = 0.15 * this.settings.sfxVolume * this.settings.masterVolume;
      gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime + index * noteDuration * 0.5);
      gainNode.gain.linearRampToValueAtTime(finalVolume, this.audioContext!.currentTime + index * noteDuration * 0.5 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + index * noteDuration * 0.5 + noteDuration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(this.audioContext!.currentTime + index * noteDuration * 0.5);
      oscillator.stop(this.audioContext!.currentTime + index * noteDuration * 0.5 + noteDuration);
    });
  }

  private playSweep(startFreq: number, endFreq: number, duration: number) {
    if (!this.audioContext || this.settings.muted) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);

    const finalVolume = 0.2 * this.settings.sfxVolume * this.settings.masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playNoise(duration: number) {
    if (!this.audioContext || this.settings.muted) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gainNode = this.audioContext.createGain();
    const finalVolume = 0.1 * this.settings.sfxVolume * this.settings.masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    noise.start(this.audioContext.currentTime);
  }

  // Public methods
  play(sound: SoundType) {
    this.init();
    this.soundConfigs[sound]?.();
  }

  playMusic(track: MusicTrack) {
    this.init();
    if (!this.audioContext || !this.settings.musicEnabled || this.settings.muted) return;

    // Stop current music
    this.stopMusic();

    // Generate procedural music based on track type
    this.generateProceduralMusic(track);
  }

  private generateProceduralMusic(track: MusicTrack) {
    if (!this.audioContext) return;

    const scales: Record<MusicTrack, number[]> = {
      main: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
      battle: [220.00, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25],
      exploration: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00],
      mystery: [207.65, 233.08, 261.63, 277.18, 311.13, 349.23, 369.99, 415.30],
      triumph: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25]
    };

    const tempo = track === 'battle' ? 0.15 : track === 'triumph' ? 0.2 : 0.4;
    const scale = scales[track];

    const playNote = (time: number) => {
      if (!this.audioContext || !this.settings.musicEnabled) return;

      const freq = scale[Math.floor(Math.random() * scale.length)];
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = track === 'battle' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(freq, time);

      const volume = 0.08 * this.settings.musicVolume * this.settings.masterVolume;
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + tempo * 2);

      oscillator.connect(gainNode);
      gainNode.connect(this.musicGain!);

      oscillator.start(time);
      oscillator.stop(time + tempo * 2);

      // Schedule next note
      if (this.settings.musicEnabled) {
        setTimeout(() => playNote(this.audioContext!.currentTime), tempo * 1000);
      }
    };

    playNote(this.audioContext.currentTime);
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  // Settings
  setSettings(newSettings: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.musicGain) {
      this.musicGain.gain.value = this.settings.musicVolume * this.settings.masterVolume;
    }

    // Save to localStorage
    localStorage.setItem('chronos_sound_settings', JSON.stringify(this.settings));
  }

  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('chronos_sound_settings');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SoundSettings>;
        this.settings = { ...this.settings, ...parsed };
      }
    } catch {
      // ignore malformed localStorage payload
    }
  }

  toggleMute() {
    this.setSettings({ muted: !this.settings.muted });
    return this.settings.muted;
  }

  toggleMusic() {
    this.setSettings({ musicEnabled: !this.settings.musicEnabled });
    if (!this.settings.musicEnabled) {
      this.stopMusic();
    }
    return this.settings.musicEnabled;
  }
}

export const soundManager = new SoundManager();
