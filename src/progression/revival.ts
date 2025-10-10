/**
 * Canvas 11 - Revival System
 * 
 * Costly rituals to bring back the dead
 * Success/flawed/failure outcomes with lasting consequences
 */

import type { RevivalAttempt, RevivalPath, Curse, ProgressionEvent } from './types';
import type { CharacterId } from '../party/types';
import { SeededRandom } from '../proc/noise';
import { getRevivalScar } from './scars';

/**
 * Predefined revival paths with different costs and success rates
 */
const REVIVAL_PATHS: RevivalPath[] = [
    {
        id: 'common',
        name: 'Common Revival',
        description: 'Standard resurrection using Heartbloom Resin and Spirit Salt',
        reagents: [
            { itemId: 'heartbloom_resin', quantity: 1 },
            { itemId: 'spirit_salt', quantity: 2 }
        ],
        gold: 500,
        successChance: 0.60,
        flawedChance: 0.30,
        failureChance: 0.10,
        requiredSiteTier: 1
    },
    {
        id: 'heroic',
        name: 'Heroic Revival',
        description: 'Premium resurrection with Phoenix Ash and Memory Thread',
        reagents: [
            { itemId: 'phoenix_ash', quantity: 1 },
            { itemId: 'memory_thread', quantity: 1 }
        ],
        gold: 2000,
        successChance: 0.80,
        flawedChance: 0.15,
        failureChance: 0.05,
        requiredSiteTier: 2
    },
    {
        id: 'nature',
        name: 'Nature Revival',
        description: 'Natural resurrection through Elder Seeds (faction restricted)',
        reagents: [
            { itemId: 'elder_seeds', quantity: 3 }
        ],
        gold: 300,
        successChance: 0.70,
        flawedChance: 0.20,
        failureChance: 0.10,
        requiredSiteTier: 1,
        factionRestriction: 'sylvanborn_only'
    }
];

/**
 * Revival success modifiers
 */
const MODIFIERS = {
    siteTierBonus: 0.05,        // +5% per tier above minimum
    healerPresence: 0.10,       // +10% if healer in party
    deathCountPenalty: 0.05,    // -5% per previous death
    recentDeathPenalty: 0.15,   // -15% if died < 7 days ago
    factionBonus: 0.10          // varies by faction relationship
};

/**
 * Curses that can result from flawed revivals
 */
const REVIVAL_CURSES: Omit<Curse, 'id' | 'acquiredDay'>[] = [
    {
        name: 'Spirit Debt',
        description: 'The underworld demands payment',
        mods: [
            { type: 'gold_cost_multiplier', percent: 10 },
            { type: 'revival_cost_multiplier', percent: 20 }
        ],
        upkeep: 50, // gold per season
        duration: undefined // permanent until removed
    },
    {
        name: 'Hollow Soul',
        description: 'Part of you remains beyond',
        mods: [
            { stat: 'WIS', amount: -2 },
            { type: 'max_hp', percent: -10 },
            { type: 'spirit_sight', amount: 1 }
        ],
        duration: 30 // days
    },
    {
        name: 'Death\'s Shadow',
        description: 'You attract the attention of dark forces',
        mods: [
            { type: 'undead_encounter_chance', percent: 20 },
            { type: 'necrotic_damage_taken', percent: 15 },
            { type: 'undead_detection', percent: 50 }
        ],
        duration: 60 // days
    },
    {
        name: 'Fractured Memory',
        description: 'Your memories are incomplete',
        mods: [
            { stat: 'INT', amount: -1 },
            { type: 'skill_xp_gain', percent: -15 },
            { type: 'quest_reward_multiplier', percent: -10 }
        ],
        duration: 14 // days
    },
    {
        name: 'Corpse Cold',
        description: 'Death\'s chill lingers in your bones',
        mods: [
            { stat: 'CON', amount: -1 },
            { type: 'frost_resistance', percent: 20 },
            { type: 'fire_resistance', percent: -10 },
            { type: 'stamina_regen', percent: -20 }
        ],
        duration: 21 // days
    }
];

