// Mod Support Engine - Plugin system for modding support

export type ModStatus = 'disabled' | 'enabled' | 'error' | 'loading';

export interface ModManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  dependencies?: string[];
  conflicts?: string[];
  loadOrder: number;
}

export interface ModInfo extends ModManifest {
  status: ModStatus;
  error?: string;
  enabled: boolean;
}

// Mod API exposed to mods
export interface ModAPI {
  // Register content
  registerNPC: (npc: unknown) => void;
  registerQuest: (quest: unknown) => void;
  registerItem: (item: unknown) => void;
  registerAbility: (ability: unknown) => void;
  registerLootTable: (table: string, items: unknown[]) => void;

  // Hooks
  onInit: (callback: () => void) => void;
  onSave: (callback: (data: unknown) => void) => void;
  onLoad: (callback: (data: unknown) => void) => void;
  onTick: (callback: (delta: number) => void) => void;
  onDialogue: (callback: (npcId: string, playerText: string) => string) => void;
  onCombat: (callback: (action: unknown) => unknown) => void;

  // Utilities
  getGameState: () => unknown;
  log: (msg: string) => void;
}

// Mod storage
const MODS_DIR = '/mods';
const STORAGE_KEY = 'chronos_mods';

class ModSupportEngine {
  private mods: Map<string, ModInfo> = new Map();
  private loadOrder: string[] = [];
  private modAPIs: Map<string, ModAPI> = new Map();
  private hooks: Map<string, Function[]> = new Map();

  // Register mod
  register(mod: ModManifest): void {
    const existing = this.mods.get(mod.id);
    this.mods.set(mod.id, {
      ...mod,
      status: 'disabled',
      enabled: false,
    });

    if (!existing) {
      this.recalculateLoadOrder();
    }
  }

  // Enable mod
  enable(modId: string): boolean {
    const mod = this.mods.get(modId);
    if (!mod) return false;

    // Check dependencies
    for (const dep of mod.dependencies ?? []) {
      if (!this.mods.get(dep)?.enabled) {
        mod.status = 'error';
        mod.error = `Missing dependency: ${dep}`;
        return false;
      }
    }

    // Check conflicts
    for (const conflict of mod.conflicts ?? []) {
      if (this.mods.get(conflict)?.enabled) {
        mod.status = 'error';
        mod.error = `Conflicts with: ${conflict}`;
        return false;
      }
    }

    mod.status = 'enabled';
    mod.enabled = true;
    return true;
  }

  // Disable mod
  disable(modId: string): void {
    const mod = this.mods.get(modId);
    if (mod) {
      mod.status = 'disabled';
      mod.enabled = false;
    }

    // Disable dependents
    for (const [id, m] of this.mods) {
      if (m.dependencies?.includes(modId) && m.enabled) {
        this.disable(id);
      }
    }
  }

  // Load mod from file
  async loadFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const mod = JSON.parse(text) as ModManifest;

      if (!mod.id || !mod.name) {
        console.error('[ModSupport] Invalid mod manifest');
        return false;
      }

      this.register(mod);
      return this.enable(mod.id);
    } catch (err) {
      console.error('[ModSupport] Failed to load mod:', err);
      return false;
    }
  }

  // Load mod from URL
  async loadFromURL(url: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      const mod = await response.json() as ModManifest;

      this.register(mod);
      return this.enable(mod.id);
    } catch (err) {
      console.error('[ModSupport] Failed to load mod from URL:', err);
      return false;
    }
  }

  // Get mod info
  getMod(modId: string): ModInfo | undefined {
    return this.mods.get(modId);
  }

  // Get all mods
  getAllMods(): ModInfo[] {
    return this.loadOrder.map(id => this.mods.get(id)!).filter(Boolean);
  }

  // Get enabled mods
  getEnabledMods(): ModInfo[] {
    return this.getAllMods().filter(m => m.enabled);
  }

  // Recalculate load order
  private recalculateLoadOrder(): void {
    this.loadOrder = Array.from(this.mods.keys()).sort((a, b) => {
      const ma = this.mods.get(a)!;
      const mb = this.mods.get(b)!;
      return ma.loadOrder - mb.loadOrder;
    });
  }

  // Create mod API
  createModAPI(modId: string): ModAPI {
    const api: ModAPI = {
      registerNPC: (npc) => console.log(`[${modId}] registerNPC`, npc),
      registerQuest: (quest) => console.log(`[${modId}] registerQuest`, quest),
      registerItem: (item) => console.log(`[${modId}] registerItem`, item),
      registerAbility: (ability) => console.log(`[${modId}] registerAbility`, ability),
      registerLootTable: (table, items) =>
        console.log(`[${modId}] registerLootTable`, table, items),
      onInit: (cb) => this.addHook(`${modId}:init`, cb),
      onSave: (cb) => this.addHook(`${modId}:save`, cb),
      onLoad: (cb) => this.addHook(`${modId}:load`, cb),
      onTick: (cb) => this.addHook(`${modId}:tick`, cb),
      onDialogue: (cb) => this.addHook(`${modId}:dialogue`, cb),
      onCombat: (cb) => this.addHook(`${modId}:combat`, cb),
      getGameState: () => ({}),
      log: (msg) => console.log(`[Mod:${modId}]`, msg),
    };

    this.modAPIs.set(modId, api);
    return api;
  }

  // Add hook
  private addHook(event: string, callback: Function): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push(callback);
  }

  // Trigger hook
  triggerHook(event: string, ...args: unknown[]): unknown[] {
    const callbacks = this.hooks.get(event) ?? [];
    const results: unknown[] = [];

    for (const cb of callbacks) {
      try {
        results.push(cb(...args));
      } catch (err) {
        console.error(`[ModSupport] Hook error in ${event}:`, err);
      }
    }

    return results;
  }

  // Save enabled mods list
  saveEnabledMods(): void {
    const enabled = this.getEnabledMods().map(m => m.id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
    } catch {
      console.warn('[ModSupport] Failed to save enabled mods');
    }
  }

  // Load enabled mods list
  loadEnabledMods(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const enabled = JSON.parse(raw) as string[];
      for (const modId of enabled) {
        this.enable(modId);
      }
    } catch {
      console.warn('[ModSupport] Failed to load enabled mods');
    }
  }

  // Uninstall mod
  uninstall(modId: string): void {
    this.disable(modId);
    this.mods.delete(modId);
    this.modAPIs.delete(modId);
    this.recalculateLoadOrder();
  }
}

// Singleton
export const modSupportEngine = new ModSupportEngine();

export default modSupportEngine;