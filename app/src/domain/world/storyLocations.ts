import type { Location } from '@/types/game';

export const STORY_LOCATIONS: Location[] = [
  {
    id: 'starting_village',
    name: 'Willbrook Village',
    type: 'city',
    description:
      'A small village nestled between rolling hills and an ancient forest. The air smells of hearth fires and freshly baked bread.',
    atmosphere: {
      mood: 'peaceful',
      lighting: 'golden',
      sounds: ['birds', 'wind', 'distant chatter'],
      music: 'ambient_peaceful',
    },
    connectedLocations: ['whispering_forest', 'old_ruins', 'misty_crossroads', 'river_port'],
    npcs: ['elara', 'thorin'],
    pointsOfInterest: [
      {
        id: 'village_inn',
        name: 'The Hearthstone Inn',
        type: 'building',
        description: 'A cozy inn with a warm fire',
        interactable: true,
      },
      {
        id: 'village_square',
        name: 'Village Square',
        type: 'landmark',
        description: 'The heart of the village',
        interactable: true,
      },
    ],
    secrets: [],
  },
  {
    id: 'misty_crossroads',
    name: 'Misty Crossroads',
    type: 'landmark',
    description: 'A windworn crossroads where traders and wanderers swap rumors under a pale sky.',
    atmosphere: {
      mood: 'watchful',
      lighting: 'silver',
      sounds: ['wind', 'distant hooves', 'whispers'],
      music: 'ambient_mysterious',
    },
    connectedLocations: ['starting_village', 'whispering_forest', 'old_ruins', 'river_port', 'ember_hills'],
    npcs: [],
    pointsOfInterest: [
      {
        id: 'crossroads_stone',
        name: 'Waystone',
        type: 'landmark',
        description: 'An old stone with chipped runes',
        interactable: true,
      },
    ],
    secrets: [],
  },
  {
    id: 'whispering_forest',
    name: 'Whispering Forest',
    type: 'forest',
    description: 'Ancient trees tower overhead, their leaves whispering secrets in a language only the wind understands.',
    atmosphere: {
      mood: 'mysterious',
      lighting: 'dappled',
      sounds: ['rustling leaves', 'distant whispers', 'creaking wood'],
      music: 'ambient_mysterious',
    },
    connectedLocations: ['starting_village', 'old_ruins', 'misty_crossroads', 'sunken_marsh'],
    npcs: ['vesper'],
    pointsOfInterest: [
      {
        id: 'ancient_oak',
        name: 'The Ancient Oak',
        type: 'landmark',
        description: 'A tree older than memory',
        interactable: true,
      },
      {
        id: 'hidden_grove',
        name: 'Hidden Grove',
        type: 'entrance',
        description: 'Something glimmers in the shadows',
        interactable: true,
      },
    ],
    secrets: [
      {
        id: 'forest_secret_1',
        content: 'The forest is alive and watches all who enter',
        knownBy: [],
        discoveredByPlayer: false,
        revealConditions: [],
      },
    ],
  },
  {
    id: 'old_ruins',
    name: 'Forgotten Ruins',
    type: 'ruins',
    description: 'Crumbling stone walls bear witness to a civilization long past. Magic lingers here, old and dangerous.',
    atmosphere: {
      mood: 'ominous',
      lighting: 'shadowy',
      sounds: ['howling wind', 'stone grinding', 'echoes'],
      music: 'ambient_dark',
    },
    connectedLocations: ['starting_village', 'whispering_forest', 'misty_crossroads', 'ember_hills'],
    npcs: ['mortimer'],
    pointsOfInterest: [
      {
        id: 'ruined_temple',
        name: 'Ruined Temple',
        type: 'building',
        description: 'A temple to forgotten gods',
        interactable: true,
      },
      {
        id: 'underground_entrance',
        name: 'Dark Passage',
        type: 'entrance',
        description: 'Stairs descend into darkness',
        interactable: true,
      },
    ],
    secrets: [
      {
        id: 'ruins_secret_1',
        content: 'An ancient power sleeps beneath the ruins',
        knownBy: ['mortimer'],
        discoveredByPlayer: false,
        revealConditions: [],
      },
    ],
  },
  {
    id: 'river_port',
    name: 'River Port',
    type: 'coast',
    description: 'Wharves and rope bridges line a broad river bend where barges exchange cargo day and night.',
    atmosphere: {
      mood: 'busy',
      lighting: 'warm',
      sounds: ['water', 'rigging', 'market chatter'],
      music: 'ambient_peaceful',
    },
    connectedLocations: ['starting_village', 'misty_crossroads', 'sunken_marsh'],
    npcs: [],
    pointsOfInterest: [
      {
        id: 'port_quay',
        name: 'Cargo Quay',
        type: 'landmark',
        description: 'Stacks of crates and tarred ropes.',
        interactable: true,
      },
    ],
    secrets: [],
  },
  {
    id: 'sunken_marsh',
    name: 'Sunken Marsh',
    type: 'forest',
    description: 'Flooded roots, pale reeds, and old road markers swallowed by black water.',
    atmosphere: {
      mood: 'tense',
      lighting: 'dim',
      sounds: ['insects', 'water drips', 'frogs'],
      music: 'ambient_mysterious',
    },
    connectedLocations: ['whispering_forest', 'river_port', 'ember_hills'],
    npcs: [],
    pointsOfInterest: [
      {
        id: 'marsh_causeway',
        name: 'Broken Causeway',
        type: 'landmark',
        description: 'Stone slabs disappearing into the mire.',
        interactable: true,
      },
    ],
    secrets: [],
  },
  {
    id: 'ember_hills',
    name: 'Ember Hills',
    type: 'mountain',
    description: 'A chain of ash-gray ridges dotted with abandoned kiln pits and hot vents.',
    atmosphere: {
      mood: 'wary',
      lighting: 'flickering',
      sounds: ['wind gusts', 'stone cracks', 'distant thunder'],
      music: 'ambient_dark',
    },
    connectedLocations: ['old_ruins', 'misty_crossroads', 'sunken_marsh'],
    npcs: [],
    pointsOfInterest: [
      {
        id: 'ember_watch',
        name: 'Ember Watch',
        type: 'landmark',
        description: 'A ruined signal tower above the ridge.',
        interactable: true,
      },
    ],
    secrets: [],
  },
];

export const STORY_LOCATION_IDS = new Set(STORY_LOCATIONS.map((l) => l.id));

export function getStoryLocationById(locationId: string): Location | undefined {
  return STORY_LOCATIONS.find((l) => l.id === locationId);
}

export function isStoryLocationConnected(fromId: string, toId: string): boolean {
  if (fromId === toId) return true;
  const from = getStoryLocationById(fromId);
  return !!from?.connectedLocations.includes(toId);
}

export function sanitizeDiscoveredLocations(input: string[] | undefined): string[] {
  const src = Array.isArray(input) ? input : [];
  const out: string[] = [];
  for (const id of src) {
    if (!STORY_LOCATION_IDS.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  if (!out.includes('starting_village')) out.unshift('starting_village');
  return out;
}
