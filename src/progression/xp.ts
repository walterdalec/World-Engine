/**
 * Canvas 11 - XP & Leveling System
 * 
 * Soft caps, milestone gates, and bounded scaling
 * Shared XP pool with contribution-based distribution
 */

import type { CharacterId } from '../party/types';
import type { XPSource, XPFormula, LevelUpChoice, ProgressionEvent } from './types';
import { DEFAULT_XP_FORMULA, BURNOUT_THRESHOLDS } from './types';

/**
 * Calculate XP needed for next level
 */
export function calculateXPRequired(level: number, formula: XPFormula = DEFAULT_XP_FORMULA): number {
    // XP_needed(L) = base * L^2 + step * L
    const required = formula.base * Math.pow(level, formula.exponent) + formula.step * level;

    // Apply soft cap multiplier for high levels
    if (level >= formula.softCapLevel) {
        const softCapFactor = 1 + ((1 / formula.softCapMultiplier) - 1) *
            Math.min(1, (level - formula.softCapLevel) / 10);
        return Math.floor(required * softCapFactor);
    }

    return Math.floor(required);
}

/**
 * Calculate total XP needed to reach a level
 */
export function calculateTotalXPForLevel(targetLevel: number, formula: XPFormula = DEFAULT_XP_FORMULA): number {
    let total = 0;
    for (let level = 1; level < targetLevel; level++) {
        total += calculateXPRequired(level, formula);
    }
    return total;
}

/**
 * Distribute shared XP pool based on contribution
 */
export function distributeXP(
    memberIds: CharacterId[],
    totalXP: number,
    contributions: Map<CharacterId, number>, // damage dealt, tanked, objectives
    minFloorPercent: number = 0.25 // backliners get at least 25%
): Map<CharacterId, number> {
    const distribution = new Map<CharacterId, number>();

    if (memberIds.length === 0) return distribution;

    // Calculate total contribution
    const totalContribution = Array.from(contributions.values()).reduce((sum, c) => sum + c, 0);

    // If no contributions tracked, split evenly
    if (totalContribution === 0) {
        const perMember = Math.floor(totalXP / memberIds.length);
        memberIds.forEach(id => distribution.set(id, perMember));
        return distribution;
    }

    // Calculate floor XP (guaranteed minimum)
    const floorXP = Math.floor((totalXP * minFloorPercent) / memberIds.length);
    const remainingXP = totalXP - (floorXP * memberIds.length);

    // Distribute remaining based on contribution
    memberIds.forEach(id => {
        const contribution = contributions.get(id) || 0;
        const contributionPercent = contribution / totalContribution;
        const bonusXP = Math.floor(remainingXP * contributionPercent);
        distribution.set(id, floorXP + bonusXP);
    });

    return distribution;
}

/**
 * Grant XP to member
 */
export function grantXP(
    currentXP: number,
    currentLevel: number,
    amount: number,
    levelUpCallback: (_newLevel: number) => void
): { newXP: number; newLevel: number; leveledUp: boolean } {
    let xp = currentXP + amount;
    let level = currentLevel;
    let leveledUp = false;

    // Check for level-ups (can level multiple times from large XP grants)
    while (true) {
        const required = calculateXPRequired(level);
        if (xp >= required) {
            xp -= required;
            level++;
            leveledUp = true;
            levelUpCallback(level);
        } else {
            break;
        }
    }

    return { newXP: xp, newLevel: level, leveledUp };
}

/**
 * Calculate burnout from rapid leveling
 */
export function calculateBurnout(recentLevelUpDays: number[], currentDay: number): number {
    // Count level-ups in last 7 days
    const recentLevelUps = recentLevelUpDays.filter(day => currentDay - day <= 7).length;

    // Each level-up in past week adds 20 burnout
    const burnout = recentLevelUps * 20;

    return Math.min(100, burnout);
}

/**
 * Apply burnout penalty to stats
 */
export function applyBurnoutPenalty(statValue: number, burnout: number): number {
    if (burnout < BURNOUT_THRESHOLDS.WARNING) {
        return statValue; // No penalty
    } else if (burnout < BURNOUT_THRESHOLDS.PENALTY_HEAVY) {
        return Math.floor(statValue * 0.95); // -5%
    } else {
        return Math.floor(statValue * 0.90); // -10%
    }
}

