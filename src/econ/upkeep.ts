/**
 * Canvas 12 - Upkeep & Wages
 * 
 * Daily costs for party members, mounts, food, and debt management
 */

import type { Upkeep, WageDebt } from './types';
import type { PartyMember } from '../party/types';

// ============================================================================
// WAGE CALCULATIONS
// ============================================================================

/**
 * Base wage per party member per day (by level)
 */
export function calculateMemberWage(member: PartyMember): number {
  const level = member.level ?? 1;
  
  // Base wage scales with level: 5g at L1, increases by 3g per level
  const baseWage = 5 + (level - 1) * 3;
  
  // Return the member's upkeep cost if defined, otherwise use calculated base wage
  return member.upkeep ?? baseWage;
}

/**
 * Calculate wages for entire party
 */
export function calculatePartyWages(party: PartyMember[]): number {
  return party.reduce((total, member) => {
    return total + calculateMemberWage(member);
  }, 0);
}

// ============================================================================
// MOUNT & VEHICLE COSTS
// ============================================================================

/**
 * Daily cost per mount (stabling and feed)
 */
export const MOUNT_DAILY_COST = 2; // 2g per mount per day

/**
 * Daily cost per wagon (maintenance)
 */
export const WAGON_DAILY_COST = 1; // 1g per wagon per day

/**
 * Calculate mount upkeep
 */
export function calculateMountUpkeep(mountCount: number): number {
  return mountCount * MOUNT_DAILY_COST;
}

/**
 * Calculate wagon upkeep
 */
export function calculateWagonUpkeep(wagonCount: number): number {
  return wagonCount * WAGON_DAILY_COST;
}

// ============================================================================
// FOOD & PROVISIONS
// ============================================================================

/**
 * Daily food cost per party member
 */
export const FOOD_COST_PER_PERSON = 1; // 1g per person per day

/**
 * Calculate food costs for party
 */
export function calculateFoodCost(partySize: number, quality: 'poor' | 'normal' | 'good' = 'normal'): number {
  const baseCost = partySize * FOOD_COST_PER_PERSON;
  
  const qualityMultiplier = {
    poor: 0.5,   // 0.5g per person, morale penalty
    normal: 1.0, // 1g per person, no effect
    good: 2.0    // 2g per person, morale bonus
  };
  
  return Math.ceil(baseCost * qualityMultiplier[quality]);
}

/**
 * Get food quality morale modifier
 */
export function getFoodQualityMoraleModifier(quality: 'poor' | 'normal' | 'good'): number {
  return {
    poor: -5,   // -5 morale per day
    normal: 0,  // No change
    good: +2    // +2 morale per day
  }[quality];
}

// ============================================================================
// UPKEEP CALCULATION
// ============================================================================

/**
 * Calculate total daily upkeep
 */
export function calculateUpkeep(
  party: PartyMember[],
  mounts: number,
  wagons: number,
  foodQuality: 'poor' | 'normal' | 'good' = 'normal'
): Upkeep {
  const wages = calculatePartyWages(party);
  const food = calculateFoodCost(party.length, foodQuality);
  const mountCosts = calculateMountUpkeep(mounts);
  const wagonCosts = calculateWagonUpkeep(wagons);
  
  return {
    wages,
    food,
    mounts: mountCosts,
    wagons: wagonCosts,
    total: wages + food + mountCosts + wagonCosts
  };
}

/**
 * Calculate upkeep for multiple days
 */
export function calculateMultiDayUpkeep(
  upkeep: Upkeep,
  days: number
): number {
  return upkeep.total * days;
}

// ============================================================================
// WAGE DEBT MANAGEMENT
// ============================================================================

/**
 * Create wage debt
 */
export function createWageDebt(amount: number): WageDebt {
  return {
    amount,
    days: 0,
    moralePenalty: 0
  };
}

/**
 * Update wage debt for a new day
 */
export function updateWageDebt(debt: WageDebt | undefined, shortfall: number): WageDebt | undefined {
  if (shortfall <= 0 && !debt) {
    return undefined; // No debt
  }
  
  if (shortfall > 0) {
    // Add to existing debt or create new
    const currentDebt = debt ?? createWageDebt(0);
    
    return {
      amount: currentDebt.amount + shortfall,
      days: currentDebt.days + 1,
      moralePenalty: calculateDebtMoralePenalty(currentDebt.days + 1)
    };
  } else if (debt) {
    // No new shortfall, existing debt remains
    return {
      ...debt,
      days: debt.days + 1,
      moralePenalty: calculateDebtMoralePenalty(debt.days + 1)
    };
  }
  
  return undefined;
}

