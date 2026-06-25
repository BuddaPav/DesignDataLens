// Combat Engine - Enhanced combat with abilities and combos

import type { Entity } from '@/types/combat';

// Combat types
export type CombatZoneType = 'normal' | 'flank' | 'elevated' | 'hazard' | 'cover';

export interface Position {
  x: number;
  y: number;
}

export interface CombatZone {
  position: Position;
  type: CombatZoneType;
  defenseBonus: number;
  damageBonus: number;
}

// Combat state
export interface CombatState {
  round: number;
  activeEntity: 'player' | 'enemy';
  terrain: CombatZoneType;
  zones: CombatZone[];
  playerPosition: Position;
  enemyPosition: Position;
  initiative: 'player' | 'enemy';
}

// Ability definition
export interface Ability {
  id: string;
  name: string;
  description: string;
  damage: number;
  manaCost: number;
  cooldown: number;
  type: 'attack' | 'defense' | 'heal' | 'utility';
  range: 'melee' | 'ranged' | 'self';
  combo?: string[];
  effects?: string[];
}

// Combo definition
export interface Combo {
  id: string;
  name: string;
  sequence: string[];
  bonus: {
    damageMultiplier: number;
    effect?: string;
    description: string;
  };
}

// Player abilities (default)
export const PLAYER_ABILITIES: Ability[] = [
  {
    id: 'strike',
    name: 'Strike',
    description: 'Basic sword attack',
    damage: 10,
    manaCost: 0,
    cooldown: 0,
    type: 'attack',
    range: 'melee',
  },
  {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'Strong melee attack',
    damage: 25,
    manaCost: 15,
    cooldown: 3,
    type: 'attack',
    range: 'melee',
  },
  {
    id: 'slash',
    name: 'Slash',
    description: 'Wide arc attack',
    damage: 15,
    manaCost: 10,
    cooldown: 2,
    type: 'attack',
    range: 'melee',
  },
  {
    id: 'block',
    name: 'Block',
    description: 'Defensive stance',
    damage: 0,
    manaCost: 5,
    cooldown: 2,
    type: 'defense',
    range: 'self',
  },
  {
    id: 'heal',
    name: 'Heal',
    description: 'Restore health',
    damage: -20,
    manaCost: 20,
    cooldown: 5,
    type: 'heal',
    range: 'self',
  },
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Ranged fire attack',
    damage: 35,
    manaCost: 30,
    cooldown: 4,
    type: 'attack',
    range: 'ranged',
  },
  {
    id: 'dash',
    name: 'Dash',
    description: 'Quick movement',
    damage: 0,
    manaCost: 10,
    cooldown: 3,
    type: 'utility',
    range: 'self',
  },
];

// Known combos
export const COMBOS: Combo[] = [
  {
    id: 'sword_dance',
    name: 'Sword Dance',
    sequence: ['strike', 'slash', 'strike'],
    bonus: {
      damageMultiplier: 1.5,
      effect: 'knockback',
      description: 'Knocks enemy back',
    },
  },
  {
    id: 'power_combo',
    name: 'Power Combo',
    sequence: ['block', 'power_strike', 'dash'],
    bonus: {
      damageMultiplier: 2.0,
      effect: 'stun',
      description: 'Stuns enemy for 1 round',
    },
  },
  {
    id: 'heal_burst',
    name: 'Heal Burst',
    sequence: ['dash', 'heal', 'heal'],
    bonus: {
      damageMultiplier: 1.5,
      effect: ' overheal',
      description: 'Extra healing',
    },
  },
];

// Combat state
let combatState: CombatState | null = null;

// Initialize combat
export function initCombat(
  terrain: CombatZoneType = 'normal'
): CombatState {
  combatState = {
    round: 1,
    activeEntity: 'player',
    terrain,
    zones: generateZones(terrain),
    playerPosition: { x: 0, y: 0 },
    enemyPosition: { x: 1, y: 0 },
    initiative: 'player',
  };

  return combatState;
}

// Generate combat zones based on terrain
function generateZones(terrain: CombatZoneType): CombatZone[] {
  const zones: CombatZone[] = [];

  if (terrain === 'cover') {
    zones.push(
      { position: { x: -1, y: 0 }, type: 'cover', defenseBonus: 30, damageBonus: 0 },
      { position: { x: 1, y: 0 }, type: 'cover', defenseBonus: 30, damageBonus: 0 }
    );
  } else if (terrain === 'elevated') {
    zones.push(
      { position: { x: 0, y: -1 }, type: 'elevated', defenseBonus: 10, damageBonus: 20 }
    );
  } else if (terrain === 'hazard') {
    zones.push(
      { position: { x: 1, y: 1 }, type: 'hazard', defenseBonus: -10, damageBonus: 10 }
    );
  }

  return zones;
}

// Get current state
export function getCombatState(): CombatState | null {
  return combatState;
}

// Get ability by ID
export function getAbility(id: string): Ability | undefined {
  return PLAYER_ABILITIES.find(a => a.id === id);
}

// Check combo completion
export function checkCombo(sequence: string[]): Combo | null {
  for (const combo of COMBOS) {
    if (combo.sequence.length !== sequence.length) continue;

    let match = true;
    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] !== combo.sequence[i]) {
        match = false;
        break;
      }
    }

    if (match) return combo;
  }

  return null;
}

// Calculate damage with positioning bonus
export function calculateDamage(
  ability: Ability,
  attackerPos: Position,
  defenderPos: Position,
  zones: CombatZone[]
): number {
  let damage = ability.damage;

  // Check attacker zone bonus
  const attackerZone = zones.find(
    z => z.position.x === attackerPos.x && z.position.y === attackerPos.y
  );
  if (attackerZone) {
    damage += attackerZone.damageBonus;
  }

  // Check defender zone bonus
  const defenderZone = zones.find(
    z => z.position.x === defenderPos.x && z.position.y === defenderPos.y
  );
  if (defenderZone) {
    damage -= defenderZone.defenseBonus;
  }

  return Math.max(0, damage);
}

// Move entity
export function moveEntity(
  entity: 'player' | 'enemy',
  newPos: Position
): boolean {
  if (!combatState) return false;

  // Check if position is valid (not in hazard without protection)
  const zone = combatState.zones.find(
    z => z.position.x === newPos.x && z.position.y === newPos.y
  );

  if (zone?.type === 'hazard') {
    return false;
  }

  if (entity === 'player') {
    combatState.playerPosition = newPos;
  } else {
    combatState.enemyPosition = newPos;
  }

  return true;
}

// Get position bonus
export function getPositionBonus(
  entity: 'player' | 'enemy'
): { defense: number; damage: number } {
  if (!combatState) return { defense: 0, damage: 0 };

  const pos = entity === 'player'
    ? combatState.playerPosition
    : combatState.enemyPosition;

  const zone = combatState.zones.find(
    z => z.position.x === pos.x && z.position.y === pos.y
  );

  return zone
    ? { defense: zone.defenseBonus, damage: zone.damageBonus }
    : { defense: 0, damage: 0 };
}

// End combat
export function endCombat(): void {
  combatState = null;
}

// Export
export const combatEngine = {
  initCombat,
  getCombatState,
  getAbility,
  checkCombo,
  calculateDamage,
  moveEntity,
  getPositionBonus,
  endCombat,
};

export default combatEngine;