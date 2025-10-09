/**
 * Character Creator Module
 * TODO #16 — Character Creator & Progression Bridge
 * 
 * Main exports for the character creation system
 */

// Core types and interfaces
// Import types and functions for utility exports
import type { CreatorInput, ArchetypeId, SpeciesId, BackgroundId, StatAllocation, MasteryPick } from './types';
import { StatBudgetByLevel, StatPointCost, MaxPerStat, ArchetypeDefaults } from './rules';

export type {
    CreatorInput, CreatorResult, CharacterSummary, ValidationResult,
    SpeciesId, BackgroundId, ArchetypeId, StatAllocation, MasteryPick, SpellPick,
    FormationData, EquipmentPrefs, SpawnConfig,
    SpeciesDefinition, BackgroundDefinition, ArchetypeDefinition
} from './types';

// Main character builder function
export { buildCharacter } from './builder';

// Validation functions
export {
    validateInput, validateStatAllocation, validateMagicSystem,
    validateCommanderPath, validateFormation, validateEquipment, validateTraits,
    getErrorMessage
} from './validate';

// Rules and data
export {
    StatBudgetByLevel, StatPointCost, MaxPerStat, MinPerStat, BaseStatValue,
    SpeciesMods, BackgroundMods, ArchetypeDefaults,
    MasteryLevelGate, SpellLevelGate, CommanderRequirements
} from './rules';

// Equipment and ability seeding
export { seedLoadout } from './seed';

// Utility functions for UI integration
export const CharacterCreator = {
    // Quick character generation
    createRandomCharacter: (level: number = 1, archetype?: ArchetypeId): CreatorInput => {
        const species: SpeciesId[] = ['human', 'sylvanborn', 'nightborn', 'stormcaller', 'crystalborn', 'draketh', 'alloy', 'voidkin'];
        const backgrounds: BackgroundId[] = ['commoner', 'noble', 'outcast', 'acolyte', 'ranger', 'scholar', 'mercenary', 'wanderer'];
        const archetypes: ArchetypeId[] = ['warrior', 'ranger', 'mage', 'priest', 'commander', 'knight', 'mystic', 'guardian', 'chanter', 'corsair'];

        const randomSpecies = species[Math.floor(Math.random() * species.length)];
        const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        const randomArchetype = archetype || archetypes[Math.floor(Math.random() * archetypes.length)];

        // Generate random but balanced stats
        const budget = StatBudgetByLevel(level);
        const baseStats = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8, spd: 8, lck: 8 };

        // Distribute points randomly but favor archetype primary stats
        const archetypeData = ArchetypeDefaults[randomArchetype];
        let remainingPoints = budget;

        // Add some random variation
        const statKeys = Object.keys(baseStats) as (keyof StatAllocation)[];
        while (remainingPoints > 0) {
            const stat = statKeys[Math.floor(Math.random() * statKeys.length)];
            if (baseStats[stat] < MaxPerStat) {
                const cost = StatPointCost(baseStats[stat] + 1);
                if (cost <= remainingPoints) {
                    baseStats[stat]++;
                    remainingPoints -= cost;
                }
            }
            if (remainingPoints <= 0) break;
        }

        return {
            name: generateRandomName(randomSpecies),
            team: 'Player',
            species: randomSpecies,
            background: randomBackground,
            archetype: randomArchetype,
            level,
            stats: baseStats,
            masteries: generateRandomMasteries(randomArchetype, level),
            formation: {
                row: archetypeData.formationPreference === 'flexible' ?
                    (Math.random() > 0.5 ? 'front' : 'back') : archetypeData.formationPreference,
                slot: Math.floor(Math.random() * 6),
                facing: Math.floor(Math.random() * 6) as 0 | 1 | 2 | 3 | 4 | 5
            }
        };
    },

    // Preset character builds
    getPresetBuilds: (): Record<string, CreatorInput> => ({
        'knight_tank': {
            name: 'Sir Marcus',
            team: 'Player',
            species: 'human',
            background: 'noble',
            archetype: 'knight',
            level: 5,
            stats: { str: 15, dex: 10, con: 14, int: 8, wis: 10, cha: 13, spd: 8, lck: 8 },
            masteries: [],
            formation: { row: 'front', slot: 2, facing: 0 }
        },
        'elven_ranger': {
            name: 'Lyralei',
            team: 'Player',
            species: 'sylvanborn',
            background: 'ranger',
            archetype: 'ranger',
            level: 4,
            stats: { str: 10, dex: 16, con: 12, int: 10, wis: 14, cha: 8, spd: 12, lck: 10 },
            masteries: [{ school: 'Nature', rank: 2 }],
            formation: { row: 'back', slot: 1, facing: 3 }
        },
        'draconic_mage': {
            name: 'Pyraxis',
            team: 'Player',
            species: 'draketh',
            background: 'scholar',
            archetype: 'mage',
            level: 6,
            stats: { str: 8, dex: 10, con: 12, int: 16, wis: 12, cha: 12, spd: 8, lck: 10 },
            masteries: [{ school: 'Fire', rank: 3 }, { school: 'Arcane', rank: 2 }],
            formation: { row: 'back', slot: 4, facing: 0 }
        },
        'battle_commander': {
            name: 'General Kane',
            team: 'Player',
            species: 'human',
            background: 'mercenary',
            archetype: 'commander',
            level: 8,
            stats: { str: 14, dex: 11, con: 13, int: 12, wis: 11, cha: 16, spd: 10, lck: 9 },
            masteries: [{ school: 'Spirit', rank: 2 }],
            wantsCommander: true,
            formation: { row: 'front', slot: 3, facing: 0 }
        }
    })
};