/**
 * Calculate final revival success chance
 */
export function calculateRevivalChance(
    path: RevivalPath,
    siteTier: number,
    hasHealer: boolean,
    deathCount: number,
    daysSinceLastDeath: number,
    factionBonus: number = 0
): { success: number; flawed: number; failure: number } {
    let successMod = 0;
    
    // Site tier bonus
    if (siteTier > path.requiredSiteTier) {
        successMod += (siteTier - path.requiredSiteTier) * MODIFIERS.siteTierBonus;
    }
    
    // Healer presence
    if (hasHealer) {
        successMod += MODIFIERS.healerPresence;
    }
    
    // Death count penalty
    if (deathCount > 0) {
        successMod -= deathCount * MODIFIERS.deathCountPenalty;
    }
    
    // Recent death penalty
    if (daysSinceLastDeath < 7) {
        successMod -= MODIFIERS.recentDeathPenalty;
    }
    
    // Faction bonus
    successMod += factionBonus * MODIFIERS.factionBonus;
    
    // Apply modifiers to success chance
    let success = Math.max(0.10, Math.min(0.95, path.successChance + successMod));
    let flawed = path.flawedChance;
    let failure = path.failureChance;
    
    // Redistribute if success chance changed
    if (successMod !== 0) {
        const remaining = 1.0 - success;
        const flawedRatio = path.flawedChance / (path.flawedChance + path.failureChance);
        flawed = remaining * flawedRatio;
        failure = remaining * (1 - flawedRatio);
    }
    
    return { success, flawed, failure };
}

/**
 * Attempt revival ritual
 */
export function attemptRevival(
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
): RevivalAttempt {
    const path = REVIVAL_PATHS.find(p => p.id === pathId);
    if (!path) {
        throw new Error(`Revival path not found: ${pathId}`);
    }
    
    // Calculate chances
    const chances = calculateRevivalChance(
        path,
        siteTier,
        hasHealer,
        deathCount,
        daysSinceLastDeath,
        factionBonus
    );
    
    // Roll for outcome
    const rng = new SeededRandom(`${seed}_revival_${memberId}_${currentDay}`);
    const roll = rng.nextFloat();
    
    let outcome: 'success' | 'flawed' | 'failure';
    let scarId: string | undefined;
    let curseId: string | undefined;
    
    if (roll < chances.success) {
        // SUCCESS: Clean revival with guaranteed scar
        outcome = 'success';
        const scar = getRevivalScar(seed, memberId, currentDay, deathCount);
        scarId = scar.id;
    } else if (roll < chances.success + chances.flawed) {
        // FLAWED: Revival succeeds but with scar AND curse
        outcome = 'flawed';
        const scar = getRevivalScar(seed, memberId, currentDay, deathCount);
        scarId = scar.id;
        
        // Pick random curse (template used in getCurseFromRevival)
        curseId = `curse_revival_${memberId}_${currentDay}`;
    } else {
        // FAILURE: Revival fails, member stays dead, reagents consumed
        outcome = 'failure';
    }
    
    const attempt: RevivalAttempt = {
        memberId,
        day: currentDay,
        siteId: `site_tier${siteTier}`,
        siteTier,
        reagents: path.reagents.map(r => r.itemId),
        gold: path.gold,
        outcome,
        scarId,
        curseId
    };
    
    return attempt;
}

/**
 * Get curse from flawed revival
 */
export function getCurseFromRevival(
    curseId: string,
    seed: string,
    memberId: CharacterId,
    currentDay: number
): Curse {
    const rng = new SeededRandom(`${seed}_curse_${memberId}_${currentDay}`);
    const template = REVIVAL_CURSES[rng.nextInt(0, REVIVAL_CURSES.length - 1)];
    
    return {
        ...template,
        id: curseId,
        acquiredDay: currentDay
    };
}

