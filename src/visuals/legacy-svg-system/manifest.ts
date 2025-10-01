// Visual Asset Layering System
// Maps species + archetype combinations to asset layers for portrait generation

import { assetManager } from './assets';

export interface AssetLayer {
    category: 'base' | 'face/eyes' | 'face/brows' | 'face/mouth' | 'hair' | 'facial_hair' | 'clothing/verdance' | 'clothing/ashenreach' | 'clothing/skyvault' | 'accessories' | 'weapons' | 'effects';
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

// World Engine specific layered portrait configurations
export const WORLD_ENGINE_MANIFEST: Record<string, Record<string, AssetLayer[]>> = {
    // Verdance World Classes
    Human: {
        'Greenwarden': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_sharp.svg', zIndex: 15, optional: true },
            { category: 'face/brows', path: 'face/brows/brows_thick.svg', zIndex: 16, optional: true },
            { category: 'face/mouth', path: 'face/mouth/mouth_neutral.svg', zIndex: 17, optional: true },
            { category: 'hair', path: 'hair/short_straight.svg', zIndex: 30, variants: ['hair/short_straight.svg', 'hair/topknot.svg', 'hair/undercut.svg'] },
            { category: 'clothing/verdance', path: 'clothing/verdance/greenwarden.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/greenwarden_spear.svg', zIndex: 50, optional: true },
            { category: 'accessories', path: 'accessories/leaf_circlet.svg', zIndex: 35, optional: true }
        ],
        'Thorn Knight': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_heavy.svg', zIndex: 15, optional: true },
            { category: 'face/brows', path: 'face/brows/brows_thick.svg', zIndex: 16, optional: true },
            { category: 'hair', path: 'hair/short_straight.svg', zIndex: 30, variants: ['hair/short_straight.svg', 'hair/undercut.svg'] },
            { category: 'clothing/verdance', path: 'clothing/verdance/thorn_knight.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/thorn_knight_morningstar.svg', zIndex: 50, optional: true }
        ],
        'Sapling Adept': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_round.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/long_wavy.svg', zIndex: 30, variants: ['hair/long_wavy.svg', 'hair/curly.svg'] },
            { category: 'clothing/verdance', path: 'clothing/verdance/sapling_adept.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sapling_adept_staff.svg', zIndex: 50, optional: true },
            { category: 'effects', path: 'effects/aura_verdance.svg', zIndex: 60, optional: true }
        ],
        'Bloomcaller': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_glow.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/long_wavy.svg', zIndex: 30, variants: ['hair/long_wavy.svg', 'hair/curly.svg'] },
            { category: 'clothing/verdance', path: 'clothing/verdance/bloomcaller.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/bloomcaller_rod.svg', zIndex: 50, optional: true },
            { category: 'effects', path: 'effects/aura_verdance.svg', zIndex: 60, optional: true }
        ],

        // Ashenreach World Classes
        'Ashblade': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_sharp.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/short_straight.svg', zIndex: 30, variants: ['hair/short_straight.svg', 'hair/undercut.svg'] },
            { category: 'clothing/ashenreach', path: 'clothing/ashenreach/ashblade.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/ashblade_sword.svg', zIndex: 50, optional: true },
            { category: 'effects', path: 'effects/aura_ashenreach.svg', zIndex: 60, optional: true }
        ],
        'Cinder Mystic': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_glow.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/long_wavy.svg', zIndex: 30, variants: ['hair/long_wavy.svg', 'hair/curly.svg'] },
            { category: 'clothing/ashenreach', path: 'clothing/ashenreach/cinder_mystic.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/cinder_mystic_staff.svg', zIndex: 50, optional: true },
            { category: 'effects', path: 'effects/aura_ashenreach.svg', zIndex: 60, optional: true }
        ],
        'Dust Ranger': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_sharp.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/short_straight.svg', zIndex: 30, variants: ['hair/short_straight.svg', 'hair/shaved.svg'] },
            { category: 'clothing/ashenreach', path: 'clothing/ashenreach/dust_ranger.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/dust_ranger_bow.svg', zIndex: 50, optional: true }
        ],
        'Bonechanter': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_glow.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/locs.svg', zIndex: 30, variants: ['hair/locs.svg', 'hair/long_wavy.svg'] },
            { category: 'clothing/ashenreach', path: 'clothing/ashenreach/bonechanter.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/bonechanter_totem.svg', zIndex: 50, optional: true },
            { category: 'accessories', path: 'accessories/bone_charm.svg', zIndex: 35, optional: true }
        ],

        // Skyvault World Classes  
        'Stormcaller': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_glow.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/long_wavy.svg', zIndex: 30, variants: ['hair/long_wavy.svg', 'hair/curly.svg'] },
            { category: 'clothing/skyvault', path: 'clothing/skyvault/stormcaller_cls.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/stormcaller_cls_staff.svg', zIndex: 50, optional: true },
            { category: 'accessories', path: 'accessories/storm_goggles.svg', zIndex: 35, optional: true },
            { category: 'effects', path: 'effects/aura_storm.svg', zIndex: 60, optional: true }
        ],
        'Voidwing': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_sharp.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/undercut.svg', zIndex: 30, variants: ['hair/undercut.svg', 'hair/short_straight.svg'] },
            { category: 'clothing/skyvault', path: 'clothing/skyvault/voidwing.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/voidwing_daggers.svg', zIndex: 50, optional: true },
            { category: 'accessories', path: 'accessories/feather_cloak.svg', zIndex: 25, optional: true },
            { category: 'effects', path: 'effects/aura_void.svg', zIndex: 60, optional: true }
        ],
        'Sky Knight': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_heavy.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/short_straight.svg', zIndex: 30, variants: ['hair/short_straight.svg', 'hair/topknot.svg'] },
            { category: 'clothing/skyvault', path: 'clothing/skyvault/sky_knight.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/sky_knight_lance.svg', zIndex: 50, optional: true },
            { category: 'effects', path: 'effects/aura_skyvault.svg', zIndex: 60, optional: true }
        ],
        'Wind Sage': [
            { category: 'base', path: 'base/human.svg', zIndex: 1 },
            { category: 'face/eyes', path: 'face/eyes/eyes_round.svg', zIndex: 15, optional: true },
            { category: 'hair', path: 'hair/long_wavy.svg', zIndex: 30, variants: ['hair/long_wavy.svg', 'hair/topknot.svg'] },
            { category: 'clothing/skyvault', path: 'clothing/skyvault/wind_sage.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/wind_sage_fan.svg', zIndex: 50, optional: true },
            { category: 'effects', path: 'effects/aura_skyvault.svg', zIndex: 60, optional: true }
        ]
    },

    // Add other species using the base + world-specific clothing approach
    Draketh: {
        'Greenwarden': [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing/verdance', path: 'clothing/verdance/greenwarden.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/greenwarden_spear.svg', zIndex: 50, optional: true }
        ],
        'Thorn Knight': [
            { category: 'base', path: 'base/draketh.svg', zIndex: 1 },
            { category: 'clothing/verdance', path: 'clothing/verdance/thorn_knight.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/thorn_knight_morningstar.svg', zIndex: 50, optional: true }
        ]
        // Add more classes as needed
    },

    Sylvanborn: {
        'Greenwarden': [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing/verdance', path: 'clothing/verdance/greenwarden.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/greenwarden_spear.svg', zIndex: 50, optional: true },
            { category: 'effects', path: 'effects/aura_verdance.svg', zIndex: 60, optional: true }
        ],
        'Thorn Knight': [
            { category: 'base', path: 'base/sylvanborn.svg', zIndex: 1 },
            { category: 'clothing/verdance', path: 'clothing/verdance/thorn_knight.svg', zIndex: 20 },
            { category: 'weapons', path: 'weapons/thorn_knight_morningstar.svg', zIndex: 50, optional: true }
        ]
        // Add more classes as needed
    }
};