/**
 * Reduce burnout over time (called daily)
 */
export function reduceBurnout(currentBurnout: number): number {
    return Math.max(0, currentBurnout - BURNOUT_THRESHOLDS.RECOVERY_PER_DAY);
}

/**
 * Check if member is at milestone level
 */
export function isMilestoneLevel(level: number): boolean {
    // Milestones at 5, 10, 15, 20
    return level % 5 === 0;
}

/**
 * Get available ability slots for level
 */
export function getAbilitySlotsForLevel(level: number): { active: number; passive: number } {
    // Active slots: 2 at L1, 3 at L10, 4 at L20
    let active = 2;
    if (level >= 20) active = 4;
    else if (level >= 10) active = 3;

    // Passive slots: always capped at 2 (Canvas 15)
    const passive = 2;

    return { active, passive };
}

/**
 * Validate level-up choice
 */
export function validateLevelUpChoice(
    choice: LevelUpChoice,
    currentStats: Record<string, number>,
    currentSkills: string[],
    currentTraits: string[]
): { valid: boolean; reason?: string } {
    switch (choice.type) {
        case 'stat':
            // Check if stat exists and is within reasonable bounds
            if (!currentStats[choice.stat]) {
                return { valid: false, reason: `Unknown stat: ${choice.stat}` };
            }
            if (currentStats[choice.stat] + choice.amount > 25) {
                return { valid: false, reason: `Stat cap of 25 reached for ${choice.stat}` };
            }
            return { valid: true };

        case 'skill':
            // Check if already known
            if (currentSkills.includes(choice.skillId)) {
                return { valid: false, reason: `Skill ${choice.skillId} already known` };
            }
            return { valid: true };

        case 'trait':
            // Check if already known or conflicts
            if (currentTraits.includes(choice.traitId)) {
                return { valid: false, reason: `Trait ${choice.traitId} already acquired` };
            }
            // TODO: Check trait trees for conflicts (Canvas 15)
            return { valid: true };

        default:
            return { valid: false, reason: 'Invalid choice type' };
    }
}

/**
 * Apply level-up choice
 */
export function applyLevelUpChoice(
    choice: LevelUpChoice,
    stats: Record<string, number>,
    skills: string[],
    traits: string[]
): {
    stats: Record<string, number>;
    skills: string[];
    traits: string[];
} {
    switch (choice.type) {
        case 'stat':
            return {
                stats: { ...stats, [choice.stat]: stats[choice.stat] + choice.amount },
                skills,
                traits
            };

        case 'skill':
            return {
                stats,
                skills: [...skills, choice.skillId],
                traits
            };

        case 'trait':
            return {
                stats,
                skills,
                traits: [...traits, choice.traitId]
            };
    }
}

/**
 * Calculate XP from source with diminishing returns
 */
export function calculateXPFromSource(
    baseAmount: number,
    source: XPSource,
    timesUsed: number // for training/mentor diminishing returns
): number {
    switch (source) {
        case 'battle':
        case 'quest':
        case 'exploration':
        case 'milestone':
            return baseAmount; // No diminishing returns

        case 'training':
            // 50% effectiveness after 10 uses, 25% after 20
            if (timesUsed > 20) return Math.floor(baseAmount * 0.25);
            if (timesUsed > 10) return Math.floor(baseAmount * 0.50);
            return baseAmount;

        case 'mentor':
            // Rare, but also diminishes
            if (timesUsed > 5) return Math.floor(baseAmount * 0.50);
            return baseAmount;

        default:
            return baseAmount;
    }
}

/**
 * Generate level-up event
 */
export function createLevelUpEvent(
    memberId: CharacterId,
    newLevel: number,
    choice: LevelUpChoice
): ProgressionEvent {
    return {
        type: 'xp/levelUp',
        memberId,
        newLevel,
        choice
    };
}

/**
 * Generate XP granted event
 */
export function createXPGrantedEvent(
    memberId: CharacterId,
    amount: number,
    source: XPSource,
    newTotal: number
): ProgressionEvent {
    return {
        type: 'xp/granted',
        memberId,
        amount,
        source,
        newTotal
    };
}

/**
 * Deterministic level-up seed for procedural choices
 */
export function getLevelUpSeed(memberId: CharacterId, level: number, baseSeed: string): string {
    return `${baseSeed}_levelup_${memberId}_${level}`;
}
