/**
 * Canvas 10 - Party State Management
 * 
 * Core party state with reducer and selectors
 * Hero + recruits with lifecycle tracking
 */

import type { PartyState, PartyMember, CharacterId } from './types';

/**
 * Create empty party state with just the hero
 */
export function createPartyState(hero: PartyMember): PartyState {
    return {
        hero,
        members: [],
        maxSize: 4, // Starting party size, scales with progression
        mounts: 0,
        cargoSlots: 10,
        wageDebt: 0
    };
}

/**
 * Add member to party
 */
export function addMember(state: PartyState, member: PartyMember): PartyState {
    if (state.members.length >= state.maxSize) {
        throw new Error('Party is full');
    }

    if (state.members.some(m => m.id === member.id)) {
        throw new Error('Member already in party');
    }

    return {
        ...state,
        members: [...state.members, member]
    };
}

/**
 * Remove member from party
 */
export function removeMember(state: PartyState, memberId: CharacterId): PartyState {
    if (memberId === state.hero.id) {
        throw new Error('Cannot remove hero from party');
    }

    return {
        ...state,
        members: state.members.filter(m => m.id !== memberId)
    };
}

/**
 * Update member in party
 */
export function updateMember(
    state: PartyState,
    memberId: CharacterId,
    update: Partial<PartyMember>
): PartyState {
    if (memberId === state.hero.id) {
        return {
            ...state,
            hero: { ...state.hero, ...update }
        };
    }

    return {
        ...state,
        members: state.members.map(m =>
            m.id === memberId ? { ...m, ...update } : m
        )
    };
}

/**
 * Get member by ID (hero or recruit)
 */
export function getMember(state: PartyState, memberId: CharacterId): PartyMember | undefined {
    if (state.hero.id === memberId) {
        return state.hero;
    }
    return state.members.find(m => m.id === memberId);
}

/**
 * Get all active members (hero + recruits)
 */
export function getAllMembers(state: PartyState): PartyMember[] {
    return [state.hero, ...state.members];
}

/**
 * Get living members (not dead)
 */
export function getLivingMembers(state: PartyState): PartyMember[] {
    return getAllMembers(state).filter(m => !m.dead);
}

/**
 * Get injured members
 */
export function getInjuredMembers(state: PartyState): PartyMember[] {
    return getAllMembers(state).filter(m => m.injured && !m.dead);
}

/**
 * Get members with low morale (below threshold)
 */
export function getLowMoraleMembers(state: PartyState, threshold: number = -25): PartyMember[] {
    return state.members.filter(m => m.morale < threshold && !m.dead);
}

/**
 * Calculate total daily upkeep for party
 */
export function calculateDailyUpkeep(state: PartyState): number {
    return state.members
        .filter(m => !m.dead)
        .reduce((sum, m) => sum + m.upkeep, 0);
}

/**
 * Calculate average party level
 */
export function getAverageLevel(state: PartyState): number {
    const living = getLivingMembers(state);
    if (living.length === 0) return 1;

    const totalLevel = living.reduce((sum, m) => sum + m.level, 0);
    return Math.floor(totalLevel / living.length);
}

/**
 * Check if party has room for more members
 */
export function hasRoomForMember(state: PartyState): boolean {
    return state.members.length < state.maxSize;
}

/**
 * Get party power rating (for encounter scaling)
 */
export function getPartyPower(state: PartyState): number {
    const living = getLivingMembers(state);

    // Base power from levels
    let power = living.reduce((sum, m) => sum + m.level, 0);

    // Penalties for injuries
    const injured = living.filter(m => m.injured).length;
    power *= (1 - injured * 0.1);

    // Morale bonus/penalty
    const avgMorale = living.reduce((sum, m) => sum + m.morale, 0) / living.length;
    power *= (1 + avgMorale / 200); // ±50% from morale

    return Math.max(1, Math.floor(power));
}

/**
 * Update wage debt
 */
export function addWageDebt(state: PartyState, amount: number): PartyState {
    return {
        ...state,
        wageDebt: state.wageDebt + amount
    };
}

/**
 * Pay down wage debt
 */
export function payWageDebt(state: PartyState, amount: number): PartyState {
    return {
        ...state,
        wageDebt: Math.max(0, state.wageDebt - amount)
    };
}

/**
 * Increase party size limit
 */
export function increaseMaxSize(state: PartyState, amount: number = 1): PartyState {
    return {
        ...state,
        maxSize: Math.min(12, state.maxSize + amount) // Hard cap at 12
    };
}

/**
 * Update mounts
 */
export function setMounts(state: PartyState, count: number): PartyState {
    return {
        ...state,
        mounts: Math.max(0, count)
    };
}

/**
 * Update cargo slots
 */
export function setCargoSlots(state: PartyState, count: number): PartyState {
    return {
        ...state,
        cargoSlots: Math.max(0, count)
    };
}
