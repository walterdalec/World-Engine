/**
 * Canvas 13 - Encounter Payload Builder
 * 
 * Generates deterministic EncounterPayload from EncounterContext
 */

import type {
  EncounterContext,
  EncounterPayload,
  BoardKind,
  BoardConfig,
  Objective,
  ObjectiveType,
  Stake
} from './types';
import { generateEncounterId, generateTerrainSeed } from './seed';

// ============================================================================
// MAIN PAYLOAD BUILDER
// ============================================================================

/**
 * Create complete EncounterPayload from context
 */
export function createEncounterPayload(
  context: EncounterContext,
  options?: {
    forceObjective?: ObjectiveType;
    forceBoardKind?: BoardKind;
    customStakes?: Stake[];
  }
): EncounterPayload {
  // Generate deterministic seed and ID
  const id = generateEncounterId(context);
  
  // Determine board type
  const boardKind = options?.forceBoardKind ?? determineBoardKind(context);
  const terrainSeed = generateTerrainSeed(id, boardKind);
  
  // Create board configuration
  const board = createBoardConfig(boardKind, context);
  
  // Generate objectives
  const objectives = options?.forceObjective 
    ? [createObjective(options.forceObjective)]
    : generateObjectives(context, boardKind);
  
  // Calculate stakes
  const stakes = options?.customStakes ?? calculateStakes(context);
  
  // Convert hour to TimeOfDay
  const timeOfDay = getTimeOfDay(context.hour);
  
  return {
    id,
    terrainSeed,
    weather: context.weather,
    timeOfDay,
    board,
    attacker: context.hostileForces[0], // Primary hostile force
    defender: context.playerParty,
    neutrals: context.neutralForces,
    objectives,
    stakes,
    encounteredAt: context.day
  };
}

/**
 * Convert hour (0-23) to TimeOfDay enum
 */
function getTimeOfDay(hour: number): import('./types').TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

// ============================================================================
// BOARD TYPE DETERMINATION
// ============================================================================

/**
 * Determine board type from context
 */
export function determineBoardKind(context: EncounterContext): BoardKind {
  // Roads with structures
  if (context.onRoad) {
    if (context.roadType === 'bridge') return 'bridge';
    if (context.roadType === 'pass') return 'pass';
  }
  
  // Structures
  if (context.structureId) {
    if (context.structureId.includes('ruin')) return 'ruin';
    if (context.structureId.includes('town')) return 'town';
  }
  
  // Biome-based defaults
  if (context.biome === 'forest' || context.biome === 'swamp') return 'forest';
  if (context.biome === 'desert') return 'desert';
  if (context.biome === 'underground') return 'underground';
  if (context.roughness > 0.7) return 'pass';
  
  // Default to open field
  return 'field';
}

/**
 * Create board configuration
 */
export function createBoardConfig(
  kind: BoardKind,
  context: EncounterContext
): BoardConfig {
  // Elevation hint
  const elevationHint = context.roughness > 0.7 ? 4 : context.roughness > 0.4 ? 2 : 0;
  
  // Density varies by board kind
  const densityMap: Record<BoardKind, number> = {
    field: 0.1,
    forest: 0.7,
    bridge: 0.3,
    pass: 0.4,
    ruin: 0.5,
    town: 0.8,
    swamp: 0.6,
    desert: 0.2,
    underground: 0.7,
    coast: 0.3
  };
  
  // Visibility by board kind and weather
  const baseVisibility = kind === 'forest' ? 8 : kind === 'town' ? 6 : 12;
  const weatherMod = context.weather === 'fog' ? 0.4 : context.weather === 'rain' ? 0.7 : 1.0;
  
  return {
    kind,
    elevationHint,
    roughness: context.roughness,
    density: densityMap[kind] ?? 0.3,
    visibility: Math.floor(baseVisibility * weatherMod)
  };
}

// ============================================================================
// OBJECTIVE GENERATION
// ============================================================================

/**
 * Generate objectives based on context
 */
export function generateObjectives(
  context: EncounterContext,
  boardKind: BoardKind
): Objective[] {
  const objectives: Objective[] = [];
  
  // Primary objective based on encounter type
  if (context.convoy && context.convoy.length > 0) {
    objectives.push(createObjective('escort'));
  } else if (boardKind === 'town' || boardKind === 'ruin') {
    objectives.push(createObjective('hold'));
  } else if (context.contractId) {
    objectives.push(createObjective('destroy'));
  } else {
    objectives.push(createObjective('rout'));
  }
  
  // Secondary objectives (30% chance)
  if (Math.random() < 0.3) {
    objectives.push(createObjective('survive'));
  }
  
  return objectives;
}

/**
 * Create objective of specific kind
 */
