/**
 * Spell System - Complete spell casting with LOS-aware selectors and morale integration
 * 
 * This module provides:
 * - Type-safe spell definitions with effects and requirements
 * - LOS-aware target selection for different AOE patterns  
 * - Spell resolution with damage calculation and morale modifiers
 * - Gating system for spell requirements and restrictions
 * - Action system integration for turn-based combat
 */

// Core types
export type {
    SpellLevel,
    MasteryLevel,
    AOE,
    SpellEffect,
    SpellEffectDamage,
    SpellEffectHeal,
    SpellEffectBuff,
    SpellEffectDebuff,
    SpellEffectDoT,
    SpellEffectHoT,
    SpellEffectTerrain,
    SpellRequirements,
    Spell
} from './types';

// Re-export School from unit types
export type { School } from '../unit/types';

// Target selection
export {
    selectHexes,
    selectTargets,
    type LOSFn,
    type PassableFn,
    type OccupiedFn
} from './selectors';

// Spell registry
export {
    Spells,
    getSpellById,
    getSpellsBySchool,
    getSpellsByLevel
} from './registry';

// Spell resolution
export {
    applySpell
} from './resolver';

// Re-export DeltaBatch from action system
export type { DeltaBatch } from '../action/deltas';

// Gating system
export {
    checkGating,
    checkMultipleSpells,
    getCastableSpells,
    checkActionPoints,
    checkFullGating,
    ALLOWED,
    type GatingResult
} from './gating';

// Action system integration
export {
    validateSpellAction,
    createSpellAction,
    castSpell,
    getAvailableSpellActions,
    hasAvailableSpells
} from './action-glue';

// Usage examples and documentation
export const SPELL_SYSTEM_INFO = {
    version: '1.0.0',
    description: 'Complete spell system with LOS-aware targeting, morale integration, and action system glue',

    // Example usage:
    // 1. Check if unit can cast a spell
    //    const result = checkGating(caster, spell);
    //    if (!result.canCast) console.log(result.reasons);
    //
    // 2. Select targets for a spell
    //    const targets = selectHexes(spell, origin, target, losBlocks, passable, occupied);
    //
    // 3. Apply spell effects
    //    const deltas = applySpell(world, casterId, spell, targets);
    //
    // 4. Create spell action for turn system
    //    const action = createSpellAction(actorId, spellId, origin, target);

    features: [
        'Type-safe spell definitions with multiple effect types',
        'LOS-aware target selection for cone/line/blast patterns',
        'Morale-modified damage and debuff duration',
        'Comprehensive gating with level/mana/status requirements',
        'Action system integration for turn-based combat',
        'Sample spell registry with 6 example spells'
    ]
};