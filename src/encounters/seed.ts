/**
 * Canvas 13 - Encounter Seed Generation
 * 
 * Deterministic seed generation for encounter consistency
 * Same inputs always produce same encounter
 */

import type { EncounterContext, Force } from './types';

// ============================================================================
// SEED GENERATION
// ============================================================================

/**
 * Simple string hash function for deterministic seeds
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate encounter seed from context
 * 
 * Formula: hash(worldSeed | day | hour | tilePos | partiesHash)
 * This ensures identical context produces identical encounter
 */
export function generateEncounterSeed(context: EncounterContext): string {
  const components = [
    context.worldSeed,
    context.day.toString(),
    context.hour.toString(),
    `${context.tilePos.q},${context.tilePos.r}`,
    context.regionId,
    hashParties([context.playerParty, ...context.hostileForces])
  ];
  
  // Add optional context
  if (context.onRoad) {
    components.push('road');
    if (context.roadType) {
      components.push(context.roadType);
    }
  }
  
  if (context.structureId) {
    components.push(context.structureId);
  }
  
  if (context.contractId) {
    components.push(context.contractId);
  }
  
  // Hash all components together
  const combined = components.join('|');
  return combined;
}

/**
 * Hash parties for seed generation
 */
function hashParties(forces: Force[]): string {
  return forces
    .map(force => {
      const unitIds = force.units.map(u => u.id).sort().join(',');
      return `${force.side}:${force.factionId ?? 'none'}:${unitIds}`;
    })
    .join('|');
}

/**
 * Generate numeric seed from string seed
 */
export function seedToNumber(seed: string): number {
  return hashString(seed);
}

/**
 * Generate encounter ID (unique identifier)
 */
export function generateEncounterId(context: EncounterContext): string {
  const seed = generateEncounterSeed(context);
  const hash = hashString(seed);
  return `enc_${hash.toString(36)}_${context.day}_${context.hour}`;
}

/**
 * Generate terrain seed for board generation
 */
export function generateTerrainSeed(encounterId: string, boardKind: string): number {
  return hashString(`${encounterId}|terrain|${boardKind}`);
}

/**
 * Generate loot seed for deterministic drops
 */
export function generateLootSeed(encounterId: string, winner: string): number {
  return hashString(`${encounterId}|loot|${winner}`);
}

/**
 * Generate objective seed
 */
export function generateObjectiveSeed(encounterId: string, objectiveType: string): number {
  return hashString(`${encounterId}|objective|${objectiveType}`);
}

// ============================================================================
// SEEDED RANDOM NUMBER GENERATOR
// ============================================================================

/**
 * Seeded random number generator for deterministic encounters
 * Uses Linear Congruential Generator (LCG) algorithm
 */
export class EncounterRNG {
  private seed: number;
  private current: number;
  
  // LCG parameters (from Numerical Recipes)
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = 2 ** 32;
  
  constructor(seed: number | string) {
    this.seed = typeof seed === 'string' ? seedToNumber(seed) : seed;
    this.current = this.seed;
  }
  
  /**
   * Get next random number (0-1)
   */
  next(): number {
    this.current = (this.a * this.current + this.c) % this.m;
    return this.current / this.m;
  }
  
  /**
   * Get random integer in range [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /**
   * Get random float in range [min, max]
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  /**
   * Roll dice (e.g., 2d6 = roll(2, 6))
   */
  roll(count: number, sides: number): number {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += this.nextInt(1, sides);
    }
    return total;
  }
  
  /**
   * Pick random element from array
   */
  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
  
  /**
   * Shuffle array (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  /**
   * Pick N unique random elements from array
   */
  sample<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  }
  
  /**
   * Reset RNG to initial seed
   */
  reset(): void {
    this.current = this.seed;
  }
  
  /**
   * Get current seed
   */
  getSeed(): number {
    return this.seed;
  }
}

// ============================================================================
// SEED VALIDATION
// ============================================================================

/**
 * Validate encounter seed consistency
 * Used for testing and debugging
 */
export function validateSeed(
  context1: EncounterContext,
  context2: EncounterContext
): boolean {
  const seed1 = generateEncounterSeed(context1);
  const seed2 = generateEncounterSeed(context2);
  return seed1 === seed2;
}

/**
 * Generate seed report for debugging
 */
export function getSeedReport(context: EncounterContext): {
  seed: string;
  hash: number;
  encounterId: string;
  components: Record<string, string>;
} {
  const seed = generateEncounterSeed(context);
  const hash = seedToNumber(seed);
  const encounterId = generateEncounterId(context);
  
  return {
    seed,
    hash,
    encounterId,
    components: {
      worldSeed: context.worldSeed,
      day: context.day.toString(),
      hour: context.hour.toString(),
      position: `${context.tilePos.q},${context.tilePos.r}`,
      regionId: context.regionId,
      parties: hashParties([context.playerParty, ...context.hostileForces])
    }
  };
}

// ============================================================================
// ENCOUNTER CHANCE CALCULATION
// ============================================================================

/**
 * Calculate encounter chance with deterministic seed
 * Returns consistent chance for same context
 */
export function calculateEncounterChance(
  context: EncounterContext,
  baseDensity: number
): number {
  const rng = new EncounterRNG(generateEncounterSeed(context));
  
  // Base chance modified by context
  let chance = baseDensity;
  
  // Time of day modifier
  const timeModifiers = {
    dawn: 1.2,    // Ambush time
    day: 1.0,     // Normal
    dusk: 1.3,    // Ambush time
    night: 0.7    // Reduced patrols
  };
  chance *= timeModifiers[context.weather === 'fog' ? 'dusk' : 'day'] ?? 1.0;
  
  // Weather modifier
  const weatherModifiers = {
    clear: 1.0,
    rain: 0.8,
    snow: 0.6,
    fog: 1.4,     // Ambushes more likely
    storm: 0.5,
    heat: 1.1,
    cold: 0.9
  };
  chance *= weatherModifiers[context.weather] ?? 1.0;
  
  // Road modifier (safer on roads, except at specific features)
  if (context.onRoad) {
    if (context.roadType === 'bridge' || context.roadType === 'ford') {
      chance *= 1.5; // Chokepoints are dangerous
    } else {
      chance *= 0.7; // Roads are patrolled
    }
  } else {
    chance *= 1.2; // Off-road is more dangerous
  }
  
  // Recent battles increase patrols
  if (context.recentBattles && context.recentBattles > 0) {
    chance *= 1.0 + (context.recentBattles * 0.1); // +10% per recent battle
  }
  
  // Faction tension
  if (context.factionTension) {
    chance *= 1.0 + context.factionTension; // Up to +100% at max tension
  }
  
  // Rumors/fear increase encounters
  if (context.rumors && context.rumors.length > 0) {
    chance *= 1.0 + (context.rumors.length * 0.05); // +5% per active rumor
  }
  
  // Add deterministic variation (±20%)
  const variation = rng.nextFloat(-0.2, 0.2);
  chance *= 1.0 + variation;
  
  // Clamp to valid range
  return Math.max(0, Math.min(1.0, chance));
}

/**
 * Roll for encounter using deterministic seed
 */
export function rollEncounter(
  context: EncounterContext,
  encounterChance: number
): boolean {
  const rng = new EncounterRNG(generateEncounterSeed(context));
  return rng.next() < encounterChance;
}
