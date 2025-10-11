/**
 * Canvas 13 - Encounter Context Builder
 * 
 * Gathers world data to create EncounterContext for deterministic generation
 */

import type {
  EncounterContext,
  Force,
  Weather,
  EncounterDensity,
  DetectionParams,
  StealthCheck
} from './types';
import type { PartyMember } from '../party/types';
import type { Stack } from '../econ/types';

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

/**
 * World state needed for context building
 */
export interface WorldState {
  worldSeed: string;
  day: number;
  hour: number;
  weather: Weather;
  playerPosition: { q: number; r: number };
  regionId: string;
  biome: string;
  roughness: number;
}

/**
 * Create encounter context from world state
 */
export function createEncounterContext(
  world: WorldState,
  playerParty: PartyMember[],
  hostileForces: Force[],
  options?: {
    onRoad?: boolean;
    roadType?: string;
    structureId?: string;
    rumors?: string[];
    recentBattles?: number;
    factionTension?: number;
    convoy?: Stack[];
    contractId?: string;
    neutralForces?: Force[];
  }
): EncounterContext {
  // Convert player party to Force
  const playerForce: Force = {
    side: 'A',
    regionId: world.regionId,
    units: playerParty.map(member => ({
      id: member.id,
      name: member.name,
      level: member.level,
      hp: member.hp,
      maxHp: member.maxHp,
      ap: 0, // Will be set by tactical system
      maxAp: 10, // Default
      status: member.scars ?? [],
      gear: member.gear
    })),
    morale: calculateAverageMorale(playerParty),
    supply: 100, // Assume full supply
    commander: playerParty[0]?.id // First member is commander
  };
  
  return {
    regionId: world.regionId,
    tilePos: world.playerPosition,
    biome: world.biome,
    roughness: world.roughness,
    day: world.day,
    hour: world.hour,
    weather: world.weather,
    playerParty: playerForce,
    hostileForces,
    worldSeed: world.worldSeed,
    ...options
  };
}

/**
 * Calculate average morale for party
 */
function calculateAverageMorale(party: PartyMember[]): number {
  if (party.length === 0) return 50;
  
  const total = party.reduce((sum, member) => sum + (member.morale ?? 50), 0);
  return Math.floor(total / party.length);
}

// ============================================================================
// ENCOUNTER DENSITY CALCULATION
// ============================================================================

/**
 * Calculate encounter density factors for a location
 */
export function calculateEncounterDensity(
  context: EncounterContext,
  ruinDistance: number = 999,  // Distance to nearest ruin
  baseChance: number = 0.1      // Base 10% per hour
): EncounterDensity {
  // Ruin proximity increases encounters
  const ruinModifier = ruinDistance < 5 ? 2.0 : ruinDistance < 10 ? 1.5 : 1.0;
  
  // Road type modifier
  let roadModifier = 1.0;
  if (context.onRoad) {
    roadModifier = 0.7; // Safer on roads
    if (context.roadType === 'bridge' || context.roadType === 'ford') {
      roadModifier = 1.5; // Chokepoints are ambush spots
    }
  } else {
    roadModifier = 1.2; // Off-road more dangerous
  }
  
  // Faction presence (would come from Canvas 09 AI)
  const factionPresence = context.factionTension ?? 0.5;
  
  // Recent battles increase patrols
  const recentBattles = context.recentBattles ?? 0;
  
  // Rumors increase fear and encounters
  const rumorsModifier = 1.0 + ((context.rumors?.length ?? 0) * 0.05);
  
  // Time of day affects encounters
  const timeOfDayModifier = {
    dawn: 1.2,
    day: 1.0,
    dusk: 1.3,
    night: 0.7
  }[getTimeOfDay(context.hour)] ?? 1.0;
  
  return {
    baseChance,
    ruinModifier,
    roadModifier,
    factionPresence,
    recentBattles,
    rumorsModifier,
    timeOfDayModifier
  };
}

/**
 * Calculate final encounter chance per hour
 */