// Helper functions
function generateRandomName(species: SpeciesId): string {
    const namesBySpecies: Record<SpeciesId, string[]> = {
        human: ['Marcus', 'Elena', 'Thomas', 'Isabella', 'William', 'Catherine', 'James', 'Victoria'],
        sylvanborn: ['Lyralei', 'Silvanos', 'Mirana', 'Thessarian', 'Alleria', 'Tyrande', 'Malfurion', 'Lunara'],
        nightborn: ['Shar', 'Nyx', 'Umbra', 'Raven', 'Nocturne', 'Vesper', 'Shadow', 'Dusk'],
        stormcaller: ['Tempest', 'Gale', 'Thunder', 'Lightning', 'Storm', 'Zephyr', 'Nimbus', 'Cyclone'],
        crystalborn: ['Prism', 'Quartz', 'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Crystal', 'Gemma'],
        draketh: ['Pyraxis', 'Ignus', 'Flameheart', 'Ember', 'Cinder', 'Blaze', 'Inferno', 'Scorch'],
        alloy: ['Steelforge', 'Ironcore', 'Copper', 'Chrome', 'Titanium', 'Bronze', 'Silver', 'Platinum'],
        voidkin: ['Void', 'Nexus', 'Cosmos', 'Stellar', 'Astral', 'Nova', 'Nebula', 'Quantum']
    };

    const names = namesBySpecies[species] || namesBySpecies.human;
    return names[Math.floor(Math.random() * names.length)];
}

function generateRandomMasteries(archetype: ArchetypeId, level: number): MasteryPick[] {
    const archetypeData = ArchetypeDefaults[archetype];
    if (!archetypeData.magicTraditions) return [];

    const masteries: MasteryPick[] = [];
    const availableSchools = [...archetypeData.magicTraditions];

    // Add 1-2 masteries based on level
    const masteryCount = level >= 5 ? 2 : 1;

    for (let i = 0; i < masteryCount && availableSchools.length > 0; i++) {
        const schoolIndex = Math.floor(Math.random() * availableSchools.length);
        const school = availableSchools[schoolIndex];
        availableSchools.splice(schoolIndex, 1);

        // Determine appropriate rank based on level
        let rank: 1 | 2 | 3 | 4 = 1;
        if (level >= 10) rank = Math.min(4, Math.floor(Math.random() * 3) + 2) as 1 | 2 | 3 | 4;
        else if (level >= 7) rank = Math.min(3, Math.floor(Math.random() * 2) + 2) as 1 | 2 | 3 | 4;
        else if (level >= 4) rank = Math.min(2, Math.floor(Math.random() * 2) + 1) as 1 | 2 | 3 | 4;

        masteries.push({ school: school as any, rank });
    }

    return masteries;
}