export function createObjective(
  type: ObjectiveType
): Objective {
  const baseObjectives: Record<ObjectiveType, Objective> = {
    rout: {
      type: 'rout',
      description: 'Defeat all enemy forces',
      required: true,
      bonus: 100
    },
    hold: {
      type: 'hold',
      description: 'Hold position for 10 turns',
      required: true,
      turns: 10,
      bonus: 150
    },
    escort: {
      type: 'escort',
      description: 'Escort convoy to safety',
      required: true,
      target: 'convoy_unit',
      bonus: 200
    },
    destroy: {
      type: 'destroy',
      description: 'Destroy enemy siege equipment',
      required: true,
      target: 'siege_engine',
      bonus: 150
    },
    survive: {
      type: 'survive',
      description: 'Keep at least 3 units alive',
      required: false,
      turns: 20,
      bonus: 50
    },
    capture: {
      type: 'capture',
      description: 'Capture the strategic point',
      required: true,
      target: 'hex_center',
      bonus: 150
    },
    rescue: {
      type: 'rescue',
      description: 'Rescue captured ally',
      required: true,
      target: 'prisoner_unit',
      bonus: 200
    },
    assassinate: {
      type: 'assassinate',
      description: 'Eliminate enemy commander',
      required: false,
      target: 'commander_unit',
      bonus: 300
    }
  };
  
  return baseObjectives[type];
}

// ============================================================================
// STAKES CALCULATION
// ============================================================================

/**
 * Calculate stakes for encounter
 */
export function calculateStakes(
  context: EncounterContext
): Stake[] {
  const stakes: Stake[] = [];
  
  // Convoy stakes
  if (context.convoy && context.convoy.length > 0) {
    stakes.push({
      type: 'convoy',
      description: 'Cargo value at risk',
      value: context.convoy.length * 100, // Approximation
      loserLoses: 'All cargo plundered'
    });
  }
  
  // Contract stakes
  if (context.contractId) {
    stakes.push({
      type: 'contract',
      description: 'Contract payment',
      value: 500,
      winnerGains: 'Full contract payment',
      loserLoses: 'Contract fails'
    });
  }
  
  // Reputation stakes (always present)
  const reputationValue = context.hostileForces.reduce((sum, f) => 
    sum + (f.units.length * 10), 0
  );
  
  stakes.push({
    type: 'reputation',
    description: 'Reputation with local factions',
    value: reputationValue,
    winnerGains: 'Reputation increase',
    loserLoses: 'Reputation decrease'
  });
  
  // Region control stakes (if in contested area)
  if (context.factionTension && context.factionTension > 0.7) {
    stakes.push({
      type: 'region',
      description: 'Regional influence',
      value: 1,
      winnerGains: 'Faction gains influence',
      loserLoses: 'Faction loses influence'
    });
  }
  
  return stakes;
}

// ============================================================================
// ENCOUNTER DIFFICULTY RATING
// ============================================================================

/**
 * Calculate encounter difficulty rating (for UI display)
 */
export function calculateDifficulty(context: EncounterContext): {
  rating: 'trivial' | 'easy' | 'normal' | 'hard' | 'deadly';
  score: number;
} {
  const playerPower = context.playerParty.units.reduce((sum, u) => 
    sum + (u.level * u.level), 0
  );
  
  const enemyPower = context.hostileForces.reduce((sum, f) => 
    sum + f.units.reduce((s, u) => s + (u.level * u.level), 0), 0
  );
  
  const ratio = enemyPower / playerPower;
  
  let rating: 'trivial' | 'easy' | 'normal' | 'hard' | 'deadly';
  if (ratio < 0.5) rating = 'trivial';
  else if (ratio < 0.8) rating = 'easy';
  else if (ratio < 1.2) rating = 'normal';
  else if (ratio < 1.8) rating = 'hard';
  else rating = 'deadly';
  
  return { rating, score: Math.round(ratio * 100) };
}

/**
 * Get estimated battle duration in turns
 */
export function estimateDuration(context: EncounterContext): number {
  const totalUnits = context.playerParty.units.length + 
    context.hostileForces.reduce((sum, f) => sum + f.units.length, 0);
  
  // Rough estimate: 2 turns per unit, clamped
  return Math.max(5, Math.min(20, totalUnits * 2));
}

/**
 * Calculate expected casualties for player
 */
export function estimateCasualties(context: EncounterContext): {
  deaths: number;
  injuries: number;
} {
  const difficulty = calculateDifficulty(context);
  const playerSize = context.playerParty.units.length;
  
  const deathRate = {
    trivial: 0.0,
    easy: 0.1,
    normal: 0.25,
    hard: 0.4,
    deadly: 0.6
  }[difficulty.rating];
  
  const injuryRate = {
    trivial: 0.1,
    easy: 0.3,
    normal: 0.5,
    hard: 0.7,
    deadly: 0.9
  }[difficulty.rating];
  
  return {
    deaths: Math.floor(playerSize * deathRate),
    injuries: Math.floor(playerSize * injuryRate)
  };
}