export function getFinalEncounterChance(density: EncounterDensity): number {
  let chance = density.baseChance;
  
  chance *= density.ruinModifier;
  chance *= density.roadModifier;
  chance *= (1.0 + density.factionPresence);
  chance *= (1.0 + (density.recentBattles * 0.1));
  chance *= density.rumorsModifier;
  chance *= density.timeOfDayModifier;
  
  return Math.max(0, Math.min(1.0, chance));
}

// ============================================================================
// TIME & WEATHER HELPERS
// ============================================================================

/**
 * Get time of day from hour
 */
export function getTimeOfDay(hour: number): 'dawn' | 'day' | 'dusk' | 'night' {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

/**
 * Get weather visibility modifier
 */
export function getWeatherVisibility(weather: Weather): number {
  const modifiers = {
    clear: 1.0,
    rain: 0.7,
    snow: 0.6,
    fog: 0.4,
    storm: 0.5,
    heat: 1.0,
    cold: 1.0
  };
  return modifiers[weather] ?? 1.0;
}

/**
 * Get time of day visibility modifier
 */
export function getTimeVisibility(hour: number): number {
  const timeOfDay = getTimeOfDay(hour);
  const modifiers = {
    dawn: 0.6,
    day: 1.0,
    dusk: 0.6,
    night: 0.3
  };
  return modifiers[timeOfDay] ?? 1.0;
}

// ============================================================================
// DETECTION SYSTEM
// ============================================================================

/**
 * Calculate detection parameters
 */
export function calculateDetectionParams(
  context: EncounterContext,
  baseSightRange: number = 10
): DetectionParams {
  const lightModifier = getTimeVisibility(context.hour);
  const weatherModifier = getWeatherVisibility(context.weather);
  const terrainModifier = context.roughness > 0.5 ? 0.7 : 1.0; // Rough terrain reduces sight
  
  const effectiveRange = baseSightRange * lightModifier * weatherModifier * terrainModifier;
  
  return {
    baseRange: effectiveRange,
    lightModifier,
    weatherModifier,
    terrainModifier
  };
}

/**
 * Check if party is detected
 */
export function checkDetection(
  distance: number,
  detectionParams: DetectionParams,
  stealthBonus: number = 0
): boolean {
  const effectiveRange = detectionParams.baseRange + stealthBonus;
  return distance <= effectiveRange;
}

// ============================================================================
// STEALTH SYSTEM
// ============================================================================

/**
 * Calculate stealth bonus
 */
export function calculateStealthBonus(
  context: EncounterContext,
  partySize: number,
  stealthSkill: number = 0
): number {
  let bonus = stealthSkill;
  
  // Time of day bonus
  const timeOfDay = getTimeOfDay(context.hour);
  if (timeOfDay === 'night') bonus += 5;
  if (timeOfDay === 'dawn' || timeOfDay === 'dusk') bonus += 2;
  
  // Weather bonus
  if (context.weather === 'fog') bonus += 5;
  if (context.weather === 'rain' || context.weather === 'snow') bonus += 2;
  
  // Terrain bonus
  if (context.roughness > 0.5) bonus += 3;
  if (context.biome === 'forest' || context.biome === 'swamp') bonus += 3;
  
  // Party size penalty
  bonus -= Math.floor(partySize / 2);
  
  return bonus;
}

/**
 * Roll stealth check
 */
export function rollStealthCheck(
  stealthBonus: number,
  detectionDC: number = 15,
  seed: string
): StealthCheck {
  // Simple deterministic roll (would use EncounterRNG in practice)
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const roll = (Math.abs(hash) % 20) + 1; // d20
  
  const total = roll + stealthBonus;
  const success = total >= detectionDC;
  const margin = total - detectionDC;
  
  // Critical failure (nat 1) always detected
  const detected = roll === 1 || (!success && margin < -5);
  
  return {
    success,
    margin,
    detected,
    penalty: detected ? 'Critical failure or large margin' : undefined
  };
}

// ============================================================================
// FLEE CHANCE CALCULATION
// ============================================================================

/**
 * Calculate chance to successfully flee encounter
 */
export function calculateFleeChance(
  playerParty: Force,
  hostileForces: Force[],
  context: EncounterContext
): number {
  // Base 50% flee chance
  let chance = 0.5;
  
  // Level difference modifier
  const playerAvgLevel = playerParty.units.reduce((sum, u) => sum + u.level, 0) / playerParty.units.length;
  const enemyAvgLevel = hostileForces.reduce((sum, f) => 
    sum + (f.units.reduce((s, u) => s + u.level, 0) / f.units.length), 0
  ) / hostileForces.length;
  
  const levelDiff = playerAvgLevel - enemyAvgLevel;
  chance += levelDiff * 0.05; // ±5% per level difference
  
  // Morale affects flee success
  if (playerParty.morale > 70) chance += 0.1; // High morale helps coordination
  if (playerParty.morale < 30) chance -= 0.1; // Low morale causes panic
  
  // Time of day modifier (easier to flee at night)
  const timeOfDay = getTimeOfDay(context.hour);
  if (timeOfDay === 'night') chance += 0.15;
  if (timeOfDay === 'dawn' || timeOfDay === 'dusk') chance += 0.05;
  
  // Weather helps escape
  if (context.weather === 'fog') chance += 0.2;
  if (context.weather === 'rain' || context.weather === 'snow') chance += 0.1;
  if (context.weather === 'storm') chance += 0.15;
  
  // Terrain modifier
  if (context.roughness > 0.5) chance += 0.1; // Easier to break line of sight
  
  // On road is harder to flee (enemy can pursue easily)
  if (context.onRoad) chance -= 0.1;
  
  // Carrying convoy reduces flee chance
  if (context.convoy && context.convoy.length > 0) {
    chance -= 0.2; // Heavy cargo slows retreat
  }
  
  return Math.max(0.05, Math.min(0.95, chance)); // Clamp to 5-95%
}

// ============================================================================
// PARLEY CHANCE CALCULATION
// ============================================================================

/**
 * Calculate chance for successful parley
 */
export function calculateParleyChance(
  playerParty: Force,
  hostileForces: Force[],
  reputation: number = 0,
  charisma: number = 10
): number {
  // Base 30% parley chance
  let chance = 0.3;
  
  // Reputation with faction
  chance += reputation / 200; // ±50% at ±100 reputation
  
  // Charisma bonus
  chance += (charisma - 10) * 0.02; // +2% per point above 10
  
  // Party size difference (harder to parley when outnumbered)
  const playerSize = playerParty.units.length;
  const enemySize = hostileForces.reduce((sum, f) => sum + f.units.length, 0);
  const sizeDiff = playerSize - enemySize;
  chance += sizeDiff * 0.05; // ±5% per unit difference
  
  // Morale affects confidence
  if (playerParty.morale > 70) chance += 0.1;
  if (playerParty.morale < 30) chance -= 0.15; // Desperation reduces credibility
  
  // Cannot parley with certain faction types (would be data-driven)
  // This is a stub - real implementation would check faction traits
  
  return Math.max(0.05, Math.min(0.9, chance)); // Clamp to 5-90%
}

// ============================================================================
// BRIBE COST CALCULATION
// ============================================================================

/**
 * Calculate gold needed to bribe enemies away
 */
export function calculateBribeCost(
  hostileForces: Force[],
  playerGold: number
): number {
  // Base cost per enemy
  const totalEnemies = hostileForces.reduce((sum, f) => sum + f.units.length, 0);
  const avgLevel = hostileForces.reduce((sum, f) => 
    sum + (f.units.reduce((s, u) => s + u.level, 0) / f.units.length), 0
  ) / hostileForces.length;
  
  // 50g per enemy, scaled by level
  const baseCost = totalEnemies * 50 * (1 + avgLevel * 0.1);
  
  // Factions have different susceptibility to bribes
  // Honorable factions cost more, mercenaries cost less
  const factionModifier = 1.0; // Stub - would be data-driven
  
  const finalCost = Math.ceil(baseCost * factionModifier);
  
  // Cannot bribe if you don't have enough gold
  return Math.min(finalCost, playerGold);
}

/**
 * Check if bribe is possible
 */
export function canBribe(
  hostileForces: Force[],
  playerGold: number
): boolean {
  const cost = calculateBribeCost(hostileForces, playerGold);
  return playerGold >= cost && cost > 0;
}