/**
 * Get asset layers for a species + archetype combination
 */
export function getAssetLayers(species: string, archetype: string): AssetLayer[] {
    // Use the new World Engine manifest
    const speciesManifest = WORLD_ENGINE_MANIFEST[species];
    if (!speciesManifest) {
        // console.warn(`No visual manifest found for species: ${species}`);
        // Try to provide a basic fallback using the species base
        const fallbackLayers: AssetLayer[] = [
            { category: 'base', path: `base/${(species || 'human').toLowerCase()}.svg`, zIndex: 1 }
        ];
        // Add basic clothing if available
        const verdanceClasses = ['Greenwarden', 'Thorn Knight', 'Sapling Adept', 'Bloomcaller'];
        const ashenreachClasses = ['Ashblade', 'Cinder Mystic', 'Dust Ranger', 'Bonechanter'];
        const skyvaultClasses = ['Stormcaller', 'Voidwing', 'Sky Knight', 'Wind Sage'];

        let world = '';
        if (verdanceClasses.includes(archetype)) world = 'verdance';
        else if (ashenreachClasses.includes(archetype)) world = 'ashenreach';
        else if (skyvaultClasses.includes(archetype)) world = 'skyvault';

        if (world) {
            fallbackLayers.push({
                category: `clothing/${world}` as AssetLayer['category'],
                path: `clothing/${world}/${(archetype || 'warrior').toLowerCase().replace(/ /g, '_')}.svg`,
                zIndex: 20
            });
        }

        return fallbackLayers;
    }

    const layers = speciesManifest[archetype];
    if (!layers) {
        // console.warn(`No visual layers found for ${species} ${archetype}`);
        return speciesManifest.Greenwarden || speciesManifest['Thorn Knight'] || []; // Fallback to available classes
    }

    return layers;
}

