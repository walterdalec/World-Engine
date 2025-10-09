/**
 * Character Creator Builder
 * TODO #16 — Character Creator & Progression Bridge
 * 
 * Builds complete characters from creator input, integrating with:
 * - Battle system Unit ty  // Calculate AP (base 10, modified by SPD)
  const spd = unit.meta?.baseStats?.spd || 10;
  const spdMod = Math.floor((spd - 10) / 2);
  if (unit.meta) {
    unit.meta.maxAp = 10 + spdMod;
    unit.meta.ap = unit.meta.maxAp;
  } * - Save/load system compatibility
 * - Magic system integration
 * - Commander and formation systems
 */

import type { CreatorInput, CreatorResult, CharacterSummary } from './types';
import type { Unit, UnitStats, StatusEffect, Skill } from '../../features/battle/types';
import { validateInput } from './validate';
import { seedLoadout } from './seed';
import { SpeciesMods, BackgroundMods, ArchetypeDefaults, BaseStatValue } from './rules';

/**
 * Main character builder function
 */
export function buildCharacter(input: CreatorInput): CreatorResult {
    // Validate input first
    const validation = validateInput(input);
    if (!validation.ok) {
        return {
            hero: {} as Unit,
            errors: validation.reasons.map(reason => getErrorMessage(reason))
        };
    }

    try {
        // Apply species and background modifiers to base stats
        const finalStats = calculateFinalStats(input);

        // Build core unit structure
        const hero = buildCoreUnit(input, finalStats);

        // Apply equipment and abilities
        seedLoadout(hero, input);

        // Calculate derived stats (HP, MP, AP, etc.)
        updateDerivedStats(hero);

        // Apply commander modifications if needed
        if (input.wantsCommander) {
            applyCommanderPath(hero, input);
        }

        // Generate character summary
        const summary = generateCharacterSummary(hero, input);

        const result: CreatorResult = {
            hero,
            summary,
            errors: validation.warnings?.map(w => getWarningMessage(w))
        };

        return result;

    } catch (error) {
        return {
            hero: {} as Unit,
            errors: [`Character creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        };
    }
}

/**
 * Calculate final stats with species and background modifiers
 */
function calculateFinalStats(input: CreatorInput): UnitStats {
    const species = SpeciesMods[input.species];
    const background = BackgroundMods[input.background];

    // Start with allocated stats
    const baseStats = { ...input.stats };

    // Apply species modifiers
    for (const [stat, modifier] of Object.entries(species.statModifiers)) {
        if (baseStats[stat as keyof typeof baseStats] !== undefined && modifier !== undefined) {
            baseStats[stat as keyof typeof baseStats] += modifier;
        }
    }

    // Apply background modifiers
    for (const [stat, modifier] of Object.entries(background.statModifiers)) {
        if (baseStats[stat as keyof typeof baseStats] !== undefined && modifier !== undefined) {
            baseStats[stat as keyof typeof baseStats] += modifier;
        }
    }

    // Ensure stats stay within valid ranges
    for (const stat of Object.keys(baseStats)) {
        const key = stat as keyof typeof baseStats;
        baseStats[key] = Math.max(3, Math.min(20, baseStats[key]));
    }

    // Convert to battle system UnitStats format
    return {
        hp: 1, // Will be calculated in updateDerivedStats
        maxHp: 1,
        atk: Math.floor((baseStats.str - 10) / 2),
        def: Math.floor((baseStats.con - 10) / 2),
        mag: Math.floor((baseStats.int - 10) / 2),
        res: Math.floor((baseStats.wis - 10) / 2),
        spd: Math.floor((baseStats.dex - 10) / 2) + Math.floor((baseStats.spd - 10) / 2),
        rng: 1, // Base range, modified by equipment
        move: 3 + Math.floor((baseStats.spd - 10) / 4) // Base movement
    };
}

/**
 * Build the core Unit structure
 */
function buildCoreUnit(input: CreatorInput, stats: UnitStats): Unit {
    const archetypeDef = ArchetypeDefaults[input.archetype];

    const unit: Unit = {
        id: generateUnitId('HERO'),
        name: input.name,
        kind: input.wantsCommander ? "HeroCommander" : "Mercenary",
        faction: "Player",
        team: input.team as 'Player',
        race: input.species,
        archetype: input.archetype,
        level: input.level,
        stats,
        statuses: [] as StatusEffect[],
        skills: [], // Will be populated by seedLoadout
        pos: undefined, // Set when spawned into world
        isCommander: input.wantsCommander || false,
        isDead: false,
        facing: input.formation?.facing || 0,
        hasMoved: false,
        hasActed: false,
        meta: {
            isHero: true,
            species: input.species,
            background: input.background,
            baseStats: input.stats,
            formation: input.formation,
            magicMasteries: {},
            knownSpells: [],
            traits: input.traits || [],
            portraitSeed: input.portraitSeed,
            creationSeed: input.seed
        }
    };

    // Set up magic masteries
    if (input.masteries && unit.meta) {
        for (const mastery of input.masteries) {
            unit.meta.magicMasteries[mastery.school] = mastery.rank;
        }
    }

    // Set up known spells
    if (input.spells && unit.meta) {
        unit.meta.knownSpells = input.spells.map(spell => spell.id);
    }

    return unit;
}

/**
 * Update derived stats based on level, equipment, and abilities
 */
function updateDerivedStats(unit: Unit): void {
    const con = unit.meta?.baseStats?.con || 10;
    const int = unit.meta?.baseStats?.int || 10;
    const wis = unit.meta?.baseStats?.wis || 10;

    // Calculate HP (10 + CON modifier + level * (CON modifier + 2))
    const conMod = Math.floor((con - 10) / 2);
    const baseHP = 10 + conMod + (unit.level * (Math.max(1, conMod + 2)));
    unit.stats.maxHp = baseHP;
    unit.stats.hp = baseHP;

    // Calculate MP for spellcasters (based on INT and WIS)
    const intMod = Math.floor((int - 10) / 2);
    const wisMod = Math.floor((wis - 10) / 2);
    const spellcastingMod = Math.max(intMod, wisMod);

    if (unit.meta?.knownSpells?.length > 0 && unit.meta) {
        const baseMP = Math.max(0, spellcastingMod + unit.level);
        unit.meta.maxMp = baseMP;
        unit.meta.mp = baseMP;
    }

    // Calculate AP (base 10, modified by SPD)
    const spd = unit.meta?.baseStats?.spd || 10;
    const spdMod = Math.floor((spd - 10) / 2);
    if (unit.meta) {
        unit.meta.maxAp = 10 + spdMod;
        unit.meta.ap = unit.meta.maxAp;
    }
}

/**
 * Apply commander-specific modifications
 */
function applyCommanderPath(unit: Unit, input: CreatorInput): void {
    unit.isCommander = true;
    unit.kind = "HeroCommander";

    if (!unit.meta) return;

    // Set command radius based on charisma and level
    const cha = unit.meta.baseStats?.cha || 10;
    const chaMod = Math.floor((cha - 10) / 2);
    unit.meta.commandRadius = 2 + Math.max(0, chaMod);

    // Set up auras
    if (input.auras) {
        unit.meta.auras = input.auras;
    }

    // Set up command abilities
    if (input.commandLoadout) {
        unit.meta.commandAbilities = input.commandLoadout;
    }    // Add leadership-related stats bonuses
    unit.stats.atk += 1; // Commanders get slight combat bonus
    unit.stats.def += 1;
}

/**
 * Generate a human-readable character summary
 */
function generateCharacterSummary(unit: Unit, input: CreatorInput): CharacterSummary {
    const species = SpeciesMods[input.species];
    const background = BackgroundMods[input.background];
    const archetypeDef = ArchetypeDefaults[input.archetype];

    // Generate title
    let title = `${species.name} ${archetypeDef.name}`;
    if (unit.isCommander) {
        title = `${title} Commander`;
    }

    // Generate description
    const description = `A level ${unit.level} ${species.name.toLowerCase()} ${archetypeDef.name.toLowerCase()} ` +
        `with a ${background.name.toLowerCase()} background. ${species.description}`;

    // Determine combat role
    let combatRole: string = archetypeDef.combatRole;
    if (unit.isCommander) {
        combatRole = 'leader';
    }    // List specializations
    const specializations = [];
    if (unit.meta?.magicMasteries) {
        for (const [school, rank] of Object.entries(unit.meta.magicMasteries)) {
            const rankName = ['', 'Basic', 'Skilled', 'Expert', 'Grandmaster'][rank as number] || 'Unknown';
            specializations.push(`${rankName} ${school} Magic`);
        }
    }

    // Add archetype specializations
    if (archetypeDef.combatRole === 'ranged') {
        specializations.push('Ranged Combat');
    } else if (archetypeDef.combatRole === 'melee') {
        specializations.push('Melee Combat');
    }

    // List known spells
    const knownSpells = unit.meta?.knownSpells || [];

    // Generate tactical notes
    const tacticalNotes = [];
    if (unit.meta?.formation) {
        tacticalNotes.push(`Prefers ${unit.meta.formation.row} row positioning`);
    }
    if (archetypeDef.formationPreference !== 'flexible') {
        tacticalNotes.push(`${archetypeDef.name}s typically fight in the ${archetypeDef.formationPreference}`);
    }
    if (unit.isCommander) {
        tacticalNotes.push(`Commands from within ${unit.meta?.commandRadius || 2} hex radius`);
    }

    return {
        name: unit.name,
        title,
        description,
        combatRole,
        specialization: specializations,
        knownSpells,
        commandAbilities: unit.meta?.commandAbilities,
        tacticalNotes
    };
}

/**
 * Generate unique unit ID
 */
function generateUnitId(prefix: string = 'UNIT'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
        'character_name_required': 'Character name is required.',
        'team_assignment_required': 'Team assignment is required.',
        'invalid_level_range': 'Character level must be between 1 and 20.',
        'stat_budget_exceeded': 'Stat allocation exceeds available points.',
        'commander_requires_level_3': 'Commander path requires at least level 3.',
        'commander_requires_charisma_12': 'Commander path requires at least 12 Charisma.',
        'too_many_spells': 'Too many spells selected for this level.',
        'invalid_mastery_rank': 'Invalid mastery rank for character level.'
    };

    return messages[errorCode] || `Error: ${errorCode}`;
}

/**
 * Get user-friendly warning message
 */
function getWarningMessage(warningCode: string): string {
    const messages: Record<string, string> = {
        'stat_points_remaining': 'You have unspent stat points.',
        'extremely_specialized_build': 'This is an extremely specialized build.',
        'archetype_not_traditionally_commander': 'This archetype is not traditionally suited for command.',
        'non_caster_with_many_spells': 'Non-casters typically know fewer spells.',
        'ranged_weapon_on_non_ranged_archetype': 'Ranged weapons are unusual for this archetype.'
    };

    return messages[warningCode] || `Warning: ${warningCode}`;
}
