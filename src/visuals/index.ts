// World Engine Visual System
// Main export file for the character portrait and visual generation system

// Types
export type {
    CharacterVisualData,
    PortraitOptions,
    VisualAsset,
    RenderContext,
    Visual3DContext,
    VisualPlugin,
    VisualGenerationResult
} from './types';

// Core Services
export {
    generateCharacterPortrait,
    initializeVisualSystem,
    isVisualSystemReady,
    visualService,
    bindPortraitToCharacter
} from './service';

// Asset Management
export {
    assetManager,
    ensureAssetsLoaded,
    getAssetUrl
} from './assets';

// Class/Character Mapping
export {
    getClassVisualTheme,
    getClassColors,
    getPreferredAssets,
    generateDefaultAppearance,
    getAllClassThemes,
    hasVisualTheme
} from './classmap';

// Random Generation
export {
    SeededRandom,
    generateCharacterSeed,
    createCharacterRandom,
    generateVisualVariation,
    generateMultipleVariations,
    ColorVariations
} from './seed';

// 2D Rendering
export {
    renderer2D,
    renderCharacterToCanvas,
    renderCharacterToSVG
} from './renderer2d';

// Asset Layering Manifest
export {
    loadLayeredPortrait,
    getAssetLayers,
    isSupported as isSpeciesArchetypeSupported,
    getSupportedSpecies,
    getSupportedArchetypes
} from './manifest';

// React Components
export {
    PortraitPreview,
    default as PortraitPreviewComponent
} from './PortraitPreview';

// Import types for utility functions
import { CharacterVisualData, PortraitOptions } from './types';
import { visualService, generateCharacterPortrait } from './service';

// Utility Functions
export const VisualUtils = {
    /**
     * Create character data for portrait generation
     */
    createCharacterData: (character: {
        name: string;
        species: string;
        archetype: string;
        level?: number;
    }): CharacterVisualData => ({
        name: character.name,
        species: character.species,
        archetype: character.archetype,
        level: character.level || 1,
        appearance: {}
    }),

    /**
     * Get default portrait options
     */
    getDefaultPortraitOptions: (): PortraitOptions => ({
        size: 'medium',
        format: 'svg',
        quality: 'medium',
        background: 'transparent'
    }),

    /**
     * Check if character data is valid for portrait generation
     */
    isValidCharacterData: (data: Partial<CharacterVisualData>): data is CharacterVisualData => {
        return !!(data.name && data.species && data.archetype);
    }
};

// Version info
export const VERSION = '1.0.0';

// Development helpers
export const DevTools = {
    /**
     * Get system statistics
     */
    getSystemStats: () => visualService.getStats(),

    /**
     * Test portrait generation
     */
    testPortraitGeneration: async (characterName = 'Test Character') => {
        const testData = VisualUtils.createCharacterData({
            name: characterName,
            species: 'Human',
            archetype: 'Warrior'
        });

        return generateCharacterPortrait(testData);
    },

    /**
     * Test layered portrait loading directly
     */
    testLayeredPortrait: async (characterName = 'Test Character') => {
        const { loadLayeredPortrait } = await import('./manifest');
        return loadLayeredPortrait('Human', 'Warrior', characterName);
    }
};