/**
 * Load and layer assets into a composite portrait
 */
export async function loadLayeredPortrait(species: string, archetype: string, characterName?: string): Promise<string> {
    console.log(`🎨 MANIFEST: loadLayeredPortrait called for ${species} ${archetype} (${characterName})`);
    const layers = getAssetLayers(species, archetype);
    console.log(`🎨 MANIFEST: Found ${layers.length} layers:`, layers);

    if (layers.length === 0) {
        console.warn(`⚠️ MANIFEST: No layers found for ${species} ${archetype}, using fallback`);
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
    const speciesManifest = WORLD_ENGINE_MANIFEST[species];
    return !!(speciesManifest && speciesManifest[archetype]);
}

/**
 * Get all supported species
 */
export function getSupportedSpecies(): string[] {
    return Object.keys(WORLD_ENGINE_MANIFEST);
}

/**
 * Get all supported archetypes for a species
 */
export function getSupportedArchetypes(species: string): string[] {
    const speciesManifest = WORLD_ENGINE_MANIFEST[species];
    return speciesManifest ? Object.keys(speciesManifest) : [];
}

// Enhanced portrait loading with external manifest support
export async function loadExternalManifest(): Promise<any> {
    try {
        // Use bullet-proof URL construction with PUBLIC_URL support
        const publicUrl = process.env.PUBLIC_URL || '';
        const basePath = publicUrl.replace(/\/+$/, '');
        const url = new URL(`${basePath}/assets/portraits/manifest.json`, window.location.origin).toString();
        console.log('� Fetching external manifest from:', url);
        const response = await fetch(url, { cache: 'no-store' });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        console.log('📄 Response preview:', text.substring(0, 100));

        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
            throw new Error('Received HTML instead of JSON - possible routing issue');
        }

        const manifest = JSON.parse(text);
        console.log('✅ External manifest loaded successfully:', manifest.version);
        return manifest;
    } catch (error) {
        // console.warn('Failed to load external manifest, using internal:', error);
        return null;
    }
}

