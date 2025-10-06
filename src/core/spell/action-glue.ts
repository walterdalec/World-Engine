/**
 * Action System Integration for Spells
 * Provides glue between spell system and action system
 */

import type { PlannedAction, ValidationResult } from '../action/types';
import type { Unit } from '../unit/types';
import type { Spell } from './types';
import { checkFullGating, type GatingResult } from './gating';
import { applySpell } from './resolver';
import { selectTargets } from './selectors';
import { getSpellById } from './registry';

/**
 * Validate a spell cast action
 */
export function validateSpellAction(
    caster: Unit,
    action: PlannedAction
): ValidationResult {
    if (action.kind !== 'cast') {
        return { ok: false, reasons: ['Not a cast action'] };
    }

    // Get spell data
    const spellId = action.data?.spellId;
    if (!spellId) {
        return { ok: false, reasons: ['No spell ID specified'] };
    }

    const spell = getSpellById(spellId);
    if (!spell) {
        return { ok: false, reasons: [`Unknown spell: ${spellId}`] };
    }

    // Check gating constraints
    const apCost = action.cost.ap || 1;
    const gatingResult = checkFullGating(caster, spell, apCost);
    if (!gatingResult.canCast) {
        return { ok: false, reasons: gatingResult.reasons };
    }

    // Validate target selection
    if (action.targets.length === 0 && spell.aoe !== 'single') {
        return { ok: false, reasons: ['No targets specified for non-self spell'] };
    }

    return { ok: true };
}

/**
 * Create a spell cast action
 */
export function createSpellAction(
    actorId: string,
    spellId: string,
    originHex: { q: number; r: number },
    targetHex?: { q: number; r: number },
    apCost: number = 1,
    manaCost?: number
): PlannedAction {
    const spell = getSpellById(spellId);
    if (!spell) {
        throw new Error(`Unknown spell: ${spellId}`);
    }

    // Determine targets based on spell pattern
    let targets: { q: number; r: number }[] = [];
    if (spell.aoe === 'single') {
        targets = [originHex];
    } else if (targetHex) {
        targets = selectTargets(
            spell.aoe,
            originHex,
            targetHex,
            spell.range || 1,
            1 // aoeSize parameter - using 1 as default
        );
    }

    return {
        actor: actorId,
        kind: 'cast',
        targets,
        cost: {
            ap: apCost,
            mana: manaCost || spell.manaCost
        },
        data: {
            spellId,
            originHex,
            targetHex
        }
    };
}

/**
 * Quick spell casting utility for common patterns
 */
export function castSpell(
    casterId: string,
    caster: Unit,
    spellId: string,
    originHex: { q: number; r: number },
    targetHex?: { q: number; r: number }
): PlannedAction | null {
    const spell = getSpellById(spellId);
    if (!spell) {
        console.warn(`🔮 Unknown spell: ${spellId}`);
        return null;
    }

    // Check if casting is allowed
    const gatingResult = checkFullGating(caster, spell);
    if (!gatingResult.canCast) {
        console.warn(`🔮 Cannot cast ${spell.name}:`, gatingResult.reasons);
        return null;
    }

    // Create and return action
    return createSpellAction(casterId, spellId, originHex, targetHex);
}

/**
 * Get available spells for action menu
 */
export function getAvailableSpellActions(
    caster: Unit,
    availableSpellIds: string[]
): Array<{ spell: Spell; canCast: boolean; reason?: string }> {
    return availableSpellIds.map(spellId => {
        const spell = getSpellById(spellId);
        if (!spell) {
            return {
                spell: {
                    id: spellId,
                    name: 'Unknown',
                    school: 'Fire',
                    level: 1,
                    manaCost: 0,
                    apCost: 1,
                    range: 1,
                    aoe: 'single',
                    effects: [],
                    needsLOS: true
                } as unknown as Spell,
                canCast: false,
                reason: 'Spell not found'
            };
        }

        const gatingResult = checkFullGating(caster, spell);
        return {
            spell,
            canCast: gatingResult.canCast,
            reason: gatingResult.canCast ? undefined : gatingResult.reasons.join(', ')
        };
    });
}

/**
 * Helper to check if any spells are available
 */
export function hasAvailableSpells(
    caster: Unit,
    availableSpellIds: string[]
): boolean {
    return getAvailableSpellActions(caster, availableSpellIds)
        .some(action => action.canCast);
}