/**
 * Spell Gating System
 * Enforces requirements for casting spells (level, resources, situational)
 */

import type { Spell, SpellRequirements } from './types';
import type { Unit } from '../unit/types';

/**
 * Result of spell gating check
 */
export interface GatingResult {
    canCast: boolean;
    reasons: string[];
}

/**
 * Allowed gating result (can cast)
 */
export const ALLOWED: GatingResult = { canCast: true, reasons: [] };

/**
 * Check if a unit can cast a spell based on requirements
 */
export function checkGating(
    caster: Unit,
    spell: Spell
): GatingResult {
    const reasons: string[] = [];

    // Check requirements if specified
    if (spell.requires) {
        const reqCheck = checkRequirements(caster, spell.requires);
        if (!reqCheck.canCast) {
            reasons.push(...reqCheck.reasons);
        }
    }

    // Check mana cost
    if (spell.manaCost > caster.mp) {
        reasons.push(`Insufficient mana (need ${spell.manaCost}, have ${caster.mp})`);
    }

    // Check if unit is alive and able to act
    if (caster.hp <= 0) {
        reasons.push('Caster is defeated');
    }

    // Check status effects that prevent casting
    const stunned = caster.statuses.find(s => s.name === 'stunned');
    if (stunned && stunned.turns > 0) {
        reasons.push('Caster is stunned');
    }

    const silenced = caster.statuses.find(s => s.name === 'silenced');
    if (silenced && silenced.turns > 0) {
        reasons.push('Caster is silenced');
    }

    return {
        canCast: reasons.length === 0,
        reasons
    };
}

/**
 * Check spell requirements (level, mastery, etc.)
 */
function checkRequirements(
    caster: Unit,
    requirements: SpellRequirements
): GatingResult {
    const reasons: string[] = [];

    // Minimum level check
    if (requirements.minUnitLevel && caster.level < requirements.minUnitLevel) {
        reasons.push(`Requires level ${requirements.minUnitLevel} (current: ${caster.level})`);
    }

    // Mastery level check (simplified for now)
    if (requirements.minMastery) {
        const currentMastery = Math.floor(caster.level / 3); // Basic mastery calculation
        if (currentMastery < requirements.minMastery) {
            reasons.push(`Requires mastery level ${requirements.minMastery} (current: ${currentMastery})`);
        }
    }

    // Quest flag check (placeholder - would integrate with quest system)
    if (requirements.questFlag) {
        // Simplified: assume quest flags are completed for levels > 5
        if (caster.level <= 5) {
            reasons.push(`Requires quest completion: ${requirements.questFlag}`);
        }
    }

    // Research check (placeholder - would integrate with research system)
    if (requirements.research) {
        // Simplified: assume research is available for high-level casters
        if (caster.level < 8) {
            reasons.push(`Requires research: ${requirements.research}`);
        }
    }

    return {
        canCast: reasons.length === 0,
        reasons
    };
}

/**
 * Check multiple spells for gating at once
 */
export function checkMultipleSpells(
    caster: Unit,
    spells: Spell[]
): Map<string, GatingResult> {
    const results = new Map<string, GatingResult>();

    for (const spell of spells) {
        results.set(spell.id, checkGating(caster, spell));
    }

    return results;
}

/**
 * Get all castable spells for a unit
 */
export function getCastableSpells(
    caster: Unit,
    availableSpells: Spell[]
): Spell[] {
    return availableSpells.filter(spell =>
        checkGating(caster, spell).canCast
    );
}

/**
 * Check if unit has enough AP to cast a spell (requires separate AP check)
 */
export function checkActionPoints(
    caster: Unit,
    spell: Spell,
    apCost: number = 1
): GatingResult {
    if (caster.ap < apCost) {
        return {
            canCast: false,
            reasons: [`Insufficient action points (need ${apCost}, have ${caster.ap})`]
        };
    }

    return ALLOWED;
}

/**
 * Comprehensive gating check including AP cost
 */
export function checkFullGating(
    caster: Unit,
    spell: Spell,
    apCost: number = 1
): GatingResult {
    const spellCheck = checkGating(caster, spell);
    const apCheck = checkActionPoints(caster, spell, apCost);

    if (!spellCheck.canCast || !apCheck.canCast) {
        return {
            canCast: false,
            reasons: [...spellCheck.reasons, ...apCheck.reasons]
        };
    }

    return ALLOWED;
}