// Load portrait using external manifest.json structure
export async function loadPortraitFromExternalManifest(species: string, archetype: string): Promise<string> {
    try {
        console.log(`🎨 Loading portrait from external manifest: ${species} ${archetype}`);
        const externalManifest = await loadExternalManifest();
        if (!externalManifest) {
            console.log('External manifest not available, falling back to internal');
            return loadLayeredPortrait(species, archetype);
        }

        // Find species in external manifest with proper null checking
        const speciesData = externalManifest.species?.find((s: any) =>
            s?.name?.toLowerCase() === species?.toLowerCase()
        );
        if (!speciesData) {
            console.warn(`Species ${species} not found in external manifest`);
            return loadLayeredPortrait(species, archetype);
        }

        // Build layers from external manifest structure
        const layers: AssetLayer[] = [];

        // Base layer
        layers.push({
            category: 'base',
            path: `base/${(speciesData.name || species).toLowerCase()}.svg`,
            zIndex: 1
        });

        // Face components (if available)
        if (externalManifest.categories.face) {
            Object.keys(externalManifest.categories.face).forEach((faceType, index) => {
                const faceAssets = externalManifest.categories.face[faceType];
                if (faceAssets.length > 0) {
                    layers.push({
                        category: `face/${faceType}` as AssetLayer['category'],
                        path: faceAssets[0], // Use first variant for now
                        zIndex: 15 + index,
                        optional: true
                    });
                }
            });
        }

        // Hair layer (use first available hair style)
        if (externalManifest.categories.hair && externalManifest.categories.hair.length > 0) {
            layers.push({
                category: 'hair',
                path: externalManifest.categories.hair[0],
                zIndex: 30,
                variants: externalManifest.categories.hair
            });
        }

        // World-specific clothing based on archetype
        const worldClothing = getWorldClothingForArchetype(archetype, externalManifest);
        if (worldClothing) {
            layers.push({
                category: worldClothing.category as AssetLayer['category'],
                path: worldClothing.path,
                zIndex: 20
            });
        }

        // Weapons and accessories (archetype-specific)
        const archetypeAssets = getArchetypeAssets(archetype, externalManifest);
        layers.push(...archetypeAssets);

        // Sort and render
        const sortedLayers = layers.sort((a, b) => a.zIndex - b.zIndex);
        return await renderLayers(sortedLayers);

    } catch (error) {
        console.error('Error loading from external manifest:', error);
        // Fall back to internal manifest
        return loadLayeredPortrait(species, archetype);
    }
}

// Helper function to determine world-specific clothing category
function getWorldClothingForArchetype(archetype: string, manifest: any): { category: string, path: string } | null {
    // Map archetypes to worlds
    const verdanceClasses = ['Greenwarden', 'Thorn Knight', 'Sapling Adept', 'Bloomcaller'];
    const ashenreachClasses = ['Ashblade', 'Cinder Mystic', 'Dust Ranger', 'Bonechanter'];
    const skyvaultClasses = ['Stormcaller', 'Voidwing', 'Sky Knight', 'Wind Sage'];

    let world = '';
    if (verdanceClasses.includes(archetype)) world = 'verdance';
    else if (ashenreachClasses.includes(archetype)) world = 'ashenreach';
    else if (skyvaultClasses.includes(archetype)) world = 'skyvault';

    if (!world) return null;

    const clothingCategory = `clothing/${world}`;
    if (manifest.categories.clothing && manifest.categories.clothing[world]) {
        const archetypeClothing = manifest.categories.clothing[world].find((item: any) =>
            item.includes((archetype || 'warrior').toLowerCase().replace(' ', '_'))
        );
        if (archetypeClothing) {
            return {
                category: clothingCategory,
                path: archetypeClothing
            };
        }
    }

    return null;
}

// Helper function to get archetype-specific weapons and accessories
function getArchetypeAssets(archetype: string, manifest: any): AssetLayer[] {
    const layers: AssetLayer[] = [];

    // Add weapons
    if (manifest.categories.weapons) {
        const weapon = manifest.categories.weapons.find((w: string) =>
            w.includes((archetype || 'warrior').toLowerCase().replace(' ', '_'))
        );
        if (weapon) {
            layers.push({
                category: 'weapons',
                path: weapon,
                zIndex: 50,
                optional: true
            });
        }
    }

    // Add accessories  
    if (manifest.categories.accessories) {
        const accessory = manifest.categories.accessories.find((a: string) =>
            a.includes((archetype || 'warrior').toLowerCase().replace(' ', '_'))
        );
        if (accessory) {
            layers.push({
                category: 'accessories',
                path: accessory,
                zIndex: 35,
                optional: true
            });
        }
    }

    // Add effects
    if (manifest.categories.effects) {
        const effect = manifest.categories.effects.find((e: string) =>
            e.includes((archetype || 'warrior').toLowerCase().replace(' ', '_'))
        );
        if (effect) {
            layers.push({
                category: 'effects',
                path: effect,
                zIndex: 60,
                optional: true
            });
        }
    }

    return layers;
}

