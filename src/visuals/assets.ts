// Visual Asset Management System
// Handles loading, caching, and organizing visual assets for character generation

import { VisualAsset } from './types';

interface AssetManifest {
    version: string;
    lastUpdated: string;
    assets: VisualAsset[];
    categories: string[];
    species: string[];
    archetypes: string[];
}

class VisualAssetManager {
    private assets: Map<string, VisualAsset> = new Map();
    private manifest: AssetManifest | null = null;
    private loadingPromise: Promise<void> | null = null;

    /**
     * Initialize the asset system by loading the manifest
     */
    async initialize(): Promise<void> {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.loadManifest();
        return this.loadingPromise;
    }

    /**
     * Load the asset manifest from public/assets/portraits/manifest.json
     */
    private async loadManifest(): Promise<void> {
        try {
            // Use process.env.PUBLIC_URL to handle GitHub Pages deployment path
            const basePath = process.env.PUBLIC_URL || '';
            const manifestUrl = `${basePath}/assets/portraits/manifest.json`;

            console.log('Loading portrait manifest from:', manifestUrl);
            const response = await fetch(manifestUrl);
            if (!response.ok) {
                console.warn('Portrait manifest not found, using empty asset system');
                this.initializeEmptyManifest();
                return;
            }

            this.manifest = await response.json();
            console.log('Portrait manifest loaded:', this.manifest);
            this.indexAssets();
        } catch (error) {
            console.warn('Failed to load portrait manifest:', error);
            this.initializeEmptyManifest();
        }
    }

    /**
     * Initialize with empty manifest for development
     */
    private initializeEmptyManifest(): void {
        this.manifest = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            assets: [],
            categories: ['base', 'hair', 'eyes', 'clothing', 'accessories'],
            species: ['Human', 'Sylvanborn', 'Nightborn', 'Stormcaller', 'Crystalborn', 'Draketh', 'Alloy', 'Voidkin'],
            archetypes: ['Warrior', 'Scout', 'Mage', 'Guardian', 'Ranger', 'Rogue', 'Artificer', 'Thorn Knight', 'Ashblade', 'Ironclad', 'Stormbreaker', 'Voidhunter', 'Crystal Guardian', 'Greenwarden']
        };
    }

    /**
     * Index assets for quick lookup
     */
    private indexAssets(): void {
        if (!this.manifest) return;

        this.assets.clear();
        for (const asset of this.manifest.assets) {
            this.assets.set(asset.id, asset);
        }
    }

    /**
     * Get assets by category
     */
    getAssetsByCategory(category: string): VisualAsset[] {
        return Array.from(this.assets.values()).filter(asset => asset.category === category);
    }

    /**
     * Get assets for specific species
     */
    getAssetsForSpecies(species: string): VisualAsset[] {
        return Array.from(this.assets.values()).filter(asset =>
            !asset.species || asset.species.includes(species)
        );
    }

    /**
     * Get assets for specific archetype
     */
    getAssetsForArchetype(archetype: string): VisualAsset[] {
        return Array.from(this.assets.values()).filter(asset =>
            !asset.archetype || asset.archetype.includes(archetype)
        );
    }

    /**
     * Get filtered assets
     */
    getFilteredAssets(filters: {
        category?: string;
        species?: string;
        archetype?: string;
        tags?: string[];
    }): VisualAsset[] {
        return Array.from(this.assets.values()).filter(asset => {
            if (filters.category && asset.category !== filters.category) return false;
            if (filters.species && asset.species && !asset.species.includes(filters.species)) return false;
            if (filters.archetype && asset.archetype && !asset.archetype.includes(filters.archetype)) return false;
            if (filters.tags && asset.tags) {
                const hasAnyTag = filters.tags.some(tag => asset.tags!.includes(tag));
                if (!hasAnyTag) return false;
            }
            return true;
        });
    }

    /**
     * Get asset by ID
     */
    getAsset(id: string): VisualAsset | undefined {
        return this.assets.get(id);
    }

    /**
     * Get full URL for an asset
     */
    getAssetUrl(asset: VisualAsset): string {
        const basePath = process.env.PUBLIC_URL || '';
        const fullUrl = `${basePath}/assets/portraits/${asset.path}`;
        // console.log('🔍 ASSET URL: PUBLIC_URL =', process.env.PUBLIC_URL, '→ Full URL =', fullUrl);
        return fullUrl;
    }

    /**
     * Load asset content (SVG, image, etc.)
     */
    async loadAssetContent(asset: VisualAsset): Promise<string> {
        try {
            const url = this.getAssetUrl(asset);
            // console.log('🔍 ASSET MANAGER: Loading asset content from:', url);
            // console.log('🔍 ASSET MANAGER: Asset object:', asset);
            const response = await fetch(url);
            // console.log('🔍 ASSET MANAGER: Response status:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`Failed to load asset: ${response.status} ${response.statusText}`);
            }
            const content = await response.text();
            // console.log('🔍 ASSET MANAGER: Content loaded, length:', content.length);
            return content;
        } catch (error) {
            console.error(`💥 ASSET MANAGER: Failed to load asset ${asset.id}:`, error);
            return ''; // Return empty string as fallback
        }
    }

    /**
     * Get available categories
     */
    getCategories(): string[] {
        return this.manifest?.categories || [];
    }

    /**
     * Get supported species
     */
    getSupportedSpecies(): string[] {
        return this.manifest?.species || [];
    }

    /**
     * Get supported archetypes
     */
    getSupportedArchetypes(): string[] {
        return this.manifest?.archetypes || [];
    }

    /**
     * Check if assets are loaded
     */
    isLoaded(): boolean {
        return this.manifest !== null;
    }

    /**
     * Get asset statistics
     */
    getStats() {
        return {
            totalAssets: this.assets.size,
            categories: this.getCategories().length,
            species: this.getSupportedSpecies().length,
            archetypes: this.getSupportedArchetypes().length,
            version: this.manifest?.version || 'unknown'
        };
    }
}

