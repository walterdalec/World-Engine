/**
 * Canvas 10 - Party API
 * 
 * Public API for party management with event bus integration
 * Hire, dismiss, wages, injuries, deaths, and morale
 */

import type {
    PartyState,
    PartyMember,
    RecruitDef,
    CharacterId,
    PartyEvent
} from './types';
import {
    createPartyState,
    addMember,
    removeMember,
    updateMember,
    getMember,
    getAllMembers,
    hasRoomForMember
} from './state';
import { adjustMorale, willDesert } from './morale';
import { payWages, calculateSeverance, getWageStatus } from './wages';
import { processBattleInjuries, applyInjury, rollInjury, reviveMember, calculateRevivalCost } from './injuries';
import { generateRecruitPool, getRegionSpawnConfig } from './data';

// Global party state (will integrate with gameStore in Canvas 17)
let partyState: PartyState | null = null;
let eventListeners: ((_event: PartyEvent) => void)[] = [];

/**
 * Initialize party with hero
 */
export function initParty(hero: PartyMember): void {
    partyState = createPartyState(hero);
    emitEvent({
        type: 'party/hired',
        memberId: hero.id,
        name: hero.name,
        cost: 0
    });
}

/**
 * Get current party state
 */
export function getParty(): PartyState {
    if (!partyState) {
        throw new Error('Party not initialized');
    }
    return partyState;
}

/**
 * Get roster (all members)
 */
export function getRoster(): PartyState {
    return getParty();
}

/**
 * Check if can hire recruit
 */
export function canHire(_recruitId: string, _availableGold: number): boolean {
    const state = getParty();

    if (!hasRoomForMember(state)) {
        return false;
    }

    // Would check recruit availability here (region, locks, etc.)
    // For now, just check party size
    return true;
}

/**
 * Hire recruit
 */
export function hire(recruit: RecruitDef, availableGold: number, currentDay: number): boolean {
    if (!partyState) {
        throw new Error('Party not initialized');
    }

    if (!canHire(recruit.id, availableGold)) {
        return false;
    }

    const totalCost = recruit.hireCost + recruit.upkeep; // First week upfront

    if (availableGold < totalCost) {
        return false;
    }

    // Create party member from recruit
    const member: PartyMember = {
        id: recruit.id,
        recruitId: recruit.id,
        name: recruit.name,
        level: recruit.level,
        hp: 100, // TODO: Calculate from stats
        maxHp: 100,
        injured: false,
        dead: false,
        scars: [],
        morale: 0, // Start neutral
        loyalty: 0,
        gear: {},
        build: {
            race: recruit.race,
            classId: recruit.classId,
            sex: recruit.sex,
            age: recruit.age,
            baseStats: recruit.baseStats,
            skills: recruit.skills,
            traits: recruit.traits
        },
        xp: 0,
        upkeep: recruit.upkeep,
        joinedAtDay: currentDay
    };

    partyState = addMember(partyState, member);

    emitEvent({
        type: 'party/hired',
        memberId: member.id,
        name: member.name,
        cost: totalCost
    });

    return true;
}

/**
 * Dismiss member
 */
export function dismiss(memberId: CharacterId, currentDay: number): number {
    if (!partyState) {
        throw new Error('Party not initialized');
    }

    const member = getMember(partyState, memberId);
    if (!member) {
        throw new Error(`Member ${memberId} not found`);
    }

    if (memberId === partyState.hero.id) {
        throw new Error('Cannot dismiss hero');
    }

    const severance = calculateSeverance(member, currentDay);

    partyState = removeMember(partyState, memberId);

    emitEvent({
        type: 'party/dismissed',
        memberId,
        name: member.name,
        severance
    });

    return severance;
}

/**
 * Pay wages for days
 */
export function payPartyWages(days: number, availableGold: number): {
    cost: number;
    shortfall: number;
    events: PartyEvent[];
} {
    if (!partyState) {
        throw new Error('Party not initialized');
    }

    const result = payWages(partyState, days, availableGold);
    partyState = result.state;

    result.events.forEach(emitEvent);

    return {
        cost: result.cost,
        shortfall: result.shortfall,
        events: result.events
    };
}

