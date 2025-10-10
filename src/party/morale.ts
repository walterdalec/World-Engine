/**
 * Canvas 10 - Morale & Loyalty System
 * 
 * Morale shifts from victories/defeats, injuries/deaths, pay status,
 * leadership, food/comfort, and reputation
 */

import type { PartyMember, PartyState, MoraleReason, PartyEvent } from './types';
import { MORALE_THRESHOLDS } from './types';

/**
 * Morale adjustment amounts by reason
 */
const MORALE_ADJUSTMENTS: Record<MoraleReason, number> = {
  victory: 10,
  defeat: -15,
  injury: -5,
  death: -20,
  wages_paid: 5,
  wages_unpaid: -10,
  leadership: 0, // Calculated based on hero CHA
  food: 0,       // Calculated based on supply status
  comfort: 0,    // Calculated based on rest quality
  reputation: 0  // Calculated based on faction standing
};

/**
 * Apply morale adjustment to a member
 */
export function adjustMorale(
  member: PartyMember,
  delta: number,
  _reason: MoraleReason
): PartyMember {
  const newMorale = Math.max(-100, Math.min(100, member.morale + delta));

  return {
    ...member,
    morale: newMorale
  };
}

/**
 * Calculate leadership bonus from hero's CHA
 */
export function calculateLeadershipBonus(heroCHA: number): number {
  // -5 to +5 based on CHA (10 is average)
  return Math.floor((heroCHA - 10) / 2);
}

/**
 * Apply daily morale decay for unpaid wages
 */
export function applyUnpaidWagesPenalty(member: PartyMember, daysUnpaid: number): PartyMember {
  // Escalating penalty: -5 per day unpaid, -10 after 3 days, -15 after 7 days
  let penalty = -5 * daysUnpaid;
  if (daysUnpaid >= 7) penalty = -15;
  else if (daysUnpaid >= 3) penalty = -10;

  return adjustMorale(member, penalty, 'wages_unpaid');
}

/**
 * Apply victory morale boost
 */
export function applyVictoryBonus(member: PartyMember, difficulty: number = 1): PartyMember {
  // Harder victories give more morale
  const bonus = Math.floor(MORALE_ADJUSTMENTS.victory * difficulty);
  return adjustMorale(member, bonus, 'victory');
}

/**
 * Apply defeat morale penalty
 */
export function applyDefeatPenalty(member: PartyMember, severity: number = 1): PartyMember {
  // Worse defeats hurt more
  const penalty = Math.floor(MORALE_ADJUSTMENTS.defeat * severity);
  return adjustMorale(member, penalty, 'defeat');
}

/**
 * Apply injury morale penalty
 */
export function applyInjuryPenalty(member: PartyMember, self: boolean = true): PartyMember {
  // Own injuries hurt more than watching others get injured
  const penalty = self ? MORALE_ADJUSTMENTS.injury * 2 : MORALE_ADJUSTMENTS.injury;
  return adjustMorale(member, penalty, 'injury');
}

/**
 * Apply death morale penalty (for witnessing party member death)
 */
export function applyDeathPenalty(member: PartyMember, wasClose: boolean = false): PartyMember {
  // Deaths of close companions hurt more
  const penalty = wasClose
    ? MORALE_ADJUSTMENTS.death * 1.5
    : MORALE_ADJUSTMENTS.death;
  return adjustMorale(member, penalty, 'death');
}

/**
 * Check if member will desert
 */
export function willDesert(member: PartyMember): boolean {
  return member.morale <= MORALE_THRESHOLDS.DESERTION && member.loyalty < 0;
}

/**
 * Check if member is threatening to leave
 */
export function isThreatening(member: PartyMember): boolean {
  return member.morale <= MORALE_THRESHOLDS.THREATEN && !willDesert(member);
}

/**
 * Check if member is complaining
 */
export function isComplaining(member: PartyMember): boolean {
  return member.morale <= MORALE_THRESHOLDS.WARNING && !isThreatening(member);
}

/**
 * Adjust loyalty (slow-moving, separate from morale)
 */
export function adjustLoyalty(member: PartyMember, delta: number): PartyMember {
  const newLoyalty = Math.max(-100, Math.min(100, member.loyalty + delta));

  return {
    ...member,
    loyalty: newLoyalty
  };
}

/**
 * Calculate loyalty drift based on morale
 * Loyalty slowly moves toward morale over time
 */
export function applyLoyaltyDrift(member: PartyMember): PartyMember {
  const diff = member.morale - member.loyalty;
  const drift = Math.sign(diff) * Math.min(Math.abs(diff) * 0.1, 2);

  return adjustLoyalty(member, drift);
}

/**
 * Apply morale effects to entire party
 */
export function applyPartyMoraleEffect(
  state: PartyState,
  delta: number,
  reason: MoraleReason
): { state: PartyState; events: PartyEvent[] } {
  const events: PartyEvent[] = [];
  let newState = state;

  // Apply to all non-dead members
  for (const member of newState.members) {
    if (member.dead) continue;

    const updated = adjustMorale(member, delta, reason);
    const oldMorale = member.morale;
    const newMorale = updated.morale;

    newState = {
      ...newState,
      members: newState.members.map(m =>
        m.id === member.id ? updated : m
      )
    };

    events.push({
      type: 'party/morale',
      memberId: member.id,
      delta,
      reason,
      newValue: newMorale
    });

    // Check for threshold crossings
    if (oldMorale > MORALE_THRESHOLDS.DESERTION && newMorale <= MORALE_THRESHOLDS.DESERTION) {
      // Member will desert soon
      events.push({
        type: 'party/desert',
        memberId: member.id,
        name: member.name,
        morale: newMorale
      });
    }
  }

  return { state: newState, events };
}

/**
 * Get morale status text
 */
export function getMoraleStatus(morale: number): string {
  if (morale >= MORALE_THRESHOLDS.DEVOTED) return 'Devoted';
  if (morale >= MORALE_THRESHOLDS.LOYAL) return 'Loyal';
  if (morale >= MORALE_THRESHOLDS.CONTENT) return 'Content';
  if (morale >= MORALE_THRESHOLDS.NEUTRAL) return 'Neutral';
  if (morale >= MORALE_THRESHOLDS.WARNING) return 'Unhappy';
  if (morale >= MORALE_THRESHOLDS.THREATEN) return 'Threatening';
  return 'Deserting';
}

/**
 * Get morale emoji for UI
 */
export function getMoraleEmoji(morale: number): string {
  if (morale >= MORALE_THRESHOLDS.DEVOTED) return '🎖️';
  if (morale >= MORALE_THRESHOLDS.LOYAL) return '😊';
  if (morale >= MORALE_THRESHOLDS.CONTENT) return '🙂';
  if (morale >= MORALE_THRESHOLDS.NEUTRAL) return '😐';
  if (morale >= MORALE_THRESHOLDS.WARNING) return '😟';
  if (morale >= MORALE_THRESHOLDS.THREATEN) return '😠';
  return '💀';
}
