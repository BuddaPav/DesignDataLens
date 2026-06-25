// Cloud Save Engine - Cloud-based save system with sync and conflict resolution

import type { SavedPlayerData } from '@/domain/save/crossLocationSave';

// Save data structure
export interface CloudSaveData {
  id: string;
  playerId: string;
  timestamp: number;
  version: string;
  worldData: SavedPlayerData;
  settings: Record<string, unknown>;
  achievements: string[];
  questProgress: Record<string, number>;
  factionReputation: Record<string, number>;
}

// Cloud save metadata
export interface CloudSaveMetadata {
  id: string;
  playerId: string;
  timestamp: number;
  version: string;
  size: number;
}

// Sync status
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'conflict';

// Conflict resolution
export interface SaveConflict {
  cloud: CloudSaveData;
  local: CloudSaveData;
  resolution: 'cloud' | 'local' | 'merge';
}

// Cloud config
interface CloudConfig {
  endpoint: string;
  apiKey: string;
  maxRetries: number;
  syncInterval: number; // ms
}

const DEFAULT_CONFIG: CloudConfig = {
  endpoint: '/api/cloud-sync',
  apiKey: '',
  maxRetries: 3,
  syncInterval: 60000, // 1 minute
};

const STORAGE_KEY = 'chronos_cloud_save';
const MAX_LOCAL_SAVES = 5;

class CloudSaveEngine {
  private config: CloudConfig = { ...DEFAULT_CONFIG };
  private status: SyncStatus = 'idle';
  private lastSync: number = 0;
  private pendingSave: CloudSaveData | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: SyncStatus, error?: Error) => void> = new Set();

  // Initialize
  init(config?: Partial<CloudConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Start auto-sync
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => this.autoSync(), this.config.syncInterval);
  }

  // Shutdown
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Set API key
  setApiKey(key: string): void {
    this.config.apiKey = key;
  }

  // Set endpoint
  setEndpoint(endpoint: string): void {
    this.config.endpoint = endpoint;
  }

  // Manual save to cloud
  async save(data: CloudSaveData): Promise<boolean> {
    if (!this.config.apiKey) {
      console.warn('[CloudSave] No API key configured');
      return false;
    }

    this.status = 'syncing';
    this.notifyListeners();

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        this.status = 'success';
        this.lastSync = Date.now();
        this.notifyListeners();
        return true;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    // Save locally as fallback
    this.status = 'error';
    this.pendingSave = data;
    this.saveLocally(data);
    this.notifyListeners(lastError ?? undefined);
    return false;
  }

  // Load from cloud
  async load(playerId: string): Promise<CloudSaveData | null> {
    if (!this.config.apiKey) {
      console.warn('[CloudSave] No API key configured');
      return this.loadLocal(playerId);
    }

    this.status = 'syncing';
    this.notifyListeners();

    try {
      const response = await fetch(
        `${this.config.endpoint}?playerId=${encodeURIComponent(playerId)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      this.status = 'success';
      this.notifyListeners();
      return data;
    } catch {
      // Fallback to local
      return this.loadLocal(playerId);
    }
  }

  // Get save list
  async getSaveList(playerId: string): Promise<CloudSaveMetadata[]> {
    if (!this.config.apiKey) {
      return this.getLocalSaveList(playerId);
    }

    try {
      const response = await fetch(
        `${this.config.endpoint}/list?playerId=${encodeURIComponent(playerId)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );

      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }

  // Check for conflicts
  async checkConflict(playerId: string): Promise<SaveConflict | null> {
    try {
      const local = this.loadLocal(playerId);
      if (!local) return null;

      // Check timestamps
      const list = await this.getSaveList(playerId);
      const cloudSave = list?.[0];
      if (!cloudSave) return null;

      if (cloudSave.timestamp > local.timestamp + 60000) {
        // Cloud is newer (more than 1 min ahead) - potential conflict
        const cloudData = await this.load(playerId);
        if (!cloudData) return null;

        return {
          cloud: cloudData,
          local,
          resolution: 'cloud', // Default to cloud
        };
      }
    } catch {
      // Ignore
    }
    return null;
  }

  // Resolve conflict
  async resolveConflict(conflict: SaveConflict): Promise<CloudSaveData> {
    if (conflict.resolution === 'cloud') {
      return conflict.cloud;
    } else if (conflict.resolution === 'local') {
      return conflict.local;
    }

    // Merge logic - combine achievements, keep higher quest progress
    const merged = { ...conflict.cloud };

    // Merge achievements (unique)
    const allAchievements = new Set([
      ...conflict.cloud.achievements,
      ...conflict.local.achievements,
    ]);
    merged.achievements = Array.from(allAchievements);

    // Merge quest progress (max values)
    merged.questProgress = {
      ...conflict.cloud.questProgress,
      ...conflict.local.questProgress,
    };
    for (const key in conflict.local.questProgress) {
      merged.questProgress[key] = Math.max(
        merged.questProgress[key] ?? 0,
        conflict.local.questProgress[key]
      );
    }

    // Merge faction reputation (max values)
    merged.factionReputation = {
      ...conflict.cloud.factionReputation,
      ...conflict.local.factionReputation,
    };
    for (const key in conflict.local.factionReputation) {
      merged.factionReputation[key] = Math.max(
        merged.factionReputation[key] ?? 0,
        conflict.local.factionReputation[key]
      );
    }

    return merged;
  }

  // Auto-sync on interval
  private async autoSync(): Promise<void> {
    if (!this.pendingSave) return;
    await this.save(this.pendingSave);
    this.pendingSave = null;
  }

  // Local storage helpers
  private saveLocally(data: CloudSaveData): void {
    try {
      const key = `${STORAGE_KEY}_${data.playerId}`;
      localStorage.setItem(key, JSON.stringify(data));

      // Keep only last N saves
      const saves = this.getLocalSaveList(data.playerId);
      if (saves.length > MAX_LOCAL_SAVES) {
        const oldest = saves.sort((a, b) => a.timestamp - b.timestamp)[0];
        localStorage.removeItem(`${STORAGE_KEY}_${oldest.id}`);
      }
    } catch {
      console.warn('[CloudSave] Local save failed');
    }
  }

  private loadLocal(playerId: string): CloudSaveData | null {
    try {
      const key = `${STORAGE_KEY}_${playerId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private getLocalSaveList(playerId: string): CloudSaveMetadata[] {
    const saves: CloudSaveMetadata[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${STORAGE_KEY}_`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) ?? '{}');
          if (data.playerId === playerId) {
            saves.push({
              id: data.id,
              playerId: data.playerId,
              timestamp: data.timestamp,
              version: data.version,
              size: JSON.stringify(data).length,
            });
          }
        } catch {
          // Ignore
        }
      }
    }
    return saves.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Subscribe to status changes
  subscribe(listener: (status: SyncStatus, error?: Error) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(error?: Error): void {
    for (const listener of this.listeners) {
      try {
        listener(this.status, error);
      } catch {
        // Ignore
      }
    }
  }

  // Get status
  getStatus(): SyncStatus {
    return this.status;
  }

  // Get last sync time
  getLastSync(): number {
    return this.lastSync;
  }
}

// Singleton
export const cloudSaveEngine = new CloudSaveEngine();

export default cloudSaveEngine;