/**
 * Apply injury to member
 */
export function applyMemberInjury(memberId: CharacterId, severity: 'light' | 'serious' | 'critical' | 'fatal', seed: string): void {
    if (!partyState) {
        throw new Error('Party not initialized');
    }

    const member = getMember(partyState, memberId);
    if (!member) {
        throw new Error(`Member ${memberId} not found`);
    }

    const result = rollInjury(member, 0.9, seed, 1.0);
    const updated = applyInjury(member, result);

    partyState = updateMember(partyState, memberId, updated);

    if (result.dead) {
        emitEvent({
            type: 'party/death',
            memberId,
            name: member.name,
            cause: 'combat'
        });
    } else if (result.injured) {
        emitEvent({
            type: 'party/injured',
            memberId,
            severity: result.severity
        });
    }
}

/**
 * Flag member as dead
 */
export function flagDeath(memberId: CharacterId, cause: string): void {
    if (!partyState) {
        throw new Error('Party not initialized');
    }

    const member = getMember(partyState, memberId);
    if (!member) {
        throw new Error(`Member ${memberId} not found`);
    }

    partyState = updateMember(partyState, memberId, { dead: true, hp: 0 });

    emitEvent({
        type: 'party/death',
        memberId,
        name: member.name,
        cause
    });
}

/**
 * Adjust member morale
 */
export function adjustMemberMorale(memberId: CharacterId, delta: number, reason: any): void {
    if (!partyState) {
        throw new Error('Party not initialized');
    }

    const member = getMember(partyState, memberId);
    if (!member) {
        throw new Error(`Member ${memberId} not found`);
    }

    const updated = adjustMorale(member, delta, reason);
    partyState = updateMember(partyState, memberId, updated);

    emitEvent({
        type: 'party/morale',
        memberId,
        delta,
        reason,
        newValue: updated.morale
    });

    // Check for desertion
    if (willDesert(updated)) {
        emitEvent({
            type: 'party/desert',
            memberId,
            name: member.name,
            morale: updated.morale
        });
    }
}

/**
 * Process post-battle injuries
 */
export function processBattleResults(seed: string, difficulty: number = 1.0): PartyEvent[] {
    if (!partyState) {
        throw new Error('Party not initialized');
    }

    const members = getAllMembers(partyState);
    const result = processBattleInjuries(members, seed, difficulty);

    // Update hero
    const hero = result.members.find(m => m.id === partyState!.hero.id);
    if (hero) {
        partyState.hero = hero;
    }

    // Update recruits
    partyState.members = result.members.filter(m => m.id !== partyState!.hero.id);

    result.events.forEach(emitEvent);

    return result.events;
}

/**
 * Revive dead member (Canvas 11 expansion)
 */
export function revive(memberId: CharacterId, availableGold: number): boolean {
    if (!partyState) {
        throw new Error('Party not initialized');
    }

    const member = getMember(partyState, memberId);
    if (!member || !member.dead) {
        return false;
    }

    const cost = calculateRevivalCost(member);
    if (availableGold < cost) {
        return false;
    }

    const { member: revived, event } = reviveMember(member, cost);
    partyState = updateMember(partyState, memberId, revived);

    emitEvent(event);

    return true;
}

/**
 * Get recruit pool for region
 */
export function getRecruitPool(regionId: string, day: number, seed: string, regionTier: number = 1): RecruitDef[] {
    const config = getRegionSpawnConfig(regionTier);
    return generateRecruitPool(regionId, day, seed, config);
}

/**
 * Get wage status
 */
export function getWages(): ReturnType<typeof getWageStatus> {
    return getWageStatus(getParty());
}

/**
 * Event system
 */
export function onPartyEvent(listener: (_event: PartyEvent) => void): () => void {
    eventListeners.push(listener);
    return () => {
        eventListeners = eventListeners.filter(l => l !== listener);
    };
}

function emitEvent(event: PartyEvent): void {
    eventListeners.forEach(listener => listener(event));
}

/**
 * Reset party system (for testing)
 */
export function resetParty(): void {
    partyState = null;
    eventListeners = [];
}
