// Visual Asset Layering System
// Maps species + archetype combinations to asset layers for portrait generation

import { assetManager } from './assets';

export interface AssetLayer {
    category: 'base' | 'clothing' | 'hair' | 'accessories' | 'weapons' | 'effects';
    path: string;
    zIndex: number;
    optional?: boolean;
    variants?: string[];
}

export interface VisualManifestEntry {
    species: string;
    archetype: string;
    layers: AssetLayer[];
}

// Core asset layering manifest
export const VISUAL_MANIFEST: Record<string, Record<string, AssetLayer[]>> = {
    // Human combinations
    Human: {
        Warrior: [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/short_brown.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/warrior_armor.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sword.svg', zIndex: 50, optional: true }
        ],
        Mage: [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/long_blonde.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/staff.svg', zIndex: 50, optional: true }
        ],
        Ranger: [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/short_brown.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        Guardian: [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/short_brown.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/warrior_armor.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sword.svg', zIndex: 50, optional: true }
        ],
        Scholar: [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/long_blonde.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 }
        ],
        Rogue: [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/short_brown.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        Artificer: [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/short_brown.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        Healer: [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/long_blonde.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 }
        ]
    },

    // Draketh combinations
    Draketh: {
        Warrior: [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/warrior_armor.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sword.svg', zIndex: 50, optional: true }
        ],
        Mage: [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/staff.svg', zIndex: 50, optional: true }
        ],
        Ranger: [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        Guardian: [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/warrior_armor.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sword.svg', zIndex: 50, optional: true }
        ],
        Scholar: [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 }
        ],
        Rogue: [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        Artificer: [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        Healer: [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 }
        ]
    },

    // Sylvanborn combinations
    Sylvanborn: {
        Warrior: [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sword.svg', zIndex: 50, optional: true }
        ],
        Mage: [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/staff.svg', zIndex: 50, optional: true }
        ],
        Ranger: [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        Guardian: [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sword.svg', zIndex: 50, optional: true }
        ],
        Scholar: [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 }
        ],
        Rogue: [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        Artificer: [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        Healer: [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 }
        ]
    }
};

// Extended manifest for World Engine specific classes
export const EXTENDED_MANIFEST: Record<string, Record<string, AssetLayer[]>> = {
    // Class-specific combinations for all species
    Human: {
        ...VISUAL_MANIFEST.Human,
        'Thorn Knight': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/short_brown.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/warrior_armor.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sword.svg', zIndex: 50, optional: true }
        ],
        'Sapling Adept': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/long_blonde.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/staff.svg', zIndex: 50, optional: true }
        ],
        'Greenwarden': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/short_brown.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        'Bloom Caller': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'hair', path: 'hair/long_blonde.svg', zIndex: 30, variants: ['hair/short_brown.svg', 'hair/long_blonde.svg'] },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/staff.svg', zIndex: 50, optional: true }
        ]
    },

    Draketh: {
        ...VISUAL_MANIFEST.Draketh,
        'Thorn Knight': [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/warrior_armor.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sword.svg', zIndex: 50, optional: true }
        ],
        'Sapling Adept': [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/staff.svg', zIndex: 50, optional: true }
        ],
        'Greenwarden': [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        'Bloom Caller': [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/staff.svg', zIndex: 50, optional: true }
        ]
    },

    Sylvanborn: {
        ...VISUAL_MANIFEST.Sylvanborn,
        'Thorn Knight': [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/warrior_armor.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sword.svg', zIndex: 50, optional: true }
        ],
        'Sapling Adept': [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/staff.svg', zIndex: 50, optional: true }
        ],
        'Greenwarden': [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/ranger_leather.svg', zIndex: 20 }
        ],
        'Bloom Caller': [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing', path: 'clothing/mage_robes.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/staff.svg', zIndex: 50, optional: true }
        ]
    }
};

/**
 * Get asset layers for a species + archetype combination
 */
export function getAssetLayers(species: string, archetype: string): AssetLayer[] {
    // Try extended manifest first (includes World Engine specific classes)
    const speciesManifest = EXTENDED_MANIFEST[species] || VISUAL_MANIFEST[species];
    if (!speciesManifest) {
        console.warn(`No visual manifest found for species: ${species}`);
        return [];
    }

    const layers = speciesManifest[archetype];
    if (!layers) {
        console.warn(`No visual layers found for ${species} ${archetype}`);
        return speciesManifest.Warrior || []; // Fallback to warrior
    }

    return layers;
}

/**
 * Load and layer assets into a composite portrait
 */
export async function loadLayeredPortrait(species: string, archetype: string, characterName?: string): Promise<string> {
    const layers = getAssetLayers(species, archetype);
    if (layers.length === 0) {
        console.warn('No layers found, using fallback');
        return '<svg width="300" height="380" viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#374151"/><text x="150" y="190" text-anchor="middle" fill="#9ca3af" font-size="14">No Portrait</text></svg>';
    }

    try {
        // Sort layers by zIndex
        const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

        // Load all layer assets
        const layerContents: string[] = [];
        for (const layer of sortedLayers) {
            try {
                let assetPath = layer.path;

                // Handle variants - pick random or based on character name
                if (layer.variants && layer.variants.length > 0) {
                    if (characterName) {
                        // Use character name as seed for consistent variants
                        const seed = characterName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        assetPath = layer.variants[seed % layer.variants.length];
                    } else {
                        assetPath = layer.variants[Math.floor(Math.random() * layer.variants.length)];
                    }
                }

                const assetContent = await assetManager.loadAssetContent({
                    path: assetPath,
                    category: layer.category,
                    id: `${species}_${archetype}_${layer.category}`
                } as any);
                if (assetContent) {
                    layerContents.push(assetContent);
                } else if (!layer.optional) {
                    console.warn(`Failed to load required layer: ${assetPath}`);
                }
            } catch (error) {
                if (!layer.optional) {
                    console.error(`Error loading layer ${layer.path}:`, error);
                }
            }
        }

        // Combine all layers into a single SVG
        const compositeSVG = combineLayersToSVG(layerContents);
        return compositeSVG;

    } catch (error) {
        console.error('Error creating layered portrait:', error);
        return '<svg width="300" height="380" viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ef4444" opacity="0.2"/><text x="150" y="190" text-anchor="middle" fill="#dc2626" font-size="14">Error Loading</text></svg>';
    }
}

/**
 * Combine multiple SVG layer contents into a single composite SVG
 */
function combineLayersToSVG(layerContents: string[]): string {
    const svgElements: string[] = [];

    for (const content of layerContents) {
        if (!content.trim()) continue;

        // Extract content between svg tags (remove svg wrapper)
        const match = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
        if (match && match[1]) {
            svgElements.push(match[1].trim());
        }
    }

    // Combine into final composite SVG
    return `<svg width="300" height="380" viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg">
        ${svgElements.join('\n')}
    </svg>`;
}

/**
 * Check if a species + archetype combination is supported
 */
export function isSupported(species: string, archetype: string): boolean {
    const speciesManifest = EXTENDED_MANIFEST[species] || VISUAL_MANIFEST[species];
    return !!(speciesManifest && speciesManifest[archetype]);
}

/**
 * Get all supported species
 */
export function getSupportedSpecies(): string[] {
    return Object.keys(EXTENDED_MANIFEST);
}

/**
 * Get all supported archetypes for a species
 */
export function getSupportedArchetypes(species: string): string[] {
    const speciesManifest = EXTENDED_MANIFEST[species] || VISUAL_MANIFEST[species];
    return speciesManifest ? Object.keys(speciesManifest) : [];
}