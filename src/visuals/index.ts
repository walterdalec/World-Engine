// World Engine Visual System - Simplified PNG Portrait System
// Simple layered PNG approach replacing complex SVG generation

// === NEW SIMPLE SYSTEM (Primary) ===
export { SimplePortraitPreview } from './SimplePortraitPreview';
export {
    generateSimplePortrait,
    getCachedPortrait,
    setCachedPortrait
} from './simple-portraits';
export type {
    SimplePortraitOptions,
    PortraitResult,
    PortraitLayer
} from './simple-portraits';

// Import for internal use
import {
    generateSimplePortrait,
    SimplePortraitOptions
} from './simple-portraits';// === LEGACY SYSTEM (Backward Compatibility) ===
export type {
    CharacterVisualData,
    PortraitOptions,
    VisualAsset,
    RenderContext,
    Visual3DContext,
    VisualPlugin,
    VisualGenerationResult
} from './types';

export {
    generateCharacterPortrait,
    initializeVisualSystem,
    isVisualSystemReady,
    visualService,
    bindPortraitToCharacter
} from './service';

export {
    PortraitPreview,
    default as PortraitPreviewComponent
} from './PortraitPreview';

// === UTILITY FUNCTIONS ===
export const SimpleUtils = {
    /**
     * Convert legacy character data to simple portrait options
     */
    convertToSimpleOptions: (character: {
        name: string;
        species: string;
        archetype: string;
        gender?: 'male' | 'female';
    }): SimplePortraitOptions => ({
        gender: character.gender || 'male',
        species: character.species.toLowerCase(),
        archetype: character.archetype.toLowerCase()
    }),

    /**
     * Get species options from the catalog
     */
    getAvailableSpecies: (): string[] => [
        'human', 'sylvanborn', 'alloy', 'draketh',
        'voidkin', 'crystalborn', 'stormcaller_species'
    ],

    /**
     * Get archetype options from the catalog
     */
    getAvailableArchetypes: (): string[] => [
        'greenwarden', 'thornknight', 'saplingadept', 'bloomcaller',
        'ashblade', 'cindermystic', 'dustranger', 'bonechanter',
        'stormcaller_class', 'voidwing', 'skyknight', 'windsage'
    ],

    /**
     * Get archetype by world
     */
    getArchetypesByWorld: () => ({
        Verdance: ['greenwarden', 'thornknight', 'saplingadept', 'bloomcaller'],
        Ashenreach: ['ashblade', 'cindermystic', 'dustranger', 'bonechanter'],
        Skyvault: ['stormcaller_class', 'voidwing', 'skyknight', 'windsage']
    })
};

// Legacy utility functions (for compatibility)
export const VisualUtils = {
    createCharacterData: (character: {
        name: string;
        species: string;
        archetype: string;
        level?: number;
    }) => ({
        name: character.name,
        species: character.species,
        archetype: character.archetype,
        level: character.level || 1,
        appearance: {}
    }),

    getDefaultPortraitOptions: () => ({
        size: 'medium',
        format: 'svg',
        quality: 'medium',
        background: 'transparent'
    }),

    isValidCharacterData: (data: any) => {
        return !!(data?.name && data?.species && data?.archetype);
    }
};

// Development helpers
export const DevTools = {
    /**
     * Test simple portrait generation
     */
    testSimplePortrait: async () => {
        const options: SimplePortraitOptions = {
            gender: 'male',
            species: 'human',
            archetype: 'greenwarden'
        };

        console.log('🎭 Testing simple portrait generation...');
        return generateSimplePortrait(options);
    },

    /**
     * Test all species/archetype combinations
     */
    testAllCombinations: async () => {
        const species = SimpleUtils.getAvailableSpecies();
        const archetypes = SimpleUtils.getAvailableArchetypes();
        const genders: ('male' | 'female')[] = ['male', 'female'];

        console.log(`🎭 Testing ${species.length}×${archetypes.length}×${genders.length} = ${species.length * archetypes.length * genders.length} combinations...`);

        const results = [];
        for (const s of species.slice(0, 2)) { // Test first 2 species
            for (const a of archetypes.slice(0, 2)) { // Test first 2 archetypes
                for (const g of genders) {
                    const result = await generateSimplePortrait({
                        gender: g,
                        species: s,
                        archetype: a
                    });
                    results.push({ species: s, archetype: a, gender: g, success: result.success });
                }
            }
        }

        console.log('🎭 Test results:', results);
        return results;
    }
};

// Version info
export const VERSION = '2.0.0-simple';