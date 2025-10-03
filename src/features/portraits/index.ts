// World Engine Visual System - Simple PNG Portrait System
// Clean, modern approach using layered PNG assets

// === SIMPLE PORTRAIT SYSTEM ===
export { SimplePortraitPreview } from './SimplePortraitPreview';
export { SimplePortraitTest } from './SimplePortraitTest';
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
} from './simple-portraits';

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

// === DEVELOPMENT TOOLS ===
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
     * Test multiple species/archetype combinations
     */
    testMultipleCombinations: async () => {
        const species = SimpleUtils.getAvailableSpecies();
        const archetypes = SimpleUtils.getAvailableArchetypes();
        const genders: ('male' | 'female')[] = ['male', 'female'];

        console.log(`🎭 Testing ${species.length}×${archetypes.length}×${genders.length} combinations...`);

        const results = [];
        // Test a small sample to avoid overwhelming the browser
        for (const s of species.slice(0, 2)) {
            for (const a of archetypes.slice(0, 2)) {
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

// === VERSION INFO ===
export const VERSION = '2.0.0-simple';

// === NOTE ABOUT LEGACY SYSTEM ===
/*
The old SVG-based portrait system has been moved to:
src/visuals/legacy-svg-system/

This includes:
- PortraitPreview.tsx (old React component)
- service.ts (complex portrait generation)  
- renderer2d.tsx (SVG rendering)
- assets.ts (SVG asset management)
- manifest.ts (asset catalogs)
- And other supporting files

The legacy system is preserved for future development but 
isolated from the main game to prevent conflicts.
*/