// Singleton instance
export const assetManager = new VisualAssetManager();

// Utility functions
export async function ensureAssetsLoaded(): Promise<void> {
    await assetManager.initialize();
}

export function getAssetUrl(path: string): string {
    return `/assets/portraits/${path}`;
}

// Get portrait assets organized by species and archetypes
export async function getPortraitAssets(): Promise<any> {
    await ensureAssetsLoaded();

    const species = assetManager.getSupportedSpecies();
    const result: any = {};

    for (const speciesName of species) {
        result[speciesName] = {
            archetypes: {}
        };

        // Get assets for this species
        const speciesAssets = assetManager.getFilteredAssets({ species: speciesName });

        // Group by archetypes if available
        for (const asset of speciesAssets) {
            if (asset.archetype && asset.archetype.length > 0) {
                for (const archetype of asset.archetype) {
                    if (!result[speciesName].archetypes[archetype]) {
                        result[speciesName].archetypes[archetype] = [];
                    }
                    result[speciesName].archetypes[archetype].push(asset);
                }
            }
        }
    }

    return result;
}

// Fallback chain for species
export function getFallbackSpecies(species: string): string | null {
    // Define fallback chains for your actual game species
    const fallbacks: Record<string, string[]> = {
        'Sylvanborn': ['Human'], // Nature-based -> Human
        'Nightborn': ['Human'],  // Shadow-based -> Human  
        'Stormcaller': ['Human'], // Storm-based -> Human
        'Crystalborn': ['Human'], // Crystal-based -> Human
        'Draketh': ['Human'],     // Dragon-like -> Human
        'Alloy': ['Human'],       // Mechanical -> Human
        'Voidkin': ['Nightborn', 'Human'], // Void -> Shadow -> Human
    };

    // Try the direct fallbacks
    if (species in fallbacks) {
        for (const fallback of fallbacks[species]) {
            return fallback; // Return the first fallback
        }
    }

    // Default fallback for all species
    return 'Human';
}

// Fallback chain for archetypes
export function getFallbackArchetype(species: string, archetype: string): string | null {
    // Define fallback chains for your actual archetypes
    const fallbacks: Record<string, Record<string, string[]>> = {
        'Human': {
            'Thorn Knight': ['Guardian', 'Warrior'],
            'Ashblade': ['Warrior', 'Rogue'],
            'Ironclad': ['Guardian', 'Warrior'],
            'Stormbreaker': ['Warrior', 'Mage'],
            'Voidhunter': ['Scout', 'Ranger'],
            'Crystal Guardian': ['Guardian', 'Mage'],
            'Greenwarden': ['Ranger', 'Scout'],
        },
        // Add more species-specific fallbacks
    };

    // Try species-specific archetype fallbacks
    if (species in fallbacks && archetype in fallbacks[species]) {
        for (const fallback of fallbacks[species][archetype]) {
            return fallback; // Return the first fallback
        }
    }

    // General archetype fallbacks using your actual archetypes
    const generalFallbacks: Record<string, string[]> = {
        'Thorn Knight': ['Guardian', 'Warrior'],
        'Ashblade': ['Warrior', 'Rogue'],
        'Ironclad': ['Guardian', 'Warrior'],
        'Stormbreaker': ['Warrior', 'Mage'],
        'Voidhunter': ['Scout', 'Ranger'],
        'Crystal Guardian': ['Guardian', 'Mage'],
        'Greenwarden': ['Ranger', 'Scout'],
        'Warrior': ['Guardian', 'Scout'],
        'Scout': ['Ranger', 'Warrior'],
        'Mage': ['Guardian', 'Warrior'],
        'Guardian': ['Warrior', 'Scout'],
        'Ranger': ['Scout', 'Warrior'],
        'Rogue': ['Scout', 'Warrior'],
        'Artificer': ['Mage', 'Guardian'],
    };

    if (archetype in generalFallbacks) {
        for (const fallback of generalFallbacks[archetype]) {
            return fallback; // Return the first fallback
        }
    }

    return null;
}