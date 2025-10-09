/**
 * Character Creator Validation
 * TODO #16 — Character Creator & Progression Bridge
 * 
 * Validates character creation input against rules and constraints:
 * - Stat budget compliance
 * - Level gate requirements for spells and masteries
 * - Equipment and ability prerequisites
 * - Formation and tactical validation
 */

import type { CreatorInput, ValidationResult, StatAllocation } from './types';
import {
    StatBudgetByLevel, StatPointCost, MaxPerStat, MinPerStat, BaseStatValue,
    SpeciesMods, BackgroundMods, ArchetypeDefaults, MasteryLevelGate,
    SpellLevelGate, CommanderRequirements
} from './rules';

/**
 * Validates complete character creation input
 */
export function validateInput(input: CreatorInput): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Basic input validation
    if (!input.name?.trim()) reasons.push('character_name_required');
    if (!input.team?.trim()) reasons.push('team_assignment_required');
    if (input.level < 1 || input.level > 20) reasons.push('invalid_level_range');

    // Species/background/archetype validation
    if (!SpeciesMods[input.species]) reasons.push('invalid_species');
    if (!BackgroundMods[input.background]) reasons.push('invalid_background');
    if (!ArchetypeDefaults[input.archetype]) reasons.push('invalid_archetype');

    // Stat budget validation
    const statValidation = validateStatAllocation(input.stats, input.level);
    if (!statValidation.ok) {
        reasons.push(...statValidation.reasons);
    }
    if (statValidation.warnings) {
        warnings.push(...statValidation.warnings);
    }

    // Magic system validation
    const magicValidation = validateMagicSystem(input.masteries || [], input.spells || [], input.level, input.archetype);
    if (!magicValidation.ok) {
        reasons.push(...magicValidation.reasons);
    }
    if (magicValidation.warnings) {
        warnings.push(...magicValidation.warnings);
    }

    // Commander path validation
    if (input.wantsCommander) {
        const commanderValidation = validateCommanderPath(input);
        if (!commanderValidation.ok) {
            reasons.push(...commanderValidation.reasons);
        }
        if (commanderValidation.warnings) {
            warnings.push(...commanderValidation.warnings);
        }
    }

    // Formation validation
    if (input.formation) {
        const formationValidation = validateFormation(input.formation, input.archetype);
        if (!formationValidation.ok) {
            reasons.push(...formationValidation.reasons);
        }
        if (formationValidation.warnings) {
            warnings.push(...formationValidation.warnings);
        }
    }

    return {
        ok: reasons.length === 0,
        reasons,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validates stat point allocation
 */
export function validateStatAllocation(stats: StatAllocation, level: number): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    const budget = StatBudgetByLevel(level);
    let totalCost = 0;

    // Calculate total point cost and check individual stat limits
    for (const [statName, value] of Object.entries(stats)) {
        if (value < MinPerStat) {
            reasons.push(`stat_${statName}_below_minimum`);
        }
        if (value > MaxPerStat) {
            reasons.push(`stat_${statName}_above_maximum`);
        }
        if (value >= BaseStatValue) {
            totalCost += StatPointCost(value);
        }
    }

    // Check budget compliance
    if (totalCost > budget) {
        reasons.push('stat_budget_exceeded');
    } else if (totalCost < budget - 5) {
        warnings.push('stat_points_remaining');
    }

    // Check for extremely unbalanced builds
    const statValues = Object.values(stats);
    const highest = Math.max(...statValues);
    const lowest = Math.min(...statValues);
    if (highest - lowest > 10) {
        warnings.push('extremely_specialized_build');
    }

    return {
        ok: reasons.length === 0,
        reasons,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validates magic system choices
 */
export function validateMagicSystem(
    masteries: Array<{ school: any; rank: any }>,
    spells: Array<{ id: string; school?: any; level?: number }>,
    level: number,
    archetype: string
): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    const archetypeData = ArchetypeDefaults[archetype as keyof typeof ArchetypeDefaults];

    // Validate mastery level gates
    for (const mastery of masteries) {
        const requiredLevel = MasteryLevelGate[mastery.rank as keyof typeof MasteryLevelGate];
        if (level < requiredLevel) {
            reasons.push(`mastery_${mastery.school}_rank_${mastery.rank}_requires_level_${requiredLevel}`);
        }

        // Check if archetype supports this magic tradition
        if (archetypeData?.magicTraditions && !archetypeData.magicTraditions.includes(mastery.school)) {
            warnings.push(`archetype_${archetype}_not_traditional_${mastery.school}_user`);
        }
    }

    // Validate spell selections
    const masteryMap = new Map(masteries.map(m => [m.school, m.rank]));

    for (const spell of spells) {
        // Check spell level against character level
        if (spell.level !== undefined) {
            const requiredLevel = SpellLevelGate[spell.level as keyof typeof SpellLevelGate];
            if (level < requiredLevel) {
                reasons.push(`spell_${spell.id}_level_${spell.level}_requires_character_level_${requiredLevel}`);
            }

            // Check if character has sufficient mastery
            if (spell.school) {
                const masteryRank = masteryMap.get(spell.school) || 0;
                const requiredMastery = Math.min(4, Math.ceil(spell.level / 2) + 1);
                if (masteryRank < requiredMastery) {
                    reasons.push(`spell_${spell.id}_requires_${spell.school}_mastery_rank_${requiredMastery}`);
                }
            }
        }
    }

    // Check for reasonable spell counts
    const maxCantrips = Math.floor(level / 2) + 2;
    const maxSpells = Math.max(0, level - 1);
    const cantripCount = spells.filter(s => s.level === 0).length;
    const spellCount = spells.filter(s => (s.level || 0) > 0).length;

    if (cantripCount > maxCantrips) {
        reasons.push('too_many_cantrips');
    }
    if (spellCount > maxSpells) {
        reasons.push('too_many_spells');
    }

    // Warn about non-caster archetypes with many spells
    if (!archetypeData?.magicTraditions && spells.length > 2) {
        warnings.push('non_caster_with_many_spells');
    }

    return {
        ok: reasons.length === 0,
        reasons,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validates commander path requirements
 */
export function validateCommanderPath(input: CreatorInput): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Check minimum level
    if (input.level < CommanderRequirements.minLevel) {
        reasons.push(`commander_requires_level_${CommanderRequirements.minLevel}`);
    }

    // Check minimum charisma
    if (input.stats.cha < CommanderRequirements.minCharisma) {
        reasons.push(`commander_requires_charisma_${CommanderRequirements.minCharisma}`);
    }

    // Check archetype compatibility
    const archetypeData = ArchetypeDefaults[input.archetype];
    if (!archetypeData?.commandCapable && input.archetype !== 'commander') {
        warnings.push('archetype_not_traditionally_commander');
    }

    // Validate command loadout
    if (input.commandLoadout && input.commandLoadout.length > CommanderRequirements.maxCommandAbilities) {
        reasons.push('too_many_command_abilities');
    }

    // Validate auras
    if (input.auras && input.auras.length > CommanderRequirements.maxAuras) {
        reasons.push('too_many_auras');
    }

    return {
        ok: reasons.length === 0,
        reasons,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validates formation and positioning
 */
export function validateFormation(formation: any, archetype: string): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Check valid formation values
    if (!['front', 'back'].includes(formation.row)) {
        reasons.push('invalid_formation_row');
    }

    if (formation.slot < 0 || formation.slot > 5) {
        reasons.push('invalid_formation_slot');
    }

    if (formation.facing !== undefined && (formation.facing < 0 || formation.facing > 5)) {
        reasons.push('invalid_formation_facing');
    }

    // Check archetype formation preferences
    const archetypeData = ArchetypeDefaults[archetype as keyof typeof ArchetypeDefaults];
    if (archetypeData?.formationPreference && archetypeData.formationPreference !== 'flexible') {
        if (formation.row !== archetypeData.formationPreference) {
            warnings.push(`archetype_${archetype}_prefers_${archetypeData.formationPreference}_row`);
        }
    }

    return {
        ok: reasons.length === 0,
        reasons,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validates equipment choices against archetype and stats
 */
export function validateEquipment(equipment: any, stats: StatAllocation, archetype: string, level: number): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Equipment validation would go here
    // For now, just basic checks

    const archetypeData = ArchetypeDefaults[archetype as keyof typeof ArchetypeDefaults];    // Check if equipment matches archetype role
    if (equipment?.weaponType === 'bow' && archetypeData?.combatRole !== 'ranged') {
        warnings.push('ranged_weapon_on_non_ranged_archetype');
    }

    if (equipment?.armorType === 'plate' && archetypeData?.combatRole === 'caster') {
        warnings.push('heavy_armor_on_caster');
    }

    return {
        ok: reasons.length === 0,
        reasons,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validates trait selection
 */
export function validateTraits(traits: string[], species: any, background: any, level: number): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Check trait count limits
    const maxTraits = Math.floor(level / 3) + 2; // 2 at level 1, 3 at level 3, etc.
    if (traits.length > maxTraits) {
        reasons.push('too_many_traits');
    }

    // Check for conflicting traits
    const conflictPairs = [
        ['Brave', 'Cowardly'],
        ['Honest', 'Deceptive'],
        ['Generous', 'Greedy']
    ];

    for (const [trait1, trait2] of conflictPairs) {
        if (traits.includes(trait1) && traits.includes(trait2)) {
            reasons.push(`conflicting_traits_${trait1.toLowerCase()}_${trait2.toLowerCase()}`);
        }
    }

    return {
        ok: reasons.length === 0,
        reasons,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Gets user-friendly error messages
 */
export function getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
        'character_name_required': 'Character name is required.',
        'team_assignment_required': 'Team assignment is required.',
        'invalid_level_range': 'Character level must be between 1 and 20.',
        'invalid_species': 'Invalid species selection.',
        'invalid_background': 'Invalid background selection.',
        'invalid_archetype': 'Invalid archetype selection.',
        'stat_budget_exceeded': 'Stat allocation exceeds available points.',
        'stat_points_remaining': 'You have unspent stat points.',
        'extremely_specialized_build': 'This is an extremely specialized build. Consider balancing stats.',
        'commander_requires_level_3': 'Commander path requires at least level 3.',
        'commander_requires_charisma_12': 'Commander path requires at least 12 Charisma.',
        'too_many_command_abilities': 'Too many command abilities selected.',
        'too_many_auras': 'Too many auras selected.',
        'too_many_cantrips': 'Too many cantrips selected.',
        'too_many_spells': 'Too many spells selected.',
        'too_many_traits': 'Too many traits selected.'
    };

    return messages[errorCode] || `Unknown error: ${errorCode}`;
}
