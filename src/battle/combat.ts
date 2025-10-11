/**
 * Canvas 14 - Combat Math
 * 
 * Hit/crit/damage/status formulas for tactical combat
 */

import type { BattleUnit, AttackResult, StatusEffect, Tile } from './state';
import type { SeededRNG } from './rng';

// ============================================================================
// COMBAT CONSTANTS
// ============================================================================

const BASE_HIT_CHANCE = 75;
const MIN_HIT_CHANCE = 5;
const MAX_HIT_CHANCE = 95;

const MIN_CRIT_CHANCE = 0;
const MAX_CRIT_CHANCE = 50;

const CRIT_DAMAGE_MULTIPLIER = 1.5;

const DAMAGE_VARIANCE_MIN = 0.9;
const DAMAGE_VARIANCE_MAX = 1.1;

// Bonuses
const FLANK_SIDE_BONUS = 10;
const FLANK_REAR_BONUS = 20;
const ELEVATION_BONUS = 10;
const COVER_LOW_BONUS = 10;
const COVER_HIGH_BONUS = 20;
const MAX_COVER_BONUS = 30;

// ============================================================================
// HIT CALCULATION
// ============================================================================

/**
 * Calculate hit chance
 */
export function calculateHitChance(
  attacker: BattleUnit,
  defender: BattleUnit,
  context: CombatContext
): number {
  let chance = BASE_HIT_CHANCE;
  
  // Accuracy vs Evasion
  chance += attacker.acc - defender.eva;
  
  // Flank bonus
  chance += context.flankBonus;
  
  // Elevation bonus
  chance += context.elevationBonus;
  
  // Cover penalty
  chance -= context.coverBonus;
  
  // Status effects
  if (defender.statuses.some(s => s.type === 'blind')) {
    chance += 20;
  }
  
  if (attacker.statuses.some(s => s.type === 'blind')) {
    chance -= 20;
  }
  
  // Clamp to valid range
  return clamp(chance, MIN_HIT_CHANCE, MAX_HIT_CHANCE);
}

/**
 * Roll attack hit check
 */
export function rollHit(hitChance: number, rng: SeededRNG): boolean {
  const roll = rng.d100();
  return roll <= hitChance;
}

// ============================================================================
// CRIT CALCULATION
// ============================================================================

/**
 * Calculate crit chance
 */
export function calculateCritChance(
  attacker: BattleUnit,
  defender: BattleUnit
): number {
  const chance = attacker.crit - defender.resist;
  return clamp(chance, MIN_CRIT_CHANCE, MAX_CRIT_CHANCE);
}

/**
 * Roll crit check
 */
export function rollCrit(critChance: number, rng: SeededRNG): boolean {
  const roll = rng.d100();
  return roll <= critChance;
}

// ============================================================================
// DAMAGE CALCULATION
// ============================================================================

/**
 * Calculate damage
 */
export function calculateDamage(
  attacker: BattleUnit,
  defender: BattleUnit,
  isCrit: boolean,
  weaponMod: number,
  rng: SeededRNG
): number {
  // Base damage
  let damage = attacker.atk - defender.def;
  
  // Apply weapon modifier
  damage *= weaponMod;
  
  // Apply crit multiplier
  if (isCrit) {
    damage *= CRIT_DAMAGE_MULTIPLIER;
  }
  
  // Apply variance
  const variance = rng.nextFloat(DAMAGE_VARIANCE_MIN, DAMAGE_VARIANCE_MAX);
  damage *= variance;
  
  // Minimum 1 damage
  return Math.max(1, Math.floor(damage));
}

/**
 * Execute full attack
 */