/**
 * Pay off wage debt
 */
export function payWageDebt(debt: WageDebt, payment: number): WageDebt | undefined {
  const remaining = debt.amount - payment;
  
  if (remaining <= 0) {
    return undefined; // Debt fully paid
  }
  
  return {
    ...debt,
    amount: remaining
  };
}

/**
 * Calculate morale penalty from unpaid wages
 */
export function calculateDebtMoralePenalty(days: number): number {
  // -5 morale per day, up to -50 morale at 10 days
  return Math.min(-5 * days, -50);
}

/**
 * Check if debt triggers desertion risk
 */
export function isDesertionRisk(debt: WageDebt): boolean {
  // Desertion risk after 7 days of unpaid wages
  return debt.days >= 7;
}

/**
 * Calculate desertion chance per day
 */
export function calculateDesertionChance(debt: WageDebt, morale: number): number {
  if (!isDesertionRisk(debt)) return 0;
  
  // Base 5% at 7 days, +5% per day after, modified by morale
  const daysOverdue = debt.days - 7;
  const baseChance = 0.05 + (daysOverdue * 0.05);
  
  // Low morale increases chance, high morale reduces it
  const moraleModifier = (50 - morale) / 100; // -0.5 to +0.5
  
  return Math.max(0, Math.min(1.0, baseChance + moraleModifier));
}

// ============================================================================
// UPKEEP PROCESSING
// ============================================================================

/**
 * Process daily upkeep payment
 * Returns remaining gold and updated debt
 */
export function processUpkeep(
  treasury: number,
  upkeep: Upkeep,
  debt: WageDebt | undefined
): {
  remainingGold: number;
  debt: WageDebt | undefined;
  paid: boolean;
} {
  const totalOwed = upkeep.total;
  
  if (treasury >= totalOwed) {
    // Can afford upkeep
    return {
      remainingGold: treasury - totalOwed,
      debt: undefined,
      paid: true
    };
  } else {
    // Cannot afford upkeep
    const shortfall = totalOwed - treasury;
    const updatedDebt = updateWageDebt(debt, shortfall);
    
    return {
      remainingGold: 0, // Spent all available gold
      debt: updatedDebt,
      paid: false
    };
  }
}

/**
 * Process multi-day upkeep
 */
export function processMultiDayUpkeep(
  treasury: number,
  upkeep: Upkeep,
  days: number,
  debt: WageDebt | undefined
): {
  remainingGold: number;
  debt: WageDebt | undefined;
  daysPaid: number;
} {
  let remainingGold = treasury;
  let currentDebt = debt;
  let daysPaid = 0;
  
  for (let i = 0; i < days; i++) {
    const result = processUpkeep(remainingGold, upkeep, currentDebt);
    remainingGold = result.remainingGold;
    currentDebt = result.debt;
    
    if (result.paid) {
      daysPaid++;
    }
  }
  
  return {
    remainingGold,
    debt: currentDebt,
    daysPaid
  };
}

// ============================================================================
// STARVATION SYSTEM
// ============================================================================

/**
 * Days without food before starvation effects kick in
 */
export const STARVATION_THRESHOLD = 3;

/**
 * Calculate starvation penalty
 */
export function calculateStarvationPenalty(daysWithoutFood: number): {
  moralePenalty: number;
  staminaPenalty: number;
  healthDamage: number;
} {
  if (daysWithoutFood < STARVATION_THRESHOLD) {
    return { moralePenalty: 0, staminaPenalty: 0, healthDamage: 0 };
  }
  
  const daysStarving = daysWithoutFood - STARVATION_THRESHOLD;
  
  return {
    moralePenalty: -10 * daysStarving,    // -10 morale per day
    staminaPenalty: -0.2 * daysStarving,  // -20% stamina per day
    healthDamage: 5 * daysStarving         // 5 HP per day
  };
}

/**
 * Check if party is at starvation risk
 */
export function isStarvationRisk(daysWithoutFood: number): boolean {
  return daysWithoutFood >= STARVATION_THRESHOLD;
}
