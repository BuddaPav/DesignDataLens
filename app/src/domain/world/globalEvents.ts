// Global Events System - World events that change independently

export type EventType = 'war' | 'disaster' | 'politics' | 'economy' | 'festival' | 'invasion';

export interface GlobalEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  factions: string[];
  startTime: number;
  endTime?: number;
  effects: EventEffect[];
  visible: boolean;
  repeating: boolean;
  interval?: number;
}

export interface EventEffect {
  type: 'reputation' | 'availability' | 'price' | 'spawn' | 'dialogue' | 'unlock';
  target: string;
  value: number;
  duration?: number;
}

export interface ActiveEvent extends GlobalEvent {
  isActive: boolean;
  progress: number;
}

// Storage
const events = new Map<string, GlobalEvent>();
const activeEvents = new Map<string, ActiveEvent>();

// Register event
export function registerEvent(event: GlobalEvent): void {
  events.set(event.id, event);
}

// Start event
export function startEvent(eventId: string): ActiveEvent | null {
  const event = events.get(eventId);
  if (!event) return null;

  const active: ActiveEvent = {
    ...event,
    isActive: true,
    progress: 0,
  };

  activeEvents.set(eventId, active);
  return active;
}

// End event
export function endEvent(eventId: string): boolean {
  const active = activeEvents.get(eventId);
  if (!active) return false;

  active.isActive = false;
  active.endTime = Date.now();
  activeEvents.delete(eventId);

  return true;
}

// Get active events
export function getActiveEvents(): ActiveEvent[] {
  return Array.from(activeEvents.values()).filter(e => e.isActive);
}

// Get event by ID
export function getEvent(eventId: string): GlobalEvent | null {
  return events.get(eventId) ?? null;
}

// Get events by type
export function getEventsByType(type: EventType): GlobalEvent[] {
  return Array.from(events.values()).filter(e => e.type === type);
}

// Get events for faction
export function getFactionEvents(factionId: string): ActiveEvent[] {
  return Array.from(activeEvents.values()).filter(
    e => e.isActive && e.factions.includes(factionId)
  );
}

// Apply event effects
export function applyEventEffects(eventId: string): EventEffect[] {
  const active = activeEvents.get(eventId);
  if (!active || !active.isActive) return [];

  return active.effects;
}

// Predefined events
export const DEFAULT_EVENTS: GlobalEvent[] = [
  {
    id: 'verdant_iron_war',
    type: 'war',
    title: 'War of Verdant and Iron',
    description: 'Military conflict between Verdant and Iron factions',
    factions: ['verdant', 'iron'],
    startTime: 0,
    effects: [
      { type: 'reputation', target: 'verdant', value: -10 },
      { type: 'reputation', target: 'iron', value: -10 },
      { type: 'spawn', target: 'enemy_soldier', value: 5 },
    ],
    visible: true,
    repeating: false,
  },
  {
    id: 'grand_festival',
    type: 'festival',
    title: 'Grand Festival',
    description: 'Annual celebration with special vendors and events',
    factions: ['verdant', 'iron', 'veiled', 'shadow'],
    startTime: 0,
    effects: [
      { type: 'price', target: 'merchant', value: 0.8 },
      { type: 'unlock', target: 'festival_merchant', value: 1 },
    ],
    visible: true,
    repeating: true,
    interval: 86400000 * 30, // 30 days
  },
  {
    id: 'earthquake',
    type: 'disaster',
    title: 'Earthquake Strikes',
    description: 'A powerful earthquake rocks the region',
    factions: [],
    startTime: 0,
    effects: [
      { type: 'availability', target: 'market', value: -50 },
      { type: 'spawn', target: 'rubble', value: 10 },
    ],
    visible: true,
    repeating: false,
  },
  {
    id: 'market_crash',
    type: 'economy',
    title: 'Market Crash',
    description: 'Economic downturn affects all trade',
    factions: [],
    startTime: 0,
    effects: [
      { type: 'price', target: 'luxury_goods', value: 2.0 },
      { type: 'price', target: 'essential_goods', value: 1.5 },
    ],
    visible: true,
    repeating: false,
  },
  {
    id: 'shadow_invasion',
    type: 'invasion',
    title: 'Shadow Forces Invade',
    description: 'Dark forces emerge from the shadows',
    factions: ['shadow', 'verdant', 'iron'],
    startTime: 0,
    effects: [
      { type: 'spawn', target: 'shadow_soldier', value: 10 },
      { type: 'reputation', target: 'shadow', value: 15 },
    ],
    visible: true,
    repeating: true,
    interval: 86400000 * 7, // weekly
  },
];

// Initialize default events
export function initializeEvents(): void {
  for (const event of DEFAULT_EVENTS) {
    registerEvent(event);
  }
}

// Check if location affected
export function isLocationAffected(
  location: string,
  eventId: string
): boolean {
  const active = activeEvents.get(eventId);
  if (!active || !active.isActive) return false;

  // Events affect all locations unless specified
  return true;
}

// Get event progress
export function getEventProgress(eventId: string): number {
  const active = activeEvents.get(eventId);
  return active?.progress ?? 0;
}

// Update event progress
export function updateEventProgress(
  eventId: string,
  progress: number
): void {
  const active = activeEvents.get(eventId);
  if (active) {
    active.progress = Math.min(100, progress);
  }
}

// Export
export const globalEvents = {
  registerEvent,
  startEvent,
  endEvent,
  getActiveEvents,
  getEvent,
  getEventsByType,
  getFactionEvents,
  applyEventEffects,
  initializeEvents,
  isLocationAffected,
  getEventProgress,
  updateEventProgress,
};

export default globalEvents;