/**
 * Calculate total revival cost including death count penalty
 */
export function calculateRevivalCost(
    pathId: string,
    deathCount: number
): { reagents: Array<{ itemId: string; quantity: number }>; gold: number } {
    const path = REVIVAL_PATHS.find(p => p.id === pathId);
    if (!path) {
        throw new Error(`Revival path not found: ${pathId}`);
    }
    
    // Gold cost increases with death count
    const goldMultiplier = 1 + (deathCount * 0.25); // +25% per death
    const gold = Math.floor(path.gold * goldMultiplier);
    
    return {
        reagents: path.reagents,
        gold
    };
}

/**
 * Check if revival path is available for faction
 */
export function isRevivalPathAvailable(
    pathId: string,
    factionId?: string
): boolean {
    const path = REVIVAL_PATHS.find(p => p.id === pathId);
    if (!path) return false;
    
    if (path.factionRestriction) {
        if (!factionId) return false;
        return factionId === path.factionRestriction;
    }
    
    return true;
}

/**
 * Get all available revival paths
 */
export function getRevivalPaths(): ReadonlyArray<RevivalPath> {
    return REVIVAL_PATHS;
}

/**
 * Get revival path by id
 */
export function getRevivalPath(pathId: string): RevivalPath | undefined {
    return REVIVAL_PATHS.find(p => p.id === pathId);
}

/**
 * Apply revival fatigue (temporary stat penalty after successful revival)
 */
export function getRevivalFatigue(
    daysRemaining: number
): { description: string; mods: Array<{ stat?: string; amount?: number; type?: string; percent?: number }> } {
    if (daysRemaining <= 0) {
        return { description: '', mods: [] };
    }
    
    return {
        description: `Revival Fatigue (${daysRemaining} days remaining)`,
        mods: [
            { type: 'all_stats', percent: -10 },
            { type: 'stamina_regen', percent: -25 },
            { type: 'healing_received', percent: -15 }
        ]
    };
}

/**
 * Create revival attempted event
 */
export function createRevivalAttemptedEvent(
    attempt: RevivalAttempt
): ProgressionEvent {
    return {
        type: 'revival/attempted',
        attempt
    };
}

/**
 * Create curse applied event
 */
export function createCurseAppliedEvent(
    memberId: CharacterId,
    curse: Curse
): ProgressionEvent {
    return {
        type: 'curse/applied',
        memberId,
        curse
    };
}

/**
 * Create curse faded event
 */
export function createCurseFadedEvent(
    memberId: CharacterId,
    curseId: string
): ProgressionEvent {
    return {
        type: 'curse/faded',
        memberId,
        curseId
    };
}

/**
 * Check if curse has expired
 */
export function isCurseExpired(
    curse: Curse,
    currentDay: number
): boolean {
    if (!curse.duration) return false; // Permanent curse
    return (currentDay - curse.acquiredDay) >= curse.duration;
}

/**
 * Calculate total curse upkeep cost
 */
export function calculateCurseUpkeep(
    curses: Curse[]
): number {
    return curses.reduce((total, curse) => {
        return total + (curse.upkeep || 0);
    }, 0);
}

/**
 * Get description for revival outcome
 */
export function getRevivalOutcomeDescription(
    outcome: 'success' | 'flawed' | 'failure'
): string {
    switch (outcome) {
        case 'success':
            return 'The ritual succeeds! Your companion returns from death, bearing the scars of their journey.';
        case 'flawed':
            return 'The ritual succeeds, but something went wrong. Your companion returns with both physical and spiritual wounds.';
        case 'failure':
            return 'The ritual fails. The reagents are consumed, but your companion remains beyond reach.';
    }
}

/**
 * Get all possible curses for reference
 */
export function getAllCurses(): ReadonlyArray<Omit<Curse, 'id' | 'acquiredDay'>> {
    return REVIVAL_CURSES;
}
