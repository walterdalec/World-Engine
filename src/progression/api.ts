/**
 * Canvas 11 - Progression API
 * 
 * Public interface for progression system
 * Event-driven integration with Canvas 10-20
 */

import type {
    ProgressionState,
    ProgressionEvent,
    XPSource,
    Wound,
    Scar,
    Curse,
    DeathRecord,
    RevivalAttempt
} from './types';
import type { CharacterId } from '../party/types';

// XP functions
import {
    calculateXPRequired,
    calculateTotalXPForLevel,
    distributeXP,
    grantXP,
    calculateBurnout,
    reduceBurnout,
    applyBurnoutPenalty,
    isMilestoneLevel,
    getAbilitySlotsForLevel,
    validateLevelUpChoice,
    applyLevelUpChoice,
    calculateXPFromSource,
    createLevelUpEvent,
    createXPGrantedEvent,
    getLevelUpSeed
} from './xp';

// Injury functions
import {
    rollInjury,
    processInjury,
    processDeath,
    isFatalWound,
    getWoundDescription,
    getDamageTagDescription,
    getRecommendedHealing,
    getRecoveryTime,
    createDeathEvent
} from './injuries';

// Scar functions
import {
    rollScarFromWound,
    getRevivalScar,
    addScar,
    calculateScarModifiers,
    applyScarModifiers,
    hasVisibleScars,
    getScarTooltip,
    createScarAppliedEvent,
    getAllScars
} from './scars';

// Revival functions
import {
    calculateRevivalChance,
    attemptRevival,
    getCurseFromRevival,
    calculateRevivalCost,
    isRevivalPathAvailable,
    getRevivalPaths,
    getRevivalPath,
    getRevivalFatigue,
    createRevivalAttemptedEvent,
    createCurseAppliedEvent,
    createCurseFadedEvent,
    isCurseExpired,
    calculateCurseUpkeep,
    getRevivalOutcomeDescription,
    getAllCurses
} from './revival';

/**
 * Event bus for progression events
 * Canvas systems can subscribe to these events
 */
type ProgressionEventHandler = (_event: ProgressionEvent) => void;
const eventHandlers: ProgressionEventHandler[] = [];

export function subscribeToProgressionEvents(handler: ProgressionEventHandler): () => void {
    eventHandlers.push(handler);
    return () => {
        const index = eventHandlers.indexOf(handler);
        if (index > -1) {
            eventHandlers.splice(index, 1);
        }
    };
}

export function emitProgressionEvent(event: ProgressionEvent): void {
    for (const handler of eventHandlers) {
        handler(event);
    }
}

/**
 * XP Management API
 */
export const XPSystem = {
    calculateXPRequired,
    calculateTotalXPForLevel,
    distributeXP,
    grantXP,
    calculateXPFromSource,
    isMilestoneLevel,
    getLevelUpSeed
};

/**
 * Leveling API
 */
export const LevelingSystem = {
    getAbilitySlotsForLevel,
    validateLevelUpChoice,
    applyLevelUpChoice,
    createLevelUpEvent
};

/**
 * Burnout API
 */
export const BurnoutSystem = {
    calculateBurnout,
    reduceBurnout,
    applyBurnoutPenalty
};

/**
 * Injury API
 */
export const InjurySystem = {
    rollInjury,
    processInjury,
    isFatalWound,
    getWoundDescription,
    getDamageTagDescription,
    getRecommendedHealing,
    getRecoveryTime
};

/**
 * Death API
 */
export const DeathSystem = {
    processDeath,
    createDeathEvent
};

/**
 * Scar API
 */
export const ScarSystem = {
    rollScarFromWound,
    getRevivalScar,
    addScar,
    calculateScarModifiers,
    applyScarModifiers,
    hasVisibleScars,
    getScarTooltip,
    getAllScars
};

/**
 * Revival API
 */
export const RevivalSystem = {
    calculateRevivalChance,
    attemptRevival,
    getCurseFromRevival,
    calculateRevivalCost,
    isRevivalPathAvailable,
    getRevivalPaths,
    getRevivalPath,
    getRevivalFatigue,
    getRevivalOutcomeDescription
};

/**
 * Curse API
 */
export const CurseSystem = {
    isCurseExpired,
    calculateCurseUpkeep,
    getAllCurses
};

/**
 * High-level API for common workflows
 */

/**
 * Grant XP to party members with contribution tracking
 */
export function grantPartyXP(
    memberIds: CharacterId[],
    totalXP: number,
    contributions: Map<CharacterId, number>,
    source: XPSource,
    currentStates: Map<CharacterId, ProgressionState>,
    onLevelUp: (_memberId: CharacterId, _newLevel: number) => void
): Map<CharacterId, number> {
    const distribution = distributeXP(memberIds, totalXP, contributions);
    const events: ProgressionEvent[] = [];

    Array.from(distribution.entries()).forEach(([memberId, xpAmount]) => {
        const state = currentStates.get(memberId);
        if (!state) return;

        const { newXP } = grantXP(
            state.xp,
            state.level,
            xpAmount,
            (level) => {
                onLevelUp(memberId, level);
            }
        );

        events.push(createXPGrantedEvent(memberId, xpAmount, source, newXP));

        // Level-up events handled by callback
    });

    // Emit all events
    for (const event of events) {
        emitProgressionEvent(event);
    }

    return distribution;
}

