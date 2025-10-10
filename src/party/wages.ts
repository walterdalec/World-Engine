/**
 * Canvas 10 - Wages & Upkeep System
 * 
 * Daily upkeep ticks, debt accumulation, and morale effects
 * Integrates with Canvas 12 economy
 */

import type { PartyState, PartyEvent } from './types';
import { calculateDailyUpkeep, addWageDebt, payWageDebt } from './state';
import { applyUnpaidWagesPenalty, adjustMorale } from './morale';

/**
 * Wage payment result
 */
export interface WagePaymentResult {
  state: PartyState;
  events: PartyEvent[];
  cost: number;
  shortfall: number;
}

/**
 * Pay wages for specified number of days
 * Returns updated state, events, and payment details
 */
export function payWages(
  state: PartyState,
  days: number,
  availableGold: number
): WagePaymentResult {
  const events: PartyEvent[] = [];
  const dailyUpkeep = calculateDailyUpkeep(state);
  const totalCost = dailyUpkeep * days;

  // First, try to pay existing debt
  let goldRemaining = availableGold;
  let newState = state;

  if (state.wageDebt > 0) {
    const debtPayment = Math.min(state.wageDebt, goldRemaining);
    newState = payWageDebt(newState, debtPayment);
    goldRemaining -= debtPayment;

    if (debtPayment > 0) {
      events.push({
        type: 'party/wagesPaid',
        amount: debtPayment,
        days: 0 // Debt payment
      });
    }
  }

  // Then pay current wages
  const paidAmount = Math.min(totalCost, goldRemaining);
  const shortfall = totalCost - paidAmount;

  if (shortfall > 0) {
    // Accumulate debt
    newState = addWageDebt(newState, shortfall);

    events.push({
      type: 'party/debt',
      amount: shortfall,
      accumulated: newState.wageDebt
    });

    // Apply morale penalties
    for (const member of newState.members) {
      if (member.dead) continue;

      const updated = applyUnpaidWagesPenalty(member, 1);
      newState = {
        ...newState,
        members: newState.members.map(m =>
          m.id === member.id ? updated : m
        )
      };

      events.push({
        type: 'party/morale',
        memberId: member.id,
        delta: -10,
        reason: 'wages_unpaid',
        newValue: updated.morale
      });
    }
  } else if (paidAmount > 0) {
    // Fully paid - morale boost
    events.push({
      type: 'party/wagesPaid',
      amount: paidAmount,
      days
    });

    for (const member of newState.members) {
      if (member.dead) continue;

      const updated = adjustMorale(member, 5, 'wages_paid');
      newState = {
        ...newState,
        members: newState.members.map(m =>
          m.id === member.id ? updated : m
        )
      };

      events.push({
        type: 'party/morale',
        memberId: member.id,
        delta: 5,
        reason: 'wages_paid',
        newValue: updated.morale
      });
    }
  }

  return {
    state: newState,
    cost: paidAmount,
    shortfall,
    events
  };
}

/**
 * Calculate severance pay for dismissing a member
 */
export function calculateSeverance(member: { loyalty: number; upkeep: number; joinedAtDay: number }, currentDay: number): number {
  const daysServed = currentDay - member.joinedAtDay;

  // Base severance = 1 week of upkeep
  let severance = member.upkeep * 7;

  // Loyalty bonus (up to 2x)
  const loyaltyMultiplier = 1 + Math.max(0, member.loyalty) / 100;
  severance *= loyaltyMultiplier;

  // Long service bonus (1% per day served, max 50%)
  const serviceBonus = Math.min(0.5, daysServed * 0.01);
  severance *= (1 + serviceBonus);

  return Math.floor(severance);
}

/**
 * Check if wages are overdue and by how many days
 */
export function getDaysWagesOverdue(wageDebt: number, dailyUpkeep: number): number {
  if (dailyUpkeep === 0) return 0;
  return Math.floor(wageDebt / dailyUpkeep);
}

/**
 * Get wage status summary
 */
export function getWageStatus(state: PartyState): {
  dailyUpkeep: number;
  totalDebt: number;
  daysOverdue: number;
  status: 'paid' | 'overdue' | 'critical';
} {
  const dailyUpkeep = calculateDailyUpkeep(state);
  const daysOverdue = getDaysWagesOverdue(state.wageDebt, dailyUpkeep);

  let status: 'paid' | 'overdue' | 'critical' = 'paid';
  if (daysOverdue >= 7) {
    status = 'critical';
  } else if (daysOverdue >= 3) {
    status = 'overdue';
  }

  return {
    dailyUpkeep,
    totalDebt: state.wageDebt,
    daysOverdue,
    status
  };
}

/**
 * Preview wage cost without applying
 */
export function previewWageCost(state: PartyState, days: number): number {
  return calculateDailyUpkeep(state) * days;
}