// Helper function to render layers into final SVG
async function renderLayers(layers: AssetLayer[]): Promise<string> {
    let svgElements = '';

    for (const layer of layers) {
        try {
            const publicUrl = process.env.PUBLIC_URL || '';
            const basePath = publicUrl.replace(/\/+$/, '');
            const svgPath = new URL(`${basePath}/assets/portraits/${layer.path}`, window.location.origin).toString();
            const response = await fetch(svgPath, { cache: 'no-store' });

            if (!response.ok) {
                console.warn(`Failed to load asset: ${svgPath}`);
                continue;
            }

            const svgContent = await response.text();
            const match = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);  // Fixed regex flag
            if (match) {
                svgElements += match[1];
            }
        } catch (error) {
            console.warn(`Error loading layer ${layer.path}:`, error);
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
        ${svgElements}
    </svg>`;
}

// Get available variants for a layer
export function getLayerVariants(species: string, archetype: string, category: string): string[] {
    const layers = getAssetLayers(species, archetype);
    const layer = layers.find(l => l.category === category);
    return layer?.variants || [layer?.path || ''];
}

// Enhanced preset system integration
export interface PresetDefinition {
    id: string;
    label: string;
    tags: string[];
    species: string;
    world: string;
    archetype: string;
    gender: string;
    layers: string[];
}

// Load presets from external presets.json
export async function loadPresets(): Promise<PresetDefinition[]> {
    try {
        // Use bullet-proof URL construction with PUBLIC_URL support
        const publicUrl = process.env.PUBLIC_URL || '';
        const basePath = publicUrl.replace(/\/+$/, '');
        const url = new URL(`${basePath}/assets/portraits/presets.json`, window.location.origin).toString();
        console.log('� Fetching presets from:', url);
        const response = await fetch(url, { cache: 'no-store' });

        console.log('📡 Presets response status:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        console.log('📄 Presets response preview:', text.substring(0, 100));

        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
            throw new Error('Received HTML instead of JSON - possible routing issue');
        }

        const presetData = JSON.parse(text);
        // console.log('✅ Presets loaded successfully:', presetData.count, 'presets');
        return presetData.presets || [];
    } catch (error) {
        // Silently fail for missing presets - this is expected during development
        // console.warn('Failed to load presets:', error);
        return [];
    }
}

// Get preset by ID
export async function getPreset(presetId: string): Promise<PresetDefinition | null> {
    const presets = await loadPresets();
    return presets.find(p => p.id === presetId) || null;
}

// Get presets filtered by criteria
export async function getPresetsByFilter(filter: {
    species?: string;
    world?: string;
    archetype?: string;
    gender?: string;
}): Promise<PresetDefinition[]> {
    const presets = await loadPresets();
    return presets.filter(preset => {
        return (!filter.species || preset.species === filter.species) &&
            (!filter.world || preset.world === filter.world) &&
            (!filter.archetype || preset.archetype === filter.archetype) &&
            (!filter.gender || preset.gender === filter.gender);
    });
}

// Convert preset layers to AssetLayer format
export function presetToAssetLayers(preset: PresetDefinition): AssetLayer[] {
    const zIndexMap: Record<string, number> = {
        'base': 1,
        'face/eyes': 15,
        'face/brows': 16,
        'face/mouth': 17,
        'hair': 30,
        'facial_hair': 25,
        'clothing': 20,
        'accessories': 35,
        'weapons': 50,
        'effects': 60
    };

    return preset.layers.map((layerPath, index) => {
        // Determine category from path
        const category = layerPath.split('/')[0] as AssetLayer['category'];
        const fullCategory = layerPath.includes('/') ?
            layerPath.split('/').slice(0, 2).join('/') as AssetLayer['category'] :
            category;

        return {
            category: fullCategory,
            path: layerPath,
            zIndex: zIndexMap[category] || (10 + index),
            optional: !['base'].includes(category)
        };
    }).sort((a, b) => a.zIndex - b.zIndex);
}

// Load portrait using preset system
export async function loadPortraitFromPreset(presetId: string): Promise<string> {
    try {
        const preset = await getPreset(presetId);
        if (!preset) {
            throw new Error(`Preset not found: ${presetId}`);
        }

        console.log(`🎭 Loading portrait from preset: ${preset.label}`);
        const layers = presetToAssetLayers(preset);
        return await renderLayers(layers);

    } catch (error) {
        console.error('Error loading preset:', error);
        // Fallback to external manifest
        return loadPortraitFromExternalManifest(
            presetId.split('_')[0] || 'Human',
            presetId.split('_')[2] || 'Greenwarden'
        );
    }
}