/**
 * Process post-battle injuries for entire party
 */
export function processPartyInjuries(
    downedMembers: Array<{ memberId: CharacterId; damageTags: string[] }>,
    hasHealer: 'none' | 'basic' | 'expert',
    currentDay: number,
    seed: string
): {
    injuries: Map<CharacterId, Wound>;
    scars: Map<CharacterId, Scar>;
    deaths: Map<CharacterId, DeathRecord>;
    events: ProgressionEvent[];
} {
    const injuries = new Map<CharacterId, Wound>();
    const scars = new Map<CharacterId, Scar>();
    const deaths = new Map<CharacterId, DeathRecord>();
    const events: ProgressionEvent[] = [];

    for (const { memberId, damageTags } of downedMembers) {
        const wound = rollInjury(
            seed,
            memberId,
            damageTags as any[], // Type assertion for DamageTag[]
            hasHealer,
            currentDay
        );

        if (wound) {
            injuries.set(memberId, wound);
            const result = processInjury(wound, seed, memberId);
            events.push(...result.events);

            // Check if scar was generated
            const scarEvent = result.events.find(e => e.type === 'scar/applied');
            if (scarEvent && scarEvent.type === 'scar/applied') {
                scars.set(memberId, scarEvent.scar);
            }
        } else {
            // Fatal wound - process death
            // Note: This requires member data which should be passed from Canvas 10
            // For now, we just mark it as needing death processing
        }
    }

    return { injuries, scars, deaths, events };
}

/**
 * Attempt revival and return full results
 */
export function performRevival(
    memberId: CharacterId,
    memberName: string,
    pathId: string,
    currentDay: number,
    siteTier: number,
    hasHealer: boolean,
    deathCount: number,
    daysSinceLastDeath: number,
    factionBonus: number,
    seed: string
): {
    attempt: RevivalAttempt;
    scar?: Scar;
    curse?: Curse;
    events: ProgressionEvent[];
} {
    const attempt = attemptRevival(
        memberId,
        memberName,
        pathId,
        currentDay,
        siteTier,
        hasHealer,
        deathCount,
        daysSinceLastDeath,
        factionBonus,
        seed
    );

    const events: ProgressionEvent[] = [createRevivalAttemptedEvent(attempt)];
    let scar: Scar | undefined;
    let curse: Curse | undefined;

    if (attempt.outcome === 'success' || attempt.outcome === 'flawed') {
        // Get scar
        if (attempt.scarId) {
            scar = getRevivalScar(seed, memberId, currentDay, deathCount);
            events.push(createScarAppliedEvent(memberId, scar));
        }

        // Get curse if flawed
        if (attempt.outcome === 'flawed' && attempt.curseId) {
            curse = getCurseFromRevival(attempt.curseId, seed, memberId, currentDay);
            events.push(createCurseAppliedEvent(memberId, curse));
        }
    }

    // Emit codex event
    events.push({
        type: 'codex/revival',
        memberId,
        success: attempt.outcome !== 'failure'
    });

    // Emit all events
    for (const event of events) {
        emitProgressionEvent(event);
    }

    return { attempt, scar, curse, events };
}

/**
 * Process curse expirations for party
 */
export function processExpiredCurses(
    memberCurses: Map<CharacterId, Curse[]>,
    currentDay: number
): {
    expired: Map<CharacterId, string[]>;
    events: ProgressionEvent[];
} {
    const expired = new Map<CharacterId, string[]>();
    const events: ProgressionEvent[] = [];

    Array.from(memberCurses.entries()).forEach(([memberId, curses]) => {
        const expiredIds: string[] = [];

        for (const curse of curses) {
            if (isCurseExpired(curse, currentDay)) {
                expiredIds.push(curse.id);
                events.push(createCurseFadedEvent(memberId, curse.id));
            }
        }

        if (expiredIds.length > 0) {
            expired.set(memberId, expiredIds);
        }
    });

    // Emit all events
    for (const event of events) {
        emitProgressionEvent(event);
    }

    return { expired, events };
}

/**
 * Calculate daily burnout recovery
 */
export function processDailyBurnoutRecovery(
    memberBurnouts: Map<CharacterId, number>
): Map<CharacterId, number> {
    const updated = new Map<CharacterId, number>();

    Array.from(memberBurnouts.entries()).forEach(([memberId, burnout]) => {
        const newBurnout = reduceBurnout(burnout);
        updated.set(memberId, newBurnout);

        // Emit warning if still high
        if (newBurnout >= 40) {
            emitProgressionEvent({
                type: 'burnout/warning',
                memberId,
                burnoutLevel: newBurnout
            });
        }
    });

    return updated;
}

/**
 * Export all types for external use
 */
export type {
    ProgressionState,
    ProgressionEvent,
    XPSource,
    LevelUpChoice,
    Wound,
    Scar,
    Curse,
    DeathRecord,
    RevivalAttempt
} from './types';