export function executeAttack(
  attacker: BattleUnit,
  defender: BattleUnit,
  context: CombatContext,
  rng: SeededRNG
): AttackResult {
  // Calculate hit chance
  const hitChance = calculateHitChance(attacker, defender, context);
  
  // Roll hit
  const hitRoll = rng.d100();
  const hit = hitRoll <= hitChance;
  
  if (!hit) {
    return {
      hit: false,
      crit: false,
      damage: 0,
      hitRoll,
      hitChance,
      damageRoll: 0
    };
  }
  
  // Calculate crit chance
  const critChance = calculateCritChance(attacker, defender);
  
  // Roll crit
  const critRoll = rng.d100();
  const crit = critRoll <= critChance;
  
  // Calculate damage
  const weaponMod = context.weaponMod ?? 1.0;
  const damage = calculateDamage(attacker, defender, crit, weaponMod, rng);
  
  // Check for status application (if weapon has status)
  let statusApplied: StatusEffect | undefined;
  if (context.weaponStatus && rng.check(context.weaponStatus.chance)) {
    statusApplied = {
      ...context.weaponStatus.effect,
      id: `status_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      source: attacker.id
    };
  }
  
  // Gear damage (weapons degrade on use)
  const gearDamage = crit ? 2 : 1;
  
  return {
    hit: true,
    crit,
    damage,
    statusApplied,
    gearDamage,
    hitRoll,
    hitChance,
    critRoll,
    critChance,
    damageRoll: damage
  };
}

// ============================================================================
// COMBAT CONTEXT
// ============================================================================

/**
 * Combat context (positioning modifiers)
 */
export interface CombatContext {
  flankBonus: number;
  elevationBonus: number;
  coverBonus: number;
  weaponMod?: number;
  weaponStatus?: {
    effect: Omit<StatusEffect, 'id' | 'source'>;
    chance: number;
  };
}

/**
 * Calculate combat context from positions
 */
export function calculateCombatContext(
  attacker: BattleUnit,
  defender: BattleUnit,
  attackerTile: Tile,
  defenderTile: Tile
): CombatContext {
  // Flank bonus
  const flankBonus = calculateFlankBonus(attacker, defender);
  
  // Elevation bonus
  const elevationBonus = calculateElevationBonus(attackerTile, defenderTile);
  
  // Cover bonus
  const coverBonus = calculateCoverBonus(defenderTile, elevationBonus);
  
  return {
    flankBonus,
    elevationBonus,
    coverBonus
  };
}

/**
 * Calculate flank bonus
 */
function calculateFlankBonus(attacker: BattleUnit, defender: BattleUnit): number {
  // Calculate angle from defender facing to attacker
  // (simplified - in real impl would use hex.ts angle functions)
  
  // For now, use position delta
  const dq = attacker.pos.q - defender.pos.q;
  const dr = attacker.pos.r - defender.pos.r;
  
  // Simplified flank detection
  // Front arc: facing direction ±60°
  // Side arc: ±60° to ±120°
  // Rear arc: ±120° to ±180°
  
  // This is a stub - proper implementation would use defender.facing
  const angle = Math.atan2(dr, dq);
  const facingAngle = defender.facing * 60; // 0-5 directions
  const angleDiff = Math.abs(angle - facingAngle * Math.PI / 180);
  
  if (angleDiff > 120 * Math.PI / 180) {
    return FLANK_REAR_BONUS; // Rear attack
  } else if (angleDiff > 60 * Math.PI / 180) {
    return FLANK_SIDE_BONUS; // Side attack
  }
  
  return 0; // Front attack
}

/**
 * Calculate elevation bonus
 */
function calculateElevationBonus(attackerTile: Tile, defenderTile: Tile): number {
  const heightDiff = attackerTile.height - defenderTile.height;
  
  if (heightDiff > 0) {
    return ELEVATION_BONUS; // High ground bonus
  } else if (heightDiff < 0) {
    return -ELEVATION_BONUS; // Low ground penalty
  }
  
  return 0;
}

/**
 * Calculate cover bonus
 */
function calculateCoverBonus(defenderTile: Tile, elevationBonus: number): number {
  let bonus = 0;
  
  // Cover provides defense bonus
  if (defenderTile.cover === 'low') {
    bonus += COVER_LOW_BONUS;
  } else if (defenderTile.cover === 'high') {
    bonus += COVER_HIGH_BONUS;
  }
  
  // Cover stacks with elevation (but capped)
  if (elevationBonus > 0) {
    bonus += Math.floor(elevationBonus / 2);
  }
  
  return Math.min(bonus, MAX_COVER_BONUS);
}

// ============================================================================
// STATUS EFFECTS
// ============================================================================

/**
 * Apply status effect to target
 */
export function applyStatus(
  effect: Omit<StatusEffect, 'id' | 'source'>,
  target: BattleUnit,
  caster: BattleUnit,
  rng: SeededRNG
): StatusEffect | null {
  // Base chance
  let chance = effect.strength ?? 50;
  
  // Intelligence vs Wisdom modifier
  const statMod = (caster.atk - target.def) * 2; // Using atk/def as proxy for INT/WIS
  chance += statMod;
  
  // Existing status resistance
  const existingCount = target.statuses.filter(s => s.type === effect.type).length;
  chance -= existingCount * 15;
  
  // Clamp
  chance = clamp(chance, 5, 95);
  
  // Roll
  if (!rng.check(chance)) {
    return null;
  }
  
  // Create status
  const status: StatusEffect = {
    ...effect,
    id: `status_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    source: caster.id,
    strength: effect.strength ?? 1
  };
  
  return status;
}

/**
 * Tick status effects (at end of turn)
 */
export function tickStatusEffects(unit: BattleUnit): {
  damage: number;
  healing: number;
  expired: string[];
} {
  let totalDamage = 0;
  let totalHealing = 0;
  const expired: string[] = [];
  
  for (const status of unit.statuses) {
    // Apply DoT
    if (status.dotDamage) {
      totalDamage += status.dotDamage;
    }
    
    // Apply HoT
    if (status.hotHealing) {
      totalHealing += status.hotHealing;
    }
    
    // Decrement duration
    if (!status.isPermanent && status.duration > 0) {
      status.duration -= 1;
      
      if (status.duration <= 0) {
        expired.push(status.id);
      }
    }
  }
  
  // Remove expired statuses
  unit.statuses = unit.statuses.filter(s => !expired.includes(s.id));
  
  return {
    damage: totalDamage,
    healing: totalHealing,
    expired
  };
}

/**
 * Get total stat modifiers from statuses
 */
export function getStatModifiers(unit: BattleUnit): Partial<Record<string, number>> {
  const mods: Partial<Record<string, number>> = {};
  
  for (const status of unit.statuses) {
    if (status.statMods) {
      for (const [stat, value] of Object.entries(status.statMods)) {
        mods[stat] = (mods[stat] ?? 0) + value;
      }
    }
  }
  
  return mods;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Clamp value to range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
